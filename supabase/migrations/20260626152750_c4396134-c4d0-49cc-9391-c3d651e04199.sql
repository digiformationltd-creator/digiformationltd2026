
-- =========================================================
-- AUTOMATION_RUNS: execution history for cron + workflows
-- =========================================================
CREATE TABLE IF NOT EXISTS public.automation_runs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name    text NOT NULL,
  kind        text NOT NULL DEFAULT 'cron',  -- cron | workflow | command
  status      text NOT NULL DEFAULT 'running', -- running | success | failed
  started_at  timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  duration_ms integer,
  error       text,
  payload     jsonb DEFAULT '{}'::jsonb,
  triggered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_automation_runs_job_started
  ON public.automation_runs (job_name, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_runs_started
  ON public.automation_runs (started_at DESC);

GRANT SELECT ON public.automation_runs TO authenticated;
GRANT ALL  ON public.automation_runs TO service_role;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read automation_runs"
  ON public.automation_runs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- COMMAND_ACTIONS: AI Command Center preview/approve/execute
-- =========================================================
CREATE TABLE IF NOT EXISTS public.command_actions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  intent       text NOT NULL,                 -- create_reminder, send_email, update_company_field, create_task...
  status       text NOT NULL DEFAULT 'pending', -- pending | approved | executed | rejected | failed
  target_type  text,                          -- order | company | client | lead | inquiry | none
  target_id    text,
  prompt       text,
  preview      jsonb DEFAULT '{}'::jsonb,
  payload      jsonb DEFAULT '{}'::jsonb,
  result       jsonb,
  error        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  approved_at  timestamptz,
  executed_at  timestamptz
);
CREATE INDEX IF NOT EXISTS idx_command_actions_admin_created
  ON public.command_actions (admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_command_actions_status
  ON public.command_actions (status, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.command_actions TO authenticated;
GRANT ALL ON public.command_actions TO service_role;
ALTER TABLE public.command_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage command_actions"
  ON public.command_actions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- RPC: reminder_inbox  — deterministic reminder feed
-- =========================================================
CREATE OR REPLACE FUNCTION public.reminder_inbox(_limit int DEFAULT 200)
RETURNS TABLE(
  source         text,
  category       text,
  severity       text,      -- overdue | today | soon | info
  title          text,
  due_date       date,
  target_type    text,
  target_id      uuid,
  payload        jsonb
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin privileges required' USING ERRCODE='insufficient_privilege';
  END IF;

  RETURN QUERY
  -- 1. Open internal tasks
  SELECT
    'task'::text,
    'internal_task'::text,
    CASE
      WHEN t.due_date IS NULL THEN 'info'
      WHEN t.due_date < current_date THEN 'overdue'
      WHEN t.due_date = current_date THEN 'today'
      WHEN t.due_date <= current_date + 3 THEN 'soon'
      ELSE 'info'
    END::text,
    t.title,
    t.due_date,
    'task'::text,
    t.id,
    jsonb_build_object('priority', t.priority, 'status', t.status,
                       'related_order_id', t.related_order_id,
                       'related_lead_id', t.related_lead_id)
  FROM public.tasks t
  WHERE t.status <> 'done'

  UNION ALL
  -- 2. Compliance: confirmation statement
  SELECT 'compliance', 'confirmation_statement',
    CASE WHEN c.confirmation_due < current_date THEN 'overdue'
         WHEN c.confirmation_due = current_date THEN 'today'
         WHEN c.confirmation_due <= current_date + 14 THEN 'soon'
         ELSE 'info' END,
    'Confirmation Statement — ' || c.company_name,
    c.confirmation_due, 'company', c.id,
    jsonb_build_object('company_number', c.company_number)
  FROM public.client_company_details c
  WHERE c.confirmation_due IS NOT NULL
    AND c.confirmation_due <= current_date + 30

  UNION ALL
  -- 3. Compliance: annual accounts
  SELECT 'compliance', 'annual_accounts',
    CASE WHEN c.accounts_filing_due < current_date THEN 'overdue'
         WHEN c.accounts_filing_due <= current_date + 14 THEN 'soon'
         ELSE 'info' END,
    'Annual Accounts — ' || c.company_name,
    c.accounts_filing_due, 'company', c.id,
    jsonb_build_object('company_number', c.company_number)
  FROM public.client_company_details c
  WHERE c.accounts_filing_due IS NOT NULL
    AND c.accounts_filing_due <= current_date + 60

  UNION ALL
  -- 4. Compliance: registered address expiry
  SELECT 'compliance', 'address_expiry',
    CASE WHEN c.address_expire < current_date THEN 'overdue'
         WHEN c.address_expire <= current_date + 14 THEN 'soon'
         ELSE 'info' END,
    'Registered Office expiring — ' || c.company_name,
    c.address_expire, 'company', c.id,
    jsonb_build_object('company_number', c.company_number)
  FROM public.client_company_details c
  WHERE c.address_expire IS NOT NULL
    AND c.address_expire <= current_date + 30

  UNION ALL
  -- 5. Missing company auth code
  SELECT 'missing_data', 'company_auth_code', 'info',
    'Missing Companies House auth code — ' || c.company_name,
    NULL::date, 'company', c.id,
    jsonb_build_object('company_number', c.company_number)
  FROM public.client_company_details c
  WHERE (c.auth_code IS NULL OR length(trim(c.auth_code))=0)
    AND c.company_number IS NOT NULL

  UNION ALL
  -- 6. Stalled paid orders >7 days, still Pending
  SELECT 'order', 'stalled_order',
    CASE WHEN co.created_at < now() - interval '14 days' THEN 'overdue' ELSE 'soon' END,
    'Order pending >7 days — ' || COALESCE(co.order_ref, co.id::text),
    (co.created_at::date), 'order', co.id,
    jsonb_build_object('customer', co.customer_name, 'amount_gbp', co.amount_gbp,
                       'service', co.service, 'status', co.status)
  FROM public.client_orders co
  WHERE co.status = 'Pending'
    AND co.amount_gbp > 0
    AND co.created_at < now() - interval '7 days'

  UNION ALL
  -- 7. Inquiries with no admin reply for >2 days
  SELECT 'lead', 'inquiry_followup', 'soon',
    'Inquiry awaiting follow-up — ' || COALESCE(cs.full_name, cs.email),
    (cs.created_at::date), 'inquiry', cs.id,
    jsonb_build_object('service', cs.service, 'email', cs.email)
  FROM public.contact_submissions cs
  WHERE cs.created_at < now() - interval '2 days'
    AND cs.created_at > now() - interval '30 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.client_orders co
      WHERE co.inquiry_id = cs.id AND co.status NOT IN ('Inquiry','Cancelled')
    )

  ORDER BY 5 NULLS LAST
  LIMIT _limit;
END;
$$;

REVOKE ALL ON FUNCTION public.reminder_inbox(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reminder_inbox(int) TO authenticated;

-- =========================================================
-- RPC: scheduled_jobs_status — real cron + last automation_runs
-- =========================================================
CREATE OR REPLACE FUNCTION public.scheduled_jobs_status()
RETURNS TABLE(
  jobname     text,
  schedule    text,
  active      boolean,
  last_run    timestamptz,
  last_status text,
  duration_ms integer,
  last_error  text,
  run_count_24h bigint,
  failures_24h  bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, cron, pg_temp
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin privileges required' USING ERRCODE='insufficient_privilege';
  END IF;
  RETURN QUERY
  WITH latest AS (
    SELECT DISTINCT ON (job_name)
      job_name, started_at, status, duration_ms, error
    FROM public.automation_runs
    ORDER BY job_name, started_at DESC
  ),
  agg AS (
    SELECT job_name,
           count(*)::bigint AS runs24,
           count(*) FILTER (WHERE status='failed')::bigint AS fails24
    FROM public.automation_runs
    WHERE started_at > now() - interval '24 hours'
    GROUP BY job_name
  )
  SELECT
    j.jobname::text,
    j.schedule::text,
    j.active,
    l.started_at,
    COALESCE(l.status, 'unknown'),
    l.duration_ms,
    l.error,
    COALESCE(a.runs24, 0),
    COALESCE(a.fails24, 0)
  FROM cron.job j
  LEFT JOIN latest l ON l.job_name = j.jobname
  LEFT JOIN agg a   ON a.job_name = j.jobname
  ORDER BY j.jobname;
END;
$$;
REVOKE ALL ON FUNCTION public.scheduled_jobs_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.scheduled_jobs_status() TO authenticated;

-- =========================================================
-- RPC: automation_runs_recent — activity feed
-- =========================================================
CREATE OR REPLACE FUNCTION public.automation_runs_recent(_limit int DEFAULT 50)
RETURNS SETOF public.automation_runs
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT * FROM public.automation_runs
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY started_at DESC
  LIMIT _limit;
$$;
REVOKE ALL ON FUNCTION public.automation_runs_recent(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.automation_runs_recent(int) TO authenticated;

-- =========================================================
-- RPC: command_action_preview — server builds the preview
-- =========================================================
CREATE OR REPLACE FUNCTION public.command_action_preview(_intent text, _payload jsonb, _prompt text DEFAULT NULL)
RETURNS public.command_actions
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row public.command_actions;
  v_preview jsonb;
  v_target_type text := NULLIF(_payload->>'target_type','');
  v_target_id   text := NULLIF(_payload->>'target_id','');
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin privileges required' USING ERRCODE='insufficient_privilege';
  END IF;

  -- Deterministic preview by intent. No AI.
  v_preview := CASE _intent
    WHEN 'create_task' THEN jsonb_build_object(
      'summary', 'Create internal task',
      'will_insert_into', 'tasks',
      'fields', jsonb_build_object(
        'title',       _payload->>'title',
        'description', _payload->>'description',
        'priority',    COALESCE(_payload->>'priority','normal'),
        'due_date',    _payload->>'due_date'
      ))
    WHEN 'create_reminder' THEN jsonb_build_object(
      'summary', 'Create reminder task',
      'will_insert_into', 'tasks',
      'fields', jsonb_build_object(
        'title',     _payload->>'title',
        'priority',  COALESCE(_payload->>'priority','high'),
        'due_date',  COALESCE(_payload->>'due_date', current_date::text)
      ))
    WHEN 'send_email_template' THEN jsonb_build_object(
      'summary', 'Queue transactional email',
      'will_call', 'send-transactional-email',
      'template',  _payload->>'template',
      'recipient', _payload->>'recipient_email')
    WHEN 'update_company_field' THEN jsonb_build_object(
      'summary', 'Update managed company field',
      'will_update_table', 'managed_companies',
      'company_id', _payload->>'company_id',
      'field',      _payload->>'field',
      'new_value',  _payload->>'value')
    ELSE jsonb_build_object('summary','Unknown intent','intent',_intent)
  END;

  INSERT INTO public.command_actions
    (admin_id, intent, status, target_type, target_id, prompt, preview, payload)
  VALUES
    (auth.uid(), _intent, 'pending', v_target_type, v_target_id, _prompt, v_preview, _payload)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;
REVOKE ALL ON FUNCTION public.command_action_preview(text, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.command_action_preview(text, jsonb, text) TO authenticated;

-- =========================================================
-- RPC: command_action_reject
-- =========================================================
CREATE OR REPLACE FUNCTION public.command_action_reject(_id uuid)
RETURNS public.command_actions
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_row public.command_actions;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin privileges required' USING ERRCODE='insufficient_privilege';
  END IF;
  UPDATE public.command_actions
    SET status='rejected'
    WHERE id=_id AND status='pending'
    RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;
REVOKE ALL ON FUNCTION public.command_action_reject(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.command_action_reject(uuid) TO authenticated;
