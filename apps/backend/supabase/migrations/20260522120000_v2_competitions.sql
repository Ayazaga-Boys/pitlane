CREATE TABLE IF NOT EXISTS public.competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 2000),
  filters JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(filters) = 'object'),
  voting_starts_at TIMESTAMPTZ NOT NULL,
  voting_ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','voting','closed','canceled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (voting_ends_at > voting_starts_at)
);

CREATE INDEX IF NOT EXISTS idx_competitions_community_created
  ON public.competitions(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_competitions_status_voting
  ON public.competitions(status, voting_starts_at, voting_ends_at);
CREATE INDEX IF NOT EXISTS idx_competitions_creator
  ON public.competitions(creator_id, created_at DESC);

ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "competitions_select_visible" ON public.competitions;
CREATE POLICY "competitions_select_visible" ON public.competitions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.communities
      WHERE communities.id = competitions.community_id
        AND (
          communities.type = 'public'
          OR communities.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.community_members
            WHERE community_members.community_id = competitions.community_id
              AND community_members.user_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "competitions_insert_creators" ON public.competitions;
CREATE POLICY "competitions_insert_creators" ON public.competitions
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
      WHERE communities.id = competitions.community_id
        AND (
          communities.owner_id = auth.uid()
          OR community_members.role IN ('captain','moderator')
          OR community_roles.permissions @> '{"can_create_event": true}'::jsonb
          OR community_roles.permissions @> '{"can_moderate": true}'::jsonb
        )
    )
  );

DROP TRIGGER IF EXISTS competitions_updated_at ON public.competitions;
CREATE TRIGGER competitions_updated_at
  BEFORE UPDATE ON public.competitions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.competition_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  entrant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  caption TEXT CHECK (caption IS NULL OR char_length(caption) <= 500),
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id, competition_id),
  UNIQUE (competition_id, entrant_id)
);

CREATE INDEX IF NOT EXISTS idx_competition_entries_competition_created
  ON public.competition_entries(competition_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_competition_entries_entrant
  ON public.competition_entries(entrant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_competition_entries_media
  ON public.competition_entries(media_id);

ALTER TABLE public.competition_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "competition_entries_select_visible" ON public.competition_entries;
CREATE POLICY "competition_entries_select_visible" ON public.competition_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.competitions
      JOIN public.communities ON communities.id = competitions.community_id
      WHERE competitions.id = competition_entries.competition_id
        AND (
          communities.type = 'public'
          OR communities.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.community_members
            WHERE community_members.community_id = competitions.community_id
              AND community_members.user_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "competition_entries_insert_own" ON public.competition_entries;
CREATE POLICY "competition_entries_insert_own" ON public.competition_entries
  FOR INSERT WITH CHECK (
    auth.uid() = entrant_id
    AND EXISTS (
      SELECT 1 FROM public.competitions
      JOIN public.communities ON communities.id = competitions.community_id
      WHERE competitions.id = competition_entries.competition_id
        AND competitions.status IN ('open','voting')
        AND (
          communities.type = 'public'
          OR communities.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.community_members
            WHERE community_members.community_id = competitions.community_id
              AND community_members.user_id = auth.uid()
          )
        )
    )
  );

DROP TRIGGER IF EXISTS competition_entries_updated_at ON public.competition_entries;
CREATE TRIGGER competition_entries_updated_at
  BEFORE UPDATE ON public.competition_entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.competition_votes (
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES public.competition_entries(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (competition_id, voter_id),
  FOREIGN KEY (entry_id, competition_id) REFERENCES public.competition_entries(id, competition_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_competition_votes_entry
  ON public.competition_votes(entry_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_competition_votes_voter
  ON public.competition_votes(voter_id, created_at DESC);

ALTER TABLE public.competition_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "competition_votes_select_visible" ON public.competition_votes;
CREATE POLICY "competition_votes_select_visible" ON public.competition_votes
  FOR SELECT USING (
    voter_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.competitions
      JOIN public.communities ON communities.id = competitions.community_id
      WHERE competitions.id = competition_votes.competition_id
        AND (
          communities.type = 'public'
          OR communities.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.community_members
            WHERE community_members.community_id = competitions.community_id
              AND community_members.user_id = auth.uid()
          )
        )
    )
  );

DROP POLICY IF EXISTS "competition_votes_upsert_own" ON public.competition_votes;
CREATE POLICY "competition_votes_upsert_own" ON public.competition_votes
  FOR ALL USING (auth.uid() = voter_id)
  WITH CHECK (auth.uid() = voter_id);

DROP TRIGGER IF EXISTS competition_votes_updated_at ON public.competition_votes;
CREATE TRIGGER competition_votes_updated_at
  BEFORE UPDATE ON public.competition_votes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

GRANT SELECT, INSERT, UPDATE ON public.competitions TO authenticated;
GRANT ALL ON public.competitions TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.competition_entries TO authenticated;
GRANT ALL ON public.competition_entries TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.competition_votes TO authenticated;
GRANT ALL ON public.competition_votes TO service_role;
