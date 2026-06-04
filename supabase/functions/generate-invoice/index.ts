// Generate an invoice PDF for a logged-in customer's order, store it in
// the private `invoices` bucket, create matching rows in client_orders +
// invoices, and return a short-lived signed URL the email can link to.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { jsPDF } from 'npm:jspdf@2.5.2'
import { LOGO_PNG_BASE64 } from './logo.ts'
import { normalizePhoneToE164 } from '../_shared/phone.ts'

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
    whatsapp_e164?: string
    address_line1?: string
    address_line2?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
  }
  notes?: string
  orderRef?: string
  /** Flat list of every field the customer filled in on the checkout form.
   *  Rendered as a structured "Customer & Order Details" page on the invoice. */
  details?: { label: string; value: string }[]
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

// Header: mirrored version of the footer — overlapping soft-grey and
// dark-navy curves arching down from the top edge.
function drawHeaderBand(doc: jsPDF, W: number) {
  // Dark navy curve on the right, peeking out from behind
  doc.setFillColor(...ACCENT_DARK)
  doc.ellipse(W * 0.78, -22, W * 0.42, 44, 'F')
  // Large soft-grey curve sweeping across most of the width
  doc.setFillColor(...ACCENT_SOFT)
  doc.ellipse(W * 0.28, -28, W * 0.62, 52, 'F')
}

// Footer: exact mirror of the header band — same two curves flipped along
// the bottom edge so the footer reads as a true mirror of the header.
function drawFooterBand(doc: jsPDF, W: number, H: number) {
  // Dark navy curve on the right (mirror of header's top-right dark curve)
  doc.setFillColor(...ACCENT_DARK)
  doc.ellipse(W * 0.78, H + 22, W * 0.42, 44, 'F')
  // Large soft-grey curve sweeping across most of the width (mirror of header)
  doc.setFillColor(...ACCENT_SOFT)
  doc.ellipse(W * 0.28, H + 28, W * 0.62, 52, 'F')
}

// Full footer: band + contact info row + social icons.
// Drawn at the bottom of every invoice page so the design is consistent.
function drawFullFooter(doc: jsPDF, W: number, H: number) {
  drawFooterBand(doc, W, H)

  const CONTACT_LABEL_Y = H - 64
  const ICON_ROW_Y = H - 44
  const SOCIAL_ROW_Y = H - 22

  doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...ACCENT_DARK)
  doc.text('CONTACT INFORMATION', W / 2, CONTACT_LABEL_Y, { align: 'center' })

  const items: { draw: (cx: number, cy: number, s: number) => void; text: string }[] = [
    { draw: (cx, cy, s) => drawWhatsAppIcon(doc, cx, cy, s), text: SITE_PHONE_PK },
    { draw: (cx, cy, s) => drawEmailIcon(doc, cx, cy, s, ACCENT_DARK), text: SITE_EMAIL },
    { draw: (cx, cy, s) => drawGlobeIcon(doc, cx, cy, s, ACCENT_DARK), text: SITE_WEB },
  ]
  const ICON_SIZE = 12
  const ICON_TEXT_GAP = 6
  const ITEM_GAP = 28
  doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...ACCENT_DARK)
  const widths = items.map(it => ICON_SIZE + ICON_TEXT_GAP + doc.getTextWidth(it.text))
  const totalW = widths.reduce((a, b) => a + b, 0) + ITEM_GAP * (items.length - 1)
  let x = (W - totalW) / 2
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    const iconCx = x + ICON_SIZE / 2
    it.draw(iconCx, ICON_ROW_Y, ICON_SIZE)
    doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...ACCENT_DARK)
    doc.text(it.text, x + ICON_SIZE + ICON_TEXT_GAP, ICON_ROW_Y + 3)
    x += widths[i] + ITEM_GAP
  }

  const socials: ((cx: number, cy: number, s: number) => void)[] = [
    (cx, cy, s) => drawFacebookIcon(doc, cx, cy, s),
    (cx, cy, s) => drawInstagramIcon(doc, cx, cy, s),
    (cx, cy, s) => drawXTwitterIcon(doc, cx, cy, s),
    (cx, cy, s) => drawLinkedInIcon(doc, cx, cy, s),
    (cx, cy, s) => drawPinterestIcon(doc, cx, cy, s),
  ]
  const SOC_SIZE = 13
  const SOC_GAP = 10
  const socTotalW = socials.length * SOC_SIZE + (socials.length - 1) * SOC_GAP
  let sx = (W - socTotalW) / 2 + SOC_SIZE / 2
  for (const s of socials) {
    s(sx, SOCIAL_ROW_Y, SOC_SIZE)
    sx += SOC_SIZE + SOC_GAP
  }
}




