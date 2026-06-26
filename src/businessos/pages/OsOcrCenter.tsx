// OCR Center — Phase 1 UI (mock data only). No OCR, no AI, no backend.

import { useMemo, useState } from "react";
import {
  ScanText, Upload, Clock, CheckCircle2, AlertTriangle, XCircle, Eye,
  FileText, Building2, Hash, Key, PoundSterling, Receipt, Users, MapPin,
  CalendarDays, Search, Filter, Check, X, RotateCcw, ChevronRight,
  Sparkles, ShieldCheck, ListChecks, FileWarning,
} from "lucide-react";

type Tab = "upload" | "queue" | "history" | "review" | "failed";
type Status = "queued" | "processing" | "completed" | "review" | "failed";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "upload",  label: "Upload",        icon: Upload },
  { id: "queue",   label: "Queue",         icon: Clock },
  { id: "history", label: "History",       icon: ListChecks },
  { id: "review",  label: "Manual Review", icon: ShieldCheck },
  { id: "failed",  label: "Failed",        icon: FileWarning },
];

const TINT: Record<string, string> = {
  cyan:    "bg-cyan-500/10 text-cyan-300",
  emerald: "bg-emerald-500/10 text-emerald-300",
  pink:    "bg-pink-500/10 text-pink-300",
  indigo:  "bg-indigo-500/10 text-indigo-300",
  gold:    "bg-amber-500/10 text-amber-300",
  purple:  "bg-purple-500/10 text-purple-300",
  red:     "bg-red-500/10 text-red-300",
};

const STATUS_TINT: Record<Status, string> = {
  queued:     "bg-cyan-500/10 text-cyan-300",
  processing: "bg-indigo-500/10 text-indigo-300",
  completed:  "bg-emerald-500/10 text-emerald-300",
  review:     "bg-amber-500/10 text-amber-300",
  failed:     "bg-red-500/10 text-red-300",
};

type Doc = {
  id: string;
  file: string;
  client: string;
  kind: string;
  status: Status;
  confidence: number;
  uploaded: string;
  pages: number;
};

const DOCS: Doc[] = [
  { id: "OCR-2041", file: "incorporation_certificate.pdf", client: "Aurora Web Studio",   kind: "Certificate",     status: "completed",  confidence: 98, uploaded: "5m ago",   pages: 2 },
  { id: "OCR-2040", file: "memorandum.pdf",                client: "Vertex Software",     kind: "Memorandum",      status: "completed",  confidence: 94, uploaded: "12m ago",  pages: 6 },
  { id: "OCR-2039", file: "utr_letter_hmrc.pdf",           client: "Cobalt Marketing",    kind: "HMRC Letter",     status: "review",     confidence: 71, uploaded: "30m ago",  pages: 1 },
  { id: "OCR-2038", file: "passport_scan.jpg",             client: "Northwind Dental",    kind: "ID Document",     status: "processing", confidence: 0,  uploaded: "1m ago",   pages: 1 },
  { id: "OCR-2037", file: "proof_of_address.pdf",          client: "Bramley Law",         kind: "Address Proof",   status: "queued",     confidence: 0,  uploaded: "Just now", pages: 2 },
  { id: "OCR-2036", file: "auth_code_letter.pdf",          client: "Quokka Kitchen",      kind: "Auth Code",       status: "completed",  confidence: 99, uploaded: "1h ago",   pages: 1 },
  { id: "OCR-2035", file: "vat_certificate.pdf",           client: "Pixel & Pine SEO",    kind: "VAT Certificate", status: "failed",     confidence: 0,  uploaded: "2h ago",   pages: 1 },
  { id: "OCR-2034", file: "annual_accounts_2025.pdf",      client: "Highland Salon Co",   kind: "Accounts",        status: "completed",  confidence: 88, uploaded: "Yesterday",pages: 14 },
  { id: "OCR-2033", file: "id_blurry.heic",                client: "Cobalt Marketing",    kind: "ID Document",     status: "failed",     confidence: 0,  uploaded: "Yesterday",pages: 1 },
];

