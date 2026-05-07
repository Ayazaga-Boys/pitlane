package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"github.com/Ayazaga-Boys/pitlane/apps/realtime/internal/config"
	"github.com/Ayazaga-Boys/pitlane/apps/realtime/internal/hub"
	"github.com/Ayazaga-Boys/pitlane/apps/realtime/internal/location"
)

func main() {
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr, TimeFormat: time.RFC3339}).
		With().
		Str("service", "pitlane-realtime").
		Logger()

	cfg := config.Load()
	store := location.NewStore()
	broadcaster := location.NewBroadcaster(store)
	h := hub.New(&cfg, store, broadcaster)
	go h.Run()

	mux := http.NewServeMux()
	mux.HandleFunc("/ws/location", h.ServeWS)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"ok":true,"connections":` + intStr(h.ActiveCount()) + `}`))
	})
	mux.HandleFunc("/metrics", func(w http.ResponseWriter, _ *http.Request) {
		// TODO(sprint6): Prometheus metrics
		_, _ = w.Write([]byte("# Prometheus metrics coming Sprint 6\n"))
	})

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
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Error().Err(err).Msg("shutdown_error")
	}
	log.Info().Msg("graceful_shutdown_complete")
}

func intStr(n int) string {
	if n == 0 {
		return "0"
	}
	b := make([]byte, 0, 4)
	for n > 0 {
		b = append([]byte{byte('0' + n%10)}, b...)
		n /= 10
	}
	return string(b)
}
