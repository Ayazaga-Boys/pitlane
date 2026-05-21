ALTER TABLE public.help_requests
  ADD COLUMN IF NOT EXISTS target_type TEXT NOT NULL DEFAULT 'nearby'
    CHECK (target_type IN ('nearby','followers','group')),
  ADD COLUMN IF NOT EXISTS target_id UUID,
  ADD COLUMN IF NOT EXISTS urgency TEXT NOT NULL DEFAULT 'normal'
    CHECK (urgency IN ('low','normal','high','critical'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'help_requests_target_id_group_check'
      AND conrelid = 'public.help_requests'::regclass
  ) THEN
    ALTER TABLE public.help_requests
      ADD CONSTRAINT help_requests_target_id_group_check
      CHECK (
        (target_type = 'group' AND target_id IS NOT NULL)
        OR (target_type <> 'group' AND target_id IS NULL)
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_help_requests_target
  ON public.help_requests(target_type, target_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_help_requests_urgency_open
  ON public.help_requests(urgency, created_at DESC)
  WHERE status = 'open';
