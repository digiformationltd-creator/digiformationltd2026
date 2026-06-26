
-- ─────────────────────────────────────────────────────────────────────
-- Phase 7 — Analytics & Operational Insights (read-only RPCs)
-- ─────────────────────────────────────────────────────────────────────

-- 1) Operations summary (KPI tiles + executive summary)
CREATE OR REPLACE FUNCTION public.ops_dashboard_summary()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_today_start  timestamptz := date_trunc('day', now());
  v_week_start   timestamptz := date_trunc('week', now());
  v_month_start  timestamptz := date_trunc('month', now());
  v_today        jsonb;
  v_week         jsonb;
  v_month        jsonb;
  v_active_admins int;
  v_auto_failures int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin privileges required' USING ERRCODE='insufficient_privilege';
  END IF;

  WITH base AS (
    SELECT status, rolled_back_at, executed_at, created_at,
           EXTRACT(EPOCH FROM (executed_at - approved_at))*1000 AS exec_ms
    FROM public.command_actions
    WHERE created_at >= v_today_start
  )
  SELECT jsonb_build_object(
    'total',     count(*),
    'executed',  count(*) FILTER (WHERE status='executed'),
    'failed',    count(*) FILTER (WHERE status='failed'),
    'rejected',  count(*) FILTER (WHERE status='rejected'),
    'rolled_back', count(*) FILTER (WHERE rolled_back_at IS NOT NULL),
    'avg_exec_ms', COALESCE(round(avg(exec_ms))::int, 0)
  ) INTO v_today FROM base;

  WITH base AS (
    SELECT status, rolled_back_at
    FROM public.command_actions WHERE created_at >= v_week_start
  )
  SELECT jsonb_build_object(
    'total', count(*),
    'executed', count(*) FILTER (WHERE status='executed'),
    'failed',   count(*) FILTER (WHERE status='failed'),
    'rolled_back', count(*) FILTER (WHERE rolled_back_at IS NOT NULL)
  ) INTO v_week FROM base;

  WITH base AS (
    SELECT status, rolled_back_at
    FROM public.command_actions WHERE created_at >= v_month_start
  )
  SELECT jsonb_build_object(
    'total', count(*),
    'executed', count(*) FILTER (WHERE status='executed'),
    'failed',   count(*) FILTER (WHERE status='failed'),
    'rolled_back', count(*) FILTER (WHERE rolled_back_at IS NOT NULL)
  ) INTO v_month FROM base;

  SELECT count(DISTINCT admin_id) INTO v_active_admins
  FROM public.command_actions
  WHERE created_at >= v_today_start AND admin_id IS NOT NULL;

  SELECT count(*) INTO v_auto_failures
  FROM public.automation_runs
  WHERE started_at >= v_today_start AND status='failed';

  RETURN jsonb_build_object(
    'today', v_today,
    'week',  v_week,
    'month', v_month,
    'active_admins_today', v_active_admins,
    'automation_failures_today', v_auto_failures,
    'generated_at', now()
  );
END $$;

