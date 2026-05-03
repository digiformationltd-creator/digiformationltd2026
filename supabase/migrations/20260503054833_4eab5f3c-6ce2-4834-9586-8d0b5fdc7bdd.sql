ALTER TABLE public.client_company_details
  ADD COLUMN IF NOT EXISTS correspondence_address text;