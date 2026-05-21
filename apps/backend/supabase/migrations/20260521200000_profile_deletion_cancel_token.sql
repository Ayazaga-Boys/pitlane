ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deletion_cancel_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS deletion_cancel_token_expires_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_deletion_cancel_token_hash_length'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_deletion_cancel_token_hash_length
      CHECK (
        deletion_cancel_token_hash IS NULL
        OR deletion_cancel_token_hash ~ '^[a-f0-9]{64}$'
      );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_deletion_cancel_token_hash
  ON public.profiles(deletion_cancel_token_hash)
  WHERE deletion_cancel_token_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_deletion_cancel_token_expires_at
  ON public.profiles(deletion_cancel_token_expires_at)
  WHERE deletion_cancel_token_expires_at IS NOT NULL;
