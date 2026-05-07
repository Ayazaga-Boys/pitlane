package hub

// InboundMessage — Flutter'dan gelen mesaj tipleri
type InboundMessage struct {
	Type   string `json:"type"`
	H3Cell string `json:"h3_cell,omitempty"`
}

// OutboundMessage — Flutter'a gönderilen mesaj tipleri
type OutboundMessage struct {
	Type    string         `json:"type"`
	Cells   map[string]int `json:"cells,omitempty"`   // heatmap_update
	HelpID  string         `json:"help_id,omitempty"` // help_nearby
	FlareID string         `json:"flare_id,omitempty"`// flare_nearby
	Code    string         `json:"code,omitempty"`    // error
	Message string         `json:"message,omitempty"` // error
}

// Sunucu→istemci mesaj type sabitleri
const (
	TypeHeatmapUpdate = "heatmap_update"
	TypeHelpNearby    = "help_nearby"
	TypeFlareNearby   = "flare_nearby"
	TypePong          = "pong"
	TypeError         = "error"
)

// İstemci→sunucu mesaj type sabitleri
const (
	TypeLocation  = "location"
	TypeGhostOn   = "ghost_on"
	TypeGhostOff  = "ghost_off"
)

// Flood koruması — saniyede max mesaj
const maxMsgPerSecond = 10
