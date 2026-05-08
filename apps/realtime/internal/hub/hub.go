package hub

import (
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/rs/zerolog/log"

	"github.com/Ayazaga-Boys/pitlane/apps/realtime/internal/auth"
	"github.com/Ayazaga-Boys/pitlane/apps/realtime/internal/config"
	"github.com/Ayazaga-Boys/pitlane/apps/realtime/internal/location"
	"github.com/Ayazaga-Boys/pitlane/apps/realtime/internal/metrics"
)

func newUpgrader(cfg *config.Config) websocket.Upgrader {
	return websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			if cfg.IsDev {
				return true // Geliştirme ortamında her origin kabul
			}
			origin := r.Header.Get("Origin")
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
	store       *location.Store
	broadcaster *location.Broadcaster
	clients     map[string]*Client // userID → Client
	mu          sync.RWMutex
	register    chan *Client
	unregister  chan *Client
}

func New(cfg *config.Config, store *location.Store, bc *location.Broadcaster) *Hub {
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

func (h *Hub) Run() {
	for {
		select {
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
				_ = h.store.DeleteUserCell(nil, c.userID)
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
		hub:    h,
		conn:   conn,
		userID: userID,
		send:   make(chan []byte, sendBufferSize),
	}
	h.register <- c
	go c.writePump()
	go c.readPump()
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

// ActiveCount — anlık bağlı kullanıcı sayısı (Prometheus için)
func (h *Hub) ActiveCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}
