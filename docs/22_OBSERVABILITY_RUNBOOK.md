# 22 — Observability & Runbook

> Rollpit'i çalışır halde tutmak için: log mimarisi, Sentry kuralları, alarm runbook'ları,
> on-call rotasyonu, dashboard listesi, SLO/SLA tanımları.

---

## 1. Üç Pilar: Logs / Metrics / Traces

| Pilar | Sistem | Saklama | Kullanım |
|---|---|---|---|
| **Logs** | Axiom (structured, JSON) | 30 gün hot, 90 gün soft | Hata sebebi, debug |
| **Metrics** | Prometheus (Go) + Fly.io metrics + PostHog (ürün) | 6 ay | Trend, dashboard |
| **Traces** | Sentry Performance | 30 gün | P95 yavaşlık, N+1 |
| **Sentry Errors** | Sentry | 90 gün | Crash, exception |

---

## 2. Log Yapısı (Yapısal Logging)

### Backend (Pino)

```typescript
// src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: {
    service: 'rollpit-api',
    env:     process.env.NODE_ENV,
    version: process.env.GIT_SHA,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
    censor: '[REDACTED]',
  },
});
```

### Standart Log Alanları

```json
{
  "ts":         "2026-05-07T10:23:45.123Z",
  "level":      "info",
  "service":    "rollpit-api",
  "env":        "production",
  "version":    "abc1234",
  "userId":     "uuid",
  "requestId":  "ulid",
  "path":       "/v1/flares",
  "method":     "POST",
  "statusCode": 201,
  "durationMs": 87,
  "msg":        "flare_created",
  "flareId":    "uuid"
}
```

### Go Servisi (zerolog)

```go
// internal/logger/logger.go
log := zerolog.New(os.Stdout).
    With().
    Timestamp().
    Str("service", "rollpit-realtime").
    Str("version", os.Getenv("GIT_SHA")).
    Logger()
```

### Log Seviyesi Politikası

