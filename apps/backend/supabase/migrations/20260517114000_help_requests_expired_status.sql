ALTER TABLE public.help_requests
  DROP CONSTRAINT IF EXISTS help_requests_status_check;

ALTER TABLE public.help_requests
  ADD CONSTRAINT help_requests_status_check
  CHECK (status IN ('open','helper_found','resolved','cancelled','expired'));
