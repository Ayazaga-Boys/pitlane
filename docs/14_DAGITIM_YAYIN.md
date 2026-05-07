# 14 — Dağıtım & Yayın

> Bu dosya App Store / Google Play başvuru sürecini, Fastlane otomasyonunu,
> Fly.io + Vercel deploy akışını ve sürüm yönetimini kapsar.
> Faz planı için `07_SPRINT_YOL_HARITASI.md`'ye bakın.

---

## 1. Ortam Yapısı

| Ortam | Flutter Hedef | Backend | Realtime | Amaç |
|---|---|---|---|---|
| **development** | Simulator/Emulator | localhost:3000 | localhost:8080 | Günlük geliştirme |
| **staging** | TestFlight (iOS) / Internal Testing (Android) | pitlane-api-staging.fly.dev | pitlane-rt-staging.fly.dev | QA + demo |
| **production** | App Store / Play Store | api.pitlane.app | realtime.pitlane.app | Kullanıcılar |

### Flutter Ortam Değişkenleri (--dart-define)

```bash
# development
flutter run \
  --dart-define=SUPABASE_URL=https://dev-xxx.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=eyJ... \
  --dart-define=API_BASE_URL=http://localhost:3000 \
  --dart-define=WS_BASE_URL=ws://localhost:8080 \
  --dart-define=APP_ENV=development

# staging
flutter build ios \
  --dart-define=SUPABASE_URL=https://staging-xxx.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=eyJ... \
  --dart-define=API_BASE_URL=https://pitlane-api-staging.fly.dev \
  --dart-define=WS_BASE_URL=wss://pitlane-rt-staging.fly.dev \
  --dart-define=APP_ENV=staging \
  --dart-define=SENTRY_DSN=https://xxx@sentry.io/staging

# production
flutter build ios --release \
  --dart-define=SUPABASE_URL=https://prod-xxx.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=eyJ... \
  --dart-define=API_BASE_URL=https://api.pitlane.app \
  --dart-define=WS_BASE_URL=wss://realtime.pitlane.app \
  --dart-define=APP_ENV=production \
  --dart-define=SENTRY_DSN=https://xxx@sentry.io/prod \
  --dart-define=CF_IMAGES_ACCOUNT_HASH=xxx \
  --dart-define=CF_STREAM_CDN_BASE=https://customer-xxx.cloudflarestream.com
```

---

## 2. Fastlane Kurulumu

### Dizin Yapısı

```
apps/mobile/
├── fastlane/
│   ├── Appfile
│   ├── Fastfile
│   ├── Matchfile
│   └── metadata/
│       ├── ios/
│       │   ├── tr/
│       │   │   ├── name.txt
│       │   │   ├── subtitle.txt
│       │   │   ├── description.txt
│       │   │   ├── keywords.txt
│       │   │   └── release_notes.txt
│       │   └── en-US/
│       │       ├── name.txt
│       │       └── description.txt
│       └── android/
│           └── tr-TR/
│               ├── title.txt
│               ├── short_description.txt
│               ├── full_description.txt
│               └── changelogs/
│                   └── default.txt
└── Gemfile
```

### Gemfile

```ruby
# apps/mobile/Gemfile
source "https://rubygems.org"

gem "fastlane"
gem "match"
```

### Appfile

```ruby
# apps/mobile/fastlane/Appfile
app_identifier("app.pitlane.mobile")
apple_id(ENV["APPLE_ID"])
itc_team_id(ENV["ITC_TEAM_ID"])
team_id(ENV["APPLE_TEAM_ID"])

# Android
json_key_file(ENV["GOOGLE_PLAY_JSON_KEY_PATH"])
package_name("app.pitlane.mobile")
```

### Matchfile (iOS Sertifika Yönetimi)

```ruby
# apps/mobile/fastlane/Matchfile
git_url(ENV["MATCH_GIT_URL"])   # Private repo (sertifikalar)
storage_mode("git")
type("appstore")                # development | adhoc | appstore
app_identifier(["app.pitlane.mobile"])
username(ENV["APPLE_ID"])
```

