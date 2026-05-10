CREATE TABLE IF NOT EXISTS public.communities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL CHECK (char_length(name) BETWEEN 3 AND 60),
  slug          TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{3,40}$'),
  description   TEXT CHECK (description IS NULL OR char_length(description) <= 500),
  cover_url     TEXT,
  type          TEXT NOT NULL DEFAULT 'public' CHECK (type IN ('public','private','secret')),
  vehicle_type  TEXT NOT NULL DEFAULT 'all' CHECK (vehicle_type IN ('car','motorcycle','all')),
  city          TEXT CHECK (city IS NULL OR char_length(city) <= 80),
  member_count  INTEGER NOT NULL DEFAULT 1 CHECK (member_count >= 0),
  is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_communities_slug ON public.communities(slug);
CREATE INDEX IF NOT EXISTS idx_communities_city ON public.communities(city);
CREATE INDEX IF NOT EXISTS idx_communities_vehicle_type ON public.communities(vehicle_type);

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS communities_updated_at ON public.communities;
CREATE TRIGGER communities_updated_at
  BEFORE UPDATE ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.community_members (
  community_id  UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('captain','moderator','member')),
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY   (community_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_members_user ON public.community_members(user_id);

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_members_select" ON public.community_members;
CREATE POLICY "community_members_select" ON public.community_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "community_members_insert_self" ON public.community_members;
CREATE POLICY "community_members_insert_self" ON public.community_members FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "community_members_delete_self" ON public.community_members;
CREATE POLICY "community_members_delete_self" ON public.community_members FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "communities_select" ON public.communities;
CREATE POLICY "communities_select" ON public.communities FOR SELECT
  USING (
    type = 'public'
    OR owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.community_members
      WHERE community_id = id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "communities_insert" ON public.communities;
CREATE POLICY "communities_insert" ON public.communities FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "communities_update_owner" ON public.communities;
CREATE POLICY "communities_update_owner" ON public.communities FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "communities_delete_owner" ON public.communities;
CREATE POLICY "communities_delete_owner" ON public.communities FOR DELETE USING (auth.uid() = owner_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'flares_community_id_fkey'
  ) THEN
    ALTER TABLE public.flares
      ADD CONSTRAINT flares_community_id_fkey
      FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE SET NULL;
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.communities TO authenticated;
GRANT ALL ON public.communities TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_members TO authenticated;
GRANT ALL ON public.community_members TO service_role;
