ALTER TABLE public.email_send_log
  ADD COLUMN IF NOT EXISTS triggered_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS triggered_by_ip text;

CREATE INDEX IF NOT EXISTS email_send_log_user_created_idx
  ON public.email_send_log (triggered_by_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS email_send_log_created_idx
  ON public.email_send_log (created_at DESC);