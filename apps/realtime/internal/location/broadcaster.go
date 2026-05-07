package location

import (
	"context"
	"encoding/json"

	"github.com/rs/zerolog/log"
)

// Sender — hub'ın SendToUser metodunu soyutlar (döngüsel import önlemek için)
type Sender interface {
	SendToUser(userID string, msg []byte)
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
	// Heatmap güncellemesini tüm aktif kullanıcılara yayınla
	// Sprint 2'de Valkey Pub/Sub ile replace edilecek
	counts := b.store.GetCellCounts(context.Background())

	payload := map[string]any{
		"type":  "heatmap_update",
		"cells": counts,
	}
	b.broadcast(payload, userID, sender)
}

func (b *Broadcaster) broadcast(payload any, _ string, _ Sender) {
	msg, err := json.Marshal(payload)
	if err != nil {
		log.Error().Err(err).Msg("broadcast_marshal_failed")
		return
	}
	// TODO(sprint2): Valkey PUBLISH → hub abone kullanıcılara iletir
	// Şu an: doğrudan in-process broadcast (tek instance için yeterli)
	_ = msg
}
