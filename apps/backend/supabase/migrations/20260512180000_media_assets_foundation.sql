CREATE TABLE IF NOT EXISTS public.media_assets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  asset_type   TEXT NOT NULL CHECK (asset_type IN ('photo','video')),
  storage_key  TEXT NOT NULL,
  cf_image_id  TEXT,
  cf_stream_id TEXT,
  width        INTEGER,
  height       INTEGER,
  duration_sec SMALLINT,
  size_bytes   INTEGER CHECK (size_bytes IS NULL OR size_bytes > 0),
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','ready','failed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_uploader ON public.media_assets(uploader_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_media_assets_storage_key ON public.media_assets(storage_key);

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_own" ON public.media_assets;
CREATE POLICY "media_own" ON public.media_assets
  USING (auth.uid() = uploader_id)
  WITH CHECK (auth.uid() = uploader_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;
