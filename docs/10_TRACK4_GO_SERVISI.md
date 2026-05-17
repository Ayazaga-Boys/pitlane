# 10 — Track 4: Go Realtime Servisi

---

## Klasör Yapısı

```
apps/realtime/
├── cmd/
│   └── realtime/
│       └── main.go
├── internal/
│   ├── config/
│   │   └── config.go
│   ├── hub/
│   │   ├── hub.go          # Bağlantı yöneticisi
│   │   ├── client.go       # Tek WS bağlantısı
│   │   └── message.go      # İstemci mesaj tipleri
│   ├── location/
│   │   ├── store.go        # Valkey CRUD
│   │   └── broadcaster.go  # H3 bazlı yayın
│   ├── auth/
│   │   └── jwt.go          # Supabase JWT doğrulama
│   └── metrics/
│       └── prometheus.go
├── go.mod
├── go.sum
├── Dockerfile
└── .env.example
```

---

## main.go

```go
// cmd/realtime/main.go
package main

import (
    "context"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"

    "github.com/rollpit/realtime/internal/config"
    "github.com/rollpit/realtime/internal/hub"
    "github.com/rollpit/realtime/internal/location"
    "github.com/rs/zerolog"
    "github.com/rs/zerolog/log"
)

func main() {
    log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})

    cfg := config.Load()
    store := location.NewStore(cfg.ValKeyAddr)
    broadcaster := location.NewBroadcaster(store)
    h := hub.New(cfg, store, broadcaster)

    go h.Run()

    mux := http.NewServeMux()
    mux.HandleFunc("/ws/location", h.ServeWS)
    mux.HandleFunc("/health",      func(w http.ResponseWriter, _ *http.Request) { w.Write([]byte("ok")) })

    srv := &http.Server{
        Addr:         ":" + cfg.Port,
        Handler:      mux,
        ReadTimeout:  10 * time.Second,
        WriteTimeout: 10 * time.Second,
    }

    go func() {
        log.Info().Str("port", cfg.Port).Msg("Realtime service starting")
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatal().Err(err).Msg("Server error")
        }
    }()

    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    srv.Shutdown(ctx)
    log.Info().Msg("Graceful shutdown complete")
}
```

---

## hub.go — Bağlantı Yöneticisi

```go
// internal/hub/hub.go
package hub

import (
    "net/http"
    "sync"
    "time"

    "github.com/gorilla/websocket"
    "github.com/rollpit/realtime/internal/auth"
    "github.com/rollpit/realtime/internal/config"
    "github.com/rollpit/realtime/internal/location"
    "github.com/rs/zerolog/log"
)

const (
    writeWait      = 10 * time.Second
    pongWait       = 60 * time.Second
    pingPeriod     = (pongWait * 9) / 10
    maxMessageSize = 512
    sendBufferSize = 256
)

var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
    CheckOrigin: func(r *http.Request) bool {
        // Production'da origin whitelist ekle
        return true
    },
}

type Hub struct {
    cfg         *config.Config
    store       *location.Store
    broadcaster *location.Broadcaster
    clients     map[string]*Client // userID -> Client
    mu          sync.RWMutex
    register    chan *Client
    unregister  chan *Client
}

func New(cfg *config.Config, store *location.Store, bc *location.Broadcaster) *Hub {
    return &Hub{
        cfg:         cfg,
        store:       store,
        broadcaster: bc,
        clients:     make(map[string]*Client),
        register:    make(chan *Client, 64),
        unregister:  make(chan *Client, 64),
    }
}

func (h *Hub) Run() {
    for {
        select {
        case client := <-h.register:
            h.mu.Lock()
            h.clients[client.userID] = client
            h.mu.Unlock()
            log.Debug().Str("userID", client.userID).Msg("Client registered")

        case client := <-h.unregister:
            h.mu.Lock()
            if _, ok := h.clients[client.userID]; ok {
                delete(h.clients, client.userID)
                close(client.send)
                _ = h.store.DeleteUserCell(nil, client.userID)
            }
            h.mu.Unlock()
            log.Debug().Str("userID", client.userID).Msg("Client unregistered")
        }
    }
}

func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request) {
    token := r.URL.Query().Get("token")
    userID, err := auth.VerifySupabaseJWT(token, h.cfg.SupabaseJWTSecret)
    if err != nil {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Error().Err(err).Msg("WebSocket upgrade failed")
        return
    }

    client := &Client{
        hub:    h,
        conn:   conn,
        userID: userID,
        send:   make(chan []byte, sendBufferSize),
    }

    h.register <- client
    go client.writePump()
    go client.readPump()
}

func (h *Hub) SendToUser(userID string, msg []byte) {
    h.mu.RLock()
    client, ok := h.clients[userID]
    h.mu.RUnlock()
    if ok {
        select {
        case client.send <- msg:
        default:
            // Buffer dolu, mesaj düşürüldü
        }
    }
}
```

