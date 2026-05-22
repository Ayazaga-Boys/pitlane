# 👤 KİŞİ 3 — V2 Track Paketi (Tufan)
> Full-stack · Mid/Senior · Rollpit V2

## Senin V2 Sorumluluk Alanın

**Admin Panel V2 — Onay, Moderasyon, Yarışma Yönetimi**

V2'de admin paneline 4 büyük yeni alan geliyor:
1. **İşletme başvuru onayı** — tamirci/galeri/satıcı self-onboarding sonrası senin onayını bekleyecek
2. **Harita lokasyon yönetimi** — onaylı işletmeler haritada foto-bubble olarak görünüyor; sen featured/sıralama yapacaksın
3. **İçerik moderasyon kuyruğu** — post/story/yorum şikayetleri büyüyecek
4. **Yarışma yönetimi** — grupların düzenlediği yarışmaları izleme ve gerekirse iptal

---

## V2 Önce Oku

- `KISI_3_TRACK.md` — V1 admin durumu
- `V2_VIZYON.md` — V2 master plan
- `12_ADMIN_PANEL.md` — V2'de güncellenmesi gereken bölümler
- `18_TOPLULUK_KURALLARI.md` — moderasyon kuralları

---

## Sprint Görevlerin (V2)

### V2.1 — Profil Yönetimi Genişletme (Hafta 1-2)

> Bağımlılık: Erol'un `is_private`, `avatar_url`, `location_share_mode` kolonları

- [ ] Kullanıcı detay sayfasına yeni alanlar:
  - Profile foto preview
  - Public/Private status badge
  - Follow sayıları (followers / following)
  - Location share mode
- [ ] Kullanıcı filtrelerine yeni opsiyonlar: `is_private`, `has_avatar`
- [ ] Admin override: kullanıcının follow ilişkisini görme (destek için)

### V2.2 — İçerik Moderasyonu (Hafta 3-4)

> Bağımlılık: Erol'un `posts`, `comments` tabloları + reports genişlemesi

- [ ] **Post moderasyon sayfası** (`/admin/posts`) — şikayet edilenler önce
- [ ] Post detay — caption + media preview + yorum sayısı + şikayet sayısı
- [ ] Aksiyonlar: içerik kaldır, yazarı uyar, yazarı banla
- [ ] **Yorum moderasyon sayfası** (`/admin/comments`)
- [x] **Cloudflare Images otomatik flag** — NSFW/violence skoru yüksekse otomatik kuyruğa düşer — backend: `GET /v2/admin/moderation/media`
- [ ] Audit log: `content_removed`, `content_restored`

### V2.3 — Story & Keşfet Moderasyonu (Hafta 5-6)

> Bağımlılık: Erol'un `stories` tablosu + Trigger.dev story expiry

- [ ] **Story moderasyon sayfası** (`/admin/stories`) — aktif story'ler (henüz silinmemiş)
- [ ] Story preview — 24h geçince otomatik silinir ama o sürede şikayet edilmişse acil müdahale
- [ ] **Feed manuel kontrol** — algoritmaya manuel "feature" / "shadowban" ekleme
  - Erol'un `feed_overrides` tablosu (boost veya gizleme)
- [ ] **Trend kontrolü** — en çok engagement alan postlar listesi

### V2.4 — Topluluk & Rol Yönetimi (Hafta 7-8)

> Bağımlılık: Erol'un `community_roles`, `community_invites`, `events`

- [ ] **Topluluk detayında rol görüntüleme** — kim hangi rolde
- [ ] **Davet linki yönetimi** — admin override, suspicious link revoke
- [ ] **Etkinlik listesi** — `/admin/events` — yaklaşan etkinlikler
- [ ] **Şüpheli etkinlikler** — büyük katılım + şikayet eşiği aşımı flag

### V2.5 — İşletme Başvuru Onayı (Hafta 9-10) ⭐ Senin için kritik sprint

> Bağımlılık: Erol'un `business_applications`, `business_documents`, `business_locations`