### Fastfile

```ruby
# apps/mobile/fastlane/Fastfile
default_platform(:ios)

# ─── ORTAK ────────────────────────────────────────────────
def build_number_from_git
  sh("git rev-list --count HEAD").strip.to_i
end

# ─── iOS ──────────────────────────────────────────────────
platform :ios do

  desc "Sertifikaları yenile"
  lane :certificates do
    match(type: "appstore", readonly: true)
  end

  desc "Staging: TestFlight'a yükle"
  lane :beta do
    build_num = build_number_from_git

    match(type: "appstore", readonly: true)

    flutter_build = sh(
      "flutter build ios --release --no-codesign " \
      "--dart-define=APP_ENV=staging " \
      "--dart-define=API_BASE_URL=#{ENV['STAGING_API_URL']} " \
      "--dart-define=SUPABASE_URL=#{ENV['STAGING_SUPABASE_URL']} " \
      "--dart-define=SUPABASE_ANON_KEY=#{ENV['STAGING_SUPABASE_ANON_KEY']}",
      log: true
    )

    build_ios_app(
      workspace:      "Runner.xcworkspace",
      scheme:         "Runner",
      configuration:  "Release",
      export_method:  "app-store",
      build_path:     "./build",
      output_directory: "./build/ios",
      export_options: {
        provisioningProfiles: {
          "app.pitlane.mobile" => "match AppStore app.pitlane.mobile"
        }
      }
    )

    upload_to_testflight(
      skip_waiting_for_build_processing: true,
      changelog: File.read("fastlane/metadata/ios/tr/release_notes.txt")
    )

    slack(
      message: "✅ iOS Staging #{build_num} TestFlight'a yüklendi!",
      slack_url: ENV["SLACK_WEBHOOK_URL"]
    ) if ENV["SLACK_WEBHOOK_URL"]
  end

  desc "Production: App Store'a gönder"
  lane :release do
    build_num = build_number_from_git

    match(type: "appstore", readonly: true)

    sh(
      "flutter build ios --release --no-codesign " \
      "--dart-define=APP_ENV=production " \
      "--dart-define=API_BASE_URL=#{ENV['PROD_API_URL']} " \
      "--dart-define=SUPABASE_URL=#{ENV['PROD_SUPABASE_URL']} " \
      "--dart-define=SUPABASE_ANON_KEY=#{ENV['PROD_SUPABASE_ANON_KEY']} " \
      "--dart-define=CF_IMAGES_ACCOUNT_HASH=#{ENV['CF_IMAGES_ACCOUNT_HASH']}",
      log: true
    )

    build_ios_app(
      workspace:      "Runner.xcworkspace",
      scheme:         "Runner",
      configuration:  "Release",
      export_method:  "app-store",
    )

    upload_to_app_store(
      force:                          true,
      reject_if_possible:             true,
      submit_for_review:              false,   # Manuel review onayı tercih edilir
      automatic_release:              false,
      metadata_path:                  "./fastlane/metadata/ios",
      skip_screenshots:               false,
      skip_binary_upload:             false,
    )

    slack(
      message: "🚀 iOS #{build_num} App Store'a gönderildi! Review bekleniyor.",
      slack_url: ENV["SLACK_WEBHOOK_URL"]
    ) if ENV["SLACK_WEBHOOK_URL"]
  end
end

# ─── Android ──────────────────────────────────────────────
platform :android do

  desc "Staging: Internal Testing'e yükle"
  lane :beta do
    build_num = build_number_from_git

    sh(
      "flutter build appbundle --release " \
      "--dart-define=APP_ENV=staging " \
      "--dart-define=API_BASE_URL=#{ENV['STAGING_API_URL']} " \
      "--dart-define=SUPABASE_URL=#{ENV['STAGING_SUPABASE_URL']} " \
      "--dart-define=SUPABASE_ANON_KEY=#{ENV['STAGING_SUPABASE_ANON_KEY']}",
      log: true
    )

    upload_to_play_store(
      track:       "internal",
      aab:         "../build/app/outputs/bundle/release/app-release.aab",
      skip_upload_apk: true,
    )
  end

  desc "Production: Play Store'a gönder (production track)"
  lane :release do
    sh(
      "flutter build appbundle --release " \
      "--dart-define=APP_ENV=production " \
      "--dart-define=API_BASE_URL=#{ENV['PROD_API_URL']} " \
      "--dart-define=SUPABASE_URL=#{ENV['PROD_SUPABASE_URL']} " \
      "--dart-define=SUPABASE_ANON_KEY=#{ENV['PROD_SUPABASE_ANON_KEY']} " \
      "--dart-define=CF_IMAGES_ACCOUNT_HASH=#{ENV['CF_IMAGES_ACCOUNT_HASH']}",
      log: true
    )

    upload_to_play_store(
      track:               "production",
      rollout:             "0.1",          # %10 kademeli yayın
      aab:                 "../build/app/outputs/bundle/release/app-release.aab",
      skip_upload_apk:     true,
      metadata_path:       "./fastlane/metadata/android",
    )
  end
end
```