---

## client.go

```go
// internal/hub/client.go
package hub

import (
    "context"
    "encoding/json"
    "time"

    "github.com/gorilla/websocket"
    "github.com/rs/zerolog/log"
)

type InboundMessage struct {
    Type   string `json:"type"`
    H3Cell string `json:"h3_cell,omitempty"`
}

type Client struct {
    hub    *Hub
    conn   *websocket.Conn
    userID string
    send   chan []byte
}

func (c *Client) readPump() {
    defer func() {
        c.hub.unregister <- c
        c.conn.Close()
    }()

    c.conn.SetReadLimit(maxMessageSize)
    c.conn.SetReadDeadline(time.Now().Add(pongWait))
    c.conn.SetPongHandler(func(string) error {
        c.conn.SetReadDeadline(time.Now().Add(pongWait))
        return nil
    })

    // Flood koruması
    var msgCount int
    ticker := time.NewTicker(time.Second)
    defer ticker.Stop()

    for {
        _, raw, err := c.conn.ReadMessage()
        if err != nil {
            if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
                log.Warn().Err(err).Str("userID", c.userID).Msg("WS read error")
            }
            return
        }

        select {
        case <-ticker.C:
            msgCount = 0
        default:
        }

        msgCount++
        if msgCount > 10 { // sabit değil: hub.go'da maxMsgPerSecond sabiti olarak tanımla
            log.Warn().Str("userID", c.userID).Msg("Flood detected, closing connection")
            return
        }

        var msg InboundMessage
        if err := json.Unmarshal(raw, &msg); err != nil {
            continue
        }
        c.handleMessage(msg)
    }
}

func (c *Client) handleMessage(msg InboundMessage) {
    ctx := context.Background()
    switch msg.Type {
    case "location":
        if msg.H3Cell == "" { return }
        if err := c.hub.store.SetUserCell(ctx, c.userID, msg.H3Cell); err != nil {
            log.Error().Err(err).Msg("SetUserCell failed")
            return
        }
        c.hub.broadcaster.OnCellUpdate(ctx, c.userID, msg.H3Cell)

    case "ghost_on":
        _ = c.hub.store.DeleteUserCell(ctx, c.userID)

    default:
        log.Debug().Str("type", msg.Type).Msg("Unknown message type")
    }
}

func (c *Client) writePump() {
    ticker := time.NewTicker(pingPeriod)
    defer func() {
        ticker.Stop()
        c.conn.Close()
    }()

    for {
        select {
        case msg, ok := <-c.send:
            c.conn.SetWriteDeadline(time.Now().Add(writeWait))
            if !ok {
                c.conn.WriteMessage(websocket.CloseMessage, []byte{})
                return
            }
            if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
                return
            }

        case <-ticker.C:
            c.conn.SetWriteDeadline(time.Now().Add(writeWait))
            if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
                return
            }
        }
    }
}
```

---

## location/store.go

```go
// internal/location/store.go
package location

import (
    "context"
    "fmt"
    "time"

    "github.com/redis/go-redis/v9"
)

const locationTTL = 5 * time.Minute

type Store struct {
    rdb *redis.Client
}

func NewStore(addr string) *Store {
    rdb := redis.NewClient(&redis.Options{Addr: addr})
    return &Store{rdb: rdb}
}

func (s *Store) SetUserCell(ctx context.Context, userID, h3Cell string) error {
    key := fmt.Sprintf("loc:user:%s", userID)
    return s.rdb.Set(ctx, key, h3Cell, locationTTL).Err()
}

func (s *Store) GetUserCell(ctx context.Context, userID string) (string, error) {
    key := fmt.Sprintf("loc:user:%s", userID)
    return s.rdb.Get(ctx, key).Result()
}

func (s *Store) DeleteUserCell(ctx context.Context, userID string) error {
    key := fmt.Sprintf("loc:user:%s", userID)
    return s.rdb.Del(ctx, key).Err()
}

// H3 res-8 hücresindeki kullanıcı sayısını artır
func (s *Store) IncrCellCount(ctx context.Context, h3Cell8 string) error {
    key := fmt.Sprintf("heat:cell:%s", h3Cell8)
    pipe := s.rdb.Pipeline()
    pipe.Incr(ctx, key)
    pipe.Expire(ctx, key, locationTTL)
    _, err := pipe.Exec(ctx)
    return err
}

// Heatmap verisi: tüm heat:cell:* anahtarları
func (s *Store) GetHeatmap(ctx context.Context) (map[string]int64, error) {
    keys, err := s.rdb.Keys(ctx, "heat:cell:*").Result()
    if err != nil {
        return nil, err
    }
    result := make(map[string]int64, len(keys))
    for _, key := range keys {
        val, err := s.rdb.Get(ctx, key).Int64()
        if err != nil { continue }
        cell := key[len("heat:cell:"):]
        result[cell] = val
    }
    return result, nil
}
```

