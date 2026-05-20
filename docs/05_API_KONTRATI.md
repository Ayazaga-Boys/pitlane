# 05 — API Kontratı

> Base URL: `https://api.rollpit.com/v1`
> Her endpoint JWT Bearer token gerektirir (aksi belirtilmediği sürece).
> Hata modeli: `{ "error": string, "code": string, "details"?: any }`
> Başarı modeli: `{ "data": T, "meta"?: PaginationMeta }`

---

## Kimlik Doğrulama (Supabase Auth — proxy değil, doğrudan)

Flutter, Supabase Flutter SDK ile doğrudan Supabase Auth uç noktalarını kullanır.
Backend sadece Supabase'in döndürdüğü JWT'yi doğrular.

| İşlem | Yöntem |
|---|---|
| Kayıt / Giriş (e-posta+OTP) | `supabase.auth.signInWithOtp()` |
| Apple ile giriş | `supabase.auth.signInWithIdToken()` |
| Google ile giriş | `supabase.auth.signInWithIdToken()` |
| Çıkış | `supabase.auth.signOut()` |
| Token yenileme | `supabase.auth.refreshSession()` — otomatik |

---

## Profil

```
GET    /v1/profiles/me                 — Kendi profilim
GET    /v1/profiles/:username          — Public profil
PATCH  /v1/profiles/me                 — Kendi profilini güncelle
DELETE /v1/profiles/me                 — 30 günlük hesap silme penceresi başlat (KVKK/GDPR)
POST   /v1/profiles/me/deletion/cancel — Hesap silme penceresini iptal et
POST   /v1/profiles/me/ghost-mode      — Hayalet mod toggle
GET    /v1/profiles/me/vehicles        — Araç listesi
POST   /v1/profiles/me/vehicles        — Araç ekle
PATCH  /v1/profiles/me/vehicles/:id    — Araç güncelle
DELETE /v1/profiles/me/vehicles/:id    — Araç sil
GET    /v1/profiles/me/export          — Veri dışa aktarma JSON arşivi için 48 saatlik indirme URL'i
```

### GET /v1/profiles/me/export — Response

```typescript
type UserExportResponse = {
  data: {
    generated_at: string;
    expires_at: string;  // generated_at + 48 saat
    storage_key: string; // R2 private key
    download_url: string; // Presigned GET URL
  };
};
```

`download_url` içindeki JSON arşiv `profile`, `vehicles`, `communities`, `flares`, `business_pins`,
`help_requests`, `messages`, `media_assets`, `reports`, `notifications`, `blocks` ve `push_devices`
alanlarını içerir. R2 yapılandırılmamışsa endpoint `503 SERVICE_UNAVAILABLE` döner.

### PATCH /v1/profiles/me — Zod Şeması

```typescript
const UpdateProfileSchema = z.object({
  display_name: z.string().min(2).max(50).optional(),
  bio:          z.string().max(300).optional(),
  avatar_url:   z.string().url().optional(),
  ghost_mode:   z.boolean().optional(),
  notification_prefs: z.object({
    help_nearby: z.boolean().optional(),
    help_helper_arrived: z.boolean().optional(),
    flare_invite: z.boolean().optional(),
    flare_starting: z.boolean().optional(),
    dm_new: z.boolean().optional(),
    community_message: z.boolean().optional(),
    community_invite: z.boolean().optional(),
    system: z.boolean().optional(),
    quiet_hours_start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    quiet_hours_end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  }).optional(),
});
```

### DELETE /v1/profiles/me — Zod Şeması

```typescript
const DeleteProfileSchema = z.object({
  reason: z.string().trim().max(300).optional(),
}).default({});
```

### DELETE /v1/profiles/me — Response

```typescript
type DeleteProfileResponse = {
  data: {
    id: string;
    deletion_requested_at: string;
    delete_after: string; // deletion_requested_at + 30 gün
    ghost_mode: true;
  };
};
```

### POST /v1/profiles/me/deletion/cancel — Response

```typescript
type CancelProfileDeletionResponse = {
  data: {
    id: string;
    deletion_requested_at: null;
    delete_after: null;
    ghost_mode: boolean;
  };
};
```

### POST /v1/profiles/me/vehicles — Zod Şeması

