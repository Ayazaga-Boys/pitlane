# 👤 KİŞİ 4 — Track Paketi
> Flutter UI · Mid/Senior · Pitlane Projesi

## Senin Sorumluluk Alanın

**Flutter Mobile UI (Track 2 — Ekranlar & Akışlar)**

Auth'tan mesajlaşmaya, kameradan profile kadar tüm kullanıcı arayüzü senin elinde. Kişi 1 (Burak) harita ve Go servisini yönetiyor, sen diğer tüm Flutter ekranlarını yapıyorsun.

---

## Önce Oku (Sırayla)

| Sıra | Dosya | Neden |
|---|---|---|
| 1 | `00_README.md` | Projeye genel bakış |
| 2 | `01_PROJE_GENEL_BAKIS.md` | Vizyon, kullanıcı, MVP |
| 3 | `03_MIMARI_KURALLAR.md` | **Kural 3 (Riverpod) ve Kural 1 (Ham GPS yok) kritik** |
| 4 | `08_TRACK2_FLUTTER.md` | Flutter klasör yapısı, GoRouter, tema |
| 5 | `15_TASARIM_SISTEMI.md` | Renk, spacing, komponent kataloğu |
| 6 | `19_KULLANICI_AKISLARI.md` | Implement edeceğin akış şemaları |
| 7 | `16_URUN_GEREKSINIMLERI.md` | Kabul kriterleri — her ekran için referans |
| 8 | `05_API_KONTRATI.md` | Kullanacağın endpoint'ler |
| 9 | `20_BILDIRIM_STRATEJI.md` | Push payload yapısı, deep link routing |
| 10 | `26_LOKALIZASYON_ERISILEBILIRLIK.md` | ARB dosyaları, a11y, Semantics |
| 11 | `17_KVKK_GIZLILIK_POLITIKASI.md` | Info.plist izin metinleri |
| 12 | `13_TEST_KALITE.md` | Flutter test standartları |
| — | `KISI_1_TRACK.md` | Burak'ın ne yaptığını anlamak için tarayarak oku |

---

## Mevcut Durum (Kişi 1 tarafından yazıldı — üzerine devam et)

```
apps/mobile/lib/
├── main.dart                          ✅ Supabase init
├── app.dart                           ✅ GoRouter + tüm route'lar
├── src/core/
│   ├── constants/app_constants.dart   ✅
│   ├── constants/h3_constants.dart    ✅
│   ├── errors/app_exception.dart      ✅
│   ├── theme/app_colors.dart          ✅
│   ├── theme/app_spacing.dart         ✅
│   └── theme/app_theme.dart           ✅
├── src/features/auth/
│   ├── data/auth_repository.dart      ✅ invite-code + waiting-list API
│   ├── providers/auth_provider.dart   ✅ OTP flow
│   ├── providers/invite_code_provider.dart ✅
│   └── ui/
│       ├── invite_code_screen.dart    ✅
│       ├── waiting_list_screen.dart   ✅
│       ├── login_screen.dart          ✅
│       └── otp_screen.dart            ✅
├── src/features/map/ui/map_screen.dart ✅ (placeholder — Burak dolduracak)
├── src/features/profile/ui/profile_screen.dart ✅ (temel)
└── src/shared/widgets/
    ├── main_shell.dart                ✅ Bottom nav
    ├── pitlane_button.dart            ✅
    └── pitlane_text_field.dart        ✅
```

**Senin yazacakların (placeholder olanlar):**
```
src/features/
├── communities/          ← Sprint 3
├── flares/              ← Sprint 3
├── messaging/           ← Sprint 4
├── help/                ← Sprint 5 (UI)
├── camera/              ← Sprint 6
├── notifications/       ← Sprint 4
└── settings/            ← Sprint 6
```

---

## Sprint Görevlerin

### Faz 0 — Hazırlık (1 Hafta)
- [x] Repoyu klonla, `kisi4/flutter-ui` branch'ini güncelle
- [x] `flutter pub get` çalıştır
- [ ] iOS Simulator kur, `flutter run` ile app'i aç
- [ ] Mevcut ekranları gez — invite code → login → OTP → harita akışını test et
- [x] `docs/15_TASARIM_SISTEMI.md` oku — hangi renk/spacing kullanılacağını anla

```bash
git clone https://github.com/Ayazaga-Boys/pitlane.git
cd pitlane
git checkout develop
cd apps/mobile
flutter pub get
flutter run \
  --dart-define=API_BASE_URL=http://localhost:3000 \
  --dart-define=SUPABASE_URL=https://wivydwazxppypebnkqry.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpdnlkd2F6eHBweXBlYm5rcXJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjU2ODcsImV4cCI6MjA5Mzc0MTY4N30.oM77rOkmdMazw_QAWrqW6G6O4bJcwLnDT1Z3Cm5rOYs
```

### Sprint 1 — Auth & Profil Tamamlama (Hafta 1-2)
- [x] Profil tamamlama akışı (UF-01 adım 4): kullanıcı adı, avatar, araç ekleme
- [x] `PATCH /v1/profiles/me` ile profil güncelleme
- [x] `POST /v1/profiles/me/vehicles` ile araç ekleme formu
- [x] Onboarding adımları (username → araç → konum izni → bildirim izni → kurallar onayı)
- [x] Profil ekranı gerçek veri ile (kullanıcı adı, araç listesi, avatar)

