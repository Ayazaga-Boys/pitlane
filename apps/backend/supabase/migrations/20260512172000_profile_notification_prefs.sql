ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB NOT NULL DEFAULT jsonb_build_object(
    'help_nearby', true,
    'help_helper_arrived', true,
    'flare_invite', true,
    'flare_starting', true,
    'dm_new', true,
    'community_message', false,
    'community_invite', true,
    'system', true,
    'quiet_hours_start', '23:00',
    'quiet_hours_end', '08:00'
  );

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_notification_prefs_object;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_notification_prefs_object
  CHECK (jsonb_typeof(notification_prefs) = 'object');