```typescript
const CreateVehicleSchema = z.object({
  type:       z.enum(['car','motorcycle','other']),
  make:       z.string().min(1).max(60),
  model:      z.string().min(1).max(60),
  year:       z.number().int().min(1885).max(2100).optional(),
  color:      z.string().max(40).optional(),
  photo_url:  z.string().url().optional(),
  is_primary: z.boolean().default(false),
});
```

---

## Harita & Konum

```
GET  /v1/map/heatmap?bounds=<h3cells>   — H3 yoğunluk haritası (res-8)
GET  /v1/map/flares?h3cell=<cell>&k=2   — Yakındaki flare'ler (k-ring)
GET  /v1/map/pins?h3cell=<cell>&k=3     — Yakındaki işletme pinleri
GET  /v1/map/help?h3cell=<cell>&k=2     — Açık yardım talepleri
```

### GET /v1/map/heatmap — Response

```typescript
type HeatmapResponse = {
  data: Array<{
    h3_cell:    string;  // res-8
    user_count: number;
  }>;
};
```

> Not: Canlı konum güncellemeleri HTTP değil, Go WebSocket servisi üzerinden gelir.
> WebSocket protokolünün tam detayı bu dosyanın altındaki "WebSocket Kontratı" bölümündedir.

---

## Topluluklar

```
GET    /v1/communities?city=&type=&q=        — Liste (paginated)
POST   /v1/communities                       — Oluştur
GET    /v1/communities/:slug                 — Detay
PATCH  /v1/communities/:id                   — Güncelle (kaptan)
DELETE /v1/communities/:id                   — Sil (kaptan)
POST   /v1/communities/:id/join              — Katıl
DELETE /v1/communities/:id/leave             — Ayrıl
GET    /v1/communities/:id/members           — Üye listesi
PATCH  /v1/communities/:id/members/:userId   — Rol güncelle (moderatör+)
DELETE /v1/communities/:id/members/:userId   — Üyeyi çıkar (moderatör+)
```

### POST /v1/communities — Zod Şeması

```typescript
const CreateCommunitySchema = z.object({
  name:         z.string().min(3).max(60),
  slug:         z.string().regex(/^[a-z0-9-]{3,40}$/),
  description:  z.string().max(500).optional(),
  type:         z.enum(['public','private','secret']).default('public'),
  vehicle_type: z.enum(['car','motorcycle','all']).default('all'),
  city:         z.string().max(80).optional(),
  cover_url:    z.string().url().optional(),
});
```

---

## Flares (Etkinlikler)

```
GET    /v1/flares?h3cell=&k=&community_id=   — Liste
POST   /v1/flares                            — Oluştur
GET    /v1/flares/:id                        — Detay
PATCH  /v1/flares/:id                        — Güncelle (oluşturan)
DELETE /v1/flares/:id                        — İptal et (oluşturan)
POST   /v1/flares/:id/rsvp                   — RSVP
DELETE /v1/flares/:id/rsvp                   — RSVP iptal
GET    /v1/flares/:id/attendees              — Katılımcı listesi
```

### POST /v1/flares — Zod Şeması

```typescript
const CreateFlareSchema = z.object({
  title:        z.string().min(3).max(80),
  description:  z.string().max(500).optional(),
  h3_cell:      z.string().regex(/^[0-9a-f]{15}$/i),
  starts_at:    z.string().datetime(),
  ends_at:      z.string().datetime().optional(),
  community_id: z.string().uuid().optional(),
  cover_url:    z.string().url().optional(),
});
```

---

## İşletme Pinleri

```
GET    /v1/pins?h3cell=&k=&category=    — Yakındaki pinler
POST   /v1/pins                         — Pin oluştur (doğrulanmış işletme)
GET    /v1/pins/:id                     — Detay
PATCH  /v1/pins/:id                     — Güncelle (sahip)
POST   /v1/pins/:id/campaign            — Kampanya başlat
DELETE /v1/pins/:id/campaign            — Kampanyayı sonlandır
POST   /v1/pins/:id/tax-document/upload-url — Vergi belgesi için R2 upload URL
POST   /v1/pins/:id/tax-document/finalize   — Vergi belgesini pending doğrulamaya al
```

### POST /v1/pins — Zod Şeması

