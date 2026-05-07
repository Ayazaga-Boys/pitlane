# 👤 KİŞİ 1 — Track Paketi
> Full-stack · Mid/Senior · Pitlane Projesi

## Senin Sorumluluk Alanın

**Flutter Mobil (Track 2) + Go Realtime Servisi (Track 4)**

Haritanın kalbi senin elinde. Kullanıcının gördüğü canlı harita, konum gizliliği ve WebSocket altyapısı senin track'in.

---

## Önce Oku (Sırayla)

| Sıra | Dosya | Neden |
|---|---|---|
| 1 | `00_README.md` | Projeye genel bakış, çalışma yöntemi |
| 2 | `01_PROJE_GENEL_BAKIS.md` | Vizyon, kullanıcı, MVP kapsamı |
| 3 | `02_TEKNOLOJI_YIGINI.md` | Flutter + Go stack, sürüm pinleri |
| 4 | `03_MIMARI_KURALLAR.md` | **Kural 1 (Konum Mahremiyeti) ve Kural 3 (Riverpod) senin için kritik** |
| 5 | `06_GUVENLIK_MAHREMIYET.md` | H3 veri akışı, hayalet mod detayı |
| 6 | `08_TRACK2_FLUTTER.md` | Flutter klasör yapısı, GoRouter, tema |
| 7 | `10_TRACK4_GO_SERVISI.md` | Go WebSocket servisi, Valkey, broadcaster |
| 8 | `05_API_KONTRATI.md` | Harita endpoint'leri + **WebSocket kontratı** (senin kullanacağın) |
| 9 | `11_MEDYA_PIPELINE.md` | Kamera özelliği için medya akışı |
| 10 | `13_TEST_KALITE.md` | Flutter + Go test standartları |
| 11 | `14_DAGITIM_YAYIN.md` | Fastlane, App Store, Fly.io (Go kısmı) |
| 12 | `15_TASARIM_SISTEMI.md` | **Senin kullanacağın tasarım jetonları** — `lib/core/theme/` bunu birebir yansıtır |
| 13 | `16_URUN_GEREKSINIMLERI.md` | Persona, kabul kriterleri — her ekran için referans |
| 14 | `19_KULLANICI_AKISLARI.md` | **14 user flow** — implement edeceğin tam akış şemaları |
| 15 | `20_BILDIRIM_STRATEJI.md` | firebase_messaging payload yapısı, deep link routing |
| 16 | `26_LOKALIZASYON_ERISILEBILIRLIK.md` | ARB dosyaları, WCAG AA, Semantics etiketleri |
| 17 | `17_KVKK_GIZLILIK_POLITIKASI.md` | Info.plist + AndroidManifest izin metinleri, Sentry PII filtresi |
| — | `09_TRACK3_BACKEND.md` | Backend ile entegrasyon noktalarını anlamak için tarayarak oku |
| — | `22_OBSERVABILITY_RUNBOOK.md` | Go servisinde zerolog + Prometheus metrik bölümleri |

---

## Sprint Görevlerin

### Faz 0 — Hazırlık (1 Hafta)
- [ ] Flutter monorepo kurulumu (`apps/mobile/`)
- [ ] Go monorepo kurulumu (`apps/realtime/`)
- [ ] `flutter pub get` + `go mod tidy`
- [ ] Simulator/Emulator üzerinde boş app ayağa kaldır
- [ ] Go servisini `localhost:8080`'de çalıştır
- [ ] Upstash Valkey bağlantısını test et
- [ ] Sentry Flutter + Go projelerini oluştur (PII filtre `17_KVKK_*` Bölüm 7)
- [ ] Inter + JetBrainsMono font dosyalarını `assets/fonts/` altına ekle
- [ ] `lib/core/theme/` altında `app_colors.dart`, `app_spacing.dart`, `app_motion.dart` (15. doküman)
- [ ] `lib/l10n/` ARB dosya iskeleti (TR + EN, 26. doküman)
- [ ] iOS Info.plist konum/kamera/mikrofon izin metinleri (17. doküman Bölüm 5)
- [ ] AndroidManifest izinleri (17. doküman Bölüm 6)
- [ ] flutter_native_splash + flutter_launcher_icons

