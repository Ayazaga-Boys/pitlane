ALTER TABLE public.audit_logs
  DROP CONSTRAINT IF EXISTS audit_logs_action_check;

ALTER TABLE public.audit_logs
  ADD CONSTRAINT audit_logs_action_check
  CHECK (action IN (
    'user_banned',
    'user_unbanned',
    'content_deleted',
    'content_restored',
    'pin_verified',
    'pin_rejected',
    'config_changed',
    'report_resolved',
    'business_approved',
    'business_rejected',
    'business_suspended'
  ));
