// os-command-execute
// ----------------------------------------------------------------------------
// AI Command Center execution dispatcher. Admin-only. No AI here — deterministic
// intent → existing-backend mapping. Caller flow:
//   1) POST {action:"preview", intent, payload, prompt?} → returns command_action row
//   2) POST {action:"execute", id} → runs intent against existing tables/functions
//   3) POST {action:"reject",  id} → marks rejected
// Logs to command_actions + agent_audit_log + automation_runs.

import { createClient } from 'npm:@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY     = Deno.env.get('SUPABASE_ANON_KEY')!

async function getAdminUser(req: Request) {
  const auth = req.headers.get('Authorization') ?? ''
  if (!auth.startsWith('Bearer ')) return null
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: auth } },
  })
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return null
  const admin = createClient(SUPABASE_URL, SERVICE_KEY)
  const { data: roles } = await admin
    .from('user_roles').select('role').eq('user_id', user.id)
  const isAdmin = (roles ?? []).some((r: any) => r.role === 'admin')
  return isAdmin ? user : null
}

async function recordRun(admin: any, jobName: string, fn: () => Promise<any>) {
  const started = Date.now()
  const { data: run } = await admin.from('automation_runs').insert({
    job_name: jobName, kind: 'command', status: 'running',
  }).select().single()
  try {
    const result = await fn()
    await admin.from('automation_runs').update({
      status: 'success',
      finished_at: new Date().toISOString(),
      duration_ms: Date.now() - started,
      payload: { result_summary: typeof result === 'object' ? Object.keys(result ?? {}) : null },
    }).eq('id', run.id)
    return result
  } catch (e) {
    await admin.from('automation_runs').update({
      status: 'failed',
      finished_at: new Date().toISOString(),
      duration_ms: Date.now() - started,
      error: (e as Error).message,
    }).eq('id', run.id)
    throw e
  }
}

// Helper: call an existing edge function with service-role auth.
async function callFn(name: string, body: unknown) {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json',
               Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY },
    body: JSON.stringify(body),
  })
  const out = await resp.json().catch(() => ({}))
  if (!resp.ok) throw new Error(out?.error ?? `HTTP ${resp.status}`)
  return out
}

// Allowed managed_companies columns the Command Center may write.
const ALLOWED_COMPANY_FIELDS = new Set([
  'notes', 'status', 'director', 'registered_address',
  'company_name', 'company_number', 'incorporation_date',
])