### Sprint 1 — Temel Altyapı (Hafta 1-2)
- [ ] Flutter proje iskeleti (feature-first klasör yapısı — `08_TRACK2_FLUTTER.md`)
- [ ] GoRouter konfigürasyonu (tüm route'lar tanımlı)
- [ ] Supabase Flutter bağlantısı
- [ ] Onboarding akışı (UF-01 — `19_KULLANICI_AKISLARI.md`)
- [ ] Auth ekranları: Giriş / Kayıt / OTP (kabul kriterleri `16_URUN_GEREKSINIMLERI.md` F1.1-F1.4)
- [ ] Davet kodu doğrulama UI'ı (Kişi 2'nin oluşturduğu `invite_codes` tablosu ile)
- [ ] Bekleme listesi formu (waiting_list)
- [ ] Topluluk kuralları onay ekranı (`18_TOPLULUK_KURALLARI.md` Bölüm 1 metni)
- [ ] Connectivity banner ("İnternet yok") — UF-12
- [ ] Force update modal (`min_supported_app_version` kontrolü, UF-11)
- [ ] Sentry beforeSend PII filter (17. doküman Bölüm 7)
- [ ] Go: proje iskeleti (`cmd/realtime`, `internal/hub`, `internal/location`)
- [ ] Go: Valkey `Store` katmanı (`SetUserCell`, `DeleteUserCell`)
- [ ] Go: WebSocket sunucusu (JWT doğrulama dahil)
- [ ] Go: zerolog yapısal logging (`22_OBSERVABILITY_RUNBOOK.md` Bölüm 2)

### Sprint 2 — Harita & Canlı Konum (Hafta 3-4)
- [ ] Flutter: Google Maps entegrasyonu
- [ ] Flutter: Konum izni akışı (`permission_handler` + UF-02)
- [ ] Flutter: H3 hücre hesaplaması (`h3_dart`) — **Kural 1'e uy, ham GPS gönderme**
- [ ] Flutter: WebSocket servisi (`WsService`) — `05_API_KONTRATI.md` "WebSocket Kontratı" bölümü
- [ ] Flutter: Isı haritası overlay (H3 Polygon, `15_TASARIM_SISTEMI.md` heatmap gradient)
- [ ] Flutter: Hayalet mod toggle (UI + WS sinyali, kabul kriterleri F2.3)
- [ ] Flutter: Harita filtreleri (araç tipi, etkinlik, pin tipi — F2.2)
- [ ] Go: Pub/Sub yayın mantığı (hücre bazlı)
- [ ] Go: Isı haritası toplama (res-8 cell count)
- [ ] Go: k-ring genişletme (yakınlık sorgusu)
- [ ] Go: Bağlantı yönetimi (ping/pong, reconnect)
- [ ] Go: Prometheus metrics endpoint (`pitlane_ws_active_connections`, vb. — 22. doküman Bölüm 4)

