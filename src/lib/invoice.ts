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

/**
 * Generate a unique invoice/order number in the format:
 *   DF + ServiceCode + YYYYMMDD + -NN
 * Looks at existing invoices for today+code to compute next sequence.
 */
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

/** Same logic but for client_orders.order_ref — uses unified buildOrderRef format. */
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

const GREY_LIGHT: [number, number, number] = [232, 232, 232];
const GREY_MID: [number, number, number] = [180, 180, 180];
const INK: [number, number, number] = [20, 20, 20];
const MUTED: [number, number, number] = [100, 100, 100];

const fmtGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n || 0);

const longDate = (iso?: string | null) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map((s) => parseInt(s, 10));
  if (!y || !m || !d) return iso;
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${months[m - 1]} ${d}, ${y}`;
};

/** Generate a branded invoice PDF (matches the order-confirmation email template) and trigger download. */
export const downloadInvoicePdf = async (inv: InvoiceData, logoUrl = "/digiformation-logo-official.png") => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;

  // ---- Decorative corner triangles ----
  doc.setFillColor(...GREY_MID);
  doc.triangle(0, 0, 150, 0, 0, 110, "F");
  doc.setFillColor(210, 210, 210);
  doc.triangle(60, 0, 230, 0, 60, 90, "F");
  doc.setFillColor(...GREY_MID);
  doc.triangle(W, H, W - 150, H, W, H - 110, "F");
  doc.setFillColor(210, 210, 210);
  doc.triangle(W - 60, H, W - 230, H, W - 60, H - 90, "F");
  doc.setDrawColor(20).setLineWidth(1.2);
  doc.line(0, 116, 130, 0);
  doc.line(W, H - 116, W - 130, H);
  doc.setLineWidth(0.2);

  // ---- Header: logo + INVOICE ----
  try {
    const blob = await fetch(logoUrl).then(r => r.blob());
    const dataUrl: string = await new Promise(res => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.readAsDataURL(blob);
    });
    doc.addImage(dataUrl, "PNG", M, M + 8, 130, 130, undefined, "FAST");
  } catch {
    doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(...INK);
    doc.text(COMPANY.name, M, M + 60);
  }
  doc.setFont("helvetica", "bold").setFontSize(40).setTextColor(...INK);
  doc.text("INVOICE", W - M, M + 70, { align: "right" });

  let y = M + 160;

  // ---- Billed-to / Invoice meta panel ----
  const billedLines: string[] = [];
  if (inv.bill_to_email) billedLines.push(inv.bill_to_email);
  if (inv.bill_to_address) billedLines.push(inv.bill_to_address);
  const panelH = Math.max(110, 60 + billedLines.length * 14 + 16);
  doc.setFillColor(...GREY_LIGHT);
  doc.rect(M, y, W - M * 2, panelH, "F");

  let py = y + 24;
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...MUTED);
  doc.text("BILLED TO:", M + 18, py); py += 18;
  doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...INK);
  doc.text((inv.bill_to_name || "—").toUpperCase(), M + 18, py); py += 16;
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(60);
  for (const line of billedLines) {
    const wrapped = doc.splitTextToSize(line, W / 2 - 60) as string[];
    for (const w of wrapped) { doc.text(w, M + 18, py); py += 14; }
  }

  // Meta (right)
  const metaX = W / 2 + 20;
  const metaVX = W - M - 18;
  let my = y + 24;
  const metaRow = (label: string, value: string) => {
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(60);
    doc.text(label, metaX, my);
    doc.setFont("helvetica", "bold").setTextColor(...INK);
    doc.text(value, metaVX, my, { align: "right" });
    my += 18;
  };
  metaRow("Invoice No:", inv.invoice_number);
  metaRow("Invoice Date:", longDate(inv.issue_date));
  metaRow("Due Date:", longDate(inv.due_date || inv.issue_date));
  metaRow("Status:", inv.status || "Unpaid");

  y += panelH + 26;

  // ---- Items table ----
  doc.setDrawColor(20).setLineWidth(1.2).line(M, y, W - M, y);
  y += 4;
  const colDescX = M + 14;
  const colQtyX  = W * 0.50;
  const colPriceX = W * 0.70;
  const colTotalX = W - M - 14;
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...INK);
  const headY = y + 22;
  doc.text("DESCRIPTION", colDescX, headY);
  doc.text("QTY", colQtyX, headY, { align: "center" });
  doc.text("PRICE", colPriceX, headY, { align: "center" });
  doc.text("TOTAL", colTotalX, headY, { align: "right" });
  y += 32;
  doc.setLineWidth(1.2).line(M, y, W - M, y);
  doc.setLineWidth(0.2);
  y += 14;

  const wrapped = doc.splitTextToSize(inv.service_description || "Service", (colQtyX - colDescX) - 20);
  const rowH = Math.max(34, wrapped.length * 13 + 18);
  doc.setFillColor(...GREY_LIGHT);
  doc.rect(M, y, W - M * 2, rowH, "F");
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...INK);
  doc.text(wrapped, colDescX, y + 20);
  doc.setFont("helvetica", "normal").setTextColor(40);
  doc.text("1", colQtyX, y + 20, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.text(fmtGBP(inv.amount_gbp), colPriceX, y + 20, { align: "center" });
  doc.text(fmtGBP(inv.amount_gbp), colTotalX, y + 20, { align: "right" });
  y += rowH + 6;
  doc.setDrawColor(20).setLineWidth(1.2).line(M, y, W - M, y);
  doc.setLineWidth(0.2);
  y += 24;

  // ---- Terms + Totals ----
  const totalsX = W - M - 200;
  const totalsVX = W - M - 14;
  const termsW = totalsX - M - 24;
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...INK);
  doc.text("TERMS & CONDITIONS:", M, y);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(80);
  const terms = (inv.notes && inv.notes.trim())
    ? inv.notes
    : "Payment is due within 7 days of invoice date. All services are subject to the Digiformation Ltd standard terms of service. Late payments may delay order processing.";
  const termsLines = doc.splitTextToSize(terms, termsW);
  doc.text(termsLines, M, y + 18);

  let ty = y;
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...INK);
  doc.text("Subtotal", totalsX, ty);
  doc.setFont("helvetica", "normal");
  doc.text(fmtGBP(inv.amount_gbp), totalsVX, ty, { align: "right" });
  ty += 22;
  doc.setFont("helvetica", "bold");
  doc.text(`VAT (${inv.vat_rate || 0}%)`, totalsX, ty);
  doc.setFont("helvetica", "normal");
  doc.text(fmtGBP(inv.vat_gbp), totalsVX, ty, { align: "right" });
  ty += 18;
  doc.setFillColor(...GREY_LIGHT);
  doc.rect(totalsX - 10, ty, (W - M) - (totalsX - 10), 28, "F");
  doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(...INK);
  doc.text("Total", totalsX, ty + 18);
  doc.text(fmtGBP(inv.total_gbp), totalsVX, ty + 18, { align: "right" });

  y = Math.max(y + 18 + termsLines.length * 12, ty + 28) + 30;

  // ---- Signature ----
  doc.setFont("times", "italic").setFontSize(22).setTextColor(...INK);
  doc.text("Digiformation", M, y);
  y += 8;
  doc.setDrawColor(...INK).setLineWidth(0.6).line(M, y, M + 160, y);
  y += 14;
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...INK);
  doc.text(COMPANY.name, M, y);

  // ---- Bottom band: Payment Methods + Contact ----
  const bandY = H - 240;
  doc.setFillColor(...GREY_LIGHT);
  doc.rect(M, bandY, W - M * 2, 28, "F");
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...INK);
  doc.text("PAYMENT METHODS:", M + 14, bandY + 18);
  doc.text("CONTACT:", W - M - 14, bandY + 18, { align: "right" });

  const infoY = bandY + 44;
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...INK);
  doc.text("Barclays Bank (GBP — UK Local transfer)", M + 14, infoY);
  doc.setFont("helvetica", "normal").setTextColor(60);
  doc.text("Beneficiary: Muhammad Haroon  ·  Sort Code: 23-14-86  ·  Account No: 15737580", M + 14, infoY + 12);

  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...INK);
  doc.text("Binance Pay (Crypto)", M + 14, infoY + 30);
  doc.setFont("helvetica", "normal").setTextColor(60);
  doc.text("Account Title: Haroon-alhanfi  ·  Binance ID: 477888953", M + 14, infoY + 42);

  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...INK);
  doc.text("Pakistan (PKR) — Muhammad Haroon", M + 14, infoY + 60);
  doc.setFont("helvetica", "normal").setTextColor(60);
  doc.text("NayaPay  ·  JazzCash  ·  EasyPaisa  ·  FirstPay HBL", M + 14, infoY + 72);
  doc.text("Mobile / Account: 0303 4226759", M + 14, infoY + 84);

  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(60);
  doc.text(COMPANY.phonePk, W - M - 14, infoY, { align: "right" });
  doc.text(COMPANY.phoneUk, W - M - 14, infoY + 14, { align: "right" });
  doc.text(COMPANY.email, W - M - 14, infoY + 28, { align: "right" });
  doc.text(COMPANY.website, W - M - 14, infoY + 42, { align: "right" });

  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...INK);
  doc.text("THANK YOU FOR YOUR BUSINESS", M, H - 28);

  doc.save(`${inv.invoice_number}.pdf`);
};
