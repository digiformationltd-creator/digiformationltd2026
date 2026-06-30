CREATE OR REPLACE FUNCTION public.prospect_dashboard_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp' AS $$
DECLARE v jsonb; v_top_campaign text; v_best_industry text;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Admin privileges required' USING ERRCODE='insufficient_privilege';
  END IF;
  SELECT p.assigned_campaign INTO v_top_campaign
  FROM public.email_prospects p
  WHERE p.assigned_campaign IS NOT NULL
  GROUP BY p.assigned_campaign
  ORDER BY count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.prospect_timeline t WHERE t.prospect_id=p.id AND t.event_type IN ('reply','order','meeting'))) DESC NULLS LAST, count(*) DESC LIMIT 1;
  SELECT p.industry INTO v_best_industry
  FROM public.email_prospects p
  WHERE p.industry IS NOT NULL AND length(trim(p.industry))>0
  GROUP BY p.industry
  ORDER BY count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.prospect_timeline t WHERE t.prospect_id=p.id AND t.event_type IN ('reply','order','meeting'))) DESC NULLS LAST LIMIT 1;
  SELECT jsonb_build_object(
    'awaiting_qualification', (SELECT count(*) FROM public.email_prospects WHERE qualification_status='pending'),
    'qualified_today',        (SELECT count(*) FROM public.email_prospects WHERE qualified_at >= date_trunc('day', now())),
    'imported_today',         (SELECT count(*) FROM public.email_prospects WHERE created_at  >= date_trunc('day', now())),
    'active_campaigns',       (SELECT count(*) FROM public.prospect_campaign_runs WHERE status='active'),
    'auto_campaigns_assigned',(SELECT count(*) FROM public.email_prospects WHERE assigned_campaign IS NOT NULL AND qualification_status='qualified'),
    'reply_rate',             (SELECT CASE WHEN count(*) FILTER (WHERE current_step>0)>0 THEN round(100.0*count(*) FILTER (WHERE status='replied')/count(*) FILTER (WHERE current_step>0),2) ELSE 0 END FROM public.prospect_campaign_runs),
    'replies_today',          (SELECT count(*) FROM public.prospect_timeline WHERE event_type='reply'   AND created_at>=date_trunc('day', now())),
    'meetings_today',         (SELECT count(*) FROM public.prospect_timeline WHERE event_type='meeting' AND created_at>=date_trunc('day', now())),
    'orders_today',           (SELECT count(*) FROM public.prospect_timeline WHERE event_type='order'   AND created_at>=date_trunc('day', now())),
    'meetings_booked',        (SELECT count(*) FROM public.prospect_timeline WHERE event_type='meeting'),
    'orders_generated',       (SELECT count(*) FROM public.prospect_timeline WHERE event_type='order'),
    'conversion_rate',        (SELECT CASE WHEN count(*) FILTER (WHERE current_step>0)>0 THEN round(100.0*(SELECT count(DISTINCT prospect_id) FROM public.prospect_timeline WHERE event_type='order')/count(*) FILTER (WHERE current_step>0),2) ELSE 0 END FROM public.prospect_campaign_runs),
    'avg_confidence',         (SELECT COALESCE(round(avg(qualification_confidence)::numeric,2),0) FROM public.email_prospects WHERE qualification_confidence IS NOT NULL),
    'rejected_total',         (SELECT count(*) FROM public.email_prospects WHERE qualification_status='rejected'),
    'top_campaign',           v_top_campaign,
    'best_industry',          v_best_industry,
    'generated_at',           now()
  ) INTO v;
  RETURN v;
END $$;

