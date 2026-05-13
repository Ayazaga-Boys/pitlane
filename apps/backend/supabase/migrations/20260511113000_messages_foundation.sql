CREATE TABLE IF NOT EXISTS public.messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dm_peer_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  community_id  UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  flare_id      UUID REFERENCES public.flares(id) ON DELETE CASCADE,
  help_req_id   UUID REFERENCES public.help_requests(id) ON DELETE CASCADE,
  body          TEXT CHECK (body IS NULL OR char_length(body) <= 2000),
  media_url     TEXT,
  media_type    TEXT CHECK (media_type IS NULL OR media_type IN ('image','video','audio')),
  is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT messages_one_context CHECK (
    (dm_peer_id IS NOT NULL)::int +
    (community_id IS NOT NULL)::int +
    (flare_id IS NOT NULL)::int +
    (help_req_id IS NOT NULL)::int = 1
  ),
  CONSTRAINT messages_body_or_media CHECK (body IS NOT NULL OR media_url IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_messages_dm_sender ON public.messages(sender_id, dm_peer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_dm_peer ON public.messages(dm_peer_id, sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_community ON public.messages(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_flare ON public.messages(flare_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_help ON public.messages(help_req_id, created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_dm" ON public.messages;
CREATE POLICY "messages_select_dm" ON public.messages FOR SELECT
  USING (dm_peer_id IS NOT NULL AND (sender_id = auth.uid() OR dm_peer_id = auth.uid()));

DROP POLICY IF EXISTS "messages_select_community" ON public.messages;
CREATE POLICY "messages_select_community" ON public.messages FOR SELECT
  USING (
    community_id IS NOT NULL
    AND community_id IN (
      SELECT community_id FROM public.community_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "messages_select_flare_help" ON public.messages;
CREATE POLICY "messages_select_flare_help" ON public.messages FOR SELECT
  USING (flare_id IS NOT NULL OR help_req_id IS NOT NULL);

DROP POLICY IF EXISTS "messages_insert_own" ON public.messages;
CREATE POLICY "messages_insert_own" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "messages_update_own" ON public.messages;
CREATE POLICY "messages_update_own" ON public.messages FOR UPDATE USING (auth.uid() = sender_id);

GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
