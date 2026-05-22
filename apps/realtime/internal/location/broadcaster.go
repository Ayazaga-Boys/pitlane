package location

import (
	"context"
	"encoding/json"
	"sync"
	"time"

	"github.com/rs/zerolog/log"

	"github.com/Ayazaga-Boys/rollpit/apps/realtime/internal/metrics"
)

const broadcastMinInterval = 5 * time.Second

// Sender — hub'ın metodlarını soyutlar (döngüsel import önlemek için)
type Sender interface {
	SendToUser(userID string, msg []byte)
	SendToAll(msg []byte)
	SendToSubscribers(h3Cell string, msg []byte)
	ActiveCount() int
}

type HeatmapPublisher interface {
	PublishHeatmap(ctx context.Context, h3Cell string, msg []byte) error
}

// Broadcaster — hücre güncellemelerini abonelere yayınlar; max 5 saniyede bir broadcast
type Broadcaster struct {
	store       CellStore
	publisher   HeatmapPublisher
	mu          sync.Mutex
	lastBroadAt time.Time
}

func NewBroadcaster(store CellStore) *Broadcaster {
	return &Broadcaster{store: store}
}

func (b *Broadcaster) SetPublisher(publisher HeatmapPublisher) {
	b.mu.Lock()
	b.publisher = publisher
	b.mu.Unlock()
}

// OnCellUpdate — kullanıcı konum güncelleyince çağrılır
func (b *Broadcaster) OnCellUpdate(ctx context.Context, userID, h3Cell string, sender Sender) {
	metrics.LocationUpdatesTotal.Inc()

	b.mu.Lock()
	if time.Since(b.lastBroadAt) < broadcastMinInterval {
		b.mu.Unlock()
		return // throttle — çok yakın zamanda broadcast yapıldı
	}
	b.lastBroadAt = time.Now()
	publisher := b.publisher
	b.mu.Unlock()

	counts := b.store.GetCellCounts(context.Background())
	if err := b.store.WriteHeatmapSnapshots(ctx); err != nil {
		log.Warn().Err(err).Msg("heatmap_snapshot_write_failed")
	}

	payload := map[string]any{
		"type":  "heatmap_update",
		"cells": counts,
	}

	msg, err := json.Marshal(payload)
	if err != nil {
		log.Error().Err(err).Msg("broadcast_marshal_failed")
		return
	}

	metrics.HeatmapBroadcastsTotal.Inc()
	sender.SendToSubscribers(h3Cell, msg)
	if publisher != nil {
		if err := publisher.PublishHeatmap(ctx, h3Cell, msg); err != nil {
			log.Warn().Err(err).Str("h3Cell", h3Cell).Msg("heatmap_pubsub_publish_failed")
		}
	}
	log.Debug().
		Str("userID", userID).
		Str("h3Cell", h3Cell).
		Int("cellCount", len(counts)).
		Int("activeUsers", sender.ActiveCount()).
		Msg("heatmap_broadcast")
}
