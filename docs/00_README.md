# Rollpit — Geliştirme Dokümantasyonu

> Otomobil ve motosiklet tutkunları için harita odaklı, premium, reklamsız sosyal ağ.

Bu dizin, projenin sıfırdan App Store / Google Play yayın kalitesine ulaşana kadar takip edilecek tüm mimari, sprint ve teknik kararlarını içerir. Sırayla okunması tavsiye edilir; ancak track bazlı çalışırken doğrudan ilgili dosyaya gidilebilir.

## Marka Kararı

Marka adı **Rollpit** olarak seçilmiştir.

App Store / Play Store başlığı: **"Rollpit — Car & Moto Social"**.

Kod tabanı ve altyapı adları:

| Alan | Değer |
|---|---|
| GitHub repo | `Ayazaga-Boys/rollpit` |
| Flutter package | `rollpit` |
| Mobile bundle/package ID | `app.rollpit.mobile` |
| API app | `rollpit-api` |
| Realtime app | `rollpit-realtime` |
| Admin app | `rollpit-admin` |

"Snap" terimi yalnızca kamera özelliği için kullanılır: **Snap Kamera**.

## Doküman Haritası

### Çekirdek (01-14) — Mimari & Geliştirme

| # | Dosya | İçerik | Hedef Kitle |
|---|---|---|---|
| 01 | `01_PROJE_GENEL_BAKIS.md` | Vizyon, kullanıcı, MVP kapsamı, başarı metrikleri | Herkes |
| 02 | `02_TEKNOLOJI_YIGINI.md` | Stack, sürüm pinleri, paket listesi, gerekçe | Tüm geliştiriciler |
| 03 | `03_MIMARI_KURALLAR.md` | İhlal edilemez 4 mimari kural | Tüm geliştiriciler |
| 04 | `04_VERITABANI_SEMA.md` | Postgres tabloları, indeksler, RLS politikaları | Backend |
| 05 | `05_API_KONTRATI.md` | REST + WS endpoint listesi, Zod şemaları, hata modeli | Backend + Flutter |
| 06 | `06_GUVENLIK_MAHREMIYET.md` | JWT, RLS, hayalet mod, H3 mahremiyet detayları | Backend + Flutter + Go |
| 07 | `07_SPRINT_YOL_HARITASI.md` | 12 haftalık sprint planı, kilometre taşları | Herkes |
| 08 | `08_TRACK2_FLUTTER.md` | Flutter klasör yapısı, Riverpod, GoRouter, harita | Flutter |
| 09 | `09_TRACK3_BACKEND.md` | Node/TS klasör yapısı, middleware, Supabase, Trigger.dev | Backend |
| 10 | `10_TRACK4_GO_SERVISI.md` | Go WebSocket servisi, Valkey, H3 yayın mantığı | Go |
| 11 | `11_MEDYA_PIPELINE.md` | R2 + Images + Stream akışı, sıkıştırma, doğrulama | Backend + Flutter |
| 12 | `12_ADMIN_PANEL.md` | Next.js admin paneli ekranları ve yetkilendirme | Web |
| 13 | `13_TEST_KALITE.md` | Test piramidi, CI/CD, lint, performans bütçesi | Herkes |
| 14 | `14_DAGITIM_YAYIN.md` | Hosting, sertifikalar, App Store / Play Store süreci | DevOps + Ürün |

### Tasarım & Ürün (15-19)

| # | Dosya | İçerik | Hedef Kitle |
|---|---|---|---|
| 15 | `15_TASARIM_SISTEMI.md` | Renk, tipografi, motion, komponent kataloğu | Tasarım + Flutter |
| 16 | `16_URUN_GEREKSINIMLERI.md` | Persona, user story, kabul kriterleri (PRD) | Herkes |
| 17 | `17_KVKK_GIZLILIK_POLITIKASI.md` | KVKK + GDPR şablonu, App/Play Privacy Labels | Hukuk + Ürün |
| 18 | `18_TOPLULUK_KURALLARI.md` | Kullanıcı kuralları + moderatör runbook | CM + Ürün |
| 19 | `19_KULLANICI_AKISLARI.md` | 14 kritik user flow şeması ve edge case'ler | Herkes |

### Operasyon & Büyüme (20-26)

| # | Dosya | İçerik | Hedef Kitle |
|---|---|---|---|
| 20 | `20_BILDIRIM_STRATEJI.md` | Push taksonomisi, payload, A/B test | Backend + Mobile |
| 21 | `21_BUYUME_PAZARLAMA.md` | TR motorcu/arabacı kazanım planı, ASO, kanal stratejisi | Pazarlama + Ürün |
| 22 | `22_OBSERVABILITY_RUNBOOK.md` | Logs, metrics, alarm, on-call | DevOps + Backend |
| 23 | `23_INCIDENT_RUNBOOK.md` | Major incident süreci + post-mortem şablonu | Herkes |
| 24 | `24_MUSTERI_DESTEK.md` | Destek kanalları, SLA, yanıt şablonları, SSS | CM + Ürün |
| 25 | `25_GELIR_MODELI.md` | İşletme pin fiyatları, premium plan, faturalandırma | Ürün + Finans |
| 26 | `26_LOKALIZASYON_ERISILEBILIRLIK.md` | i18n (TR/EN), WCAG AA, screen reader | Tasarım + Flutter |

### Track Paketleri (Kişiye Özel)

| Dosya | İçerik |
|---|---|
| `KISI_1_TRACK.md` | Flutter mobile + Go realtime sahibi için yol haritası |
| `KISI_2_TRACK.md` | Backend (Node/TS) + medya pipeline sahibi için yol haritası |
| `KISI_3_TRACK.md` | Admin panel (Next.js) sahibi için yol haritası |

## Çalışma Yöntemi

- Geliştirme **3 paralel track**'te yürütülür: **Track 2 (Flutter)**, **Track 3 (Backend Node/TS)**, **Track 4 (Go Realtime)**.
- Her sprint **2 hafta**, sprint sonunda **demo + retro**.
- Her PR'da: lint pass + unit test + en az 1 reviewer onayı + CI yeşil.
- Magic number yok, tüm sabitler `core/constants/` altında.
- Her özellik bir **feature flag** arkasında başlar (`Supabase remote config`).

## Hızlı Başlangıç (Geliştirici)

```bash
# 1. Repo klonla
git clone git@github.com:Ayazaga-Boys/rollpit.git && cd rollpit

# 2. Submodüller (mobil / backend / realtime / admin tek monorepoda)
pnpm install                # backend + admin
cd apps/mobile && flutter pub get
cd apps/realtime && go mod tidy

# 3. Ortam değişkenleri
cp .env.example .env.local  # tüm gizli değerler 1Password'tan

# 4. Yerel geliştirme
pnpm dev                    # backend :3000 + admin :3001
flutter run                 # mobil
go run ./cmd/realtime       # realtime :8080
```

## Sözleşme

Bu dokümanlar **canlı**dır. Karar değişikliği gerekiyorsa:
1. İlgili `.md` dosyasında PR aç
2. Commit mesajı: `docs(arch): change H3 resolution policy`
3. Tüm track lead'lerinden onay
4. Onay sonrası kod değişikliği serbest

## Dosya Yazım Kuralı

- Türkçe açıklama, İngilizce kod.
- Komut bloklarında her zaman ` ```bash `, ` ```ts `, ` ```dart `, ` ```go `, ` ```sql ` kullan.
- Ekran görüntüsü gerekiyorsa `docs/assets/` altında PNG.