- [ ] **Başvuru kuyruğu** (`/admin/business/applications?status=pending`)
- [ ] **Başvuru detay sayfası**:
  - İşletme adı, tür (tamirci/galeri/satıcı/diğer)
  - Vergi levhası önizleme (R2 private bucket'tan signed URL) — backend: `GET /v2/admin/business/documents/:id/preview-url`
  - Ruhsat önizleme
  - Lokasyon (harita preview)
  - İşletme sahibi bilgileri
- [ ] **Onay / Red akışı**:
  - Onayla → `business_locations`'a kayıt + foto-bubble haritada görünür
  - Reddet → neden (template) + kullanıcıya email
- [ ] **Featured işletmeler** — manuel sıralama (homepage öne çıkarma)
- [ ] **Lokasyon harita görünümü** (`/admin/business/locations/map`) — tüm onaylanmış işletmelerin haritası
- [ ] Audit: `business_approved`, `business_rejected`, `business_suspended`

### V2.6 — Yarışma & Tagged Need Yönetimi (Hafta 11-12)

> Bağımlılık: Erol'un `competitions`, `competition_entries`, `community_needs`

- [x] **Yarışma listesi** (`/admin/competitions`) — backend: `GET /v2/admin/competitions`
- [x] Yarışma detay — katılımcılar, oy sayıları, şikayet bayrakları — backend: `GET /v2/admin/competitions/:id`
- [x] Aksiyonlar: yarışma iptal, katılım reddet — backend: `POST /v2/admin/competitions/:id/cancel`, `POST /v2/admin/competitions/:id/entries/:entryId/reject`
- [x] **Yedek parça/tagged need genel bakış** (`/admin/community-needs`) — spam tespiti — backend: `GET /v2/admin/community-needs`
- [x] **Otomotik spam koruma**: aynı kullanıcı 24 saatte 5+ need yayınlarsa otomatik flag

---

## Admin Panel — V2 Sayfa Listesi

| Sayfa | Route | Sprint | Öncelik |
|---|---|---|---|
| Post Moderation | `/admin/posts` | V2.2 | 🔴 |
| Comment Moderation | `/admin/comments` | V2.2 | 🔴 |
| Story Moderation | `/admin/stories` | V2.3 | 🟡 |
| Feed Override | `/admin/feed-overrides` | V2.3 | 🟢 |
| Roles & Permissions | `/admin/communities/:id/roles` | V2.4 | 🟡 |
| Events List | `/admin/events` | V2.4 | 🟡 |
| Business Applications | `/admin/business/applications` | V2.5 | 🔴 |
| Business Locations Map | `/admin/business/locations/map` | V2.5 | 🔴 |
| Featured Businesses | `/admin/business/featured` | V2.5 | 🟡 |
| Competitions | `/admin/competitions` | V2.6 | 🟡 |
| Community Needs | `/admin/community-needs` | V2.6 | 🟢 |

---

## Vercel + Domain (V2'de tamamlanmalı)

V1'de açık kalan iki konu:
- [ ] `admin.rollpit.com` Cloudflare CNAME → Vercel deploy
- [ ] Vercel production deploy + preview env
- [ ] Sentry admin DSN ekle (V1 backlog'undan)

---

## Diğer Track'lerle Bağımlılıkların

| Bağımlılık | Kimden | Ne Zaman |
|---|---|---|
| Admin endpoint'leri (`/v2/admin/*`) | Erol | Her sprint |
| `business_documents` R2 signed URL | Erol | V2.5 |
| Cloudflare Images moderation skoru | Erol | V2.2 |
| Yarışma filter şeması | Erol + Furkan | V2.6 |

---

## Kritik Hatırlatmalar (V2)

```
❌ ASLA: İşletme onay aksiyonunu audit_logs'a yazmamak
✅ DOĞRU: Her onay/red `audit_logs.action_type` ile loglanır

❌ ASLA: Story moderasyonunu 24 saat dolmadan ihmal etmek
✅ DOĞRU: Story queue önceliklendirilmeli (reports >= 2 → critical)

❌ ASLA: Şüpheli post'u silmeden önce yedek almamak
✅ DOĞRU: `posts.deleted_at` soft delete + R2 medya 30 gün retain

❌ ASLA: Featured işletmeleri client-side sıralama
✅ DOĞRU: `business_locations.featured_rank` server-side
```