-- 2) Command insights — top, failed, rolled-back, by module
CREATE OR REPLACE FUNCTION public.command_insights(_since timestamptz DEFAULT (now() - interval '30 days'))
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_top jsonb; v_failed jsonb; v_rb jsonb;
  v_modules jsonb; v_admins jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin privileges required' USING ERRCODE='insufficient_privilege';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY runs DESC), '[]'::jsonb) INTO v_top
  FROM (
    SELECT intent, count(*)::bigint AS runs,
           count(*) FILTER (WHERE status='executed')::bigint AS executed,
           count(*) FILTER (WHERE status='failed')::bigint  AS failed
    FROM public.command_actions
    WHERE created_at >= _since
    GROUP BY intent
    ORDER BY runs DESC
    LIMIT 10
  ) t;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY failed DESC), '[]'::jsonb) INTO v_failed
  FROM (
    SELECT intent, count(*) FILTER (WHERE status='failed')::bigint AS failed,
           count(*)::bigint AS runs
    FROM public.command_actions
    WHERE created_at >= _since
    GROUP BY intent
    HAVING count(*) FILTER (WHERE status='failed') > 0
    ORDER BY failed DESC
    LIMIT 10
  ) t;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY rollbacks DESC), '[]'::jsonb) INTO v_rb
  FROM (
    SELECT intent, count(*) FILTER (WHERE rolled_back_at IS NOT NULL)::bigint AS rollbacks,
           count(*)::bigint AS runs
    FROM public.command_actions
    WHERE created_at >= _since
    GROUP BY intent
    HAVING count(*) FILTER (WHERE rolled_back_at IS NOT NULL) > 0
    ORDER BY rollbacks DESC
    LIMIT 10
  ) t;

  -- modules inferred from target_type
  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY runs DESC), '[]'::jsonb) INTO v_modules
  FROM (
    SELECT COALESCE(NULLIF(target_type,''),'misc') AS module,
           count(*)::bigint AS runs
    FROM public.command_actions
    WHERE created_at >= _since
    GROUP BY 1
    ORDER BY runs DESC
    LIMIT 10
  ) t;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY runs DESC), '[]'::jsonb) INTO v_admins
  FROM (
    SELECT ca.admin_id,
           COALESCE(p.full_name, p.email, ca.admin_id::text) AS name,
           count(*)::bigint AS runs
    FROM public.command_actions ca
    LEFT JOIN public.profiles p ON p.user_id = ca.admin_id
    WHERE ca.created_at >= _since AND ca.admin_id IS NOT NULL
    GROUP BY ca.admin_id, p.full_name, p.email
    ORDER BY runs DESC
    LIMIT 10
  ) t;

  RETURN jsonb_build_object(
    'top_commands',    v_top,
    'most_failed',     v_failed,
    'most_rolled_back', v_rb,
    'top_modules',     v_modules,
    'most_active_admins', v_admins,
    'since', _since
  );
END $$;

