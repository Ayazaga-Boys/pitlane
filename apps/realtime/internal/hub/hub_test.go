package hub

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/Ayazaga-Boys/rollpit/apps/realtime/internal/config"
	"github.com/Ayazaga-Boys/rollpit/apps/realtime/internal/location"
)

func newTestHub() *Hub {
	store := location.NewStore()
	bc := location.NewBroadcaster(store)
	cfg := &config.Config{Port: "8080", InternalSecret: "test-secret"}
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
	req, err := http.NewRequestWithContext(context.Background(), http.MethodGet, "/ws/location", nil)
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
	req, err := http.NewRequestWithContext(context.Background(), http.MethodGet, "/ws/location", nil)
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
		hub:               h,
		conn:              nil, // connection gerekmeyen testler için
		userID:            userID,
		send:              make(chan []byte, sendBufferSize),
		subscriptions:     make(map[string]int),
		userSubscriptions: make(map[string]struct{}),
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

func TestSendPresenceUpdateToUserSubscribers(t *testing.T) {
	h := newTestHub()
	follower := newTestClient(h, "follower-user")
	other := newTestClient(h, "other-user")
	target := newTestClient(h, "target-user")
	follower.subscribeUser(target.userID)

	h.mu.Lock()
	h.clients[follower.userID] = follower
	h.clients[other.userID] = other
	h.clients[target.userID] = target
	h.mu.Unlock()

	h.SendPresenceUpdateToUserSubscribers(target.userID, "online")

	select {
	case raw := <-follower.send:
		var msg OutboundMessage
		if err := json.Unmarshal(raw, &msg); err != nil {
			t.Fatalf("unmarshal presence message: %v", err)
		}
		if msg.Type != TypePresenceUpdate || msg.UserID != target.userID || msg.Status != "online" {
			t.Fatalf("unexpected presence payload: %+v", msg)
		}
	case <-time.After(100 * time.Millisecond):
		t.Fatal("follower did not receive presence update")
	}

	select {
	case raw := <-other.send:
		t.Fatalf("non-subscriber received %s", raw)
	case <-time.After(50 * time.Millisecond):
		// expected
	}
}

func TestLocationShareRespectsCooldownAndGhostMode(t *testing.T) {
	h := newTestHub()
	c := newTestClient(h, "driver-user")

	if !c.shouldShareLocation("89283082803ffff", time.Unix(100, 0)) {
		t.Fatal("first location should be shared")
	}
	if c.shouldShareLocation("89283082803ffff", time.Unix(110, 0)) {
		t.Fatal("same cell inside cooldown should be suppressed")
	}
	if !c.shouldShareLocation("8928308280fffff", time.Unix(111, 0)) {
		t.Fatal("cell change should be shared immediately")
	}
	if !c.shouldShareLocation("8928308280fffff", time.Unix(142, 0)) {
		t.Fatal("same cell after cooldown should be shared")
	}

	c.setGhostMode(true)
	if c.shouldShareLocation("89283082803ffff", time.Unix(200, 0)) {
		t.Fatal("ghost mode should suppress location_share")
	}
}

func TestSubscribeUserRequiresFollowCache(t *testing.T) {
	h := newTestHub()
	c := newTestClient(h, "follower-user")

	c.handleMessage(InboundMessage{Type: TypeSubscribeUser, UserID: "target-user"})

	select {
	case raw := <-c.send:
		var msg OutboundMessage
		if err := json.Unmarshal(raw, &msg); err != nil {
			t.Fatalf("unmarshal error message: %v", err)
		}
		if msg.Type != TypeError || msg.Code != "FORBIDDEN" {
			t.Fatalf("expected FORBIDDEN error, got %+v", msg)
		}
	case <-time.After(100 * time.Millisecond):
		t.Fatal("expected forbidden error")
	}

	if c.followsUser("target-user") {
		t.Fatal("target should not be subscribed when follow cache denies it")
	}
}

func TestSubscribeUserAllowedByFollowCache(t *testing.T) {
	h := newTestHub()
	c := newTestClient(h, "follower-user")
	if err := h.store.SetFollowees(context.Background(), c.userID, []string{"target-user"}); err != nil {
		t.Fatalf("SetFollowees failed: %v", err)
	}

	c.handleMessage(InboundMessage{Type: TypeSubscribeUser, UserID: "target-user"})

	if !c.followsUser("target-user") {
		t.Fatal("target should be subscribed when follow cache allows it")
	}
	select {
	case raw := <-c.send:
		var msg OutboundMessage
		if err := json.Unmarshal(raw, &msg); err != nil {
			t.Fatalf("unmarshal presence snapshot: %v", err)
		}
		if msg.Type != TypePresenceUpdate || msg.UserID != "target-user" || msg.Status != "offline" {
			t.Fatalf("unexpected presence snapshot: %+v", msg)
		}
	case <-time.After(100 * time.Millisecond):
		t.Fatal("expected presence snapshot")
	}
}

func TestServeHelpEventRequiresBearerToken(t *testing.T) {
	h := newTestHub()
	body := []byte(`{"type":"help_created","help_request_id":"help-1","h3_cell":"8929a15b3a3ffff","requester_id":"user-help","issue_type":"flat_tire"}`)
	req := httptest.NewRequest(http.MethodPost, "/internal/realtime/help-event", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	h.ServeHelpEvent(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestServeHelpEventBroadcastsToKRingSubscribers(t *testing.T) {
	h := newTestHub()
	go h.Run(context.Background())

	inside := newTestClient(h, "user-inside")
	outside := newTestClient(h, "user-outside")
	inside.subscribeCell("8929a15b3a3ffff", 0)
	outside.subscribeCell("89283082803ffff", 0)

	h.register <- inside
	h.register <- outside
	time.Sleep(20 * time.Millisecond)

	body := []byte(`{"type":"help_created","help_request_id":"help-1","h3_cell":"8929a15b3a3ffff","requester_id":"user-help","issue_type":"flat_tire"}`)
	req := httptest.NewRequest(http.MethodPost, "/internal/realtime/help-event", bytes.NewReader(body))
	req.Header.Set("Authorization", "Bearer test-secret")
	rec := httptest.NewRecorder()

	h.ServeHelpEvent(rec, req)

	if rec.Code != http.StatusAccepted {
		t.Fatalf("expected 202, got %d", rec.Code)
	}

	select {
	case raw := <-inside.send:
		var msg OutboundMessage
		if err := json.Unmarshal(raw, &msg); err != nil {
			t.Fatalf("unmarshal outbound message: %v", err)
		}
		if msg.Type != TypeHelpNearby {
			t.Fatalf("expected %s, got %s", TypeHelpNearby, msg.Type)
		}
		if msg.HelpID != "help-1" {
			t.Fatalf("expected help-1, got %s", msg.HelpID)
		}
	case <-time.After(100 * time.Millisecond):
		t.Fatal("inside subscriber did not receive help event")
	}

	select {
	case raw := <-outside.send:
		t.Fatalf("outside subscriber received %s", raw)
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
		{`{"type":"subscribe_user","user_id":"target-user"}`, TypeSubscribeUser},
		{`{"type":"unsubscribe_user","user_id":"target-user"}`, TypeUnsubscribeUser},
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
