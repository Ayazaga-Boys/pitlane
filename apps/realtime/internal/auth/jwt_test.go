package auth

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const testSecret = "test-secret-32-chars-minimum-len"

func makeToken(sub, secret string, exp time.Time) string {
	claims := jwt.MapClaims{
		"sub":  sub,
		"exp":  exp.Unix(),
		"role": "authenticated",
	}
	token, _ := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(secret))
	return token
}

func TestVerifyValidToken(t *testing.T) {
	token := makeToken("user-123", testSecret, time.Now().Add(time.Hour))
	userID, err := VerifySupabaseJWT(token, testSecret)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if userID != "user-123" {
		t.Errorf("expected user-123, got %s", userID)
	}
}

func TestVerifyExpiredToken(t *testing.T) {
	token := makeToken("user-123", testSecret, time.Now().Add(-time.Hour))
	_, err := VerifySupabaseJWT(token, testSecret)
	if err == nil {
		t.Error("expected error for expired token")
	}
}

func TestVerifyWrongSecret(t *testing.T) {
	token := makeToken("user-123", "wrong-secret-32-chars-minimum-x", time.Now().Add(time.Hour))
	_, err := VerifySupabaseJWT(token, testSecret)
	if err == nil {
		t.Error("expected error for wrong secret")
	}
}

func TestVerifyEmptyToken(t *testing.T) {
	_, err := VerifySupabaseJWT("", testSecret)
	if err == nil {
		t.Error("expected error for empty token")
	}
}

func TestDevBypassEmptySecret(t *testing.T) {
	userID, err := VerifySupabaseJWT("devtoken", "")
	if err != nil {
		t.Fatalf("expected no error in dev bypass, got: %v", err)
	}
	if userID == "" {
		t.Error("expected non-empty userID in dev bypass")
	}
}

func TestDevBypassEmptyToken(t *testing.T) {
	_, err := VerifySupabaseJWT("", "")
	if err == nil {
		t.Error("expected error for empty token in dev bypass")
	}
}
