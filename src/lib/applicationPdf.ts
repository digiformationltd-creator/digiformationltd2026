import jsPDF from "jspdf";

export interface ApplicationData {
  application_id: string;
  full_name: string;
  email: string;
  whatsapp: string;
  employee_code?: string | null;
  joining_date?: string | null;
  education?: string | null;
  experience?: string | null;
  message?: string | null;
  submitted_at: string; // ISO
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

const longDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${longDate(iso)} · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
};

const loadDataUrl = async (url: string): Promise<string | null> => {
  try {
    const blob = await fetch(url).then((r) => r.blob());
    return await new Promise<string>((res) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

/**
 * Build a branded Application Submission PDF (same template family as invoices).
 * Returns the jsPDF doc plus a Blob for upload.
 */
export const buildApplicationPdf = async (
  app: ApplicationData,
  logoUrl = "/digiformation-logo.png",
): Promise<{ doc: jsPDF; blob: Blob; filename: string }> => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;

  const logoDataUrl = await loadDataUrl(logoUrl);

  // ---- Watermark (diagonal repeating logo / brand text) ----
  // Use light grey diagonal "DIGIFORMATION" text + faint center logo for premium feel.
  doc.saveGraphicsState();
  // @ts-ignore - jsPDF GState is at runtime
  const GState = (doc as any).GState;
  if (GState) {
    // @ts-ignore
    doc.setGState(new GState({ opacity: 0.06 }));
  }
  if (logoDataUrl) {
    const wmSize = 380;
    doc.addImage(logoDataUrl, "PNG", (W - wmSize) / 2, (H - wmSize) / 2, wmSize, wmSize, undefined, "FAST");
  }
  // Diagonal brand text repeated across the page
  if (GState) {
    // @ts-ignore
    doc.setGState(new GState({ opacity: 0.05 }));
  }
  doc.setFont("helvetica", "bold").setFontSize(56).setTextColor(60, 60, 60);
  for (let y = -40; y < H + 80; y += 130) {
    for (let x = -40; x < W + 120; x += 360) {
      doc.text("DIGIFORMATION", x, y, { angle: -30 });
    }
  }
  doc.restoreGraphicsState();

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

  // ---- Header: logo + title ----
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", M, M + 8, 130, 130, undefined, "FAST");
  } else {
    doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(...INK);
    doc.text(COMPANY.name, M, M + 60);
  }
  doc.setFont("helvetica", "bold").setFontSize(28).setTextColor(...INK);
  doc.text("APPLICATION", W - M, M + 56, { align: "right" });
  doc.setFontSize(16).setTextColor(...MUTED);
  doc.text("Submission Details", W - M, M + 82, { align: "right" });

  let y = M + 160;

  // ---- Meta panel ----
  const panelH = 110;
  doc.setFillColor(...GREY_LIGHT);
  doc.rect(M, y, W - M * 2, panelH, "F");

  let py = y + 24;
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...MUTED);
  doc.text("APPLICANT:", M + 18, py); py += 18;
  doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...INK);
  doc.text((app.full_name || "—").toUpperCase(), M + 18, py); py += 16;
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(60);
  doc.text(app.email || "—", M + 18, py); py += 14;
  doc.text(`WhatsApp: ${app.whatsapp || "—"}`, M + 18, py); py += 14;

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
  metaRow("Application ID:", app.application_id);
  metaRow("Submitted:", longDate(app.submitted_at));
  metaRow("Time:", new Date(app.submitted_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
  metaRow("Status:", "Received");

  y += panelH + 26;

  // ---- Details table ----
  doc.setDrawColor(20).setLineWidth(1.2).line(M, y, W - M, y);
  y += 4;
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...INK);
  doc.text("FIELD", M + 14, y + 22);
  doc.text("DETAILS", W / 2, y + 22);
  y += 32;
  doc.setLineWidth(1.2).line(M, y, W - M, y);
  doc.setLineWidth(0.2);
  y += 6;

  const rows: Array<[string, string]> = [
    ["Full Name", app.full_name || "—"],
    ["Email Address", app.email || "—"],
    ["WhatsApp Number", app.whatsapp || "—"],
    ["Employee Code", app.employee_code || "—"],
    ["Joining Date", longDate(app.joining_date)],
    ["Education", app.education || "—"],
    ["Experience", app.experience || "—"],
    ["Message / Note", app.message || "—"],
    ["Submission Date & Time", fmtDateTime(app.submitted_at)],
    ["Application ID", app.application_id],
  ];

  const valX = W / 2;
  const valMaxW = W - M - 14 - valX;
  let zebra = false;
  for (const [label, value] of rows) {
    const wrapped = doc.splitTextToSize(value, valMaxW) as string[];
    const rowH = Math.max(28, wrapped.length * 13 + 14);
    if (zebra) {
      doc.setFillColor(245, 245, 245);
      doc.rect(M, y, W - M * 2, rowH, "F");
    }
    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...INK);
    doc.text(label, M + 14, y + 18);
    doc.setFont("helvetica", "normal").setTextColor(40);
    doc.text(wrapped, valX, y + 18);
    y += rowH;
    zebra = !zebra;
  }
  doc.setDrawColor(20).setLineWidth(1.2).line(M, y, W - M, y);
  doc.setLineWidth(0.2);
  y += 26;

  // ---- Note / signature ----
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(80);
  const note =
    "Thank you for applying to the Digiformation Ltd Affiliate & B2B Partner Program. Our partner team will review your application and reach out via email or WhatsApp within 24–48 hours. This document is an automated submission record — please keep it for your reference.";
  const noteLines = doc.splitTextToSize(note, W - M * 2);
  doc.text(noteLines, M, y);
  y += noteLines.length * 12 + 24;

  doc.setFont("times", "italic").setFontSize(22).setTextColor(...INK);
  doc.text("Digiformation", M, y);
  y += 8;
  doc.setDrawColor(...INK).setLineWidth(0.6).line(M, y, M + 160, y);
  y += 14;
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...INK);
  doc.text(COMPANY.name + " · Partner Team", M, y);

  // ---- Bottom band: Contact ----
  const bandY = H - 130;
  doc.setFillColor(...GREY_LIGHT);
  doc.rect(M, bandY, W - M * 2, 28, "F");
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...INK);
  doc.text("PARTNER SUPPORT:", M + 14, bandY + 18);
  doc.text("CONTACT:", W - M - 14, bandY + 18, { align: "right" });

  const infoY = bandY + 44;
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(60);
  doc.text("Email: " + COMPANY.email, M + 14, infoY);
  doc.text("WhatsApp UK: " + COMPANY.phoneUk, M + 14, infoY + 14);
  doc.text("WhatsApp PK: " + COMPANY.phonePk, M + 14, infoY + 28);
  doc.text("Website: " + COMPANY.website, M + 14, infoY + 42);

  doc.text(COMPANY.phonePk, W - M - 14, infoY, { align: "right" });
  doc.text(COMPANY.phoneUk, W - M - 14, infoY + 14, { align: "right" });
  doc.text(COMPANY.email, W - M - 14, infoY + 28, { align: "right" });
  doc.text(COMPANY.website, W - M - 14, infoY + 42, { align: "right" });

  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...INK);
  doc.text("THANK YOU FOR APPLYING", M, H - 28);

  const filename = `${app.application_id}.pdf`;
  const blob = doc.output("blob");
  return { doc, blob, filename };
};

export const downloadApplicationPdf = async (app: ApplicationData, logoUrl?: string) => {
  const { doc, filename } = await buildApplicationPdf(app, logoUrl);
  doc.save(filename);
};
