
CREATE TABLE IF NOT EXISTS public.prospect_campaign_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES public.email_prospects(id) ON DELETE CASCADE,
  campaign public.email_prospect_campaign NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','stopped','replied','failed')),
  current_step INT NOT NULL DEFAULT 0,
  next_send_at TIMESTAMPTZ DEFAULT now(),
  last_message_id TEXT,
  last_subject TEXT,
  last_error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  stopped_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT prospect_campaign_runs_prospect_unique UNIQUE (prospect_id)
);

CREATE INDEX IF NOT EXISTS prospect_campaign_runs_due_idx
  ON public.prospect_campaign_runs (next_send_at)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS prospect_campaign_runs_status_idx
  ON public.prospect_campaign_runs (status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospect_campaign_runs TO authenticated;
GRANT ALL ON public.prospect_campaign_runs TO service_role;

ALTER TABLE public.prospect_campaign_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage prospect campaign runs"
ON public.prospect_campaign_runs
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_prospect_campaign_runs_updated_at
BEFORE UPDATE ON public.prospect_campaign_runs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
