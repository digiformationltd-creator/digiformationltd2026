// Phase 4 — Instant per-prospect AI qualifier.
// Called by AFTER INSERT trigger on email_prospects via pg_net (no auth).
// Reuses the same AI + rule logic as qualify-prospects. The scheduled cron
// remains as a guaranteed fallback if this dispatch is dropped.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const LOVABLE_AI_KEY = Deno.env.get('LOVABLE_API_KEY') || ''
const MODEL = 'google/gemini-3-flash-preview'
const VALID_CAMPAIGNS = ['idv_acsp','uk_formation','banking','compliance','ai_dashboard','website_dev']

type Prospect = Record<string, any>

function ruleBasedFallback(p: Prospect) {
  const reasons: string[] = []
  const set = new Set<string>()
  const type = `${p.business_type ?? ''} ${p.industry ?? ''} ${p.notes ?? ''}`.toLowerCase()
  const loc = `${p.location ?? ''} ${p.country ?? ''}`.toLowerCase()
  const isUK = /uk|united kingdom|england|scotland|wales|london|manchester|birmingham/.test(loc)
  const isRestaurant = /restaurant|cafe|food|takeaway|catering/.test(type)
  const isClinic = /clinic|dental|medical|wellness|salon|spa/.test(type)
  const isSchool = /school|academy|tutor|education|coach/.test(type)
  const isMarketplace = /amazon|ebay|etsy|shopify|woocommerce|walmart|marketplace seller/.test(type)
  const isAgency = /agency|freelance|seo|marketing|developer|consultant/.test(type)
  if (!p.has_website) { set.add('website_dev'); reasons.push('No website → Website Dev') }
  if (isUK) { set.add('idv_acsp'); set.add('uk_formation'); set.add('compliance'); set.add('banking'); reasons.push('UK business') }
  if (isRestaurant || isClinic || isSchool) { set.add('ai_dashboard'); reasons.push('Service vertical → AI Dashboard') }
  if (isMarketplace) { set.add('banking') }
  if (isAgency) { set.add('banking') }
  if (p.has_website) set.delete('website_dev')
  const campaigns = [...set].filter((c) => VALID_CAMPAIGNS.includes(c))
  if (campaigns.length === 0) campaigns.push('idv_acsp')
  return { campaigns, reasons, confidence: 0.55 }
}

async function aiQualify(p: Prospect) {
  if (!LOVABLE_AI_KEY) return null
  const sys = `You qualify B2B prospects for DigiFormation Ltd.
Pick BEST campaigns from: ${VALID_CAMPAIGNS.join(', ')}.
Never recommend VAT. If has_website, NEVER include website_dev.
UK→idv_acsp/uk_formation/compliance/banking; restaurants/clinics/schools→ai_dashboard; marketplace sellers→banking; agencies→banking.
Return STRICT JSON: {"decision":"qualified|needs_review|rejected","campaigns":[],"primary":"","confidence":0.0,"notes":""}`
  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LOVABLE_AI_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: `Qualify:\n${JSON.stringify(p)}` },
        ],
      }),
    })
    if (!res.ok) return null
    const j = await res.json()
    const raw = j?.choices?.[0]?.message?.content
    if (!raw) return null
    const parsed = JSON.parse(raw)
    let campaigns = (Array.isArray(parsed.campaigns) ? parsed.campaigns : [])
      .map((c: any) => String(c)).filter((c: string) => VALID_CAMPAIGNS.includes(c))
    if (p.has_website) campaigns = campaigns.filter((c: string) => c !== 'website_dev')
    if (campaigns.length === 0) return null
    return {
      campaigns,
      primary: VALID_CAMPAIGNS.includes(parsed.primary) ? parsed.primary : campaigns[0],
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.6)),
      notes: String(parsed.notes || '').slice(0, 1200),
      decision: ['qualified','needs_review','rejected'].includes(parsed.decision) ? parsed.decision : 'qualified',
    }
  } catch { return null }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  const json = (b: any, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
  try {
    const { prospect_id } = await req.json()
    if (!prospect_id) return json({ error: 'prospect_id required' }, 400)
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
    const { data: p } = await supabase.from('email_prospects').select('*').eq('id', prospect_id).maybeSingle()
    if (!p) return json({ error: 'not found' }, 404)
    if (p.qualification_status !== 'pending') return json({ skipped: true, status: p.qualification_status })

    if (!p.contact_email) {
      await supabase.from('email_prospects').update({
        qualification_status: 'rejected',
        ai_notes: 'No contact email — cannot enroll.',
        last_qualified_at: new Date().toISOString(),
      }).eq('id', p.id)
      await supabase.from('prospect_timeline').insert({ prospect_id: p.id, event_type: 'rejected', title: 'Auto-rejected', detail: 'Missing contact email.' })
      return json({ ok: true, decision: 'rejected' })
    }

    const ai = await aiQualify(p)
    const fb = ruleBasedFallback(p)
    const campaigns = ai?.campaigns?.length ? ai.campaigns : fb.campaigns
    const primary = ai?.primary || campaigns[0]
    const confidence = ai?.confidence ?? fb.confidence
    const decision = ai?.decision || 'qualified'
    const notes = ai?.notes || `Auto-classified by rules. ${fb.reasons.join(' ') || 'Default UK IDV.'}`
    const finalCampaign = p.assigned_campaign || primary

    const now = new Date().toISOString()
    const patch: Record<string, any> = {
      qualification_status: decision,
      qualification_confidence: confidence,
      ai_notes: notes,
      recommended_campaigns: campaigns,
      qualified_at: p.qualified_at || now,
      last_qualified_at: now,
    }
    if (decision === 'qualified') {
      patch.assigned_campaign = finalCampaign
      patch.status = 'enrolled'
    } else if (decision === 'rejected') {
      patch.status = 'rejected'
    }
    await supabase.from('email_prospects').update(patch).eq('id', p.id)

    await supabase.from('prospect_timeline').insert({
      prospect_id: p.id,
      event_type: 'qualified',
      title: decision === 'qualified' ? 'Qualified by AI (instant)'
           : decision === 'rejected' ? 'Rejected by AI (instant)' : 'Needs review (instant)',
      detail: notes,
      payload: { confidence, decision, recommended_campaigns: campaigns, source: ai ? 'ai' : 'rules', instant: true },
    })
    if (decision === 'qualified') {
      await supabase.from('prospect_timeline').insert({
        prospect_id: p.id,
        event_type: 'campaign_selected',
        title: `Campaign selected: ${finalCampaign}`,
        detail: campaigns.length > 1 ? `Alternates: ${campaigns.filter((c: string) => c !== finalCampaign).join(', ')}` : null,
        payload: { campaign: finalCampaign, alternates: campaigns },
      })
    }
    return json({ ok: true, decision, campaign: decision === 'qualified' ? finalCampaign : null })
  } catch (e) {
    console.error('qualify-prospect-now error', e)
    return json({ ok: false, error: String(e) }, 500)
  }
})
