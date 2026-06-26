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
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin privileges required' USING ERRCODE='insufficient_privilege';
  END IF;

  IF _intent IN (
    'create_invoice',
    'send_order_confirmation',
    'send_invoice_email',
    'send_ticket_update',
    'send_scheduled_reminder',
    'mirror_inquiry_to_order'
  ) THEN
    RAISE EXCEPTION 'Intent "%" is system-owned (auto-triggered by backend). Command Center cannot duplicate it.', _intent
      USING ERRCODE='check_violation';
  END IF;

  v_preview := CASE _intent
    WHEN 'create_task' THEN jsonb_build_object(
      'summary','Create internal task','will_insert_into','tasks',
      'fields', jsonb_build_object('title',_payload->>'title','description',_payload->>'description',
        'priority',COALESCE(_payload->>'priority','normal'),'due_date',_payload->>'due_date'))
    WHEN 'create_reminder' THEN jsonb_build_object(
      'summary','Create reminder task','will_insert_into','tasks',
      'fields', jsonb_build_object('title',_payload->>'title',
        'priority',COALESCE(_payload->>'priority','high'),
        'due_date',COALESCE(_payload->>'due_date', current_date::text)))
    WHEN 'create_followup' THEN jsonb_build_object(
      'summary','Create follow-up task','will_insert_into','tasks',
      'fields', jsonb_build_object('title',_payload->>'title',
        'priority',COALESCE(_payload->>'priority','normal'),
        'due_date',COALESCE(_payload->>'due_date',(current_date + 3)::text),
        'related_order_id',_payload->>'related_order_id',
        'related_lead_id',_payload->>'related_lead_id'))
    WHEN 'assign_task' THEN jsonb_build_object(
      'summary','Reassign task','will_update_table','tasks',
      'task_id',_payload->>'task_id','assigned_to',_payload->>'assigned_to')
    WHEN 'send_email_template' THEN jsonb_build_object(
      'summary','Queue transactional email (manual resend/override)','will_call','send-transactional-email',
      'template',_payload->>'template','recipient',_payload->>'recipient_email','data',_payload->'data')
    WHEN 'send_email' THEN jsonb_build_object(
      'summary','Queue transactional email (manual resend/override)','will_call','send-transactional-email',
      'template',_payload->>'template','recipient',_payload->>'recipient_email','data',_payload->'data')
    WHEN 'draft_email' THEN jsonb_build_object(
      'summary','Draft email (no send)','will_return','draft',
      'subject',_payload->>'subject','body',_payload->>'body','recipient',_payload->>'recipient_email')
    WHEN 'update_company_field' THEN jsonb_build_object(
      'summary','Update managed company field','will_update_table','managed_companies',
      'company_id',_payload->>'company_id','field',_payload->>'field','new_value',_payload->>'value')
    WHEN 'update_company' THEN jsonb_build_object(
      'summary','Update managed company field','will_update_table','managed_companies',
      'company_id',_payload->>'company_id','field',_payload->>'field','new_value',_payload->>'value')
    WHEN 'update_company_address' THEN jsonb_build_object(
      'summary','Update company registered address','will_update_table','managed_companies',
      'company_id',_payload->>'company_id','registered_address',_payload->>'registered_address')
    WHEN 'update_company_status' THEN jsonb_build_object(
      'summary','Update company status','will_update_table','managed_companies',
      'company_id',_payload->>'company_id','status',_payload->>'status')
    WHEN 'add_note' THEN jsonb_build_object(
      'summary','Append note to managed company','will_update_table','managed_companies',
      'company_id',_payload->>'company_id','note',_payload->>'note')
    WHEN 'create_order' THEN jsonb_build_object(
      'summary','Create order (admin-initiated; backend auto-issues invoice + emails)','will_call','agent-create-order',
      'service',_payload->>'service','customer_email',_payload->>'customer_email','amount_gbp',_payload->>'amount_gbp')
    WHEN 'update_order_status' THEN jsonb_build_object(
      'summary','Update order status (manual override)','will_update_table','client_orders',
      'order_id',_payload->>'order_id','status',_payload->>'status')
    -- Batch 1: Financial Core
    WHEN 'update_invoice_status' THEN jsonb_build_object(
      'summary','Update invoice status (manual override; will NOT resend invoice email)',
      'will_update_table','invoices',
      'invoice_id',_payload->>'invoice_id',
      'new_status',_payload->>'status',
      'note','Allowed: draft, issued, paid, void, refunded')
    WHEN 'update_invoice_meta' THEN jsonb_build_object(
      'summary','Update invoice metadata (due date / notes only)',
      'will_update_table','invoices',
      'invoice_id',_payload->>'invoice_id',
      'fields', jsonb_strip_nulls(jsonb_build_object(
        'due_date', NULLIF(_payload->>'due_date',''),
        'notes',    NULLIF(_payload->>'notes','')
      )),
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
    (admin_id, intent, status, target_type, target_id, prompt, preview, payload)
  VALUES
    (auth.uid(), _intent, 'pending', v_target_type, v_target_id, _prompt, v_preview, _payload)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$function$;