```typescript
const CreatePinSchema = z.object({
  name:      z.string().min(2).max(80),
  category:  z.enum(['garage','repair','parts','fuel','cafe','other']),
  h3_cell:   z.string().regex(/^[0-9a-f]{15}$/i),
  address:   z.string().max(200).optional(),
  phone:     z.string().max(20).optional(),
  website:   z.string().url().optional(),
  logo_url:  z.string().url().optional(),
  cover_url: z.string().url().optional(),
});
```

### POST /v1/pins/:id/campaign — Zod Şeması

```typescript
const StartCampaignSchema = z.object({
  campaign_text:    z.string().min(8).max(200),
  campaign_ends_at: z.string().datetime(),
});
```

### POST /v1/pins/:id/tax-document/upload-url — Zod Şeması

```typescript
const TaxDocumentUploadUrlSchema = z.object({
  filename: z.string().min(1).max(200),
  content_type: z.enum(['application/pdf','image/jpeg','image/png','image/webp']),
  size_bytes: z.number().int().positive().max(15 * 1024 * 1024),
});
```

Response: `upload_url`, `storage_key`, `expires_in_seconds`. Client dosyayı doğrudan R2'ye PUT eder.

### POST /v1/pins/:id/tax-document/finalize — Zod Şeması

```typescript
const TaxDocumentFinalizeSchema = z.object({
  storage_key: z.string().min(1).max(500),
  content_type: z.enum(['application/pdf','image/jpeg','image/png','image/webp']),
});
```

Backend R2 `HEAD` doğrulaması yapar. Obje yoksa `409 UPLOAD_NOT_FOUND`, R2 hatasında
`502 DOWNSTREAM_ERROR` döner. Başarılı olursa `business_pins.verification_status = 'pending'`
ve `is_verified = false` set edilir. Admin panel doğrulama sonrası `verified/rejected` durumuna taşır.

---

## Acil Yardım

```
POST   /v1/help                 — Yardım talebi aç
GET    /v1/help/:id             — Detay
PATCH  /v1/help/:id/respond     — Yardım et (helper_id set)
PATCH  /v1/help/:id/resolve     — Çözüldü olarak işaretle
PATCH  /v1/help/:id/cancel      — İptal et (requester)
GET    /v1/help/my              — Kendi taleplerim
```

### POST /v1/help — Zod Şeması

```typescript
const CreateHelpSchema = z.object({
  h3_cell:    z.string().regex(/^[0-9a-f]{15}$/i),
  issue_type: z.enum(['breakdown','flat_tire','fuel','accident','other']),
  description:z.string().max(300).optional(),
  vehicle_id: z.string().uuid().optional(),
});
```

---

## Mesajlaşma

```
GET  /v1/messages/dms                          — DM listesi (son mesajlar)
GET  /v1/messages/dms/:peerId                  — DM geçmişi (paginated)
POST /v1/messages/dms/:peerId                  — DM gönder
GET  /v1/messages/communities/:id              — Topluluk mesajları
POST /v1/messages/communities/:id              — Topluluk mesajı gönder
GET  /v1/messages/flares/:id                   — Flare sohbeti
POST /v1/messages/flares/:id                   — Flare mesajı gönder
GET  /v1/messages/help/:id                     — Yardım sohbeti
POST /v1/messages/help/:id                     — Yardım mesajı gönder
DELETE /v1/messages/:id                        — Mesaj sil (soft delete)
```

> Gerçek zamanlı mesajlar Supabase Realtime (`messages` tablosuna subscribe) üzerinden gelir.
> HTTP endpoint'ler sadece ilk yükleme ve gönderme içindir.

### POST /v1/messages/dms/:peerId — Zod Şeması

```typescript
const SendMessageSchema = z.object({
  body:       z.string().max(2000).optional(),
  media_url:  z.string().url().optional(),
  media_type: z.enum(['image','video','audio']).optional(),
}).refine(d => d.body || d.media_url, {
  message: 'body veya media_url zorunlu',
});
```

---

## Medya

```
POST   /v1/media/upload-url      — Presigned URL al
POST   /v1/media/finalize        — Yükleme tamamla, DB'ye kaydet
GET    /v1/media/:id             — Medya meta verisi
DELETE /v1/media/:id             — Sil (sahip)
POST   /v1/media/webhook/stream  — Cloudflare Stream webhook (auth=imza)
```

