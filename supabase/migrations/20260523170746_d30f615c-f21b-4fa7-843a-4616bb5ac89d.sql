-- Tighten storage upload policy: anon may only upload PDFs into a YYYY/ folder
DROP POLICY IF EXISTS "Anyone can upload affiliate application pdf" ON storage.objects;

CREATE POLICY "Anon can upload affiliate pdf to year folder"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'affiliate-applications'
  AND name ~ '^[0-9]{4}/[A-Za-z0-9._-]+\.pdf$'
  AND octet_length(name) <= 200
);

-- Constrain pdf_url on affiliate_applications to a relative storage path matching the same shape
ALTER TABLE public.affiliate_applications
  DROP CONSTRAINT IF EXISTS affiliate_applications_pdf_url_format;

ALTER TABLE public.affiliate_applications
  ADD CONSTRAINT affiliate_applications_pdf_url_format
  CHECK (
    pdf_url IS NULL
    OR pdf_url ~ '^[0-9]{4}/[A-Za-z0-9._-]+\.pdf$'
  );