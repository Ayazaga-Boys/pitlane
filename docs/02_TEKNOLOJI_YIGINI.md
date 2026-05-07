# 02 — Teknoloji Yığını

> Sürüm pinleri **kesin**dir. Yükseltme ancak ilgili `.md` dosyasında PR + tüm track lead onayı sonrası yapılabilir.

## Frontend (Mobil)

| Bileşen | Sürüm | Amaç |
|---|---|---|
| Dart | 3.3+ | Dil |
| Flutter | 3.22+ | Framework |
| Riverpod | 2.5.x | State management (AsyncNotifier pattern) |
| GoRouter | 14.x | Deklaratif yönlendirme |
| google_maps_flutter | 2.6.x | Harita |
| dio | 5.4.x | HTTP istemci |
| freezed + json_serializable | 2.x / 6.x | Değişmez modeller, JSON |
| flutter_secure_storage | 9.x | JWT, refresh token |
| supabase_flutter | 2.5.x | Auth + Realtime |
| cached_network_image | 3.x | Görsel cache |
| flutter_image_compress | 2.x | Yükleme öncesi sıkıştırma |
| video_compress | 3.x | Video sıkıştırma |
| permission_handler | 11.x | Runtime izinler |
| firebase_messaging | 14.x | FCM |
| sentry_flutter | 8.x | Hata izleme |
| h3_dart | 4.x | H3 hesaplaması (offline) |
| go_router_builder | 2.x | Tip-güvenli route |
| geolocator | 12.x | Cihaz GPS akışı (lat/lng → H3 dönüşümü için) |
| web_socket_channel | 3.x | Go realtime servisi WebSocket istemcisi |
| video_player | 2.x | Cloudflare Stream HLS oynatma |
| image_picker | 1.1.x | Galeri/Kamera seçimi |
| flutter_localizations | sdk | TR + EN i18n (ARB) |
| intl | 0.19.x | Tarih, sayı biçimleme |
| flutter_dotenv | 5.x | Geliştirici ortamında .env yükleme (release'de --dart-define) |
| package_info_plus | 8.x | Force-update kontrolünde sürüm karşılaştırma |
| connectivity_plus | 6.x | Offline algılama, banner gösterimi |
| url_launcher | 6.x | "Yol tarifi al", telefon, dış URL |
| share_plus | 10.x | Flare / pin paylaşma |
| flutter_native_splash | 2.x | Açılış ekranı |
| flutter_launcher_icons | 0.13.x | iOS/Android ikon üretimi |

### Kullanılmayacak Paketler (Karar)

- `provider` (sadece Riverpod)
- `bloc` (sadece Riverpod)
- `shared_preferences` (yerine `flutter_secure_storage`)
- `setState` ile global state (sadece widget-lokal UI durumu için)

## Backend (API)

| Bileşen | Sürüm | Amaç |
|---|---|---|
| Node.js | 20 LTS | Runtime |
| TypeScript | 5.4+ | Dil |
| Hono | 4.x | HTTP framework (hızlı, edge-uyumlu) |
| Zod | 3.23.x | Şema doğrulama |
| Supabase JS | 2.x | DB + Auth |
| @supabase/auth-helpers | en güncel | JWT doğrulama |
| pino | 9.x | Logging |
| dayjs | 1.x | Tarih |
| ulid | 2.x | ID üretimi (sıralanabilir) |
| h3-js | 4.x | H3 hesaplaması |
| @aws-sdk/client-s3 + s3-request-presigner | 3.x | R2 presigned URL |
| @trigger.dev/sdk | 3.x | Background jobs |
| vitest | 1.x | Test |
| tsx | 4.x | Geliştirme runner |
| pnpm | 9.x | Paket yöneticisi |
| hono-rate-limiter | 0.x | Rate limiting middleware |
| firebase-admin | 12.x | FCM push gönderimi (Trigger.dev içinden) |
| @vitest/coverage-v8 | 1.x | Test coverage |
| eslint + @typescript-eslint | 8.x | Lint |
| supabase CLI | en güncel | Yerel dev, migration |

### Neden Hono (Express değil)?
- TypeScript-first, Zod ile native validator.
- Edge-uyumlu (Cloudflare Workers'a taşınabilir).
- Middleware modeli temiz, tip güvenli.

### Neden Supabase?
- Postgres + Auth + Realtime + Storage tek paket.
- RLS native; mahremiyet katmanı DB seviyesinde.
- Self-host opsiyonu; gelecekte AWS RDS'e migrate edilebilir.

## Realtime / Canlı Harita Servisi

| Bileşen | Sürüm | Amaç |
|---|---|---|
| Go | 1.22+ | Dil |
| gorilla/websocket | 1.5.x | WebSocket |
| Valkey | 7.2.x (Redis-uyumlu) | TTL'li konum store, pub/sub |
| go-redis (valkey'e bağlanıyor) | 9.x | İstemci |
| uber/h3-go | 4.x | H3 |
| zerolog | 1.x | Logging |
| viper | 1.x | Konfig |
| testify | 1.x | Test |

### Neden Go (Node değil)?
- WebSocket eşzamanlılığında goroutine modeli daha verimli.
- ~50-100k canlı bağlantı tek instance, düşük bellek.
- H3 hesaplamaları C bağlamalı, hızlı.

### Neden Valkey (Redis değil)?
- Redis lisans değişikliği (BSL) sonrası açık kaynak çatal.
- API uyumlu, drop-in replacement.

## Medya

| Bileşen | Amaç |
|---|---|
| **Cloudflare R2** | Ham fotoğraf, video kaynak dosyaları. S3 uyumlu. |
| **Cloudflare Images** | Fotoğraf varyantları (thumb, feed, full). Otomatik AVIF/WebP. |
| **Cloudflare Stream** | Video transcode + HLS dağıtım. |
| **Cloudflare Workers (opsiyonel)** | Webhook handler. |

### Yükleme Akışı (Özet)
1. Flutter dosyayı sıkıştırır.
2. Backend'den `POST /media/upload-url` ile presigned URL alır.
3. Direkt R2/Images/Stream'e PUT/POST yapar.
4. Tamamlanınca backend'e `POST /media/finalize` ile kayıt bildirir.
5. Backend webhook ile Cloudflare'den teyit alır, DB'ye yazar.

> Backend asla medya proxy görevi görmez. (Mimari Kural #2)

## Background Jobs

| Bileşen | Amaç |
|---|---|
| **Trigger.dev v3** | Bildirim gönderme, periyodik temizlik, e-posta, webhook işleme |

## Admin Panel

| Bileşen | Sürüm | Amaç |
|---|---|---|
| Next.js | 14.x (App Router) | Framework |
| Tailwind CSS | 3.4.x | Styling |
| shadcn/ui | en güncel | Component library |
| Tanstack Query | 5.x | Veri çekme |
| Zod | 3.23.x | Form validasyonu |
| react-hook-form | 7.x | Form |
| recharts | 2.x | Metrik grafikler |

## DevOps & Altyapı

| Katman | Seçim | Not |
|---|---|---|
| API hosting | **Fly.io** (region: fra, ams) | Düşük gecikme TR/EU |
| Realtime hosting | **Fly.io** (multi-region) | WebSocket dostu |
| Admin hosting | **Vercel** | Next.js native |
| Veritabanı | **Supabase Cloud** (eu-west) | RLS, backup, branching |
| Cache / pub-sub | **Upstash Valkey** | TTL, pay-per-request |
| Object storage | **Cloudflare R2** | Çıkış ücreti yok |
| CDN / Images / Video | **Cloudflare** | Native entegrasyon |
| CI/CD | **GitHub Actions** | Mobil build için Codemagic alternatif |
| Mobil dağıtım | **TestFlight + Internal Testing → Public** | Fastlane otomasyonu |
| Hata izleme | **Sentry** (mobil + backend + admin) | Tek hesap, ayrı projeler |
| Analitik | **PostHog** (self-host opsiyonlu) | Ürün metrikleri |
| Loglama | **Axiom** veya **Better Stack** | Yapısal log |
| Secret yönetimi | **1Password Secrets Automation** | CI'a inject |
| IaC | **Terraform** (Cloudflare + Supabase + Fly) | İlk gün şart değil, F0 sonu |

## Versiyonlama

- Mobil: SemVer + build number (`1.4.2+142`).
- Backend: SemVer, deploy tag = git SHA.
- API kontratı: `/v1/...` prefix. Breaking change → `/v2/...`, eski 6 ay desteklenir.

## Geliştirici Aracı

- **VSCode** + Flutter, Dart, ESLint, Prisma, Tailwind eklentileri.
- **Cursor** opsiyonel.
- **mise** veya **asdf** ile Node + Go + Flutter sürüm pin.
- **direnv** ile `.envrc`.
- **lefthook** ile pre-commit (lint + test).
