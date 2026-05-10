CREATE TABLE IF NOT EXISTS public.blocks (
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocks_own" ON public.blocks;
CREATE POLICY "blocks_own" ON public.blocks
  USING (auth.uid() = blocker_id)
  WITH CHECK (auth.uid() = blocker_id);

CREATE TABLE IF NOT EXISTS public.reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_type  TEXT NOT NULL CHECK (content_type IN ('message','flare','community','profile','business_pin')),
  content_id    UUID NOT NULL,
  reason        TEXT NOT NULL CHECK (reason IN ('spam','harassment','inappropriate','fake','other')),
  description   TEXT CHECK (description IS NULL OR char_length(description) <= 500),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','dismissed')),
  reviewed_by   UUID REFERENCES public.profiles(id),
  reviewed_at   TIMESTAMPTZ,
  action_taken  TEXT CHECK (action_taken IS NULL OR action_taken IN ('none','content_deleted','user_warned','user_banned')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_content ON public.reports(content_type, content_id);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_select_own" ON public.reports;
CREATE POLICY "reports_select_own" ON public.reports FOR SELECT USING (reporter_id = auth.uid());

DROP POLICY IF EXISTS "reports_insert" ON public.reports;
CREATE POLICY "reports_insert" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;

GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
