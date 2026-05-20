ALTER TABLE public.media_assets
  DROP CONSTRAINT IF EXISTS media_assets_status_check;

ALTER TABLE public.media_assets
  ADD CONSTRAINT media_assets_status_check
  CHECK (status IN ('pending','processing','ready','failed'));
