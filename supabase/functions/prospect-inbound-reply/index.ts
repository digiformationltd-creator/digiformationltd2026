// Phase 4 — Inbound reply webhook (Resend Inbound or any provider POSTing JSON).
// Accepts: { from|sender|email, subject?, text?, html?, message_id? }
// Resend Inbound payload: { type: 'email.received', data: { from: {...}, subject, text, ... } }
//
// On match (by sender email == prospect.contact_email):
//   - Stops active campaign run (status='replied')
//   - Marks prospect.status='replied'
//   - Creates / links CRM lead in public.leads
//   - Creates follow-up task in public.tasks
//   - Adds prospect_timeline rows: 'reply' + 'lead_created'
//
// verify_jwt = false so the provider can POST without a JWT.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function extractEmail(input: any): string | null {
  if (!input) return null
  if (typeof input === 'string') {
    const m = input.match(/<([^>]+)>/) || input.match(/([\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/)
    return m ? m[1].toLowerCase().trim() : null
  }
  if (typeof input === 'object') {
    if (typeof input.email === 'string') return input.email.toLowerCase().trim()
    if (typeof input.address === 'string') return input.address.toLowerCase().trim()
    if (Array.isArray(input) && input.length > 0) return extractEmail(input[0])
  }
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  const json = (b: any, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

  let body: any
  try { body = await req.json() } catch { return json({ error: 'invalid json' }, 400) }

  const data = body?.data ?? body
  const sender = extractEmail(data?.from ?? data?.sender ?? data?.email ?? data?.From)
  const subject = data?.subject ?? data?.Subject ?? null
  const text    = data?.text ?? data?.snippet ?? data?.body ?? null
  const messageId = data?.message_id ?? data?.id ?? null

  if (!sender) return json({ ok: false, error: 'sender email not found in payload' }, 400)

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
  const now = new Date().toISOString()

  const { data: prospect } = await supabase
    .from('email_prospects').select('*')
    .ilike('contact_email', sender).maybeSingle()
  if (!prospect) return json({ ok: false, matched: false, sender }, 200)

  // 1) Stop active run
  await supabase.from('prospect_campaign_runs')
    .update({ status: 'replied', stopped_reason: 'inbound reply', completed_at: now })
    .eq('prospect_id', prospect.id).eq('status', 'active')

  // 2) Mark prospect
  await supabase.from('email_prospects').update({ status: 'replied' }).eq('id', prospect.id)

  // 3) CRM lead (idempotent)
  let leadId: string | null = prospect.crm_lead_id ?? null
  if (!leadId && prospect.contact_email) {
    const { data: existing } = await supabase.from('leads').select('id')
      .ilike('email', prospect.contact_email).limit(1).maybeSingle()
    if (existing?.id) leadId = existing.id
    else {
      const { data: newLead } = await supabase.from('leads').insert({
        name: prospect.contact_name || prospect.business_name,
        email: prospect.contact_email,
        country: prospect.country,
        source: 'email_outreach',
        service: prospect.assigned_campaign,
        stage: 'interested',
        notes: `Auto-detected reply to ${prospect.assigned_campaign} outreach. ${prospect.ai_notes ?? ''}`.slice(0, 1000),
        declared_source: 'email_outreach',
        declared_source_label: 'Outbound email reply',
      }).select('id').single()
      leadId = newLead?.id ?? null
    }
    if (leadId) await supabase.from('email_prospects').update({ crm_lead_id: leadId }).eq('id', prospect.id)
  }

  // 4) Follow-up task
  const due = new Date(); due.setDate(due.getDate() + 1)
  await supabase.from('tasks').insert({
    title: `Reply received: ${prospect.business_name}`,
    description: `Inbound reply detected from ${sender}.\n\nSubject: ${subject ?? '—'}\n\n${(text ?? '').toString().slice(0, 800)}`,
    priority: 'high',
    due_date: due.toISOString().slice(0, 10),
    related_lead_id: leadId,
  })

  // 5) Timeline events (idempotent by message_id)
  if (messageId) {
    const { data: existing } = await supabase.from('prospect_timeline').select('id')
      .eq('prospect_id', prospect.id).eq('event_type', 'reply')
      .filter('payload->>message_id', 'eq', String(messageId)).maybeSingle()
    if (existing?.id) return json({ ok: true, duplicate: true })
  }
  await supabase.from('prospect_timeline').insert({
    prospect_id: prospect.id, event_type: 'reply', title: 'Inbound reply detected',
    detail: subject || (text ? String(text).slice(0, 240) : null),
    payload: { sender, subject, message_id: messageId, lead_id: leadId, auto: true },
  })
  if (leadId) {
    await supabase.from('prospect_timeline').insert({
      prospect_id: prospect.id, event_type: 'lead_created',
      title: 'Moved to CRM', detail: `Lead ${leadId}`, payload: { lead_id: leadId, auto: true },
    })
  }

  return json({ ok: true, matched: true, prospect_id: prospect.id, lead_id: leadId })
})