-- 3) Automation health — read-only health cards
CREATE OR REPLACE FUNCTION public.automation_health()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_cards jsonb := '[]'::jsonb;
  v_email_q jsonb; v_reminder jsonb; v_invoice jsonb; v_order jsonb; v_cron jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin privileges required' USING ERRCODE='insufficient_privilege';
  END IF;

  -- Email queue: based on email_send_log
  WITH win AS (
    SELECT * FROM public.email_send_log
    WHERE created_at > now() - interval '24 hours'
  )
  SELECT jsonb_build_object(
    'name','Email Queue',
    'window','24h',
    'sent',    (SELECT count(*) FROM win WHERE status='sent'),
    'failed',  (SELECT count(*) FROM win WHERE status IN ('failed','dlq')),
    'pending', (SELECT count(*) FROM win WHERE status='pending'),
    'status', CASE
      WHEN (SELECT count(*) FROM win WHERE status IN ('failed','dlq')) > 5 THEN 'error'
      WHEN (SELECT count(*) FROM win WHERE status IN ('failed','dlq')) > 0 THEN 'warning'
      ELSE 'healthy' END
  ) INTO v_email_q;

  -- Reminder scheduler: latest run of reminder cron(s)
  WITH last AS (
    SELECT * FROM public.automation_runs
    WHERE job_name ILIKE '%reminder%'
    ORDER BY started_at DESC LIMIT 1
  )
  SELECT jsonb_build_object(
    'name','Reminder Scheduler',
    'last_run', (SELECT started_at FROM last),
    'last_status', COALESCE((SELECT status FROM last), 'unknown'),
    'status', CASE
      WHEN (SELECT status FROM last) = 'failed' THEN 'error'
      WHEN (SELECT started_at FROM last) IS NULL THEN 'warning'
      WHEN (SELECT started_at FROM last) < now() - interval '36 hours' THEN 'warning'
      ELSE 'healthy' END
  ) INTO v_reminder;

  -- Invoice generator: orders → invoices coverage (last 24h)
  WITH win AS (
    SELECT co.id, co.amount_gbp,
           EXISTS(SELECT 1 FROM public.invoices i WHERE i.order_id = co.id) AS has_inv
    FROM public.client_orders co
    WHERE co.created_at > now() - interval '24 hours'
      AND COALESCE(co.amount_gbp,0) > 0
      AND COALESCE(co.status,'') NOT IN ('Inquiry','Cancelled')
  )
  SELECT jsonb_build_object(
    'name','Invoice Generator',
    'window','24h',
    'orders',    (SELECT count(*) FROM win),
    'invoiced',  (SELECT count(*) FROM win WHERE has_inv),
    'missing',   (SELECT count(*) FROM win WHERE NOT has_inv),
    'status', CASE
      WHEN (SELECT count(*) FROM win WHERE NOT has_inv) > 0 THEN 'warning'
      ELSE 'healthy' END
  ) INTO v_invoice;

  -- Order automation: orders created vs anomalies
  WITH win AS (
    SELECT * FROM public.client_orders
    WHERE created_at > now() - interval '24 hours'
  )
  SELECT jsonb_build_object(
    'name','Order Automation',
    'window','24h',
    'orders',  (SELECT count(*) FROM win),
    'zero_amount', (SELECT count(*) FROM win
                     WHERE COALESCE(amount_gbp,0)=0 AND COALESCE(source,'')<>'inquiry'),
    'status', CASE
      WHEN (SELECT count(*) FROM win
             WHERE COALESCE(amount_gbp,0)=0 AND COALESCE(source,'')<>'inquiry') > 0 THEN 'warning'
      ELSE 'healthy' END
  ) INTO v_order;

  -- Cron jobs (24h)
  WITH win AS (
    SELECT * FROM public.automation_runs WHERE started_at > now() - interval '24 hours'
  )
  SELECT jsonb_build_object(
    'name','Cron Jobs',
    'window','24h',
    'runs',    (SELECT count(*) FROM win),
    'failed',  (SELECT count(*) FROM win WHERE status='failed'),
    'status', CASE
      WHEN (SELECT count(*) FROM win WHERE status='failed') > 0 THEN 'error'
      ELSE 'healthy' END
  ) INTO v_cron;

  v_cards := jsonb_build_array(v_email_q, v_reminder, v_invoice, v_order, v_cron);
  RETURN jsonb_build_object('cards', v_cards, 'generated_at', now());
END $$;

-- 4) Performance metrics — latencies + 14-day trend
CREATE OR REPLACE FUNCTION public.command_performance_metrics(_since timestamptz DEFAULT (now() - interval '14 days'))
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_summary jsonb; v_trend jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin privileges required' USING ERRCODE='insufficient_privilege';
  END IF;

  WITH base AS (
    SELECT
      EXTRACT(EPOCH FROM (approved_at - created_at))*1000 AS preview_ms,
      EXTRACT(EPOCH FROM (executed_at - approved_at))*1000 AS execute_ms,
      EXTRACT(EPOCH FROM (rolled_back_at - executed_at))*1000 AS rollback_ms
    FROM public.command_actions
    WHERE created_at >= _since
  )
  SELECT jsonb_build_object(
    'preview',  jsonb_build_object(
      'p50', COALESCE(round(percentile_cont(0.5) WITHIN GROUP (ORDER BY preview_ms))::int, 0),
      'p95', COALESCE(round(percentile_cont(0.95) WITHIN GROUP (ORDER BY preview_ms))::int, 0),
      'avg', COALESCE(round(avg(preview_ms))::int, 0)),
    'execute', jsonb_build_object(
      'p50', COALESCE(round(percentile_cont(0.5) WITHIN GROUP (ORDER BY execute_ms))::int, 0),
      'p95', COALESCE(round(percentile_cont(0.95) WITHIN GROUP (ORDER BY execute_ms))::int, 0),
      'avg', COALESCE(round(avg(execute_ms))::int, 0)),
    'rollback', jsonb_build_object(
      'p50', COALESCE(round(percentile_cont(0.5) WITHIN GROUP (ORDER BY rollback_ms))::int, 0),
      'p95', COALESCE(round(percentile_cont(0.95) WITHIN GROUP (ORDER BY rollback_ms))::int, 0),
      'avg', COALESCE(round(avg(rollback_ms))::int, 0))
  ) INTO v_summary FROM base;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'day', day, 'runs', runs, 'executed', executed, 'failed', failed,
           'avg_exec_ms', avg_exec_ms
         ) ORDER BY day), '[]'::jsonb) INTO v_trend
  FROM (
    SELECT date_trunc('day', created_at)::date AS day,
           count(*)::bigint AS runs,
           count(*) FILTER (WHERE status='executed')::bigint AS executed,
           count(*) FILTER (WHERE status='failed')::bigint  AS failed,
           COALESCE(round(avg(EXTRACT(EPOCH FROM (executed_at - approved_at))*1000))::int, 0) AS avg_exec_ms
    FROM public.command_actions
    WHERE created_at >= _since
    GROUP BY 1
  ) t;

  RETURN jsonb_build_object('summary', v_summary, 'trend', v_trend, 'since', _since);