### POST /v1/media/upload-url — Request/Response

```typescript
// Request
const UploadUrlSchema = z.object({
  filename:     z.string().max(200),
  content_type: z.enum(['image/jpeg','image/png','image/webp','video/mp4']),
  asset_type:   z.enum(['photo','video']),
  size_bytes:   z.number().int().max(100 * 1024 * 1024), // 100 MB limit
});

// Response
type UploadUrlResponse = {
  data: {
    upload_url:  string;  // Presigned URL (5 dakika geçerli)
    asset_id:    string;  // media_assets.id (UUID)
    storage_key: string;
  };
};
```

### POST /v1/media/finalize — Zod Şeması

```typescript
const FinalizeSchema = z.object({
  asset_id: z.string().uuid(),
});
```

Not: Backend finalize sırasında R2 `HEAD` doğrulaması yapar. Obje bulunamazsa `409 UPLOAD_NOT_FOUND`, R2 erişim hatasında `502 DOWNSTREAM_ERROR` döner. `CF_IMAGES_API_TOKEN` tanımlıysa fotoğraflar Cloudflare Images'a URL import ile kopyalanır ve `cf_image_id` set edilir. `CF_STREAM_API_TOKEN` tanımlıysa videolar Cloudflare Stream `/stream/copy` ingest'e gönderilir; webhook hazır durumunu `ready`/`failed` olarak günceller.

### DELETE /v1/media/:id — Response

```typescript
type DeleteMediaResponse = {
  data: {
    id: string;
    deleted: true;
  };
};
```

Not: Endpoint sahiplik kontrolünden sonra R2 objesini siler ve `media_assets` kaydını kaldırır. İlgili Cloudflare token'ları tanımlıysa `cf_image_id` ve `cf_stream_id` için Cloudflare Images/Stream delete çağrıları da yapılır.

### POST /v1/media/webhook/stream — Cloudflare Stream

- Public route; kullanıcı JWT istemez.
- `CF_STREAM_WEBHOOK_SECRET` ile `Webhook-Signature: time=...,sig1=...` doğrulanır.
- İmza kaynağı raw body olarak `{time}.{body}` formatıdır.
- Webhook `meta.asset_id` / `meta.media_asset_id` veya `meta.source_key` / `meta.storage_key` ile `media_assets` kaydını bulur.
- `status.state = "ready"` veya `readyToStream = true` → `status = "ready"`.
- `status.state = "error"` → `status = "failed"`.

---

## Bildirimler

```
GET   /v1/notifications           — Liste (paginated, en yeni önce)
PATCH /v1/notifications/read-all  — Hepsini okundu işaretle
PATCH /v1/notifications/:id/read  — Tekil okundu
POST  /v1/notifications/devices   — FCM/APNs cihaz token kayıt
DELETE /v1/notifications/devices/:token — Token sil (logout)
```

### POST /v1/notifications/devices — Zod Şeması

```typescript
const RegisterDeviceSchema = z.object({
  platform:   z.enum(['ios','android']),
  token:      z.string().min(20).max(500),
  app_build:  z.string().max(40).optional(),
});
```

---

## Şikayet (Reports)

```
POST   /v1/reports               — İçerik şikayeti aç
GET    /v1/reports/my            — Kendi şikayetlerim
```

### POST /v1/reports — Zod Şeması

```typescript
const CreateReportSchema = z.object({
  content_type: z.enum(['message','flare','community','profile','business_pin']),
  content_id:   z.string().uuid(),
  reason:       z.enum(['spam','harassment','inappropriate','fake','other']),
  description:  z.string().max(500).optional(),
});
```

---

## Engelleme

```
POST   /v1/blocks/:userId   — Engelle
DELETE /v1/blocks/:userId   — Engeli kaldır
GET    /v1/blocks           — Engellenen listesi
```

---

## Remote Config (Feature Flag)

```
GET /v1/config              — Tüm aktif feature flag'lar (auth gerektirir)
```

> Bu endpoint admin panelin yazdığı `remote_configs` tablosundan değer döndürür.
> Flutter uygulama açılışında bir kez çağırır, 5 dk cache'ler, sonra arka planda yeniler.

