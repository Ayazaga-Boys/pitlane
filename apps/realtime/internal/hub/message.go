package hub

// InboundMessage — Flutter'dan gelen mesaj tipleri
type InboundMessage struct {
	Type        string `json:"type"`
	H3Cell      string `json:"h3_cell,omitempty"`
	K           int    `json:"k,omitempty"`
	VehicleType string `json:"vehicle_type,omitempty"` // "car" | "motorcycle" | "" (any)
	UserID      string `json:"user_id,omitempty"`
}

// OutboundMessage — Flutter'a gönderilen mesaj tipleri
type OutboundMessage struct {
	Type    string         `json:"type"`
	Cells   map[string]int `json:"cells,omitempty"`    // heatmap_update
	HelpID  string         `json:"help_id,omitempty"`  // help_nearby
	FlareID string         `json:"flare_id,omitempty"` // flare_nearby
	H3Cell  string         `json:"h3_cell,omitempty"`  // help_nearby
	UserID  string         `json:"user_id,omitempty"`  // help_nearby
	Status  string         `json:"status,omitempty"`   // presence_update
	Code    string         `json:"code,omitempty"`     // error
	Message string         `json:"message,omitempty"`  // error
}

// Sunucu→istemci mesaj type sabitleri
const (
	TypeHeatmapUpdate  = "heatmap_update"
	TypeHelpNearby     = "help_nearby"
	TypeFlareNearby    = "flare_nearby"
	TypePresenceUpdate = "presence_update"
	TypeLocationShare  = "location_share"
	TypePong           = "pong"
	TypeError          = "error"
)

const (
	TypeHelpCreated  = "help_created"
	TypeHelpAssigned = "help_assigned"
)

// İstemci→sunucu mesaj type sabitleri
const (
	TypeLocation        = "location"
	TypeGhostOn         = "ghost_on"
	TypeGhostOff        = "ghost_off"
	TypeSubscribeCell   = "subscribe_cell"
	TypeUnsubscribeCell = "unsubscribe_cell"
	TypeSubscribeUser   = "subscribe_user"
	TypeUnsubscribeUser = "unsubscribe_user"
)

// Flood koruması — saniyede max mesaj
const maxMsgPerSecond = 10
