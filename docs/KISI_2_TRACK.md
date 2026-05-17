# 👤 KİŞİ 2 — Track Paketi
> Full-stack · Mid/Senior · Rollpit Projesi

## Senin Sorumluluk Alanın

**Backend API (Track 3 — Node/TS) + Medya Pipeline**

Uygulamanın omurgası senin elinde. Tüm API endpoint'leri, iş mantığı, Supabase entegrasyonu, Cloudflare medya akışı ve arka plan job'ları senin track'in.

---

## Önce Oku (Sırayla)

| Sıra | Dosya | Neden |
|---|---|---|
| 1 | `00_README.md` | Projeye genel bakış, çalışma yöntemi |
| 2 | `01_PROJE_GENEL_BAKIS.md` | Vizyon, kullanıcı, MVP kapsamı |
| 3 | `02_TEKNOLOJI_YIGINI.md` | Node/TS stack, Hono, Trigger.dev |
| 4 | `03_MIMARI_KURALLAR.md` | **Kural 2 (Medya Proxy Yasağı) ve Kural 4 (JWT+Zod+RLS) senin için kritik** |
| 5 | `04_VERITABANI_SEMA.md` | Tüm tablolar, indeksler, RLS politikaları |
| 6 | `05_API_KONTRATI.md` | **Senin yazdığın endpoint'lerin sözleşmesi** |
| 7 | `06_GUVENLIK_MAHREMIYET.md` | JWT akışı, RLS detayı, secret yönetimi |
| 8 | `09_TRACK3_BACKEND.md` | Backend klasör yapısı, Hono kurulumu, middleware |
| 9 | `11_MEDYA_PIPELINE.md` | R2 presigned URL, Cloudflare Images/Stream webhook |
| 10 | `13_TEST_KALITE.md` | Backend (vitest) test standartları |
| 11 | `14_DAGITIM_YAYIN.md` | Fly.io deploy, Supabase migration süreci |
| 12 | `16_URUN_GEREKSINIMLERI.md` | Persona + kabul kriterleri — endpoint davranışları |
| 13 | `17_KVKK_GIZLILIK_POLITIKASI.md` | **Hesap silme akışı + veri export endpoint'leri (sen yazıyorsun)** |
| 14 | `20_BILDIRIM_STRATEJI.md` | **Push birincil sahip — Trigger.dev jobs, FCM/APNs payload** |
| 15 | `22_OBSERVABILITY_RUNBOOK.md` | Pino logger, Sentry config, alarm runbook'ları |
| 16 | `23_INCIDENT_RUNBOOK.md` | On-call süreci, post-mortem, status sayfası |
| 17 | `19_KULLANICI_AKISLARI.md` | Endpoint kontratını user flow ile hizala |
| — | `18_TOPLULUK_KURALLARI.md` | `reports` tablosu + admin aksiyon endpoint'leri için |
| — | `25_GELIR_MODELI.md` | Faz 2 İyzico entegrasyonu (V1.0'da bilgi amaçlı) |
| — | `21_BUYUME_PAZARLAMA.md` | `invite_codes` + `waiting_list` tabloları (Bölüm 3) |

---

## Sprint Görevlerin

### Faz 0 — Hazırlık (1 Hafta)
- [ ] Backend monorepo kurulumu (`apps/backend/`)
- [ ] `pnpm install` + TypeScript build kontrol
- [ ] Supabase projesi: dev + staging ortamları
- [ ] Supabase local geliştirme ortamı (`supabase start`)
- [ ] Fly.io `rollpit-api` app'i oluştur (deploy etme henüz)
- [ ] Cloudflare R2 bucket, Images hesabı kur
- [ ] Trigger.dev hesabı aç, SDK bağla
- [ ] Sentry backend projesi oluştur (PII filter — `17_KVKK_*` Bölüm 7)
- [ ] Pino logger yapısal log standardı (`22_OBSERVABILITY_RUNBOOK.md` Bölüm 2)
- [ ] Resend hesabı (e-posta, 20. doküman Bölüm 12)
- [ ] FCM project + APNs cert konfigürasyonu (sertifika yenileme takvimi — yıllık)

### Sprint 1 — Temel Altyapı (Hafta 1-2)
- [ ] Hono app iskeleti (`app.ts`, middleware mount)
- [ ] `requireAuth` middleware (JWT doğrulama)
- [ ] Rate limit middleware (5. doküman Bölüm "Rate Limiting" — kategori bazlı limitler)
- [ ] Global error handler + Sentry capture
- [ ] Pino logger (yapısal alanlar — 22. doküman)
- [ ] Maintenance modu middleware (`MAINTENANCE_MODE` env, 22. doküman Bölüm 11)
- [ ] Supabase migration: `profiles`, `vehicles` tabloları
- [ ] Supabase migration: `invite_codes`, `waiting_list` tabloları (21. doküman Bölüm 3)
- [ ] `GET /v1/profiles/:username`
- [ ] `PATCH /v1/profiles/me`
- [ ] `POST /v1/auth/invite-codes/validate` (davet kodu doğrulama)
- [ ] `POST /v1/auth/waiting-list` (e-posta kayıt)
- [ ] Araç CRUD endpoint'leri
- [ ] `GET /v1/config` — remote config endpoint (5. doküman + 14. tablo)
- [ ] Vitest test altyapısı + ilk unit testler

### Sprint 2 — Harita Endpoint'leri (Hafta 3-4)
- [ ] Supabase migration: `flares`, `business_pins` tabloları
- [ ] `GET /v1/map/heatmap` — Valkey'den h3 yoğunluk verisi
- [ ] `GET /v1/map/flares?h3cell=&k=` — k-ring flare listesi
- [ ] `GET /v1/map/pins?h3cell=&k=` — yakındaki pinler
- [ ] `GET /v1/map/help?h3cell=&k=` — açık yardım talepleri
- [ ] h3-js entegrasyonu (k-ring hesaplama)

### Sprint 3 — Topluluklar & Flares (Hafta 5-6)
- [ ] Supabase migration: `communities`, `community_members`
- [ ] Topluluk CRUD endpoint'leri
- [ ] Üye yönetimi (katıl / ayrıl / rol değiştir)
- [ ] Flares CRUD + RSVP endpoint'leri
- [ ] Flare → community ilişkisi

### Sprint 4 — Mesajlaşma & Bildirimler (Hafta 7-8)
- [ ] Supabase migration: `messages`, `notifications`, `push_devices` (15. tablo)
- [ ] Mesaj endpoint'leri (DM, topluluk, flare, yardım)
- [ ] **Block kontrolü**: mesaj gönderirken alıcının `blocks` tablosunu kontrol et (UF-05 edge case)
- [ ] Bildirim endpoint'leri (liste, read, read-all)
- [ ] `POST /v1/notifications/devices` + `DELETE /v1/notifications/devices/:token`
- [ ] FCM / APNs entegrasyonu (firebase-admin, 20. doküman Bölüm 6)
- [ ] Trigger.dev job: `dm_new` (presence kontrol — kullanıcı sohbet ekranındaysa skip)
- [ ] Trigger.dev job: `flare_starting` (her 5 dk'da bir, 60 dk öncesi push)
- [ ] Quiet hours mantığı (23:00-08:00, 20. doküman Bölüm 8)
- [ ] Geçersiz token temizliği (`registration-token-not-registered` → DB sil)
- [ ] Supabase Realtime channel konfigürasyonu

> Not: Push servis temeli eklendi (`apps/backend/src/services/push.ts`): notification preference kararı, quiet hours kontrolü, provider hata kodlarından invalid token temizliği ve DM/flare job wrapper'ları hazır. FCM/APNs provider ve Trigger.dev schedule bağlanınca yukarıdaki maddeler kapatılmalı.

### Sprint 5 — Acil Yardım & İşletme Pinleri (Hafta 9-10)
- [ ] Supabase migration: `help_requests`
- [ ] Yardım CRUD endpoint'leri
- [ ] **Atomic helper assignment**: ilk gelen kazanır (UF-03 edge case, race condition kontrolü)
- [ ] Saatlik limit kontrolü (`max_help_per_user_hour` remote_config, F5.3)
- [ ] Trigger.dev `sendHelpNotification`: k-ring 2 → aktif kullanıcı listesi → block filter → push (20. doküman Bölüm 6)
- [ ] iOS Critical Alert entitlement başvurusu (Apple — yardım push'u için)
- [ ] 2 saat sonra otomatik `expired` cron
- [ ] İşletme pin CRUD + kampanya endpoint'i
- [ ] Vergi belgesi yüklemesi (R2 privat bucket)
- [ ] İşletme doğrulama akışı (admin panel için flag)

### Sprint 6 — Medya & Güvenlik (Hafta 11-12)
- [ ] `POST /v1/media/upload-url` (R2 presigned URL)
- [ ] `POST /v1/media/finalize`
- [x] Cloudflare Stream webhook handler (imza doğrulama)
- [ ] Cloudflare Images varyant konfigürasyonu
- [ ] Supabase migration: `blocks`, `media_assets`, `reports`, `audit_logs`
- [ ] Engelleme endpoint'leri (`POST /v1/blocks/:userId`, `DELETE`, `GET`)
- [ ] **Hesap silme akışı (UF-10)**: 30 gün soft-delete + Trigger.dev hard-delete job
- [ ] Hesap silme: e-posta + iptal linki (`rollpit.com/undelete?token=`)
- [ ] `GET /v1/profiles/me/export` — Trigger.dev job, JSON arşiv, R2 presigned 48 sa
- [ ] `POST /v1/reports` — şikayet endpoint
- [ ] Retention cron jobs (`04_VERITABANI_SEMA.md` retention tablosu): notifications/flares/help temizliği
- [ ] Health check: `/health` Fly.io check, DB ping dahil
- [ ] Fly.io production deploy + auto-rollback (23. doküman Bölüm 12)
- [ ] Status sayfası setup (statuspage.io veya Cachet)

> Not: R2 upload temel akışı eklendi (`POST /v1/media/upload-url`, `POST /v1/media/finalize`, `media_assets` migration). `DELETE /v1/media/:id` R2 object delete + DB row delete olarak eklendi. Cloudflare Stream webhook imza doğrulama + ready/failed status update eklendi. Cloudflare Images kopyalama, Stream ingest başlatma ve R2 head doğrulamaları sonraki medya adımı olarak açık.

---

## Senin Sahip Olduğun Secret'lar

```bash
# apps/backend/.env.local
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # Sadece backend, asla Flutter'a gitmiyor
R2_ENDPOINT=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=rollpit-media
CF_ACCOUNT_ID=...
CF_IMAGES_API_TOKEN=...
CF_STREAM_API_TOKEN=...
CF_STREAM_WEBHOOK_SECRET=...
TRIGGER_SECRET_KEY=...
GO_WS_INTERNAL_SECRET=...       # Go servisiyle iletişim
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

---

## Diğer Track'lerle Bağımlılıkların

| Bağımlılık | Kime | Ne Zaman |
|---|---|---|
| `GET /v1/map/heatmap` endpoint'i | Kişi 1 (Flutter) | Sprint 2 başı |
| `POST /v1/flares` endpoint'i | Kişi 1 (Flutter) + Kişi 3 (Admin) | Sprint 3 başı |
| `POST /v1/media/upload-url` | Kişi 1 (Flutter) | Sprint 6 başı |
| Migration'ları (`profiles` tablosu) | Kişi 3 (Admin panel okur) | Sprint 1 |
| Valkey'deki konum verisi | Kişi 1'in Go servisi yazar, sen okursun | Sprint 2 |

> **Sözleşme ilkesi:** `05_API_KONTRATI.md`'de tanımlı endpoint imzasını değiştirirsen diğer kişileri haberdar et ve dosyayı güncelle.

---

## Günlük Çalışma Akışı

```bash
# Supabase local başlat
supabase start

# Backend başlat
cd apps/backend && pnpm dev   # nodemon ile :3000

# Migration uygula
supabase db push

# Testleri çalıştır
pnpm exec vitest run

# Testleri watch modda çalıştır
pnpm exec vitest

# Type check
pnpm exec tsc --noEmit

# Lint
pnpm exec eslint src
```

---

## Kritik Hatırlatmalar (Mimariden)

```
❌ ASLA: multer / busboy ile medya al (backend'e)
✅ DOĞRU: Presigned URL üret, Flutter direkt Cloudflare'e yüklesin

❌ ASLA: SUPABASE_SERVICE_ROLE_KEY'i Flutter'a gönder
✅ DOĞRU: Service role sadece backend + Trigger.dev job'larında

❌ ASLA: TypeScript'te any tipi
✅ DOĞRU: Tüm tipler explicit, Zod şeması her endpoint'te zorunlu

❌ ASLA: Raw SQL string birleştirme
✅ DOĞRU: Supabase SDK parametrik sorgular

❌ ASLA: RLS'siz tablo
✅ DOĞRU: Her tablo için ENABLE ROW LEVEL SECURITY + politika
```