const EXTRACTED = {
  company: [
    { label: "Company Name",         icon: Building2,   value: "Aurora Web Studio Ltd", confidence: 99 },
    { label: "Company Number",       icon: Hash,        value: "14872113",              confidence: 99 },
    { label: "Authentication Code",  icon: Key,         value: "8X4K-Q2P9-LM3R",        confidence: 92 },
    { label: "UTR",                  icon: Receipt,     value: "1234567890",            confidence: 88 },
    { label: "VAT Number",           icon: PoundSterling,value:"GB 412 9981 03",        confidence: 81 },
  ],
  directors: [
    { name: "Adeel Khan",   role: "Director", appointed: "12 Mar 2024" },
    { name: "Sara Mahmood", role: "Director", appointed: "12 Mar 2024" },
  ],
  address: { line: "Unit 12, Crescent House", city: "London", postcode: "EC1V 9BD", country: "United Kingdom", confidence: 96 },
  dates: [
    { label: "Incorporation",          value: "12 March 2024" },
    { label: "Next Confirmation Stmt", value: "11 March 2026" },
    { label: "Next Accounts",          value: "31 December 2026" },
    { label: "Year End",               value: "31 December" },
  ],
};

export default function OsOcrCenter() {
  const [tab, setTab] = useState<Tab>("upload");
  const [active, setActive] = useState<Doc | null>(null);
  const [q, setQ] = useState("");

  const counts = useMemo(() => ({
    queued:     DOCS.filter(d => d.status === "queued").length,
    processing: DOCS.filter(d => d.status === "processing").length,
    completed:  DOCS.filter(d => d.status === "completed").length,
    review:     DOCS.filter(d => d.status === "review").length,
    failed:     DOCS.filter(d => d.status === "failed").length,
  }), []);

  const filtered = useMemo(() => DOCS.filter(d =>
    (q ? (d.file + d.client + d.kind + d.id).toLowerCase().includes(q.toLowerCase()) : true)
  ), [q]);

  return (
    <div className="space-y-6 os-fade-in">
      {/* Header */}
      <div className="os-glass p-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className={`w-12 h-12 rounded-2xl grid place-items-center ${TINT.cyan}`}>
            <ScanText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-[240px]">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold">OCR Center</h2>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-200 border border-cyan-400/20">
                Document Intelligence
              </span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10">
                Phase 1 · UI
              </span>
            </div>
            <p className="text-sm text-white/50 mt-1 max-w-2xl">
              Upload, queue and review documents. Extracted fields, confidence scores and manual validation surface here once the OCR worker is wired up.
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-3">
          <Kpi label="Queued"     value={counts.queued}     tint="cyan"    icon={Clock} />
          <Kpi label="Processing" value={counts.processing} tint="indigo"  icon={Sparkles} />
          <Kpi label="Completed"  value={counts.completed}  tint="emerald" icon={CheckCircle2} />
          <Kpi label="Review"     value={counts.review}     tint="gold"    icon={AlertTriangle} />
          <Kpi label="Failed"     value={counts.failed}     tint="red"     icon={XCircle} />
        </div>

        {/* Tabs */}
        <div className="mt-5 flex gap-1.5 flex-wrap">
          {TABS.map(t => {
            const Icon = t.icon;
            const a = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition border ${
                  a ? "bg-cyan-500/15 border-cyan-400/30 text-cyan-100"
                    : "bg-white/5 border-white/10 text-white/60 hover:text-white/90 hover:bg-white/10"
                }`}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "upload"  && <UploadPanel />}
      {tab === "queue"   && <QueueTable docs={filtered.filter(d => d.status === "queued" || d.status === "processing")} onOpen={setActive} q={q} setQ={setQ} />}
      {tab === "history" && <QueueTable docs={filtered.filter(d => d.status === "completed")}                            onOpen={setActive} q={q} setQ={setQ} />}
      {tab === "review"  && <ReviewPanel doc={DOCS.find(d => d.status === "review")!} />}
      {tab === "failed"  && <FailedPanel docs={filtered.filter(d => d.status === "failed")} />}

      {active && <DetailDrawer doc={active} onClose={() => setActive(null)} />}
    </div>
  );
}

/* --------------------------- Sub-components ----------------------------- */

function Kpi({ label, value, tint, icon: Icon }: { label: string; value: number; tint: string; icon: any }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg grid place-items-center ${TINT[tint]}`}><Icon className="w-4 h-4" /></div>
      <div>
        <div className="text-xl font-bold leading-none">{value}</div>
        <div className="text-[11px] text-white/50 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const tone = value >= 90 ? "bg-emerald-400/70" : value >= 75 ? "bg-cyan-400/70" : value >= 50 ? "bg-amber-400/70" : "bg-red-400/70";
  const text = value >= 90 ? "text-emerald-300" : value >= 75 ? "text-cyan-300" : value >= 50 ? "text-amber-300" : "text-red-300";
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full ${tone}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-xs font-semibold w-9 text-right ${text}`}>{value || "—"}{value ? "%" : ""}</span>
    </div>
  );
}

/* ---------- Upload panel ---------- */

function UploadPanel() {
  const supported = [
    { label: "PDF",   note: "Up to 50 pages" },
    { label: "JPG",   note: "Recommended ≥ 300 DPI" },
    { label: "PNG",   note: "Recommended ≥ 300 DPI" },
    { label: "WEBP",  note: "Best quality" },
    { label: "DOCX",  note: "Auto-rasterised" },
    { label: "HEIC",  note: "Convert before upload" },
  ];
  const recent = DOCS.slice(0, 4);
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="os-glass p-10 border-dashed">
          <div className="border-2 border-dashed border-white/15 rounded-2xl p-10 text-center hover:border-cyan-400/40 hover:bg-cyan-500/5 transition cursor-pointer">
            <div className={`w-14 h-14 rounded-2xl grid place-items-center ${TINT.cyan} mx-auto`}>
              <Upload className="w-6 h-6" />
            </div>
            <div className="mt-4 font-semibold">Drop documents here</div>
            <p className="text-xs text-white/50 mt-1">or click to browse · max 20 MB per file · up to 10 at once</p>
            <button disabled className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-100 text-sm cursor-not-allowed">
              <Upload className="w-4 h-4" /> Choose Files · Soon
            </button>
          </div>
        </div>

        <div className="os-glass p-5">
          <div className="text-xs uppercase tracking-wider text-white/40 mb-3">Recent Uploads</div>
          <div className="space-y-2">
            {recent.map(d => (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                <div className={`w-9 h-9 rounded-lg grid place-items-center ${TINT.indigo}`}><FileText className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{d.file}</div>
                  <div className="text-[11px] text-white/50">{d.client} · {d.kind} · {d.pages} pp</div>
                </div>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_TINT[d.status]}`}>{d.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="os-glass p-5">
          <div className="text-xs uppercase tracking-wider text-white/40 mb-3">Supported Formats</div>
          <div className="grid grid-cols-2 gap-2">
            {supported.map(s => (
              <div key={s.label} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="text-sm font-semibold">{s.label}</div>
                <div className="text-[11px] text-white/50 mt-0.5">{s.note}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="os-glass p-5">
          <div className="text-xs uppercase tracking-wider text-white/40 mb-3">Pipeline</div>
          <ol className="space-y-2 text-sm">
            {["Upload received", "Queued for worker", "Text + field extraction", "Confidence scoring", "Auto-attach to client"].map((s, i) => (
              <li key={s} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 grid place-items-center text-[11px] text-white/60">{i + 1}</span>
                <span className="text-white/80">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

/* ---------- Queue / History table ---------- */

function QueueTable({ docs, onOpen, q, setQ }: { docs: Doc[]; onOpen: (d: Doc) => void; q: string; setQ: (v: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="os-glass p-3 flex gap-2 flex-wrap items-center">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-white/40" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search file, client, kind…"
            className="bg-transparent text-sm outline-none flex-1 placeholder:text-white/30" />
        </div>
        <button className="px-3 py-1.5 rounded-lg text-sm bg-white/5 border border-white/10 inline-flex items-center gap-2">
          <Filter className="w-3.5 h-3.5" /> Filters
        </button>
        <span className="text-xs text-white/40 px-2">{docs.length} documents</span>
      </div>

      <div className="os-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-white/50 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">ID</th>
                <th className="text-left px-4 py-3">File</th>
                <th className="text-left px-4 py-3">Client</th>
                <th className="text-left px-4 py-3">Kind</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Confidence</th>
                <th className="text-left px-4 py-3">Uploaded</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {docs.map(d => (
                <tr key={d.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-mono text-xs text-white/60">{d.id}</td>
                  <td className="px-4 py-3 font-medium truncate max-w-[220px]">{d.file}</td>
                  <td className="px-4 py-3 text-white/70">{d.client}</td>
                  <td className="px-4 py-3 text-white/60">{d.kind}</td>
                  <td className="px-4 py-3"><span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_TINT[d.status]}`}>{d.status}</span></td>
                  <td className="px-4 py-3"><ConfidenceBar value={d.confidence} /></td>
                  <td className="px-4 py-3 text-white/60">{d.uploaded}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => onOpen(d)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-xs">
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  </td>
                </tr>
              ))}
              {docs.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-white/40">No documents in this view.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------- Manual Review panel ---------- */

function ReviewPanel({ doc }: { doc?: Doc }) {
  if (!doc) return <div className="os-glass p-10 text-center text-sm text-white/50">Nothing waiting for review.</div>;
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Preview */}
      <div className="os-glass p-5">
        <div className="text-xs uppercase tracking-wider text-white/40 mb-3">Document Preview</div>
        <div className="aspect-[3/4] rounded-xl bg-white/[0.03] border border-white/10 grid place-items-center">
          <div className="text-center">
            <FileText className="w-10 h-10 text-white/30 mx-auto" />
            <div className="mt-2 text-sm font-medium">{doc.file}</div>
            <div className="text-[11px] text-white/50">{doc.pages} page{doc.pages > 1 ? "s" : ""} · {doc.kind}</div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="text-white/60">{doc.client}</span>
          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_TINT[doc.status]}`}>{doc.status}</span>
        </div>
      </div>

      {/* Extracted */}
      <div className="lg:col-span-2 space-y-4">
        <div className="os-glass p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">Extracted Fields</div>
            <div className="text-xs text-white/50">Overall confidence · {doc.confidence}%</div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {EXTRACTED.company.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-cyan-300" />
                    <span className="text-[11px] uppercase tracking-wider text-white/50">{f.label}</span>
                  </div>
                  <input defaultValue={f.value} className="mt-2 w-full bg-transparent text-sm font-medium outline-none border-b border-white/10 focus:border-cyan-400/40 pb-1" />
                  <div className="mt-2"><ConfidenceBar value={f.confidence} /></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="os-glass p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-purple-300" />
              <div className="text-sm font-semibold">Directors</div>
            </div>
            <ul className="space-y-2 text-sm">
              {EXTRACTED.directors.map(d => (
                <li key={d.name} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/5">
                  <div>
                    <div className="font-medium">{d.name}</div>
                    <div className="text-[11px] text-white/50">{d.role} · since {d.appointed}</div>
                  </div>
                  <button className="text-[11px] text-cyan-300 hover:text-cyan-100">Edit</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="os-glass p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-pink-300" />
              <div className="text-sm font-semibold">Registered Address</div>
              <span className="ml-auto text-[10px] text-emerald-300">{EXTRACTED.address.confidence}%</span>
            </div>
            <div className="text-sm space-y-0.5">
              <div>{EXTRACTED.address.line}</div>
              <div className="text-white/70">{EXTRACTED.address.city} · {EXTRACTED.address.postcode}</div>
              <div className="text-white/50 text-xs">{EXTRACTED.address.country}</div>
            </div>
          </div>
        </div>

        <div className="os-glass p-5">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4 text-amber-300" />
            <div className="text-sm font-semibold">Important Dates</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {EXTRACTED.dates.map(d => (
              <div key={d.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="text-[11px] uppercase tracking-wider text-white/40">{d.label}</div>
                <div className="text-sm font-semibold mt-1">{d.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Validation Panel */}
        <div className="os-glass p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <div className="text-sm font-semibold">Validation</div>
          </div>
          <ul className="space-y-2 text-sm">
            <ValidationRow ok label="Company number matches Companies House format" />
            <ValidationRow ok label="UTR is 10 digits" />
            <ValidationRow warn label="VAT confidence below 85% — please verify" />
            <ValidationRow ok label="Postcode resolves to a valid UK address" />
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-100 text-sm">
              <Check className="w-4 h-4" /> Approve & Attach
            </button>
            <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-400/30 text-amber-100 text-sm">
              <RotateCcw className="w-4 h-4" /> Re-run OCR
            </button>
            <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 text-sm">
              <X className="w-4 h-4" /> Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ValidationRow({ ok, warn, label }: { ok?: boolean; warn?: boolean; label: string }) {
  const Icon = warn ? AlertTriangle : ok ? CheckCircle2 : XCircle;
  const tone = warn ? "text-amber-300" : ok ? "text-emerald-300" : "text-red-300";
  return (
    <li className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${tone}`} />
      <span className="text-white/80">{label}</span>
    </li>
  );
}

/* ---------- Failed panel ---------- */

function FailedPanel({ docs }: { docs: Doc[] }) {
  const reasons: Record<string, string> = {
    "OCR-2035": "PDF was password-protected.",
    "OCR-2033": "HEIC format not supported — ask client to upload JPG or PNG.",
  };
  return (
    <div className="space-y-3">
      {docs.map(d => (
        <div key={d.id} className="os-glass p-4 flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl grid place-items-center ${TINT.red}`}><XCircle className="w-4 h-4" /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{d.file}</span>
              <span className="text-[11px] text-white/50">{d.client} · {d.kind}</span>
            </div>
            <div className="text-xs text-red-200/80 mt-1">{reasons[d.id] ?? "Worker exited unexpectedly."}</div>
          </div>
          <div className="flex gap-1">
            <button className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs inline-flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" /> Retry</button>
            <button className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs inline-flex items-center gap-1"><X className="w-3.5 h-3.5" /> Dismiss</button>
          </div>
        </div>
      ))}
      {docs.length === 0 && <div className="os-glass p-10 text-center text-sm text-white/50">No failed documents 🎉</div>}
    </div>
  );
}

/* ---------- Detail drawer ---------- */

function DetailDrawer({ doc, onClose }: { doc: Doc; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md h-full bg-[#0b0f1a] border-l border-white/10 p-6 overflow-y-auto os-fade-in">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl grid place-items-center ${TINT.cyan}`}><FileText className="w-4 h-4" /></div>
            <div>
              <div className="text-xs uppercase tracking-wider text-white/40">{doc.id}</div>
              <div className="font-semibold leading-tight">{doc.file}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 grid place-items-center"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex gap-2 mt-4 flex-wrap">
          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_TINT[doc.status]}`}>{doc.status}</span>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10">{doc.kind}</span>
        </div>

        <dl className="mt-6 space-y-3 text-sm">
          <Field label="Client"     value={doc.client} />
          <Field label="Pages"      value={String(doc.pages)} />
          <Field label="Uploaded"   value={doc.uploaded} />
          <Field label="Confidence" value={doc.confidence ? `${doc.confidence}%` : "—"} />
        </dl>

        <div className="mt-6">
          <div className="text-xs uppercase tracking-wider text-white/40 mb-2">Extracted Snapshot</div>
          <div className="space-y-2 text-sm">
            {EXTRACTED.company.slice(0, 3).map(f => (
              <div key={f.label} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/5">
                <span className="text-white/55 text-xs">{f.label}</span>
                <span className="font-medium">{f.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/15 text-cyan-100 px-3 py-2.5 text-sm"><Eye className="w-4 h-4" /> Open Review</button>
          <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-white/80 px-3 py-2.5 text-sm"><ChevronRight className="w-4 h-4" /> Open Client</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-white/40">{label}</dt>
      <dd className="text-white/90 mt-0.5">{value}</dd>
    </div>
  );
}
