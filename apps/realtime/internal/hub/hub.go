package hub

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"

	"github.com/getsentry/sentry-go"
	"github.com/gorilla/websocket"
	"github.com/rs/zerolog/log"

	"github.com/Ayazaga-Boys/rollpit/apps/realtime/internal/auth"
	"github.com/Ayazaga-Boys/rollpit/apps/realtime/internal/config"
	"github.com/Ayazaga-Boys/rollpit/apps/realtime/internal/location"
	"github.com/Ayazaga-Boys/rollpit/apps/realtime/internal/metrics"
)

const helpEventKRing = 2

type helpEventRequest struct {
	Type          string   `json:"type"`
	HelpRequestID string   `json:"help_request_id"`
	H3Cell        string   `json:"h3_cell"`
	RequesterID   string   `json:"requester_id"`
	HelperID      string   `json:"helper_id,omitempty"`
	IssueType     string   `json:"issue_type,omitempty"`
	TargetType    string   `json:"target_type,omitempty"` // "nearby" | "followers" | "group"
	TargetIDs     []string `json:"target_ids,omitempty"`  // backend'in hesapladığı hedef kullanıcı listesi
	Urgency       string   `json:"urgency,omitempty"`     // "critical" | "urgent" | "request"
}

type socialEventRequest struct {
	Type        string `json:"type"`      // "story_posted" | "post_liked" | "post_commented"
	AuthorID    string `json:"author_id"` // story: yazar; post: post sahibi
	StoryID     string `json:"story_id,omitempty"`
	PostID      string `json:"post_id,omitempty"`
	LikerID     string `json:"liker_id,omitempty"`
	CommenterID string `json:"commenter_id,omitempty"`
}

type contentRemovedRequest struct {
	ContentType string `json:"content_type"` // "post" | "story" | "comment"
	ContentID   string `json:"content_id"`   // silinen içeriğin UUID'si
	ActorID     string `json:"actor_id"`     // admin kullanıcı ID'si (audit için)
	AuthorID    string `json:"author_id"`    // içerik sahibi — bu kullanıcıya bildirim gönderilir
}

func newUpgrader(cfg *config.Config) websocket.Upgrader {
	return websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			if cfg.IsDev {
				return true // Geliştirme ortamında her origin kabul
			}
			origin := r.Header.Get("Origin")
			if origin == "" {
				return true // Native mobile clients may omit Origin.
			}
			for _, allowed := range cfg.AllowedOrigins {
				if allowed == origin {
					return true
				}
			}
			return false
		},
	}
}

// Hub — tüm aktif WS bağlantılarını yönetir
type Hub struct {
	cfg         *config.Config
	upgrader    websocket.Upgrader
	store       location.CellStore
	broadcaster *location.Broadcaster
	clients     map[string]*Client // userID → Client
	mu          sync.RWMutex
	register    chan *Client
	unregister  chan *Client
}

func New(cfg *config.Config, store location.CellStore, bc *location.Broadcaster) *Hub {
	return &Hub{
		cfg:         cfg,
		upgrader:    newUpgrader(cfg),
		store:       store,
		broadcaster: bc,
		clients:     make(map[string]*Client),
		register:    make(chan *Client, 64),
		unregister:  make(chan *Client, 64),
	}
}

func (h *Hub) Run(ctx context.Context) {
	defer func() {
		if r := recover(); r != nil {
			sentry.CaptureException(fmt.Errorf("hub panic: %v", r))
			log.Error().Interface("panic", r).Msg("hub_panic_recovered")
		}
	}()
	for {
		select {
		case <-ctx.Done():
			h.mu.Lock()
			for _, c := range h.clients {
				close(c.send)
			}
			h.mu.Unlock()
			log.Info().Msg("hub_shutdown")
			return

		case c := <-h.register:
			h.mu.Lock()
			h.clients[c.userID] = c
			h.mu.Unlock()
			metrics.WsConnectionsTotal.Inc()
			metrics.WsActiveConnections.Inc()
			h.SendPresenceUpdateToUserSubscribers(c.userID, "online")
			log.Info().Str("userID", c.userID).Int("total", len(h.clients)).Msg("client_connected")

		case c := <-h.unregister:
			removed := false
			h.mu.Lock()
			if _, ok := h.clients[c.userID]; ok {
				delete(h.clients, c.userID)
				close(c.send)
				_ = h.store.DeleteUserCell(context.Background(), c.userID)
				metrics.WsActiveConnections.Dec()
				removed = true
			}
			h.mu.Unlock()
			if removed {
				h.SendPresenceUpdateToUserSubscribers(c.userID, "offline")
			}
			log.Info().Str("userID", c.userID).Int("total", len(h.clients)).Msg("client_disconnected")
		}
	}
}