// ---- Vector contact icons (drawn in white, scalable, no emoji) ----
function drawPhoneHandset(doc: jsPDF, cx: number, cy: number, s: number, rgb: [number,number,number]) {
  doc.setFillColor(...rgb)
  doc.setDrawColor(...rgb)
  doc.setLineWidth(s * 0.22)
  doc.setLineCap?.('round' as any)
  const ox = s * 0.32
  // Diagonal handset bar
  doc.line(cx - ox, cy - ox, cx + ox, cy + ox)
  // Earpiece + mouthpiece bulbs
  doc.circle(cx - ox, cy - ox, s * 0.17, 'F')
  doc.circle(cx + ox, cy + ox, s * 0.17, 'F')
}
function drawWhatsAppIcon(doc: jsPDF, cx: number, cy: number, s: number) {
  // Official-style WhatsApp mark: green speech bubble outline with phone handset inside.
  const green: [number, number, number] = [37, 211, 102]
  const r = s / 2
  const stroke = s * 0.11
  // Speech-bubble circle (outline only, white interior to keep footer bg showing through)
  doc.setDrawColor(...green)
  doc.setLineWidth(stroke)
  doc.setLineCap?.('round' as any)
  doc.setLineJoin?.('round' as any)
  doc.circle(cx, cy, r - stroke / 2)
  // Tail (small triangle pointing down-left)
  const tx = cx - r * 0.55, ty = cy + r * 0.55
  doc.setFillColor(...green)
  doc.triangle(
    tx, ty,
    tx + s * 0.22, ty - s * 0.05,
    tx + s * 0.05, ty + s * 0.22,
    'F'
  )
  // Mask the inside of the tail base with white so it reads as outline
  // (skip — keeps look clean enough at small size)
  // Handset glyph in green
  drawPhoneHandset(doc, cx, cy - s * 0.02, s * 0.5, green)
}

function drawPhoneIcon(doc: jsPDF, cx: number, cy: number, s: number, rgb: [number,number,number] = [255,255,255]) {
  drawPhoneHandset(doc, cx, cy, s * 0.95, rgb)
}
function drawEmailIcon(doc: jsPDF, cx: number, cy: number, s: number, rgb: [number,number,number] = [255,255,255]) {
  doc.setDrawColor(...rgb)
  doc.setLineWidth(s * 0.09)
  const w = s, h = s * 0.7
  doc.rect(cx - w / 2, cy - h / 2, w, h)
  // V flap
  doc.line(cx - w / 2, cy - h / 2, cx, cy + h * 0.18)
  doc.line(cx, cy + h * 0.18, cx + w / 2, cy - h / 2)
}
function drawGlobeIcon(doc: jsPDF, cx: number, cy: number, s: number, rgb: [number,number,number] = [255,255,255]) {
  doc.setDrawColor(...rgb)
  doc.setLineWidth(s * 0.08)
  const r = s / 2
  doc.circle(cx, cy, r)
  doc.line(cx - r, cy, cx + r, cy)
  doc.ellipse(cx, cy, r * 0.42, r)
}

