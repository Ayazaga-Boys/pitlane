# 👤 KİŞİ 2 — V2 Track Paketi (Erol)
> Full-stack · Mid/Senior · Rollpit V2

## Senin V2 Sorumluluk Alanın

**Backend V2 — Sosyal Ağ Omurgası**

V2'nin en büyük yükü sende. Post/story/follow/feed/RBAC/etkinlik — hepsi yeni DB tablosu + yeni endpoint + yeni job. **Yaklaşık 30+ yeni endpoint, 10+ yeni migration, 5+ yeni Trigger.dev job**.

---

## V2 Önce Oku

- `KISI_2_TRACK.md` — V1 bitiş notları (FCM/APNs, Trigger.dev hâlâ açık)
- `V2_VIZYON.md` — V2 master plan
- `03_MIMARI_KURALLAR.md` — Kural 2 (medya proxy yasağı), Kural 4 (JWT+Zod+RLS)
- `04_VERITABANI_SEMA.md` — yeni tablolar V2 sonu güncellenecek

---

## Sprint Görevlerin (V2)

### V2.1 — Profil & Follow Temeli (Hafta 1-2)

**Migration:**
- [x] `profiles` tablosuna kolon ekle: `avatar_url`, `is_private`, `bio_extended`, `location_share_mode` ENUM
- [x] Yeni tablo: `follows` (`follower_id`, `followee_id`, `created_at`, UNIQUE)
- [x] Yeni tablo: `follow_requests` (`requester_id`, `target_id`, `status`, `created_at`)
- [x] `community_invites` — link/code sistemi için (link_slug, code, mode: 'instant'|'request', expires_at, max_uses)
- [x] RLS: kullanıcı kendi follow'larını CRUD edebilir, başkasınınkini sadece görebilir (public ise)

**Endpoint:**
- [x] `POST /v2/profiles/me/avatar` — presigned URL (Cloudflare Images)
- [x] `PATCH /v2/profiles/me/privacy` — public/private toggle, location_share_mode
- [x] `POST /v2/follows/:userId` — takip et (public → anında, private → istek)
- [x] `DELETE /v2/follows/:userId` — takipten çık
- [x] `GET /v2/follows/followers?user_id=` ve `?...following` — liste
- [x] `POST /v2/follow-requests/:id/accept` ve `/reject`
- [x] `GET /v2/follow-requests/incoming`
- [x] Block kontrolü follow'larda — blocked kullanıcı follow edemez

### V2.2 — Post & Yorum & Beğeni (Hafta 3-4)

**Migration:**
- [ ] `posts` (`id`, `author_id`, `caption`, `media_id`, `visibility`, `created_at`)
- [ ] `post_likes` (`post_id`, `user_id`, `created_at`, UNIQUE)
- [ ] `comments` (`id`, `post_id`, `author_id`, `parent_id` nullable, `body`, `created_at`)
- [ ] `comment_likes`
- [ ] `media_assets` tablosu zaten var, post'larla ilişkilendir (`owner_type='post'`)

**Endpoint:**
- [ ] `POST /v2/posts` (caption + media_id)
- [ ] `GET /v2/posts/:id`
- [ ] `DELETE /v2/posts/:id` (sadece yazar)
- [ ] `GET /v2/users/:username/posts` (privacy check)
- [ ] `POST /v2/posts/:id/like` — idempotent
- [ ] `DELETE /v2/posts/:id/like`
- [ ] `POST /v2/posts/:id/comments`
- [ ] `GET /v2/posts/:id/comments?cursor=`
- [ ] `POST /v2/comments/:id/like`
- [ ] `GET /v2/posts/:id/likes` (kim beğendi listesi)

