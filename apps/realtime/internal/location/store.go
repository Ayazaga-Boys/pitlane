package location

import (
	"context"
	"sync"
	"time"
)

const locationTTL = 5 * time.Minute

type cellEntry struct {
	h3Cell  string
	expires time.Time
}

// Store — konum hücrelerini saklar.
// Üretimde Valkey (Redis uyumlu). Şu an in-memory + TTL (Sprint 2'de swap edilir).
type Store struct {
	mu   sync.RWMutex
	data map[string]cellEntry // userID → entry
}

func NewStore() *Store {
	return NewStoreWithContext(context.Background())
}

func NewStoreWithContext(ctx context.Context) *Store {
	s := &Store{data: make(map[string]cellEntry)}
	go s.evict(ctx)
	return s
}

// NewValKeyStore — Valkey bağlantısı kurulunca bu kullanılacak (Sprint 2)
// func NewValKeyStore(addr string) *Store { ... }

func (s *Store) SetUserCell(_ context.Context, userID, h3Cell string) error {
	s.mu.Lock()
	s.data[userID] = cellEntry{h3Cell: h3Cell, expires: time.Now().Add(locationTTL)}
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
	s.mu.RLock()
	defer s.mu.RUnlock()

	now := time.Now()
	counts := make(map[string]int)
	for _, entry := range s.data {
		if now.Before(entry.expires) {
			parent, err := h3CellToParent(entry.h3Cell, heatmapResolution)
			if err != nil {
				continue // geçersiz H3 hücresi — atla
			}
			counts[parent]++
		}
	}
	return counts
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
