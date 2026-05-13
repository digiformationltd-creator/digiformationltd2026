ALTER TABLE public.client_documents ADD COLUMN IF NOT EXISTS address_id UUID;
CREATE INDEX IF NOT EXISTS idx_client_documents_address_id ON public.client_documents(address_id);