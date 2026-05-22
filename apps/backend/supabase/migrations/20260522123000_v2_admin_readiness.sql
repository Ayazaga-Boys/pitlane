ALTER TABLE public.community_needs
  DROP CONSTRAINT IF EXISTS community_needs_status_check;

ALTER TABLE public.community_needs
  ADD CONSTRAINT community_needs_status_check
  CHECK (status IN ('open','resolved','closed','flagged'));

ALTER TABLE public.community_needs
  ADD COLUMN IF NOT EXISTS spam_score INTEGER NOT NULL DEFAULT 0 CHECK (spam_score >= 0),
  ADD COLUMN IF NOT EXISTS spam_reason TEXT CHECK (spam_reason IS NULL OR char_length(spam_reason) <= 240);

CREATE INDEX IF NOT EXISTS idx_community_needs_flagged
  ON public.community_needs(created_at DESC)
  WHERE status = 'flagged';
