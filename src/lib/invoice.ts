import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { buildOrderRef } from "@/lib/orderRef";

// Map admin single-letter service codes → buildOrderRef service codes
const ADMIN_CODE_TO_SERVICE_CODE: Record<string, string> = {
  C: "LTD", A: "ADZ", B: "BANK", T: "UTR", V: "VAT",
  W: "WEB", D: "DOC", S: "SUB", O: "ORD",
};

// Service code map — used in order/invoice numbers like DFC20260503-01
export const SERVICE_CODES: Record<string, string> = {
  C: "Company Formation",
  A: "Address Service",
  B: "Banking",
  T: "Tax / UTR",
  V: "VAT",
  W: "Web Development",
  D: "Documents / Dissolution",
  S: "Subscription",
  O: "Other",
};

const pad2 = (n: number) => n.toString().padStart(2, "0");

/** Returns YYYYMMDD for today (or given date) */
export const dateKey = (d = new Date()) =>
  `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;

export const generateInvoiceNumber = async (serviceCode: string): Promise<string> => {
  const code = (serviceCode || "O").toUpperCase().slice(0, 1);
  const prefix = `DF${code}${dateKey()}`;
  const { data } = await supabase
    .from("invoices")
    .select("invoice_number")
    .like("invoice_number", `${prefix}-%`);
  const next = (data?.length || 0) + 1;
  return `${prefix}-${pad2(next)}`;
};

export const generateOrderNumber = async (serviceCode: string): Promise<string> => {
  const code = (serviceCode || "O").toUpperCase().slice(0, 1);
  const mapped = ADMIN_CODE_TO_SERVICE_CODE[code] || "ORD";
  return await buildOrderRef({ serviceCode: mapped });
};

export interface InvoiceData {
  invoice_number: string;
  issue_date: string;
  due_date?: string | null;
  service_description: string;
  bill_to_name?: string | null;
  bill_to_email?: string | null;
  bill_to_address?: string | null;
  amount_gbp: number;
  vat_rate: number;
  vat_gbp: number;
  total_gbp: number;
  notes?: string | null;
  status?: string;
}

const COMPANY = {
  name: "Digiformation Ltd",
  phoneUk: "+44 7438 351454",
  phonePk: "+92 316 4467464",
  email: "info@digiformation.uk",
  website: "www.digiformation.uk",
};

const INK: [number, number, number] = [20, 20, 20];
const SUB: [number, number, number] = [90, 90, 90];
const HEADER_BG: [number, number, number] = [225, 225, 225];
const DIVIDER: [number, number, number] = [215, 215, 215];
const WAVE_LIGHT: [number, number, number] = [205, 208, 212];
const WAVE_DARK: [number, number, number] = [70, 75, 82];

const fmtGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n || 0);

const longDate = (iso?: string | null) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map((s) => parseInt(s, 10));
  if (!y || !m || !d) return iso;
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${d.toString().padStart(2,"0")} ${months[m - 1]}, ${y}`;
};

/** Draw bottom-right organic wave shapes (decorative) */
const drawWaves = (doc: jsPDF, W: number, H: number) => {
  // Light gray large blob — bottom-left
  doc.setFillColor(...WAVE_LIGHT);
  doc.ellipse(W * 0.32, H + 30, W * 0.55, 110, "F");
  // Darker wave — bottom-right
  doc.setFillColor(...WAVE_DARK);
  doc.ellipse(W * 0.85, H + 20, W * 0.45, 95, "F");
  // Light overlap
  doc.setFillColor(...WAVE_LIGHT);
  doc.ellipse(W * 0.55, H + 50, W * 0.35, 70, "F");
};

/** Diagonal watermark "DIGIFORMATION LTD" — single large, professional */
const drawWatermark = (doc: jsPDF, W: number, H: number) => {
  doc.saveGraphicsState();
  // @ts-ignore
  const GState = (doc as any).GState;
  if (GState) {
    // @ts-ignore
    doc.setGState(new GState({ opacity: 0.08 }));
  }
  // Main diagonal watermark — corner-to-corner, very large
  const diag = Math.sqrt(W * W + H * H);
  const angle = (Math.atan2(H, W) * 180) / Math.PI;
  const mainSize = Math.floor(diag / 11);
  doc.setFont("helvetica", "bold").setFontSize(mainSize).setTextColor(40, 40, 40);
  doc.text("DIGIFORMATION LTD", W / 2, H / 2, { align: "center", angle });

  // Two smaller vertical watermarks on the sides
  if (GState) {
    // @ts-ignore
    doc.setGState(new GState({ opacity: 0.06 }));
  }
  doc.setFontSize(26);
  doc.text("DIGIFORMATION LTD", W * 0.10, H * 0.80, { align: "center", angle: 90 });
  doc.text("DIGIFORMATION LTD", W * 0.90, H * 0.20, { align: "center", angle: 90 });

  doc.restoreGraphicsState();
};

