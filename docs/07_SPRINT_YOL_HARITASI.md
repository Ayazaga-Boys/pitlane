# 07 — Sprint Yol Haritası

> 12 hafta MVP, 2 hafta beta hazırlık. Her sprint 2 hafta.
> Track 2 (Flutter), Track 3 (Backend), Track 4 (Go) paralel yürür.
> Sprint sonu demo + retro zorunludur.

---

## Faz 0 — Hazırlık (1 Hafta)

**Tüm Track'ler**
- [ ] Monorepo kurulumu (pnpm workspace + Flutter + Go)
- [ ] GitHub Actions CI: lint + test + build
- [ ] Supabase projesi: dev + staging + prod ortamları
- [ ] Fly.io app'leri: `rollpit-api`, `rollpit-realtime`
- [ ] Cloudflare: R2 bucket, Images, Stream hesap
- [ ] 1Password Secrets Automation
- [ ] Sentry projeleri (mobile, backend, admin)
- [ ] Figma tasarım sistemi final (renk, tipografi, ikonlar)
- [ ] Feature flag sistemi (Supabase remote config tablosu)

**Çıktı:** Tüm ortamlar ayakta, CI yeşil, boş app çalışıyor.

---

## Sprint 1 — Temel Altyapı (Hafta 1-2)

### Track 3 (Backend)
- [ ] Hono app iskeleti, middleware (auth, rate-limit, error handler)
- [ ] Supabase migrations: profiles, vehicles tabloları
- [ ] `POST /v1/profiles/me`, `GET /v1/profiles/:username`
- [ ] Araç CRUD endpoint'leri
- [ ] Vitest test altyapısı

### Track 4 (Go)
- [ ] Go proje iskeleti (cmd/realtime, internal/hub, internal/location)
- [ ] Valkey bağlantısı ve `Store` katmanı
- [ ] WebSocket sunucusu (JWT doğrulama dahil)
- [ ] `SetUserCell` / `DeleteUserCell` fonksiyonları