---

## 3. GitHub Actions — Mobil Build

```yaml
# .github/workflows/mobile-beta.yml
name: Mobile Beta

on:
  push:
    branches: [main]
    paths:
      - 'apps/mobile/**'
      - '.github/workflows/mobile-beta.yml'

jobs:
  ios-beta:
    name: iOS → TestFlight
    runs-on: macos-14  # Apple Silicon

    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }   # build_number_from_git için tüm history

      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.22.0'
          cache: true

      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.3'
          bundler-cache: true
          working-directory: apps/mobile

      - name: Sertifikalar (Match)
        working-directory: apps/mobile
        env:
          MATCH_GIT_URL:          ${{ secrets.MATCH_GIT_URL }}
          MATCH_PASSWORD:         ${{ secrets.MATCH_PASSWORD }}
          APPLE_ID:               ${{ secrets.APPLE_ID }}
          APPLE_TEAM_ID:          ${{ secrets.APPLE_TEAM_ID }}
        run: bundle exec fastlane ios certificates

      - name: Flutter pub get + codegen
        working-directory: apps/mobile
        run: |
          flutter pub get
          dart run build_runner build --delete-conflicting-outputs

      - name: TestFlight'a yükle
        working-directory: apps/mobile
        env:
          APPLE_ID:                   ${{ secrets.APPLE_ID }}
          ITC_TEAM_ID:                ${{ secrets.ITC_TEAM_ID }}
          APPLE_TEAM_ID:              ${{ secrets.APPLE_TEAM_ID }}
          MATCH_GIT_URL:              ${{ secrets.MATCH_GIT_URL }}
          MATCH_PASSWORD:             ${{ secrets.MATCH_PASSWORD }}
          STAGING_API_URL:            ${{ secrets.STAGING_API_URL }}
          STAGING_SUPABASE_URL:       ${{ secrets.STAGING_SUPABASE_URL }}
          STAGING_SUPABASE_ANON_KEY:  ${{ secrets.STAGING_SUPABASE_ANON_KEY }}
          APP_STORE_CONNECT_API_KEY_ID:       ${{ secrets.ASC_KEY_ID }}
          APP_STORE_CONNECT_API_ISSUER_ID:    ${{ secrets.ASC_ISSUER_ID }}
          APP_STORE_CONNECT_API_KEY_CONTENT:  ${{ secrets.ASC_KEY_CONTENT }}
          SLACK_WEBHOOK_URL:          ${{ secrets.SLACK_WEBHOOK_URL }}
        run: bundle exec fastlane ios beta

  android-beta:
    name: Android → Internal Testing
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }

      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.22.0'
          cache: true

      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.3'
          bundler-cache: true
          working-directory: apps/mobile

      - name: Keystore (Android İmzalama)
        working-directory: apps/mobile/android
        env:
          KEYSTORE_BASE64: ${{ secrets.ANDROID_KEYSTORE_BASE64 }}
        run: echo "$KEYSTORE_BASE64" | base64 --decode > pitlane.keystore

      - name: Flutter pub get + codegen
        working-directory: apps/mobile
        run: |
          flutter pub get
          dart run build_runner build --delete-conflicting-outputs

      - name: Internal Testing'e yükle
        working-directory: apps/mobile
        env:
          GOOGLE_PLAY_JSON_KEY_PATH:  ${{ secrets.GOOGLE_PLAY_JSON_KEY_PATH }}
          STAGING_API_URL:            ${{ secrets.STAGING_API_URL }}
          STAGING_SUPABASE_URL:       ${{ secrets.STAGING_SUPABASE_URL }}
          STAGING_SUPABASE_ANON_KEY:  ${{ secrets.STAGING_SUPABASE_ANON_KEY }}
          ANDROID_KEYSTORE_PATH:      android/pitlane.keystore
          ANDROID_KEY_ALIAS:          ${{ secrets.ANDROID_KEY_ALIAS }}
          ANDROID_STORE_PASSWORD:     ${{ secrets.ANDROID_STORE_PASSWORD }}
          ANDROID_KEY_PASSWORD:       ${{ secrets.ANDROID_KEY_PASSWORD }}
        run: bundle exec fastlane android beta
```