// ServeWS — JWT doğrular, WebSocket'e yükseltir
func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	userID, err := auth.VerifySupabaseJWT(token, h.cfg.SupabaseJWTSecret)
	if err != nil {
		log.Warn().Err(err).Msg("ws_auth_failed")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Error().Err(err).Msg("ws_upgrade_failed")
		return
	}

	c := &Client{
		hub:               h,
		conn:              conn,
		userID:            userID,
		send:              make(chan []byte, sendBufferSize),
		subscriptions:     make(map[string]int),
		userSubscriptions: make(map[string]struct{}),
	}
	h.register <- c
	go c.writePump()
	go c.readPump()
}

func (h *Hub) ServeHelpEvent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
	if h.cfg.InternalSecret == "" {
		http.Error(w, "Internal secret not configured", http.StatusServiceUnavailable)
		return
	}
	if r.Header.Get("Authorization") != "Bearer "+h.cfg.InternalSecret {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var event helpEventRequest
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}
	if !event.isValid() {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	urgency := event.Urgency
	if urgency == "" {
		urgency = UrgencyUrgent
	}
	targetType := event.TargetType
	if targetType == "" {
		targetType = HelpTargetNearby
	}

	outType := TypeHelpNearby
	if targetType != HelpTargetNearby {
		outType = TypeHelpTargeted
	}

	payload := OutboundMessage{
		Type:       outType,
		HelpID:     event.HelpRequestID,
		H3Cell:     event.H3Cell,
		Urgency:    urgency,
		TargetType: targetType,
		IssueType:  event.IssueType,
	}
	switch event.Type {
	case TypeHelpCreated:
		payload.UserID = event.RequesterID
	case TypeHelpAssigned:
		payload.UserID = event.HelperID
	}

	msg, err := json.Marshal(payload)
	if err != nil {
		log.Error().Err(err).Msg("help_event_marshal_failed")
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	switch targetType {
	case HelpTargetNearby:
		h.SendToSubscribersWithK(event.H3Cell, helpEventKRing, msg)
	case HelpTargetFollowers, HelpTargetGroup:
		// Backend hangi kullanıcıların bildirim alacağını hesaplar ve target_ids ile gönderir
		for _, uid := range event.TargetIDs {
			h.SendToUser(uid, msg)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	_, _ = w.Write([]byte(`{"ok":true}`))
}

// ServeSocialEvent — backend'den gelen story/post event'lerini ilgili kullanıcılara iletir
func (h *Hub) ServeSocialEvent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
	if h.cfg.InternalSecret == "" {
		http.Error(w, "Internal secret not configured", http.StatusServiceUnavailable)
		return
	}
	if r.Header.Get("Authorization") != "Bearer "+h.cfg.InternalSecret {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var event socialEventRequest
	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}
	if !event.isValid() {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	switch event.Type {
	case TypeStoryPosted:
		// Yazarı takip eden çevrimiçi kullanıcılara yayınla
		payload := OutboundMessage{
			Type:    TypeStoryPosted,
			UserID:  event.AuthorID,
			StoryID: event.StoryID,
		}
		h.SendToUserSubscribers(event.AuthorID, payload)

	case TypePostLiked:
		// Sadece post sahibine gönder
		payload := OutboundMessage{
			Type:    TypePostLiked,
			PostID:  event.PostID,
			LikerID: event.LikerID,
		}
		msg, _ := json.Marshal(payload)
		h.SendToUser(event.AuthorID, msg)

	case TypePostCommented:
		// Sadece post sahibine gönder
		payload := OutboundMessage{
			Type:        TypePostCommented,
			PostID:      event.PostID,
			CommenterID: event.CommenterID,
		}
		msg, _ := json.Marshal(payload)
		h.SendToUser(event.AuthorID, msg)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	_, _ = w.Write([]byte(`{"ok":true}`))
}

func (e socialEventRequest) isValid() bool {
	switch e.Type {
	case TypeStoryPosted:
		return e.AuthorID != "" && e.StoryID != ""
	case TypePostLiked:
		return e.AuthorID != "" && e.PostID != "" && e.LikerID != ""
	case TypePostCommented:
		return e.AuthorID != "" && e.PostID != "" && e.CommenterID != ""
	default:
		return false
	}
}

// SendToUser — belirli bir kullanıcıya mesaj gönder
func (h *Hub) SendToUser(userID string, msg []byte) {
	h.mu.RLock()
	c, ok := h.clients[userID]
	h.mu.RUnlock()
	if !ok {
		return
	}
	select {
	case c.send <- msg:
	default:
		log.Warn().Str("userID", userID).Msg("send_buffer_full")
	}
}

// SendToAll — tüm bağlı kullanıcılara mesaj yayınla (heatmap broadcast)
func (h *Hub) SendToAll(msg []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for userID, c := range h.clients {
		select {
		case c.send <- msg:
		default:
			log.Warn().Str("userID", userID).Msg("send_buffer_full_broadcast")
		}
	}
}

// SendToSubscribers — yalnızca güncellenen hücreyle aynı heatmap bölgesine abone client'lara yayınlar.
func (h *Hub) SendToSubscribers(h3Cell string, msg []byte) {
	h.SendToSubscribersWithK(h3Cell, 0, msg)
}

func (h *Hub) SendToSubscribersWithK(h3Cell string, minK int, msg []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for userID, c := range h.clients {
		if !c.isInterestedInWithMinK(h3Cell, minK) {
			continue
		}
		select {
		case c.send <- msg:
		default:
			log.Warn().Str("userID", userID).Msg("send_buffer_full_subscribers")
		}
	}
}

func (h *Hub) SendPresenceSnapshot(c *Client, targetUserID string) {
	status := "offline"
	h.mu.RLock()
	if _, ok := h.clients[targetUserID]; ok {
		status = "online"
	}
	h.mu.RUnlock()

	payload := OutboundMessage{
		Type:   TypePresenceUpdate,
		UserID: targetUserID,
		Status: status,
	}
	h.sendOutboundToClient(c, payload)
}

func (h *Hub) SendPresenceUpdateToUserSubscribers(targetUserID, status string) {
	payload := OutboundMessage{
		Type:   TypePresenceUpdate,
		UserID: targetUserID,
		Status: status,
	}
	h.SendToUserSubscribers(targetUserID, payload)
}

func (h *Hub) SendLocationShareToUserSubscribers(targetUserID, h3Cell string) {
	payload := OutboundMessage{
		Type:   TypeLocationShare,
		UserID: targetUserID,
		H3Cell: h3Cell,
	}
	h.SendToUserSubscribers(targetUserID, payload)
}

func (h *Hub) SendToUserSubscribers(targetUserID string, payload OutboundMessage) {
	msg, err := json.Marshal(payload)
	if err != nil {
		log.Error().Err(err).Str("targetUserID", targetUserID).Msg("user_subscriber_marshal_failed")
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()
	for userID, c := range h.clients {
		if userID == targetUserID || !c.followsUser(targetUserID) {
			continue
		}
		select {
		case c.send <- msg:
		default:
			log.Warn().Str("userID", userID).Str("targetUserID", targetUserID).Msg("send_buffer_full_user_subscriber")
		}
	}
}

func (h *Hub) sendOutboundToClient(c *Client, payload OutboundMessage) {
	msg, err := json.Marshal(payload)
	if err != nil {
		log.Error().Err(err).Str("userID", c.userID).Msg("outbound_marshal_failed")
		return
	}
	select {
	case c.send <- msg:
	default:
		log.Warn().Str("userID", c.userID).Msg("send_buffer_full")
	}
}

func (e helpEventRequest) isValid() bool {
	switch e.Type {
	case TypeHelpCreated:
		return e.HelpRequestID != "" &&
			e.RequesterID != "" &&
			isValidH3Cell(e.H3Cell)
	case TypeHelpAssigned:
		return e.HelpRequestID != "" &&
			e.RequesterID != "" &&
			e.HelperID != "" &&
			isValidH3Cell(e.H3Cell)
	default:
		return false
	}
}

// ServeH3Aggregate — mevcut heatmap snapshot'ını res-7'ye katlar ve döner
// GET /internal/realtime/h3-aggregate
func (h *Hub) ServeH3Aggregate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
	if h.cfg.InternalSecret == "" {
		http.Error(w, "Internal secret not configured", http.StatusServiceUnavailable)
		return
	}
	if r.Header.Get("Authorization") != "Bearer "+h.cfg.InternalSecret {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	rawCounts := h.store.GetCellCounts(r.Context())
	aggregated, err := location.AggregateCellCountsToClusterResolution(rawCounts)
	if err != nil {
		log.Error().Err(err).Msg("h3_aggregate_failed")
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	out, err := json.Marshal(map[string]any{"cells": aggregated})
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_, _ = w.Write(out)
}

// ServeContentRemovedEvent — admin moderation silme/geri alma aksiyonlarını içerik sahibine iletir
func (h *Hub) ServeContentRemovedEvent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
	if h.cfg.InternalSecret == "" {
		http.Error(w, "Internal secret not configured", http.StatusServiceUnavailable)
		return
	}
	if r.Header.Get("Authorization") != "Bearer "+h.cfg.InternalSecret {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req contentRemovedRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}
	valid := req.ContentID != "" && req.AuthorID != "" &&
		(req.ContentType == ContentTypePost || req.ContentType == ContentTypeStory || req.ContentType == ContentTypeComment)
	if !valid {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	// Sadece içerik sahibine bildir — admin silmesini gerçek zamanlı UI'a yansıt
	payload := OutboundMessage{
		Type:        TypeContentRemoved,
		ContentType: req.ContentType,
		ContentID:   req.ContentID,
	}
	msg, err := json.Marshal(payload)
	if err != nil {
		log.Error().Err(err).Msg("content_removed_marshal_failed")
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	h.SendToUser(req.AuthorID, msg)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	_, _ = w.Write([]byte(`{"ok":true}`))
}

// ActiveCount — anlık bağlı kullanıcı sayısı (Prometheus için)
func (h *Hub) ActiveCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}
