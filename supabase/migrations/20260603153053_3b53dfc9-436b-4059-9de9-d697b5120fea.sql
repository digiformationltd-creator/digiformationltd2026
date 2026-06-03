-- 1) Audit-trail flag for price tampering attempts
ALTER TABLE public.invoices       ADD COLUMN IF NOT EXISTS amount_mismatch boolean NOT NULL DEFAULT false;
ALTER TABLE public.client_orders  ADD COLUMN IF NOT EXISTS amount_mismatch boolean NOT NULL DEFAULT false;

-- 2) Lock down search_path on the remaining SECURITY DEFINER functions
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb)       SET search_path = public, pg_temp;
ALTER FUNCTION public.enqueue_email(text, jsonb)                   SET search_path = public, pg_temp;
ALTER FUNCTION public.read_email_batch(text, integer, integer)     SET search_path = public, pg_temp;
ALTER FUNCTION public.delete_email(text, bigint)                   SET search_path = public, pg_temp;

-- 3) Affiliate uploads: enforce 10 MB file-size cap at the storage policy layer
DROP POLICY IF EXISTS "Authenticated can upload affiliate pdf to year folder" ON storage.objects;

CREATE POLICY "Authenticated can upload affiliate pdf to year folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'affiliate-applications'
    AND name ~ '^[0-9]{4}/[A-Za-z0-9._-]+\.pdf$'
    AND octet_length(name) <= 200
    AND COALESCE((metadata->>'size')::bigint, 0) <= 10485760  -- 10 MB hard cap
  );