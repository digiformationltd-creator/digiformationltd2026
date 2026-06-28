// Email Marketing AI Agent — Phase 1
// Prospect management UI: CSV import, manual add, classify, assign campaign.
// No sending logic here — sequencing/sending is Phase 2.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Upload, Plus, Search, Filter, Trash2, Users, CheckCircle2,
  XCircle, FileSpreadsheet, Download, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Campaign =
  | "idv_acsp" | "uk_formation" | "banking"
  | "compliance" | "ai_dashboard" | "website_dev";

type Status = "new" | "qualified" | "rejected" | "enrolled" | "replied" | "completed";
type Size = "micro" | "small" | "medium" | "established" | "unknown";

type Prospect = {
  id: string;
  business_name: string;
  contact_email: string | null;
  contact_name: string | null;
  website: string | null;
  has_website: boolean;
  business_type: string | null;
  industry: string | null;
  location: string | null;
  country: string | null;
  size_category: Size;
  source: string;
  assigned_campaign: Campaign | null;
  status: Status;
  is_existing_customer: boolean;
  notes: string | null;
  tags: string[];
  created_at: string;
};

const CAMPAIGNS: { id: Campaign; label: string; hint: string }[] = [
  { id: "idv_acsp",     label: "UK Identity Verification (ACSP)", hint: "Highest priority — Pakistani founders" },
  { id: "uk_formation", label: "UK Company Formation",            hint: "UK LTD registration" },
  { id: "banking",      label: "UK / US Business Banking",        hint: "Match by business type" },
  { id: "compliance",   label: "Compliance Services",             hint: "CS, accounts, PSC, director changes" },
  { id: "ai_dashboard", label: "AI Business Dashboard",           hint: "Restaurants, clinics, schools" },
  { id: "website_dev",  label: "Website Development",             hint: "Only for companies w/o website" },
];

const STATUS_TINT: Record<Status, string> = {
  new:       "bg-white/5 text-white/60",
  qualified: "bg-cyan-500/10 text-cyan-300",
  rejected:  "bg-red-500/10 text-red-300",
  enrolled:  "bg-emerald-500/10 text-emerald-300",
  replied:   "bg-purple-500/10 text-purple-300",
  completed: "bg-amber-500/10 text-amber-300",
};

const SIZE_LABEL: Record<Size, string> = {
  micro: "Micro", small: "Small", medium: "Medium",
  established: "Established", unknown: "Unknown",
};

