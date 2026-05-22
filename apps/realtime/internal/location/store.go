package location

import (
	"context"
	"sync"
	"time"
)

const locationTTL = 5 * time.Minute

type cellEntry struct {
	h3Cell      string
	vehicleType string
	expires     time.Time
}

// Store — konum hücrelerini saklar.
// Üretimde Valkey (Redis uyumlu). Şu an in-memory + TTL (Sprint 2'de swap edilir).
type Store struct {
	mu      sync.RWMutex
	data    map[string]cellEntry // userID → entry
	follows map[string]map[string]struct{}
}

func NewStore() *Store {
	return NewStoreWithContext(context.Background())
}

func NewStoreWithContext(ctx context.Context) *Store {
	s := &Store{
		data:    make(map[string]cellEntry),
		follows: make(map[string]map[string]struct{}),
	}
	go s.evict(ctx)
	return s
}

// NewValKeyStore — Valkey bağlantısı kurulunca bu kullanılacak (Sprint 2)
// func NewValKeyStore(addr string) *Store { ... }

func (s *Store) SetUserCell(_ context.Context, userID, h3Cell string) error {
	return s.SetUserCellWithVehicle(context.Background(), userID, h3Cell, "")
}

func (s *Store) SetUserCellWithVehicle(_ context.Context, userID, h3Cell, vehicleType string) error {
	s.mu.Lock()
	s.data[userID] = cellEntry{
		h3Cell:      h3Cell,
		vehicleType: normalizeVehicleType(vehicleType),
		expires:     time.Now().Add(locationTTL),
	}
	s.mu.Unlock()
	return nil
}

func (s *Store) GetUserCell(_ context.Context, userID string) (string, error) {
	s.mu.RLock()
	entry, ok := s.data[userID]
	s.mu.RUnlock()
	if !ok || time.Now().After(entry.expires) {
		return "", errNotFound
	}
	return entry.h3Cell, nil
}

func (s *Store) DeleteUserCell(_ context.Context, userID string) error {
	s.mu.Lock()
	delete(s.data, userID)
	s.mu.Unlock()
	return nil
}

// heatmapResolution — heatmap için H3 parent çözünürlüğü (res-8)
const heatmapResolution = 8

// GetCellCounts — H3 res-8 hücre bazında kullanıcı sayıları (heatmap için)
func (s *Store) GetCellCounts(_ context.Context) map[string]int {
	return s.GetCellCountsByVehicle(context.Background(), "")
}

func (s *Store) GetCellCountsByVehicle(_ context.Context, vehicleType string) map[string]int {
	s.mu.RLock()
	defer s.mu.RUnlock()

	now := time.Now()
	counts := make(map[string]int)
	wantVehicle := normalizeVehicleType(vehicleType)
	for _, entry := range s.data {
		if now.After(entry.expires) {
			continue
		}
		if wantVehicle != "" && normalizeVehicleType(entry.vehicleType) != wantVehicle {
			continue
		}
		parent, err := h3CellToParent(entry.h3Cell, heatmapResolution)
		if err != nil {
			continue // geçersiz H3 hücresi — atla
		}
		counts[parent]++
	}
	return counts
}

func (s *Store) WriteHeatmapSnapshots(_ context.Context) error {
	return nil
}

func (s *Store) SetFollowees(_ context.Context, userID string, followeeIDs []string) error {
	next := make(map[string]struct{}, len(followeeIDs))
	for _, followeeID := range followeeIDs {
		next[followeeID] = struct{}{}
	}

	s.mu.Lock()
	s.follows[userID] = next
	s.mu.Unlock()
	return nil
}

func (s *Store) IsFollowing(_ context.Context, followerID, followeeID string) (bool, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	followees := s.follows[followerID]
	_, ok := followees[followeeID]
	return ok, nil
}

func normalizeVehicleType(vehicleType string) string {
	switch vehicleType {
	case "car", "motorcycle":
		return vehicleType
	default:
		return ""
	}
}

// evict — süresi dolmuş kayıtları periyodik temizler; ctx cancel ile durur
func (s *Store) evict(ctx context.Context) {
	ticker := time.NewTicker(locationTTL)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.mu.Lock()
			now := time.Now()
			for uid, entry := range s.data {
				if now.After(entry.expires) {
					delete(s.data, uid)
				}
			}
			s.mu.Unlock()
		}
	}
}

var errNotFound = &storeError{"not found"}

type storeError struct{ msg string }

func (e *storeError) Error() string { return e.msg }