```typescript
type ConfigResponse = {
  data: {
    feature_camera_enabled:    boolean;
    feature_help_enabled:      boolean;
    feature_business_pins:     boolean;
    max_flares_per_user_day:   number;
    media: {
      cloudflare_images_account_hash: string | null;
      cloudflare_stream_cdn_base: string | null;
      image_variants: Array<{
        name: 'thumb' | 'feed' | 'full' | 'square';
        width: number;
        height: number;
        fit: 'cover' | 'contain';
        usage: string;
      }>;
    };
    [key: string]: unknown;
  };
};
```

V1 canonical Cloudflare Images varyantları: `thumb` (120x120 cover), `feed` (640x480 contain), `full` (1920x1080 contain), `square` (400x400 cover).

---

## Internal Jobs

```
POST /v1/internal/jobs/retention/run — Retention cleanup çalıştır
POST /v1/internal/jobs/profile-deletion/run — 30 günü dolan hesap silme taleplerini anonimleştir
```

Auth: `Authorization: Bearer <INTERNAL_JOB_SECRET>`; bu yoksa fallback olarak `TRIGGER_SECRET_KEY` kabul edilir.

```typescript
type RetentionCleanupResponse = {
  data: {
    expired_help_requests: number;
    deleted_unread_notifications: number;
    deleted_read_notifications: number;
    deleted_resolved_help_requests: number;
    deleted_ended_flares: number;
  };
};
```

```typescript
type ProfileDeletionCleanupResponse = {
  data: {
    processed_profiles: number;
    anonymized_profiles: number;
    deleted_push_devices: number;
    deleted_vehicles: number;
    deleted_notifications: number;
    deleted_blocks: number;
    deleted_community_memberships: number;
    deleted_flare_rsvps: number;
  };
};
```

---

## Hata Modeli

```typescript
type ApiError = {
  error:    string;       // İnsan okunabilir mesaj
  code:     string;       // Makine okunabilir kod
  details?: unknown;      // Zod flatten() çıktısı vb.
};
```

| HTTP Kodu | code | Açıklama |
|---|---|---|
| 400 | `BAD_REQUEST` | Genel hatalı istek |
| 401 | `UNAUTHORIZED` | JWT eksik veya geçersiz |
| 403 | `FORBIDDEN` | Yetki yok |
| 404 | `NOT_FOUND` | Kaynak yok |
| 409 | `CONFLICT` | Çakışma (slug alınmış, vs.) |
| 422 | `VALIDATION_ERROR` | Zod doğrulama hatası |
| 429 | `RATE_LIMITED` | Çok fazla istek |
| 500 | `INTERNAL_ERROR` | Sunucu hatası |
| 503 | `SERVICE_UNAVAILABLE` | Bakım modu / downstream down |

### Hata Kodu → Kullanıcı Mesajı Eşlemesi (Flutter)

Flutter `error.code` üzerinden kullanıcıya gösterilecek mesajı belirler. Sabitler `lib/core/errors/error_messages.dart` altındadır.

| code | TR mesaj |
|---|---|
| `UNAUTHORIZED` | "Oturumun sonlanmış. Tekrar giriş yap." |
| `FORBIDDEN` | "Bu işlem için yetkin yok." |
| `NOT_FOUND` | "İçerik bulunamadı." |
| `VALIDATION_ERROR` | "Girilen bilgileri kontrol et." |
| `RATE_LIMITED` | "Çok fazla istek attın. Birazdan tekrar dene." |
| `INTERNAL_ERROR` | "Bir şeyler ters gitti. Tekrar dener misin?" |
| `SERVICE_UNAVAILABLE` | "Hizmet şu an kullanılamıyor. Birkaç dakika sonra dene." |

---

## Sayfalandırma (Pagination)

Cursor tabanlı (ULID/UUID sıralı):

```typescript
type PaginationMeta = {
  next_cursor?: string;
  has_more:     boolean;
  total?:       number;
};

// Query params: ?cursor=<uuid>&limit=20 (max 100)
```

---

## Rate Limiting

| Grup | Limit |
|---|---|
| Kimlik doğrulama | 10 istek / dakika |
| Medya upload-url | 20 istek / dakika |
| Mesaj gönderme | 60 istek / dakika |
| Yardım talebi açma | 5 istek / saat (kötüye kullanım koruması) |
| Şikayet | 20 istek / saat |
| Diğer | 200 istek / dakika |

