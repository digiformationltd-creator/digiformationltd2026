-- Create private storage bucket for invoices
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Users can read their own invoices (path = <user_id>/<file>)
CREATE POLICY "Users read own invoices"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'invoices'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins read all
CREATE POLICY "Admins read all invoices"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'invoices'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Service role manages everything (used by edge function)
CREATE POLICY "Service role manage invoices"
ON storage.objects FOR ALL
USING (bucket_id = 'invoices' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'invoices' AND auth.role() = 'service_role');