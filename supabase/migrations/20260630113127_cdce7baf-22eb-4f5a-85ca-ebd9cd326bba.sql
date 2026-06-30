
-- 1) New columns on email_prospects
ALTER TABLE public.email_prospects
  ADD COLUMN IF NOT EXISTS qualification_status text NOT NULL DEFAULT 'pending'
    CHECK (qualification_status IN ('pending','qualified','needs_review','rejected','skipped')),
  ADD COLUMN IF NOT EXISTS qualification_confidence numeric,
  ADD COLUMN IF NOT EXISTS ai_notes text,
  ADD COLUMN IF NOT EXISTS recommended_campaigns text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS qualified_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_qualified_at timestamptz,
  ADD COLUMN IF NOT EXISTS crm_lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS email_prospects_qualification_idx
  ON public.email_prospects(qualification_status);

-- 2) Timeline table
CREATE TABLE IF NOT EXISTS public.prospect_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES public.email_prospects(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  title text NOT NULL,
  detail text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS prospect_timeline_prospect_idx
  ON public.prospect_timeline(prospect_id, created_at DESC);

GRANT SELECT, INSERT ON public.prospect_timeline TO authenticated;
GRANT ALL ON public.prospect_timeline TO service_role;
ALTER TABLE public.prospect_timeline ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins manage prospect timeline" ON public.prospect_timeline;
CREATE POLICY "admins manage prospect timeline"
  ON public.prospect_timeline FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 3) Dashboard widgets RPC (admin-only)
CREATE OR REPLACE FUNCTION public.prospect_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Admin privileges required' USING ERRCODE='insufficient_privilege';
  END IF;

  SELECT jsonb_build_object(
    'awaiting_qualification', (
      SELECT count(*) FROM public.email_prospects WHERE qualification_status='pending'
    ),
    'qualified_today', (
      SELECT count(*) FROM public.email_prospects
       WHERE qualified_at >= date_trunc('day', now())
    ),
    'auto_campaigns_assigned', (
      SELECT count(*) FROM public.email_prospects
       WHERE assigned_campaign IS NOT NULL
         AND qualification_status='qualified'
    ),
    'reply_rate', (
      SELECT CASE WHEN count(*) FILTER (WHERE current_step>0) > 0
        THEN round(100.0 * count(*) FILTER (WHERE status='replied')
                              / count(*) FILTER (WHERE current_step>0), 2)
        ELSE 0 END
        FROM public.prospect_campaign_runs
    ),
    'meetings_booked', (
      SELECT count(*) FROM public.prospect_timeline WHERE event_type='meeting'
    ),
    'orders_generated', (
      SELECT count(*) FROM public.prospect_timeline WHERE event_type='order'
    ),
    'avg_confidence', (
      SELECT COALESCE(round(avg(qualification_confidence)::numeric, 2), 0)
        FROM public.email_prospects
       WHERE qualification_confidence IS NOT NULL
    ),
    'rejected_total', (
      SELECT count(*) FROM public.email_prospects WHERE qualification_status='rejected'
    ),
    'generated_at', now()
  ) INTO v;
  RETURN v;
END $$;

-- 4) Existing rows: queue everything for qualification
UPDATE public.email_prospects
   SET qualification_status='pending'
 WHERE qualification_status IS NULL;
