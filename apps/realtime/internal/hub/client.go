package hub

import (
	"context"
	"encoding/json"
	"time"

	"github.com/gorilla/websocket"
	"github.com/rs/zerolog/log"

	"github.com/Ayazaga-Boys/pitlane/apps/realtime/internal/metrics"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512
	sendBufferSize = 256
)

// Client — tek bir WebSocket bağlantısı
type Client struct {
	hub    *Hub
	conn   *websocket.Conn
	userID string
	send   chan []byte
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
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
		if msg.H3Cell == "" {
			c.sendError("BAD_PAYLOAD", "h3_cell missing")
			return
		}
		if err := c.hub.store.SetUserCell(ctx, c.userID, msg.H3Cell); err != nil {
			log.Error().Err(err).Str("userID", c.userID).Msg("set_user_cell_failed")
			return
		}
		c.hub.broadcaster.OnCellUpdate(ctx, c.userID, msg.H3Cell, c.hub)

	case TypeGhostOn:
		_ = c.hub.store.DeleteUserCell(ctx, c.userID)
		log.Debug().Str("userID", c.userID).Msg("ghost_on")

	case TypeGhostOff:
		log.Debug().Str("userID", c.userID).Msg("ghost_off")

	default:
		log.Debug().Str("type", msg.Type).Msg("unknown_message_type")
	}
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
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
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
