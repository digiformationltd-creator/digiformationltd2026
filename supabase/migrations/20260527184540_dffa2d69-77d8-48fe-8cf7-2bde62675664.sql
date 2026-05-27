-- Restrict affiliate-applications INSERT to authenticated users only
DROP POLICY IF EXISTS "Anon can upload affiliate pdf to year folder" ON storage.objects;

CREATE POLICY "Authenticated can upload affiliate pdf to year folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'affiliate-applications'
  AND name ~ '^[0-9]{4}/[A-Za-z0-9._-]+\.pdf$'
  AND octet_length(name) <= 200
);

-- Enforce a 10 MB per-file size limit at the bucket level
UPDATE storage.buckets
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf']
WHERE id = 'affiliate-applications';