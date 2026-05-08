package location

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// valkeyStore — production location store backed by Valkey (Redis-compatible).
// Sprint 2: VALKEY_ADDR env var gelince main.go'da NewStoreWithContext yerine kullanılır.
type valkeyStore struct {
	client *redis.Client
}

// NewValkeyStore — Valkey bağlantısı kurar; bağlantı başarısız olursa hata döner.
func NewValkeyStore(addr string) (*valkeyStore, error) {
	client := redis.NewClient(&redis.Options{
		Addr:         addr,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
	})
	if err := client.Ping(context.Background()).Err(); err != nil {
		return nil, fmt.Errorf("valkey ping failed: %w", err)
	}
	return &valkeyStore{client: client}, nil
}

func (s *valkeyStore) SetUserCell(ctx context.Context, userID, h3Cell string) error {
	return s.client.Set(ctx, userKey(userID), h3Cell, locationTTL).Err()
}

func (s *valkeyStore) GetUserCell(ctx context.Context, userID string) (string, error) {
	val, err := s.client.Get(ctx, userKey(userID)).Result()
	if err == redis.Nil {
		return "", errNotFound
	}
	return val, err
}

func (s *valkeyStore) DeleteUserCell(ctx context.Context, userID string) error {
	return s.client.Del(ctx, userKey(userID)).Err()
}

// GetCellCounts — SCAN ile tüm kullanıcı hücrelerini okur, res-8 parent'a göre sayar.
func (s *valkeyStore) GetCellCounts(ctx context.Context) map[string]int {
	counts := make(map[string]int)

	var cursor uint64
	for {
		keys, next, err := s.client.Scan(ctx, cursor, "loc:*", 100).Result()
		if err != nil {
			break
		}

		if len(keys) > 0 {
			vals, err := s.client.MGet(ctx, keys...).Result()
			if err == nil {
				for _, v := range vals {
					if v == nil {
						continue
					}
					cell, ok := v.(string)
					if !ok {
						continue
					}
					parent, err := h3CellToParent(cell, heatmapResolution)
					if err != nil {
						continue
					}
					counts[parent]++
				}
			}
		}

		cursor = next
		if cursor == 0 {
			break
		}
	}
	return counts
}

// GetCellCountsSnapshot — Prometheus scrape için heatmap snapshot (pipeline ile hızlı)
func (s *valkeyStore) GetCellCountsSnapshot(ctx context.Context) (map[string]int, error) {
	raw, err := s.client.Get(ctx, "heatmap:snapshot").Result()
	if err == redis.Nil {
		return s.GetCellCounts(ctx), nil
	}
	if err != nil {
		return nil, err
	}
	var counts map[string]int
	if err := json.Unmarshal([]byte(raw), &counts); err != nil {
		return nil, err
	}
	return counts, nil
}

func (s *valkeyStore) Close() error {
	return s.client.Close()
}

func userKey(userID string) string {
	return "loc:" + userID
}
