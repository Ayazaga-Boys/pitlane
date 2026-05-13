package hub

import (
	"context"
	"encoding/json"
	"net/http"
	"testing"
	"time"

	"github.com/Ayazaga-Boys/rollpit/apps/realtime/internal/config"
	"github.com/Ayazaga-Boys/rollpit/apps/realtime/internal/location"
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

func TestUpgraderAllowsNativeClientsWithoutOriginInProd(t *testing.T) {
	cfg := &config.Config{
		IsDev:          false,
		AllowedOrigins: []string{"https://rollpit.com"},
	}
	upgrader := newUpgrader(cfg)
	req, err := http.NewRequest(http.MethodGet, "/ws/location", nil)
	if err != nil {
		t.Fatalf("request build failed: %v", err)
	}
	if !upgrader.CheckOrigin(req) {
		t.Fatal("expected native client without Origin to be allowed")
	}
}

func TestUpgraderRejectsUnknownOriginInProd(t *testing.T) {
	cfg := &config.Config{
		IsDev:          false,
		AllowedOrigins: []string{"https://rollpit.com"},
	}
	upgrader := newUpgrader(cfg)
	req, err := http.NewRequest(http.MethodGet, "/ws/location", nil)
	if err != nil {
		t.Fatalf("request build failed: %v", err)
	}
	req.Header.Set("Origin", "https://evil.example")
	if upgrader.CheckOrigin(req) {
		t.Fatal("expected unknown web origin to be rejected")
	}
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

func newTestClient(h *Hub, userID string) *Client {
	return &Client{
		hub:           h,
		conn:          nil, // connection gerekmeyen testler için
		userID:        userID,
		send:          make(chan []byte, sendBufferSize),
		subscriptions: make(map[string]int),
	}
}

func TestHubRegisterIncrementsCount(t *testing.T) {
	h := newTestHub()
	go h.Run(context.Background())

	c := newTestClient(h, "user-1")
	h.register <- c

	// Run() goroutine'inin işlemesini bekle
	time.Sleep(10 * time.Millisecond)

	if h.ActiveCount() != 1 {
		t.Errorf("expected 1 active client, got %d", h.ActiveCount())
	}
}

func TestHubUnregisterDecrementsCount(t *testing.T) {
	h := newTestHub()
	go h.Run(context.Background())

	c := newTestClient(h, "user-2")
	h.register <- c
	time.Sleep(10 * time.Millisecond)

	h.unregister <- c
	time.Sleep(10 * time.Millisecond)

	if h.ActiveCount() != 0 {
		t.Errorf("expected 0 active clients after unregister, got %d", h.ActiveCount())
	}
}

func TestSendToRegisteredUser(t *testing.T) {
	h := newTestHub()
	go h.Run(context.Background())

	c := newTestClient(h, "user-3")
	h.register <- c
	time.Sleep(10 * time.Millisecond)

	msg := []byte(`{"type":"pong"}`)
	h.SendToUser("user-3", msg)

	select {
	case got := <-c.send:
		if string(got) != string(msg) {
			t.Errorf("expected %s, got %s", msg, got)
		}
	case <-time.After(100 * time.Millisecond):
		t.Error("message not delivered within timeout")
	}
}

func TestSendToAllDeliversToAll(t *testing.T) {
	h := newTestHub()
	go h.Run(context.Background())

	c1 := newTestClient(h, "user-4a")
	c2 := newTestClient(h, "user-4b")
	h.register <- c1
	h.register <- c2
	time.Sleep(20 * time.Millisecond)

	msg := []byte(`{"type":"heatmap_update","cells":{}}`)
	h.SendToAll(msg)

	for _, c := range []*Client{c1, c2} {
		select {
		case got := <-c.send:
			if string(got) != string(msg) {
				t.Errorf("expected %s, got %s", msg, got)
			}
		case <-time.After(100 * time.Millisecond):
			t.Errorf("client %s did not receive broadcast", c.userID)
		}
	}
}

func TestSendToSubscribersDeliversOnlyInterestedClients(t *testing.T) {
	h := newTestHub()
	go h.Run(context.Background())

	interested := newTestClient(h, "user-sub")
	notInterested := newTestClient(h, "user-other")
	interested.subscribeCell("8929a15b3a3ffff", 2)
	notInterested.subscribeCell("89283082803ffff", 2)

	h.register <- interested
	h.register <- notInterested
	time.Sleep(20 * time.Millisecond)

	msg := []byte(`{"type":"heatmap_update","cells":{}}`)
	h.SendToSubscribers("8929a15b3a3ffff", msg)

	select {
	case got := <-interested.send:
		if string(got) != string(msg) {
			t.Errorf("expected %s, got %s", msg, got)
		}
	case <-time.After(100 * time.Millisecond):
		t.Fatal("interested client did not receive message")
	}

	select {
	case got := <-notInterested.send:
		t.Fatalf("not interested client received %s", got)
	case <-time.After(50 * time.Millisecond):
		// expected
	}
}

func TestHubShutdownOnContextCancel(t *testing.T) {
	h := newTestHub()
	ctx, cancel := context.WithCancel(context.Background())

	c := newTestClient(h, "user-shutdown")
	h.register <- c
	done := make(chan struct{})
	go func() {
		h.Run(ctx)
		close(done)
	}()
	time.Sleep(10 * time.Millisecond)

	cancel()

	select {
	case <-done:
		// Run() returned — hub kapandı ✓
	case <-time.After(200 * time.Millisecond):
		t.Error("hub did not shut down after context cancel")
	}
}

func TestIsValidH3Cell(t *testing.T) {
	tests := []struct {
		input string
		want  bool
	}{
		{"89283082803ffff", true},   // geçerli res-9
		{"8928308280fffff", true},   // geçerli res-8
		{"", false},                 // boş
		{"89283082803fff", false},   // 14 char — kısa
		{"89283082803fffff", false}, // 16 char — uzun
		{"89283082803FFFF", false},  // büyük harf
		{"89283082803gfff", false},  // geçersiz hex char
		{"89283082803 fff", false},  // boşluk içeriyor
	}
	for _, tt := range tests {
		got := isValidH3Cell(tt.input)
		if got != tt.want {
			t.Errorf("isValidH3Cell(%q) = %v, want %v", tt.input, got, tt.want)
		}
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
		{`{"type":"subscribe_cell","h3_cell":"89283082803ffff","k":2}`, TypeSubscribeCell},
		{`{"type":"unsubscribe_cell","h3_cell":"89283082803ffff"}`, TypeUnsubscribeCell},
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
