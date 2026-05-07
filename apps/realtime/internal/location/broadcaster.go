package location

import (
	"context"
	"encoding/json"

	"github.com/rs/zerolog/log"
)

// Sender — hub'ın metodlarını soyutlar (döngüsel import önlemek için)
type Sender interface {
	SendToUser(userID string, msg []byte)
	SendToAll(msg []byte)
	ActiveCount() int
}

// Broadcaster — hücre güncellemelerini abonelere yayınlar
type Broadcaster struct {
	store *Store
}

func NewBroadcaster(store *Store) *Broadcaster {
	return &Broadcaster{store: store}
}

// OnCellUpdate — kullanıcı konum güncelleyince çağrılır
func (b *Broadcaster) OnCellUpdate(_ context.Context, userID, h3Cell string, sender Sender) {
	counts := b.store.GetCellCounts(context.Background())

	payload := map[string]any{
		"type":  "heatmap_update",
		"cells": counts,
	}

	msg, err := json.Marshal(payload)
	if err != nil {
		log.Error().Err(err).Msg("broadcast_marshal_failed")
		return
	}

	// Tüm bağlı kullanıcılara yayınla
	sender.SendToAll(msg)
	log.Debug().
		Str("userID", userID).
		Str("h3Cell", h3Cell).
		Int("cellCount", len(counts)).
		Int("activeUsers", sender.ActiveCount()).
		Msg("heatmap_broadcast")
}
