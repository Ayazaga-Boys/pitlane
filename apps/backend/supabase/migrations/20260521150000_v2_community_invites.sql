CREATE TABLE IF NOT EXISTS public.community_direct_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','canceled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  CHECK (inviter_id <> invitee_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_community_direct_invites_pending
  ON public.community_direct_invites(community_id, invitee_id)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_community_direct_invites_invitee
  ON public.community_direct_invites(invitee_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_direct_invites_community
  ON public.community_direct_invites(community_id, created_at DESC);

ALTER TABLE public.community_direct_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_direct_invites_select_related" ON public.community_direct_invites;
CREATE POLICY "community_direct_invites_select_related" ON public.community_direct_invites
  FOR SELECT USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

DROP POLICY IF EXISTS "community_direct_invites_insert_inviter" ON public.community_direct_invites;
CREATE POLICY "community_direct_invites_insert_inviter" ON public.community_direct_invites
  FOR INSERT WITH CHECK (auth.uid() = inviter_id);

DROP POLICY IF EXISTS "community_direct_invites_update_related" ON public.community_direct_invites;
CREATE POLICY "community_direct_invites_update_related" ON public.community_direct_invites
  FOR UPDATE USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE TABLE IF NOT EXISTS public.community_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_invite_id UUID REFERENCES public.community_invites(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','canceled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_community_join_requests_pending
  ON public.community_join_requests(community_id, requester_id)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_community_join_requests_community
  ON public.community_join_requests(community_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_join_requests_requester
  ON public.community_join_requests(requester_id, status, created_at DESC);

ALTER TABLE public.community_join_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_join_requests_select_related" ON public.community_join_requests;
CREATE POLICY "community_join_requests_select_related" ON public.community_join_requests
  FOR SELECT USING (
    auth.uid() = requester_id
    OR EXISTS (
      SELECT 1 FROM public.communities
      WHERE communities.id = community_join_requests.community_id
        AND communities.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "community_join_requests_insert_own" ON public.community_join_requests;
CREATE POLICY "community_join_requests_insert_own" ON public.community_join_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "community_join_requests_update_owner" ON public.community_join_requests;
CREATE POLICY "community_join_requests_update_owner" ON public.community_join_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.communities
      WHERE communities.id = community_join_requests.community_id
        AND communities.owner_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.community_direct_invites TO authenticated;
GRANT ALL ON public.community_direct_invites TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.community_join_requests TO authenticated;
GRANT ALL ON public.community_join_requests TO service_role;