---

## 4. Android İmzalama Konfigürasyonu

```groovy
// apps/mobile/android/app/build.gradle
android {
    ...
    signingConfigs {
        release {
            storeFile     file(System.getenv("ANDROID_KEYSTORE_PATH") ?: "pitlane.keystore")
            storePassword System.getenv("ANDROID_STORE_PASSWORD")
            keyAlias      System.getenv("ANDROID_KEY_ALIAS")
            keyPassword   System.getenv("ANDROID_KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Keystore Oluşturma (Bir Kez)

```bash
keytool -genkey -v \
  -keystore pitlane.keystore \
  -alias pitlane \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Base64'e çevir → GitHub Secret'a ekle
base64 -i pitlane.keystore | pbcopy
```

> ⚠️ `pitlane.keystore` dosyası asla Git'e commit edilmez. `.gitignore`'a ekle.

---

## 5. App Store Başvuru Süreci

### Ön Koşullar

- [ ] Apple Developer Program üyeliği ($99/yıl)
- [ ] App Store Connect'te uygulama oluşturuldu (`app.pitlane.mobile`)
- [ ] Bundle ID kayıtlı
- [ ] App Store Connect API key oluşturuldu (Fastlane için)
- [ ] Firebase projesi kuruldu (FCM için `GoogleService-Info.plist`)

### App Store Meta Veri

```
# fastlane/metadata/ios/tr/name.txt
Pitlane — Araç & Moto Sosyal

# fastlane/metadata/ios/tr/subtitle.txt
Otomobil tutkunları için harita

# fastlane/metadata/ios/tr/keywords.txt
araba,motosiklet,otomobil,cruise,buluşma,topluluk,harita,araç,modifiye,classic

# fastlane/metadata/ios/tr/description.txt
Pitlane, araç ve motosiklet tutkunlarını gerçek zamanlı bir haritada birleştirir.

• Şehrindeki cruise ve buluşmaları haritada gör
• Topluluk oluştur veya katıl
• Acil yardım sinyali gönder, yakındakilere ulaş
• Doğrulanmış tamirci ve garajları bul
• Otomotiv overlay'li Snap kamera ile anlarını paylaş

Reklam yok. Mahremiyet varsayılan açık.
```

### App Store Ekran Görüntüleri

| Boyut | Cihaz | Adet |
|---|---|---|
| 6.9" (1320×2868) | iPhone 16 Pro Max | 3–10 |
| 6.5" (1242×2688) | iPhone 11 Pro Max | 3–10 |
| 5.5" (1242×2208) | iPhone 8 Plus | 3–10 |
| 12.9" iPad Pro | iPad | 3–10 (opsiyonel) |

Ekran görüntüleri `fastlane/screenshots/` altında saklanır.
`fastlane snapshot` veya Figma'dan export ile üretilebilir.

### Review İçin Hazırlık Kontrol Listesi (Apple Guideline)

```
Guideline 1.2  — Kullanıcı Oluşturulan İçerik
  [x] Şikayet & engelleme mekanizması ürün-içi mevcut
  [x] Topluluk kuralları metni uygulamada gösteriliyor
  [x] Moderasyon süreci belgelenmiş (admin paneli)

