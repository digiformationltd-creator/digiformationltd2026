// Daily cron-driven scheduler: scans companies & addresses, sends reminder emails
// at fixed stages (30/21/14/3/1 days before due date). Idempotent via email_reminder_log.

import { createClient } from 'npm:@supabase/supabase-js@2.45.0'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Stages (days remaining). Tolerance window: send when daysRemaining <= stage AND > previous stage's threshold,
// but to be safe we just check "stage matches" within ±1 day window and rely on unique constraint to dedupe.
const STAGES: Array<{ stage: number; days: number }> = [
  { stage: 1, days: 30 },
  { stage: 2, days: 21 },
  { stage: 3, days: 14 },
  { stage: 4, days: 3 },
  { stage: 5, days: 1 },
]

type ReminderType = 'confirmation_statement' | 'annual_accounts' | 'address_expiry'

function daysBetween(today: Date, due: Date): number {
  const ms = due.getTime() - today.getTime()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

// Pick the highest-priority stage for which daysRemaining <= stage.days but no later stage applies.
// We send each stage exactly once per (target, due_date) thanks to the unique constraint.
// Daily run: send the stage matching today's "days remaining bucket".
function stageForDays(days: number): { stage: number; days: number } | null {
  // exact thresholds — when days remaining drops to or below a stage value, that stage fires.
  // To avoid sending multiple stages on the same day if a record was just added, we pick the
  // SMALLEST days-remaining stage that matches (most urgent applicable).
  const matches = STAGES.filter(s => days <= s.days)
  if (matches.length === 0) return null
  // most urgent (smallest days)
  return matches.reduce((a, b) => (a.days < b.days ? a : b))
}

function fmtAddress(a: any): string {
  return [a.address_line1, a.address_line2, a.city, a.county, a.postcode, a.country]
    .filter(Boolean).join(', ')
}

async function alreadySent(supabase: any, target_id: string, reminder_type: ReminderType, stage: number, due_date: string): Promise<boolean> {
  const { data } = await supabase
    .from('email_reminder_log')
    .select('id')
    .eq('target_id', target_id)
    .eq('reminder_type', reminder_type)
    .eq('stage', stage)
    .eq('due_date', due_date)
    .maybeSingle()
  return !!data
}

async function logSent(supabase: any, row: any) {
  await supabase.from('email_reminder_log').insert(row)
}

async function sendReminder(
  supabase: any,
  templateName: string,
  recipientEmail: string,
  templateData: Record<string, any>,
  idempotencyKey: string,
) {
  const { error } = await supabase.functions.invoke('send-transactional-email', {
    body: { templateName, recipientEmail, idempotencyKey, templateData },
  })
  if (error) console.error('send-transactional-email error', error)
  return !error
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const summary = { processed: 0, sent: 0, skipped: 0, errors: 0 }

  try {
    // Load profiles map (user_id -> {email, name})
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, email, full_name')
    const profileMap = new Map<string, { email: string; full_name: string | null }>()
    for (const p of profiles || []) {
      if (p.email) profileMap.set(p.user_id, { email: p.email, full_name: p.full_name })
    }

    // === COMPANIES: confirmation_statement + annual_accounts ===
    const { data: companies } = await supabase
      .from('client_company_details')
      .select('id, user_id, company_name, company_number, confirmation_due, accounts_filing_due')

    for (const c of companies || []) {
      const profile = profileMap.get(c.user_id)
      if (!profile) continue

      // Confirmation Statement
      if (c.confirmation_due) {
        const due = new Date(c.confirmation_due + 'T00:00:00Z')
        const days = daysBetween(today, due)
        const stage = stageForDays(days)
        if (stage && days >= 0) {
          summary.processed++
          const sent = await alreadySent(supabase, c.id, 'confirmation_statement', stage.stage, c.confirmation_due)
          if (sent) { summary.skipped++ } else {
            const ok = await sendReminder(
              supabase,
              'confirmation-statement-reminder',
              profile.email,
              {
                customerName: profile.full_name || 'Director',
                companyName: c.company_name,
                companyNumber: c.company_number,
                dueDate: c.confirmation_due,
                daysRemaining: days,
              },
              `cs-reminder-${c.id}-${c.confirmation_due}-s${stage.stage}`,
            )
            if (ok) {
              summary.sent++
              await logSent(supabase, {
                user_id: c.user_id, target_type: 'company', target_id: c.id,
                reminder_type: 'confirmation_statement', stage: stage.stage,
                due_date: c.confirmation_due, recipient_email: profile.email,
              })
            } else summary.errors++
          }
        }
      }

      // Annual Accounts
      if (c.accounts_filing_due) {
        const due = new Date(c.accounts_filing_due + 'T00:00:00Z')
        const days = daysBetween(today, due)
        const stage = stageForDays(days)
        if (stage && days >= 0) {
          summary.processed++
          const sent = await alreadySent(supabase, c.id, 'annual_accounts', stage.stage, c.accounts_filing_due)
          if (sent) { summary.skipped++ } else {
            const ok = await sendReminder(
              supabase,
              'annual-accounts-reminder',
              profile.email,
              {
                customerName: profile.full_name || 'Director',
                companyName: c.company_name,
                companyNumber: c.company_number,
                dueDate: c.accounts_filing_due,
                daysRemaining: days,
              },
              `aa-reminder-${c.id}-${c.accounts_filing_due}-s${stage.stage}`,
            )
            if (ok) {
              summary.sent++
              await logSent(supabase, {
                user_id: c.user_id, target_type: 'company', target_id: c.id,
                reminder_type: 'annual_accounts', stage: stage.stage,
                due_date: c.accounts_filing_due, recipient_email: profile.email,
              })
            } else summary.errors++
          }
        }
      }
    }

    // === ADDRESSES: expiry ===
    const { data: addresses } = await supabase
      .from('client_addresses')
      .select('id, user_id, expire_date, address_line1, address_line2, city, county, postcode, country, status')
      .eq('status', 'active')

    for (const a of addresses || []) {
      if (!a.expire_date) continue
      const profile = profileMap.get(a.user_id)
      if (!profile) continue
      const due = new Date(a.expire_date + 'T00:00:00Z')
      const days = daysBetween(today, due)
      const stage = stageForDays(days)
      if (!stage || days < 0) continue
      summary.processed++
      const sent = await alreadySent(supabase, a.id, 'address_expiry', stage.stage, a.expire_date)
      if (sent) { summary.skipped++; continue }
      const ok = await sendReminder(
        supabase,
        'address-renewal-reminder',
        profile.email,
        {
          customerName: profile.full_name || 'Customer',
          address: fmtAddress(a),
          expireDate: a.expire_date,
          daysRemaining: days,
        },
        `addr-reminder-${a.id}-${a.expire_date}-s${stage.stage}`,
      )
      if (ok) {
        summary.sent++
        await logSent(supabase, {
          user_id: a.user_id, target_type: 'address', target_id: a.id,
          reminder_type: 'address_expiry', stage: stage.stage,
          due_date: a.expire_date, recipient_email: profile.email,
        })
      } else summary.errors++
    }

    return new Response(JSON.stringify({ ok: true, summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('scheduler error', e)
    return new Response(JSON.stringify({ ok: false, error: String(e), summary }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