| Seviye | Ne zaman? |
|---|---|
| `trace` | Geliştirme için detaylı (üretim'de kapalı) |
| `debug` | Akış izleme (`LOG_LEVEL=debug` ile aktif) |
| `info` | Normal olaylar: oluşturma, güncelleme, başarılı işlem |
| `warn` | Beklenen ama dikkat gerektiren durum (rate limit, retry) |
| `error` | Beklenmedik hata, ama servis çalışmaya devam ediyor |
| `fatal` | Servis çökmek üzere (graceful shutdown öncesi) |

### Hassas Alan Filtreleme

`Authorization`, `Cookie`, `password`, `*.token`, `email` (warn üstünde) maskelenir.

---

## 3. Sentry Kuralları

### Proje Ayrımı

| Proje | DSN env | Platform |
|---|---|---|
| `rollpit-mobile` | `SENTRY_DSN_MOBILE` | Flutter (iOS+Android) |
| `rollpit-api` | `SENTRY_DSN_API` | Node Backend |
| `rollpit-realtime` | `SENTRY_DSN_REALTIME` | Go |
| `rollpit-admin` | `SENTRY_DSN_ADMIN` | Next.js |

### Tag'ler & Konteks

Her event'te:
- `user.id` (PII'siz, sadece UUID)
- `release` (build number)
- `environment` (development / staging / production)
- `app.flow` (örn. "create_flare", "send_help")
- `app.feature_flag.<name>` (aktif feature flag'ler)

```typescript
Sentry.setTag('app.flow', 'create_flare');
Sentry.setUser({ id: userId });
```

### PII Filtreleme

```typescript
Sentry.init({
  beforeSend(event) {
    // E-posta, IP yi kaldır
    if (event.user) {
      event.user.email = undefined;
      event.user.ip_address = undefined;
    }
    // Hassas header'lar
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }
    // Konum verisi
    if (event.contexts?.app) {
      delete (event.contexts.app as any).h3_cell;
    }
    return event;
  },
});
```

### Breadcrumb Kapsamı

- HTTP request/response (URL, status, süre — body değil)
- Konsol logları
- Navigation (sayfa geçişleri)
- Custom: `Sentry.addBreadcrumb({ category: 'realtime', message: 'WS reconnect attempt 3' })`

### Sample Rate

| Ortam | error | tracesSampleRate | profilesSampleRate |
|---|---|---|---|
| development | 1.0 | 1.0 | 0.1 |
| staging | 1.0 | 0.5 | 0.1 |
| production | 1.0 | 0.1 (mobil), 0.05 (backend) | 0.05 |

---

## 4. Metrik Kataloğu

### Sistem Metrikleri (Otomatik — Fly.io / Prometheus)

| Metrik | Birim | Eşik (alarm) |
|---|---|---|
| `cpu_usage_percent` | % | > 80 (5 dk) |
| `memory_usage_percent` | % | > 85 (5 dk) |
| `request_rate` | req/sn | bilgi |
| `request_p95_ms` | ms | > 800 (5 dk) |
| `error_rate_5xx` | % | > 1 (5 dk) |
| `db_pool_utilization` | % | > 70 (5 dk) |

### Go Realtime Servisi Özel Metrikler

```go
// internal/metrics/prometheus.go
var (
    wsConnectionsTotal = prometheus.NewCounter(prometheus.CounterOpts{
        Name: "rollpit_ws_connections_total",
        Help: "Toplam WS bağlantı sayısı (cumulative)",
    })
    wsActiveConnections = prometheus.NewGauge(prometheus.GaugeOpts{
        Name: "rollpit_ws_active_connections",
        Help: "Anlık aktif WS bağlantı sayısı",
    })
    locationUpdateLatencyMs = prometheus.NewHistogram(prometheus.HistogramOpts{
        Name:    "rollpit_location_update_latency_ms",
        Help:    "Konum güncelleme latency (Valkey set)",
        Buckets: prometheus.LinearBuckets(1, 5, 20),
    })
    heatmapBroadcastLatencyMs = prometheus.NewHistogram(prometheus.HistogramOpts{
        Name:    "rollpit_heatmap_broadcast_latency_ms",
        Help:    "Heatmap update yayın latency",
    })
)
```

### Ürün Metrikleri (PostHog)

| Event | Tetik | Properties |
|---|---|---|
| `app_opened` | Cold start | `version`, `platform` |
| `signup_completed` | Profil tamamlandı | `vehicle_count`, `auth_method` |
| `flare_created` | POST /flares 201 | `community_linked`, `has_cover` |
| `help_requested` | POST /help 201 | `issue_type`, `time_to_first_response` |
| `help_responded` | PATCH /help respond | `time_to_response_seconds` |
| `dm_sent` | POST /messages/dms 201 | `message_length_bucket` |
| `community_joined` | POST /communities/join | `community_type` |
| `media_uploaded` | finalize ok | `asset_type`, `size_bytes_bucket` |
| `notification_received` | FCM/APNs alındı | `category` |
| `notification_opened` | Tap | `category`, `time_to_open` |

---

## 5. Dashboard'lar

### D1 — System Health (Fly.io / Grafana)

- CPU, RAM, disk per instance
- Request rate + P95 latency (her servis)
- Error rate (5xx)
- Active WS connections
- Postgres pool utilization
- Valkey ops/sec

### D2 — Product Health (PostHog)

- DAU / MAU (rolling)
- 7-gün retention curve
- Funnel: open → signup → first flare
- Notification CTR (kategori bazında)
- Feature flag conversion (varsa A/B)

### D3 — Help Critical Path

- Açık yardım sayısı (real-time)
- Ortalama yanıt süresi (son 24 saat)
- Çözüldü oranı (son 7 gün)
- "Helper" başına ortalama yardım

### D4 — Pin & İşletme

- Doğrulanmış pin sayısı
- Bekleyen pin sayısı
- Aktif kampanya sayısı
- Pin tıklama / yol tarifi tıklama

### D5 — Moderasyon (Admin Panel İçinde)

- Bekleyen şikayet
- Ortalama triaj süresi
- Aksiyon dağılımı (silme, suspend, ban)
- Tekrar şikayet oranı

---

## 6. SLO / SLA Hedefleri

### Service Level Objectives (Internal)

| Servis | SLO | Hedef |
|---|---|---|
| API uptime | %99.9 (aylık) | < 43 dk downtime/ay |
| WS uptime | %99.5 (aylık) | < 3.5 saat downtime/ay |
| Help notification delivery | %99 (5 sn içinde) | — |
| API P95 latency | < 300 ms | — |
| Crash-free users | %99.5 | App Store şartı |

### Service Level Agreements (External — İşletmeler)

İşletme planı alan müşterilerle:
- Pin görünürlük uptime: %99.5
- Kampanya yayın gecikmesi: < 2 dk
- Destek yanıt süresi: 24 saat (iş günü)

---

## 7. Alarm Kuralları

### Sentry → Slack `#alerts-prod`

| Alarm | Eşik | Bildirim |
|---|---|---|
| Yeni unhandled error | İlk görünüm | Slack + e-posta |
| Crash rate | > %0.5 (saat) | Slack + PagerDuty |
| `INTERNAL_ERROR` | > 10/dk | Slack |
| `UNAUTHORIZED` | > 50/dk (saldırı işareti) | Slack + e-posta |

### Fly.io / Prometheus → Slack

| Alarm | Eşik | Bildirim |
|---|---|---|
| API P95 latency | > 800 ms (5 dk) | Slack |
| API 5xx rate | > %1 (5 dk) | Slack + PagerDuty |
| Memory > %85 | 5 dk | Slack |
| WS bağlantı düşüşü | > %20 anlık | Slack + PagerDuty |
| Health check fail | 3 ardışık | PagerDuty (P1) |
| DB pool full | %95 | Slack |

### Custom Business Alarms

| Alarm | Eşik |
|---|---|
| Açık yardım talebi yanıtsız | > 30 dk |
| Push delivery failure | > %5 (1 saat) |
| Sign-up rate düşüşü | > %50 düşüş (gün-gün karşılaştırma) |

---

## 8. On-Call Rotasyonu

### Rotasyon

- Haftalık döngü (Pazartesi 09:00 → bir sonraki Pazartesi 09:00)
- Birincil + ikincil kişi (yedek)
- Tüm geliştiriciler dahil (3 kişi → 3 hafta arada)

### Yanıt Süresi (Mesai İçi vs Dışı)

| Kategori | Mesai içi | Mesai dışı |
|---|---|---|
| P0 (servis tamamen down) | 15 dk | 30 dk |
| P1 (kritik özellik bozuk) | 30 dk | 1 saat |
| P2 (kısmi degradasyon) | 2 saat | Sabah |
| P3 (cosmetic) | 24 saat | Sabah |

### Araçlar

- **PagerDuty** (P0/P1)
- **Slack** (#alerts-prod, #alerts-staging)
- **Notion** (incident log)

---

## 9. Runbook Şablonları

### RB-001 — API Servisi Down

**Belirtiler:**
- Health check failing (Fly.io)
- 5xx rate > %50

**İlk 5 Dakika:**
1. Fly.io status'a bak: `fly status --app rollpit-api`
2. Logs'a bak: `fly logs --app rollpit-api`
3. Sentry'de yeni `unhandled error` var mı?
4. Son deploy 30 dk içinde miydi? → Rollback hazırla.

**Karar Akışı:**
```
Yeni deploy mu? ──Evet──▶ fly releases rollback --app rollpit-api
       │
       Hayır
       │
       ▼
Database mi down? ──Evet──▶ Supabase status sayfası, ticket aç
       │
       Hayır
       │
       ▼
Resource limit mi? ──Evet──▶ fly scale memory 4096
       │
       Hayır
       │
       ▼
fly machine restart, logs ile gözle
```

### RB-002 — WebSocket Servisi Bağlantı Kopması

**Belirtiler:**
- `wsActiveConnections` ani düşüş
- Kullanıcı şikayeti: "Harita güncellenmiyor"

**Adımlar:**
1. Fly.io: `fly status --app rollpit-realtime`
2. Valkey bağlantısı: `redis-cli -h <upstash-url> ping`
3. Log: `fly logs --app rollpit-realtime | grep ERROR`
4. Eğer Valkey down: Upstash dashboard, status check
5. Restart: `fly machine restart --app rollpit-realtime`
6. Müşteriye banner: "Gerçek zamanlı veri sınırlı"

### RB-003 — Acil Yardım Bildirimleri Çalışmıyor

**Belirtiler:**
- "Yardım yakında" push gelmiyor (kullanıcı şikayeti)
- Trigger.dev dashboard: failed jobs

**Adımlar:**
1. Trigger.dev dashboard → `send-help-notification` task
2. Hata stack trace'e bak
3. FCM credentials geçerli mi? (`firebase-admin auth`)
4. APNs sertifikası süresi? (yıllık yenileme)
5. Eğer Trigger.dev down: backup path → backend doğrudan FCM/APNs çağırsın (feature flag)

### RB-004 — Toplu Spam Saldırısı

**Belirtiler:**
- `help_requested` event spike
- Şikayet artışı
- Bot benzeri pattern

**Adımlar:**
1. Audit logs analiz: tek IP / cihaz mı?
2. Geçici rate limit indir (`max_help_per_user_hour: 1`)
3. Şüpheli kullanıcıları geçici suspend
4. Captcha ekleme planı (Faz 2)
5. Etkilenen kullanıcılara düzeltme bildirimi

### RB-005 — Cloudflare R2 / Images Down

**Belirtiler:**
- Medya yükleme başarısız
- Görsel render olmuyor (`<img src>` 404)

**Adımlar:**
1. Cloudflare status sayfası
2. R2 bucket policy'si değişti mi?
3. API anahtarları süresi?
4. Geçici fallback: medya yükleme disabled, kullanıcıya banner.

### RB-006 — Supabase Postgres Down

**Belirtiler:**
- `connection refused` API loglarında
- API 500 rate %100

**Adımlar:**
1. Supabase status (status.supabase.com)
2. Compute upgrade gerekli mi? (`Read replica` aktif mi?)
3. Bekleme + Supabase support ticket
4. Maintenance modu aktive et: backend `503 SERVICE_UNAVAILABLE` döndürsün
5. Mobile app `connectivity_plus` ile maintenance banner gösterir

---

## 10. Incident Yönetimi (Bağlantı: 23_INCIDENT_RUNBOOK.md)

Bu dosya **operasyonel** runbook. Major incident süreci, post-mortem şablonu ve iletişim planı için `23_INCIDENT_RUNBOOK.md`'ye bakın.

---

## 11. Maintenance Modu

Backend bir env değişkeni ile maintenance moduna alınabilir:

```typescript
// src/middleware/maintenance.ts
export async function maintenanceCheck(c: Context, next: Next) {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return c.json({
      error: 'Hizmet bakımda. Birazdan tekrar dener misin?',
      code:  'SERVICE_UNAVAILABLE',
    }, 503);
  }
  await next();
}
```

Mobile app `503` görünce kullanıcıya tam ekran bakım modu gösterir, retry butonu sunar.

---

## 12. Veri Tutma & Anomali Tespiti

### Anormal Değişim Tespiti

PostHog `Insights → Trend` kullanarak haftalık baseline'a göre:
- DAU > %30 düşüş → Slack alert
- Crash rate > %50 artış → Slack alert
- Push CTR > %50 düşüş → Slack alert

### Otomatik Backup

- Supabase: günlük tam yedek + 7 gün PITR.
- R2: cross-region replication (eu-west-1 + eu-central-1).
- Code: GitHub (zaten yedekli).

---

## 13. Periyodik Sağlık Kontrolü

### Haftalık Pazartesi Toplantısı

- Geçen haftanın incident özeti
- Açık alarm sayısı (Sentry, PagerDuty)
- SLO ihlali varsa kök sebep
- On-call yorgunluğu (kaç kez çağrıldı, kaç kez gece)

### Aylık

- SLO performans raporu
- Capacity planning (büyüme tahmini)
- Disaster recovery drill (3 ayda bir)

### Çeyreklik

- Kaos testi (Fly.io machine kill, Postgres failover simülasyonu)
- 3rd party SLA review
- Maliyet optimizasyonu

---

## 14. Loglama Best Practice

```
✅ DOĞRU: logger.info({ flareId: '...', userId: '...' }, 'flare_created');
❌ YANLIŞ: console.log('Flare created with id ' + flareId);

✅ DOĞRU: logger.error({ err, userId }, 'failed_to_send_push');
❌ YANLIŞ: try { ... } catch (e) {} // sessizce yutma

✅ DOĞRU: Yapısal alanlar (key/value), aramaya elverişli
❌ YANLIŞ: Long format text, regex olmadan filtrelenemez

✅ DOĞRU: Hassas veriler redacted
❌ YANLIŞ: Authorization header logged
```
