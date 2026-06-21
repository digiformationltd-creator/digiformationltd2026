// agent-status-feed
// ------------------------------------------------------------------
// Read-only server-to-server endpoint used by the self-hosted
// DigiFormation Hermes AI agent to pull reminders + status updates
// for everything currently in flight: orders, invoices, tickets,
// reminders, managed-company deadlines, and recent agent activity.
//
// AUTH (same pattern as agent-create-order):
//   - X-Agent-API-Key: must equal ORDER_AGENT_API_KEY (required).
//   - X-Agent-Signature: optional HMAC-SHA256 hex of the raw request
//     body (empty string for GET). When AGENT_WEBHOOK_SECRET is
//     configured, the header is REQUIRED and verified.
//
// USAGE:
//   GET  /functions/v1/agent-status-feed?since=2026-06-20T00:00:00Z&limit=100
//   POST /functions/v1/agent-status-feed
//        { "since": "ISO-8601", "limit": 100, "include": ["orders","reminders",...] }
//
// SAFETY:
//   - Service-role key only used inside this function.
//   - Every call is logged to agent_audit_log.
//   - Returns at most `limit` rows per section (default 50, max 500).
// ------------------------------------------------------------------

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-agent-api-key, x-agent-signature, x-request-id',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 500
const DEFAULT_SINCE_HOURS = 24

type Section =
  | 'orders'
  | 'invoices'
  | 'tickets'
  | 'reminders'
  | 'managed_companies'
  | 'leads'
  | 'agent_activity'

