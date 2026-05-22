DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reports_content_type_check'
      AND conrelid = 'public.reports'::regclass
  ) THEN
    ALTER TABLE public.reports DROP CONSTRAINT reports_content_type_check;
  END IF;
END $$;

ALTER TABLE public.reports
  ADD CONSTRAINT reports_content_type_check
  CHECK (content_type IN ('message', 'flare', 'community', 'profile', 'business_pin', 'post', 'comment'));
