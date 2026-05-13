package location

import (
	"context"
	"encoding/json"
	"sync"
	"testing"
)

// mockSender — Sender interface'in test double'ı
type mockSender struct {
	mu             sync.Mutex
	allMsgs        [][]byte
	subscriberMsgs [][]byte
	lastCell       string
	userMsgs       map[string][][]byte
	count          int
}

func newMockSender(count int) *mockSender {
	return &mockSender{userMsgs: make(map[string][][]byte), count: count}
}

func (m *mockSender) SendToUser(userID string, msg []byte) {
	m.mu.Lock()
	m.userMsgs[userID] = append(m.userMsgs[userID], msg)
	m.mu.Unlock()
}

func (m *mockSender) SendToAll(msg []byte) {
	m.mu.Lock()
	m.allMsgs = append(m.allMsgs, msg)
	m.mu.Unlock()
}

func (m *mockSender) SendToSubscribers(h3Cell string, msg []byte) {
	m.mu.Lock()
	m.lastCell = h3Cell
	m.subscriberMsgs = append(m.subscriberMsgs, msg)
	m.mu.Unlock()
}

func (m *mockSender) ActiveCount() int { return m.count }

func TestOnCellUpdateBroadcastsToSubscribers(t *testing.T) {
	store := NewStore()
	bc := NewBroadcaster(store)
	sender := newMockSender(2)

	ctx := context.Background()
	_ = store.SetUserCell(ctx, "user-1", "89283082803ffff")
	bc.OnCellUpdate(ctx, "user-1", "89283082803ffff", sender)

	sender.mu.Lock()
	msgCount := len(sender.subscriberMsgs)
	lastCell := sender.lastCell
	sender.mu.Unlock()

	if msgCount != 1 {
		t.Errorf("expected 1 broadcast message, got %d", msgCount)
	}
	if lastCell != "89283082803ffff" {
		t.Errorf("expected updated cell to be forwarded, got %s", lastCell)
	}
}

func TestOnCellUpdatePayloadIsValidJSON(t *testing.T) {
	store := NewStore()
	bc := NewBroadcaster(store)
	sender := newMockSender(1)

	ctx := context.Background()
	_ = store.SetUserCell(ctx, "user-x", "89283082803ffff")
	bc.OnCellUpdate(ctx, "user-x", "89283082803ffff", sender)

	sender.mu.Lock()
	raw := sender.subscriberMsgs[0]
	sender.mu.Unlock()

	var payload map[string]any
	if err := json.Unmarshal(raw, &payload); err != nil {
		t.Fatalf("broadcast payload is not valid JSON: %v", err)
	}
	if payload["type"] != "heatmap_update" {
		t.Errorf("expected type heatmap_update, got %v", payload["type"])
	}
	if _, ok := payload["cells"]; !ok {
		t.Error("expected cells field in broadcast payload")
	}
}

func TestOnCellUpdateWithMultipleUsers(t *testing.T) {
	store := NewStore()
	bc := NewBroadcaster(store)
	sender := newMockSender(3)

	ctx := context.Background()
	_ = store.SetUserCell(ctx, "u1", "89283082803ffff")
	_ = store.SetUserCell(ctx, "u2", "89283082803ffff")
	_ = store.SetUserCell(ctx, "u3", "8928308280fffff")

	bc.OnCellUpdate(ctx, "u1", "89283082803ffff", sender)

	sender.mu.Lock()
	raw := sender.subscriberMsgs[0]
	sender.mu.Unlock()

	var payload map[string]any
	_ = json.Unmarshal(raw, &payload)
	cells, ok := payload["cells"].(map[string]any)
	if !ok {
		t.Fatalf("cells field is not a map: %T", payload["cells"])
	}
	if len(cells) == 0 {
		t.Error("expected non-empty cells in payload")
	}
}
