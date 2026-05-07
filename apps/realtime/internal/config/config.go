package config

import "os"

type Config struct {
	Port              string
	ValkeyAddr        string
	SupabaseJWTSecret string
}

func Load() Config {
	return Config{
		Port:              getEnv("PORT", "8080"),
		ValkeyAddr:        os.Getenv("VALKEY_ADDR"),
		SupabaseJWTSecret: os.Getenv("SUPABASE_JWT_SECRET"),
	}
}

func getEnv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
