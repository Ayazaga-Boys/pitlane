package location

import "fmt"

const clusterResolution = 7

// AggregateCellCountsToResolution folds H3 cell counts into the requested
// parent resolution. It is intentionally route-agnostic so a future HTTP/API
// owner can expose it without changing realtime storage internals.
func AggregateCellCountsToResolution(counts map[string]int, resolution int) (map[string]int, error) {
	if resolution < 0 || resolution > 15 {
		return nil, fmt.Errorf("invalid h3 resolution %d", resolution)
	}

	aggregated := make(map[string]int, len(counts))
	for cell, count := range counts {
		parent, err := h3CellToParent(cell, resolution)
		if err != nil {
			return nil, err
		}
		aggregated[parent] += count
	}
	return aggregated, nil
}

// AggregateCellCountsToClusterResolution returns the res-7 aggregation used by
// the V2 server-side clustering contract.
func AggregateCellCountsToClusterResolution(counts map[string]int) (map[string]int, error) {
	return AggregateCellCountsToResolution(counts, clusterResolution)
}