**Push:**
- [ ] Trigger.dev job: post yorum geldiğinde push (eğer kullanıcı uygulamada değilse — Burak'ın presence kontrolü)
- [ ] Trigger.dev job: post beğenisi geldiğinde push (debounced — 10 dk'da en çok 1)

### V2.3 — Story + Keşfet + Feed Algoritması (Hafta 5-6)

**Migration:**
- [ ] `stories` (`id`, `author_id`, `media_id`, `audience`, `expires_at`, `created_at`)
- [ ] `story_views` (`story_id`, `viewer_id`, `viewed_at`, UNIQUE)
- [ ] `story_mutes` (`muter_id`, `muted_id`) — birinin story'sini sessize alma

**Endpoint:**
- [ ] `POST /v2/stories`
- [ ] `GET /v2/stories/feed` — takip ettiklerimin son 24 saat story'leri
- [ ] `POST /v2/stories/:id/view`
- [ ] `GET /v2/stories/:id/views` — yazar görebilir
- [ ] `DELETE /v2/stories/:id`

**Trigger.dev:**
- [ ] Story expiry job — saatlik cron, `expires_at < now()` olanları sil + Cloudflare Stream/Images temizliği

**Keşfet (Feed):**
- [ ] `GET /v2/discover/feed?cursor=` — algoritma tabanlı
- [ ] Score = `(0.5 * engagement_rate) + (0.3 * recency_decay) + (0.2 * follow_signal)`
- [ ] V1: Postgres view + materialized refresh hourly
- [ ] İlerleyen sürüm: Redis Sorted Set + score güncelleme

### V2.4 — Topluluk RBAC + Etkinlik + Davet (Hafta 7-8)

**Migration:**
- [ ] `community_roles` (`id`, `community_id`, `name`, `permissions` JSONB, `rank_order`)
  - Permissions: `can_invite`, `can_kick`, `can_create_event`, `can_pin`, `can_moderate`
- [ ] `community_members` tablosuna `role_id` kolonu ekle
- [ ] `community_events` (`id`, `community_id`, `creator_id`, `title`, `description`, `starts_at`, `location_h3`, `status`)
- [ ] `event_rsvps` (`event_id`, `user_id`, `response` 'yes'|'maybe'|'no')
- [ ] `community_polls` (`id`, `event_id`, `question`, `options` JSONB)

**Endpoint — Roller:**
- [ ] `POST /v2/communities/:id/roles` — rol oluştur
- [ ] `PATCH /v2/communities/:id/roles/:roleId` — izinleri güncelle
- [ ] `POST /v2/communities/:id/members/:userId/role` — kullanıcıya rol ata
- [ ] **Şablonlar**: Motor/Otomobil/Genel için preset rol kataloğu

**Endpoint — Davet:**
- [ ] `POST /v2/communities/:id/invites` — link veya kod oluştur (mode + expires_at)
- [ ] `GET /v2/invites/:slug` — public preview (community foto + bilgi, "Anında katıl" mı "İstek gönder" mi)
- [ ] `POST /v2/invites/:slug/accept`
- [ ] `POST /v2/communities/:id/invite-user` — yönetici direkt davet eder → kullanıcıya bildirim
- [ ] `POST /v2/community-invites/:id/respond` — accept/reject

**Endpoint — Etkinlik:**
- [ ] `POST /v2/communities/:id/events` (rol kontrolü: `can_create_event`)
- [ ] `GET /v2/communities/:id/events`
- [ ] `POST /v2/events/:id/rsvp`
- [ ] `POST /v2/events/:id/polls`

### V2.5 — İşletme Self-Onboarding + Harita Lokasyonları (Hafta 9-10)

**Migration:**
- [ ] `business_applications` — başvuru state machine (`pending`, `approved`, `rejected`, `under_review`)
- [ ] `business_locations` — onaylanmış işletmeler (lat/lng + h3_cell, foto, çalışma saatleri)
- [ ] `business_documents` — vergi levhası, ruhsat (R2 private bucket)

**Endpoint:**
- [ ] `POST /v2/business/applications` — başvuru oluştur
- [ ] `POST /v2/business/applications/:id/documents` — belge yükle (private R2)
- [ ] `GET /v2/business/applications/me`
- [ ] **Admin** (Tufan kullanacak): `GET /v2/admin/business/applications?status=pending`
- [ ] **Admin**: `POST /v2/admin/business/applications/:id/approve` (+ location yarat)
- [ ] **Admin**: `POST /v2/admin/business/applications/:id/reject` (+ neden)
- [ ] `GET /v2/business/locations/nearby?h3cell=&k=` — Burak'ın harita çağırışı

**Harita Vehicle-Filtered Heatmap:**
- [ ] `GET /v2/map/heatmap?vehicle_type=motorcycle|car|any` — Burak'ın V2.4 ihtiyacı
- [ ] Heatmap aggregation `vehicle_type` başına ayrı tutulmalı (Valkey key prefix değiştir)

### V2.6 — SOS Hedefleme + Tagged Needs + Yarışma (Hafta 11-12)

**Migration:**
- [ ] `help_requests` tablosuna kolon ekle: `target_type` ENUM('nearby','followers','group'), `target_id` UUID nullable, `urgency` ENUM
- [ ] `community_needs` — yedek parça/yakıt ilanları (`community_id`, `type`, `urgency_color`, `body`)
- [ ] `competitions` — yarışmalar (`id`, `community_id`, `title`, `filters` JSONB, `voting_starts_at`, `voting_ends_at`)
- [ ] `competition_entries`
- [ ] `competition_votes`

**Endpoint:**
- [ ] `POST /v2/help` — `target_type` ve `target_id` ile (Burak realtime'a iletecek)
- [ ] `POST /v2/communities/:id/needs` — tagged need (sarı/kırmızı)
- [ ] `GET /v2/communities/:id/needs?status=open`
- [ ] `POST /v2/competitions` (rol kontrolü)
- [ ] `POST /v2/competitions/:id/entries` (filtre eşleşmesi kontrolü)
- [ ] `POST /v2/competitions/:id/entries/:entryId/vote`

**Realtime Integration (Burak'la):**
- [ ] `help_targeted` payload Go realtime'a — `POST /internal/realtime/help-event` extend et
- [ ] `target_type === 'followers'` ise → `helper_ids: [user1, user2, ...]` payload
- [ ] `target_type === 'group'` ise → `community_id` payload, Burak grup üyelerini broadcast eder

---

## V2 Sahip Olacağın Yeni Secret'lar

```bash
# apps/backend/.env
# V1 değişkenleri aynen + yenileri:
MEILISEARCH_HOST=...        # (opsiyonel V2.3) keşfet için
MEILISEARCH_API_KEY=...
ALGORITHM_VERSION=v1        # A/B test için
FEATURE_V2_ENABLED=true     # rollout
```

---

## Diğer Track'lerle Bağımlılıkların

| Bağımlılık | Kime | Ne Zaman |
|---|---|---|
| `follows` endpoint kontratı | Burak (realtime), Furkan (UI) | V2.1 başı |
| `business_locations` admin onayı akışı | Tufan (admin sayfası) | V2.5 |
| `help_targeted` payload kontratı | Burak (realtime) | V2.6 |
| Yarışma admin yönetim sayfası | Tufan | V2.6 |
| Post/story endpoint kontratı | Furkan | V2.2-V2.3 |

---

## Kritik Hatırlatmalar (V2)

```
❌ ASLA: V1 endpoint'lerini bozucu şekilde değiştir
✅ DOĞRU: /v2/* paralel, /v1/* deprecate edilmez (6 ay)

❌ ASLA: Post/story görüntülemeyi tek query'de + N+1 join ile yapma
✅ DOĞRU: Cursor pagination, eager media join (max 20/sayfa)

❌ ASLA: Feed sorgusunu real-time hesapla (binlerce kullanıcı)
✅ DOĞRU: Materialized view + saatlik refresh + Redis cache

❌ ASLA: Story silmeyi kullanıcıya bırak (admin gözden geçirmeli)
✅ DOĞRU: 24h auto-expire + admin moderation queue

❌ ASLA: Follow request bildirimini her seferinde gönder
✅ DOĞRU: Aynı kullanıcıdan 7 gün içinde ikinci request push'lanmaz
```
