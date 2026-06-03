-- 1) Contact intelligence columns (additive, all nullable)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_e164 text,
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS preferred_contact_method text;

ALTER TABLE public.client_orders
  ADD COLUMN IF NOT EXISTS customer_phone_e164 text,
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS preferred_contact_method text;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS phone_e164 text,
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS preferred_contact_method text;

-- 2) whatsapp_message_log — operational log mirroring email_send_log shape
CREATE TABLE IF NOT EXISTS public.whatsapp_message_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id text,                     -- idempotency key, e.g. "order-confirm-<order_id>"
  template_name text NOT NULL,         -- order-placed | invoice-issued | order-processing | order-completed | invoice-paid
  recipient_phone text NOT NULL,       -- E.164 format
  recipient_user_id uuid,              -- nullable for guest orders
  related_entity_type text,            -- 'order' | 'invoice' | 'ticket' | etc.
  related_entity_id uuid,
  status text NOT NULL DEFAULT 'pending', -- pending | sent | failed | suppressed
  provider text NOT NULL DEFAULT 'pabbly',
  provider_response jsonb,
  error_message text,
  payload jsonb,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_wa_log_message_id ON public.whatsapp_message_log(message_id);
CREATE INDEX IF NOT EXISTS idx_wa_log_status_created ON public.whatsapp_message_log(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wa_log_recipient ON public.whatsapp_message_log(recipient_phone);
CREATE INDEX IF NOT EXISTS idx_wa_log_entity ON public.whatsapp_message_log(related_entity_type, related_entity_id);

-- 3) Grants — admin-only via app, service_role for edge function
GRANT SELECT ON public.whatsapp_message_log TO authenticated;
GRANT ALL ON public.whatsapp_message_log TO service_role;

-- 4) RLS
ALTER TABLE public.whatsapp_message_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view whatsapp log"
ON public.whatsapp_message_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages whatsapp log"
ON public.whatsapp_message_log
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 5) Enable realtime so OsEmailOps / WhatsApp panel updates live
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_message_log;