### Track 2 (Flutter)
- [ ] Flutter proje iskeleti (feature-first klasör yapısı)
- [ ] GoRouter konfigürasyonu (tüm route'lar)
- [ ] Supabase Flutter bağlantısı
- [ ] Auth ekranları: Giriş / Kayıt / OTP
- [ ] Profil ekranı (okuma + düzenleme)

**Demo:** Kullanıcı kayıt olup profil düzenleyebiliyor.

---

## Sprint 2 — Harita & Canlı Konum (Hafta 3-4)

### Track 4 (Go)
- [ ] Pub/Sub yayın mantığı (hücre bazlı)
- [ ] Isı haritası toplama (res-8 cell count)
- [ ] k-ring genişletme (yakınlık sorgusu)
- [ ] WebSocket mesaj protokolü (JSON schema)
- [ ] Bağlantı yönetimi (ping/pong, reconnect)

### Track 3 (Backend)
- [ ] `GET /v1/map/heatmap`
- [ ] `GET /v1/map/flares`, `GET /v1/map/pins`, `GET /v1/map/help`
- [ ] Flares ve business_pins migration + temel CRUD

### Track 2 (Flutter)
- [ ] Google Maps entegrasyonu
- [ ] Konum izni akışı (permission_handler)
- [ ] H3 hücre hesaplaması (h3_dart)
- [ ] WebSocket servisi (Go'ya bağlantı)
- [ ] Isı haritası overlay (H3 Polygon katmanı)
- [ ] Hayalet mod toggle (UI + WS'ye sinyal)

**Demo:** Harita açılıyor, ısı haritası görünüyor, hayalet mod çalışıyor.

---

## Sprint 3 — Topluluklar & Flares (Hafta 5-6)

### Track 3 (Backend)
- [ ] communities, community_members migration
- [ ] Topluluk CRUD endpoint'leri
- [ ] Üye yönetimi (katıl / ayrıl / rol)
- [ ] Flares CRUD + RSVP endpoint'leri
- [ ] Flare → community ilişkisi

### Track 2 (Flutter)
- [ ] Topluluk keşif ekranı (arama + filtre)
- [ ] Topluluk detay ekranı (üyeler, flares)
- [ ] Topluluk oluşturma formu
- [ ] Flare oluşturma (haritadan konum seç → H3 hücre)
- [ ] Flare detay + RSVP
- [ ] Haritada flare pinleri

**Demo:** Topluluk oluşturulup flare paylaşılabiliyor.

---

## Sprint 4 — Mesajlaşma & Bildirimler (Hafta 7-8)

### Track 3 (Backend)
- [ ] messages migration + RLS
- [ ] Mesaj endpoint'leri (DM, topluluk, flare, yardım)
- [ ] notifications migration + endpoint'leri
- [ ] FCM / APNs entegrasyonu (Trigger.dev job)
- [ ] Supabase Realtime channel konfigürasyonu

### Track 2 (Flutter)
- [ ] DM listesi ekranı
- [ ] Sohbet ekranı (Realtime subscribe)
- [ ] Topluluk mesaj odası
- [ ] Flare sohbet odası
- [ ] firebase_messaging entegrasyonu
- [ ] Bildirim işleme (foreground + background + terminated)
- [ ] Bildirim listesi ekranı

**Demo:** Gerçek zamanlı mesajlaşma çalışıyor, bildirim geliyor.

---

## Sprint 5 — Acil Yardım & İşletme Pinleri (Hafta 9-10)

### Track 3 (Backend)
- [ ] help_requests migration + endpoint'leri
- [ ] Yardım talebi açıldığında yakındaki kullanıcılara push (Trigger.dev)
- [ ] business_pins migration + endpoint'leri
- [ ] İşletme doğrulama akışı (admin panel üzerinden)
- [ ] Kampanya başlatma endpoint'i

### Track 2 (Flutter)
- [ ] Acil yardım butonu (harita üzerinde)
- [ ] Yardım talebi formu
- [ ] Yakındaki yardım talepleri gösterimi
- [ ] Yardım et → 1-1 sohbet açılır
- [ ] İşletme pini detay kartı
- [ ] Kampanya gösterimi
- [ ] "Yol tarifi al" (Google Maps deep link)

**Demo:** Yardım talebi açılıp yakındaki kullanıcıya bildirim gidiyor.

---

## Sprint 6 — Kamera, Medya & Cilalama (Hafta 11-12)

### Track 3 (Backend)
- [ ] `POST /v1/media/upload-url` (R2 presigned)
- [ ] `POST /v1/media/finalize`
- [ ] Cloudflare Stream webhook handler
- [ ] Cloudflare Images varyant konfigürasyonu
- [ ] Engelleme endpoint'leri
- [ ] Hesap silme akışı (GDPR)

### Track 2 (Flutter)
- [ ] Snap kamera ekranı (camera package)
- [ ] Video kaydı (max 15 saniye)
- [ ] flutter_image_compress + video_compress entegrasyonu
- [ ] Presigned URL ile direkt R2/CF yükleme
- [ ] Basit otomotif filtreler (renk overlay, speedometer)
- [ ] Müzik etiketi ekleme (metadata)
- [ ] Profil avatar yükleme
- [ ] Engelleme / şikayet UI
- [ ] Ayarlar ekranı
- [ ] Onboarding (konum izni rationale, ATT)

### Track 4 (Go)
- [ ] Load test (k6 ile 10k bağlantı)
- [ ] Prometheus metrics endpoint
- [ ] Graceful shutdown

**Demo:** TestFlight + Internal Testing build'i yayında.

---

## Faz 2 — Beta (Hafta 13-16)

- 500 davetli kullanıcı (TestFlight + Android Internal)
- Crash raporları → Sentry triaj
- Performans profiling (Flutter DevTools)
- App Store / Play Store meta veri hazırlığı (ekran görüntüleri, açıklama)
- Güvenlik penetrasyon testi (temel)
- KVKK / GDPR gizlilik politikası yayını

---

## Faz 3 — Public Launch (Hafta 17-18)

- [ ] App Store Review başvurusu
- [ ] Google Play Production başvurusu
- [ ] Sosyal medya açılış kampanyası
- [ ] İlk 50 işletme pini (elle girilmiş)
- [ ] İzleme panosu (PostHog + Sentry + Axiom)
- [ ] On-call rotasyonu

---

## Kilometre Taşları (Milestone)

| Milestone | Hafta | Kriter |
|---|---|---|
| M1 — Auth çalışıyor | 2 | Kullanıcı kayıt/giriş yapabiliyor |
| M2 — Harita canlı | 4 | Isı haritası gerçek zamanlı görünüyor |
| M3 — Sosyal temel | 6 | Topluluk + flare end-to-end |
| M4 — Mesajlaşma canlı | 8 | DM + topluluk odası realtime |
| M5 — Yardım sistemi | 10 | Acil yardım end-to-end |
| M6 — TestFlight | 12 — Sprint 6 sonu | App mağazasına gönderilebilir kalite |
| M7 — Public | 18 | App Store + Play Store yayını |

---

## Tanım: "Bitti" (Definition of Done)

Bir görev ancak aşağıdakilerin hepsi sağlandığında "bitti" sayılır:

1. Kod PR'a merge edildi (lint pass, CI yeşil).
2. Unit test yazıldı (kritik iş mantığı için).
3. Manuel test geçildi (ilgili track'in QA kontrol listesi).
4. Sentry'de yeni `unhandled error` yoktur.
5. Dokümantasyon güncellendi (API kontratı veya mimari kural değiştiyse).