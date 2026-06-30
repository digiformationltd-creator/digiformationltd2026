// Phase 3 — AI Qualifier + Auto Campaign Selector + Auto Enroller.
// Cron-driven. Processes prospects with qualification_status='pending'.
// Reuses email_prospects + prospect_campaign_runs + prospect_timeline.
// Does NOT touch the email queue, scheduler or SYSTEM_OWNED_INTENTS.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const LOVABLE_AI_KEY = Deno.env.get('LOVABLE_API_KEY') || ''
const MODEL = 'google/gemini-3-flash-preview'

type Prospect = Record<string, any>

const VALID_CAMPAIGNS = ['idv_acsp','uk_formation','banking','compliance','ai_dashboard','website_dev']

function ruleBasedFallback(p: Prospect): { campaigns: string[]; reasons: string[]; confidence: number } {
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

  if (!p.has_website) { set.add('website_dev'); reasons.push('No website detected → Website Development') }
  if (isUK) {
    set.add('idv_acsp'); set.add('uk_formation'); set.add('compliance'); set.add('banking')
    reasons.push('UK business → IDV, Formation, Compliance, Banking')
  }
  if (isRestaurant || isClinic || isSchool) {
    set.add('ai_dashboard'); reasons.push('Service vertical → AI Business Dashboard')
    if (!p.has_website) set.add('website_dev')
  }
  if (isMarketplace) { set.add('banking'); reasons.push('Marketplace seller → Banking (Sunrate)') }
  if (isAgency) { set.add('banking'); reasons.push('Agency/Freelancer → Banking (Ensave / TapTap Send)') }

  // Strip conflicts
  if (p.has_website) set.delete('website_dev')
  // Never recommend VAT — not in enum anyway.

  const campaigns = [...set].filter((c) => VALID_CAMPAIGNS.includes(c))
  if (campaigns.length === 0) campaigns.push('idv_acsp') // safest default
  return { campaigns, reasons, confidence: 0.55 }
}

async function aiQualify(p: Prospect): Promise<{
  campaigns: string[]
  primary: string
  confidence: number
  notes: string
  decision: 'qualified' | 'needs_review' | 'rejected'
} | null> {
  if (!LOVABLE_AI_KEY) return null
  const sys = `You qualify B2B prospects for DigiFormation Ltd (UK business-services firm).
Tasks:
1) Decide if the prospect is qualified for outreach. Reject only if clearly inappropriate (consumer, competitor, spam, missing email).
2) Pick the BEST campaigns from this fixed set ONLY: ${VALID_CAMPAIGNS.join(', ')}.
3) Never recommend VAT registration.
4) If they already have a website, NEVER include website_dev.
5) Apply rules: UK business → idv_acsp/uk_formation/compliance/banking; Restaurants/Clinics/Schools → ai_dashboard + website (if missing); Marketplace seller (Amazon/eBay/Etsy/Shopify/WooCommerce/Walmart) → banking; Agency/Freelancer (SEO/Marketing/Dev) → banking.
6) Write a SHORT internal note (2 sentences, no greeting) explaining what the business is and why these campaigns fit.
7) Confidence is 0–1.
Return STRICT JSON:
{"decision":"qualified"|"needs_review"|"rejected","campaigns":["..."],"primary":"...","confidence":0.0,"notes":"..."}`

  const ctx = {
    business_name: p.business_name,
    contact_email: p.contact_email,
    business_type: p.business_type,
    industry: p.industry,
    location: p.location,
    country: p.country,
    website: p.website,
    has_website: p.has_website,
    size_category: p.size_category,
    is_existing_customer: p.is_existing_customer,
    notes: p.notes,
  }

  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LOVABLE_AI_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: `Qualify this prospect:\n${JSON.stringify(ctx, null, 2)}` },
        ],
      }),
    })
    if (!res.ok) { console.error('AI gateway', res.status, await res.text()); return null }
    const json = await res.json()
    const raw = json?.choices?.[0]?.message?.content
    if (!raw) return null
    const parsed = JSON.parse(raw)
    let campaigns = (Array.isArray(parsed.campaigns) ? parsed.campaigns : [])
      .map((c: any) => String(c))
      .filter((c: string) => VALID_CAMPAIGNS.includes(c))
    // Safety rules
    if (p.has_website) campaigns = campaigns.filter((c: string) => c !== 'website_dev')
    if (campaigns.length === 0) return null
    const primary = VALID_CAMPAIGNS.includes(parsed.primary) ? parsed.primary : campaigns[0]
    return {
      campaigns,
      primary,
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.6)),
      notes: String(parsed.notes || '').slice(0, 1200),
      decision: ['qualified','needs_review','rejected'].includes(parsed.decision) ? parsed.decision : 'qualified',
    }
  } catch (e) { console.error('AI parse failed', e); return null }
}

