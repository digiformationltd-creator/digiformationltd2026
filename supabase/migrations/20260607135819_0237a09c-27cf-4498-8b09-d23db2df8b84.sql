ALTER TABLE public.client_orders ADD COLUMN IF NOT EXISTS checkout_request_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS client_orders_checkout_request_id_key ON public.client_orders (checkout_request_id) WHERE checkout_request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS client_orders_dedupe_idx ON public.client_orders (customer_email, service, amount_gbp, created_at);