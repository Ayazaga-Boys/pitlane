ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delete_after TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT CHECK (
    deletion_reason IS NULL OR char_length(deletion_reason) <= 300
  );

CREATE INDEX IF NOT EXISTS idx_profiles_delete_after
  ON public.profiles(delete_after)
  WHERE delete_after IS NOT NULL;
