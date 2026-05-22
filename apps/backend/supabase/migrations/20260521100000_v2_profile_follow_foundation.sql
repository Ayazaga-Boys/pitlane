DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'location_share_mode') THEN
    CREATE TYPE public.location_share_mode AS ENUM ('everyone', 'followers', 'none');
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS bio_extended TEXT,
  ADD COLUMN IF NOT EXISTS location_share_mode public.location_share_mode NOT NULL DEFAULT 'everyone';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_bio_extended_length'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_bio_extended_length
      CHECK (bio_extended IS NULL OR char_length(bio_extended) <= 1000);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  followee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_followee ON public.follows(followee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id, created_at DESC);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follows_select_authenticated" ON public.follows;
CREATE POLICY "follows_select_authenticated" ON public.follows
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "follows_insert_own" ON public.follows;
CREATE POLICY "follows_insert_own" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "follows_delete_own" ON public.follows;
CREATE POLICY "follows_delete_own" ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);

CREATE TABLE IF NOT EXISTS public.follow_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','canceled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  CHECK (requester_id <> target_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_follow_requests_pending_pair
  ON public.follow_requests(requester_id, target_id)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_follow_requests_target_status ON public.follow_requests(target_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follow_requests_requester_status ON public.follow_requests(requester_id, status, created_at DESC);

ALTER TABLE public.follow_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follow_requests_select_related" ON public.follow_requests;
CREATE POLICY "follow_requests_select_related" ON public.follow_requests
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = target_id);

DROP POLICY IF EXISTS "follow_requests_insert_own" ON public.follow_requests;
CREATE POLICY "follow_requests_insert_own" ON public.follow_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "follow_requests_update_related" ON public.follow_requests;
CREATE POLICY "follow_requests_update_related" ON public.follow_requests
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = target_id);

CREATE TABLE IF NOT EXISTS public.community_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  link_slug TEXT UNIQUE CHECK (link_slug IS NULL OR link_slug ~ '^[a-zA-Z0-9_-]{6,64}$'),
  code TEXT UNIQUE CHECK (code IS NULL OR code ~ '^[A-Z0-9]{6,16}$'),
  mode TEXT NOT NULL DEFAULT 'instant' CHECK (mode IN ('instant','request')),
  uses_count INTEGER NOT NULL DEFAULT 0 CHECK (uses_count >= 0),
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (link_slug IS NOT NULL OR code IS NOT NULL),
  CHECK (max_uses IS NULL OR uses_count <= max_uses)
);

CREATE INDEX IF NOT EXISTS idx_community_invites_community ON public.community_invites(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_invites_creator ON public.community_invites(creator_id, created_at DESC);

ALTER TABLE public.community_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_invites_select_authenticated" ON public.community_invites;
CREATE POLICY "community_invites_select_authenticated" ON public.community_invites
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "community_invites_insert_members" ON public.community_invites;
CREATE POLICY "community_invites_insert_members" ON public.community_invites
  FOR INSERT WITH CHECK (
    auth.uid() = creator_id
    AND EXISTS (
        SELECT 1 FROM public.community_members
        WHERE community_id = community_invites.community_id
          AND user_id = auth.uid()
        AND role IN ('captain','moderator')
    )
  );

GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.follow_requests TO authenticated;
GRANT ALL ON public.follow_requests TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.community_invites TO authenticated;
GRANT ALL ON public.community_invites TO service_role;
