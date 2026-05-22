ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (
    type IN (
      'help_nearby',
      'help_helper_arrived',
      'flare_invite',
      'flare_starting',
      'dm_new',
      'post_comment',
      'post_like',
      'community_message',
      'community_invite',
      'message',
      'rsvp_update',
      'system'
    )
  );
