# 👤 KİŞİ 1 — Track Paketi (Burak)
> Full-stack · Mid/Senior · Rollpit Projesi

## Senin Sorumluluk Alanın

**Flutter Harita Ekranı + Go Realtime Servisi**

> Kişi 4 (Furkan) ekibe katıldı. Auth/UI ekranları Furkan'da.
> Sen: Go servisi + Flutter harita + WebSocket + konum altyapısı.

---

## Önce Oku (Sırayla)

| Sıra | Dosya | Neden |
|---|---|---|
| 1 | `00_README.md` | Projeye genel bakış |
| 2 | `03_MIMARI_KURALLAR.md` | **Kural 1 (Ham GPS yok) senin için kritik** |
| 3 | `06_GUVENLIK_MAHREMIYET.md` | H3 veri akışı, hayalet mod detayı |
| 4 | `10_TRACK4_GO_SERVISI.md` | Go WebSocket servisi, Valkey, broadcaster |
| 5 | `05_API_KONTRATI.md` | **WebSocket kontratı** bölümü |
| 6 | `08_TRACK2_FLUTTER.md` | Flutter klasör yapısı, tema |
| 7 | `15_TASARIM_SISTEMI.md` | Heatmap gradient, harita renkleri |
| 8 | `22_OBSERVABILITY_RUNBOOK.md` | Go zerolog + Prometheus |
| — | `09_TRACK3_BACKEND.md` | Erol'un endpoint'lerini anlamak için |

---

## Sprint Görevlerin

### Faz 0 + Sprint 1 — TAMAMLANDI ✅

- ✅ Flutter proje iskeleti (feature-first klasör yapısı)
- ✅ GoRouter konfigürasyonu (tüm route'lar)
- ✅ Supabase Flutter bağlantısı
- ✅ Auth ekranları (invite code, login, OTP) — **Furkan'a devredildi**
- ✅ AppColors, AppSpacing, AppTheme
- ✅ RollpitButton, RollpitTextField, MainShell
- ✅ Go: hub, client, message yapısı
- ✅ Go: JWT doğrulama (dev bypass dahil)
- ✅ Go: In-memory location store + TTL
- ✅ Go: `/health` + `/ws/location` endpoint'leri
- ✅ Go: Graceful shutdown
- ✅ iOS Simulator çalışıyor, app açılıyor

---

### Sprint 2 — Harita & Canlı Konum (Şimdiki Sprint)

**Erol'dan `GET /v1/map/heatmap` endpoint'ini bekle**

- [ ] Flutter: `h3_dart` paketini ekle, `location_utils.dart` gerçek implementasyona çevir
- [ ] Flutter: `geolocator` ile konum stream'i başlat
- [ ] Flutter: Konum izni akışı (`permission_handler`)
- [ ] Flutter: Google Maps entegrasyonu (API key Erol'dan)
- [ ] Flutter: WebSocket servisi (`WsService`) — Go'ya bağlan
- [ ] Flutter: H3 hücre → WS'e gönder (ham GPS değil!)
- [ ] Flutter: Isı haritası overlay (H3 Polygon, heatmap gradient)
- [ ] Flutter: Hayalet mod toggle (UI + WS ghost_on sinyali)
- [ ] Flutter: Harita filtreleri (araç tipi, pin tipi)
- [ ] Go: Valkey bağlantısı ekle (şu an in-memory, swap et)
- [ ] Go: Pub/Sub yayın mantığı (hücre bazlı)
- [ ] Go: k-ring genişletme (yakınlık sorgusu)
- [ ] Go: Prometheus metrics (`rollpit_ws_active_connections`)

---

### Sprint 5 — SOS Harita Entegrasyonu (Hafta 9-10)

> Furkan formu yazar, sen haritaya SOS pinlerini eklersin

- [ ] Flutter: Haritada açık yardım pinlerini göster
- [ ] Flutter: SOS butonu → Furkan'ın form ekranına yönlendir
- [ ] Go: Help request açılınca k-ring 2 yayını

---

### Sprint 6 — Go Performans (Hafta 11-12)

- [ ] Go: k6 ile 10k bağlantı load test
- [ ] Go: Sentry entegrasyonu
- [ ] Go: go.sum + go mod tidy son kontrol

---

## Kimi Bekliyoruz

| Kim | Ne | Ne Zaman |
|---|---|---|
| **Erol** | Supabase OTP email aktif etsin | Şimdi |
| **Erol** | Google Maps API key | Sprint 2 başı |
| **Erol** | `GET /v1/map/heatmap` endpoint | Sprint 2 başı |
| **Furkan** | Profil tamamlama ekranı | Sprint 1 sonu |

---

## Günlük Çalışma Akışı

```bash
# Terminal 1 — Go servisi
cd apps/realtime && go run ./cmd/realtime

# Terminal 2 — Backend (Erol'un)
cd apps/backend && pnpm --filter @rollpit/backend dev

# Terminal 3 — Flutter
cd apps/mobile && flutter run \
  --dart-define=API_BASE_URL=http://localhost:3000 \
  --dart-define=WS_BASE_URL=ws://localhost:8080 \
  --dart-define=SUPABASE_URL=https://wivydwazxppypebnkqry.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Kritik Hatırlatmalar

```
❌ ASLA: Flutter'dan ham lat/lng gönderme
✅ DOĞRU: h3_dart ile H3 hücresine çevir, sonra gönder

❌ ASLA: setState ile global state
✅ DOĞRU: AsyncNotifier + Riverpod

❌ ASLA: Magic number (8, 9, 300)
✅ DOĞRU: H3Constants, AppSpacing, sabitler

❌ ASLA: Medyayı backend'e gönder
✅ DOĞRU: Presigned URL ile direkt Cloudflare
```
