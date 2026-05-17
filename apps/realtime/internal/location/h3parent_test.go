package location

import (
	"strconv"
	"testing"

	h3 "github.com/uber/h3-go/v4"
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

func TestCellWithinKRing(t *testing.T) {
	origin := h3.CellFromString("8929a15b3a3ffff")
	neighbors, err := h3.GridRing(origin, 1)
	if err != nil {
		t.Fatalf("grid ring failed: %v", err)
	}
	if len(neighbors) == 0 {
		t.Fatal("expected at least one neighbor")
	}

	target := h3.CellToString(neighbors[0])
	if !CellWithinKRing("8929a15b3a3ffff", target, 1) {
		t.Fatal("expected neighbor to be inside k=1")
	}
	if CellWithinKRing("8929a15b3a3ffff", target, 0) {
		t.Fatal("expected neighbor to be outside k=0")
	}
	if CellWithinKRing("bad-cell", target, 1) {
		t.Fatal("expected invalid origin to be outside k-ring")
	}
}
