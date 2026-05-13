package hub

import (
	"context"
	"encoding/json"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/rs/zerolog/log"

	"github.com/Ayazaga-Boys/rollpit/apps/realtime/internal/metrics"
)

// h3CellLen — geçerli H3 hücre string uzunluğu (15 hex char = 60 bit)
const h3CellLen = 15

// isValidH3Cell — gelen h3_cell değerinin format kontrolü (güvenlik sınırı)
func isValidH3Cell(s string) bool {
	if len(s) != h3CellLen {
		return false
	}
	for _, c := range s {
		if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f')) {
			return false
		}
	}
	return true
}

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512
	sendBufferSize = 256
)

// Client — tek bir WebSocket bağlantısı
type Client struct {
	hub           *Hub
	conn          *websocket.Conn
	userID        string
	send          chan []byte
	subscriptions map[string]int
	mu            sync.RWMutex
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		_ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	// Flood koruması
	msgCount := 0
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()

	for {
		_, raw, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Warn().Err(err).Str("userID", c.userID).Msg("ws_read_error")
			}
			return
		}

		select {
		case <-ticker.C:
			msgCount = 0
		default:
		}
		msgCount++
		if msgCount > maxMsgPerSecond {
			log.Warn().Str("userID", c.userID).Msg("flood_detected")
			c.sendError("RATE_LIMITED", "Too many messages")
			return
		}

		var msg InboundMessage
		if err := json.Unmarshal(raw, &msg); err != nil {
			continue
		}
		metrics.WsMessagesTotal.WithLabelValues(msg.Type).Inc()
		c.handleMessage(msg)
	}
}

func (c *Client) handleMessage(msg InboundMessage) {
	ctx := context.Background()
	switch msg.Type {
	case TypeLocation:
		if !isValidH3Cell(msg.H3Cell) {
			c.sendError("BAD_PAYLOAD", "h3_cell invalid")
			return
		}
		if err := c.hub.store.SetUserCell(ctx, c.userID, msg.H3Cell); err != nil {
			log.Error().Err(err).Str("userID", c.userID).Msg("set_user_cell_failed")
			return
		}
		c.hub.broadcaster.OnCellUpdate(ctx, c.userID, msg.H3Cell, c.hub)

	case TypeGhostOn:
		_ = c.hub.store.DeleteUserCell(ctx, c.userID)
		c.clearSubscriptions()
		log.Debug().Str("userID", c.userID).Msg("ghost_on")

	case TypeGhostOff:
		log.Debug().Str("userID", c.userID).Msg("ghost_off")

	case TypeSubscribeCell:
		if !isValidH3Cell(msg.H3Cell) {
			c.sendError("BAD_PAYLOAD", "h3_cell invalid")
			return
		}
		c.subscribeCell(msg.H3Cell, msg.K)
		log.Debug().Str("userID", c.userID).Str("h3Cell", msg.H3Cell).Int("k", msg.K).Msg("cell_subscribed")

	case TypeUnsubscribeCell:
		if !isValidH3Cell(msg.H3Cell) {
			c.sendError("BAD_PAYLOAD", "h3_cell invalid")
			return
		}
		c.unsubscribeCell(msg.H3Cell)
		log.Debug().Str("userID", c.userID).Str("h3Cell", msg.H3Cell).Msg("cell_unsubscribed")

	default:
		log.Debug().Str("type", msg.Type).Msg("unknown_message_type")
	}
}

func (c *Client) subscribeCell(h3Cell string, k int) {
	if k < 0 {
		k = 0
	}
	c.mu.Lock()
	if c.subscriptions == nil {
		c.subscriptions = make(map[string]int)
	}
	c.subscriptions[h3Cell] = k
	c.mu.Unlock()
}

func (c *Client) unsubscribeCell(h3Cell string) {
	c.mu.Lock()
	delete(c.subscriptions, h3Cell)
	c.mu.Unlock()
}

func (c *Client) clearSubscriptions() {
	c.mu.Lock()
	c.subscriptions = nil
	c.mu.Unlock()
}

func (c *Client) isInterestedIn(h3Cell string) bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	for subscribedCell, k := range c.subscriptions {
		if cellWithinKRing(subscribedCell, h3Cell, k) {
			return true
		}
	}
	return false
}

func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case msg, ok := <-c.send:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				log.Warn().Err(err).Str("userID", c.userID).Msg("ws_write_error")
				return
			}

		case <-ticker.C:
			_ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				log.Warn().Err(err).Str("userID", c.userID).Msg("ws_ping_error")
				return
			}
		}
	}
}

func (c *Client) sendError(code, message string) {
	payload := OutboundMessage{Type: TypeError, Code: code, Message: message}
	b, _ := json.Marshal(payload)
	select {
	case c.send <- b:
	default:
	}
}
