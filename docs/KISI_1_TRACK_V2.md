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

- [ ] Flutter: kullanıcının aktif aracının `icon_slug`'ına göre custom marker widget
- [ ] Custom marker: basit SVG/PNG siluet (motosiklet, araba, chopper, pickup, suv, van, klasik, diğer)
- [ ] Araç markasına özel ikonlar (Golf, BMW, Harley vb.) — isteğe bağlı genişletme
- [ ] Zoom level < 12 → generic cluster, zoom ≥ 12 → araç ikonu göster
- [ ] Kendi konumun için de araç ikonu (mavi outline ile vurgulansa iyi olur)
- [ ] Ghost mode aktifse ikon haritada görünmez (V1 davranışı korunur)
- [ ] `GET /v2/vehicles/icons` endpoint'inden ikon kataloğunu çek (Erol yazar)
- [ ] **Performans**: marker başına SVG render değil, `BitmapDescriptor` cache kullan

### V2.1 — Takip Sistemi Altyapısı (Hafta 1-2)

> Bağımlılık: Erol'un `follows` tablosu + `/v2/follows/*` endpoint'leri

- [x] Go realtime: `follows` cache (Valkey) — kullanıcı kimi takip ediyor
- [x] WS event: `presence_update` — takip ettiğim kullanıcı online/dnd/offline olduğunda
- [x] WS event: `location_share` — takip ettiğim kullanıcı konum güncellediğinde (eğer paylaşıyorsa)
- [ ] Flutter: `followed_users_locations_provider` — haritada takip ettiklerini gösterir
- [ ] Flutter: Konum paylaşımı kontrolü — kullanıcı kimlerle paylaşacağını seçer (ghost mode v2)

Not: Go realtime `follows:<user_id>` Valkey set'ini okur; backend bu cache'i doldurmadığında `subscribe_user` güvenlik için `FORBIDDEN` döner.

### V2.2 — Foto-Bubble Lokasyonlar (Hafta 3-4)

> Bağımlılık: Erol'un `business_locations` tablosu + admin onayı (Tufan)

- [ ] Flutter: harita marker → custom widget (foto + işletme adı + tür ikonu)
- [ ] Flutter: zoom level'a göre boyut animasyonu
- [ ] Flutter: tap → işletme detay sheet (bizdeki business_pin detail genişlemesi)
- [ ] Görsel cache — `cached_network_image` ile flicker önleme
- [ ] Onaylanmamış işletmeler haritada görünmez (filter)

### V2.3 — Harita Clustering (Hafta 5-6)

> Performans kritik: 10k+ aktif kullanıcı + 1000+ işletme zoom out edildiğinde donmamalı

- [ ] Go realtime: H3 res-7 aggregation endpoint — `GET /internal/realtime/h3-aggregate?bounds=...`
- [ ] Flutter: zoom out edilince marker'lar cluster (sayı badge'i ile)
- [ ] Flutter: cluster tıklandığında zoom-in animasyonu
- [ ] `google_maps_cluster_manager` paketi veya custom implementasyon
- [ ] **Test**: 1000 marker ile FPS > 50

### V2.4 — Heatmap Filtreleri V2 (Hafta 7-8)

- [ ] Flutter: filtre sheet'e yeni seçenekler:
  - "Sadece motorcu yoğunluğu" (kullanıcının vehicle_type == motorcycle filter)
  - "Sadece takip ettiklerim"
  - "İşletmeleri gizle"
- [x] Go realtime: heatmap çağrısında `vehicle_type` filtresi
- [x] Backend (Erol'la birlikte): cell count'ları araç tipi başına ayrı tutma

### V2.5 — SOS Hedefleme V2 (Hafta 9-10)

> Bağımlılık: Erol'un yeni `help_targeted` endpoint'i

- [ ] Go realtime: `help_targeted` WS event'i — `target_type: 'nearby' | 'followers' | 'group'`
- [ ] Go realtime: `target_type === 'followers'` ise sadece takip eden kullanıcılara fanout
- [ ] Go realtime: `target_type === 'group'` ise sadece grup üyelerine fanout
- [ ] Flutter: SOS form'unda hedef seçimi (Furkan UI yapacak, biz API kontratını sabitleyeceğiz)
- [ ] Renk kodlu aciliyet payload'ı: `urgency: 'critical' | 'urgent' | 'request'`

### V2.6 — Story & Post WS Event'leri (Hafta 11-12)

> Bağımlılık: Erol'un story/post endpoint'leri

- [ ] WS event: `story_posted` — takip ettiklerimden biri story attığında
- [ ] WS event: `post_liked` — postuma beğeni geldiğinde
- [ ] WS event: `post_commented` — postuma yorum geldiğinde
- [ ] Go realtime: presence-based notification suppression — kullanıcı uygulamadaysa WS, değilse Erol'un push job'una bırak
- [ ] **Test**: 1k kullanıcı × 10 follower × story → WS fanout latency p(95) < 200ms

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
