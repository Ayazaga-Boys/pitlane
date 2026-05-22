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
	Type        string         `json:"type"`
	Cells       map[string]int `json:"cells,omitempty"`        // heatmap_update
	HelpID      string         `json:"help_id,omitempty"`      // help_nearby / help_targeted
	FlareID     string         `json:"flare_id,omitempty"`     // flare_nearby
	H3Cell      string         `json:"h3_cell,omitempty"`      // help_nearby
	UserID      string         `json:"user_id,omitempty"`      // help_nearby, presence, story
	Status      string         `json:"status,omitempty"`       // presence_update
	Urgency     string         `json:"urgency,omitempty"`      // help_targeted
	TargetType  string         `json:"target_type,omitempty"`  // help_targeted
	IssueType   string         `json:"issue_type,omitempty"`   // help_targeted
	StoryID     string         `json:"story_id,omitempty"`     // story_posted
	PostID      string         `json:"post_id,omitempty"`      // post_liked / post_commented
	LikerID     string         `json:"liker_id,omitempty"`     // post_liked
	CommenterID string         `json:"commenter_id,omitempty"` // post_commented
	Code        string         `json:"code,omitempty"`         // error
	Message     string         `json:"message,omitempty"`      // error
}

// Sunucu→istemci mesaj type sabitleri
const (
	TypeHeatmapUpdate  = "heatmap_update"
	TypeHelpNearby     = "help_nearby"
	TypeHelpTargeted   = "help_targeted"
	TypeFlareNearby    = "flare_nearby"
	TypePresenceUpdate = "presence_update"
	TypeLocationShare  = "location_share"
	TypeStoryPosted    = "story_posted"
	TypePostLiked      = "post_liked"
	TypePostCommented  = "post_commented"
	TypePong           = "pong"
	TypeError          = "error"
)

const (
	TypeHelpCreated  = "help_created"
	TypeHelpAssigned = "help_assigned"
)

// SOS hedef tipleri
const (
	HelpTargetNearby    = "nearby"
	HelpTargetFollowers = "followers"
	HelpTargetGroup     = "group"
)

// SOS aciliyet seviyeleri
const (
	UrgencyCritical = "critical"
	UrgencyUrgent   = "urgent"
	UrgencyRequest  = "request"
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
