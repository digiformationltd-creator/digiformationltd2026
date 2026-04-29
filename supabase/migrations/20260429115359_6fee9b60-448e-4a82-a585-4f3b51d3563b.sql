ALTER TABLE public.newsletter_subscribers ADD COLUMN IF NOT EXISTS message text;

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;

CREATE POLICY "Anyone can subscribe"
ON public.newsletter_subscribers
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(name) > 0
  AND char_length(name) <= 100
  AND char_length(email) > 0
  AND char_length(email) <= 255
  AND (message IS NULL OR char_length(message) <= 2000)
);