# ── Build stage ───────────────────────────────────────────────────────────────
FROM golang:1.25-alpine AS builder

WORKDIR /build

RUN apk add --no-cache build-base

# Bağımlılıkları cache'le — kaynak değişince yeniden indirilmez
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=1 GOOS=linux go build -ldflags="-linkmode external -extldflags '-static' -s -w" -o realtime ./cmd/realtime

# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM scratch

COPY --from=builder /build/realtime /realtime

# Prometheus + WS
EXPOSE 8080

ENTRYPOINT ["/realtime"]
