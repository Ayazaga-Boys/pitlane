package location

import "testing"

func TestAggregateCellCountsToClusterResolution(t *testing.T) {
	parent, err := h3CellToParent(validRes9Cell, clusterResolution)
	if err != nil {
		t.Fatalf("h3CellToParent failed: %v", err)
	}

	counts, err := AggregateCellCountsToClusterResolution(map[string]int{
		validRes9Cell: 2,
		validRes8Cell: 3,
	})
	if err != nil {
		t.Fatalf("AggregateCellCountsToClusterResolution failed: %v", err)
	}

	if counts[parent] != 5 {
		t.Fatalf("expected aggregated count 5 for %s, got %d", parent, counts[parent])
	}
}

func TestAggregateCellCountsToResolutionRejectsInvalidResolution(t *testing.T) {
	_, err := AggregateCellCountsToResolution(map[string]int{validRes9Cell: 1}, 16)
	if err == nil {
		t.Fatal("expected invalid resolution error")
	}
}
