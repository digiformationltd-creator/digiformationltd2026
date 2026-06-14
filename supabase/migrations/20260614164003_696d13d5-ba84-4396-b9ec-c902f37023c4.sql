
ALTER TABLE public.managed_companies
  ADD COLUMN IF NOT EXISTS director text,
  ADD COLUMN IF NOT EXISTS original_director text,
  ADD COLUMN IF NOT EXISTS auth_code text,
  ADD COLUMN IF NOT EXISTS utr_number text,
  ADD COLUMN IF NOT EXISTS previous_name text,
  ADD COLUMN IF NOT EXISTS previous_address text,
  ADD COLUMN IF NOT EXISTS ch_address text,
  ADD COLUMN IF NOT EXISTS ad01_filing_date date,
  ADD COLUMN IF NOT EXISTS address_status text,
  ADD COLUMN IF NOT EXISTS raw_status text;
