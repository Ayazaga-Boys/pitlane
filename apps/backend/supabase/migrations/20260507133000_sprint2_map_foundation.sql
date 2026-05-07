CREATE TABLE IF NOT EXISTS public.flares (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  community_id  UUID,
  title         TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 80),
  description   TEXT CHECK (description IS NULL OR char_length(description) <= 500),
  h3_cell       TEXT NOT NULL CHECK (h3_cell ~ '^[0-9a-f]{15}$'),
  cover_url     TEXT,
  starts_at     TIMESTAMPTZ NOT NULL,
  ends_at       TIMESTAMPTZ,
  rsvp_count    INTEGER NOT NULL DEFAULT 0 CHECK (rsvp_count >= 0),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','ended')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_flares_h3 ON public.flares(h3_cell);
CREATE INDEX IF NOT EXISTS idx_flares_status_starts_at ON public.flares(status, starts_at);

ALTER TABLE public.flares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "flares_select" ON public.flares;
CREATE POLICY "flares_select" ON public.flares FOR SELECT USING (true);

DROP POLICY IF EXISTS "flares_insert" ON public.flares;
CREATE POLICY "flares_insert" ON public.flares FOR INSERT WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "flares_update_own" ON public.flares;
CREATE POLICY "flares_update_own" ON public.flares FOR UPDATE USING (auth.uid() = creator_id);

DROP TRIGGER IF EXISTS flares_updated_at ON public.flares;
CREATE TRIGGER flares_updated_at
  BEFORE UPDATE ON public.flares
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.flare_rsvps (
  flare_id    UUID NOT NULL REFERENCES public.flares(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going','maybe','not_going')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (flare_id, user_id)
);

ALTER TABLE public.flare_rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "flare_rsvps_select" ON public.flare_rsvps;
CREATE POLICY "flare_rsvps_select" ON public.flare_rsvps FOR SELECT USING (true);

DROP POLICY IF EXISTS "flare_rsvps_upsert_own" ON public.flare_rsvps;
CREATE POLICY "flare_rsvps_upsert_own" ON public.flare_rsvps
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.business_pins (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name             TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  category         TEXT NOT NULL CHECK (category IN ('garage','repair','parts','fuel','cafe','other')),
  h3_cell          TEXT NOT NULL CHECK (h3_cell ~ '^[0-9a-f]{15}$'),
  address          TEXT CHECK (address IS NULL OR char_length(address) <= 200),
  phone            TEXT CHECK (phone IS NULL OR char_length(phone) <= 20),
  website          TEXT,
  logo_url         TEXT,
  cover_url        TEXT,
  is_verified      BOOLEAN NOT NULL DEFAULT FALSE,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  campaign_text    TEXT CHECK (campaign_text IS NULL OR char_length(campaign_text) <= 200),
  campaign_ends_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_pins_h3 ON public.business_pins(h3_cell);
CREATE INDEX IF NOT EXISTS idx_business_pins_active ON public.business_pins(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_business_pins_verified ON public.business_pins(is_verified);

ALTER TABLE public.business_pins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_pins_select_active" ON public.business_pins;
CREATE POLICY "business_pins_select_active" ON public.business_pins FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "business_pins_insert_own" ON public.business_pins;
CREATE POLICY "business_pins_insert_own" ON public.business_pins FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "business_pins_update_own" ON public.business_pins;
CREATE POLICY "business_pins_update_own" ON public.business_pins FOR UPDATE USING (auth.uid() = owner_id);

DROP TRIGGER IF EXISTS business_pins_updated_at ON public.business_pins;
CREATE TRIGGER business_pins_updated_at
  BEFORE UPDATE ON public.business_pins
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.help_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  h3_cell       TEXT NOT NULL CHECK (h3_cell ~ '^[0-9a-f]{15}$'),
  vehicle_id    UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  issue_type    TEXT NOT NULL CHECK (issue_type IN ('breakdown','flat_tire','fuel','accident','other')),
  description   TEXT CHECK (description IS NULL OR char_length(description) <= 300),
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','helper_found','resolved','cancelled')),
  helper_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at   TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '2 hours',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_help_requests_h3 ON public.help_requests(h3_cell);
CREATE INDEX IF NOT EXISTS idx_help_requests_status_open ON public.help_requests(status) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_help_requests_requester ON public.help_requests(requester_id);

ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "help_requests_select_visible" ON public.help_requests;
CREATE POLICY "help_requests_select_visible" ON public.help_requests FOR SELECT
  USING (status = 'open' OR requester_id = auth.uid() OR helper_id = auth.uid());

DROP POLICY IF EXISTS "help_requests_insert_own" ON public.help_requests;
CREATE POLICY "help_requests_insert_own" ON public.help_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "help_requests_update_participant" ON public.help_requests;
CREATE POLICY "help_requests_update_participant" ON public.help_requests FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = helper_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.flares TO authenticated;
GRANT ALL ON public.flares TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.flare_rsvps TO authenticated;
GRANT ALL ON public.flare_rsvps TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_pins TO authenticated;
GRANT ALL ON public.business_pins TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.help_requests TO authenticated;
GRANT ALL ON public.help_requests TO service_role;
