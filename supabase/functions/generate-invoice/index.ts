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
const HEADER_BG: [number, number, number] = [225, 225, 225]
const DIVIDER: [number, number, number] = [215, 215, 215]
const WAVE_LIGHT: [number, number, number] = [205, 208, 212]
const WAVE_DARK: [number, number, number] = [70, 75, 82]

function genRefs() {
  const stamp = Date.now().toString(36).toUpperCase()
  return {
    orderRef: `ORD-${stamp}`,
    invoiceNumber: `INV-${stamp}`,
  }
}

function drawWaves(doc: jsPDF, W: number, H: number) {
  doc.setFillColor(...WAVE_LIGHT)
  doc.ellipse(W * 0.32, H + 30, W * 0.55, 110, 'F')
  doc.setFillColor(...WAVE_DARK)
  doc.ellipse(W * 0.85, H + 20, W * 0.45, 95, 'F')
  doc.setFillColor(...WAVE_LIGHT)
  doc.ellipse(W * 0.55, H + 50, W * 0.35, 70, 'F')
}

function drawWatermark(doc: jsPDF, W: number, H: number) {
  doc.saveGraphicsState()
  // @ts-ignore
  const GState = (doc as any).GState
  if (GState) {
    // @ts-ignore
    doc.setGState(new GState({ opacity: 0.07 }))
  }
  doc.setFont('helvetica', 'bold').setFontSize(78).setTextColor(40, 40, 40)
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
  const M = 56
  const sym = opts.currency === 'USD' ? '$' : '£'
  const fmt = (n: number) => `${sym}${n.toFixed(2)}`

  drawWatermark(doc, W, H)

  // ---- Header: Logo + Invoice No ----
  try {
    doc.addImage(`data:image/png;base64,${LOGO_PNG_BASE64}`, 'PNG', M, M, 64, 64, undefined, 'FAST')
  } catch (_) {
    doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...INK)
    doc.text('DIGIFORMATION', M, M + 20)
    doc.text('LTD', M, M + 34)
  }
  doc.setFont('helvetica', 'normal').setFontSize(11).setTextColor(...INK)
  doc.text(`NO. ${opts.invoiceNumber}`, W - M, M + 20, { align: 'right' })

  // ---- Title ----
  doc.setFont('helvetica', 'bold').setFontSize(58).setTextColor(...INK)
  doc.text('INVOICE', M, M + 160)

  let y = M + 220

  // Date
  doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...INK)
  doc.text('Date:', M, y)
  doc.setFont('helvetica', 'normal').setTextColor(...SUB)
  doc.text(formatLongDate(opts.issueDate), M + 50, y)
  doc.setFont('helvetica', 'bold').setTextColor(...INK)
  doc.text('Order Ref:', W / 2 + 10, y)
  doc.setFont('helvetica', 'normal').setTextColor(...SUB)
  doc.text(opts.orderRef, W / 2 + 80, y)
  y += 36

  // Billed To / From
  const c = opts.customer
  const colR = W / 2 + 10
  doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...INK)
  doc.text('Billed to:', M, y)
  doc.text('From:', colR, y)

  let ly = y + 16
  doc.setFont('helvetica', 'normal').setFontSize(10.5).setTextColor(...SUB)
  doc.text(c.full_name || '—', M, ly); ly += 14
  if (c.email) { doc.text(c.email, M, ly); ly += 14 }
  if (c.whatsapp) { doc.text(`WhatsApp: ${c.whatsapp}`, M, ly); ly += 14 }
  const addrParts = [c.address_line1, c.address_line2, [c.city, c.state, c.postal_code].filter(Boolean).join(', '), c.country].filter(Boolean) as string[]
  const billedAddr = addrParts.length ? addrParts.join(', ') : (c.address || '')
  if (billedAddr) {
    const wrapped = doc.splitTextToSize(billedAddr, W / 2 - M - 20) as string[]
    for (const w of wrapped) { doc.text(w, M, ly); ly += 14 }
  }

  let ry = y + 16
  doc.text(SITE_NAME, colR, ry); ry += 14
  doc.text(SITE_WEB, colR, ry); ry += 14
  doc.text(SITE_EMAIL, colR, ry); ry += 14
  doc.text(`UK: ${SITE_PHONE}`, colR, ry); ry += 14
  doc.text(`PK: ${SITE_PHONE_PK}`, colR, ry); ry += 14

  y = Math.max(ly, ry) + 24

  // Items table
  doc.setFillColor(...HEADER_BG)
  doc.rect(M, y, W - M * 2, 30, 'F')
  doc.setFont('helvetica', 'normal').setFontSize(11).setTextColor(...INK)
  const colItem = M + 14
  const colQty = W * 0.55
  const colPrice = W * 0.72
  const colAmt = W - M - 14
  doc.text('Item', colItem, y + 20)
  doc.text('Quantity', colQty, y + 20, { align: 'center' })
  doc.text('Price', colPrice, y + 20, { align: 'center' })
  doc.text('Amount', colAmt, y + 20, { align: 'right' })
  y += 30

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
  y += 18

  doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(...INK)
  doc.text('Total', colPrice, y + 4, { align: 'center' })
  doc.text(fmt(opts.amount), colAmt, y + 4, { align: 'right' })
  y += 32

  doc.setDrawColor(...DIVIDER).setLineWidth(0.6).line(M, y, W - M, y)
  y += 28

  // Payment + Note
  doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...INK)
  doc.text('Payment method:', M, y)
  doc.setFont('helvetica', 'normal').setTextColor(...SUB)
  doc.text('Bank Transfer / Binance Pay / NayaPay / JazzCash / EasyPaisa', M + 115, y)
  y += 18

  doc.setFont('helvetica', 'bold').setTextColor(...INK)
  doc.text('Note:', M, y)
  doc.setFont('helvetica', 'normal').setTextColor(...SUB)
  const note = (opts.notes && opts.notes.trim())
    ? opts.notes
    : `Thank you for choosing ${SITE_NAME}. Payment is due within 7 days of invoice date.`
  const noteLines = doc.splitTextToSize(note, W - M * 2 - 50) as string[]
  doc.text(noteLines, M + 42, y)
  y += noteLines.length * 14 + 22

  // Payment accounts (compact)
  if (y < H - 230) {
    doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...INK)
    doc.text('Payment Accounts', M, y)
    y += 14
    doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...SUB)
    doc.text('Barclays Bank (GBP — UK)  ·  Muhammad Haroon  ·  Sort 23-14-86  ·  Acc 15737580', M, y); y += 12
    doc.text('Binance Pay (Crypto)  ·  Haroon-alhanfi  ·  Binance ID 477888953', M, y); y += 12
    doc.text('Pakistan (PKR) — Muhammad Haroon  ·  NayaPay / JazzCash / EasyPaisa / FirstPay HBL  ·  0303 4226759', M, y); y += 12
  }

  // Signature
  const sigY = H - 160
  doc.setFont('times', 'italic').setFontSize(20).setTextColor(...INK)
  doc.text('Digiformation', M, sigY)
  doc.setDrawColor(...INK).setLineWidth(0.5).line(M, sigY + 6, M + 140, sigY + 6)
  doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...INK)
  doc.text(SITE_NAME, M, sigY + 20)

  drawWaves(doc, W, H)

  // Submitted documents page
  if (opts.documentLinks && opts.documentLinks.length > 0) {
    doc.addPage()
    drawWatermark(doc, W, H)
    let dy = M + 30
    doc.setFont('helvetica', 'bold').setFontSize(28).setTextColor(...INK)
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
      if (dy > H - 200) { doc.addPage(); drawWatermark(doc, W, H); dy = M + 30 }
    }
    drawWaves(doc, W, H)
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
    const generated = genRefs()
    const orderRef = body.orderRef && body.orderRef.trim() ? body.orderRef.trim() : generated.orderRef
    const invoiceNumber = generated.invoiceNumber
    const issueDate = new Date().toISOString().slice(0, 10)
    const currency = body.currency ?? 'GBP'

    // 1a. Sign URLs for any submitted client documents (passport / ID / selfie)
    //     so the team can download them straight from the PDF and email.
    const documentLinks: { label: string; url: string; filename: string }[] = []
    if (Array.isArray(body.documents)) {
      for (const d of body.documents) {
        if (!d?.path) continue
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
    const folder = user ? user.id : 'guest'
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
        user_id: user?.id ?? null,
        order_ref: orderRef,
        service: body.packageName ? `${body.service} — ${body.packageName}` : body.service,
        amount_gbp: body.amount_gbp,
        status: 'Pending',
        customer_name: body.customer.full_name ?? null,
        customer_email: body.customer.email ?? null,
        customer_whatsapp: body.customer.whatsapp ?? null,
        notes: body.notes ?? null,
      })
      .select('id')
      .single()
    if (orderErr) throw orderErr

    const { error: invErr } = await admin.from('invoices').insert({
      user_id: user?.id ?? null,
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
    })
    if (invErr) throw invErr

    // 5. Signed download URL (7 days) — works for guests and authed users
    const { data: signed, error: sErr } = await admin.storage
      .from('invoices')
      .createSignedUrl(path, 60 * 60 * 24 * 7)
    if (sErr) throw sErr

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