async function addTimeline(supabase: any, prospectId: string, event_type: string, title: string, detail?: string, payload: any = {}) {
  await supabase.from('prospect_timeline').insert({
    prospect_id: prospectId, event_type, title, detail: detail ?? null, payload,
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
  const summary = { processed: 0, qualified: 0, needs_review: 0, rejected: 0, enrolled: 0, errors: [] as string[] }

  try {
    const { data: pending } = await supabase
      .from('email_prospects')
      .select('*')
      .eq('qualification_status', 'pending')
      .order('created_at', { ascending: true })
      .limit(25)

    for (const p of (pending ?? []) as Prospect[]) {
      summary.processed++
      try {
        // Hard reject if no email
        if (!p.contact_email) {
          await supabase.from('email_prospects').update({
            qualification_status: 'rejected',
            ai_notes: 'No contact email — cannot enroll.',
            last_qualified_at: new Date().toISOString(),
          }).eq('id', p.id)
          await addTimeline(supabase, p.id, 'rejected', 'Auto-rejected', 'Missing contact email.')
          summary.rejected++
          continue
        }

        const ai = await aiQualify(p)
        const fallback = ruleBasedFallback(p)
        const campaigns = ai?.campaigns?.length ? ai.campaigns : fallback.campaigns
        const primary   = ai?.primary || campaigns[0]
        const confidence = ai?.confidence ?? fallback.confidence
        const decision  = ai?.decision || 'qualified'
        const notes     = ai?.notes
          || `Auto-classified by rules. ${fallback.reasons.join(' ') || 'No strong signals — defaulting to UK IDV.'}`

        // Manual override protection: if admin already assigned a campaign, keep it.
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
          patch.status = 'enrolled' // auto-enroll → orchestrator will pick up
        } else if (decision === 'rejected') {
          patch.status = 'rejected'
        }

        const { error: upErr } = await supabase.from('email_prospects').update(patch).eq('id', p.id)
        if (upErr) throw upErr

        await addTimeline(supabase, p.id, 'qualified',
          decision === 'qualified' ? 'Qualified by AI'
          : decision === 'rejected' ? 'Rejected by AI'
          : 'Needs review',
          notes,
          { confidence, decision, recommended_campaigns: campaigns, source: ai ? 'ai' : 'rules' })

        if (decision === 'qualified') {
          await addTimeline(supabase, p.id, 'campaign_selected',
            `Campaign selected: ${finalCampaign}`,
            campaigns.length > 1 ? `Alternates: ${campaigns.filter((c) => c !== finalCampaign).join(', ')}` : undefined,
            { campaign: finalCampaign, alternates: campaigns })
          summary.qualified++; summary.enrolled++
        } else if (decision === 'needs_review') summary.needs_review++
        else summary.rejected++
      } catch (e) {
        console.error('qualify failed for', p.id, e)
        summary.errors.push(`${p.id}: ${String(e).slice(0, 200)}`)
        await supabase.from('email_prospects').update({
          qualification_status: 'needs_review',
          ai_notes: `Qualification error: ${String(e).slice(0, 300)}`,
        }).eq('id', p.id)
      }
    }

    return new Response(JSON.stringify({ ok: true, summary }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('qualify-prospects fatal', e)
    return new Response(JSON.stringify({ ok: false, error: String(e), summary }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