CREATE OR REPLACE FUNCTION public.prospect_insights()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp' AS $$
DECLARE v_top_campaigns jsonb; v_best_industries jsonb; v_worst_industries jsonb; v_best_subjects jsonb; v_best_hours jsonb; v_trend jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Admin privileges required' USING ERRCODE='insufficient_privilege';
  END IF;
  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.conv_rate DESC NULLS LAST), '[]'::jsonb) INTO v_top_campaigns FROM (
    SELECT r.campaign,
           count(*)::int AS enrolled,
           count(*) FILTER (WHERE r.status='replied')::int AS replies,
           (SELECT count(DISTINCT pt.prospect_id) FROM public.prospect_timeline pt JOIN public.prospect_campaign_runs r2 ON r2.prospect_id=pt.prospect_id WHERE pt.event_type='order' AND r2.campaign=r.campaign)::int AS orders,
           CASE WHEN count(*) FILTER (WHERE r.current_step>0)>0 THEN round(100.0*count(*) FILTER (WHERE r.status='replied')/count(*) FILTER (WHERE r.current_step>0),2) ELSE 0 END AS conv_rate
    FROM public.prospect_campaign_runs r GROUP BY r.campaign
  ) t;
  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.replies DESC NULLS LAST), '[]'::jsonb) INTO v_best_industries FROM (
    SELECT p.industry, count(*)::int AS enrolled,
           count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.prospect_timeline pt WHERE pt.prospect_id=p.id AND pt.event_type='reply'))::int AS replies
    FROM public.email_prospects p WHERE p.industry IS NOT NULL AND length(trim(p.industry))>0
    GROUP BY p.industry HAVING count(*) >= 1 ORDER BY 3 DESC NULLS LAST LIMIT 5
  ) t;
  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.replies ASC NULLS FIRST), '[]'::jsonb) INTO v_worst_industries FROM (
    SELECT p.industry, count(*)::int AS enrolled,
           count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.prospect_timeline pt WHERE pt.prospect_id=p.id AND pt.event_type='reply'))::int AS replies
    FROM public.email_prospects p WHERE p.industry IS NOT NULL AND length(trim(p.industry))>0
    GROUP BY p.industry HAVING count(*) >= 3 ORDER BY 3 ASC, 2 DESC LIMIT 5
  ) t;
  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.reply_rate DESC NULLS LAST), '[]'::jsonb) INTO v_best_subjects FROM (
    SELECT r.last_subject AS subject, count(*)::int AS sent,
           count(*) FILTER (WHERE r.status='replied')::int AS replies,
           round(100.0*count(*) FILTER (WHERE r.status='replied')/NULLIF(count(*),0),2) AS reply_rate
    FROM public.prospect_campaign_runs r WHERE r.last_subject IS NOT NULL
    GROUP BY r.last_subject HAVING count(*) >= 2 ORDER BY 4 DESC NULLS LAST LIMIT 5
  ) t;
  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.replies DESC NULLS LAST), '[]'::jsonb) INTO v_best_hours FROM (
    SELECT extract(hour from l.created_at)::int AS hour_utc, count(*)::int AS sends,
           (SELECT count(*) FROM public.prospect_timeline pt WHERE pt.event_type='reply' AND extract(hour from pt.created_at)::int = extract(hour from l.created_at)::int)::int AS replies
    FROM public.email_send_log l WHERE l.template_name='marketing-outreach' AND l.status='sent'
    GROUP BY extract(hour from l.created_at)::int ORDER BY 3 DESC NULLS LAST LIMIT 5
  ) t;
  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.day), '[]'::jsonb) INTO v_trend FROM (
    SELECT date_trunc('day', pt.created_at)::date AS day,
           count(*) FILTER (WHERE pt.event_type='reply')::int    AS replies,
           count(*) FILTER (WHERE pt.event_type='meeting')::int  AS meetings,
           count(*) FILTER (WHERE pt.event_type='order')::int    AS orders
    FROM public.prospect_timeline pt WHERE pt.created_at >= now() - interval '14 days' GROUP BY 1
  ) t;
  RETURN jsonb_build_object('top_campaigns', v_top_campaigns, 'best_industries', v_best_industries, 'worst_industries', v_worst_industries, 'best_subjects', v_best_subjects, 'best_hours_utc', v_best_hours, 'trend_14d', v_trend, 'generated_at', now());
