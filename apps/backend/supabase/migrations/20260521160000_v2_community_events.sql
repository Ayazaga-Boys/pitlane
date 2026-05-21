CREATE TABLE IF NOT EXISTS public.community_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 2000),
  starts_at TIMESTAMPTZ NOT NULL,
  location_h3 TEXT CHECK (location_h3 IS NULL OR location_h3 ~ '^[0-9a-fA-F]{15}$'),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','canceled','completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_events_community_starts
  ON public.community_events(community_id, starts_at ASC);
CREATE INDEX IF NOT EXISTS idx_community_events_creator
  ON public.community_events(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_events_status
  ON public.community_events(status, starts_at ASC);

ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_events_select_visible" ON public.community_events;
CREATE POLICY "community_events_select_visible" ON public.community_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.communities
      WHERE communities.id = community_events.community_id
        AND (
          communities.type = 'public'
          OR communities.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.community_members
            WHERE community_members.community_id = community_events.community_id
              AND community_members.user_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "community_events_insert_creators" ON public.community_events;
CREATE POLICY "community_events_insert_creators" ON public.community_events
  FOR INSERT WITH CHECK (
    auth.uid() = creator_id
    AND EXISTS (
      SELECT 1
      FROM public.communities
      LEFT JOIN public.community_members
        ON community_members.community_id = communities.id
        AND community_members.user_id = auth.uid()
      LEFT JOIN public.community_roles
        ON community_roles.id = community_members.role_id
      WHERE communities.id = community_events.community_id
        AND (
          communities.owner_id = auth.uid()
          OR community_members.role IN ('captain','moderator')
          OR community_roles.permissions @> '{"can_create_event": true}'::jsonb
          OR community_roles.permissions @> '{"can_moderate": true}'::jsonb
        )
    )
  );

DROP TRIGGER IF EXISTS community_events_updated_at ON public.community_events;
CREATE TRIGGER community_events_updated_at
  BEFORE UPDATE ON public.community_events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.event_rsvps (
  event_id UUID NOT NULL REFERENCES public.community_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  response TEXT NOT NULL CHECK (response IN ('yes','maybe','no')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_rsvps_user
  ON public.event_rsvps(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_response
  ON public.event_rsvps(event_id, response);

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_rsvps_select_visible" ON public.event_rsvps;
CREATE POLICY "event_rsvps_select_visible" ON public.event_rsvps
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.community_events
      JOIN public.communities ON communities.id = community_events.community_id
      WHERE community_events.id = event_rsvps.event_id
        AND (
          communities.type = 'public'
          OR communities.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.community_members
            WHERE community_members.community_id = community_events.community_id
              AND community_members.user_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "event_rsvps_upsert_own" ON public.event_rsvps;
CREATE POLICY "event_rsvps_upsert_own" ON public.event_rsvps
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS event_rsvps_updated_at ON public.event_rsvps;
CREATE TRIGGER event_rsvps_updated_at
  BEFORE UPDATE ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.community_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.community_events(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL CHECK (char_length(question) BETWEEN 3 AND 240),
  options JSONB NOT NULL CHECK (jsonb_typeof(options) = 'array' AND jsonb_array_length(options) BETWEEN 2 AND 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_polls_event
  ON public.community_polls(event_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_polls_creator
  ON public.community_polls(creator_id, created_at DESC);

ALTER TABLE public.community_polls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_polls_select_visible" ON public.community_polls;
CREATE POLICY "community_polls_select_visible" ON public.community_polls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.community_events
      JOIN public.communities ON communities.id = community_events.community_id
      WHERE community_events.id = community_polls.event_id
        AND (
          communities.type = 'public'
          OR communities.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.community_members
            WHERE community_members.community_id = community_events.community_id
              AND community_members.user_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "community_polls_insert_creators" ON public.community_polls;
CREATE POLICY "community_polls_insert_creators" ON public.community_polls
  FOR INSERT WITH CHECK (
    auth.uid() = creator_id
    AND EXISTS (
      SELECT 1
      FROM public.community_events
      JOIN public.communities ON communities.id = community_events.community_id
      LEFT JOIN public.community_members
        ON community_members.community_id = community_events.community_id
        AND community_members.user_id = auth.uid()
      LEFT JOIN public.community_roles
        ON community_roles.id = community_members.role_id
      WHERE community_events.id = community_polls.event_id
        AND (
          community_events.creator_id = auth.uid()
          OR communities.owner_id = auth.uid()
          OR community_members.role IN ('captain','moderator')
          OR community_roles.permissions @> '{"can_create_event": true}'::jsonb
          OR community_roles.permissions @> '{"can_moderate": true}'::jsonb
        )
    )
  );

DROP TRIGGER IF EXISTS community_polls_updated_at ON public.community_polls;
CREATE TRIGGER community_polls_updated_at
  BEFORE UPDATE ON public.community_polls
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

GRANT SELECT, INSERT, UPDATE ON public.community_events TO authenticated;
GRANT ALL ON public.community_events TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.event_rsvps TO authenticated;
GRANT ALL ON public.event_rsvps TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.community_polls TO authenticated;
GRANT ALL ON public.community_polls TO service_role;
