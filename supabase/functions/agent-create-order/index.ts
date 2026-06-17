// agent-create-order
// ------------------------------------------------------------------
// Server-to-server endpoint used by the self-hosted DigiFormation AI
// Order Submission Agent (Odysseus). It validates the request, uploads
// any base64 documents to the private `client-docs` bucket, then delegates
// order + invoice creation to the existing `generate-invoice` function so
// all idempotency, price validation, lead capture, and email-sending
// behavior stays in one place.
//
// AUTH:
//   - X-Agent-API-Key: must equal ORDER_AGENT_API_KEY (required).
//   - X-Agent-Signature: optional HMAC-SHA256 hex of the raw request
//     body, computed with AGENT_WEBHOOK_SECRET. When AGENT_WEBHOOK_SECRET
//     is configured, the header is REQUIRED and verified.
//
// LIMITS / SAFETY:
//   - Orders >= £500, missing KYC docs, amount mismatch flag, or country
//     in FATF high-risk list → response.status = "Awaiting Admin Review"
//     and the order is updated to that status server-side.
//   - Service role key is only used inside this function (never returned).
//   - Every call is recorded in agent_audit_log.
// ------------------------------------------------------------------

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-agent-api-key, x-agent-signature, x-request-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// FATF "Call for Action" + "Increased Monitoring" jurisdictions (ISO-3166 alpha-2).
// Used to flag orders for human review. Keep narrow and well-documented.
const HIGH_RISK_COUNTRIES = new Set([
  'KP', 'IR', 'MM', // call for action
  'AL', 'BB', 'BF', 'KH', 'KY', 'CD', 'GI', 'HT', 'JM', 'JO',
  'ML', 'MZ', 'NI', 'PA', 'PH', 'SN', 'SS', 'SY', 'TR', 'UG',
  'AE', 'YE',
])

const HUMAN_REVIEW_AMOUNT_THRESHOLD = 500 // GBP

interface AgentDocument {
  label: string
  filename: string
  /** Existing storage path (relative to client-docs bucket). Preferred. */
  path?: string
  /** Raw base64-encoded file content (no data: prefix). */
  base64?: string
  /** Optional MIME type for base64 uploads. */
  contentType?: string
}

interface AgentRequestBody {
  service_slug: string
  package_name?: string
  amount_gbp: number
  currency?: 'GBP' | 'USD'
  checkout_request_id: string
  customer: {
    full_name: string
    email: string
    whatsapp?: string
    whatsapp_e164?: string
    country?: string
    address_line1?: string
    address_line2?: string
    city?: string
    state?: string
    postal_code?: string
  }
  order?: {
    notes?: string
    details?: { label: string; value: string }[]
    kyc_verified?: boolean
  }
  documents?: AgentDocument[]
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
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

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

function base64ToBytes(b64: string): Uint8Array {
  const cleaned = b64.replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '')
  const bin = atob(cleaned)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'file.bin'
}

