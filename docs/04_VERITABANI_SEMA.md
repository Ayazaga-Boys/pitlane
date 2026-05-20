# 04 — Veritabanı Şeması

> Tüm tablolar `public` şemasında. Her tablo için RLS **zorunlu** etkin.
> `id` alanları UUID v4 (`gen_random_uuid()`). Timestamps UTC.
> H3 hücre ID'leri `TEXT(15)` olarak saklanır.

---

## Genel Kurallar

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
```

---

## 1. profiles

```sql
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT NOT NULL UNIQUE,
  display_name    TEXT,
  avatar_url      TEXT,
  bio             TEXT CHECK (char_length(bio) <= 300),
  ghost_mode      BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','moderator','admin')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_public" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own"    ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 2. vehicles

```sql
CREATE TABLE public.vehicles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('car','motorcycle','other')),
  make        TEXT NOT NULL,
  model       TEXT NOT NULL,
  year        SMALLINT CHECK (year BETWEEN 1885 AND 2100),
  color       TEXT,
  photo_url   TEXT,
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_user ON public.vehicles(user_id);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicles_crud_own" ON public.vehicles USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

## 3. communities

```sql
CREATE TABLE public.communities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES public.profiles(id),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT CHECK (char_length(description) <= 500),
  cover_url     TEXT,
  type          TEXT NOT NULL DEFAULT 'public' CHECK (type IN ('public','private','secret')),
  vehicle_type  TEXT CHECK (vehicle_type IN ('car','motorcycle','all')),
  city          TEXT,
  member_count  INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_communities_slug ON public.communities(slug);
CREATE INDEX idx_communities_city ON public.communities(city);
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "communities_select" ON public.communities FOR SELECT
  USING (type = 'public' OR owner_id = auth.uid() OR EXISTS (
    SELECT 1 FROM community_members WHERE community_id = id AND user_id = auth.uid()
  ));
CREATE POLICY "communities_insert" ON public.communities FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "communities_update" ON public.communities FOR UPDATE USING (auth.uid() = owner_id);

CREATE TRIGGER communities_updated_at
  BEFORE UPDATE ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

---

## 4. community_members

```sql
CREATE TABLE public.community_members (
  community_id  UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('captain','moderator','member')),
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY   (community_id, user_id)
);

CREATE INDEX idx_cm_user ON public.community_members(user_id);
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cm_select"      ON public.community_members FOR SELECT USING (true);
CREATE POLICY "cm_insert_self" ON public.community_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cm_delete_self" ON public.community_members FOR DELETE USING (auth.uid() = user_id);
```

---

## 5. flares

```sql
CREATE TABLE public.flares (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id    UUID NOT NULL REFERENCES public.profiles(id),
  community_id  UUID REFERENCES public.communities(id) ON DELETE SET NULL,
  title         TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 80),
  description   TEXT CHECK (char_length(description) <= 500),
  h3_cell       TEXT NOT NULL,
  cover_url     TEXT,
  starts_at     TIMESTAMPTZ NOT NULL,
  ends_at       TIMESTAMPTZ,
  rsvp_count    INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','ended')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_flares_h3 ON public.flares(h3_cell);
CREATE INDEX idx_flares_starts_at ON public.flares(starts_at);
ALTER TABLE public.flares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "flares_select"   ON public.flares FOR SELECT USING (true);
CREATE POLICY "flares_insert"   ON public.flares FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "flares_update"   ON public.flares FOR UPDATE USING (auth.uid() = creator_id);

CREATE TRIGGER flares_updated_at
  BEFORE UPDATE ON public.flares
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

---

## 6. flare_rsvps

```sql
CREATE TABLE public.flare_rsvps (
  flare_id    UUID NOT NULL REFERENCES public.flares(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going','maybe','not_going')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (flare_id, user_id)
);

ALTER TABLE public.flare_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rsvp_all" ON public.flare_rsvps USING (true) WITH CHECK (auth.uid() = user_id);
```

---

## 7. business_pins

```sql
CREATE TABLE public.business_pins (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         UUID NOT NULL REFERENCES public.profiles(id),
  name             TEXT NOT NULL,
  category         TEXT NOT NULL CHECK (category IN ('garage','repair','parts','fuel','cafe','other')),
  h3_cell          TEXT NOT NULL,
  address          TEXT,
  phone            TEXT,
  website          TEXT,
  logo_url         TEXT,
  cover_url        TEXT,
  is_verified      BOOLEAN NOT NULL DEFAULT FALSE,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  campaign_text    TEXT CHECK (char_length(campaign_text) <= 200),
  campaign_ends_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bp_h3     ON public.business_pins(h3_cell);
CREATE INDEX idx_bp_active ON public.business_pins(is_active) WHERE is_active = TRUE;
ALTER TABLE public.business_pins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bp_select" ON public.business_pins FOR SELECT USING (is_active = TRUE);
CREATE POLICY "bp_insert" ON public.business_pins FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "bp_update" ON public.business_pins FOR UPDATE USING (auth.uid() = owner_id);
```

---

## 8. help_requests

```sql
CREATE TABLE public.help_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  UUID NOT NULL REFERENCES public.profiles(id),
  h3_cell       TEXT NOT NULL,
  vehicle_id    UUID REFERENCES public.vehicles(id),
  issue_type    TEXT NOT NULL CHECK (issue_type IN ('breakdown','flat_tire','fuel','accident','other')),
  description   TEXT CHECK (char_length(description) <= 300),
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','helper_found','resolved','cancelled','expired')),
  helper_id     UUID REFERENCES public.profiles(id),
  resolved_at   TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '2 hours',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hr_h3     ON public.help_requests(h3_cell);
CREATE INDEX idx_hr_status ON public.help_requests(status) WHERE status = 'open';
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hr_select" ON public.help_requests FOR SELECT
  USING (status = 'open' OR requester_id = auth.uid() OR helper_id = auth.uid());
CREATE POLICY "hr_insert" ON public.help_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "hr_update" ON public.help_requests FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = helper_id);
```

---

## 9. messages

```sql
CREATE TABLE public.messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     UUID NOT NULL REFERENCES public.profiles(id),
  dm_peer_id    UUID REFERENCES public.profiles(id),
  community_id  UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  flare_id      UUID REFERENCES public.flares(id) ON DELETE CASCADE,
  help_req_id   UUID REFERENCES public.help_requests(id) ON DELETE CASCADE,
  body          TEXT CHECK (char_length(body) <= 2000),
  media_url     TEXT,
  media_type    TEXT CHECK (media_type IN ('image','video','audio')),
  is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT messages_one_context CHECK (
    (dm_peer_id IS NOT NULL)::int +
    (community_id IS NOT NULL)::int +
    (flare_id IS NOT NULL)::int +
    (help_req_id IS NOT NULL)::int = 1
  )
);

