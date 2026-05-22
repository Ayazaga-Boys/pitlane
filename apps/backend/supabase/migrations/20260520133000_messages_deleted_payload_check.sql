ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_body_or_media;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_body_or_media
  CHECK (
    is_deleted = TRUE
    OR body IS NOT NULL
    OR media_url IS NOT NULL
  );
