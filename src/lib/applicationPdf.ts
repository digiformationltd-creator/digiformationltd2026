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
  submitted_at: string;
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

const longDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${d.getDate().toString().padStart(2,"0")} ${months[d.getMonth()]}, ${d.getFullYear()}`;
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

const drawWaves = (doc: jsPDF, W: number, H: number) => {
  doc.setFillColor(...WAVE_LIGHT);
  doc.ellipse(W * 0.32, H + 30, W * 0.55, 110, "F");
  doc.setFillColor(...WAVE_DARK);
  doc.ellipse(W * 0.85, H + 20, W * 0.45, 95, "F");
  doc.setFillColor(...WAVE_LIGHT);
  doc.ellipse(W * 0.55, H + 50, W * 0.35, 70, "F");
};

const drawWatermark = (doc: jsPDF, W: number, H: number) => {
  doc.saveGraphicsState();
  // @ts-ignore
  const GState = (doc as any).GState;
  if (GState) {
    // @ts-ignore
    doc.setGState(new GState({ opacity: 0.07 }));
  }
  doc.setFont("helvetica", "bold").setFontSize(78).setTextColor(40, 40, 40);
  doc.text("DIGIFORMATION LTD", W / 2, H / 2, { align: "center", angle: 30 });
  doc.restoreGraphicsState();
};

export const buildApplicationPdf = async (
  app: ApplicationData,
  logoUrl = "/digiformation-logo.png",
): Promise<{ doc: jsPDF; blob: Blob; filename: string }> => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 56;

  const logoDataUrl = await loadDataUrl(logoUrl);

  // Watermark first
  drawWatermark(doc, W, H);

  // ---- Header ----
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", M, M, 64, 64, undefined, "FAST");
  } else {
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...INK);
    doc.text("DIGIFORMATION", M, M + 20);
    doc.text("LTD", M, M + 34);
  }
  doc.setFont("helvetica", "normal").setFontSize(11).setTextColor(...INK);
  doc.text(`NO. ${app.application_id}`, W - M, M + 20, { align: "right" });

  // ---- Big title ----
  doc.setFont("helvetica", "bold").setFontSize(50).setTextColor(...INK);
  doc.text("APPLICATION", M, M + 160);

  let y = M + 220;

  // Date
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...INK);
  doc.text("Date:", M, y);
  doc.setFont("helvetica", "normal").setTextColor(...SUB);
  doc.text(longDate(app.submitted_at.slice(0, 10)), M + 50, y);
  y += 36;

  // ---- Applicant (left) | From (right) ----
  const colR = W / 2 + 10;
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...INK);
  doc.text("Applicant:", M, y);
  doc.text("From:", colR, y);

  let ly = y + 16;
  doc.setFont("helvetica", "normal").setFontSize(10.5).setTextColor(...SUB);
  doc.text(app.full_name || "—", M, ly); ly += 14;
  if (app.email) { doc.text(app.email, M, ly); ly += 14; }
  if (app.whatsapp) { doc.text(`WhatsApp: ${app.whatsapp}`, M, ly); ly += 14; }

  let ry = y + 16;
  doc.text(COMPANY.name, colR, ry); ry += 14;
  doc.text(COMPANY.website, colR, ry); ry += 14;
  doc.text(COMPANY.email, colR, ry); ry += 14;
  doc.text(`UK: ${COMPANY.phoneUk}`, colR, ry); ry += 14;
  doc.text(`PK: ${COMPANY.phonePk}`, colR, ry); ry += 14;

  y = Math.max(ly, ry) + 24;

  // ---- Details table ----
  doc.setFillColor(...HEADER_BG);
  doc.rect(M, y, W - M * 2, 30, "F");
  doc.setFont("helvetica", "normal").setFontSize(11).setTextColor(...INK);
  doc.text("Field", M + 14, y + 20);
  doc.text("Details", W / 2 + 10, y + 20);
  y += 30;

  const rows: Array<[string, string]> = [
    ["Full Name", app.full_name || "—"],
    ["Email", app.email || "—"],
    ["WhatsApp", app.whatsapp || "—"],
    ["Employee Code", app.employee_code || "—"],
    ["Joining Date", longDate(app.joining_date)],
    ["Education", app.education || "—"],
    ["Experience", app.experience || "—"],
    ["Message", app.message || "—"],
    ["Submitted", fmtDateTime(app.submitted_at)],
    ["Application ID", app.application_id],
  ];

  const valX = W / 2 + 10;
  const valMaxW = W - M - 14 - valX;
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...INK);
  for (const [label, value] of rows) {
    const wrapped = doc.splitTextToSize(value, valMaxW) as string[];
    const rowH = Math.max(20, wrapped.length * 12 + 8);
    if (y + rowH > H - 200) break;
    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...INK);
    doc.text(label, M + 14, y + 14);
    doc.setFont("helvetica", "normal").setTextColor(...SUB);
    doc.text(wrapped, valX, y + 14);
    y += rowH;
    doc.setDrawColor(...DIVIDER).setLineWidth(0.3).line(M, y, W - M, y);
  }
  y += 18;

  // Note
  if (y < H - 200) {
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...INK);
    doc.text("Note:", M, y);
    doc.setFont("helvetica", "normal").setTextColor(...SUB);
    const note = `Thank you for applying to the ${COMPANY.name} Affiliate & B2B Partner Program. Our partner team will review your application and reach out via email or WhatsApp within 24–48 hours.`;
    const noteLines = doc.splitTextToSize(note, W - M * 2 - 50) as string[];
    doc.text(noteLines, M + 42, y);
  }

  // Signature
  const sigY = H - 160;
  doc.setFont("times", "italic").setFontSize(20).setTextColor(...INK);
  doc.text("Digiformation", M, sigY);
  doc.setDrawColor(...INK).setLineWidth(0.5).line(M, sigY + 6, M + 140, sigY + 6);
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...INK);
  doc.text(`${COMPANY.name} · Partner Team`, M, sigY + 20);

  // Decorative waves
  drawWaves(doc, W, H);

  const filename = `${app.application_id}.pdf`;
  const blob = doc.output("blob");
  return { doc, blob, filename };
};

export const downloadApplicationPdf = async (app: ApplicationData, logoUrl?: string) => {
  const { doc, filename } = await buildApplicationPdf(app, logoUrl);
  doc.save(filename);
};
