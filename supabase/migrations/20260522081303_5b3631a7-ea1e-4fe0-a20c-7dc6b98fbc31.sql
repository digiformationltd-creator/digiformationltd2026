
CREATE TABLE public.affiliate_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  employee_code TEXT,
  joining_date DATE,
  education TEXT,
  experience TEXT,
  message TEXT,
  pdf_url TEXT,
  page_path TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an application"
ON public.affiliate_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(full_name) BETWEEN 2 AND 100
  AND char_length(email) BETWEEN 3 AND 255
  AND char_length(whatsapp) BETWEEN 5 AND 30
  AND (employee_code IS NULL OR char_length(employee_code) <= 60)
  AND (education IS NULL OR char_length(education) <= 300)
  AND (experience IS NULL OR char_length(experience) <= 1000)
  AND (message IS NULL OR char_length(message) <= 2000)
);

CREATE POLICY "Admins manage applications"
ON public.affiliate_applications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow updating pdf_url right after insert (anon clients upload pdf)
CREATE POLICY "Anyone can attach pdf url to own row by application_id"
ON public.affiliate_applications
FOR UPDATE
TO anon, authenticated
USING (pdf_url IS NULL)
WITH CHECK (char_length(coalesce(pdf_url,'')) <= 1000);

-- Storage bucket for application PDFs (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('affiliate-applications', 'affiliate-applications', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read affiliate application pdfs"
ON storage.objects FOR SELECT
USING (bucket_id = 'affiliate-applications');

CREATE POLICY "Anyone can upload affiliate application pdf"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'affiliate-applications');

CREATE POLICY "Admins manage affiliate application files"
ON storage.objects FOR ALL
USING (bucket_id = 'affiliate-applications' AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'affiliate-applications' AND has_role(auth.uid(), 'admin'::app_role));
