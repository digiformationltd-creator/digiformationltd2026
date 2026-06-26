-- Phase 1: Interaction State Machine — additive columns + state constraint

ALTER TABLE public.command_actions
  ADD COLUMN IF NOT EXISTS state text NOT NULL DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS risk_tier text NOT NULL DEFAULT 'safe',
  ADD COLUMN IF NOT EXISTS before_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS after_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS rolled_back_at timestamptz,
  ADD COLUMN IF NOT EXISTS rolled_back_by uuid;

-- Backfill `state` from legacy `status` so existing rows are valid
UPDATE public.command_actions
SET state = CASE status
  WHEN 'pending'    THEN 'awaiting_approval'
  WHEN 'approved'   THEN 'awaiting_approval'
  WHEN 'executed'   THEN 'success'
  WHEN 'failed'     THEN 'error'
  WHEN 'rejected'   THEN 'rejected'
  WHEN 'rolled_back' THEN 'rolled_back'
  ELSE 'idle'
END
WHERE state = 'idle';

-- Hard guards
ALTER TABLE public.command_actions
  DROP CONSTRAINT IF EXISTS valid_state;
ALTER TABLE public.command_actions
  ADD CONSTRAINT valid_state CHECK (state IN (
    'idle','parsing','preview','awaiting_approval',
    'executing','success','error','rejected','rolled_back'
  ));

ALTER TABLE public.command_actions
  DROP CONSTRAINT IF EXISTS valid_risk_tier;
ALTER TABLE public.command_actions
  ADD CONSTRAINT valid_risk_tier CHECK (risk_tier IN ('safe','sensitive','destructive'));

CREATE INDEX IF NOT EXISTS idx_command_actions_state
  ON public.command_actions(state, created_at DESC);

-- Transition guard helper (single source of truth, enforced server-side)
CREATE OR REPLACE FUNCTION public.command_action_transition(_id uuid, _to text)
RETURNS public.command_actions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_from text;
  v_row public.command_actions;
  v_valid boolean := false;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin privileges required' USING ERRCODE='insufficient_privilege';
  END IF;

  SELECT state INTO v_from FROM public.command_actions WHERE id = _id FOR UPDATE;
  IF v_from IS NULL THEN
    RAISE EXCEPTION 'command_action % not found', _id;
  END IF;

  v_valid := CASE v_from
    WHEN 'idle'              THEN _to IN ('parsing')
    WHEN 'parsing'           THEN _to IN ('preview','error')
    WHEN 'preview'           THEN _to IN ('awaiting_approval','error')
    WHEN 'awaiting_approval' THEN _to IN ('executing','rejected')
    WHEN 'executing'         THEN _to IN ('success','error','rolled_back')
    WHEN 'success'           THEN _to IN ('executing','rolled_back')
    WHEN 'error'             THEN _to IN ('idle')
    WHEN 'rejected'          THEN _to IN ('idle')
    WHEN 'rolled_back'       THEN _to IN ('idle')
    ELSE false
  END;

  IF NOT v_valid THEN
    RAISE EXCEPTION 'Invalid state transition: % -> %', v_from, _to
      USING ERRCODE='check_violation';
  END IF;

  UPDATE public.command_actions
     SET state = _to
   WHERE id = _id
   RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

