package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"github.com/Ayazaga-Boys/rollpit/apps/realtime/internal/config"
	"github.com/Ayazaga-Boys/rollpit/apps/realtime/internal/hub"
	"github.com/Ayazaga-Boys/rollpit/apps/realtime/internal/location"
	"github.com/Ayazaga-Boys/rollpit/apps/realtime/internal/metrics"
)

func main() {
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr, TimeFormat: time.RFC3339}).
		With().
		Str("service", "rollpit-realtime").
		Logger()

	startTime := time.Now()
	cfg := config.Load()
	hubCtx, hubCancel := context.WithCancel(context.Background())

	var store location.CellStore
	var pubsub *location.ValkeyPubSub
	if cfg.ValkeyAddr != "" {
		vs, err := location.NewValkeyStore(cfg.ValkeyAddr)
		if err != nil {
			log.Warn().Err(err).Msg("valkey_unavailable_fallback_memory")
			store = location.NewStoreWithContext(hubCtx)
		} else {
			log.Info().Str("addr", cfg.ValkeyAddr).Msg("valkey_connected")
			store = vs
			if ps, err := location.NewValkeyPubSub(cfg.ValkeyAddr); err != nil {
				log.Warn().Err(err).Msg("valkey_pubsub_unavailable_single_instance_broadcast")
			} else {
				pubsub = ps
				log.Info().Msg("valkey_pubsub_connected")
			}
		}
	} else {
		store = location.NewStoreWithContext(hubCtx)
	}

	broadcaster := location.NewBroadcaster(store)
	h := hub.New(&cfg, store, broadcaster)
	if pubsub != nil {
		broadcaster.SetPublisher(pubsub)
		go func() {
			err := pubsub.SubscribeHeatmap(hubCtx, func(h3Cell string, msg []byte) {
				h.SendToSubscribers(h3Cell, msg)
			})
			if err != nil && err != context.Canceled {
				log.Warn().Err(err).Msg("valkey_pubsub_subscribe_stopped")
			}
		}()
	}
	go h.Run(hubCtx)

	// Aktif bağlantı sayısını periyodik Prometheus'a yaz
	go func() {
		ticker := time.NewTicker(5 * time.Second)
		for range ticker.C {
			metrics.WsActiveConnections.Set(float64(h.ActiveCount()))
		}
	}()

	mux := http.NewServeMux()
	mux.HandleFunc("/ws/location", h.ServeWS)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = fmt.Fprintf(w, `{"ok":true,"connections":%d,"uptime_s":%d}`,
			h.ActiveCount(), int(time.Since(startTime).Seconds()))
	})
	mux.Handle("/metrics", promhttp.Handler())

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	go func() {
		log.Info().Str("port", cfg.Port).Msg("realtime_service_started")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("server_error")
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info().Msg("graceful_shutdown_started")
	hubCancel() // hub goroutine'ini durdur, tüm client send kanallarını kapat
	if pubsub != nil {
		if err := pubsub.Close(); err != nil {
			log.Warn().Err(err).Msg("valkey_pubsub_close_failed")
		}
	}
	shutCtx, shutCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutCancel()
	if err := srv.Shutdown(shutCtx); err != nil {
		log.Error().Err(err).Msg("shutdown_error")
	}
	log.Info().Msg("graceful_shutdown_complete")
}
