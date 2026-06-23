# 👤 KİŞİ 1 — V2 Track Paketi (Burak)
> Full-stack · Mid/Senior · Rollpit V2

## Senin V2 Sorumluluk Alanın

**Harita V2 + Go Realtime V2 — Sosyal Konum Katmanı**

V1'de harita = "yakındaki sürücüler + SOS". V2'de harita = "**sosyal harita**" — takip ettiğin insanların konumu, foto-bubble lokasyonlar, akıllı clustering, yeni WS event tipleri.

---

## V2 Önce Oku

Önce mevcut V1 doc'larını taze tut:
- `KISI_1_TRACK.md` — V1 bitiş notları
- `03_MIMARI_KURALLAR.md` — **Kural 1 (Ham GPS yok) V2'de de geçerli**
- `06_GUVENLIK_MAHREMIYET.md` — V2 privacy genişlemeleri
- `V2_VIZYON.md` — V2 master plan

---

## Sprint Görevlerin (V2)

### V2.0b — Araç İkonu Harita Entegrasyonu (Hafta 1-2 paralel)

> Bağımlılık: Erol'un `vehicles.icon_slug` alanı + ikon kataloğu endpoint'i

- [x] Custom marker: 11 araç SVG siluet ikonu (`assets/vehicle_icons/`) — 5 motor, 6 araba
- [x] **Performans**: `BitmapDescriptor` cache altyapısı hazır (`vehicle_marker_icon_provider.dart`)
- [x] Flutter: `icon_slug`'a göre marker'a ikon bağla — Erol `GET /v2/vehicles/icons` hazır
- [x] Zoom level < 12 → generic cluster, zoom ≥ 12 → araç ikonu göster
- [x] Kendi konumun için de araç ikonu (mavi outline vurgulu)

### V2.1 — Takip Sistemi Altyapısı (Hafta 1-2)

> Bağımlılık: Erol'un `follows` tablosu + `/v2/follows/*` endpoint'leri

- [x] Go realtime: `follows` cache (Valkey) — kullanıcı kimi takip ediyor
- [x] WS event: `presence_update` — takip ettiğim kullanıcı online/dnd/offline olduğunda
- [x] WS event: `location_share` — takip ettiğim kullanıcı konum güncellediğinde (eğer paylaşıyorsa)
- [x] Flutter: `followed_users_locations_provider` — haritada takip ettiklerini gösterir
- [x] Flutter: Konum paylaşımı kontrolü — kullanıcı kimlerle paylaşacağını seçer (ghost mode v2)

Not: Go realtime `follows:<user_id>` Valkey set'ini okur; backend follow/unfollow/accept akışında bu set'i best-effort sync eder.

### V2.2 — Foto-Bubble Lokasyonlar (Hafta 3-4)

> Bağımlılık: Erol'un `business_locations` tablosu + admin onayı (Tufan) hazır; mobil `GET /v2/business/locations/nearby?h3cell=&k=&category=` ile okuyabilir.

- [x] Flutter: harita marker → custom widget (foto + işletme adı + tür ikonu) — Erol bekliyor
- [x] Flutter: zoom level'a göre boyut animasyonu
- [x] Flutter: tap → işletme detay sheet
- [x] Görsel cache — Flutter image cache + `gaplessPlayback` ile flicker önleme

### V2.3 — Harita Clustering (Hafta 5-6)

- [x] Flutter: `google_maps_cluster_manager_2` entegrasyonu — zoom out'ta sayı badge'li cluster
- [x] Flutter: cluster tıklandığında zoom-in animasyonu
- [ ] Go realtime: H3 res-7 aggregation endpoint (opsiyonel — client-side yeterli şimdilik)
- [x] **Test**: 1000 marker stress test eklendi; gerçek cihaz FPS doğrulaması release profilde koşulacak

### V2.4 — Heatmap Filtreleri V2 (Hafta 7-8)

- [x] Flutter: filtre sheet'e yeni seçenekler:
  - "Sadece motorcu yoğunluğu" (kullanıcının vehicle_type == motorcycle filter)
  - "Sadece takip ettiklerim"
  - "İşletmeleri gizle"
