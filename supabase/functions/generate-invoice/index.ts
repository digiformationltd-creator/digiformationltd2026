// Generate an invoice PDF for a logged-in customer's order, store it in
// the private `invoices` bucket, create matching rows in client_orders +
// invoices, and return a short-lived signed URL the email can link to.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { jsPDF } from 'npm:jspdf@2.5.2'
import { LOGO_PNG_BASE64 } from './logo.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface Body {
  service: string
  packageName?: string
  amount_gbp: number
  currency?: 'GBP' | 'USD'
  customer: {
    full_name: string
    email: string
    address?: string
    whatsapp?: string
    address_line1?: string
    address_line2?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
  }
  notes?: string
  orderRef?: string
  /** Storage paths (relative to client-docs bucket) of uploaded documents.
   *  The function generates 7-day signed URLs and embeds them in the PDF. */
  documents?: { label: string; path: string; filename: string }[]
}

const SITE_NAME = 'Digiformation Ltd'
const SITE_ADDRESS = ''
const SITE_PHONE = '+44 7438 351454'
const SITE_PHONE_PK = '+92 316 4467464'
const SITE_EMAIL = 'info@digiformation.uk'
const SITE_WEB = 'www.digiformation.uk'
const INK: [number, number, number] = [20, 20, 20]
const SUB: [number, number, number] = [90, 90, 90]
const HEADER_BG: [number, number, number] = [240, 240, 240]
const DIVIDER: [number, number, number] = [220, 220, 220]
const ACCENT_DARK: [number, number, number] = [35, 38, 42]
const ACCENT_MID: [number, number, number] = [120, 124, 130]
const ACCENT_SOFT: [number, number, number] = [200, 204, 210]

function genRefs() {
  const stamp = Date.now().toString(36).toUpperCase()
  return {
    orderRef: `ORD-${stamp}`,
    invoiceNumber: `INV-${stamp}`,
  }
}

// Elegant grey/black top bar + thin accent rule
function drawHeaderBand(doc: jsPDF, W: number) {
  doc.setFillColor(...ACCENT_DARK)
  doc.rect(0, 0, W, 8, 'F')
  doc.setFillColor(...ACCENT_MID)
  doc.rect(0, 8, W, 2, 'F')
  doc.setFillColor(...ACCENT_SOFT)
  doc.rect(0, 10, W, 1, 'F')
}

// Matching footer band with subtle waves above for a polished close
function drawFooterBand(doc: jsPDF, W: number, H: number) {
  doc.setFillColor(...ACCENT_SOFT)
  doc.ellipse(W * 0.30, H - 30, W * 0.55, 50, 'F')
  doc.setFillColor(...ACCENT_MID)
  doc.ellipse(W * 0.82, H - 25, W * 0.40, 42, 'F')
  doc.setFillColor(...ACCENT_DARK)
  doc.rect(0, H - 10, W, 10, 'F')
}

function drawWatermark(doc: jsPDF, W: number, H: number) {
  doc.saveGraphicsState()
  // @ts-ignore
  const GState = (doc as any).GState
  if (GState) {
    // @ts-ignore
    doc.setGState(new GState({ opacity: 0.05 }))
  }
  // Smaller, subtle watermark — full brand name still legible
  doc.setFont('helvetica', 'bold').setFontSize(46).setTextColor(60, 60, 60)
  doc.text('DIGIFORMATION LTD', W / 2, H / 2, { align: 'center', angle: 30 })
  doc.restoreGraphicsState()
}

