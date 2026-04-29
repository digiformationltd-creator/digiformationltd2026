CREATE TABLE public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  whatsapp text NOT NULL,
  country text NOT NULL,
  service text NOT NULL,
  message text NOT NULL,
  page_path text,
  referrer text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact form"
  ON public.contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(full_name) BETWEEN 2 AND 100
    AND char_length(email) BETWEEN 3 AND 255
    AND char_length(whatsapp) BETWEEN 5 AND 30
    AND char_length(country) BETWEEN 2 AND 80
    AND char_length(service) BETWEEN 2 AND 100
    AND char_length(message) BETWEEN 10 AND 1500
    AND (page_path IS NULL OR char_length(page_path) <= 500)
    AND (referrer IS NULL OR char_length(referrer) <= 1000)
    AND (user_agent IS NULL OR char_length(user_agent) <= 500)
  );

CREATE INDEX idx_contact_submissions_created_at ON public.contact_submissions (created_at DESC);