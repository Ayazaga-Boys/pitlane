package location

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
)

const heatmapPubSubChannel = "heatmap:updates"

type HeatmapMessage struct {
	Origin string          `json:"origin"`
	H3Cell string          `json:"h3_cell"`
	Body   json.RawMessage `json:"body"`
}

type ValkeyPubSub struct {
	client   *redis.Client
	originID string
}

func NewValkeyPubSub(addr string) (*ValkeyPubSub, error) {
	opts, err := redis.ParseURL(addr)
	if err != nil {
		return nil, fmt.Errorf("valkey pubsub parse url failed: %w", err)
	}
	opts.DialTimeout = 5 * time.Second
	opts.ReadTimeout = 0
	opts.WriteTimeout = 3 * time.Second

	client := redis.NewClient(opts)
	if err := client.Ping(context.Background()).Err(); err != nil {
		return nil, fmt.Errorf("valkey pubsub ping failed: %w", err)
	}
	return &ValkeyPubSub{
		client:   client,
		originID: defaultOriginID(),
	}, nil
}

func (p *ValkeyPubSub) PublishHeatmap(ctx context.Context, h3Cell string, msg []byte) error {
	payload, err := json.Marshal(HeatmapMessage{
		Origin: p.originID,
		H3Cell: h3Cell,
		Body:   json.RawMessage(msg),
	})
	if err != nil {
		return fmt.Errorf("heatmap pubsub marshal failed: %w", err)
	}
	return p.client.Publish(ctx, heatmapPubSubChannel, payload).Err()
}

func (p *ValkeyPubSub) SubscribeHeatmap(ctx context.Context, handle func(h3Cell string, msg []byte)) error {
	sub := p.client.Subscribe(ctx, heatmapPubSubChannel)
	defer func() {
		if err := sub.Close(); err != nil {
			log.Warn().Err(err).Msg("heatmap_pubsub_close_failed")
		}
	}()

	ch := sub.Channel()
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		case raw, ok := <-ch:
			if !ok {
				return nil
			}
			var payload HeatmapMessage
			if err := json.Unmarshal([]byte(raw.Payload), &payload); err != nil {
				log.Warn().Err(err).Msg("heatmap_pubsub_bad_payload")
				continue
			}
			if payload.Origin == p.originID {
				continue
			}
			handle(payload.H3Cell, []byte(payload.Body))
		}
	}
}

func (p *ValkeyPubSub) Close() error {
	return p.client.Close()
}

func defaultOriginID() string {
	host, err := os.Hostname()
	if err != nil || host == "" {
		host = "unknown-host"
	}
	return fmt.Sprintf("%s-%d-%d", host, os.Getpid(), time.Now().UnixNano())
}