-- Update preview RPC to set state='awaiting_approval' on new actions
-- (preview rows are created server-side ready for approve/reject)
CREATE OR REPLACE FUNCTION public.command_action_preview(_intent text, _payload jsonb, _prompt text DEFAULT NULL::text)
 RETURNS command_actions
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_row public.command_actions;
  v_preview jsonb;
  v_target_type text := NULLIF(_payload->>'target_type','');
  v_target_id   text := NULLIF(_payload->>'target_id','');
  v_risk text := 'safe';
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin privileges required' USING ERRCODE='insufficient_privilege';
  END IF;

  IF _intent IN (
    'create_invoice','send_order_confirmation','send_invoice_email',
    'send_ticket_update','send_scheduled_reminder','mirror_inquiry_to_order'
  ) THEN
    RAISE EXCEPTION 'Intent "%" is system-owned (auto-triggered by backend). Command Center cannot duplicate it.', _intent
      USING ERRCODE='check_violation';
  END IF;

  -- Risk tiering
  v_risk := CASE
    WHEN _intent IN ('update_invoice_status','update_invoice_meta',
                     'update_company_status','update_order_status',
                     'update_company_field','update_company','update_company_address')
      THEN 'sensitive'
    WHEN _intent IN ('create_order','send_email','send_email_template')
      THEN 'destructive'
    ELSE 'safe'
  END;

  v_preview := CASE _intent
    WHEN 'create_task' THEN jsonb_build_object('summary','Create internal task','will_insert_into','tasks',
      'fields', jsonb_build_object('title',_payload->>'title','description',_payload->>'description',
        'priority',COALESCE(_payload->>'priority','normal'),'due_date',_payload->>'due_date'))
    WHEN 'create_reminder' THEN jsonb_build_object('summary','Create reminder task','will_insert_into','tasks',
      'fields', jsonb_build_object('title',_payload->>'title',
        'priority',COALESCE(_payload->>'priority','high'),
        'due_date',COALESCE(_payload->>'due_date', current_date::text)))
    WHEN 'create_followup' THEN jsonb_build_object('summary','Create follow-up task','will_insert_into','tasks',
      'fields', jsonb_build_object('title',_payload->>'title',
        'priority',COALESCE(_payload->>'priority','normal'),
        'due_date',COALESCE(_payload->>'due_date',(current_date + 3)::text),
        'related_order_id',_payload->>'related_order_id',
        'related_lead_id',_payload->>'related_lead_id'))
    WHEN 'assign_task' THEN jsonb_build_object('summary','Reassign task','will_update_table','tasks',
      'task_id',_payload->>'task_id','assigned_to',_payload->>'assigned_to')
    WHEN 'send_email_template' THEN jsonb_build_object('summary','Queue transactional email (manual resend/override)','will_call','send-transactional-email',
      'template',_payload->>'template','recipient',_payload->>'recipient_email','data',_payload->'data')
    WHEN 'send_email' THEN jsonb_build_object('summary','Queue transactional email (manual resend/override)','will_call','send-transactional-email',
      'template',_payload->>'template','recipient',_payload->>'recipient_email','data',_payload->'data')
    WHEN 'draft_email' THEN jsonb_build_object('summary','Draft email (no send)','will_return','draft',
      'subject',_payload->>'subject','body',_payload->>'body','recipient',_payload->>'recipient_email')
    WHEN 'update_company_field' THEN jsonb_build_object('summary','Update managed company field','will_update_table','managed_companies',
      'company_id',_payload->>'company_id','field',_payload->>'field','new_value',_payload->>'value')
    WHEN 'update_company' THEN jsonb_build_object('summary','Update managed company field','will_update_table','managed_companies',
      'company_id',_payload->>'company_id','field',_payload->>'field','new_value',_payload->>'value')
    WHEN 'update_company_address' THEN jsonb_build_object('summary','Update company registered address','will_update_table','managed_companies',
      'company_id',_payload->>'company_id','registered_address',_payload->>'registered_address')
    WHEN 'update_company_status' THEN jsonb_build_object('summary','Update company status','will_update_table','managed_companies',
      'company_id',_payload->>'company_id','status',_payload->>'status')
    WHEN 'add_note' THEN jsonb_build_object('summary','Append note to managed company','will_update_table','managed_companies',
      'company_id',_payload->>'company_id','note',_payload->>'note')
    WHEN 'create_order' THEN jsonb_build_object('summary','Create order (admin-initiated; backend auto-issues invoice + emails)','will_call','agent-create-order',
      'service',_payload->>'service','customer_email',_payload->>'customer_email','amount_gbp',_payload->>'amount_gbp')
    WHEN 'update_order_status' THEN jsonb_build_object('summary','Update order status (manual override)','will_update_table','client_orders',
      'order_id',_payload->>'order_id','status',_payload->>'status')
    WHEN 'update_invoice_status' THEN jsonb_build_object('summary','Update invoice status (manual override; will NOT resend invoice email)',
      'will_update_table','invoices','invoice_id',_payload->>'invoice_id','new_status',_payload->>'status',
      'note','Allowed: draft, issued, paid, void, refunded')
    WHEN 'update_invoice_meta' THEN jsonb_build_object('summary','Update invoice metadata (due date / notes only)',
      'will_update_table','invoices','invoice_id',_payload->>'invoice_id',
      'fields', jsonb_strip_nulls(jsonb_build_object(
        'due_date', NULLIF(_payload->>'due_date',''),
        'notes',    NULLIF(_payload->>'notes',''))),
      'note','Immutable fields (amount, invoice_number, issue_date) are not writable via CC')
    WHEN 'lookup_company' THEN jsonb_build_object('summary','Lookup company','readonly',true,'query',_payload->>'query')
    WHEN 'lookup_customer' THEN jsonb_build_object('summary','Lookup customer','readonly',true,'query',_payload->>'query')
    WHEN 'show_client_history' THEN jsonb_build_object('summary','Show client history','readonly',true,'customer_email',_payload->>'customer_email')
    WHEN 'show_pending_compliance' THEN jsonb_build_object('summary','Show pending compliance','readonly',true)
    WHEN 'show_reminders' THEN jsonb_build_object('summary','Show reminder inbox','readonly',true)
    WHEN 'show_jobs' THEN jsonb_build_object('summary','Show scheduled jobs status','readonly',true)
    WHEN 'show_recent_activity' THEN jsonb_build_object('summary','Show recent automation runs','readonly',true,'limit',COALESCE((_payload->>'limit')::int,25))
    WHEN 'summarize_company' THEN jsonb_build_object('summary','Summarize company','readonly',true,'company_id',_payload->>'company_id')
    ELSE jsonb_build_object('summary','Unknown intent','intent',_intent)
  END;

  INSERT INTO public.command_actions
    (admin_id, intent, status, state, risk_tier, target_type, target_id, prompt, preview, payload)
  VALUES
    (auth.uid(), _intent, 'pending', 'awaiting_approval', v_risk, v_target_type, v_target_id, _prompt, v_preview, _payload)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$function$;