### Sprint 4 — Mesajlaşma + Bildirim (Hafta 7-8)
- [ ] Flutter: DM listesi + sohbet ekranı (UF-05)
- [ ] Flutter: Topluluk + flare + yardım sohbeti
- [ ] Flutter: Supabase Realtime subscribe (mesajlar)
- [ ] Flutter: firebase_messaging foreground / background / terminated handler (UF-13)
- [ ] Flutter: Push deep link routing (20. doküman payload `deep_link` alanı)
- [ ] Flutter: Cihaz token kayıt — `POST /v1/notifications/devices`
- [ ] Flutter: Bildirim ayarları ekranı (kategori toggle'ları — 20. doküman Bölüm 8)
- [ ] Flutter: iOS notification action button ("Yardım Edeceğim", 20. doküman Bölüm 5)
- [ ] Flutter: Şikayet et + Engelle UI (UF-09)

### Sprint 5 — Acil Yardım UI (Hafta 9-10)
- [ ] Flutter: Acil yardım butonu (harita üzerinde) — UF-03 critical path, 3-tap kuralı
- [ ] Flutter: Yardım talebi formu
- [ ] Flutter: Yakındaki yardım talepleri gösterimi
- [ ] Flutter: Yardım et → 1-1 sohbet açılır
- [ ] Flutter: Sahte SOS uyarısı + saatlik limit (`max_help_per_user_hour` remote_config)
- [ ] Flutter: İşletme pin kartı + "Yol tarifi al" deep link (Google/Apple Maps)

### Sprint 6 — Kamera & Medya & Cilalama (Hafta 11-12)
- [ ] Flutter: Snap kamera ekranı (`camera` package — UF-06)
- [ ] Flutter: Video kaydı (max 15 saniye)
- [ ] Flutter: "Sürerken kullanma" kontrolü (>10 km/h → recording disabled)
- [ ] Flutter: `flutter_image_compress` + `video_compress`
- [ ] Flutter: Presigned URL ile direkt R2/CF yükleme (Mimari Kural #2)
- [ ] Flutter: Basit otomotif filtreler (renk overlay, hız göstergesi)
- [ ] Flutter: Onboarding son hali (konum izni rationale, ATT)
- [ ] Flutter: Hesap silme akışı (UF-10) + veri dışa aktarma butonu
- [ ] Flutter: Tüm Semantics etiketleri eksiksiz (26. doküman Bölüm 13 checklist)
- [ ] Flutter: Patrol E2E testleri (E2E-01..05 — 13. doküman Bölüm 2)
- [ ] Go: Load test (`k6` ile 10k bağlantı)
- [ ] Go: Graceful shutdown
- [ ] Go: Sentry entegrasyonu

---

## Senin Sahip Olduğun Secret'lar

```bash
# .env.local — senin makinende
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
VALKEY_ADDR=...            # Upstash
SUPABASE_JWT_SECRET=...    # Go JWT doğrulama için
GOOGLE_MAPS_API_KEY=...    # Flutter
```

Flutter için `--dart-define` ile çalışırsın (`14_DAGITIM_YAYIN.md` Bölüm 1).

---

## Diğer Track'lerle Bağımlılıkların

| Bağımlılık | Kimden | Ne Zaman |
|---|---|---|
| `POST /v1/map/heatmap` endpoint'i | Kişi 2 (Backend) | Sprint 2 başı |
| `POST /v1/help` endpoint'i | Kişi 2 (Backend) | Sprint 5 başı |
| `POST /v1/media/upload-url` endpoint'i | Kişi 2 (Backend) | Sprint 6 başı |
| DB migration'ları (profiles, vehicles) | Kişi 3 (Backend) | Sprint 1 |

> Bağımlılık gelmeden önce **mock data** ile geliştirmeye devam et. Beklemek yok.

---

## Günlük Çalışma Akışı

```bash
# Go servisi başlat
cd apps/realtime && go run ./cmd/realtime

# Flutter başlat
cd apps/mobile && flutter run \
  --dart-define=API_BASE_URL=http://localhost:3000 \
  --dart-define=WS_BASE_URL=ws://localhost:8080 \
  --dart-define=SUPABASE_URL=... \
  --dart-define=SUPABASE_ANON_KEY=...

# Go testleri
cd apps/realtime && go test ./... -race

# Flutter testleri
cd apps/mobile && flutter test
```

---

## Kritik Hatırlatmalar (Mimariden)

```
❌ ASLA: Flutter'dan ham lat/lng gönderme
✅ DOĞRU: h3_dart ile önce H3 hücresine çevir, sonra gönder

❌ ASLA: setState ile global state
✅ DOĞRU: AsyncNotifier + Riverpod

❌ ASLA: Magic number (8, 9, 300 gibi literal)
✅ DOĞRU: core/constants/ altında sabit tanımla

❌ ASLA: Medyayı backend'e gönder
✅ DOĞRU: Presigned URL ile direkt Cloudflare'e yükle
```