function validateBody(body: any): { ok: true; data: AgentRequestBody } | { ok: false; error: string; missing: string[] } {
  const missing: string[] = []
  if (!body || typeof body !== 'object') return { ok: false, error: 'Body must be a JSON object', missing: ['body'] }
  if (!body.service_slug || typeof body.service_slug !== 'string') missing.push('service_slug')
  if (!body.checkout_request_id || typeof body.checkout_request_id !== 'string') missing.push('checkout_request_id')
  if (typeof body.amount_gbp !== 'number' || !Number.isFinite(body.amount_gbp) || body.amount_gbp < 0) missing.push('amount_gbp')
  const c = body.customer
  if (!c || typeof c !== 'object') missing.push('customer')
  else {
    if (!c.full_name || typeof c.full_name !== 'string') missing.push('customer.full_name')
    if (!c.email || typeof c.email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email)) missing.push('customer.email')
  }
  if (missing.length) return { ok: false, error: 'Missing or invalid required fields', missing }
  return { ok: true, data: body as AgentRequestBody }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const agentApiKey = Deno.env.get('ORDER_AGENT_API_KEY')
  const webhookSecret = Deno.env.get('AGENT_WEBHOOK_SECRET') // optional

  const admin = createClient(supabaseUrl, serviceKey)

  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? null
  const userAgent = req.headers.get('user-agent') ?? null
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID()

  const audit = async (entry: Record<string, unknown>) => {
    try {
      await admin.from('agent_audit_log').insert({
        agent_name: 'odysseus',
        request_id: requestId,
        ip_address: ipAddress,
        user_agent: userAgent,
        ...entry,
      })
    } catch (e) {
      console.error('[agent-create-order] audit insert failed', e)
    }
  }

  // ---------- Auth ----------
  if (!agentApiKey) {
    return jsonResponse({ error: 'Server misconfigured: ORDER_AGENT_API_KEY not set' }, 500)
  }
  const presentedKey = req.headers.get('x-agent-api-key') ?? ''
  if (!constantTimeEqual(presentedKey, agentApiKey)) {
    await audit({ action: 'create_order', status: 'auth_failed', error_message: 'Invalid X-Agent-API-Key' })
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  // ---------- Read raw body for HMAC + JSON parsing ----------
  const rawBody = await req.text()
  if (webhookSecret) {
    const presentedSig = (req.headers.get('x-agent-signature') ?? '').toLowerCase().replace(/^sha256=/, '')
    const expectedSig = await hmacSha256Hex(webhookSecret, rawBody)
    if (!presentedSig || !constantTimeEqual(presentedSig, expectedSig)) {
      await audit({ action: 'create_order', status: 'auth_failed', error_message: 'Invalid HMAC signature' })
      return jsonResponse({ error: 'Invalid signature' }, 401)
    }
  }

  let parsed: any
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    await audit({ action: 'create_order', status: 'bad_request', error_message: 'Body is not valid JSON' })
    return jsonResponse({ error: 'Body is not valid JSON' }, 400)
  }

  const validation = validateBody(parsed)
  if (!validation.ok) {
    await audit({
      action: 'create_order',
      status: 'validation_failed',
      checkout_request_id: parsed?.checkout_request_id ?? null,
      customer_email: parsed?.customer?.email ?? null,
      service_slug: parsed?.service_slug ?? null,
      amount_gbp: typeof parsed?.amount_gbp === 'number' ? parsed.amount_gbp : null,
      request_payload: parsed,
      error_message: validation.error,
      flags: validation.missing,
    })
    return jsonResponse({ error: validation.error, missing: validation.missing }, 400)
  }
  const body = validation.data

  // ---------- Catalog lookup (price sanity + canonical service name) ----------
  const { data: catalogRow } = await admin
    .from('services')
    .select('slug, name, price_gbp')
    .eq('slug', body.service_slug)
    .maybeSingle()

  if (!catalogRow) {
    await audit({
      action: 'create_order',
      status: 'unknown_service',
      checkout_request_id: body.checkout_request_id,
      customer_email: body.customer.email,
      service_slug: body.service_slug,
      amount_gbp: body.amount_gbp,
      request_payload: body,
      error_message: `Unknown service slug: ${body.service_slug}`,
    })
    return jsonResponse({ error: 'Unknown service_slug', service_slug: body.service_slug }, 400)
  }

  const catalogPrice = Number(catalogRow.price_gbp) || 0
  const submitted = Number(body.amount_gbp)
  const amountDelta = catalogPrice > 0 ? Math.abs(submitted - catalogPrice) / catalogPrice : 0
  const amountMismatch = catalogPrice > 0 && amountDelta > 0.01

  // ---------- Flags for human-in-the-loop review ----------
  const flags: string[] = []
  const countryCode = (body.customer.country ?? '').toUpperCase().slice(0, 2)
  if (countryCode && HIGH_RISK_COUNTRIES.has(countryCode)) flags.push('high_risk_country')
  if (submitted >= HUMAN_REVIEW_AMOUNT_THRESHOLD) flags.push('high_value')
  if (amountMismatch) flags.push('amount_mismatch')
  if (body.order?.kyc_verified === false) flags.push('missing_kyc')
  if (!body.documents || body.documents.length === 0) {
    // KYC docs are required for company-formation services
    const kycRequired = /ltd|llc|formation|incorporation|company/i.test(catalogRow.name)
    if (kycRequired) flags.push('missing_kyc')
  }

  const requiresHumanReview = flags.length > 0

  // ---------- Upload base64 documents to client-docs bucket ----------
  // Path template: submissions/{order_ref-placeholder}/{timestamp}-{filename}
  // We don't know order_ref yet (generate-invoice creates it), so we use
  // checkout_request_id as the folder discriminator. generate-invoice
  // accepts paths under submissions/{orderRef}/ — for agent submissions we
  // pass the agent-side checkout_request_id which doubles as the folder key.
  const docFolder = `submissions/agent-${body.checkout_request_id}`
  const uploadedDocs: { label: string; path: string; filename: string }[] = []

  if (Array.isArray(body.documents)) {
    for (const d of body.documents) {
      if (!d || typeof d !== 'object') continue
      try {
        if (d.path) {
          // Already in storage — pass through (generate-invoice will sign it)
          if (d.path.includes('..') || d.path.startsWith('/')) {
            console.warn('[agent-create-order] rejected suspicious path', d.path)
            continue
          }
          uploadedDocs.push({ label: d.label || 'Document', path: d.path, filename: d.filename || 'document' })
        } else if (d.base64) {
          const bytes = base64ToBytes(d.base64)
          if (bytes.byteLength > 20 * 1024 * 1024) {
            console.warn('[agent-create-order] rejected oversize doc', d.filename, bytes.byteLength)
            continue
          }
          const fname = safeFilename(d.filename || 'document.bin')
          const path = `${docFolder}/${Date.now()}-${fname}`
          const { error: upErr } = await admin.storage
            .from('client-docs')
            .upload(path, bytes, {
              contentType: d.contentType || 'application/octet-stream',
              upsert: false,
            })
          if (upErr) {
            console.error('[agent-create-order] doc upload failed', fname, upErr)
            continue
          }
          uploadedDocs.push({ label: d.label || 'Document', path, filename: fname })
        }
      } catch (e) {
        console.error('[agent-create-order] doc processing error', e)
      }
    }
  }

  // ---------- Build canonical orderRef so generate-invoice accepts the doc paths ----------
  // generate-invoice only allows doc paths under submissions/{orderRef}/. We
  // pass orderRef = `agent-${checkout_request_id}` so the prefix lines up.
  const orderRef = `agent-${body.checkout_request_id}`

  // ---------- Delegate to generate-invoice ----------
  const invoicePayload = {
    service: catalogRow.name,
    packageName: body.package_name,
    amount_gbp: submitted,
    currency: body.currency ?? 'GBP',
    customer: {
      full_name: body.customer.full_name,
      email: body.customer.email,
      whatsapp: body.customer.whatsapp,
      whatsapp_e164: body.customer.whatsapp_e164,
      address_line1: body.customer.address_line1,
      address_line2: body.customer.address_line2,
      city: body.customer.city,
      state: body.customer.state,
      postal_code: body.customer.postal_code,
      country: body.customer.country,
    },
    notes: body.order?.notes,
    orderRef,
    checkout_request_id: body.checkout_request_id,
    details: body.order?.details ?? [],
    documents: uploadedDocs,
  }

  let invoiceResp: Response
  try {
    invoiceResp = await fetch(`${supabaseUrl}/functions/v1/generate-invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
      body: JSON.stringify(invoicePayload),
    })
  } catch (e) {
    const msg = (e as Error).message
    await audit({
      action: 'create_order',
      status: 'invoice_fetch_failed',
      checkout_request_id: body.checkout_request_id,
      customer_email: body.customer.email,
      service_slug: body.service_slug,
      amount_gbp: submitted,
      flags,
      request_payload: body,
      error_message: msg,
    })
    return jsonResponse({ error: 'Invoice generation transport failed', detail: msg }, 502)
  }

  const invoiceJson = await invoiceResp.json().catch(() => ({}))
  if (!invoiceResp.ok) {
    await audit({
      action: 'create_order',
      status: 'invoice_failed',
      checkout_request_id: body.checkout_request_id,
      customer_email: body.customer.email,
      service_slug: body.service_slug,
      amount_gbp: submitted,
      flags,
      request_payload: body,
      response_payload: invoiceJson,
      error_message: invoiceJson?.error ?? `HTTP ${invoiceResp.status}`,
    })
    return jsonResponse(
      { error: invoiceJson?.error ?? 'Invoice generation failed', status: invoiceResp.status },
      502,
    )
  }

  // ---------- Look up created order id + apply human-review status ----------
  const createdOrderRef = invoiceJson.orderRef as string
  const { data: createdOrder } = await admin
    .from('client_orders')
    .select('id, status')
    .eq('order_ref', createdOrderRef)
    .maybeSingle()

  let finalStatus = createdOrder?.status ?? 'Pending'
  if (createdOrder && requiresHumanReview) {
    finalStatus = 'Awaiting Admin Review'
    await admin
      .from('client_orders')
      .update({
        status: finalStatus,
        notes:
          (body.order?.notes ? body.order.notes + '\n\n' : '') +
          `[Agent] Flagged for review: ${flags.join(', ')}`,
      })
      .eq('id', createdOrder.id)
  }

  const responseBody = {
    ok: true,
    order_id: createdOrder?.id ?? null,
    order_ref: createdOrderRef,
    invoice_id: null as string | null, // invoices table doesn't return id from generate-invoice
    invoice_number: invoiceJson.invoiceNumber ?? null,
    pdf_signed_url: invoiceJson.invoiceUrl ?? null,
    documents: invoiceJson.documentLinks ?? [],
    status: finalStatus,
    flags,
    deduped: invoiceJson.deduped === true,
    request_id: requestId,
  }

  // Fetch invoice_id for completeness
  if (createdOrder?.id) {
    const { data: inv } = await admin
      .from('invoices')
      .select('id')
      .eq('order_id', createdOrder.id)
      .maybeSingle()
    responseBody.invoice_id = inv?.id ?? null
  }

  await audit({
    action: 'create_order',
    status: requiresHumanReview ? 'created_pending_review' : 'created',
    checkout_request_id: body.checkout_request_id,
    order_id: createdOrder?.id ?? null,
    order_ref: createdOrderRef,
    invoice_number: invoiceJson.invoiceNumber ?? null,
    customer_email: body.customer.email,
    service_slug: body.service_slug,
    amount_gbp: submitted,
    flags,
    request_payload: body,
    response_payload: responseBody,
  })

  return jsonResponse(responseBody, 200)
})
