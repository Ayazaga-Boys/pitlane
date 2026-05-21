CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL CONSTRAINT stories_author_id_fkey REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_id UUID NOT NULL CONSTRAINT stories_media_id_fkey REFERENCES public.media_assets(id) ON DELETE CASCADE,
  audience TEXT NOT NULL DEFAULT 'followers' CHECK (audience IN ('public','followers','private')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stories_author_created ON public.stories(author_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stories_active ON public.stories(expires_at, created_at DESC) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_stories_one_story_per_media
  ON public.stories(media_id)
  WHERE deleted_at IS NULL;

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stories_select_authenticated" ON public.stories;
CREATE POLICY "stories_select_authenticated" ON public.stories
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "stories_insert_own" ON public.stories;
CREATE POLICY "stories_insert_own" ON public.stories
  FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "stories_update_own" ON public.stories;
CREATE POLICY "stories_update_own" ON public.stories
  FOR UPDATE USING (auth.uid() = author_id);

CREATE TABLE IF NOT EXISTS public.story_views (
  story_id UUID NOT NULL CONSTRAINT story_views_story_id_fkey REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL CONSTRAINT story_views_viewer_id_fkey REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (story_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_story_views_viewer ON public.story_views(viewer_id, viewed_at DESC);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "story_views_select_related" ON public.story_views;
CREATE POLICY "story_views_select_related" ON public.story_views
  FOR SELECT USING (
    auth.uid() = viewer_id
    OR EXISTS (
      SELECT 1 FROM public.stories
      WHERE stories.id = story_views.story_id
        AND stories.author_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "story_views_insert_own" ON public.story_views;
CREATE POLICY "story_views_insert_own" ON public.story_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

DROP POLICY IF EXISTS "story_views_update_own" ON public.story_views;
CREATE POLICY "story_views_update_own" ON public.story_views
  FOR UPDATE USING (auth.uid() = viewer_id);

CREATE TABLE IF NOT EXISTS public.story_mutes (
  muter_id UUID NOT NULL CONSTRAINT story_mutes_muter_id_fkey REFERENCES public.profiles(id) ON DELETE CASCADE,
  muted_id UUID NOT NULL CONSTRAINT story_mutes_muted_id_fkey REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (muter_id, muted_id),
  CHECK (muter_id <> muted_id)
);

ALTER TABLE public.story_mutes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "story_mutes_own" ON public.story_mutes;
CREATE POLICY "story_mutes_own" ON public.story_mutes
  USING (auth.uid() = muter_id)
  WITH CHECK (auth.uid() = muter_id);

GRANT SELECT, INSERT, UPDATE ON public.stories TO authenticated;
GRANT ALL ON public.stories TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.story_views TO authenticated;
GRANT ALL ON public.story_views TO service_role;

GRANT SELECT, INSERT, DELETE ON public.story_mutes TO authenticated;
GRANT ALL ON public.story_mutes TO service_role;
