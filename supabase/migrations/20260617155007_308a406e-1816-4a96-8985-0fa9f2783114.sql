CREATE TABLE IF NOT EXISTS public.agent_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name TEXT NOT NULL DEFAULT 'odysseus',
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  request_id TEXT,
  checkout_request_id TEXT,
  order_id UUID,
  order_ref TEXT,
  invoice_number TEXT,
  customer_email TEXT,
  service_slug TEXT,
  amount_gbp NUMERIC(12,2),
  flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  request_payload JSONB,
  response_payload JSONB,
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.agent_audit_log TO authenticated;
GRANT ALL ON public.agent_audit_log TO service_role;

ALTER TABLE public.agent_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read agent audit log"
ON public.agent_audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_agent_audit_log_created_at ON public.agent_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_audit_log_order_id ON public.agent_audit_log (order_id);
CREATE INDEX IF NOT EXISTS idx_agent_audit_log_checkout_request_id ON public.agent_audit_log (checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_agent_audit_log_status ON public.agent_audit_log (status);