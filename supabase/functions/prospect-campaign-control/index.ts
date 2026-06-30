// Admin control surface for prospect campaign runs:
//   action=stop      → status=stopped (manual stop)
//   action=replied   → status=replied + prospect.status='replied' (mark inbound reply, stop sends)
//   action=restart   → status=active, current_step=0, next_send_at=now() (allows re-enrollment)
//   action=enroll    → set prospect.status='enrolled' so the orchestrator picks it up
//
// Admin-only. Never sends mail directly — only manipulates run state.

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
  const { prospect_id, action, reason } = body
  if (!prospect_id || !action) {
    return new Response(JSON.stringify({ error: 'prospect_id and action required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  }

  const now = new Date().toISOString()

  if (action === 'enroll') {
    const { error } = await admin.from('email_prospects').update({ status: 'enrolled' }).eq('id', prospect_id)
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  }

  if (action === 'stop') {
    await admin.from('prospect_campaign_runs').update({
      status: 'stopped', stopped_reason: reason || 'manual stop', completed_at: now,
    }).eq('prospect_id', prospect_id)
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  }

  if (action === 'replied') {
    await admin.from('prospect_campaign_runs').update({
      status: 'replied', stopped_reason: reason || 'inbound reply', completed_at: now,
    }).eq('prospect_id', prospect_id)
    await admin.from('email_prospects').update({ status: 'replied' }).eq('id', prospect_id)
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  }

  if (action === 'restart') {
    // Resets the run so the orchestrator starts step 1 again.
    const { data: existing } = await admin.from('prospect_campaign_runs').select('id').eq('prospect_id', prospect_id).maybeSingle()
    if (existing) {
      await admin.from('prospect_campaign_runs').update({
        status: 'active', current_step: 0, next_send_at: now,
        last_error: null, stopped_reason: null, completed_at: null,
      }).eq('prospect_id', prospect_id)
    }
    await admin.from('email_prospects').update({ status: 'enrolled' }).eq('id', prospect_id)
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  }

  return new Response(JSON.stringify({ error: 'unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
})
