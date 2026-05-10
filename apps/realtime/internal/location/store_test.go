package location

import (
	"context"
	"testing"
	"time"
)

// Doğrulanmış H3 hücre çiftleri (h3parent_test.go ile aynı kaynak)
const (
	validRes9Cell  = "8929a15b3a3ffff" // San Francisco, res-9
	validRes8Cell  = "8829a15b3bfffff" // San Francisco, res-8 parent
	validRes9Cell2 = "8929a15b303ffff" // Farklı res-9 (farklı parent)
)

func newTestStore() *Store {
	return NewStore()
}

func TestSetAndGetUserCell(t *testing.T) {
	store := newTestStore()
	ctx := context.Background()

	err := store.SetUserCell(ctx, "user-1", validRes9Cell)
	if err != nil {
		t.Fatalf("SetUserCell failed: %v", err)
	}

	cell, err := store.GetUserCell(ctx, "user-1")
	if err != nil {
		t.Fatalf("GetUserCell failed: %v", err)
	}
	if cell != validRes9Cell {
		t.Errorf("expected %s, got %s", validRes9Cell, cell)
	}
}

func TestDeleteUserCell(t *testing.T) {
	store := newTestStore()
	ctx := context.Background()

	_ = store.SetUserCell(ctx, "user-2", validRes9Cell)
	err := store.DeleteUserCell(ctx, "user-2")
	if err != nil {
		t.Fatalf("DeleteUserCell failed: %v", err)
	}

	_, err = store.GetUserCell(ctx, "user-2")
	if err == nil {
		t.Error("expected error after delete, got nil")
	}
}

func TestGetCellCountsGroups(t *testing.T) {
	store := newTestStore()
	ctx := context.Background()

	// İki kullanıcı aynı res-9 hücrede → aynı res-8 parent'ta gruplandırılmalı
	_ = store.SetUserCell(ctx, "user-a", validRes9Cell)
	_ = store.SetUserCell(ctx, "user-b", validRes9Cell)

	counts := store.GetCellCounts(ctx)

	if len(counts) == 0 {
		t.Fatal("expected non-empty cell counts")
	}

	// Her iki kullanıcı aynı parent'ta → o parent'ın count'u 2 olmalı
	parent, _ := h3CellToParent(validRes9Cell, heatmapResolution)
	if counts[parent] != 2 {
		t.Errorf("expected count 2 for parent %s, got %d", parent, counts[parent])
	}

	// Parent doğruluğu
	if parent != validRes8Cell {
		t.Errorf("expected parent %s, got %s", validRes8Cell, parent)
	}
}

func TestGetCellCountsSeparateParents(t *testing.T) {
	store := newTestStore()
	ctx := context.Background()

	_ = store.SetUserCell(ctx, "user-x", validRes9Cell)  // parent: validRes8Cell
	_ = store.SetUserCell(ctx, "user-y", validRes9Cell2) // farklı parent

	counts := store.GetCellCounts(ctx)

	parent1, _ := h3CellToParent(validRes9Cell, heatmapResolution)
	parent2, _ := h3CellToParent(validRes9Cell2, heatmapResolution)

	if parent1 == parent2 {
		// Farklı res-9 hücrelerin farklı parent'ları olduğunu belgele
		// Aynı parent'a düşerlerse test mantıksal olarak doğru
		t.Logf("note: both cells map to same res-8 parent %s", parent1)
	}

	if counts[parent1] != 1 {
		t.Errorf("expected count 1 for parent1 %s, got %d", parent1, counts[parent1])
	}
}

func TestGetCellCountsRes8CellPassthrough(t *testing.T) {
	store := newTestStore()
	ctx := context.Background()

	// res-8 hücresi girerse (parentRes == currentRes) → değişmeden kullanılır
	_ = store.SetUserCell(ctx, "user-r8", validRes8Cell)

	counts := store.GetCellCounts(ctx)
	if len(counts) == 0 {
		t.Fatal("expected non-empty counts for res-8 input cell")
	}
}

func TestLocationTTLEviction(t *testing.T) {
	store := &Store{data: make(map[string]cellEntry)}

	store.data["user-expired"] = cellEntry{
		h3Cell:  validRes9Cell,
		expires: time.Now().Add(-1 * time.Second),
	}

	_, err := store.GetUserCell(context.Background(), "user-expired")
	if err == nil {
		t.Error("expected TTL expired error, got nil")
	}
}

func TestEvictWithContextCancel(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	store := NewStoreWithContext(ctx)
	_ = store.SetUserCell(context.Background(), "user-evict", validRes9Cell)

	// context cancel — evict goroutine durmalı (goroutine leak yok)
	cancel()
	// kısa bekleme sonrası panic veya race olmamalı
	time.Sleep(10 * time.Millisecond)
}

func TestGetNonExistentUser(t *testing.T) {
	store := newTestStore()
	_, err := store.GetUserCell(context.Background(), "nonexistent")
	if err == nil {
		t.Error("expected error for nonexistent user")
	}
}
