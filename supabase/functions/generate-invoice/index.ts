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
const SITE_EMAIL = 'info@digiformation.uk'
const SITE_WEB = 'www.digiformation.uk'
const GREY_LIGHT: [number, number, number] = [232, 232, 232] // panels / row stripe
const GREY_MID: [number, number, number] = [180, 180, 180]   // decorative triangles
const INK: [number, number, number] = [20, 20, 20]            // headings / strong text
const MUTED: [number, number, number] = [100, 100, 100]       // secondary text

function genRefs() {
  const stamp = Date.now().toString(36).toUpperCase()
  return {
    orderRef: `ORD-${stamp}`,
    invoiceNumber: `INV-${stamp}`,
  }
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

  // ------- Decorative corner triangles (subtle grey + thin black accent) -------
  const drawCornerDecor = () => {
    doc.setFillColor(...GREY_MID)
    // Top-left chevron set
    doc.triangle(0, 0, 150, 0, 0, 110, 'F')
    doc.setFillColor(210, 210, 210)
    doc.triangle(60, 0, 230, 0, 60, 90, 'F')
    // Bottom-right chevron set
    doc.setFillColor(...GREY_MID)
    doc.triangle(W, H, W - 150, H, W, H - 110, 'F')
    doc.setFillColor(210, 210, 210)
    doc.triangle(W - 60, H, W - 230, H, W - 60, H - 90, 'F')
    // Thin black accent strokes
    doc.setDrawColor(20).setLineWidth(1.2)
    doc.line(0, 116, 130, 0)
    doc.line(W, H - 116, W - 130, H)
    doc.setLineWidth(0.2)
  }
  drawCornerDecor()

  // ------- Header: logo (left) + INVOICE (right) -------
  let y = M + 60
  try {
    // Logo width 130pt, height auto (square transparent PNG)
    doc.addImage(
      `data:image/png;base64,${LOGO_PNG_BASE64}`,
      'PNG', M, M + 8, 130, 130, undefined, 'FAST',
    )
  } catch (_) {
    doc.setFont('helvetica', 'bold').setFontSize(18).setTextColor(...INK)
    doc.text(SITE_NAME, M, y)
  }

  doc.setFont('helvetica', 'bold').setFontSize(40).setTextColor(...INK)
  doc.text('INVOICE', W - M, M + 70, { align: 'right' })

  y = M + 160

  // ------- Billed-to / Invoice meta panel (light grey) -------
  // Build the BILLED TO lines first so we can size the panel to fit.
  const c = opts.customer
  const billedLines: string[] = []
  if (c.email) billedLines.push(c.email)
  if (c.whatsapp) billedLines.push(`WhatsApp: ${c.whatsapp}`)
  if (c.address_line1) billedLines.push(c.address_line1)
  if (c.address_line2) billedLines.push(c.address_line2)
  const cityLine = [c.city, c.state, c.postal_code].filter(Boolean).join(', ')
  if (cityLine) billedLines.push(cityLine)
  if (c.country) billedLines.push(c.country)
  // Fallback: a single combined address string when fields aren't provided
  if (billedLines.length <= (c.email ? 1 : 0) && c.address) billedLines.push(c.address)

  const panelH = Math.max(110, 60 + billedLines.length * 14 + 16)
  doc.setFillColor(...GREY_LIGHT)
  doc.rect(M, y, W - M * 2, panelH, 'F')

  // BILLED TO (left)
  let py = y + 24
  doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...MUTED)
  doc.text('BILLED TO:', M + 18, py); py += 18
  doc.setFont('helvetica', 'bold').setFontSize(13).setTextColor(...INK)
  doc.text((c.full_name || '—').toUpperCase(), M + 18, py); py += 16
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(60)
  for (const line of billedLines) {
    const wrapped = doc.splitTextToSize(line, W / 2 - 60) as string[]
    for (const w of wrapped) { doc.text(w, M + 18, py); py += 14 }
  }

  // Invoice meta (right)
  const metaX = W / 2 + 20
  const metaVX = W - M - 18
  let my = y + 24
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(60)
  const metaRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'normal').setTextColor(60)
    doc.text(label, metaX, my)
    doc.setFont('helvetica', 'bold').setTextColor(...INK)
    doc.text(value, metaVX, my, { align: 'right' })
    my += 18
  }
  metaRow('Invoice No:', opts.invoiceNumber)
  metaRow('Order Ref:', opts.orderRef)
  metaRow('Invoice Date:', formatLongDate(opts.issueDate))
  metaRow('Due Date:', formatLongDate(opts.issueDate))

  y += panelH + 26

  // ------- Items table -------
  // Top + bottom hairlines like reference
  doc.setDrawColor(20).setLineWidth(1.2)
  doc.line(M, y, W - M, y)
  y += 4

  // Header row
  const colDescX = M + 14
  const colQtyX  = W * 0.50
  const colPriceX = W * 0.70
  const colTotalX = W - M - 14
  doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...INK)
  const headY = y + 22
  doc.text('DESCRIPTION', colDescX, headY)
  doc.text('QTY', colQtyX, headY, { align: 'center' })
  doc.text('PRICE', colPriceX, headY, { align: 'center' })
  doc.text('TOTAL', colTotalX, headY, { align: 'right' })
  y += 32
  doc.setLineWidth(1.2).line(M, y, W - M, y)
  doc.setLineWidth(0.2)
  y += 14

  // Item row(s) with alternating grey backgrounds
  const desc = opts.packageName
    ? `${opts.service} — ${opts.packageName}`
    : opts.service
  const wrapped = doc.splitTextToSize(desc, (colQtyX - colDescX) - 20)
  const rowH = Math.max(34, wrapped.length * 13 + 18)
  doc.setFillColor(...GREY_LIGHT)
  doc.rect(M, y, W - M * 2, rowH, 'F')
  doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...INK)
  doc.text(wrapped, colDescX, y + 20)
  doc.setFont('helvetica', 'normal').setTextColor(40)
  doc.text('1', colQtyX, y + 20, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.text(fmt(opts.amount), colPriceX, y + 20, { align: 'center' })
  doc.text(fmt(opts.amount), colTotalX, y + 20, { align: 'right' })
  y += rowH + 6

  doc.setDrawColor(20).setLineWidth(1.2).line(M, y, W - M, y)
  doc.setLineWidth(0.2)
  y += 24

  // ------- Terms (left) + Totals (right) -------
  const totalsX = W - M - 200
  const totalsVX = W - M - 14
  const termsW = totalsX - M - 24

  // Terms
  doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...INK)
  doc.text('TERMS & CONDITIONS:', M, y)
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(80)
  const terms = opts.notes && opts.notes.trim()
    ? opts.notes
    : 'Payment is due within 7 days of invoice date. All services are subject to the Digiformation Ltd standard terms of service. Late payments may delay order processing.'
  const termsLines = doc.splitTextToSize(terms, termsW)
  doc.text(termsLines, M, y + 18)

  // Totals
  let ty = y
  doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...INK)
  doc.text('Subtotal', totalsX, ty)
  doc.setFont('helvetica', 'normal')
  doc.text(fmt(opts.amount), totalsVX, ty, { align: 'right' })
  ty += 22
  doc.setFont('helvetica', 'bold')
  doc.text('Tax', totalsX, ty)
  doc.setFont('helvetica', 'normal')
  doc.text(fmt(0), totalsVX, ty, { align: 'right' })
  ty += 18
  // Total bar
  doc.setFillColor(...GREY_LIGHT)
  doc.rect(totalsX - 10, ty, (W - M) - (totalsX - 10), 28, 'F')
  doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(...INK)
  doc.text('Total', totalsX, ty + 18)
  doc.text(fmt(opts.amount), totalsVX, ty + 18, { align: 'right' })

  y = Math.max(y + 18 + termsLines.length * 12, ty + 28) + 30

  // ------- Signature -------
  doc.setFont('times', 'italic').setFontSize(22).setTextColor(...INK)
  doc.text('Digiformation', M, y)
  y += 8
  doc.setDrawColor(...INK).setLineWidth(0.6)
  doc.line(M, y, M + 160, y)
  y += 14
  doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...INK)
  doc.text(SITE_NAME, M, y)
  y += 22

  // ------- Bottom band: Payment Method | Contact -------
  const bandY = H - 180
  doc.setFillColor(...GREY_LIGHT)
  doc.rect(M, bandY, W - M * 2, 28, 'F')
  doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...INK)
  doc.text('PAYMENT METHOD:', M + 14, bandY + 18)
  doc.text('CONTACT:', W - M - 14, bandY + 18, { align: 'right' })

  const infoY = bandY + 44
  doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...INK)
  doc.text('Barclays Bank (GBP — Local transfer)', M + 14, infoY)
  doc.setFont('helvetica', 'normal').setTextColor(60)
  doc.text('Beneficiary: Muhammad Haroon', M + 14, infoY + 12)
  doc.text('Sort Code: 23-14-86', M + 14, infoY + 24)
  doc.text('Account No: 15737580', M + 14, infoY + 36)

  doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...INK)
  doc.text('Binance Pay (Crypto)', M + 14, infoY + 56)
  doc.setFont('helvetica', 'normal').setTextColor(60)
  doc.text('Account Title: Haroon-alhanfi', M + 14, infoY + 68)
  doc.text('Binance ID: 477888953', M + 14, infoY + 80)

  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(60)
  doc.text(SITE_PHONE, W - M - 14, infoY, { align: 'right' })
  doc.text(SITE_EMAIL, W - M - 14, infoY + 14, { align: 'right' })
  doc.text(SITE_WEB,   W - M - 14, infoY + 28, { align: 'right' })

  // ------- Thank you footer -------
  doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(...INK)
  doc.text('THANK YOU FOR YOUR BUSINESS', M, H - 28)

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

    // 1. Build PDF
    const pdfBytes = buildPdf({
      invoiceNumber, orderRef, issueDate,
      service: body.service,
      packageName: body.packageName,
      amount: body.amount_gbp,
      currency,
      customer: body.customer,
      notes: body.notes,
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

    // 3 & 4. For authenticated users, persist order + invoice rows so they
    // appear in the client's portal Invoices section. Guests get just the PDF.
    if (user) {
      const { data: order, error: orderErr } = await admin
        .from('client_orders')
        .insert({
          user_id: user.id,
          order_ref: orderRef,
          service: body.packageName ? `${body.service} — ${body.packageName}` : body.service,
          amount_gbp: body.amount_gbp,
          status: 'Pending',
        })
        .select('id')
        .single()
      if (orderErr) throw orderErr

      const { error: invErr } = await admin.from('invoices').insert({
        user_id: user.id,
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
      })
      if (invErr) throw invErr
    }

    // 5. Signed download URL (7 days) — works for guests and authed users
    const { data: signed, error: sErr } = await admin.storage
      .from('invoices')
      .createSignedUrl(path, 60 * 60 * 24 * 7)
    if (sErr) throw sErr

    return new Response(JSON.stringify({
      orderRef,
      invoiceNumber,
      invoiceUrl: signed.signedUrl,
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
