package hub

import "github.com/Ayazaga-Boys/pitlane/apps/realtime/internal/location"

func locationParent(h3Cell string) (string, error) {
	return location.CellToHeatmapParent(h3Cell)
}
