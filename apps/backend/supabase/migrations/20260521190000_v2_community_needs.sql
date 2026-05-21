CREATE TABLE IF NOT EXISTS public.community_needs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('parts','fuel','tools','ride_help','other')),
  urgency_color TEXT NOT NULL CHECK (urgency_color IN ('yellow','red')),
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 3 AND 500),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_needs_community_status
  ON public.community_needs(community_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_needs_creator
  ON public.community_needs(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_needs_urgency_open
  ON public.community_needs(urgency_color, created_at DESC)
  WHERE status = 'open';

ALTER TABLE public.community_needs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_needs_select_visible" ON public.community_needs;
CREATE POLICY "community_needs_select_visible" ON public.community_needs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.communities
      WHERE communities.id = community_needs.community_id
        AND (
          communities.type = 'public'
          OR communities.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.community_members
            WHERE community_members.community_id = community_needs.community_id
              AND community_members.user_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "community_needs_insert_members" ON public.community_needs;
CREATE POLICY "community_needs_insert_members" ON public.community_needs
  FOR INSERT WITH CHECK (
    auth.uid() = creator_id
    AND EXISTS (
      SELECT 1 FROM public.communities
      WHERE communities.id = community_needs.community_id
        AND (
          communities.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.community_members
            WHERE community_members.community_id = community_needs.community_id
              AND community_members.user_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "community_needs_update_creator_or_moderator" ON public.community_needs;
CREATE POLICY "community_needs_update_creator_or_moderator" ON public.community_needs
  FOR UPDATE USING (
    creator_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.communities
      LEFT JOIN public.community_members
        ON community_members.community_id = communities.id
        AND community_members.user_id = auth.uid()
      LEFT JOIN public.community_roles
        ON community_roles.id = community_members.role_id
      WHERE communities.id = community_needs.community_id
        AND (
          communities.owner_id = auth.uid()
          OR community_members.role IN ('captain','moderator')
          OR community_roles.permissions @> '{"can_moderate": true}'::jsonb
        )
    )
  );

DROP TRIGGER IF EXISTS community_needs_updated_at ON public.community_needs;
CREATE TRIGGER community_needs_updated_at
  BEFORE UPDATE ON public.community_needs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

GRANT SELECT, INSERT, UPDATE ON public.community_needs TO authenticated;
GRANT ALL ON public.community_needs TO service_role;
