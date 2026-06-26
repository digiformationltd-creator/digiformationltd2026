
ALTER TABLE public.email_send_log
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.client_orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ticket_id uuid REFERENCES public.client_tickets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS trigger_source text;

ALTER TABLE public.email_send_log
  DROP CONSTRAINT IF EXISTS email_send_log_trigger_source_check;
ALTER TABLE public.email_send_log
  ADD CONSTRAINT email_send_log_trigger_source_check
  CHECK (trigger_source IS NULL OR trigger_source IN ('system','admin','automation','cron','agent'));

CREATE INDEX IF NOT EXISTS email_send_log_order_idx       ON public.email_send_log (order_id, created_at DESC) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS email_send_log_invoice_idx     ON public.email_send_log (invoice_id, created_at DESC) WHERE invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS email_send_log_ticket_idx      ON public.email_send_log (ticket_id, created_at DESC) WHERE ticket_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS email_send_log_client_user_idx ON public.email_send_log (client_user_id, created_at DESC) WHERE client_user_id IS NOT NULL;
