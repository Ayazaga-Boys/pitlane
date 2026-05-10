package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	WsActiveConnections = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "pitlane_ws_active_connections",
		Help: "Anlık aktif WebSocket bağlantı sayısı",
	})

	WsConnectionsTotal = promauto.NewCounter(prometheus.CounterOpts{
		Name: "pitlane_ws_connections_total",
		Help: "Toplam WebSocket bağlantı sayısı (cumulative)",
	})

	WsMessagesTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "pitlane_ws_messages_total",
		Help: "İşlenen WebSocket mesaj sayısı",
	}, []string{"type"})

	LocationUpdatesTotal = promauto.NewCounter(prometheus.CounterOpts{
		Name: "pitlane_location_updates_total",
		Help: "Toplam konum güncellemesi sayısı",
	})

	HeatmapBroadcastsTotal = promauto.NewCounter(prometheus.CounterOpts{
		Name: "pitlane_heatmap_broadcasts_total",
		Help: "Toplam heatmap yayın sayısı",
	})
)
