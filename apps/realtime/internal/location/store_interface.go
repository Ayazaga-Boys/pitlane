package location

import "context"

// CellStore — konum store'unun ortak arayüzü.
// In-memory (Store) ve Valkey (valkeyStore) bu interface'i implement eder.
type CellStore interface {
	SetUserCell(ctx context.Context, userID, h3Cell string) error
	SetUserCellWithVehicle(ctx context.Context, userID, h3Cell, vehicleType string) error
	GetUserCell(ctx context.Context, userID string) (string, error)
	DeleteUserCell(ctx context.Context, userID string) error
	GetCellCounts(ctx context.Context) map[string]int
	GetCellCountsByVehicle(ctx context.Context, vehicleType string) map[string]int
	WriteHeatmapSnapshots(ctx context.Context) error
}
