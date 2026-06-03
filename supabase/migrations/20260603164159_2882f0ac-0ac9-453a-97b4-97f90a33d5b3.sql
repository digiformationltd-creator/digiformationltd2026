-- Admin SELECT on email send log
CREATE POLICY "Admins can view email send log"
ON public.email_send_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin SELECT on unsubscribe tokens
CREATE POLICY "Admins can view unsubscribe tokens"
ON public.email_unsubscribe_tokens
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin SELECT on suppressed emails
CREATE POLICY "Admins can view suppressed emails"
ON public.suppressed_emails
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Tighten affiliate-applications upload policy: require path to start with the uploader's user id
DROP POLICY IF EXISTS "Authenticated can upload affiliate pdf to year folder" ON storage.objects;

CREATE POLICY "Authenticated can upload affiliate pdf to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'affiliate-applications'
  AND name ~ ('^[0-9]{4}/' || auth.uid()::text || '/[A-Za-z0-9._-]+\.pdf$')
  AND octet_length(name) <= 200
  AND COALESCE((metadata ->> 'size')::bigint, 0) <= 10485760
);