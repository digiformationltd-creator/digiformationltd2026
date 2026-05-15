-- Allow anonymous and authenticated users to upload files into
-- client-docs/submissions/<order-ref>/... so their checkout uploads
-- (ID front, ID back, holding selfie) can be persisted alongside the order.
-- Read access stays restricted: only admins (existing policy) and the
-- service role (which generates signed URLs for the invoice/email) can
-- list or fetch these files. Visitors cannot list or read them back.
CREATE POLICY "Anyone can upload form submissions"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'client-docs'
  AND (storage.foldername(name))[1] = 'submissions'
);