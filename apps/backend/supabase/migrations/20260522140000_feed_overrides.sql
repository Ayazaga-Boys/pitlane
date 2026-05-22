CREATE TABLE IF NOT EXISTS public.feed_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL CONSTRAINT feed_overrides_post_id_fkey REFERENCES public.posts(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('boost','shadowban')),
  reason TEXT CHECK (reason IS NULL OR char_length(reason) <= 500),
  created_by UUID CONSTRAINT feed_overrides_created_by_fkey REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_overrides_action
  ON public.feed_overrides(action_type, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_overrides_active
  ON public.feed_overrides(expires_at, updated_at DESC)
  WHERE expires_at IS NOT NULL;

ALTER TABLE public.feed_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feed_overrides_select_authenticated" ON public.feed_overrides;
CREATE POLICY "feed_overrides_select_authenticated" ON public.feed_overrides
  FOR SELECT TO authenticated USING (expires_at IS NULL OR expires_at > NOW());

DROP POLICY IF EXISTS "feed_overrides_write_admin" ON public.feed_overrides;
CREATE POLICY "feed_overrides_write_admin" ON public.feed_overrides
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin','moderator')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin','moderator')
  ));

DROP TRIGGER IF EXISTS feed_overrides_updated_at ON public.feed_overrides;
CREATE TRIGGER feed_overrides_updated_at
  BEFORE UPDATE ON public.feed_overrides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT ON public.feed_overrides TO authenticated;
GRANT ALL ON public.feed_overrides TO service_role;

ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_content_type_check;

ALTER TABLE public.reports
  ADD CONSTRAINT reports_content_type_check
  CHECK (content_type IN ('message','flare','community','profile','business_pin','post','comment','media_asset'));