Aşılınca: `429` + `Retry-After` header.

---

## WebSocket Kontratı

> URL: `wss://realtime.rollpit.com/ws/location?token=<JWT>`
> Protokol: JSON satırlı mesajlar. Her mesaj `{"type": "..."}` ile başlar.
> Ping/Pong: 60 sn `pongWait`, 54 sn aralıklarla server ping atar. Flutter `web_socket_channel` otomatik handle eder.

### İstemci → Sunucu Mesajları

```typescript
// Konum güncelleme (h3 res-9)
{ "type": "location",  "h3_cell": "89283082803ffff" }

// Hayalet mod aç (sunucudaki kaydı sil)
{ "type": "ghost_on" }

// Hayalet mod kapat (yeni konum bekleniyor — opsiyonel sinyal)
{ "type": "ghost_off" }

// İlgi alanı ekle: bu hücre ve k-ring çevresini izle
{ "type": "subscribe_cell", "h3_cell": "89283082803ffff", "k": 2 }

// İlgi alanı kaldır
{ "type": "unsubscribe_cell", "h3_cell": "89283082803ffff" }
```

### Sunucu → İstemci Mesajları

```typescript
// Yoğunluk güncellemesi (res-8 hücreler ve sayım)
{
  "type":  "heatmap_update",
  "cells": { "88283082adcffff": 12, "88283082b03ffff": 5 }
}

// Yakındaki yeni flare
{ "type": "flare_nearby",   "flare_id": "uuid", "h3_cell": "..." }

// Yakındaki yeni yardım talebi
{ "type": "help_nearby",    "help_id":  "uuid", "h3_cell": "...", "user_id": "uuid" }

// Bağlantı sağlık kontrolü (her 30 sn'de bir)
{ "type": "pong", "ts": 1714999999 }
```

### Hata Mesajları

```typescript
{ "type": "error", "code": "UNAUTHORIZED",  "message": "Token expired"   }
{ "type": "error", "code": "RATE_LIMITED",  "message": "Too many messages" }
{ "type": "error", "code": "BAD_PAYLOAD",   "message": "h3_cell missing"  }
```

### Bağlantı Yaşam Döngüsü (Flutter)

1. `supabase.auth.currentSession?.accessToken` ile token al.
2. `wss://realtime.rollpit.com/ws/location?token=<JWT>`'e bağlan.
3. Konum izni alındıysa her `kLocationDistanceFilterMeters` (30 m) hareket ile `location` mesajı gönder.
4. Hayalet mod açılırsa `ghost_on` gönder, sonra konum mesajı gönderme.
5. `onDone` veya `onError` → 3 sn sonra reconnect (jitter ile).

### Backend → Realtime Internal Event

> URL: `POST /internal/realtime/help-event`
> Auth: `Authorization: Bearer <GO_WS_INTERNAL_SECRET>`
> Backend env: `REALTIME_INTERNAL_URL=http://localhost:8080` local, `https://realtime.rollpit.com` prod.

```typescript
// Yeni yardım talebi açıldı
{
  "type": "help_created",
  "help_request_id": "uuid",
  "h3_cell": "89283082803ffff",
  "requester_id": "uuid",
  "issue_type": "flat_tire"
}

// Yardım talebine helper atandı
{
  "type": "help_assigned",
  "help_request_id": "uuid",
  "h3_cell": "89283082803ffff",
  "requester_id": "uuid",
  "helper_id": "uuid"
}
```
6. `access_token` yenilenirse mevcut bağlantıyı kapat, yeni token ile tekrar bağlan.

---

## Versiyonlama Politikası

```
/v1/...   — Mevcut (destekleniyor)
/v2/...   — Breaking change sonrası (v1 6 ay daha desteklenir)
```

Breaking change örnekleri:
- Response alanı kaldırıldı veya yeniden adlandırıldı
- Zorunlu request alanı eklendi
- Davranış değişikliği (hata kodu değişimi)

Her sürüm `Sunset` header'ı ile depreke edilir: `Sunset: Wed, 31 Dec 2026 23:59:59 GMT`.
