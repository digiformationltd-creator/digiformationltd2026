import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Building2, Upload, Plus, Search, AlertTriangle, CalendarClock,
  CheckCircle2, XCircle, Clock, Loader2, FileSpreadsheet, Trash2,
} from "lucide-react";

type Status = "available" | "reserved" | "sold_out" | "unavailable";

type Row = {
  id: string;
  company_name: string;
  company_number: string | null;
  incorporation_date: string | null;
  sic_code: string | null;
  registered_address: string | null;
  confirmation_due: string | null;
  accounts_filing_due: string | null;
  address_expire: string | null;
  status: Status;
  notes: string | null;
  imported_batch: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_META: Record<Status, { label: string; color: string; icon: any }> = {
  available:   { label: "Available",   color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", icon: CheckCircle2 },
  reserved:    { label: "Reserved",    color: "bg-amber-500/20 text-amber-300 border-amber-500/40",       icon: Clock },
  sold_out:    { label: "Sold Out",    color: "bg-rose-500/20 text-rose-300 border-rose-500/40",          icon: XCircle },
  unavailable: { label: "Unavailable", color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/40",          icon: XCircle },
};

// Map flexible header names → DB columns
const HEADER_MAP: Record<string, string> = {
  "company name": "company_name", "name": "company_name", "company": "company_name",
  "company number": "company_number", "number": "company_number", "companies house number": "company_number", "crn": "company_number",
  "incorporation date": "incorporation_date", "incorporated": "incorporation_date", "incorporated on": "incorporation_date",
  "sic": "sic_code", "sic code": "sic_code", "sic codes": "sic_code",
  "registered address": "registered_address", "address": "registered_address",
  "ch address": "ch_address", "companies house address": "ch_address",
  "previous address": "previous_address",
  "previous name": "previous_name",
  "director": "director", "current director": "director",
  "original director": "original_director",
  "auth code": "auth_code", "authentication code": "auth_code",
  "utr": "utr_number", "utr number": "utr_number",
  "ad01 filing date": "ad01_filing_date", "ad01 date": "ad01_filing_date",
  "address status": "address_status",
  "confirmation due": "confirmation_due", "confirmation statement due": "confirmation_due", "cs due": "confirmation_due",
  "accounts due": "accounts_filing_due", "annual accounts due": "accounts_filing_due", "accounts filing due": "accounts_filing_due",
  "accounts next due": "accounts_filing_due", "next accounts due": "accounts_filing_due",
  "address expire": "address_expire", "address renewal": "address_expire", "address expiry": "address_expire",
  "status": "raw_status",
  "notes": "notes",
};

function parseDate(v: any): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${d.y}-${String(d.m).padStart(2,"0")}-${String(d.d).padStart(2,"0")}`;
  }
  const s = String(v).trim();
  if (!s) return null;
  const dmy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (dmy) {
    let [, d, m, y] = dmy;
    if (y.length === 2) y = "20" + y;
    return `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
  }
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return null;
}

function normaliseStatus(rawStatus: any, addressStatus: any): Status {
  const s = String(rawStatus || "").toLowerCase().trim();
  const a = String(addressStatus || "").toLowerCase().trim();
  if (s.includes("sold")) return "sold_out";
  if (s.includes("reserv")) return "reserved";
  if (s.includes("strike") || s.includes("dissolv") || s.includes("unavail") || s.includes("no longer")) return "unavailable";
  if (a.includes("default")) return "unavailable";
  return "available";
}

function cleanStr(v: any): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s || s.toLowerCase() === "nan") return null;
  // Convert scientific-notation numbers (e.g. UTR shown as 1.686100e+12)
  if (/^\d+(\.\d+)?e[+-]?\d+$/i.test(s)) {
    const n = Number(s);
    if (!isNaN(n) && isFinite(n)) return String(Math.round(n));
  }
  return s;
}

