-- Create private bucket for client documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-docs', 'client-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Admins can do anything
CREATE POLICY "Admins manage client docs"
ON storage.objects FOR ALL
USING (bucket_id = 'client-docs' AND has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'client-docs' AND has_role(auth.uid(), 'admin'));

-- Clients can read their own files (path: {user_id}/...)
CREATE POLICY "Clients read own docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'client-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);