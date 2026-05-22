package location

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

// valkeyStore — production location store backed by Valkey (Redis-compatible).
// Sprint 2: VALKEY_ADDR env var gelince main.go'da NewStoreWithContext yerine kullanılır.
type valkeyStore struct {
	client *redis.Client
}

const (
	heatmapSnapshotKey           = "heatmap:snapshot"
	heatmapSnapshotCarKey        = "heatmap:snapshot:vehicle:car"
	heatmapSnapshotMotorcycleKey = "heatmap:snapshot:vehicle:motorcycle"
	followCacheTTL               = 10 * time.Minute
)

// NewValkeyStore — Valkey bağlantısı kurar; bağlantı başarısız olursa hata döner.
func NewValkeyStore(addr string) (*valkeyStore, error) {
	opts, err := redis.ParseURL(addr)
	if err != nil {
		return nil, fmt.Errorf("valkey parse url failed: %w", err)
	}
	opts.DialTimeout = 5 * time.Second
	opts.ReadTimeout = 3 * time.Second
	opts.WriteTimeout = 3 * time.Second

	client := redis.NewClient(opts)
	if err := client.Ping(context.Background()).Err(); err != nil {
		return nil, fmt.Errorf("valkey ping failed: %w", err)
	}
	return &valkeyStore{client: client}, nil
}

func (s *valkeyStore) SetUserCell(ctx context.Context, userID, h3Cell string) error {
	return s.SetUserCellWithVehicle(ctx, userID, h3Cell, "")
}

func (s *valkeyStore) SetUserCellWithVehicle(ctx context.Context, userID, h3Cell, vehicleType string) error {
	pipe := s.client.Pipeline()
	pipe.Set(ctx, userKey(userID), h3Cell, locationTTL)

	vehicleType = normalizeVehicleType(vehicleType)
	if vehicleType == "" {
		pipe.Del(ctx, userVehicleKey(userID))
	} else {
		pipe.Set(ctx, userVehicleKey(userID), vehicleType, locationTTL)
	}
	if _, err := pipe.Exec(ctx); err != nil {
		return fmt.Errorf("location write failed: %w", err)
	}
	return nil
}

func (s *valkeyStore) GetUserCell(ctx context.Context, userID string) (string, error) {
	val, err := s.client.Get(ctx, userKey(userID)).Result()
	if err == redis.Nil {
		return "", errNotFound
	}
	if err != nil {
		return "", err
	}
	return val, nil
}

func (s *valkeyStore) DeleteUserCell(ctx context.Context, userID string) error {
	return s.client.Del(ctx, userKey(userID), userVehicleKey(userID)).Err()
}

// GetCellCounts — SCAN ile tüm kullanıcı hücrelerini okur, res-8 parent'a göre sayar.
func (s *valkeyStore) GetCellCounts(ctx context.Context) map[string]int {
	return s.GetCellCountsByVehicle(ctx, "")
}

func (s *valkeyStore) GetCellCountsByVehicle(ctx context.Context, vehicleType string) map[string]int {
	counts := make(map[string]int)
	wantVehicle := normalizeVehicleType(vehicleType)

	var cursor uint64
	for {
		keys, next, err := s.client.Scan(ctx, cursor, "loc:*", 100).Result()
		if err != nil {
			break
		}

		if len(keys) > 0 {
			vals, err := s.client.MGet(ctx, keys...).Result()
			if err == nil {
				vehicleVals := make([]interface{}, len(keys))
				if wantVehicle != "" {
					vehicleKeys := make([]string, 0, len(keys))
					for _, key := range keys {
						vehicleKeys = append(vehicleKeys, userVehicleKey(strings.TrimPrefix(key, "loc:")))
					}
					if got, err := s.client.MGet(ctx, vehicleKeys...).Result(); err == nil {
						vehicleVals = got
					}
				}

				for i, v := range vals {
					if v == nil {
						continue
					}
					cell, ok := v.(string)
					if !ok {
						continue
					}
					if wantVehicle != "" {
						vehicleType, ok := vehicleVals[i].(string)
						if !ok || normalizeVehicleType(vehicleType) != wantVehicle {
							continue
						}
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

func (s *valkeyStore) WriteHeatmapSnapshots(ctx context.Context) error {
	snapshots := map[string]map[string]int{
		heatmapSnapshotKey:           s.GetCellCounts(ctx),
		heatmapSnapshotCarKey:        s.GetCellCountsByVehicle(ctx, "car"),
		heatmapSnapshotMotorcycleKey: s.GetCellCountsByVehicle(ctx, "motorcycle"),
	}

	pipe := s.client.Pipeline()
	for key, counts := range snapshots {
		raw, err := json.Marshal(counts)
		if err != nil {
			return fmt.Errorf("heatmap snapshot marshal failed: %w", err)
		}
		pipe.Set(ctx, key, raw, 2*locationTTL)
	}
	if _, err := pipe.Exec(ctx); err != nil {
		return fmt.Errorf("heatmap snapshot write failed: %w", err)
	}
	return nil
}

func (s *valkeyStore) SetFollowees(ctx context.Context, userID string, followeeIDs []string) error {
	key := followeesKey(userID)
	pipe := s.client.Pipeline()
	pipe.Del(ctx, key)
	if len(followeeIDs) > 0 {
		members := make([]interface{}, 0, len(followeeIDs))
		for _, followeeID := range followeeIDs {
			members = append(members, followeeID)
		}
		pipe.SAdd(ctx, key, members...)
		pipe.Expire(ctx, key, followCacheTTL)
	}
	if _, err := pipe.Exec(ctx); err != nil {
		return fmt.Errorf("follow cache write failed: %w", err)
	}
	return nil
}

func (s *valkeyStore) IsFollowing(ctx context.Context, followerID, followeeID string) (bool, error) {
	ok, err := s.client.SIsMember(ctx, followeesKey(followerID), followeeID).Result()
	if err != nil {
		return false, fmt.Errorf("follow cache read failed: %w", err)
	}
	return ok, nil
}

// GetCellCountsSnapshot — Prometheus scrape için heatmap snapshot (pipeline ile hızlı)
func (s *valkeyStore) GetCellCountsSnapshot(ctx context.Context) (map[string]int, error) {
	raw, err := s.client.Get(ctx, heatmapSnapshotKey).Result()
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

func userVehicleKey(userID string) string {
	return "locveh:" + userID
}

func followeesKey(userID string) string {
	return "follows:" + userID
}
