// AI Campaign Orchestrator (Phase 2)
// Cron-driven. Reuses send-transactional-email + marketing-outreach template.
// Does NOT touch the email queue, scheduler, or any SYSTEM_OWNED_INTENTS.
//
// Flow per active run:
//   step=0 → send email #1 immediately, schedule step 2 in 3 days
//   step=1 → send email #2, schedule step 3 in 5 days
//   step=2 → send email #3, mark completed (no email #4)
//
// Daily caps:
//   - Max 3 NEW prospects enrolled per UTC day (across all campaigns).
//   - Existing follow-ups continue freely (only step=0→1 counts as "new").

import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const LOVABLE_AI_KEY = Deno.env.get('LOVABLE_API_KEY') || ''

const MAX_NEW_PER_DAY = 3
const STEP_DELAYS_DAYS = [3, 5] // after step 1 → +3d for step 2; after step 2 → +5d for step 3
const MODEL = 'google/gemini-3-flash-preview'

type Prospect = {
  id: string
  business_name: string
  contact_email: string | null
  contact_name: string | null
  website: string | null
  has_website: boolean
  business_type: string | null
  industry: string | null
  location: string | null
  country: string | null
  size_category: string | null
  notes: string | null
  status: string
  assigned_campaign: string | null
}

type Run = {
  id: string
  prospect_id: string
  campaign: string
  status: string
  current_step: number
  next_send_at: string | null
}

const CAMPAIGN_BRIEF: Record<string, { focus: string; angle: string; cta: string }> = {
  idv_acsp:     { focus: 'UK Identity Verification (ACSP)', angle: 'Pakistani founders forming UK companies need ACSP-verified ID; we handle it end-to-end in 24–48h.', cta: 'Worth a quick 10-minute call?' },
  uk_formation: { focus: 'UK Company Formation',            angle: 'We register UK LTDs for international founders with full compliance, banking introductions, and registered office.', cta: 'Happy to outline the process — interested?' },
  banking:      { focus: 'Business Banking',                angle: 'We help founders open business accounts (Wise, Payoneer, Sunrate, Ensave, TapTap Send) matched to their business model.', cta: 'Want a 2-line summary of the best fit?' },
  compliance:   { focus: 'UK Compliance',                   angle: 'Confirmation statements, annual accounts, PSC, director changes — handled with reminders so nothing is missed.', cta: 'Should I send a short compliance checklist?' },
  ai_dashboard: { focus: 'AI Business Dashboard',           angle: 'A single dashboard that tracks bookings, customers, marketing and operations using AI — built for SMEs like clinics, restaurants and schools.', cta: 'Want a 90-second walkthrough?' },
  website_dev:  { focus: 'Website Development',             angle: 'We build fast, conversion-focused business websites in days, not weeks.', cta: 'Want a free mock-up of your homepage?' },
}

function nextSendAtFor(stepJustSent: number): Date | null {
  // stepJustSent is 1, 2, or 3.
  // After step 1 → +3d; after step 2 → +5d; after step 3 → no more.
  if (stepJustSent === 1) return new Date(Date.now() + STEP_DELAYS_DAYS[0] * 86400000)
  if (stepJustSent === 2) return new Date(Date.now() + STEP_DELAYS_DAYS[1] * 86400000)
  return null
}

