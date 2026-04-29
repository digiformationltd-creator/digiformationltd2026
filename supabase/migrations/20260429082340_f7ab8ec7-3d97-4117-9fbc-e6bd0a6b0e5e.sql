CREATE TABLE public.whatsapp_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path TEXT,
  source TEXT,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a click"
  ON public.whatsapp_clicks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (page_path IS NULL OR char_length(page_path) <= 500)
    AND (source IS NULL OR char_length(source) <= 100)
    AND (referrer IS NULL OR char_length(referrer) <= 1000)
    AND (user_agent IS NULL OR char_length(user_agent) <= 500)
  );

CREATE INDEX idx_whatsapp_clicks_created_at ON public.whatsapp_clicks(created_at DESC);