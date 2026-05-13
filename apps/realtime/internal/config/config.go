package config

import (
	"os"
	"strings"
)

type Config struct {
	Port              string
	ValkeyAddr        string
	SupabaseJWTSecret string
	InternalSecret    string
	AllowedOrigins    []string // WebSocket origin whitelist
	IsDev             bool
}

func Load() Config {
	isDev := getEnv("GO_ENV", "development") == "development"

	// Prod'da ALLOWED_ORIGINS env'den gelir
	// Dev'da her origin'e izin verilir
	originsRaw := os.Getenv("ALLOWED_ORIGINS")
	var origins []string
	if originsRaw != "" {
		for _, o := range strings.Split(originsRaw, ",") {
			if trimmed := strings.TrimSpace(o); trimmed != "" {
				origins = append(origins, trimmed)
			}
		}
	}

	return Config{
		Port:              getEnv("PORT", "8080"),
		ValkeyAddr:        os.Getenv("VALKEY_ADDR"),
		SupabaseJWTSecret: os.Getenv("SUPABASE_JWT_SECRET"),
		InternalSecret:    os.Getenv("GO_WS_INTERNAL_SECRET"),
		AllowedOrigins:    origins,
		IsDev:             isDev,
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