CREATE INDEX idx_msg_dm        ON public.messages(sender_id, dm_peer_id, created_at DESC);
CREATE INDEX idx_msg_community ON public.messages(community_id, created_at DESC);
CREATE INDEX idx_msg_flare     ON public.messages(flare_id, created_at DESC);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg_select_dm"   ON public.messages FOR SELECT
  USING (dm_peer_id IS NOT NULL AND (sender_id = auth.uid() OR dm_peer_id = auth.uid()));
CREATE POLICY "msg_select_comm" ON public.messages FOR SELECT
  USING (community_id IS NOT NULL AND community_id IN (
    SELECT community_id FROM community_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "msg_select_open" ON public.messages FOR SELECT
  USING (flare_id IS NOT NULL OR help_req_id IS NOT NULL);
CREATE POLICY "msg_insert"      ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
```

---

## 10. media_assets

```sql
CREATE TABLE public.media_assets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id  UUID NOT NULL REFERENCES public.profiles(id),
  asset_type   TEXT NOT NULL CHECK (asset_type IN ('photo','video')),
  storage_key  TEXT NOT NULL,
  cf_image_id  TEXT,
  cf_stream_id TEXT,
  width        INTEGER,
  height       INTEGER,
  duration_sec SMALLINT,
  size_bytes   INTEGER,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','ready','failed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_own" ON public.media_assets USING (auth.uid() = uploader_id) WITH CHECK (auth.uid() = uploader_id);
```

---

## 11. notifications

```sql
CREATE TABLE public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('help_nearby','flare_invite','message','community_invite','rsvp_update','system')),
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  data       JSONB,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_user   ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notif_unread ON public.notifications(user_id) WHERE is_read = FALSE;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_own" ON public.notifications USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

## 12. blocks

```sql
CREATE TABLE public.blocks (
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id)
);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocks_own" ON public.blocks USING (auth.uid() = blocker_id) WITH CHECK (auth.uid() = blocker_id);
```

---

## 13. reports (Şikayet)

```sql
CREATE TABLE public.reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_type  TEXT NOT NULL CHECK (content_type IN ('message','flare','community','profile','business_pin')),
  content_id    UUID NOT NULL,
  reason        TEXT NOT NULL CHECK (reason IN ('spam','harassment','inappropriate','fake','other')),
  description   TEXT CHECK (char_length(description) <= 500),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','dismissed')),
  reviewed_by   UUID REFERENCES public.profiles(id),
  reviewed_at   TIMESTAMPTZ,
  action_taken  TEXT CHECK (action_taken IN ('none','content_deleted','user_warned','user_banned')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_status   ON public.reports(status) WHERE status = 'pending';
CREATE INDEX idx_reports_reporter ON public.reports(reporter_id);
CREATE INDEX idx_reports_content  ON public.reports(content_type, content_id);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_select_own" ON public.reports FOR SELECT USING (reporter_id = auth.uid());
CREATE POLICY "reports_insert"     ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
-- Admin görüntüleme + güncelleme: service_role üzerinden (admin panel)
```

---

## 14. remote_configs (Feature Flag)

```sql
CREATE TABLE public.remote_configs (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.remote_configs ENABLE ROW LEVEL SECURITY;

-- Tüm kimlik doğrulanmış kullanıcılar okuyabilir (Flutter feature flag çekiyor)
CREATE POLICY "rc_select_authenticated"
  ON public.remote_configs FOR SELECT
  USING (auth.role() = 'authenticated');

-- Sadece admin yazabilir
CREATE POLICY "rc_write_admin"
  ON public.remote_configs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Başlangıç değerleri (her ortamda çalıştırılabilir)
INSERT INTO public.remote_configs (key, value, description) VALUES
  ('feature_camera_enabled',    'true',  'Kamera özelliği aktif mi?'),
  ('feature_help_enabled',      'true',  'Acil yardım özelliği aktif mi?'),
  ('feature_business_pins',     'true',  'İşletme pinleri görünür mü?'),
  ('max_flares_per_user_day',   '5',     'Kullanıcı başına günlük max flare'),
  ('max_help_per_user_hour',    '3',     'Kullanıcı başına saatlik max yardım talebi'),
  ('min_supported_app_version', '"1.0.0"', 'Bu sürümün altındaki app force-update bekler')
ON CONFLICT (key) DO NOTHING;
```

---

## 15. push_devices (FCM/APNs Cihaz Token)

```sql
CREATE TABLE public.push_devices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform    TEXT NOT NULL CHECK (platform IN ('ios','android')),
  token       TEXT NOT NULL,
  app_build   TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE      (user_id, token)
);

CREATE INDEX idx_push_devices_user ON public.push_devices(user_id);
ALTER TABLE public.push_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pd_own" ON public.push_devices USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

## 16. audit_logs (Yönetici Aksiyon Günlüğü)

```sql
CREATE TABLE public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID NOT NULL REFERENCES public.profiles(id),
  action      TEXT NOT NULL CHECK (action IN (
    'user_banned','user_unbanned','content_deleted',
    'pin_verified','pin_rejected','config_changed','report_resolved'
  )),
  target_type TEXT,
  target_id   UUID,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor  ON public.audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_action ON public.audit_logs(action, created_at DESC);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
-- Sadece service role / admin yazabilir; admin panel okuyabilir
CREATE POLICY "audit_admin_only"
  ON public.audit_logs
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## Migrasyon Stratejisi

- Her değişiklik: `supabase/migrations/YYYYMMDDHHMMSS_açıklama.sql`
- CI'da: `supabase db push --dry-run`
- Production: `supabase db push`
- Geri alınamaz değişiklikler için down migration zorunludur.

## İndeks Özeti

| Tablo | İndeks | Tip |
|---|---|---|
| profiles | username | UNIQUE |
| communities | slug, city | BTREE |
| flares | h3_cell, starts_at | BTREE |
| business_pins | h3_cell, is_active | BTREE |
| help_requests | h3_cell, status | BTREE |
| messages | (sender,peer,created_at) | BTREE |
| notifications | (user_id, created_at) | BTREE |
| reports | status, content_type+content_id | BTREE |
| push_devices | user_id, (user_id,token) UNIQUE | BTREE |
| audit_logs | actor_id+created_at, action+created_at | BTREE |

---

## Tablo Bağımlılık Sırası (Migration Dependency Graph)

> Migration dosyaları bu sırayla yazılmalı; aksi durumda foreign key hataları çıkar.

```
auth.users (Supabase managed)
   │
   ▼
1. profiles                 ← Sprint 1
   │
   ├──▶ 2. vehicles
   ├──▶ 11. notifications
   ├──▶ 12. blocks
   ├──▶ 13. reports
   ├──▶ 14. remote_configs (updated_by)
   ├──▶ 15. push_devices
   └──▶ 16. audit_logs
   │
   ▼
3. communities              ← Sprint 3
   │
   └──▶ 4. community_members
   │
   ▼
5. flares                   ← Sprint 3
   │
   └──▶ 6. flare_rsvps
   │
   ▼
7. business_pins            ← Sprint 5
8. help_requests            ← Sprint 5
9. messages                 ← Sprint 4
10. media_assets            ← Sprint 6
```

---

## Veri Tutma (Retention) Politikası

| Tablo | Tutma Süresi | Otomatik Temizlik |
|---|---|---|
| `messages` (DM) | Sonsuz (kullanıcı silene kadar) | Manuel |
| `messages` (flare/help) | Etkinlik bittikten 90 gün sonra | Trigger.dev cron, haftalık |
| `flares` (status='ended') | 365 gün | Trigger.dev cron, aylık |
| `help_requests` (resolved) | 180 gün | Trigger.dev cron, aylık |
| `notifications` | 90 gün (okunmuş), 30 gün (okunmamış) | Trigger.dev cron, günlük |
| `audit_logs` | 2 yıl (KVKK uyum) | Manuel arşiv |
| `reports` (dismissed) | 1 yıl | Trigger.dev cron, aylık |
| `media_assets` (silinen kullanıcı) | 30 gün soft delete sonra hard delete | Trigger.dev job, planlı |