Guideline 2.1  — App Completeness
  [x] Demo hesap bilgileri review notuna eklendi
  [x] Tüm özellikler çalışıyor (staging ortamı)

Guideline 4.0  — Design
  [x] iOS Human Interface Guidelines uyumu kontrol edildi
  [x] Safe area, Dynamic Type, Dark Mode test edildi

Guideline 5.1.1(v) — Hesap Silme
  [x] Ayarlar > Hesabı Sil akışı çalışıyor
  [x] Silme işlemi 30 gün içinde tamamlanıyor

Guideline 5.1.2  — Veri Kullanımı & Paylaşımı
  [x] Gizlilik politikası URL'si App Store Connect'e girildi
  [x] App Privacy nutrition label dolduruldu

ATT (App Tracking Transparency)
  [x] Konum izni rationale ekranı mevcut
  [x] NSLocationWhenInUseUsageDescription dolduruldu
  [x] NSLocationAlwaysAndWhenInUseUsageDescription dolduruldu
```

### App Privacy Nutrition Label

| Veri Türü | Kullanım | Takip? |
|---|---|---|
| Hassas Konum | Harita özelliği | Hayır (H3 hücre, ham GPS değil) |
| Ad | Profil | Hayır |
| E-posta | Hesap | Hayır |
| Kullanıcı İçeriği (fotoğraf/video) | Paylaşım | Hayır |
| Tanımlayıcılar (User ID) | Uygulama işlevselliği | Hayır |

### Review Notuna Eklenecekler

```
Demo Hesap:
  E-posta: reviewer@pitlane.app
  OTP: Supabase test ortamından otomatik (ya da sabit: 123456)

Notlar:
  - Konum özelliği için simülatörde Xcode > Features > Location > Custom Location kullanın
  - Harita için Google Maps API key staging ortamına girilmiştir
  - WebSocket servisi staging.realtime.pitlane.app adresinde çalışmaktadır
  - Acil yardım özelliği test için "Test Yardım" butonuyla tetiklenebilir
```

---

## 6. Google Play Başvuru Süreci

### Ön Koşullar

- [ ] Google Play Developer hesabı ($25 tek seferlik)
- [ ] Servis hesabı JSON key (Fastlane için)
- [ ] Firebase projesi kuruldu (`google-services.json`)
- [ ] İçerik Derecelendirmesi anketi tamamlandı (PEGI / IARC)

### Play Store Meta Veri

```
# fastlane/metadata/android/tr-TR/title.txt
Pitlane — Araç & Moto Sosyal

# fastlane/metadata/android/tr-TR/short_description.txt
Araç ve motosiklet tutkunları için harita odaklı sosyal ağ.

# fastlane/metadata/android/tr-TR/full_description.txt
[App Store açıklamasıyla aynı içerik]
```

### Kademeli Yayın (Staged Rollout)

```ruby
# Fastfile — production lane
upload_to_play_store(
  track:   "production",
  rollout: "0.1",   # %10 ile başla
)

# 24 saat sorun yoksa %50'ye çıkar
upload_to_play_store(
  track:   "production",
  rollout: "0.5",
)

# 48 saat sorun yoksa %100'e çıkar
upload_to_play_store(
  track:   "production",
  rollout: "1.0",
)
```

### Data Safety Form (Play Store)

| Veri | Toplanıyor mu? | Paylaşılıyor mu? | Şifreli mi? |
|---|---|---|---|
| Konum (yaklaşık) | Evet | Hayır | Evet (TLS) |
| Ad | Evet | Hayır | Evet |
| E-posta | Evet | Hayır | Evet |
| Fotoğraf/Video | Evet | Kullanıcı tercihi | Evet |
| Mesajlar | Evet | Hayır | Evet |

---

## 7. Backend Dağıtımı (Fly.io)

### fly.toml — Backend

```toml
# apps/backend/fly.toml
app    = "pitlane-api"
primary_region = "fra"   # Frankfurt (TR'ye yakın)

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT     = "3000"
  LOG_LEVEL = "info"

