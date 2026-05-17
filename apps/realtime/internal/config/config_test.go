package config

import (
	"os"
	"testing"
)

func TestLoadDefaults(t *testing.T) {
	os.Clearenv()
	cfg := Load()

	if cfg.Port != "8080" {
		t.Errorf("expected port 8080, got %s", cfg.Port)
	}
	if !cfg.IsDev {
		t.Error("expected IsDev=true in development")
	}
	if len(cfg.AllowedOrigins) != 0 {
		t.Error("expected empty AllowedOrigins by default")
	}
}

func TestLoadFromEnv(t *testing.T) {
	t.Setenv("PORT", "9090")
	t.Setenv("GO_ENV", "production")
	t.Setenv("ALLOWED_ORIGINS", "https://rollpit.com, https://api.rollpit.com")
	t.Setenv("SUPABASE_JWT_SECRET", "test-secret")
	t.Setenv("GO_WS_INTERNAL_SECRET", "internal-secret")
	t.Setenv("VALKEY_ADDR", "localhost:6379")

	cfg := Load()

	if cfg.Port != "9090" {
		t.Errorf("expected 9090, got %s", cfg.Port)
	}
	if cfg.IsDev {
		t.Error("expected IsDev=false in production")
	}
	if len(cfg.AllowedOrigins) != 2 {
		t.Errorf("expected 2 origins, got %d", len(cfg.AllowedOrigins))
	}
	if cfg.AllowedOrigins[0] != "https://rollpit.com" {
		t.Errorf("unexpected origin: %s", cfg.AllowedOrigins[0])
	}
	if cfg.SupabaseJWTSecret != "test-secret" {
		t.Error("expected jwt secret")
	}
	if cfg.InternalSecret != "internal-secret" {
		t.Error("expected internal secret")
	}
}

func TestLoadSingleOrigin(t *testing.T) {
	t.Setenv("GO_ENV", "production")
	t.Setenv("ALLOWED_ORIGINS", "https://rollpit.com")

	cfg := Load()
	if len(cfg.AllowedOrigins) != 1 {
		t.Errorf("expected 1 origin, got %d", len(cfg.AllowedOrigins))
	}
}

func TestLoadEmptyOriginSkipped(t *testing.T) {
	t.Setenv("ALLOWED_ORIGINS", "https://rollpit.com,,https://admin.rollpit.com")

	cfg := Load()
	if len(cfg.AllowedOrigins) != 2 {
		t.Errorf("expected 2 origins (empty skipped), got %d", len(cfg.AllowedOrigins))
	}
}
