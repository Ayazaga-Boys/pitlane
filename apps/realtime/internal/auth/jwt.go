package auth

import (
	"errors"
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

type supabaseClaims struct {
	Sub  string `json:"sub"`
	Role string `json:"role"`
	jwt.RegisteredClaims
}

// VerifySupabaseJWT — Supabase JWT'yi doğrular, userID döndürür.
// secret boşsa (geliştirme ortamı) mock userID döndürür.
func VerifySupabaseJWT(tokenStr, secret string) (string, error) {
	if secret == "" {
		// Geliştirme modunda JWT doğrulama atlanır
		if tokenStr == "" {
			return "", errors.New("token required")
		}
		return "dev-user-" + tokenStr[:min(8, len(tokenStr))], nil
	}

	token, err := jwt.ParseWithClaims(tokenStr, &supabaseClaims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(secret), nil
	})
	if err != nil {
		return "", err
	}

	claims, ok := token.Claims.(*supabaseClaims)
	if !ok || !token.Valid || claims.Sub == "" {
		return "", errors.New("invalid token claims")
	}
	return claims.Sub, nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