### Sprint 3 — Topluluklar & Flares (Hafta 5-6)
- [x] Topluluk keşif ekranı (`/communities`) — arama + filtre (F3.1)
- [x] Topluluk detay ekranı — üyeler, flares, katıl butonu
- [x] Topluluk oluşturma formu (ad, slug, tip, araç tipi, şehir)
- [x] Flare oluşturma ekranı (F4.1) — H3 hücre ile oluşturma, harita route param desteği
- [x] Flare detay ekranı — RSVP butonu (going/maybe/not_going)
- [ ] Haritada flare pinleri (Burak'ın MapScreen'ine entegre)

### Sprint 4 — Mesajlaşma & Bildirimler (Hafta 7-8)
- [x] DM listesi ekranı (`/messages`) — son mesajlar (UF-05)
- [x] Sohbet ekranı (`/messages/:peerId`) — Supabase Realtime subscribe
- [ ] Topluluk mesaj odası
- [ ] Flare sohbet odası
- [ ] Şikayet et + Engelle UI (UF-09)
- [ ] firebase_messaging foreground/background/terminated handler (UF-13)
- [ ] Push deep link routing (`/help/:id`, `/flares/:id`, `/messages/:peerId`)
- [ ] Cihaz token kayıt — `POST /v1/notifications/devices`
- [ ] Bildirim listesi ekranı
- [ ] Bildirim ayarları (kategori toggle'ları)

### Sprint 5 — Yardım UI (Hafta 9-10)
- [ ] Yardım talebi formu (sorun tipi seç — UF-03)
- [ ] Yardım bekleme ekranı (pulse animasyonu)
- [ ] "Yardım edeceğim" → 1-1 sohbet açılır
- [ ] İşletme pin kartı detay

### Sprint 6 — Kamera & Ayarlar (Hafta 11-12)
- [ ] Snap kamera ekranı (UF-06) — foto + 15sn video
- [ ] "Sürerken kullanma" kilidi (>10 km/h)
- [ ] Otomotif filtreler (hız overlay, vites)
- [ ] Ayarlar ekranı — tüm toggle'lar (UF-10)
- [ ] Hesap silme akışı (2 adımlı onay)
- [ ] Veri dışa aktarma butonu
- [ ] Semantics etiketleri eksiksiz (26. doküman checklist)
- [ ] Patrol E2E testleri (E2E-01..05)

---

## Senin Sahip Olduğun Secret'lar

```bash
# flutter run komutuna --dart-define ile ekle
SUPABASE_URL=https://wivydwazxppypebnkqry.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
API_BASE_URL=http://localhost:3000   # Erol'un backend'i
WS_BASE_URL=ws://localhost:8080      # Burak'ın Go servisi
```

---

## Diğer Track'lerle Bağımlılıkların

| Bağımlılık | Kimden | Ne Zaman |
|---|---|---|
| `GET /v1/profiles/me` endpoint'i | Erol (Kişi 2) | Sprint 1 |
| `POST /v1/communities` endpoint'i | Erol (Kişi 2) | Sprint 3 başı |
| `POST /v1/flares` endpoint'i | Erol (Kişi 2) | Sprint 3 başı |
| `POST /v1/messages/dms/:peerId` | Erol (Kişi 2) | Sprint 4 başı |
| Harita MapScreen'e flare pinleri | Burak (Kişi 1) | Sprint 3 |
| WebSocket WsService | Burak (Kişi 1) | Sprint 2 |

> Bağımlılık gelmeden önce **mock data** ile geliştirmeye devam et. Beklemek yok.

---

## Branch Stratejisi

Her özellik için yeni branch:

```bash
git checkout develop
git checkout -b mobile/<özellik-adı>

# Örnekler:
mobile/profile-completion
mobile/communities-screen
mobile/messaging
mobile/camera
```

PR'ı `develop`'a aç. Burak veya Erol review eder.

---

## Günlük Çalışma Akışı

```bash
# Terminal 1 — Backend (Erol'un servisi yerine local)
cd /pitlane && pnpm --filter @pitlane/backend dev

# Terminal 2 — Flutter
cd apps/mobile && flutter run \
  --dart-define=API_BASE_URL=http://localhost:3000 \
  --dart-define=SUPABASE_URL=... \
  --dart-define=SUPABASE_ANON_KEY=...

# Test
flutter test

# Analyze
flutter analyze
```

---

## Kritik Hatırlatmalar

```
❌ ASLA: setState ile global state
✅ DOĞRU: AsyncNotifier + Riverpod

❌ ASLA: Magic number (8, 9, 16, 24 gibi literal)
✅ DOĞRU: AppSpacing.lg, AppColors.pitRed, H3Constants.proximityResolution

❌ ASLA: Medyayı backend'e gönder
✅ DOĞRU: Presigned URL ile direkt Cloudflare'e yükle (11. doküman)

❌ ASLA: Ham lat/lng gönder
✅ DOĞRU: H3 hücresine çevir (Burak'ın location_utils.dart'ı Sprint 2'de hazır olacak)

❌ ASLA: Widget içinde iş mantığı
✅ DOĞRU: Provider'da iş mantığı, widget sadece ref.watch()
```
