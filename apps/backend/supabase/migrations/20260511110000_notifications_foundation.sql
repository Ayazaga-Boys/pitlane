CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (
    type IN (
      'help_nearby',
      'help_helper_arrived',
      'flare_invite',
      'flare_starting',
      'dm_new',
      'community_message',
      'community_invite',
      'message',
      'rsvp_update',
      'system'
    )
  ),
  title      TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  body       TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  data       JSONB,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE is_read = FALSE;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_own" ON public.notifications;
CREATE POLICY "notifications_own" ON public.notifications
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.push_devices (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform     TEXT NOT NULL CHECK (platform IN ('ios','android')),
  token        TEXT NOT NULL CHECK (char_length(token) BETWEEN 20 AND 500),
  app_build    TEXT CHECK (app_build IS NULL OR char_length(app_build) <= 40),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE       (user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_push_devices_user ON public.push_devices(user_id);

ALTER TABLE public.push_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_devices_own" ON public.push_devices;
CREATE POLICY "push_devices_own" ON public.push_devices
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_devices TO authenticated;
GRANT ALL ON public.push_devices TO service_role;
