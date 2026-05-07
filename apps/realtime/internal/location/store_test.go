package location

import (
	"context"
	"testing"
	"time"
)

func newTestStore() *Store {
	return NewStore()
}

func TestSetAndGetUserCell(t *testing.T) {
	store := newTestStore()
	ctx := context.Background()

	err := store.SetUserCell(ctx, "user-1", "89283082803ffff")
	if err != nil {
		t.Fatalf("SetUserCell failed: %v", err)
	}

	cell, err := store.GetUserCell(ctx, "user-1")
	if err != nil {
		t.Fatalf("GetUserCell failed: %v", err)
	}
	if cell != "89283082803ffff" {
		t.Errorf("expected 89283082803ffff, got %s", cell)
	}
}

func TestDeleteUserCell(t *testing.T) {
	store := newTestStore()
	ctx := context.Background()

	_ = store.SetUserCell(ctx, "user-2", "89283082803ffff")
	err := store.DeleteUserCell(ctx, "user-2")
	if err != nil {
		t.Fatalf("DeleteUserCell failed: %v", err)
	}

	_, err = store.GetUserCell(ctx, "user-2")
	if err == nil {
		t.Error("expected error after delete, got nil")
	}
}

func TestGetCellCounts(t *testing.T) {
	store := newTestStore()
	ctx := context.Background()

	_ = store.SetUserCell(ctx, "user-a", "89283082803ffff")
	_ = store.SetUserCell(ctx, "user-b", "89283082803ffff")
	_ = store.SetUserCell(ctx, "user-c", "8928308280fffff")

	counts := store.GetCellCounts(ctx)
	if len(counts) == 0 {
		t.Error("expected non-empty cell counts")
	}
}

func TestLocationTTLEviction(t *testing.T) {
	store := &Store{data: make(map[string]cellEntry)}

	// TTL geçmiş kayıt ekle
	store.data["user-expired"] = cellEntry{
		h3Cell:  "89283082803ffff",
		expires: time.Now().Add(-1 * time.Second),
	}

	_, err := store.GetUserCell(context.Background(), "user-expired")
	if err == nil {
		t.Error("expected TTL expired error, got nil")
	}
}

func TestGetNonExistentUser(t *testing.T) {
	store := newTestStore()
	_, err := store.GetUserCell(context.Background(), "nonexistent")
	if err == nil {
		t.Error("expected error for nonexistent user")
	}
}