---

## location/broadcaster.go

```go
// internal/location/broadcaster.go
package location

import (
    "context"
    "encoding/json"

    "github.com/uber/h3-go/v4"
    "github.com/rs/zerolog/log"
)

const (
    h3ResHeatmap   = 8
    h3ResProximity = 9
    kRingRadius    = 2
)

type Broadcaster struct {
    store *Store
}

func NewBroadcaster(store *Store) *Broadcaster {
    return &Broadcaster{store: store}
}

type HeatmapUpdate struct {
    Type    string         `json:"type"`
    Cells   map[string]int64 `json:"cells"`
}

func (b *Broadcaster) OnCellUpdate(ctx context.Context, userID, h3Cell9 string) {
    // res-9 → res-8 parent hücre
    parent := h3.CellToParent(h3.Cell(h3Cell9), h3ResHeatmap)
    if err := b.store.IncrCellCount(ctx, parent.String()); err != nil {
        log.Error().Err(err).Msg("IncrCellCount failed")
    }

    // k-ring içindeki kullanıcılara güncelleme yayınla
    // Bu kısım production'da Pub/Sub ile genişletilir
    b.publishHeatmapUpdate(ctx)
}

func (b *Broadcaster) publishHeatmapUpdate(ctx context.Context) {
    heatmap, err := b.store.GetHeatmap(ctx)
    if err != nil {
        log.Error().Err(err).Msg("GetHeatmap failed")
        return
    }
    update := HeatmapUpdate{Type: "heatmap_update", Cells: heatmap}
    _, err = json.Marshal(update)
    if err != nil { return }
    // TODO: Valkey Pub/Sub kanalına yayınla → hub abone istemcilere iletir
}
```

---

## auth/jwt.go — Supabase JWT Doğrulama

```go
// internal/auth/jwt.go
package auth

import (
    "errors"
    "fmt"

    "github.com/golang-jwt/jwt/v5"
)

type SupabaseClaims struct {
    Sub   string `json:"sub"`
    Email string `json:"email"`
    Role  string `json:"role"`
    jwt.RegisteredClaims
}

func VerifySupabaseJWT(tokenStr, secret string) (string, error) {
    token, err := jwt.ParseWithClaims(tokenStr, &SupabaseClaims{}, func(t *jwt.Token) (any, error) {
        if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
        }
        return []byte(secret), nil
    })
    if err != nil {
        return "", err
    }

    claims, ok := token.Claims.(*SupabaseClaims)
    if !ok || !token.Valid || claims.Sub == "" {
        return "", errors.New("invalid token claims")
    }

    return claims.Sub, nil
}
```

---

## go.mod

```
module github.com/rollpit/realtime

go 1.22

require (
    github.com/golang-jwt/jwt/v5     v5.2.1
    github.com/gorilla/websocket     v1.5.1
    github.com/redis/go-redis/v9     v9.5.1
    github.com/rs/zerolog            v1.32.0
    github.com/spf13/viper           v1.18.2
    github.com/stretchr/testify      v1.9.0
    github.com/uber/h3-go/v4         v4.1.0
)
```

---

## Dockerfile

```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /realtime ./cmd/realtime

FROM gcr.io/distroless/static-debian12
COPY --from=builder /realtime /realtime
EXPOSE 8080
ENTRYPOINT ["/realtime"]
```

---

## Kapasite Planlaması

| Senaryo | Bağlantı | RAM (tahmini) |
|---|---|---|
| Beta (500 kullanıcı) | 500 WS | ~50 MB |
| Launch (5k eşzamanlı) | 5.000 WS | ~500 MB |
| Büyüme (50k eşzamanlı) | 50.000 WS | ~2.5 GB (çoklu instance) |

- Fly.io `performance-2x` (2 vCPU, 4 GB): ~20k bağlantı/instance.
- 50k+ için Fly.io auto-scale + Valkey Cluster.