async function aiGenerateEmail(prospect: Prospect, campaign: string, step: number): Promise<{ subject: string; paragraphs: string[] } | null> {
  const brief = CAMPAIGN_BRIEF[campaign] || { focus: campaign, angle: '', cta: 'Worth a quick chat?' }
  const stepIntent =
    step === 1 ? 'First touch. Warm, human, specific. Reference their business by name. Keep it under 110 words. End with a soft question.'
    : step === 2 ? 'Follow-up #1 (after 3 days, no reply). Short. Add ONE concrete benefit they would care about. Keep it under 80 words.'
    :              'Final follow-up (after 5 more days). Short. Polite breakup tone. Make it easy to say "not now" or reply later. Under 70 words.'

  const sys = `You are an outreach assistant for DigiFormation Ltd, a UK business services firm.
Tone: human, founder-to-founder, professional, never spammy. UK English.
NEVER mention price, discounts, or VAT registration.
NEVER use marketing fluff ("revolutionary", "game-changing", "amazing").
NEVER use placeholders like [NAME] or {{var}} — write final copy.
Output STRICT JSON only: {"subject":"...", "paragraphs":["...","..."]}.
Use 2–3 short paragraphs. No greeting line (the template adds "Dear X,").`

  const ctx = {
    business_name: prospect.business_name,
    contact_name: prospect.contact_name || null,
    business_type: prospect.business_type || null,
    industry: prospect.industry || null,
    location: prospect.location || prospect.country || null,
    has_website: prospect.has_website,
    website: prospect.website || null,
    campaign_focus: brief.focus,
    campaign_angle: brief.angle,
    suggested_cta: brief.cta,
    step,
    intent: stepIntent,
  }

  if (!LOVABLE_AI_KEY) return null

  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Lovable-API-Key': LOVABLE_AI_KEY,
      },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: `Write the outreach email. Context JSON:\n${JSON.stringify(ctx, null, 2)}` },
        ],
      }),
    })
    if (!res.ok) {
      console.error('AI gateway error', res.status, await res.text())
      return null
    }
    const json = await res.json()
    const content = json?.choices?.[0]?.message?.content
    if (!content) return null
    const parsed = JSON.parse(content)
    if (!parsed?.subject || !Array.isArray(parsed?.paragraphs) || parsed.paragraphs.length === 0) return null
    return { subject: String(parsed.subject).slice(0, 140), paragraphs: parsed.paragraphs.map((p: any) => String(p)).slice(0, 5) }
  } catch (e) {
    console.error('AI generate failed', e)
    return null
  }
}