export default function ProspectsPanel() {
  const [rows, setRows] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState<Status | "all">("all");
  const [campF, setCampF] = useState<Campaign | "all" | "none">("all");
  const [showImport, setShowImport] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_prospects")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast({ title: "Failed to load prospects", description: error.message, variant: "destructive" });
    setRows((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    if (statusF !== "all" && r.status !== statusF) return false;
    if (campF === "none" && r.assigned_campaign) return false;
    if (campF !== "all" && campF !== "none" && r.assigned_campaign !== campF) return false;
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      r.business_name.toLowerCase().includes(s) ||
      (r.contact_email ?? "").toLowerCase().includes(s) ||
      (r.location ?? "").toLowerCase().includes(s) ||
      (r.industry ?? "").toLowerCase().includes(s)
    );
  }), [rows, q, statusF, campF]);

  const counts = useMemo(() => {
    const c = { total: rows.length, new: 0, qualified: 0, enrolled: 0, replied: 0, rejected: 0 };
    for (const r of rows) (c as any)[r.status]++;
    return c;
  }, [rows]);

  const updateProspect = async (id: string, patch: Partial<Prospect>) => {
    const { error } = await supabase.from("email_prospects").update(patch).eq("id", id);
    if (error) { toast({ title: "Update failed", description: error.message, variant: "destructive" }); return; }
    setRows((rs) => rs.map((r) => r.id === id ? { ...r, ...patch } as Prospect : r));
  };

  const removeProspect = async (id: string) => {
    if (!confirm("Delete this prospect?")) return;
    const { error } = await supabase.from("email_prospects").delete().eq("id", id);
    if (error) { toast({ title: "Delete failed", description: error.message, variant: "destructive" }); return; }
    setRows((rs) => rs.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Stat label="Total"     value={counts.total}     tint="bg-white/5 text-white/70" />
        <Stat label="New"       value={counts.new}       tint="bg-cyan-500/10 text-cyan-300" />
        <Stat label="Qualified" value={counts.qualified} tint="bg-indigo-500/10 text-indigo-300" />
        <Stat label="Enrolled"  value={counts.enrolled}  tint="bg-emerald-500/10 text-emerald-300" />
        <Stat label="Replied"   value={counts.replied}   tint="bg-purple-500/10 text-purple-300" />
        <Stat label="Rejected"  value={counts.rejected}  tint="bg-red-500/10 text-red-300" />
      </div>

      {/* Toolbar */}
      <div className="os-glass p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, location, industry…"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-white/20"
          />
        </div>
        <select value={statusF} onChange={(e) => setStatusF(e.target.value as any)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm">
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="qualified">Qualified</option>
          <option value="enrolled">Enrolled</option>
          <option value="replied">Replied</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
        </select>
        <select value={campF} onChange={(e) => setCampF(e.target.value as any)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm">
          <option value="all">All campaigns</option>
          <option value="none">— Unassigned —</option>
          {CAMPAIGNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <button onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm border border-white/10">
          <Plus className="w-4 h-4" /> Add
        </button>
        <button onClick={() => setShowImport(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 text-sm border border-cyan-400/20">
          <Upload className="w-4 h-4" /> Import CSV
        </button>
      </div>

      {/* List */}
      <div className="os-glass overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-white/40 text-sm">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="w-8 h-8 text-white/30 mx-auto mb-3" />
            <div className="font-semibold">No prospects</div>
            <div className="text-sm text-white/50 mt-1">Import a CSV or add one manually to get started.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-white/50 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Business</th>
                  <th className="text-left px-4 py-3">Contact</th>
                  <th className="text-left px-4 py-3">Type / Location</th>
                  <th className="text-left px-4 py-3">Website</th>
                  <th className="text-left px-4 py-3">Size</th>
                  <th className="text-left px-4 py-3">Campaign</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 200).map((r) => (
                  <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white/90 truncate max-w-[200px]">{r.business_name}</div>
                      {r.is_existing_customer && (
                        <span className="text-[10px] uppercase tracking-wider text-emerald-300/80">Existing customer</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/70">
                      <div className="truncate max-w-[200px]">{r.contact_email ?? "—"}</div>
                      {r.contact_name && <div className="text-xs text-white/40">{r.contact_name}</div>}
                    </td>
                    <td className="px-4 py-3 text-white/60">
                      <div className="truncate max-w-[180px]">{r.industry ?? r.business_type ?? "—"}</div>
                      <div className="text-xs text-white/40 truncate max-w-[180px]">{r.location ?? r.country ?? ""}</div>
                    </td>
                    <td className="px-4 py-3">
                      {r.has_website ? (
                        <a href={r.website ?? "#"} target="_blank" rel="noreferrer"
                          className="text-cyan-300 hover:underline text-xs truncate inline-block max-w-[160px]">
                          {(r.website ?? "").replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        <span className="text-amber-300/80 text-xs">No website</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/60 text-xs">{SIZE_LABEL[r.size_category]}</td>
                    <td className="px-4 py-3">
                      <select
                        value={r.assigned_campaign ?? ""}
                        onChange={(e) => updateProspect(r.id, { assigned_campaign: (e.target.value || null) as any })}
                        className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs max-w-[180px]">
                        <option value="">— None —</option>
                        {CAMPAIGNS.map((c) => (
                          <option key={c.id} value={c.id}
                            disabled={c.id === "website_dev" && r.has_website}>
                            {c.label}{c.id === "website_dev" && r.has_website ? " (has website)" : ""}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={r.status}
                        onChange={(e) => updateProspect(r.id, { status: e.target.value as Status })}
                        className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${STATUS_TINT[r.status]}`}>
                        <option value="new">new</option>
                        <option value="qualified">qualified</option>
                        <option value="enrolled">enrolled</option>
                        <option value="replied">replied</option>
                        <option value="rejected">rejected</option>
                        <option value="completed">completed</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => removeProspect(r.id)}
                        className="text-white/30 hover:text-red-300 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 200 && (
              <div className="text-xs text-white/40 text-center py-3">
                Showing first 200 of {filtered.length}. Refine filters to narrow down.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Campaign reference */}
      <div className="os-glass p-4">
        <div className="text-xs uppercase tracking-wider text-white/40 mb-2">Campaign reference</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
          {CAMPAIGNS.map((c) => (
            <div key={c.id} className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
              <div className="text-white/80 font-medium">{c.label}</div>
              <div className="text-white/40 mt-0.5">{c.hint}</div>
            </div>
          ))}
        </div>
      </div>

      {showImport && <ImportModal onClose={() => setShowImport(false)} onDone={load} />}
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onDone={load} />}
    </div>
  );
}

function Stat({ label, value, tint }: { label: string; value: number; tint: string }) {
  return (
    <div className="os-glass p-3">
      <div className={`inline-flex text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${tint}`}>{label}</div>
      <div className="text-2xl font-bold mt-2">{value.toLocaleString()}</div>
    </div>
  );
}

/* ---------------- Add prospect (manual) ---------------- */

function AddModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    business_name: "", contact_email: "", contact_name: "", website: "",
    business_type: "", industry: "", location: "", country: "",
    size_category: "unknown" as Size, is_existing_customer: false,
    assigned_campaign: "" as Campaign | "", notes: "",
  });

  const save = async () => {
    if (!form.business_name.trim()) { toast({ title: "Business name is required", variant: "destructive" }); return; }
    setBusy(true);
    const { error } = await supabase.from("email_prospects").insert({
      ...form,
      contact_email: form.contact_email.trim() || null,
      contact_name: form.contact_name.trim() || null,
      website: form.website.trim() || null,
      business_type: form.business_type.trim() || null,
      industry: form.industry.trim() || null,
      location: form.location.trim() || null,
      country: form.country.trim() || null,
      notes: form.notes.trim() || null,
      assigned_campaign: form.assigned_campaign || null,
      source: "manual",
    });
    setBusy(false);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Prospect added" });
    onDone(); onClose();
  };

  const I = (k: keyof typeof form, label: string, type = "text") => (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-white/40 mb-1">{label}</div>
      <input type={type} value={form[k] as any}
        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/20" />
    </div>
  );

  return (
    <Modal title="Add prospect" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        {I("business_name", "Business name *")}
        {I("contact_email", "Contact email", "email")}
        {I("contact_name", "Contact name")}
        {I("website", "Website (URL)", "url")}
        {I("industry", "Industry")}
        {I("business_type", "Business type")}
        {I("location", "Location / City")}
        {I("country", "Country")}
        <div>
          <div className="text-[11px] uppercase tracking-wider text-white/40 mb-1">Size</div>
          <select value={form.size_category}
            onChange={(e) => setForm({ ...form, size_category: e.target.value as Size })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm">
            {Object.entries(SIZE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-white/40 mb-1">Campaign</div>
          <select value={form.assigned_campaign}
            onChange={(e) => setForm({ ...form, assigned_campaign: e.target.value as any })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm">
            <option value="">— None —</option>
            {CAMPAIGNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 mt-3 text-sm text-white/70">
        <input type="checkbox" checked={form.is_existing_customer}
          onChange={(e) => setForm({ ...form, is_existing_customer: e.target.checked })} />
        Existing DigiFormation customer
      </label>
      <div className="mt-3">
        <div className="text-[11px] uppercase tracking-wider text-white/40 mb-1">Notes</div>
        <textarea rows={2} value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm" />
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg bg-white/5 hover:bg-white/10">Cancel</button>
        <button onClick={save} disabled={busy}
          className="px-4 py-2 text-sm rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-100 border border-cyan-400/20 disabled:opacity-50">
          {busy ? "Saving…" : "Save prospect"}
        </button>
      </div>
    </Modal>
  );
}

/* ---------------- CSV import ---------------- */

function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const parse = async (f: File) => {
    const text = await f.text();
    const rows = parseCSV(text);
    setPreview(rows.slice(0, 5));
  };

  const onFile = (f: File | null) => {
    setFile(f); setResult(null); setPreview([]);
    if (f) parse(f);
  };

  const importNow = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      const { data: { user } } = await supabase.auth.getUser();

      // create batch
      const { data: batch } = await supabase.from("email_prospect_imports").insert({
        filename: file.name, row_count: rows.length, created_by: user?.id ?? null,
      }).select("id").single();
      const batchId = batch?.id;

      // map rows
      const records = rows
        .filter((r) => (r.business_name || r.name || r.company || "").trim())
        .map((r) => ({
          business_name: (r.business_name || r.name || r.company || "").trim(),
          contact_email: pick(r, ["contact_email", "email"])?.toLowerCase() || null,
          contact_name: pick(r, ["contact_name", "contact"]) || null,
          website: pick(r, ["website", "url", "site"]) || null,
          business_type: pick(r, ["business_type", "type"]) || null,
          industry: pick(r, ["industry", "category"]) || null,
          location: pick(r, ["location", "city"]) || null,
          country: pick(r, ["country"]) || null,
          size_category: (pick(r, ["size", "size_category"]) as Size) || "unknown",
          assigned_campaign: (pick(r, ["campaign", "assigned_campaign"]) as Campaign) || null,
          notes: pick(r, ["notes"]) || null,
          source: "csv",
          imported_batch: batchId ?? null,
          created_by: user?.id ?? null,
        }));

      // chunked insert with ignore-duplicates
      let inserted = 0;
      const CHUNK = 100;
      for (let i = 0; i < records.length; i += CHUNK) {
        const slice = records.slice(i, i + CHUNK);
        const { data, error } = await supabase
          .from("email_prospects")
          .upsert(slice as any, { onConflict: "contact_email", ignoreDuplicates: true })
          .select("id");
        if (error) { console.warn("chunk error", error); continue; }
        inserted += data?.length ?? 0;
      }
      const skipped = records.length - inserted;

      if (batchId) {
        await supabase.from("email_prospect_imports")
          .update({ inserted_count: inserted, skipped_count: skipped })
          .eq("id", batchId);
      }

      setResult({ inserted, skipped });
      toast({ title: "Import complete", description: `Inserted ${inserted}, skipped ${skipped}.` });
      onDone();
    } catch (e: any) {
      toast({ title: "Import failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const sample = "business_name,contact_email,contact_name,website,industry,business_type,location,country,size,campaign,notes\nAcme Studio,owner@acme.com,Jane Doe,https://acme.com,Marketing,Agency,Lahore,Pakistan,medium,uk_formation,Referred by partner";

  return (
    <Modal title="Import prospects (CSV)" onClose={onClose} wide>
      <div className="text-sm text-white/60 mb-3">
        Upload a CSV with these column headers (any subset, case-insensitive):
        <code className="block mt-2 px-3 py-2 rounded bg-white/5 text-[11px] text-white/70 overflow-x-auto">
          business_name, contact_email, contact_name, website, industry, business_type, location, country, size, campaign, notes
        </code>
        <div className="text-xs text-white/40 mt-1">
          <code>size</code> values: micro / small / medium / established / unknown. <code>campaign</code> values: idv_acsp / uk_formation / banking / compliance / ai_dashboard / website_dev. Duplicates (by email) are skipped automatically.
        </div>
        <button
          onClick={() => downloadText("digiformation-prospects-sample.csv", sample)}
          className="inline-flex items-center gap-1.5 mt-3 text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/70">
          <Download className="w-3.5 h-3.5" /> Download sample CSV
        </button>
      </div>

      <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center">
        <input ref={fileRef} type="file" accept=".csv,text/csv" hidden
          onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
        <FileSpreadsheet className="w-8 h-8 mx-auto text-white/30 mb-2" />
        <div className="text-sm text-white/70">{file ? file.name : "Choose a CSV file"}</div>
        <button onClick={() => fileRef.current?.click()}
          className="mt-3 px-4 py-2 text-sm rounded-lg bg-white/5 hover:bg-white/10">
          {file ? "Change file" : "Select file"}
        </button>
      </div>

      {preview.length > 0 && (
        <div className="mt-4">
          <div className="text-[11px] uppercase tracking-wider text-white/40 mb-2">Preview (first 5 rows)</div>
          <div className="os-glass overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-white/5 text-white/50">
                <tr>{Object.keys(preview[0]).map((k) => <th key={k} className="text-left px-3 py-2">{k}</th>)}</tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} className="border-t border-white/5">
                    {Object.keys(preview[0]).map((k) => <td key={k} className="px-3 py-2 text-white/70 truncate max-w-[180px]">{r[k]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-4 os-glass p-3 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-white/80">Inserted <b>{result.inserted}</b>, skipped <b>{result.skipped}</b> (duplicates).</span>
        </div>
      )}

      <div className="flex justify-end gap-2 mt-5">
        <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg bg-white/5 hover:bg-white/10">Close</button>
        <button onClick={importNow} disabled={!file || busy}
          className="px-4 py-2 text-sm rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-100 border border-cyan-400/20 disabled:opacity-50 inline-flex items-center gap-2">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {busy ? "Importing…" : "Import"}
        </button>
      </div>
    </Modal>
  );
}

/* ---------------- shared ---------------- */

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className={`os-glass w-full ${wide ? "max-w-3xl" : "max-w-2xl"} p-5 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold">{title}</div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1"><XCircle className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function pick(r: Record<string, string>, keys: string[]) {
  for (const k of keys) {
    const v = r[k];
    if (v && v.trim()) return v.trim();
  }
  return "";
}

// Minimal RFC4180-ish CSV parser (handles quoted fields, commas, escaped quotes).
function parseCSV(text: string): Record<string, string>[] {
  const out: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') { inQ = false; }
      else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n") { row.push(cur); out.push(row); row = []; cur = ""; }
      else if (c === "\r") { /* skip */ }
      else cur += c;
    }
  }
  if (cur.length || row.length) { row.push(cur); out.push(row); }
  if (out.length === 0) return [];
  const headers = out[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return out.slice(1).filter((r) => r.some((v) => v.trim())).map((r) => {
    const o: Record<string, string> = {};
    headers.forEach((h, i) => { o[h] = (r[i] ?? "").trim(); });
    return o;
  });
}

function downloadText(name: string, content: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