END $$;

CREATE OR REPLACE FUNCTION public.auto_link_meeting_to_prospect()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp' AS $$
DECLARE v_prospect_id uuid;
BEGIN
  IF NEW.related_lead_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.title IS NULL OR NEW.title !~* '\m(meeting|call|demo|consult)\M' THEN RETURN NEW; END IF;
  SELECT id INTO v_prospect_id FROM public.email_prospects WHERE crm_lead_id = NEW.related_lead_id LIMIT 1;
  IF v_prospect_id IS NULL THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM public.prospect_timeline WHERE prospect_id=v_prospect_id AND event_type='meeting' AND payload->>'task_id' = NEW.id::text) THEN RETURN NEW; END IF;
  INSERT INTO public.prospect_timeline (prospect_id, event_type, title, detail, payload)
  VALUES (v_prospect_id, 'meeting', 'Meeting booked', NEW.title, jsonb_build_object('task_id', NEW.id, 'lead_id', NEW.related_lead_id, 'due_date', NEW.due_date));
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'auto_link_meeting_to_prospect failed: %', SQLERRM;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_auto_link_meeting_to_prospect ON public.tasks;
CREATE TRIGGER tg_auto_link_meeting_to_prospect AFTER INSERT ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.auto_link_meeting_to_prospect();

CREATE OR REPLACE FUNCTION public.auto_link_order_to_prospect()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp' AS $$
DECLARE v_prospect public.email_prospects%ROWTYPE;
BEGIN
  IF NEW.customer_email IS NULL THEN RETURN NEW; END IF;
  SELECT * INTO v_prospect FROM public.email_prospects WHERE lower(contact_email) = lower(NEW.customer_email) LIMIT 1;
  IF v_prospect.id IS NULL THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM public.prospect_timeline WHERE prospect_id=v_prospect.id AND event_type='order' AND payload->>'order_id' = NEW.id::text) THEN RETURN NEW; END IF;
  INSERT INTO public.prospect_timeline (prospect_id, event_type, title, detail, payload)
  VALUES (v_prospect.id, 'order',
          'Order created — ' || COALESCE(NEW.order_ref, NEW.id::text),
          COALESCE(NEW.service,'(service)') || ' — £' || COALESCE(NEW.amount_gbp::text,'0'),
          jsonb_build_object('order_id', NEW.id, 'order_ref', NEW.order_ref, 'amount_gbp', NEW.amount_gbp, 'service', NEW.service, 'source', COALESCE(NEW.source,'')));
  UPDATE public.email_prospects SET status='completed' WHERE id=v_prospect.id AND status<>'completed';
  UPDATE public.prospect_campaign_runs SET status='completed', stopped_reason='converted to customer', completed_at=now() WHERE prospect_id=v_prospect.id AND status='active';
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'auto_link_order_to_prospect failed: %', SQLERRM;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_auto_link_order_to_prospect ON public.client_orders;
CREATE TRIGGER tg_auto_link_order_to_prospect AFTER INSERT ON public.client_orders FOR EACH ROW EXECUTE FUNCTION public.auto_link_order_to_prospect();

CREATE OR REPLACE FUNCTION public.trigger_instant_qualification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp', 'net' AS $$
DECLARE v_url text := 'https://ltxopeehtajwxpbwbqfr.supabase.co/functions/v1/qualify-prospect-now';
BEGIN
  IF NEW.qualification_status <> 'pending' THEN RETURN NEW; END IF;
  BEGIN
    PERFORM net.http_post(url := v_url, headers := jsonb_build_object('Content-Type','application/json'), body := jsonb_build_object('prospect_id', NEW.id));
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'instant qualification dispatch failed: %', SQLERRM;
  END;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tg_trigger_instant_qualification ON public.email_prospects;
CREATE TRIGGER tg_trigger_instant_qualification AFTER INSERT ON public.email_prospects FOR EACH ROW EXECUTE FUNCTION public.trigger_instant_qualification();
