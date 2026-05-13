-- Add activation_code column to client_company_details table
ALTER TABLE public.client_company_details
ADD COLUMN IF NOT EXISTS activation_code TEXT;

-- Also ensure utr_number and auth_code exist (they should already, but safe check)
-- These are already present in the schema so no need to add them again
