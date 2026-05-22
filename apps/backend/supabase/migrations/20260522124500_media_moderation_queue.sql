ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS cf_moderation_status TEXT NOT NULL DEFAULT 'unscanned'
    CHECK (cf_moderation_status IN ('unscanned','clean','flagged')),
  ADD COLUMN IF NOT EXISTS cf_moderation_score DOUBLE PRECISION
    CHECK (cf_moderation_score IS NULL OR (cf_moderation_score >= 0 AND cf_moderation_score <= 1)),
  ADD COLUMN IF NOT EXISTS cf_moderation_labels JSONB NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(cf_moderation_labels) = 'object');

CREATE INDEX IF NOT EXISTS idx_media_assets_moderation_flagged
  ON public.media_assets(created_at DESC)
  WHERE cf_moderation_status = 'flagged';

ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_content_type_check;

ALTER TABLE public.reports
  ADD CONSTRAINT reports_content_type_check
  CHECK (content_type IN ('message','flare','community','profile','business_pin','media_asset'));