const ALL_SECTIONS: Section[] = [
  'orders',
  'invoices',
  'tickets',
  'reminders',
  'managed_companies',
  'leads',
  'agent_activity',
]

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return mismatch === 0
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID()
  const startedAt = Date.now()

  // ---- Auth ----
  const expectedKey = Deno.env.get('ORDER_AGENT_API_KEY')
  if (!expectedKey) {
    return json({ error: 'server_misconfigured', request_id: requestId }, 500)
  }
  const providedKey = req.headers.get('x-agent-api-key') ?? ''
  if (!providedKey || !timingSafeEqual(providedKey, expectedKey)) {
    return json({ error: 'unauthorized', request_id: requestId }, 401)
  }

  // Read raw body once (may be empty for GET)
  const rawBody = req.method === 'GET' ? '' : await req.text()

  const webhookSecret = Deno.env.get('AGENT_WEBHOOK_SECRET')
  if (webhookSecret) {
    const sig = req.headers.get('x-agent-signature') ?? ''
    const expected = await hmacHex(webhookSecret, rawBody)
    if (!sig || !timingSafeEqual(sig.toLowerCase(), expected.toLowerCase())) {
      return json({ error: 'invalid_signature', request_id: requestId }, 401)
    }
  }

  // ---- Params ----
  const url = new URL(req.url)
  let params: { since?: string; limit?: number; include?: Section[] } = {}
  if (req.method === 'POST' && rawBody) {
    try {
      params = JSON.parse(rawBody)
    } catch {
      return json({ error: 'invalid_json', request_id: requestId }, 400)
    }
  } else {
    const sinceParam = url.searchParams.get('since')
    const limitParam = url.searchParams.get('limit')
    const includeParam = url.searchParams.get('include')
    if (sinceParam) params.since = sinceParam
    if (limitParam) params.limit = Number(limitParam)
    if (includeParam) params.include = includeParam.split(',').map((s) => s.trim()) as Section[]
  }

  const limit = Math.min(Math.max(Number(params.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT)
  const since = params.since
    ? new Date(params.since)
    : new Date(Date.now() - DEFAULT_SINCE_HOURS * 60 * 60 * 1000)
  if (isNaN(since.getTime())) {
    return json({ error: 'invalid_since', request_id: requestId }, 400)
  }
  const sinceIso = since.toISOString()
  const sections: Section[] =
    Array.isArray(params.include) && params.include.length > 0
      ? params.include.filter((s) => ALL_SECTIONS.includes(s))
      : ALL_SECTIONS

  // ---- Supabase client (service-role; bypasses RLS) ----
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )

  const result: Record<string, unknown> = {
    request_id: requestId,
    generated_at: new Date().toISOString(),
    since: sinceIso,
    limit,
    sections: {},
  }
  const sectionsOut = result.sections as Record<string, unknown>

  // ---- Ongoing orders (not Completed / Cancelled) ----
  if (sections.includes('orders')) {
    const { data, error } = await supabase
      .from('client_orders')
      .select(
        'id, order_ref, service, status, payment_status, amount_gbp, customer_name, customer_email, customer_whatsapp, country_code, source, created_at, updated_at',
      )
      .not('status', 'in', '("Completed","Cancelled","Refunded")')
      .order('updated_at', { ascending: false })
      .limit(limit)
    sectionsOut.orders = error ? { error: error.message } : { count: data?.length ?? 0, items: data }
  }

  // ---- Invoices needing attention (unpaid / pending / overdue) ----
  if (sections.includes('invoices')) {
    const { data, error } = await supabase
      .from('invoices')
      .select(
        'id, invoice_number, status, amount_gbp, bill_to_name, bill_to_email, due_date, paid_at, created_at, updated_at',
      )
      .in('status', ['Unpaid', 'Pending', 'Overdue', 'Draft'])
      .order('updated_at', { ascending: false })
      .limit(limit)
    sectionsOut.invoices = error
      ? { error: error.message }
      : { count: data?.length ?? 0, items: data }
  }

  // ---- Open / pending support tickets ----
  if (sections.includes('tickets')) {
    const { data, error } = await supabase
      .from('client_tickets')
      .select('id, ticket_ref, user_id, subject, status, replies_count, created_at, updated_at')
      .not('status', 'in', '("Closed","Resolved")')
      .order('updated_at', { ascending: false })
      .limit(limit)
    sectionsOut.tickets = error
      ? { error: error.message }
      : { count: data?.length ?? 0, items: data }
  }

  // ---- Compliance reminders (already-sent log entries since `since`) ----
  if (sections.includes('reminders')) {
    const { data, error } = await supabase
      .from('email_reminder_log')
      .select('id, target_type, target_id, reminder_type, stage, due_date, recipient_email, sent_at')
      .gte('sent_at', sinceIso)
      .order('sent_at', { ascending: false })
      .limit(limit)
    sectionsOut.reminders = error
      ? { error: error.message }
      : { count: data?.length ?? 0, items: data }
  }

  // ---- Managed-company deadlines (next 60 days) + status changes ----
  if (sections.includes('managed_companies')) {
    const horizon = new Date()
    horizon.setDate(horizon.getDate() + 60)
    const horizonIso = horizon.toISOString().slice(0, 10)
    const todayIso = new Date().toISOString().slice(0, 10)

    const [{ data: dueConfirm }, { data: dueAccounts }, { data: dueAddress }, { data: recent }] =
      await Promise.all([
        supabase
          .from('managed_companies')
          .select('id, company_name, company_number, status, confirmation_due')
          .gte('confirmation_due', todayIso)
          .lte('confirmation_due', horizonIso)
          .order('confirmation_due', { ascending: true })
          .limit(limit),
        supabase
          .from('managed_companies')
          .select('id, company_name, company_number, status, accounts_filing_due')
          .gte('accounts_filing_due', todayIso)
          .lte('accounts_filing_due', horizonIso)
          .order('accounts_filing_due', { ascending: true })
          .limit(limit),
        supabase
          .from('managed_companies')
          .select('id, company_name, company_number, status, address_expire')
          .gte('address_expire', todayIso)
          .lte('address_expire', horizonIso)
          .order('address_expire', { ascending: true })
          .limit(limit),
        supabase
          .from('managed_companies')
          .select('id, company_name, company_number, status, updated_at')
          .gte('updated_at', sinceIso)
          .order('updated_at', { ascending: false })
          .limit(limit),
      ])

    sectionsOut.managed_companies = {
      confirmation_due_soon: dueConfirm ?? [],
      accounts_due_soon: dueAccounts ?? [],
      address_expiring_soon: dueAddress ?? [],
      recently_updated: recent ?? [],
    }
  }

  // ---- Leads created since cursor ----
  if (sections.includes('leads')) {
    const { data, error } = await supabase
      .from('leads')
      .select('id, full_name, email, whatsapp, country, service, status, source, created_at')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(limit)
    sectionsOut.leads = error ? { error: error.message } : { count: data?.length ?? 0, items: data }
  }

  // ---- Recent agent activity (every agent action is logged here) ----
  if (sections.includes('agent_activity')) {
    const { data, error } = await supabase
      .from('agent_audit_log')
      .select('id, action, status, order_id, invoice_id, checkout_request_id, error_message, created_at, metadata')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(limit)
    sectionsOut.agent_activity = error
      ? { error: error.message }
      : { count: data?.length ?? 0, items: data }
  }

  // ---- Audit log this read ----
  try {
    await supabase.from('agent_audit_log').insert({
      action: 'status_feed_read',
      status: 'ok',
      checkout_request_id: requestId,
      metadata: {
        request_id: requestId,
        sections,
        since: sinceIso,
        limit,
        duration_ms: Date.now() - startedAt,
        method: req.method,
      },
    })
  } catch (e) {
    console.warn('agent_audit_log insert failed', e)
  }

  return json(result, 200)
})