// Deterministic dispatcher. Reuses existing tables, RPCs and Edge Functions.
async function executeIntent(admin: any, action: any, user: any) {
  const { intent, payload } = action
  switch (intent) {
    // ---------- Tasks / reminders ----------
    case 'create_task':
    case 'create_reminder':
    case 'create_followup': {
      const { data, error } = await admin.from('tasks').insert({
        title: payload.title,
        description: payload.description ?? null,
        priority: payload.priority ?? (intent === 'create_reminder' ? 'high' : 'normal'),
        status: 'todo',
        due_date: payload.due_date ?? (intent === 'create_followup' ? null : null),
        related_order_id: payload.related_order_id ?? null,
        related_lead_id: payload.related_lead_id ?? null,
        created_by: user.id,
        assigned_to: payload.assigned_to ?? user.id,
      }).select().single()
      if (error) throw new Error(error.message)
      return { task_id: data.id }
    }
    case 'assign_task': {
      if (!payload.task_id || !payload.assigned_to) throw new Error('task_id and assigned_to required')
      const { data, error } = await admin.from('tasks')
        .update({ assigned_to: payload.assigned_to })
        .eq('id', payload.task_id).select().single()
      if (error) throw new Error(error.message)
      return { task_id: data.id, assigned_to: data.assigned_to }
    }

    // ---------- Email ----------
    case 'send_email_template':
    case 'send_email': {
      return await callFn('send-transactional-email', {
        template: payload.template,
        recipient_email: payload.recipient_email,
        data: payload.data ?? {},
      })
    }
    case 'draft_email': {
      // No external call — return the draft for the admin to review/edit.
      return {
        kind: 'draft',
        subject: payload.subject ?? '',
        body: payload.body ?? '',
        recipient: payload.recipient_email ?? null,
      }
    }

    // ---------- Companies ----------
    case 'update_company_field':
    case 'update_company': {
      if (!ALLOWED_COMPANY_FIELDS.has(payload.field)) {
        throw new Error(`Field "${payload.field}" not permitted via Command Center`)
      }
      const upd: Record<string, unknown> = { [payload.field]: payload.value }
      const { data, error } = await admin.from('managed_companies')
        .update(upd).eq('id', payload.company_id).select().single()
      if (error) throw new Error(error.message)
      return { company_id: data.id, field: payload.field }
    }
    case 'update_company_address': {
      const { data, error } = await admin.from('managed_companies')
        .update({ registered_address: payload.registered_address })
        .eq('id', payload.company_id).select().single()
      if (error) throw new Error(error.message)
      return { company_id: data.id, registered_address: data.registered_address }
    }
    case 'update_company_status': {
      const { data, error } = await admin.from('managed_companies')
        .update({ status: payload.status })
        .eq('id', payload.company_id).select().single()
      if (error) throw new Error(error.message)
      return { company_id: data.id, status: data.status }
    }
    case 'add_note': {
      const { data: row, error: e1 } = await admin.from('managed_companies')
        .select('notes').eq('id', payload.company_id).single()
      if (e1) throw new Error(e1.message)
      const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
      const combined = `${row?.notes ? row.notes + '\n\n' : ''}[${stamp}] ${payload.note ?? ''}`.trim()
      const { error: e2 } = await admin.from('managed_companies')
        .update({ notes: combined }).eq('id', payload.company_id)
      if (e2) throw new Error(e2.message)
      return { company_id: payload.company_id, appended: true }
    }

    // ---------- Orders / invoices ----------
    case 'create_invoice': {
      return await callFn('generate-invoice', {
        order_id: payload.order_id,
        customer_email: payload.customer_email,
      })
    }
    case 'create_order': {
      return await callFn('agent-create-order', payload)
    }
    case 'update_order_status': {
      if (!payload.order_id || !payload.status) throw new Error('order_id and status required')
      const { data, error } = await admin.from('client_orders')
        .update({ status: payload.status })
        .eq('id', payload.order_id).select().single()
      if (error) throw new Error(error.message)
      return { order_id: data.id, status: data.status }
    }

    // ---------- Read-only lookups (preview-as-result) ----------
    case 'lookup_company': {
      const q = String(payload.query ?? '').trim()
      if (!q) throw new Error('query required')
      const { data, error } = await admin.from('managed_companies')
        .select('id,company_name,company_number,status,registered_address,incorporation_date')
        .or(`company_name.ilike.%${q}%,company_number.ilike.%${q}%`)
        .limit(20)
      if (error) throw new Error(error.message)
      return { results: data }
    }
    case 'lookup_customer': {
      const q = String(payload.query ?? '').trim()
      if (!q) throw new Error('query required')
      const { data, error } = await admin.from('profiles')
        .select('user_id,full_name,email,whatsapp,created_at')
        .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(20)
      if (error) throw new Error(error.message)
      return { results: data }
    }
    case 'show_client_history': {
      const email = String(payload.customer_email ?? '').trim().toLowerCase()
      if (!email) throw new Error('customer_email required')
      const [orders, invoices] = await Promise.all([
        admin.from('client_orders')
          .select('id,order_ref,service,amount_gbp,status,created_at')
          .ilike('customer_email', email).order('created_at', { ascending: false }).limit(50),
        admin.from('invoices')
          .select('id,invoice_number,total_amount,status,issued_at')
          .ilike('bill_to_email', email).order('issued_at', { ascending: false }).limit(50),
      ])
      if (orders.error) throw new Error(orders.error.message)
      if (invoices.error) throw new Error(invoices.error.message)
      return { customer_email: email, orders: orders.data, invoices: invoices.data }
    }
    case 'show_pending_compliance': {
      const { data, error } = await admin.rpc('reminder_inbox', { _limit: 200 })
      if (error) throw new Error(error.message)
      return { items: (data ?? []).filter((r: any) => r.source === 'compliance') }
    }
    case 'show_reminders': {
      const { data, error } = await admin.rpc('reminder_inbox', { _limit: 100 })
      if (error) throw new Error(error.message)
      return { items: data }
    }
    case 'show_jobs': {
      const { data, error } = await admin.rpc('scheduled_jobs_status')
      if (error) throw new Error(error.message)
      return { jobs: data }
    }
    case 'show_recent_activity': {
      const limit = Math.min(Number(payload.limit ?? 25), 100)
      const { data, error } = await admin.rpc('automation_runs_recent', { _limit: limit })
      if (error) throw new Error(error.message)
      return { runs: data }
    }
    case 'summarize_company': {
      if (!payload.company_id) throw new Error('company_id required')
      const [mc, ccd] = await Promise.all([
        admin.from('managed_companies').select('*').eq('id', payload.company_id).maybeSingle(),
        admin.from('client_company_details').select('*').eq('id', payload.company_id).maybeSingle(),
      ])
      return { managed_company: mc.data ?? null, client_company_details: ccd.data ?? null }
    }

    default:
      throw new Error(`Unknown intent: ${intent}`)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const user = await getAdminUser(req)
  if (!user) return json({ error: 'Unauthorized' }, 401)

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)
  let body: any
  try { body = await req.json() } catch { return json({ error: 'Bad JSON' }, 400) }
  const action = body?.action

  try {
    if (action === 'preview') {
      const { data, error } = await admin.rpc('command_action_preview', {
        _intent: body.intent, _payload: body.payload ?? {}, _prompt: body.prompt ?? null,
      }).single()
      if (error) throw new Error(error.message)
      // Note: SECURITY DEFINER + service-role client bypasses auth.uid(); patch admin_id.
      await admin.from('command_actions').update({ admin_id: user.id }).eq('id', (data as any).id)
      return json({ ok: true, action: data })
    }

    if (action === 'reject') {
      const { data, error } = await admin.from('command_actions')
        .update({ status: 'rejected' }).eq('id', body.id).eq('status', 'pending')
        .select().single()
      if (error) throw new Error(error.message)
      return json({ ok: true, action: data })
    }

    if (action === 'execute') {
      const { data: act, error: e1 } = await admin.from('command_actions')
        .select('*').eq('id', body.id).single()
      if (e1 || !act) throw new Error('Action not found')
      if (act.status === 'executed') return json({ ok: true, action: act, deduped: true })
      if (act.status === 'rejected') throw new Error('Action was rejected')

      // mark approved
      await admin.from('command_actions').update({
        status: 'approved', approved_at: new Date().toISOString(), admin_id: user.id,
      }).eq('id', act.id)

      let result: any, errMsg: string | null = null
      try {
        result = await recordRun(admin, `command:${act.intent}`,
          () => executeIntent(admin, act, user))
      } catch (e) { errMsg = (e as Error).message }

      const finalStatus = errMsg ? 'failed' : 'executed'
      await admin.from('command_actions').update({
        status: finalStatus,
        executed_at: new Date().toISOString(),
        result: result ?? null,
        error: errMsg,
      }).eq('id', act.id)

      // Audit
      await admin.from('agent_audit_log').insert({
        agent_name: 'command-center',
        action: act.intent,
        status: finalStatus,
        request_payload: act.payload,
        response_payload: result ?? null,
        error_message: errMsg,
      })

      if (errMsg) return json({ ok: false, error: errMsg }, 400)
      return json({ ok: true, result, action_id: act.id })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (e) {
    return json({ error: (e as Error).message }, 400)
  }
})