[http_service]
  internal_port       = 3000
  force_https         = true
  auto_stop_machines  = true
  auto_start_machines = true
  min_machines_running = 1

  [http_service.concurrency]
    type       = "requests"
    hard_limit = 500
    soft_limit = 400

[[vm]]
  size = "performance-1x"   # 1 vCPU, 2 GB

[checks]
  [checks.health]
    grace_period = "10s"
    interval     = "30s"
    method       = "GET"
    path         = "/health"
    protocol     = "http"
    timeout      = "5s"
```

### fly.toml — Realtime (Go)

```toml
# apps/realtime/fly.toml
app    = "pitlane-realtime"
primary_region = "fra"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8080"

[http_service]
  internal_port       = 8080
  force_https         = true
  auto_stop_machines  = false   # WebSocket: kapatma
  auto_start_machines = true
  min_machines_running = 2      # Her zaman 2 instance

  [http_service.concurrency]
    type       = "connections"
    hard_limit = 25000
    soft_limit = 20000

[[vm]]
  size = "performance-2x"   # 2 vCPU, 4 GB — WebSocket yoğun

[checks]
  [checks.health]
    grace_period = "5s"
    interval     = "15s"
    method       = "GET"
    path         = "/health"
    protocol     = "http"
    timeout      = "3s"
```

### Backend Deploy Komutları

```bash
# İlk kurulum (bir kez)
fly launch --name pitlane-api --region fra
fly secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... --app pitlane-api

# Staging deploy
fly deploy --app pitlane-api-staging --image ghcr.io/pitlane/api:staging

# Production deploy
fly deploy --app pitlane-api --image ghcr.io/pitlane/api:latest

# Scale (gerektiğinde)
fly scale count 3 --app pitlane-api
fly scale vm performance-2x --app pitlane-api

# Loglar
fly logs --app pitlane-api
```

---

## 8. Supabase Migration (Production)

```bash
# Staging'de test et
supabase db push --db-url postgresql://postgres:...@staging-db.supabase.co:5432/postgres

# Production'a uygula
supabase db push --db-url postgresql://postgres:...@prod-db.supabase.co:5432/postgres

# Geri alma (down migration varsa)
supabase migration repair --status reverted <migration_id>

# Branch workflow (öneri)
# 1. supabase db branch create feature/xxx
# 2. Değişiklikleri test et
# 3. supabase db branch merge feature/xxx → main → prod
```

> Her migration öncesi Supabase dashboard'dan **manuel yedek** al.

---

## 9. Sürüm Yönetimi

### Versiyon Numarası Kuralı

```
Format: MAJOR.MINOR.PATCH+BUILD
Örnek:  1.4.2+142

MAJOR → Kırıcı değişiklik veya büyük yeniden tasarım
MINOR → Yeni özellik (geriye uyumlu)
PATCH → Hata düzeltme
BUILD → Git commit sayısı (otomatik: git rev-list --count HEAD)
```

### pubspec.yaml Güncelleme

```yaml
# Her release öncesi manuel güncellenir
version: 1.0.0+1   # → 1.0.1+2 → 1.1.0+3 ...
```

### Git Tag Stratejisi

```bash
# Her production release için tag
git tag -a v1.0.0 -m "V1.0.0 — App Store / Play Store ilk yayın"
git push origin v1.0.0

# Hotfix
git tag -a v1.0.1 -m "V1.0.1 — Harita crash düzeltmesi"
git push origin v1.0.1
```

### API Versiyonlama

```
/v1/...   — Mevcut (destekleniyor)
/v2/...   — Breaking change sonrası (v1 6 ay daha desteklenir)