function buildPdf(opts: {
  invoiceNumber: string
  orderRef: string
  issueDate: string
  service: string
  packageName?: string
  amount: number
  currency: string
  customer: Body['customer']
  notes?: string
  documentLinks?: { label: string; url: string; filename: string }[]
}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const M = 48
  const sym = opts.currency === 'USD' ? '$' : '£'
  const fmt = (n: number) => `${sym}${n.toFixed(2)}`

  drawHeaderBand(doc, W)
  drawWatermark(doc, W, H)

  // ---- Header: large logo flush to top-left ----
  const LOGO_SIZE = 150
  const logoY = 24
  // Logo PNG has internal transparent padding; shift left so the visible
  // glyph aligns exactly with the "I" in INVOICE below.
  const LOGO_X = M - 18
  try {
    doc.addImage(`data:image/png;base64,${LOGO_PNG_BASE64}`, 'PNG', LOGO_X, logoY, LOGO_SIZE, LOGO_SIZE, undefined, 'FAST')
  } catch (_) {
    doc.setFont('helvetica', 'bold').setFontSize(18).setTextColor(...INK)
    doc.text('DIGIFORMATION', M, logoY + 40)
    doc.text('LTD', M, logoY + 62)
  }
  // Invoice number — top right
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...SUB)
  doc.text('INVOICE NO.', W - M, logoY + 28, { align: 'right' })
  doc.setFont('helvetica', 'bold').setFontSize(13).setTextColor(...INK)
  doc.text(opts.invoiceNumber, W - M, logoY + 46, { align: 'right' })

  // ---- Title ----
  doc.setFont('helvetica', 'bold').setFontSize(54).setTextColor(...ACCENT_DARK)
  doc.text('INVOICE', M, logoY + LOGO_SIZE + 50)
  // Accent rule under title
  doc.setDrawColor(...ACCENT_DARK).setLineWidth(2)
  doc.line(M, logoY + LOGO_SIZE + 58, M + 90, logoY + LOGO_SIZE + 58)

  let y = logoY + LOGO_SIZE + 90

  // Date
  doc.setFont('helvetica', 'bold').setFontSize(10.5).setTextColor(...INK)
  doc.text('Date:', M, y)
  doc.setFont('helvetica', 'normal').setTextColor(...SUB)
  doc.text(formatLongDate(opts.issueDate), M + 50, y)
  doc.setFont('helvetica', 'bold').setTextColor(...INK)
  doc.text('Order Ref:', W / 2 + 10, y)
  doc.setFont('helvetica', 'normal').setTextColor(...SUB)
  doc.text(opts.orderRef, W / 2 + 80, y)
  y += 30

  // Billed To / From
  const c = opts.customer
  const colR = W / 2 + 10
  doc.setFont('helvetica', 'bold').setFontSize(10.5).setTextColor(...ACCENT_DARK)
  doc.text('BILLED TO', M, y)
  doc.text('FROM', colR, y)
  doc.setDrawColor(...ACCENT_SOFT).setLineWidth(0.6)
  doc.line(M, y + 4, M + 60, y + 4)
  doc.line(colR, y + 4, colR + 40, y + 4)

  let ly = y + 18
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...SUB)
  doc.text(c.full_name || '—', M, ly); ly += 13
  if (c.email) { doc.text(c.email, M, ly); ly += 13 }
  if (c.whatsapp) { doc.text(`WhatsApp: ${c.whatsapp}`, M, ly); ly += 13 }
  const addrParts = [c.address_line1, c.address_line2, [c.city, c.state, c.postal_code].filter(Boolean).join(', '), c.country].filter(Boolean) as string[]
  const billedAddr = addrParts.length ? addrParts.join(', ') : (c.address || '')
  if (billedAddr) {
    const wrapped = doc.splitTextToSize(billedAddr, W / 2 - M - 20) as string[]
    for (const w of wrapped) { doc.text(w, M, ly); ly += 13 }
  }

  let ry = y + 18
  doc.text(SITE_NAME, colR, ry); ry += 13
  doc.text(SITE_WEB, colR, ry); ry += 13
  doc.text(SITE_EMAIL, colR, ry); ry += 13
  doc.text(`PK: ${SITE_PHONE_PK}`, colR, ry); ry += 13

  y = Math.max(ly, ry) + 24

  // Items table — dark header band, professional grey/black palette
  doc.setFillColor(...ACCENT_DARK)
  doc.rect(M, y, W - M * 2, 32, 'F')
  doc.setFont('helvetica', 'bold').setFontSize(10.5).setTextColor(255, 255, 255)
  const colItem = M + 14
  const colQty = W * 0.55
  const colPrice = W * 0.72
  const colAmt = W - M - 14
  doc.text('ITEM', colItem, y + 20)
  doc.text('QTY', colQty, y + 20, { align: 'center' })
  doc.text('PRICE', colPrice, y + 20, { align: 'center' })
  doc.text('AMOUNT', colAmt, y + 20, { align: 'right' })
  y += 32

  const desc = opts.packageName ? `${opts.service} — ${opts.packageName}` : opts.service
  const wrapped = doc.splitTextToSize(desc, (colQty - colItem) - 30) as string[]
  const rowH = Math.max(40, wrapped.length * 14 + 20)
  doc.setFont('helvetica', 'normal').setFontSize(10.5).setTextColor(...INK)
  doc.text(wrapped, colItem, y + 22)
  doc.text('1', colQty, y + 22, { align: 'center' })
  doc.text(fmt(opts.amount), colPrice, y + 22, { align: 'center' })
  doc.text(fmt(opts.amount), colAmt, y + 22, { align: 'right' })
  y += rowH

  doc.setDrawColor(...DIVIDER).setLineWidth(0.6).line(M, y, W - M, y)
  y += 16

  // Total bar
  doc.setFillColor(...HEADER_BG)
  doc.rect(W * 0.55 - 10, y - 6, W - M - (W * 0.55 - 10), 28, 'F')
  doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(...ACCENT_DARK)
  doc.text('TOTAL', colPrice, y + 12, { align: 'center' })
  doc.text(fmt(opts.amount), colAmt, y + 12, { align: 'right' })
  y += 40

  // Note — wider area, more room for long notes
  doc.setFont('helvetica', 'bold').setFontSize(10.5).setTextColor(...ACCENT_DARK)
  doc.text('NOTE', M, y)
  doc.setDrawColor(...ACCENT_SOFT).setLineWidth(0.6)
  doc.line(M, y + 4, M + 32, y + 4)
  y += 18
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...SUB)
  const note = (opts.notes && opts.notes.trim())
    ? opts.notes
    : `Thank you for choosing ${SITE_NAME}. Payment is due within 7 days of invoice date.`
  // Full-width note area, with line spacing and clipping just above the footer
  const noteMaxWidth = W - M * 2
  const noteLines = doc.splitTextToSize(note, noteMaxWidth) as string[]
  const noteBottomLimit = H - 180
  const lineHeight = 14
  let noteY = y
  for (const ln of noteLines) {
    if (noteY > noteBottomLimit) break
    doc.text(ln, M, noteY)
    noteY += lineHeight
  }
  y = noteY + 16

  // Signature
  const sigY = H - 130
  doc.setFont('times', 'italic').setFontSize(22).setTextColor(...ACCENT_DARK)
  doc.text('Digiformation', M, sigY)
  doc.setDrawColor(...ACCENT_DARK).setLineWidth(0.6).line(M, sigY + 6, M + 150, sigY + 6)
  doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...INK)
  doc.text(SITE_NAME, M, sigY + 20)
  doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...SUB)
  doc.text('Authorised Signatory', M, sigY + 32)

  drawFooterBand(doc, W, H)


  // Submitted documents page
  if (opts.documentLinks && opts.documentLinks.length > 0) {
    doc.addPage()
    drawHeaderBand(doc, W)
    drawWatermark(doc, W, H)
    let dy = M + 30
    doc.setFont('helvetica', 'bold').setFontSize(28).setTextColor(...ACCENT_DARK)
    doc.text('Submitted Documents', M, dy)
    dy += 26
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...SUB)
    doc.text(`Order Ref: ${opts.orderRef} — secure download links (valid for 7 days).`, M, dy)
    dy += 24

    for (const d of opts.documentLinks) {
      doc.setFillColor(...HEADER_BG)
      doc.rect(M, dy, W - M * 2, 60, 'F')
      doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(...INK)
      doc.text(d.label, M + 16, dy + 22)
      doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...SUB)
      doc.text(`File: ${d.filename}`, M + 16, dy + 38)
      doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(16, 100, 200)
      doc.textWithLink('▼ Download', W - M - 90, dy + 36, { url: d.url })
      dy += 72
      if (dy > H - 200) { doc.addPage(); drawHeaderBand(doc, W); drawWatermark(doc, W, H); dy = M + 30 }
    }
    drawFooterBand(doc, W, H)
  }

  return doc.output('arraybuffer') as ArrayBuffer
}

