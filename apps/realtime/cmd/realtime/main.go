package main

import (
	"net/http"
	"os"

	"github.com/Ayazaga-Boys/pitlane/apps/realtime/internal/config"
	"github.com/rs/zerolog/log"
)

func main() {
	cfg := config.Load()

	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte("ok"))
	})

	log.Info().Str("port", cfg.Port).Msg("Pitlane realtime service starting")
	if err := http.ListenAndServe(":"+cfg.Port, mux); err != nil {
		log.Fatal().Err(err).Msg("realtime service stopped")
		os.Exit(1)
	}
}