// ---- Social media brand icons (filled discs with white glyph) ----
function drawDisc(doc: jsPDF, cx: number, cy: number, s: number, rgb: [number, number, number]) {
  doc.setFillColor(...rgb)
  doc.circle(cx, cy, s / 2, 'F')
}
function drawFacebookIcon(doc: jsPDF, cx: number, cy: number, s: number) {
  drawDisc(doc, cx, cy, s, [24, 119, 242])
  doc.setFont('helvetica', 'bold').setFontSize(s * 0.95).setTextColor(255, 255, 255)
  doc.text('f', cx, cy + s * 0.28, { align: 'center' })
}
function drawInstagramIcon(doc: jsPDF, cx: number, cy: number, s: number) {
  // Instagram brand-ish gradient approximated as warm magenta disc
  drawDisc(doc, cx, cy, s, [225, 48, 108])
  // White rounded square camera body
  const r = s * 0.32
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(s * 0.08)
  doc.roundedRect(cx - r, cy - r, r * 2, r * 2, s * 0.08, s * 0.08)
  // Lens
  doc.circle(cx, cy, s * 0.16)
  // Flash dot
  doc.setFillColor(255, 255, 255)
  doc.circle(cx + r * 0.6, cy - r * 0.6, s * 0.04, 'F')
}
function drawXTwitterIcon(doc: jsPDF, cx: number, cy: number, s: number) {
  drawDisc(doc, cx, cy, s, [0, 0, 0])
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(s * 0.12)
  const o = s * 0.26
  doc.line(cx - o, cy - o, cx + o, cy + o)
  doc.line(cx - o, cy + o, cx + o, cy - o)
}
function drawLinkedInIcon(doc: jsPDF, cx: number, cy: number, s: number) {
  drawDisc(doc, cx, cy, s, [10, 102, 194])
  doc.setFont('helvetica', 'bold').setFontSize(s * 0.6).setTextColor(255, 255, 255)
  doc.text('in', cx, cy + s * 0.2, { align: 'center' })
}
function drawPinterestIcon(doc: jsPDF, cx: number, cy: number, s: number) {
  drawDisc(doc, cx, cy, s, [203, 32, 39])
  doc.setFont('helvetica', 'bold').setFontSize(s * 0.85).setTextColor(255, 255, 255)
  doc.text('P', cx, cy + s * 0.26, { align: 'center' })
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
  details?: { label: string; value: string }[]
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

  // ---------- Note (close to subtotal, supports 2-3 short lines) ----------
  doc.setFont('helvetica', 'bold').setFontSize(10.5).setTextColor(...ACCENT_DARK)
  doc.text('NOTE', M, y)
  doc.setDrawColor(...ACCENT_SOFT).setLineWidth(0.6)
  doc.line(M, y + 4, M + 32, y + 4)
  const NOTE_TEXT_Y = y + 18
  const NOTE_LINE_H = 13
  const NOTE_MAX_LINES = 3
  if (opts.notes && opts.notes.trim()) {
    doc.setFont('helvetica', 'normal').setFontSize(9.5).setTextColor(...SUB)
    const lines = (doc.splitTextToSize(opts.notes.trim(), W - M * 2) as string[]).slice(0, NOTE_MAX_LINES)
    lines.forEach((ln, i) => doc.text(ln, M, NOTE_TEXT_Y + i * NOTE_LINE_H))
  } else {
    // Reserve 2 faint underlines for handwritten notes
    doc.setDrawColor(...ACCENT_SOFT).setLineWidth(0.4)
    for (let i = 0; i < 2; i++) {
      const ly2 = NOTE_TEXT_Y + 2 + i * NOTE_LINE_H
      doc.line(M, ly2, W - M, ly2)
    }
  }
  y = NOTE_TEXT_Y + NOTE_MAX_LINES * NOTE_LINE_H + 14

  // ---------- Payment Details heading ----------
  doc.setFont('helvetica', 'bold').setFontSize(13).setTextColor(...ACCENT_DARK)
  doc.text('Payment Details', M, y)
  doc.setDrawColor(...ACCENT_DARK).setLineWidth(1.2)
  doc.line(M, y + 4, M + 70, y + 4)
  y += 14

  // ---- 3-column bank blocks (rounded corners) ----
  const banks: { title: string; lines: [string, string][] }[] = [
    {
      title: 'UK — Clear Bank',
      lines: [
        ['Title', 'Muhammad Haroon'],
        ['Acct', '12863656'],
        ['Sort', '04-28-12'],
        ['IBAN', 'GB20CLRB04281286365680'],
        ['SWIFT', 'CLRBGB22XXX'],
      ],
    },
    {
      title: 'USA — JP Morgan Chase',
      lines: [
        ['Title', 'Muhammad Haroon'],
        ['Acct', '30000002945251'],
        ['Routing', '028000024'],
        ['Type', 'Checking'],
      ],
    },
    {
      title: 'Pakistan — UBL',
      lines: [
        ['Title', 'Muhammad Haroon'],
        ['Acct', '1482314848734'],
        ['IBAN', 'PK21UNIL0109000314848734'],
      ],
    },
  ]
  const usable = W - M * 2
  const gap = 8
  const colW = (usable - gap * 2) / 3
  const blockH = 110
  const radius = 8
  const BANK_TOP = y
  banks.forEach((b, i) => {
    const x = M + i * (colW + gap)
    // Rounded card background
    doc.setFillColor(...HEADER_BG)
    doc.roundedRect(x, BANK_TOP, colW, blockH, radius, radius, 'F')
    // Accent stripe on left (clip-like, narrow rounded rect)
    doc.setFillColor(...ACCENT_DARK)
    doc.roundedRect(x, BANK_TOP, 4, blockH, radius, radius, 'F')
    doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...ACCENT_DARK)
    doc.text(b.title, x + 10, BANK_TOP + 14)
    let bly = BANK_TOP + 28
    for (const [k, v] of b.lines) {
      doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...SUB)
      doc.text(`${k}:`, x + 10, bly)
      doc.setFont('helvetica', 'bold').setFontSize(7.5).setTextColor(...INK)
      const vLines = doc.splitTextToSize(v, colW - 42) as string[]
      doc.text(vLines, x + 38, bly)
      bly += 11 * vLines.length
    }
  })

  // ---- Footer (band + contact info + socials) ----
  drawFullFooter(doc, W, H)








  // Customer & order details page — full structured dump of every form field
  // the customer filled in, so the invoice is a complete record of the order.
  if (opts.details && opts.details.length > 0) {
    doc.addPage()
    drawHeaderBand(doc, W)
    drawWatermark(doc, W, H)
    let dy = M + 30
    doc.setFont('helvetica', 'bold').setFontSize(26).setTextColor(...ACCENT_DARK)
    doc.text('Customer & Order Details', M, dy)
    dy += 10
    doc.setDrawColor(...ACCENT_DARK).setLineWidth(1.5)
    doc.line(M, dy, M + 140, dy)
    dy += 22
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...SUB)
    doc.text(`Order Ref: ${opts.orderRef}    Invoice No: ${opts.invoiceNumber}`, M, dy)
    dy += 22

    const LABEL_W = 180
    const VAL_W = W - M * 2 - LABEL_W - 12
    const ROW_PAD = 6
    for (const d of opts.details) {
      const labelLines = doc.splitTextToSize(d.label, LABEL_W - 8) as string[]
      const valueLines = doc.splitTextToSize(d.value || '—', VAL_W) as string[]
      const rowLines = Math.max(labelLines.length, valueLines.length)
      const rowH = rowLines * 13 + ROW_PAD * 2
      if (dy + rowH > H - 90) {
        drawFooterBand(doc, W, H)
        doc.addPage(); drawHeaderBand(doc, W); drawWatermark(doc, W, H)
        dy = M + 30
        doc.setFont('helvetica', 'bold').setFontSize(20).setTextColor(...ACCENT_DARK)
        doc.text('Customer & Order Details (continued)', M, dy)
        dy += 28
      }
      // Zebra background
      doc.setFillColor(248, 249, 251)
      doc.rect(M, dy, W - M * 2, rowH, 'F')
      doc.setFont('helvetica', 'bold').setFontSize(9.5).setTextColor(...ACCENT_DARK)
      labelLines.forEach((ln, i) => doc.text(ln, M + 8, dy + ROW_PAD + 10 + i * 13))
      doc.setFont('helvetica', 'normal').setFontSize(9.5).setTextColor(...INK)
      valueLines.forEach((ln, i) => doc.text(ln, M + LABEL_W + 4, dy + ROW_PAD + 10 + i * 13))
      // Separator
      doc.setDrawColor(...DIVIDER).setLineWidth(0.3)
      doc.line(M, dy + rowH, W - M, dy + rowH)
      dy += rowH
    }
    drawFooterBand(doc, W, H)
  }


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
    // Compose the structured details list. Frontend already sends a flat
    // {label,value}[] of every form field; we accept it as-is.
    const detailRows = Array.isArray(body.details) ? body.details.filter(d => d && d.label) : []

    // Normalise phone for storage + lead capture (use frontend hint when present)
    const phoneE164 = body.customer.whatsapp_e164?.trim()
      || normalizePhoneToE164(body.customer.whatsapp, body.customer.country)

    // 1. Build PDF
    const pdfBytes = buildPdf({
      invoiceNumber, orderRef, issueDate,
      service: body.service,
      packageName: body.packageName,
      amount: body.amount_gbp,
      currency,
      customer: body.customer,
      notes: body.notes,
      details: detailRows,
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
        customer_phone_e164: phoneE164,
        country_code: body.customer.country ?? null,
        notes: body.notes ?? null,
        amount_mismatch: amountMismatch,
        source: 'checkout',
        payment_status: 'unpaid',
      })
      .select('id')
      .single()
    if (orderErr) throw orderErr

    // 4b. Auto-add to Lead Center (deduped by E.164 phone, fallback to email).
    //     A failure here must never break the checkout response.
    try {
      if (phoneE164 || body.customer.email) {
        const orFilters: string[] = []
        if (phoneE164) orFilters.push(`phone_e164.eq.${phoneE164}`)
        if (body.customer.email) orFilters.push(`email.ilike.${body.customer.email}`)
        const { data: existingLead } = await admin
          .from('leads')
          .select('id')
          .or(orFilters.join(','))
          .limit(1)
          .maybeSingle()
        if (!existingLead) {
          await admin.from('leads').insert({
            name: body.customer.full_name || body.customer.email || 'Checkout lead',
            email: body.customer.email ?? null,
            whatsapp: body.customer.whatsapp ?? null,
            phone_e164: phoneE164,
            country: body.customer.country ?? null,
            source: orderUserId ? 'portal_order' : 'guest_order',
            service: body.packageName ? `${body.service} — ${body.packageName}` : body.service,
            value_gbp: body.amount_gbp,
            stage: 'new',
            notes: `Auto-captured from order ${orderRef}.`,
            preferred_contact_method: 'whatsapp',
          })
        }
      }
    } catch (e) {
      console.warn('lead auto-capture failed (non-blocking)', e)
    }


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
