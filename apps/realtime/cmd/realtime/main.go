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

	"github.com/Ayazaga-Boys/pitlane/apps/realtime/internal/config"
	"github.com/Ayazaga-Boys/pitlane/apps/realtime/internal/hub"
	"github.com/Ayazaga-Boys/pitlane/apps/realtime/internal/location"
	"github.com/Ayazaga-Boys/pitlane/apps/realtime/internal/metrics"
)

func main() {
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr, TimeFormat: time.RFC3339}).
		With().
		Str("service", "pitlane-realtime").
		Logger()

	cfg := config.Load()
	hubCtx, hubCancel := context.WithCancel(context.Background())
	store := location.NewStoreWithContext(hubCtx) // evict goroutine hub ile birlikte durur
	broadcaster := location.NewBroadcaster(store)
	h := hub.New(&cfg, store, broadcaster)
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
		_, _ = fmt.Fprintf(w, `{"ok":true,"connections":%d}`, h.ActiveCount())
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
	shutCtx, shutCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutCancel()
	if err := srv.Shutdown(shutCtx); err != nil {
		log.Error().Err(err).Msg("shutdown_error")
	}
	log.Info().Msg("graceful_shutdown_complete")
}