export const downloadInvoicePdf = async (inv: InvoiceData, logoUrl = "/digiformation-logo-official.png") => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 56;

  // Load logo
  let logoDataUrl: string | null = null;
  try {
    const blob = await fetch(logoUrl).then(r => r.blob());
    logoDataUrl = await new Promise<string>(res => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.readAsDataURL(blob);
    });
  } catch { /* ignore */ }

  // Watermark first (under everything)
  drawWatermark(doc, W, H);

  // ---- Header: Logo (left) + Invoice No (right) ----
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", M, M, 140, 140, undefined, "FAST");
  } else {
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...INK);
    doc.text("DIGIFORMATION", M, M + 20);
    doc.text("LTD", M, M + 34);
  }
  doc.setFont("helvetica", "normal").setFontSize(11).setTextColor(...INK);
  doc.text(`NO. ${inv.invoice_number}`, W - M, M + 20, { align: "right" });

  // ---- Big INVOICE title ----
  doc.setFont("helvetica", "bold").setFontSize(58).setTextColor(...INK);
  doc.text("INVOICE", M, M + 160);

  let y = M + 220;

  // ---- Date ----
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...INK);
  doc.text("Date:", M, y);
  doc.setFont("helvetica", "normal").setTextColor(...SUB);
  doc.text(longDate(inv.issue_date), M + 50, y);
  y += 36;

  // ---- Billed To (left) | From (right) ----
  const colR = W / 2 + 10;
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...INK);
  doc.text("Billed to:", M, y);
  doc.text("From:", colR, y);

  let ly = y + 16;
  doc.setFont("helvetica", "normal").setFontSize(10.5).setTextColor(...SUB);
  const billedName = inv.bill_to_name || "—";
  doc.text(billedName, M, ly); ly += 14;
  if (inv.bill_to_address) {
    const wrappedAddr = doc.splitTextToSize(inv.bill_to_address, W / 2 - M - 20) as string[];
    for (const w of wrappedAddr) { doc.text(w, M, ly); ly += 14; }
  }
  if (inv.bill_to_email) { doc.text(inv.bill_to_email, M, ly); ly += 14; }

  let ry = y + 16;
  doc.text(COMPANY.name, colR, ry); ry += 14;
  doc.text(COMPANY.website, colR, ry); ry += 14;
  doc.text(COMPANY.email, colR, ry); ry += 14;
  doc.text(`UK: ${COMPANY.phoneUk}`, colR, ry); ry += 14;
  doc.text(`PK: ${COMPANY.phonePk}`, colR, ry); ry += 14;

  y = Math.max(ly, ry) + 24;

  // ---- Items table ----
  // Header bar
  doc.setFillColor(...HEADER_BG);
  doc.rect(M, y, W - M * 2, 30, "F");
  doc.setFont("helvetica", "normal").setFontSize(11).setTextColor(...INK);
  const colItem = M + 14;
  const colQty = W * 0.55;
  const colPrice = W * 0.72;
  const colAmt = W - M - 14;
  doc.text("Item", colItem, y + 20);
  doc.text("Quantity", colQty, y + 20, { align: "center" });
  doc.text("Price", colPrice, y + 20, { align: "center" });
  doc.text("Amount", colAmt, y + 20, { align: "right" });
  y += 30;

  // Item row
  const desc = inv.service_description || "Service";
  const wrapped = doc.splitTextToSize(desc, (colQty - colItem) - 30) as string[];
  const rowH = Math.max(40, wrapped.length * 14 + 20);
  doc.setFont("helvetica", "normal").setFontSize(10.5).setTextColor(...INK);
  doc.text(wrapped, colItem, y + 22);
  doc.text("1", colQty, y + 22, { align: "center" });
  doc.text(fmtGBP(inv.amount_gbp), colPrice, y + 22, { align: "center" });
  doc.text(fmtGBP(inv.amount_gbp), colAmt, y + 22, { align: "right" });
  y += rowH;

  // Divider
  doc.setDrawColor(...DIVIDER).setLineWidth(0.6).line(M, y, W - M, y);
  y += 18;

  // Subtotal / VAT (small, right)
  if (inv.vat_rate && inv.vat_rate > 0) {
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...SUB);
    doc.text("Subtotal", colPrice, y, { align: "center" });
    doc.text(fmtGBP(inv.amount_gbp), colAmt, y, { align: "right" });
    y += 14;
    doc.text(`VAT (${inv.vat_rate}%)`, colPrice, y, { align: "center" });
    doc.text(fmtGBP(inv.vat_gbp), colAmt, y, { align: "right" });
    y += 14;
  }

  // Total
  doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(...INK);
  doc.text("Total", colPrice, y + 4, { align: "center" });
  doc.text(fmtGBP(inv.total_gbp), colAmt, y + 4, { align: "right" });
  y += 32;

  doc.setDrawColor(...DIVIDER).setLineWidth(0.6).line(M, y, W - M, y);
  y += 28;

  // ---- Note ----
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...INK);
  doc.text("Note:", M, y);
  doc.setFont("helvetica", "normal").setTextColor(...SUB);
  const note = (inv.notes && inv.notes.trim())
    ? inv.notes
    : `Thank you for choosing ${COMPANY.name}. Payment is due within 7 days of invoice date.`;
  const noteLines = doc.splitTextToSize(note, W - M * 2 - 50) as string[];
  doc.text(noteLines, M + 42, y);
  y += noteLines.length * 14 + 22;

  // Signature (small, above waves)
  const sigY = H - 160;
  doc.setFont("times", "italic").setFontSize(20).setTextColor(...INK);
  doc.text("Digiformation", M, sigY);
  doc.setDrawColor(...INK).setLineWidth(0.5).line(M, sigY + 6, M + 140, sigY + 6);
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...INK);
  doc.text(COMPANY.name, M, sigY + 20);

  // ---- Decorative waves at bottom ----
  drawWaves(doc, W, H);

  doc.save(`${inv.invoice_number}.pdf`);
};
