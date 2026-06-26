
-- Phase 3 — Execution Safety Layer
-- Adds command_action_rollback RPC + sync helpers. No system-owned automations touched.

CREATE OR REPLACE FUNCTION public.command_action_mark_executing(_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin privileges required' USING ERRCODE='insufficient_privilege';
  END IF;
  UPDATE public.command_actions
     SET state = 'executing'
   WHERE id = _id AND state IN ('awaiting_approval','preview');
END;
$$;

CREATE OR REPLACE FUNCTION public.command_action_mark_finished(_id uuid, _ok boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin privileges required' USING ERRCODE='insufficient_privilege';
  END IF;
  UPDATE public.command_actions
     SET state = CASE WHEN _ok THEN 'success' ELSE 'error' END
   WHERE id = _id AND state IN ('executing','awaiting_approval','preview');
END;
$$;

CREATE OR REPLACE FUNCTION public.command_action_rollback(_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_act public.command_actions;
  v_before jsonb;
  v_restored jsonb := '{}'::jsonb;
  v_company_allowed text[] := ARRAY['notes','status','director','registered_address',
                                    'company_name','company_number','incorporation_date'];
  v_field text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin privileges required' USING ERRCODE='insufficient_privilege';
  END IF;

  SELECT * INTO v_act FROM public.command_actions WHERE id = _id FOR UPDATE;
  IF v_act.id IS NULL THEN
    RAISE EXCEPTION 'Action % not found', _id;
  END IF;

  IF v_act.status <> 'executed' THEN
    RAISE EXCEPTION 'Only executed actions can be rolled back (status=%)', v_act.status
      USING ERRCODE='check_violation';
  END IF;
  IF v_act.rolled_back_at IS NOT NULL THEN
    RAISE EXCEPTION 'Action already rolled back' USING ERRCODE='check_violation';
  END IF;
  IF v_act.risk_tier = 'destructive' THEN
    RAISE EXCEPTION 'Destructive actions cannot be rolled back' USING ERRCODE='check_violation';
  END IF;
  IF v_act.before_snapshot IS NULL THEN
    RAISE EXCEPTION 'No before_snapshot available for rollback' USING ERRCODE='check_violation';
  END IF;

  v_before := v_act.before_snapshot;

  -- Per-intent restore
  IF v_act.intent IN ('update_invoice_status','update_invoice_meta') THEN
    UPDATE public.invoices SET
      status   = COALESCE(v_before->>'status', status),
      due_date = CASE WHEN v_before ? 'due_date' THEN NULLIF(v_before->>'due_date','')::date ELSE due_date END,
      notes    = CASE WHEN v_before ? 'notes' THEN v_before->>'notes' ELSE notes END
    WHERE id = (v_act.payload->>'invoice_id')::uuid;
    v_restored := jsonb_build_object('table','invoices','id',v_act.payload->>'invoice_id');

  ELSIF v_act.intent IN ('update_company','update_company_field') THEN
    v_field := v_act.payload->>'field';
    IF v_field = ANY(v_company_allowed) AND v_before ? v_field THEN
      EXECUTE format('UPDATE public.managed_companies SET %I = $1 WHERE id = $2', v_field)
        USING v_before->>v_field, (v_act.payload->>'company_id')::uuid;
    END IF;
    v_restored := jsonb_build_object('table','managed_companies','id',v_act.payload->>'company_id','field',v_field);

  ELSIF v_act.intent = 'update_company_address' THEN
    UPDATE public.managed_companies SET registered_address = v_before->>'registered_address'
     WHERE id = (v_act.payload->>'company_id')::uuid;
    v_restored := jsonb_build_object('table','managed_companies','id',v_act.payload->>'company_id','field','registered_address');

  ELSIF v_act.intent = 'update_company_status' THEN
    UPDATE public.managed_companies SET status = v_before->>'status'
     WHERE id = (v_act.payload->>'company_id')::uuid;
    v_restored := jsonb_build_object('table','managed_companies','id',v_act.payload->>'company_id','field','status');

  ELSIF v_act.intent = 'add_note' THEN
    UPDATE public.managed_companies SET notes = v_before->>'notes'
     WHERE id = (v_act.payload->>'company_id')::uuid;
    v_restored := jsonb_build_object('table','managed_companies','id',v_act.payload->>'company_id','field','notes');

  ELSIF v_act.intent = 'update_order_status' THEN
    UPDATE public.client_orders SET status = v_before->>'status'
     WHERE id = (v_act.payload->>'order_id')::uuid;
    v_restored := jsonb_build_object('table','client_orders','id',v_act.payload->>'order_id','field','status');

  ELSIF v_act.intent = 'assign_task' THEN
    UPDATE public.tasks SET assigned_to = NULLIF(v_before->>'assigned_to','')::uuid
     WHERE id = (v_act.payload->>'task_id')::uuid;
    v_restored := jsonb_build_object('table','tasks','id',v_act.payload->>'task_id','field','assigned_to');

  ELSE
    RAISE EXCEPTION 'Intent "%" is not rollback-eligible', v_act.intent
      USING ERRCODE='check_violation';
  END IF;

  -- Mark action rolled back
  UPDATE public.command_actions
     SET state = 'rolled_back',
         rolled_back_at = now(),
         rolled_back_by = auth.uid()
   WHERE id = _id;

  -- Audit chain
  INSERT INTO public.agent_audit_log (agent_name, action, status, request_payload, response_payload)
  VALUES (
    'command-center',
    'rollback:' || v_act.intent,
    'executed',
    jsonb_build_object('original_action_id', v_act.id, 'before_snapshot', v_act.before_snapshot),
    v_restored
  );

  RETURN jsonb_build_object(
    'ok', true,
    'original_action_id', v_act.id,
    'restored', v_restored,
    'rolled_back_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.command_action_rollback(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.command_action_rollback(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.command_action_mark_executing(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.command_action_mark_executing(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.command_action_mark_finished(uuid, boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.command_action_mark_finished(uuid, boolean) TO authenticated;
