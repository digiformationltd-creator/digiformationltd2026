import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";

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

/** Same logic but for client_orders.order_ref */
export const generateOrderNumber = async (serviceCode: string): Promise<string> => {
  const code = (serviceCode || "O").toUpperCase().slice(0, 1);
  const prefix = `DF${code}${dateKey()}`;
  const { data } = await supabase
    .from("client_orders")
    .select("order_ref")
    .like("order_ref", `${prefix}-%`);
  const next = (data?.length || 0) + 1;
  return `${prefix}-${pad2(next)}`;
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
  tagline: "UK Company Formations & Compliance",
  address: "United Kingdom",
  email: "digiformationltd@gmail.com",
  website: "digiformation.com",
};

const fmtGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n || 0);

/** Generate a polished invoice PDF and trigger download. */
export const downloadInvoicePdf = async (inv: InvoiceData, logoUrl = "/digiformation-logo-official.png") => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 40;

  // Brand color (hsl from index.css primary) — fallback amber/teal accent
  const brand: [number, number, number] = [16, 185, 129]; // emerald-ish; matches digiformation green/teal feel

  // Header band
  doc.setFillColor(...brand);
  doc.rect(0, 0, W, 90, "F");

  // Logo
  try {
    const img = await fetch(logoUrl).then(r => r.blob());
    const dataUrl: string = await new Promise(res => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.readAsDataURL(img);
    });
    doc.addImage(dataUrl, "PNG", M, 20, 50, 50);
  } catch { /* ignore */ }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(COMPANY.name, M + 60, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(COMPANY.tagline, M + 60, 58);
  doc.text(`${COMPANY.email}  •  ${COMPANY.website}`, M + 60, 72);

  // INVOICE title (right)
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", W - M, 50, { align: "right" });

  // Invoice meta
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Invoice #", W - M - 140, 115);
  doc.text("Issue Date", W - M - 140, 132);
  doc.text("Due Date", W - M - 140, 149);
  doc.text("Status", W - M - 140, 166);
  doc.setFont("helvetica", "normal");
  doc.text(inv.invoice_number, W - M, 115, { align: "right" });
  doc.text(inv.issue_date, W - M, 132, { align: "right" });
  doc.text(inv.due_date || "—", W - M, 149, { align: "right" });
  doc.text(inv.status || "Unpaid", W - M, 166, { align: "right" });

  // Bill To
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("BILL TO", M, 115);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  let by = 132;
  if (inv.bill_to_name) { doc.text(inv.bill_to_name, M, by); by += 14; }
  if (inv.bill_to_email) { doc.text(inv.bill_to_email, M, by); by += 14; }
  if (inv.bill_to_address) {
    const addrLines = doc.splitTextToSize(inv.bill_to_address, 220);
    doc.text(addrLines, M, by);
  }

  // Items table header
  const tableY = 210;
  doc.setFillColor(245, 247, 250);
  doc.rect(M, tableY, W - 2 * M, 24, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text("Description", M + 10, tableY + 16);
  doc.text("Amount", W - M - 10, tableY + 16, { align: "right" });

  // Item row
  doc.setFont("helvetica", "normal");
  doc.setTextColor(20, 20, 20);
  const descLines = doc.splitTextToSize(inv.service_description || "Service", W - 2 * M - 120);
  doc.text(descLines, M + 10, tableY + 44);
  doc.text(fmtGBP(inv.amount_gbp), W - M - 10, tableY + 44, { align: "right" });
  const rowEnd = tableY + 44 + descLines.length * 12 + 12;
  doc.setDrawColor(230, 230, 230);
  doc.line(M, rowEnd, W - M, rowEnd);

  // Totals
  let ty = rowEnd + 24;
  const labelX = W - M - 140;
  const valX = W - M - 10;
  doc.setFontSize(10);
  doc.text("Subtotal", labelX, ty);
  doc.text(fmtGBP(inv.amount_gbp), valX, ty, { align: "right" });
  ty += 16;
  doc.text(`VAT (${inv.vat_rate || 0}%)`, labelX, ty);
  doc.text(fmtGBP(inv.vat_gbp), valX, ty, { align: "right" });
  ty += 8;
  doc.setDrawColor(...brand);
  doc.setLineWidth(1);
  doc.line(labelX, ty, valX, ty);
  ty += 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...brand);
  doc.text("TOTAL", labelX, ty);
  doc.text(fmtGBP(inv.total_gbp), valX, ty, { align: "right" });

  // Notes
  if (inv.notes) {
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Notes", M, ty + 40);
    doc.setFont("helvetica", "normal");
    const noteLines = doc.splitTextToSize(inv.notes, W - 2 * M);
    doc.text(noteLines, M, ty + 56);
  }

  // Footer
  const fy = doc.internal.pageSize.getHeight() - 40;
  doc.setDrawColor(220, 220, 220);
  doc.line(M, fy - 10, W - M, fy - 10);
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Thank you for your business.", M, fy);
  doc.text(`${COMPANY.name} • ${COMPANY.email}`, W - M, fy, { align: "right" });

  doc.save(`${inv.invoice_number}.pdf`);
};
