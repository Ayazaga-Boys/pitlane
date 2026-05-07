package hub

import (
	"encoding/json"
	"testing"

	"github.com/Ayazaga-Boys/pitlane/apps/realtime/internal/config"
	"github.com/Ayazaga-Boys/pitlane/apps/realtime/internal/location"
)

func newTestHub() *Hub {
	store := location.NewStore()
	bc := location.NewBroadcaster(store)
	cfg := &config.Config{Port: "8080"}
	return New(cfg, store, bc)
}

func TestHubActiveCountZero(t *testing.T) {
	h := newTestHub()
	if h.ActiveCount() != 0 {
		t.Errorf("expected 0 active clients, got %d", h.ActiveCount())
	}
}

func TestSendToNonExistentUser(t *testing.T) {
	h := newTestHub()
	// Var olmayan kullanıcıya mesaj göndermek panic yapmamalı
	h.SendToUser("nonexistent", []byte(`{"type":"pong"}`))
}

func TestSendToAllEmpty(t *testing.T) {
	h := newTestHub()
	// Boş hub'a broadcast panic yapmamalı
	h.SendToAll([]byte(`{"type":"heatmap_update","cells":{}}`))
}

func TestMessageMarshal(t *testing.T) {
	msg := OutboundMessage{
		Type:  TypeHeatmapUpdate,
		Cells: map[string]int{"89283082803ffff": 5},
	}
	b, err := json.Marshal(msg)
	if err != nil {
		t.Fatalf("marshal failed: %v", err)
	}
	if len(b) == 0 {
		t.Error("expected non-empty JSON")
	}
}

func TestInboundMessageTypes(t *testing.T) {
	tests := []struct {
		raw      string
		wantType string
	}{
		{`{"type":"location","h3_cell":"89283082803ffff"}`, TypeLocation},
		{`{"type":"ghost_on"}`, TypeGhostOn},
		{`{"type":"ghost_off"}`, TypeGhostOff},
	}

	for _, tt := range tests {
		var msg InboundMessage
		if err := json.Unmarshal([]byte(tt.raw), &msg); err != nil {
			t.Errorf("unmarshal failed for %s: %v", tt.raw, err)
			continue
		}
		if msg.Type != tt.wantType {
			t.Errorf("expected type %s, got %s", tt.wantType, msg.Type)
		}
	}
}
