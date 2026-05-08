# ── Build stage ───────────────────────────────────────────────────────────────
FROM golang:1.23-alpine AS builder

WORKDIR /build

# Bağımlılıkları cache'le — kaynak değişince yeniden indirilmez
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o realtime ./cmd/realtime

# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM scratch

COPY --from=builder /build/realtime /realtime

# Prometheus + WS
EXPOSE 8080

ENTRYPOINT ["/realtime"]