async function sendEmail(supabase: any, prospect: Prospect, subject: string, paragraphs: string[], run: Run, step: number): Promise<{ ok: boolean; messageId: string; error?: string }> {
  const greeting = (prospect.contact_name || prospect.business_name || 'there').split(' ')[0]
  const messageId = `outreach-${run.id}-${step}`
  const body = {
    template_name: 'marketing-outreach',
    recipient_email: prospect.contact_email,
    idempotency_key: messageId,
    trigger_source: 'automation',
    template_data: {
      greeting,
      heading: subject,
      preview: subject,
      paragraphs,
    },
    // Carry the dynamic subject into the registry's subject function:
    // (registry uses (d) => d.subject || default; templateData.subject works)
  }
  // The registry subject() reads from templateData, but send-transactional-email
  // passes templateData → subject(). We add subject to templateData too:
  ;(body.template_data as any).subject = subject

  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-transactional-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  if (!res.ok) {
    return { ok: false, messageId, error: `send-transactional-email ${res.status}: ${text.slice(0, 300)}` }
  }
  return { ok: true, messageId }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
  const summary = {
    processed: 0, sent: 0, completed: 0, failed: 0, skipped_reply: 0,
    new_enrolled: 0, daily_cap_remaining: 0, errors: [] as string[],
  }

  try {
    // 1) Count NEW enrollments today (UTC) — runs where current_step=0 → 1 happened today
    const todayStart = new Date(); todayStart.setUTCHours(0,0,0,0)
    const { count: newToday } = await supabase
      .from('prospect_campaign_runs')
      .select('id', { count: 'exact', head: true })
      .gte('started_at', todayStart.toISOString())
      .gt('current_step', 0)
    let remainingCap = Math.max(0, MAX_NEW_PER_DAY - (newToday ?? 0))
    summary.daily_cap_remaining = remainingCap

    // 2) Auto-create runs for newly enrolled prospects (status='enrolled', no run yet)
    if (remainingCap > 0) {
      const { data: enrolled } = await supabase
        .from('email_prospects')
        .select('id, assigned_campaign, contact_email, status')
        .eq('status', 'enrolled')
        .not('assigned_campaign', 'is', null)
        .not('contact_email', 'is', null)
        .limit(50)

      for (const p of (enrolled ?? [])) {
        // Skip if a run already exists (unique constraint enforces this)
        const { data: existing } = await supabase
          .from('prospect_campaign_runs').select('id').eq('prospect_id', p.id).maybeSingle()
        if (existing) continue
        await supabase.from('prospect_campaign_runs').insert({
          prospect_id: p.id,
          campaign: p.assigned_campaign,
          status: 'active',
          current_step: 0,
          next_send_at: new Date().toISOString(),
        })
      }
    }

    // 3) Fetch due active runs (next_send_at <= now), oldest first
    const { data: dueRuns, error: runErr } = await supabase
      .from('prospect_campaign_runs')
      .select('*')
      .eq('status', 'active')
      .lte('next_send_at', new Date().toISOString())
      .order('next_send_at', { ascending: true })
      .limit(40)
    if (runErr) throw runErr

    for (const run of (dueRuns ?? []) as Run[]) {
      summary.processed++

      // Re-check the prospect's live status — if they replied, stop.
      const { data: prospect } = await supabase
        .from('email_prospects').select('*').eq('id', run.prospect_id).maybeSingle()
      if (!prospect) {
        await supabase.from('prospect_campaign_runs').update({
          status: 'failed', last_error: 'prospect missing',
        }).eq('id', run.id)
        summary.failed++; continue
      }
      if (prospect.status === 'replied' || prospect.status === 'rejected') {
        await supabase.from('prospect_campaign_runs').update({
          status: prospect.status === 'replied' ? 'replied' : 'stopped',
          stopped_reason: `prospect status=${prospect.status}`,
          completed_at: new Date().toISOString(),
        }).eq('id', run.id)
        summary.skipped_reply++; continue
      }
      if (!prospect.contact_email) {
        await supabase.from('prospect_campaign_runs').update({
          status: 'failed', last_error: 'no contact_email',
        }).eq('id', run.id)
        summary.failed++; continue
      }

      // Enforce rule: website exists → never use website_dev
      if (run.campaign === 'website_dev' && prospect.has_website) {
        await supabase.from('prospect_campaign_runs').update({
          status: 'stopped', stopped_reason: 'has_website blocks website_dev',
          completed_at: new Date().toISOString(),
        }).eq('id', run.id)
        summary.failed++; continue
      }

      const stepToSend = run.current_step + 1 // 1..3
      if (stepToSend > 3) {
        await supabase.from('prospect_campaign_runs').update({
          status: 'completed', completed_at: new Date().toISOString(),
        }).eq('id', run.id)
        summary.completed++; continue
      }

      // Daily cap: only step 1 counts as a "new enrollment"
      if (stepToSend === 1) {
        if (remainingCap <= 0) {
          // Skip; try again on the next cron tick
          continue
        }
        remainingCap--
      }

      // Generate AI email
      const ai = await aiGenerateEmail(prospect as Prospect, run.campaign, stepToSend)
      if (!ai) {
        await supabase.from('prospect_campaign_runs').update({
          last_error: 'ai_generation_failed',
          next_send_at: new Date(Date.now() + 30 * 60_000).toISOString(), // retry in 30m
        }).eq('id', run.id)
        summary.failed++; continue
      }

      const send = await sendEmail(supabase, prospect as Prospect, ai.subject, ai.paragraphs, run, stepToSend)
      if (!send.ok) {
        await supabase.from('prospect_campaign_runs').update({
          last_error: send.error?.slice(0, 500) || 'send_failed',
          next_send_at: new Date(Date.now() + 60 * 60_000).toISOString(), // retry in 60m
        }).eq('id', run.id)
        summary.failed++; summary.errors.push(send.error?.slice(0,200) || ''); continue
      }

      // Advance the run
      const next = nextSendAtFor(stepToSend)
      const update: Record<string, unknown> = {
        current_step: stepToSend,
        last_message_id: send.messageId,
        last_subject: ai.subject,
        last_error: null,
      }
      if (next) {
        update.next_send_at = next.toISOString()
        update.status = 'active'
      } else {
        update.next_send_at = null
        update.status = 'completed'
        update.completed_at = new Date().toISOString()
        summary.completed++
      }
      await supabase.from('prospect_campaign_runs').update(update).eq('id', run.id)

      // Timeline: record this send
      await supabase.from('prospect_timeline').insert({
        prospect_id: prospect.id,
        event_type: `email_${stepToSend}`,
        title: `Email #${stepToSend} sent`,
        detail: ai.subject,
        payload: { campaign: run.campaign, message_id: send.messageId, subject: ai.subject },
      })
      if (!next) {
        await supabase.from('prospect_timeline').insert({
          prospect_id: prospect.id,
          event_type: 'completed',
          title: 'Sequence completed',
          detail: 'All 3 emails delivered, no reply.',
          payload: { campaign: run.campaign },
        })
      }

      // Mark prospect status if first send
      if (stepToSend === 1) {
        await supabase.from('email_prospects').update({ status: 'enrolled' }).eq('id', prospect.id)
        summary.new_enrolled++
      }
      summary.sent++
    }

    return new Response(JSON.stringify({ ok: true, summary }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('process-prospect-campaigns fatal', e)
    return new Response(JSON.stringify({ ok: false, error: String(e), summary }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
