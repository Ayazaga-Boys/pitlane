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
	Type          string `json:"type"`
	HelpRequestID string `json:"help_request_id"`
	H3Cell        string `json:"h3_cell"`
	RequesterID   string `json:"requester_id"`
	HelperID      string `json:"helper_id,omitempty"`
	IssueType     string `json:"issue_type,omitempty"`
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
			log.Info().Str("userID", c.userID).Int("total", len(h.clients)).Msg("client_connected")

		case c := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[c.userID]; ok {
				delete(h.clients, c.userID)
				close(c.send)
				_ = h.store.DeleteUserCell(context.Background(), c.userID)
				metrics.WsActiveConnections.Dec()
			}
			h.mu.Unlock()
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
		hub:           h,
		conn:          conn,
		userID:        userID,
		send:          make(chan []byte, sendBufferSize),
		subscriptions: make(map[string]int),
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

	payload := OutboundMessage{
		Type:   TypeHelpNearby,
		HelpID: event.HelpRequestID,
		H3Cell: event.H3Cell,
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

	h.SendToSubscribersWithK(event.H3Cell, helpEventKRing, msg)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	_, _ = w.Write([]byte(`{"ok":true}`))
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

// ActiveCount — anlık bağlı kullanıcı sayısı (Prometheus için)
func (h *Hub) ActiveCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}
