package hub

import "github.com/Ayazaga-Boys/rollpit/apps/realtime/internal/location"

func cellWithinKRing(originCell, targetCell string, k int) bool {
	return location.CellWithinKRing(originCell, targetCell, k)
}