function formatLongDate(iso: string): string {
  // iso = YYYY-MM-DD
  const [y, m, d] = iso.split('-').map((s) => parseInt(s, 10))
  if (!y || !m || !d) return iso
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  return `${months[m - 1]} ${d}, ${y}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Auth is OPTIONAL — guests still get a PDF + signed URL for the email,
    // but only authenticated users get rows inserted into client_orders/invoices.
    const authHeader = req.headers.get('Authorization')
    let user: { id: string; email?: string } | null = null
    if (authHeader) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      })
      const { data: { user: u } } = await userClient.auth.getUser()
      if (u) user = { id: u.id, email: u.email ?? undefined }
    }

    const body = (await req.json()) as Body
    if (!body?.service || typeof body.amount_gbp !== 'number' || !body.customer?.email) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(supabaseUrl, serviceKey)
    const customerEmail = body.customer.email.trim().toLowerCase()
    let orderUserId: string | null = null
    const { data: matchedProfile } = await admin
      .from('profiles')
      .select('user_id')
      .ilike('email', customerEmail)
      .limit(1)
      .maybeSingle()
    if (matchedProfile?.user_id) {
      orderUserId = matchedProfile.user_id
    } else if (user?.id && user.email?.toLowerCase() === customerEmail) {
      orderUserId = user.id
    }

    // Soft price sanity check against the services catalog. The checkout
    // supports multi-item bundles and free-text service titles ("LTD ID
    // Verification" vs catalog "ID Verification"), so a strict equality
    // check here was rejecting EVERY real order with 400 "Unknown service"
    // / "Submitted amount does not match catalog price" — orders, invoices,
    // and confirmation emails all silently stopped. We now log mismatches
    // for auditing but never block legitimate checkouts. A coarse sanity
    // bound (£0–£100k) still prevents absurd tampering.
    // Server-side price validation against the services catalog.
    // SECURITY: never trust the client-submitted amount. Resolve the
    // catalog price by slug or name and reject hard mismatches; flag
    // soft mismatches (bundles / free-text titles) for admin review
    // via the `amount_mismatch` audit column.
    let amountMismatch = false
    {
      const submitted = Number(body.amount_gbp)
      if (!Number.isFinite(submitted) || submitted < 0 || submitted > 100000) {
        return new Response(JSON.stringify({ error: 'Invalid amount' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      try {
        const svcQuery = await admin
          .from('services')
          .select('price_gbp, slug, name')
          .or(`slug.eq.${body.service},name.ilike.${body.service}`)
          .limit(1)
          .maybeSingle()
        const catalog = svcQuery.data as { price_gbp: number; slug: string } | null
        if (catalog) {
          const catalogPrice = Number(catalog.price_gbp) || 0
          const delta = Math.abs(submitted - catalogPrice)
          // Reject blatant tampering on a known single-service catalog hit
          // (>50% deviation or zero amount on a paid service).
          if (catalogPrice > 0 && (submitted === 0 || delta / catalogPrice > 0.5)) {
            console.error('price tampering blocked', {
              service: body.service, submitted, catalogPrice,
            })
            return new Response(JSON.stringify({ error: 'Price validation failed' }), {
              status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }
          if (delta > 0.01) {
            amountMismatch = true
            console.warn('price mismatch flagged for admin review', {
              service: body.service, submitted, catalogPrice,
            })
          }
        } else {
          // Unknown service title (likely a multi-item bundle). Flag
          // for admin review but accept so legitimate checkouts succeed.
          amountMismatch = true
          console.warn('catalog miss — flagged for admin review', {
            service: body.service, submitted,
          })
        }
      } catch (e) {
        amountMismatch = true
        console.warn('catalog lookup failed — flagged', e)
      }
    }



    const generated = genRefs()
    const orderRef = body.orderRef && body.orderRef.trim() ? body.orderRef.trim() : generated.orderRef
    const invoiceNumber = generated.invoiceNumber
    const issueDate = new Date().toISOString().slice(0, 10)
    const currency = body.currency ?? 'GBP'

    // 1a. Sign URLs for any submitted client documents (passport / ID / selfie)
    //     so the team can download them straight from the PDF and email.
    //     SECURITY: only accept paths that live under this request's own
    //     submissions/{orderRef}/ folder (or the authenticated user's folder).
    //     This prevents callers from supplying arbitrary paths to read other
    //     users' documents from the private client-docs bucket.
    const documentLinks: { label: string; url: string; filename: string }[] = []
    const allowedPrefixes: string[] = [`submissions/${orderRef}/`]
    if (user?.id) allowedPrefixes.push(`${user.id}/`)
    if (Array.isArray(body.documents)) {
      for (const d of body.documents) {
        if (!d?.path || typeof d.path !== 'string') continue
        if (d.path.includes('..') || d.path.startsWith('/')) {
          console.warn('rejected suspicious doc path', d.path)
          continue
        }
        const allowed = allowedPrefixes.some((p) => d.path.startsWith(p))
        if (!allowed) {
          console.warn('rejected out-of-scope doc path', d.path)
          continue
        }
        const { data: ds, error: dsErr } = await admin.storage
          .from('client-docs')
          .createSignedUrl(d.path, 60 * 60 * 24 * 7)
        if (dsErr) {
          console.error('doc sign failed', d.path, dsErr)
          continue
        }
        documentLinks.push({ label: d.label, url: ds.signedUrl, filename: d.filename })
      }
    }

    // 1. Build PDF
    const pdfBytes = buildPdf({
      invoiceNumber, orderRef, issueDate,
      service: body.service,
      packageName: body.packageName,
      amount: body.amount_gbp,
      currency,
      customer: body.customer,
      notes: body.notes,
      documentLinks,
    })

    // 2. Upload to storage (under user folder if authed, else `guest/`)
    const folder = orderUserId ?? 'guest'
    const path = `${folder}/${invoiceNumber}.pdf`
    const { error: upErr } = await admin.storage.from('invoices').upload(
      path,
      new Uint8Array(pdfBytes),
      { contentType: 'application/pdf', upsert: true },
    )
    if (upErr) throw upErr

    // 3 & 4. Persist order + invoice rows. Authenticated users get user_id;
    // guests get user_id = NULL but customer details are stored on the order
    // itself so admins can identify and follow up.
    const { data: order, error: orderErr } = await admin
      .from('client_orders')
      .insert({
        user_id: orderUserId,
        order_ref: orderRef,
        service: body.packageName ? `${body.service} — ${body.packageName}` : body.service,
        amount_gbp: body.amount_gbp,
        status: 'Pending',
        customer_name: body.customer.full_name ?? null,
        customer_email: body.customer.email ?? null,
        customer_whatsapp: body.customer.whatsapp ?? null,
        notes: body.notes ?? null,
        amount_mismatch: amountMismatch,
        source: 'checkout',
        payment_status: 'unpaid',
      })
      .select('id')
      .single()
    if (orderErr) throw orderErr

    const { error: invErr } = await admin.from('invoices').insert({
      user_id: orderUserId,
      order_id: order.id,
      invoice_number: invoiceNumber,
      service_description: body.packageName ? `${body.service} — ${body.packageName}` : body.service,
      service_code: 'O',
      amount_gbp: body.amount_gbp,
      vat_rate: 0,
      vat_gbp: 0,
      total_gbp: body.amount_gbp,
      currency,
      status: 'Unpaid',
      bill_to_name: body.customer.full_name,
      bill_to_email: body.customer.email,
      bill_to_address: body.customer.address ?? null,
      pdf_url: path,
      notes: body.notes ?? null,
      amount_mismatch: amountMismatch,
    })
    if (invErr) throw invErr

    // 5. Signed download URL (7 days) — works for guests and authed users
    const { data: signed, error: sErr } = await admin.storage
      .from('invoices')
      .createSignedUrl(path, 60 * 60 * 24 * 7)
    if (sErr) throw sErr

    // 6. Auto-send the `invoice-issued` transactional email to the customer.
    //    Fire-and-forget: a delivery failure must NEVER break the checkout
    //    response, the order row, the invoice row, or the order-confirmation
    //    email that the caller still triggers separately.
    try {
      const resp = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
        },
        body: JSON.stringify({
          templateName: 'invoice-issued',
          recipientEmail: body.customer.email,
          idempotencyKey: `invoice-issued:${invoiceNumber}`,
          templateData: {
            customerName: body.customer.full_name,
            invoiceNumber,
            orderRef,
            service: body.packageName ? `${body.service} — ${body.packageName}` : body.service,
            amount: `${currency === 'USD' ? '$' : '£'}${Number(body.amount_gbp).toFixed(2)}`,
            invoiceUrl: signed.signedUrl,
          },
        }),
      })
      if (!resp.ok) {
        console.warn('invoice-issued email enqueue failed', resp.status, await resp.text())
      }
    } catch (e) {
      console.warn('invoice-issued email enqueue threw', e)
    }

    return new Response(JSON.stringify({
      orderRef,
      invoiceNumber,
      invoiceUrl: signed.signedUrl,
      documentLinks,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('generate-invoice error', e)
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
