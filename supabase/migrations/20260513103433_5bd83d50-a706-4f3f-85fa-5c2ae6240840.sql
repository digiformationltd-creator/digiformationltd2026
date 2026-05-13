CREATE TABLE public.email_reminder_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('company','address')),
  target_id uuid NOT NULL,
  reminder_type text NOT NULL CHECK (reminder_type IN ('confirmation_statement','annual_accounts','address_expiry')),
  stage smallint NOT NULL CHECK (stage BETWEEN 1 AND 5),
  due_date date NOT NULL,
  recipient_email text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (target_id, reminder_type, stage, due_date)
);

CREATE INDEX idx_email_reminder_log_lookup ON public.email_reminder_log (target_id, reminder_type, due_date);

ALTER TABLE public.email_reminder_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage reminder log"
ON public.email_reminder_log FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages reminder log"
ON public.email_reminder_log FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');