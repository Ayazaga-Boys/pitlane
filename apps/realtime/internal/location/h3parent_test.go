package location

import (
	"strconv"
	"testing"
)

// Geçerli H3 parent-child çiftleri (doğrulanmış bit manipülasyon ile):
// center child = parent'tan digit n=0 set edilerek türetildi.
// h3CellToParent(child, parentRes) == parent olmalı.

func TestH3CellToParent(t *testing.T) {
	tests := []struct {
		name      string
		child     string
		parentRes int
		want      string
	}{
		{
			name:      "SF res-9 → res-8",
			child:     "8929a15b3a3ffff", // San Francisco center child
			parentRes: 8,
			want:      "8829a15b3bfffff",
		},
		{
			name:      "SF res-9 → res-7 (multi-step)",
			child:     "8929a15b303ffff",
			parentRes: 7,
			want:      "8729a15b3ffffff",
		},
		{
			name:      "same resolution — unchanged",
			child:     "8929a15b3a3ffff",
			parentRes: 9,
			want:      "8929a15b3a3ffff",
		},
		{
			name:      "higher parentRes — unchanged",
			child:     "8929a15b3a3ffff",
			parentRes: 10,
			want:      "8929a15b3a3ffff",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := h3CellToParent(tt.child, tt.parentRes)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != tt.want {
				t.Errorf("got %q, want %q", got, tt.want)
			}
		})
	}
}

func TestH3CellToParentInvalidInput(t *testing.T) {
	_, err := h3CellToParent("not-hex!!", 8)
	if err == nil {
		t.Error("expected error for non-hex input")
	}
}

func TestH3CellToParentResolutionField(t *testing.T) {
	parent, _ := h3CellToParent("8929a15b3a3ffff", 8)
	// parent'ın resolution biti 8 olmalı
	idx, _ := strconv.ParseUint(parent, 16, 64)
	res := int((idx >> h3ResOffset) & 0xF)
	if res != 8 {
		t.Errorf("expected parent resolution 8, got %d", res)
	}
}