export default function OsManagedCompanies() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [importing, setImporting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("managed_companies")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load: " + error.message);
    setRows((data as Row[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q.trim()) return true;
      const needle = q.toLowerCase();
      return [r.company_name, r.company_number, r.sic_code, r.registered_address, r.notes]
        .some(v => v?.toLowerCase().includes(needle));
    });
  }, [rows, q, statusFilter]);

  const stats = useMemo(() => {
    const s = { total: rows.length, available: 0, reserved: 0, sold_out: 0, unavailable: 0, reminders_active: 0, missing_dates: 0 };
    for (const r of rows) {
      s[r.status]++;
      if (r.status !== "sold_out" && r.status !== "unavailable") {
        s.reminders_active++;
        if (!r.confirmation_due && !r.accounts_filing_due && !r.address_expire) s.missing_dates++;
      }
    }
    return s;
  }, [rows]);

  const handleFile = async (file: File) => {
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: null, raw: false });
      if (!raw.length) { toast.error("File is empty"); return; }

      const batch = `import-${new Date().toISOString()}`;
      const records: any[] = [];
      const errors: string[] = [];

      for (const [i, row] of raw.entries()) {
        const mapped: any = { imported_batch: batch };
        for (const [k, v] of Object.entries(row)) {
          const key = HEADER_MAP[k.toLowerCase().trim()];
          if (!key) continue;
          mapped[key] = v;
        }
        if (!mapped.company_name) { errors.push(`Row ${i+2}: missing company name`); continue; }
        mapped.company_name = String(mapped.company_name).trim();
        if (mapped.company_number) mapped.company_number = String(mapped.company_number).trim();
        mapped.incorporation_date = parseDate(mapped.incorporation_date);
        mapped.confirmation_due   = parseDate(mapped.confirmation_due);
        mapped.accounts_filing_due = parseDate(mapped.accounts_filing_due);
        mapped.address_expire     = parseDate(mapped.address_expire);
        mapped.status             = normaliseStatus(mapped.status);
        records.push(mapped);
      }

      if (!records.length) { toast.error("No valid rows"); return; }

      // Upsert: dedupe by company_number when present, otherwise insert
      let inserted = 0, updated = 0, failed = 0;
      for (const rec of records) {
        let res;
        if (rec.company_number) {
          const { data: existing } = await supabase
            .from("managed_companies")
            .select("id")
            .ilike("company_number", rec.company_number)
            .maybeSingle();
          if (existing) {
            res = await supabase.from("managed_companies").update(rec).eq("id", existing.id);
            if (!res.error) updated++; else failed++;
            continue;
          }
        }
        res = await supabase.from("managed_companies").insert(rec);
        if (!res.error) inserted++; else { failed++; console.error(res.error); }
      }

      toast.success(`Import complete: ${inserted} new, ${updated} updated${failed?`, ${failed} failed`:""}${errors.length?`, ${errors.length} skipped`:""}`);
      if (errors.length) console.warn("Skipped rows:", errors);
      load();
    } catch (e: any) {
      toast.error("Import failed: " + (e?.message || String(e)));
    } finally {
      setImporting(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const updateStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from("managed_companies").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Status updated to ${STATUS_META[status].label}`); load(); }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Company Name","Company Number","Incorporation Date","SIC Code","Registered Address","Confirmation Due","Accounts Filing Due","Address Expire","Status","Notes"],
      ["Example Trading Ltd","12345678","2023-04-15","62020","1 Example St, London, EC1A 1AA","2025-04-30","2025-12-31","2026-04-15","Available","Optional notes"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Companies");
    XLSX.writeFile(wb, "managed-companies-template.xlsx");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="w-6 h-6 text-blue-400" /> Managed Companies</h1>
          <p className="text-sm text-zinc-400 mt-1">Internal company inventory. Reminders are sent to <code className="text-zinc-300">digiformationltd@gmail.com</code> only — never to customers.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadTemplate} className="px-3 py-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-sm flex items-center gap-2 border border-zinc-700">
            <FileSpreadsheet className="w-4 h-4" /> Template
          </button>
          <input ref={fileInput} type="file" accept=".csv,.xlsx,.xls" hidden
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <button
            onClick={() => fileInput.current?.click()}
            disabled={importing}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold flex items-center gap-2 disabled:opacity-60">
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {importing ? "Importing…" : "Import CSV/Excel"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Stat label="Total" value={stats.total} icon={Building2} color="text-blue-300" />
        <Stat label="Available" value={stats.available} icon={CheckCircle2} color="text-emerald-300" />
        <Stat label="Reserved" value={stats.reserved} icon={Clock} color="text-amber-300" />
        <Stat label="Sold Out" value={stats.sold_out} icon={XCircle} color="text-rose-300" />
        <Stat label="Reminders Active" value={stats.reminders_active} icon={CalendarClock} color="text-cyan-300" />
        <Stat label="Missing Dates" value={stats.missing_dates} icon={AlertTriangle} color="text-orange-300" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, number, SIC, notes…"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-sm focus:outline-none focus:border-blue-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-sm">
          <option value="all">All statuses</option>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="sold_out">Sold Out</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            {rows.length === 0 ? (
              <>
                <Upload className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <div className="text-sm">No companies yet. Download the template, fill it in, then import.</div>
              </>
            ) : "No matches"}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/60 text-zinc-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Company</th>
                <th className="text-left px-4 py-3">Number</th>
                <th className="text-left px-4 py-3">CS Due</th>
                <th className="text-left px-4 py-3">Accounts Due</th>
                <th className="text-left px-4 py-3">Address Expiry</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const m = STATUS_META[r.status];
                const Icon = m.icon;
                return (
                  <tr key={r.id} className="border-t border-zinc-900 hover:bg-zinc-900/40">
                    <td className="px-4 py-3">
                      <Link to={`/admin/managed-companies/${r.id}`} className="font-medium text-zinc-100 hover:text-blue-400">
                        {r.company_name}
                      </Link>
                      {r.sic_code && <div className="text-xs text-zinc-500">SIC {r.sic_code}</div>}
                    </td>
                    <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{r.company_number || "—"}</td>
                    <td className="px-4 py-3 text-zinc-300">{r.confirmation_due || "—"}</td>
                    <td className="px-4 py-3 text-zinc-300">{r.accounts_filing_due || "—"}</td>
                    <td className="px-4 py-3 text-zinc-300">{r.address_expire || "—"}</td>
                    <td className="px-4 py-3">
                      <select
                        value={r.status}
                        onChange={(e) => updateStatus(r.id, e.target.value as Status)}
                        className={`text-xs px-2 py-1 rounded-md border ${m.color} bg-transparent`}>
                        <option value="available">Available</option>
                        <option value="reserved">Reserved</option>
                        <option value="sold_out">Sold Out</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                      <div className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                        <Icon className="w-3 h-3" /> {m.label}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/admin/managed-companies/${r.id}`} className="text-xs text-blue-400 hover:underline">Open</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, color }: any) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-zinc-500 uppercase tracking-wider">{label}</div>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
    </div>
  );
}
