// Generate an invoice PDF for a logged-in customer's order, store it in
// the private `invoices` bucket, create matching rows in client_orders +
// invoices, and return a short-lived signed URL the email can link to.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { jsPDF } from 'npm:jspdf@2.5.2'

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
  }
  notes?: string
}

const SITE_NAME = 'Digiformation Ltd'
const SITE_ADDRESS = 'United Kingdom'
const BRAND_COLOR: [number, number, number] = [16, 185, 129] // emerald-500

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
}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const M = 48
  let y = M

  // Header bar
  doc.setFillColor(...BRAND_COLOR)
  doc.rect(0, 0, W, 6, 'F')
  y += 12

  doc.setFont('helvetica', 'bold').setFontSize(22).setTextColor(20)
  doc.text(SITE_NAME, M, y + 16)
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(110)
  doc.text(SITE_ADDRESS, M, y + 32)
  doc.text('info@digiformation.uk', M, y + 46)

  doc.setFont('helvetica', 'bold').setFontSize(28).setTextColor(20)
  doc.text('INVOICE', W - M, y + 16, { align: 'right' })
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(110)
  doc.text(`No. ${opts.invoiceNumber}`, W - M, y + 32, { align: 'right' })
  doc.text(`Order ${opts.orderRef}`, W - M, y + 46, { align: 'right' })
  doc.text(`Date ${opts.issueDate}`, W - M, y + 60, { align: 'right' })

  y += 90
  doc.setDrawColor(230)
  doc.line(M, y, W - M, y)
  y += 20

  // Bill to
  doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(60)
  doc.text('BILL TO', M, y)
  y += 16
  doc.setFont('helvetica', 'normal').setFontSize(11).setTextColor(20)
  doc.text(opts.customer.full_name || '—', M, y); y += 14
  doc.text(opts.customer.email || '', M, y); y += 14
  if (opts.customer.address) { doc.text(opts.customer.address, M, y); y += 14 }
  y += 14

  // Items table header
  doc.setFillColor(245)
  doc.rect(M, y, W - M * 2, 26, 'F')
  doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(60)
  doc.text('DESCRIPTION', M + 12, y + 17)
  doc.text('AMOUNT', W - M - 12, y + 17, { align: 'right' })
  y += 26

  // Item row
  doc.setFont('helvetica', 'normal').setFontSize(11).setTextColor(20)
  const desc = opts.packageName
    ? `${opts.service} — ${opts.packageName}`
    : opts.service
  const wrapped = doc.splitTextToSize(desc, W - M * 2 - 130)
  doc.text(wrapped, M + 12, y + 18)
  const sym = opts.currency === 'USD' ? '$' : '£'
  doc.text(`${sym}${opts.amount.toFixed(2)}`, W - M - 12, y + 18, { align: 'right' })
  y += Math.max(36, wrapped.length * 14 + 18)

  doc.setDrawColor(230)
  doc.line(M, y, W - M, y)
  y += 20

  // Totals
  const labelX = W - M - 160
  const valueX = W - M - 12
  doc.setFont('helvetica', 'normal').setFontSize(11).setTextColor(80)
  doc.text('Subtotal', labelX, y); doc.text(`${sym}${opts.amount.toFixed(2)}`, valueX, y, { align: 'right' }); y += 16
  doc.text('VAT (0%)', labelX, y); doc.text(`${sym}0.00`, valueX, y, { align: 'right' }); y += 18
  doc.setFont('helvetica', 'bold').setFontSize(13).setTextColor(20)
  doc.text('Total Due', labelX, y); doc.text(`${sym}${opts.amount.toFixed(2)}`, valueX, y, { align: 'right' })
  y += 28

  // Status pill
  doc.setFillColor(254, 243, 199)
  doc.setTextColor(146, 64, 14)
  doc.roundedRect(M, y, 80, 22, 4, 4, 'F')
  doc.setFont('helvetica', 'bold').setFontSize(10)
  doc.text('UNPAID', M + 40, y + 15, { align: 'center' })
  y += 50

  if (opts.notes) {
    doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(60)
    doc.text('NOTES', M, y); y += 14
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(60)
    const n = doc.splitTextToSize(opts.notes, W - M * 2)
    doc.text(n, M, y)
    y += n.length * 13 + 8
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 40
  doc.setDrawColor(230)
  doc.line(M, footerY - 12, W - M, footerY - 12)
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(140)
  doc.text(
    `${SITE_NAME} • Thank you for your business. Our team will reach out within 24 hours to confirm payment.`,
    W / 2,
    footerY,
    { align: 'center' },
  )

  return doc.output('arraybuffer') as ArrayBuffer
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verify the caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userErr } = await userClient.auth.getUser()
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = (await req.json()) as Body
    if (!body?.service || typeof body.amount_gbp !== 'number' || !body.customer?.email) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(supabaseUrl, serviceKey)
    const { orderRef, invoiceNumber } = genRefs()
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

    // 2. Upload to storage
    const path = `${user.id}/${invoiceNumber}.pdf`
    const { error: upErr } = await admin.storage.from('invoices').upload(
      path,
      new Uint8Array(pdfBytes),
      { contentType: 'application/pdf', upsert: true },
    )
    if (upErr) throw upErr

    // 3. Insert order
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

    // 4. Insert invoice
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

    // 5. Signed download URL (7 days)
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