END $$;

-- 5) Audit explorer — filtered, paginated
CREATE OR REPLACE FUNCTION public.audit_search(
  _from timestamptz DEFAULT (now() - interval '30 days'),
  _to   timestamptz DEFAULT now(),
  _admin uuid DEFAULT NULL,
  _intent text DEFAULT NULL,
  _risk text DEFAULT NULL,
  _status text DEFAULT NULL,
  _module text DEFAULT NULL,
  _q text DEFAULT NULL,
  _limit int DEFAULT 100,
  _offset int DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE v_rows jsonb; v_total bigint;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin privileges required' USING ERRCODE='insufficient_privilege';
  END IF;

  WITH filtered AS (
    SELECT ca.id, ca.created_at, ca.executed_at, ca.intent, ca.status, ca.state,
           ca.risk_tier, ca.target_type, ca.target_id, ca.prompt, ca.error,
           ca.rolled_back_at, ca.admin_id,
           COALESCE(p.full_name, p.email) AS admin_name
    FROM public.command_actions ca
    LEFT JOIN public.profiles p ON p.user_id = ca.admin_id
    WHERE ca.created_at >= _from AND ca.created_at <= _to
      AND (_admin  IS NULL OR ca.admin_id = _admin)
      AND (_intent IS NULL OR ca.intent ILIKE '%' || _intent || '%')
      AND (_risk   IS NULL OR ca.risk_tier = _risk)
      AND (_status IS NULL OR ca.status = _status)
      AND (_module IS NULL OR ca.target_type = _module)
      AND (_q      IS NULL OR ca.prompt ILIKE '%' || _q || '%' OR ca.intent ILIKE '%' || _q || '%')
  )
  SELECT count(*) INTO v_total FROM filtered;

  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY (t->>'created_at') DESC), '[]'::jsonb) INTO v_rows
  FROM (
    SELECT * FROM (
      SELECT ca.id, ca.created_at, ca.executed_at, ca.intent, ca.status, ca.state,
             ca.risk_tier, ca.target_type, ca.target_id, ca.prompt, ca.error,
             ca.rolled_back_at, ca.admin_id,
             COALESCE(p.full_name, p.email) AS admin_name
      FROM public.command_actions ca
      LEFT JOIN public.profiles p ON p.user_id = ca.admin_id
      WHERE ca.created_at >= _from AND ca.created_at <= _to
        AND (_admin  IS NULL OR ca.admin_id = _admin)
        AND (_intent IS NULL OR ca.intent ILIKE '%' || _intent || '%')
        AND (_risk   IS NULL OR ca.risk_tier = _risk)
        AND (_status IS NULL OR ca.status = _status)
        AND (_module IS NULL OR ca.target_type = _module)
        AND (_q      IS NULL OR ca.prompt ILIKE '%' || _q || '%' OR ca.intent ILIKE '%' || _q || '%')
      ORDER BY ca.created_at DESC
      LIMIT _limit OFFSET _offset
    ) inner_t
  ) t;

  RETURN jsonb_build_object('rows', v_rows, 'total', v_total, 'limit', _limit, 'offset', _offset);
END $$;