- [x] Go realtime: heatmap çağrısında `vehicle_type` filtresi
- [x] Backend (Erol'la birlikte): cell count'ları araç tipi başına ayrı tutma

### V2.5 — SOS Hedefleme V2 (Hafta 9-10)

- [x] Go realtime: `help_targeted` WS event'i — `target_type: 'nearby' | 'followers' | 'group'`
- [x] Go realtime: `target_type === 'followers'/'group'` → `target_ids` listesine fanout
- [x] Renk kodlu aciliyet payload'ı: `urgency: 'critical' | 'urgent' | 'request'`
- [ ] Flutter: SOS form'unda hedef seçimi — Furkan UI yapacak

### V2.6 — Story & Post WS Event'leri (Hafta 11-12)

- [x] Go realtime: `story_posted`, `post_liked`, `post_commented` event'leri
- [x] Go realtime: `/internal/realtime/social-event` endpoint
- [x] Flutter WsService: story/post event parse + stream
- [x] Map screen: `story_posted` snackbar bildirimi
- [x] **Test**: 1k kullanıcı × 10 follower × story → WS fanout latency p(95) < 200ms k6 senaryosu eklendi

---

## Yeni WS Event Kontratı (V2)

```typescript
// İngoing
type V2InboundMessage =
  | { type: 'location'; h3_cell: string }
  | { type: 'subscribe_cell'; h3_cell: string; k: number }
  | { type: 'unsubscribe_cell'; h3_cell: string }
  | { type: 'ghost_on' }
  | { type: 'ghost_off' }
  | { type: 'subscribe_user'; user_id: string }     // YENİ: takip ettiğim kullanıcı
  | { type: 'unsubscribe_user'; user_id: string };  // YENİ

// Outgoing
type V2OutboundMessage =
  | { type: 'heatmap_update'; cells: Record<string, number> }
  | { type: 'help_nearby'; help_id: string; h3_cell: string; urgency: string }
  | { type: 'help_targeted'; help_id: string; target_type: string; urgency: string }
  | { type: 'presence_update'; user_id: string; status: 'online' | 'dnd' | 'offline' }  // YENİ
  | { type: 'location_share'; user_id: string; h3_cell: string }    // YENİ
  | { type: 'story_posted'; user_id: string; story_id: string }     // YENİ
  | { type: 'post_liked'; post_id: string; liker_id: string }       // YENİ
  | { type: 'post_commented'; post_id: string; commenter_id: string }; // YENİ
```

---

## Kişi 1 Sahip Olduğun Secret'lar (V2 değişimi yok)

```bash
# apps/realtime/.env
VALKEY_ADDR=...
SUPABASE_JWT_SECRET=...
GO_WS_INTERNAL_SECRET=...
SENTRY_DSN=...
```

---

## Diğer Track'lerle Bağımlılıkların

| Bağımlılık | Kimden | Ne Zaman |
|---|---|---|
| `follows` tablosu + endpoint | Erol | V2.1 başı |
| `business_locations` (foto + onay durumu) | Erol + Tufan | V2.2 |
| Heatmap'te vehicle_type filtresi | Erol | V2.4 |
| `help_targeted` payload kontratı | Erol | V2.5 |
| Story/post WS event tetikleyici | Erol (backend yayın) | V2.6 |

---

## Kritik Hatırlatmalar (V2)

```
❌ ASLA: Takip eden kullanıcının konumu ghost mode'da paylaşılma
✅ DOĞRU: ghost_on aktifse location_share suppress edilir

❌ ASLA: Tüm follower'lara her konum güncellemesinde WS atma (gürültü)
✅ DOĞRU: H3 hücresi değiştiğinde tek event, 30 sn cooldown

❌ ASLA: Map clustering'i client-side 1000+ marker'da yap (FPS düşer)
✅ DOĞRU: Server-side aggregation, client sadece render eder

❌ ASLA: Story/post WS event'lerine medya URL'i koy (CDN'den tetiklensin)
✅ DOĞRU: Sadece ID + minimum metadata, client API'den alır
```
