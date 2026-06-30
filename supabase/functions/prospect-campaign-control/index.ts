// Admin control surface for prospect campaign runs:
//   action=stop      → status=stopped (manual stop)
//   action=replied   → status=replied + prospect.status='replied'
//                      + CRM lead + follow-up task + timeline events
//   action=restart   → status=active, current_step=0, next_send_at=now()
//   action=enroll    → set prospect.status='enrolled'
//   action=meeting   → timeline event 'meeting' (booked)
//   action=order     → timeline event 'order' (created)
//   action=requalify → reset qualification_status='pending' (re-runs AI)
//
// Admin-only. Never sends mail directly — only manipulates state.
// Reuses public.leads + public.tasks (no duplicate CRM tables).

import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const ANON_KEY     = Deno.env.get('SUPABASE_ANON_KEY')!

  const authHeader = req.headers.get('Authorization') || ''
  if (!authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'auth required' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  }
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData } = await userClient.auth.getUser()
  if (!userData?.user) {
    return new Response(JSON.stringify({ error: 'invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  }
  const admin = createClient(SUPABASE_URL, SERVICE_KEY)
  const { data: role } = await admin.from('user_roles').select('role').eq('user_id', userData.user.id).eq('role', 'admin').maybeSingle()
  if (!role) {
    return new Response(JSON.stringify({ error: 'admin role required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  }

  let body: any
  try { body = await req.json() } catch { return new Response(JSON.stringify({ error: 'invalid json' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}) }
  const { prospect_id, action, reason, detail } = body
  if (!prospect_id || !action) {
    return new Response(JSON.stringify({ error: 'prospect_id and action required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  }

  const now = new Date().toISOString()
  const json = (b: any, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})

  const addTimeline = async (event_type: string, title: string, dtl?: string, payload: any = {}) => {
    await admin.from('prospect_timeline').insert({ prospect_id, event_type, title, detail: dtl ?? null, payload })
  }

  if (action === 'enroll') {
    const { error } = await admin.from('email_prospects').update({ status: 'enrolled' }).eq('id', prospect_id)
    if (error) return json({ error: error.message }, 500)
    await addTimeline('enrolled', 'Manually enrolled')
    return json({ ok: true })
  }

  if (action === 'stop') {
    await admin.from('prospect_campaign_runs').update({
      status: 'stopped', stopped_reason: reason || 'manual stop', completed_at: now,
    }).eq('prospect_id', prospect_id)
    await addTimeline('stopped', 'Sequence stopped', reason || 'manual stop')
    return json({ ok: true })
  }

  if (action === 'replied') {
    // 1) Stop the run
    await admin.from('prospect_campaign_runs').update({
      status: 'replied', stopped_reason: reason || 'inbound reply', completed_at: now,
    }).eq('prospect_id', prospect_id)

    // 2) Fetch prospect
    const { data: p } = await admin.from('email_prospects').select('*').eq('id', prospect_id).maybeSingle()
    if (!p) return json({ error: 'prospect not found' }, 404)

    // 3) Mark prospect
    await admin.from('email_prospects').update({ status: 'replied' }).eq('id', prospect_id)

    // 4) CRM: create lead if not already linked (idempotent on crm_lead_id)
    let leadId: string | null = p.crm_lead_id ?? null
    if (!leadId && p.contact_email) {
      // try existing lead by email
      const { data: existing } = await admin.from('leads').select('id').ilike('email', p.contact_email).limit(1).maybeSingle()
      if (existing?.id) {
        leadId = existing.id
      } else {
        const { data: newLead, error: lerr } = await admin.from('leads').insert({
          name: p.contact_name || p.business_name,
          email: p.contact_email,
          country: p.country,
          source: 'email_outreach',
          service: p.assigned_campaign,
          stage: 'interested',
          notes: `Replied to ${p.assigned_campaign} outreach. ${p.ai_notes ?? ''}`.slice(0, 1000),
          declared_source: 'email_outreach',
          declared_source_label: 'Outbound email reply',
        }).select('id').single()
        if (lerr) console.error('lead insert failed', lerr)
        leadId = newLead?.id ?? null
      }
      if (leadId) {
        await admin.from('email_prospects').update({ crm_lead_id: leadId }).eq('id', prospect_id)
      }
    }

    // 5) Follow-up task (3 working days suggested)
    const due = new Date(); due.setDate(due.getDate() + 1)
    await admin.from('tasks').insert({
      title: `Follow up: ${p.business_name} replied to outreach`,
      description: `Prospect replied to ${p.assigned_campaign} sequence.${detail ? `\nReply detail: ${detail}` : ''}\nAI notes: ${p.ai_notes ?? '—'}`,
      priority: 'high',
      due_date: due.toISOString().slice(0, 10),
      related_lead_id: leadId,
    })

    // 6) Timeline events
    await addTimeline('reply', 'Prospect replied', detail || reason || 'Inbound reply detected', { lead_id: leadId })
    if (leadId) await addTimeline('lead_created', 'Moved to CRM', `Lead ${leadId}`, { lead_id: leadId })

    return json({ ok: true, lead_id: leadId })
  }

  if (action === 'restart') {
    const { data: existing } = await admin.from('prospect_campaign_runs').select('id').eq('prospect_id', prospect_id).maybeSingle()
    if (existing) {
      await admin.from('prospect_campaign_runs').update({
        status: 'active', current_step: 0, next_send_at: now,
        last_error: null, stopped_reason: null, completed_at: null,
      }).eq('prospect_id', prospect_id)
    }
    await admin.from('email_prospects').update({ status: 'enrolled' }).eq('id', prospect_id)
    await addTimeline('restarted', 'Sequence restarted')
    return json({ ok: true })
  }

  if (action === 'meeting') {
    await addTimeline('meeting', 'Meeting booked', detail || reason || null)
    return json({ ok: true })
  }

  if (action === 'order') {
    await addTimeline('order', 'Order created', detail || reason || null, body.payload || {})
    return json({ ok: true })
  }

  if (action === 'requalify') {
    await admin.from('email_prospects').update({
      qualification_status: 'pending',
    }).eq('id', prospect_id)
    await addTimeline('requalify', 'Re-queued for AI qualification')
    return json({ ok: true })
  }

  return json({ error: 'unknown action' }, 400)
})
