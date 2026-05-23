
ALTER TABLE public.client_orders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.client_orders
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS customer_whatsapp text,
  ADD COLUMN IF NOT EXISTS notes text;

-- Admins already manage all orders/invoices via existing policies; the
-- "Users view own" SELECT policies only return rows for the matching auth.uid,
-- so guest rows (user_id IS NULL) stay invisible to clients.