Breaking change örnekleri:
  - Response alanı kaldırıldı veya yeniden adlandırıldı
  - Zorunlu request alanı eklendi
  - Davranış değişikliği (hata kodu değişimi)
```

---

## 10. Yayın Öncesi Kontrol Listesi

### Her Release İçin (Sprint Sonu / Hotfix)

```markdown
## Release Kontrol Listesi — v{X.Y.Z}

### Kod Kalitesi
- [ ] CI tüm testler yeşil
- [ ] Sentry'de sıfır yeni unhandled error (staging)
- [ ] Flutter analyze 0 hata
- [ ] Performance bütçesi aşılmıyor (DevTools profil)

### Güvenlik
- [ ] `gitleaks` taraması temiz
- [ ] `pnpm audit` kritik açık yok
- [ ] `govulncheck` temiz

### Fonksiyonel Test (Staging Üzerinde)
- [ ] E2E-01: Kayıt & Giriş ✓
- [ ] E2E-02: Flare Oluşturma ✓
- [ ] E2E-03: Acil Yardım ✓
- [ ] E2E-04: DM Mesajlaşma ✓
- [ ] E2E-05: Hayalet Mod ✓
- [ ] Push bildirimi alınıyor (iOS + Android)
- [ ] Medya yükleme çalışıyor (foto + video)

### App Store / Play Store
- [ ] Ekran görüntüleri güncel
- [ ] Release notes yazıldı (TR + EN)
- [ ] Privacy labels doğru
- [ ] Sürüm numarası güncellendi (pubspec.yaml)

### Backend
- [ ] DB migration'ları staging'de test edildi
- [ ] Migration'lar production'a uygulandı
- [ ] API health check yeşil
- [ ] Fly.io deployment başarılı
- [ ] Cloudflare Images varyantları doğru

### İzleme
- [ ] Sentry alertleri aktif
- [ ] Fly.io metrics paneli açık
- [ ] PostHog olay izleme çalışıyor

### Acil Durum Planı
- [ ] Rollback komutu hazır (`fly releases rollback`)
- [ ] Play Store kademeli yayın (%10 ile başla)
- [ ] On-call kişisi belirlendi
```

---

## 11. Hotfix Süreci

```bash
# 1. main'den hotfix branch aç
git checkout -b hotfix/v1.0.1 main

# 2. Düzeltmeyi yap + test et
# ...

# 3. Versiyon güncelle
# pubspec.yaml: 1.0.0+1 → 1.0.1+2

# 4. PR: hotfix/v1.0.1 → main
# Tek reviewer yeterli (hız için)

# 5. Merge sonrası otomatik deploy (CI tetikler)

# 6. Tag oluştur
git tag -a v1.0.1 -m "Hotfix: [açıklama]"
git push origin v1.0.1

# 7. App Store / Play Store'da hızlı review talep et
# App Store Connect → Expedited Review
# Play Store → Otomatik (genelde 2-3 saat)
```

---

## 12. İzleme & Alarm

### Fly.io — Uptime Monitor

```bash
# Fly.io status webhook (Slack entegrasyonu)
fly monitoring create --app pitlane-api \
  --type http \
  --url https://api.pitlane.app/health \
  --interval 60
```

### Sentry Alarm Kuralları

| Alarm | Eşik | Bildirim |
|---|---|---|
| Crash rate artışı | %0.5 üzeri | Slack + E-posta |
| Yeni `INTERNAL_ERROR` | 10/dakika üzeri | Slack |
| P95 yanıt süresi | 800ms üzeri | Slack |
| WebSocket bağlantı düşüşü | %20 anlık düşüş | PagerDuty |

### PostHog — Ürün Metrikleri İzleme

| Metrik | İzleme Sıklığı | Hedef |
|---|---|---|
| DAU / MAU | Günlük | MAU 25k (90. gün) |
| 7-gün retention | Haftalık | %35 |
| Flare oluşturma | Günlük | 200+/gün |
| Acil yardım yanıt süresi | Günlük | < 8 dakika |
| App Store puanı | Haftalık | ≥ 4.5 |
```
