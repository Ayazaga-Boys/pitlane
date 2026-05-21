CREATE TABLE IF NOT EXISTS public.community_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 40),
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  rank_order INTEGER NOT NULL DEFAULT 100 CHECK (rank_order >= 0 AND rank_order <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (community_id, name),
  CHECK (jsonb_typeof(permissions) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_community_roles_community_rank
  ON public.community_roles(community_id, rank_order ASC, created_at ASC);

ALTER TABLE public.community_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_roles_select_members" ON public.community_roles;
CREATE POLICY "community_roles_select_members" ON public.community_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.communities
      WHERE communities.id = community_roles.community_id
        AND (
          communities.type = 'public'
          OR communities.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.community_members
            WHERE community_members.community_id = community_roles.community_id
              AND community_members.user_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "community_roles_write_owner" ON public.community_roles;
CREATE POLICY "community_roles_write_owner" ON public.community_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.communities
      WHERE communities.id = community_roles.community_id
        AND communities.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.communities
      WHERE communities.id = community_roles.community_id
        AND communities.owner_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS community_roles_updated_at ON public.community_roles;
CREATE TRIGGER community_roles_updated_at
  BEFORE UPDATE ON public.community_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.community_members
  ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.community_roles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_community_members_role ON public.community_members(role_id) WHERE role_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_roles TO authenticated;
GRANT ALL ON public.community_roles TO service_role;
