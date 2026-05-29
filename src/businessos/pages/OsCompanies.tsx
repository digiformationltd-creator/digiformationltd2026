import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TableSkeleton } from "../components/Skeletons";
import {
  Search, RefreshCw, Loader2, ExternalLink, Filter, Building2, MapPin,
  Calendar, AlertTriangle, CheckCircle2, Clock, User, FileText, Hash, XCircle,
} from "lucide-react";

interface Company {
  id: string;
  user_id: string;
  company_name: string | null;
  company_number: string | null;
  director_name: string | null;
  company_address: string | null;
  registered_address: string | null;
  correspondence_address: string | null;
  incorporation_date: string | null;
  sic_code: string | null;
  utr_number: string | null;
  auth_code: string | null;
  activation_code: string | null;
  companies_house_personal_code: string | null;
  address_start: string | null;
  address_expire: string | null;
  confirmation_due: string | null;
  accounts_filing_due: string | null;
  created_at: string;
  updated_at: string;
}

interface Address {
  id: string;
  user_id: string;
  label: string;
  service_type: string;
  status: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  county: string | null;
  postcode: string | null;
  country: string | null;
  start_date: string | null;
  expire_date: string | null;
  utr_number: string | null;
  auth_code: string | null;
  activation_code: string | null;
  notes: string | null;
}

interface ProfileLite { user_id: string; full_name: string | null; email: string | null; company_name: string | null; }

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "pending", label: "Pending" },
  { key: "due", label: "Compliance Due" },
  { key: "overdue", label: "Overdue" },
];

function daysUntil(date: string | null): number | null {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

function complianceStatus(c: Company): "active" | "pending" | "due" | "overdue" {
  const dates = [c.confirmation_due, c.accounts_filing_due, c.address_expire].map(daysUntil);
  if (dates.some(d => d !== null && d < 0)) return "overdue";
  if (dates.some(d => d !== null && d <= 30)) return "due";
  if (!c.company_number) return "pending";
  return "active";
}

function statusBadge(s: string) {
  if (s === "active") return "bg-emerald-500/15 text-emerald-300 border-emerald-400/30";
  if (s === "pending") return "bg-amber-500/15 text-amber-300 border-amber-400/30";
  if (s === "due") return "bg-blue-500/15 text-blue-300 border-blue-400/30";
  if (s === "overdue") return "bg-rose-500/15 text-rose-300 border-rose-400/30";
  return "bg-white/10 text-white/60 border-white/20";
}

function statusIcon(s: string) {
  if (s === "active") return <CheckCircle2 className="w-3.5 h-3.5" />;
  if (s === "pending") return <Clock className="w-3.5 h-3.5" />;
  if (s === "due") return <Calendar className="w-3.5 h-3.5" />;
  if (s === "overdue") return <AlertTriangle className="w-3.5 h-3.5" />;
  return null;
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

function dueChip(date: string | null, label: string) {
  if (!date) return null;
  const days = daysUntil(date)!;
  const tone = days < 0 ? "text-rose-300" : days <= 30 ? "text-amber-300" : "text-white/60";
  return (
    <div className={`text-xs ${tone} flex items-center gap-1`}>
      <Calendar className="w-3 h-3" />
      <span className="text-white/50">{label}:</span>
      <span>{fmtDate(date)}</span>
      <span className="opacity-70">({days < 0 ? `${-days}d overdue` : `${days}d`})</span>
    </div>
  );
}

export default function OsCompanies() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [tab, setTab] = useState<"companies" | "addresses">("companies");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Company | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: comps, error: e1 }, { data: addrs, error: e2 }] = await Promise.all([
      supabase.from("client_company_details").select("*").order("updated_at", { ascending: false }).limit(1000),
      supabase.from("client_addresses").select("*").order("created_at", { ascending: false }).limit(1000),
    ]);
    if (e1) toast.error(e1.message);
    if (e2) toast.error(e2.message);
    const cs = (comps || []) as Company[];
    const as = (addrs || []) as Address[];
    setCompanies(cs);
    setAddresses(as);
    const ids = Array.from(new Set([...cs.map(c => c.user_id), ...as.map(a => a.user_id)].filter(Boolean)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, company_name")
        .in("user_id", ids);
      const map: Record<string, ProfileLite> = {};
      (profs || []).forEach((p: any) => { map[p.user_id] = p; });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredCompanies = useMemo(() => {
    const q = search.trim().toLowerCase();
    return companies.filter(c => {
      const s = complianceStatus(c);
      if (filter !== "all" && s !== filter) return false;
      if (!q) return true;
      const p = profiles[c.user_id];
      return (
        c.company_name?.toLowerCase().includes(q) ||
        c.company_number?.toLowerCase().includes(q) ||
        c.director_name?.toLowerCase().includes(q) ||
        c.utr_number?.toLowerCase().includes(q) ||
        p?.full_name?.toLowerCase().includes(q) ||
        p?.email?.toLowerCase().includes(q)
      );
    });
  }, [companies, search, filter, profiles]);

  const filteredAddresses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return addresses.filter(a => {
      if (filter !== "all") {
        const expDays = daysUntil(a.expire_date);
        const s = expDays !== null && expDays < 0 ? "overdue"
          : expDays !== null && expDays <= 30 ? "due"
          : (a.status || "").toLowerCase() === "active" ? "active" : "pending";
        if (s !== filter) return false;
      }
      if (!q) return true;
      const p = profiles[a.user_id];
      return (
        a.label?.toLowerCase().includes(q) ||
        a.service_type?.toLowerCase().includes(q) ||
        a.address_line1?.toLowerCase().includes(q) ||
        a.city?.toLowerCase().includes(q) ||
        a.postcode?.toLowerCase().includes(q) ||
        p?.full_name?.toLowerCase().includes(q) ||
        p?.email?.toLowerCase().includes(q)
      );
    });
  }, [addresses, search, filter, profiles]);

  const stats = useMemo(() => {
    const total = companies.length;
    const counts = { active: 0, pending: 0, due: 0, overdue: 0 };
    companies.forEach(c => { counts[complianceStatus(c)]++; });
    return { total, ...counts };
  }, [companies]);

  const openInLegacy = (userId: string, sub: "companies" | "addresses" = "companies") =>
    navigate(`/admin/legacy?client=${userId}&tab=${sub}`);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Companies & Addresses</h1>
          <p className="text-sm text-white/50 mt-0.5">
            Production tables <code className="text-white/70">client_company_details</code> · <code className="text-white/70">client_addresses</code> · RLS preserved
          </p>
        </div>
        <button onClick={load} className="os-glass px-3 py-2 rounded-xl text-sm inline-flex items-center gap-2 hover:bg-white/10">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Companies", value: stats.total, glow: "from-blue-500/20 to-indigo-500/10" },
          { label: "Active", value: stats.active, glow: "from-emerald-500/20 to-teal-500/10" },
          { label: "Pending", value: stats.pending, glow: "from-amber-500/20 to-orange-500/10" },
          { label: "Compliance Due", value: stats.due, glow: "from-blue-500/20 to-cyan-500/10" },
          { label: "Overdue", value: stats.overdue, glow: "from-rose-500/20 to-pink-500/10" },
        ].map(s => (
          <div key={s.label} className={`os-glass p-4 bg-gradient-to-br ${s.glow}`}>
            <div className="text-xs text-white/60">{s.label}</div>
            <div className="text-2xl font-bold mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="os-glass p-1 inline-flex rounded-xl">
        {[
          { k: "companies", label: "Companies", icon: Building2, count: companies.length },
          { k: "addresses", label: "Addresses", icon: MapPin, count: addresses.length },
        ].map(t => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 transition ${tab === t.k ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/5"}`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
            <span className="text-xs bg-white/10 rounded px-1.5 py-0.5">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="os-glass p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-white/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === "companies" ? "Search company, number, director, UTR, client…" : "Search address, postcode, label, client…"}
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-white/40"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-white/40" />
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === f.key ? "bg-white/15 text-white" : "bg-white/5 text-white/60 hover:bg-white/10"}`}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="os-fade-in"><TableSkeleton columns={5} rows={6} /></div>
      ) : tab === "companies" ? (
        filteredCompanies.length === 0 ? (
          <div className="os-glass p-12 text-center text-white/50">
            <Building2 className="w-8 h-8 mx-auto mb-3 opacity-50" /> No companies match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filteredCompanies.map(c => {
              const p = profiles[c.user_id];
              const s = complianceStatus(c);
              return (
                <button key={c.id} onClick={() => setSelected(c)} className="os-glass p-4 text-left hover:bg-white/[0.06] transition group">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 grid place-items-center shrink-0">
                      <Building2 className="w-5 h-5 text-blue-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold truncate">{c.company_name || "Unnamed company"}</div>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] shrink-0 ${statusBadge(s)}`}>
                          {statusIcon(s)} {s}
                        </span>
                      </div>
                      <div className="text-xs text-white/50 mt-0.5 flex items-center gap-2 flex-wrap">
                        {c.company_number && <span className="font-mono">#{c.company_number}</span>}
                        {c.director_name && <><span>·</span><span className="truncate">{c.director_name}</span></>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-1">
                    {dueChip(c.confirmation_due, "Confirmation")}
                    {dueChip(c.accounts_filing_due, "Accounts")}
                    {dueChip(c.address_expire, "Address")}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-white/50">
                    <span className="inline-flex items-center gap-1 truncate"><User className="w-3 h-3" />{p?.full_name || p?.email || c.user_id.slice(0, 8)}</span>
                    <span className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 text-blue-300">View <ExternalLink className="w-3 h-3" /></span>
                  </div>
                </button>
              );
            })}
          </div>
        )
      ) : (
        filteredAddresses.length === 0 ? (
          <div className="os-glass p-12 text-center text-white/50">
            <MapPin className="w-8 h-8 mx-auto mb-3 opacity-50" /> No addresses match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filteredAddresses.map(a => {
              const p = profiles[a.user_id];
              const expDays = daysUntil(a.expire_date);
              const tone = expDays !== null && expDays < 0 ? "overdue" : expDays !== null && expDays <= 30 ? "due" : (a.status || "active").toLowerCase();
              return (
                <div key={a.id} className="os-glass p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 grid place-items-center shrink-0">
                      <MapPin className="w-5 h-5 text-violet-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold truncate">{a.label}</div>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] shrink-0 ${statusBadge(tone)}`}>
                          {statusIcon(tone)} {tone}
                        </span>
                      </div>
                      <div className="text-xs text-white/50 mt-0.5 capitalize">{a.service_type.replace(/_/g, " ")}</div>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-white/80">
                    {[a.address_line1, a.address_line2, a.city, a.county, a.postcode, a.country].filter(Boolean).join(", ") || <span className="text-white/40">No address details</span>}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/60">
                    <div><span className="text-white/40">Start:</span> {fmtDate(a.start_date)}</div>
                    <div><span className="text-white/40">Expires:</span> {fmtDate(a.expire_date)}</div>
                    {a.utr_number && <div className="col-span-2 font-mono"><span className="text-white/40">UTR:</span> {a.utr_number}</div>}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1 text-white/50 truncate"><User className="w-3 h-3" />{p?.full_name || p?.email || a.user_id.slice(0, 8)}</span>
                    <button onClick={() => openInLegacy(a.user_id, "addresses")} className="text-blue-300 hover:text-blue-200 inline-flex items-center gap-1">
                      Manage <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Company detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-6" onClick={() => setSelected(null)}>
          <div className="os-glass w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-white/10 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 grid place-items-center shrink-0">
                <Building2 className="w-5 h-5 text-blue-300" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold">{selected.company_name || "Unnamed company"}</h2>
                <div className="text-xs text-white/50 mt-0.5 font-mono">{selected.company_number || "no number"}</div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-white/10"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-5">
              <section>
                <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Compliance</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {dueChip(selected.confirmation_due, "Confirmation")}
                  {dueChip(selected.accounts_filing_due, "Accounts")}
                  {dueChip(selected.address_expire, "Address expires")}
                  {selected.incorporation_date && (
                    <div className="text-xs text-white/60 flex items-center gap-1"><Calendar className="w-3 h-3" /><span className="text-white/50">Incorporated:</span> {fmtDate(selected.incorporation_date)}</div>
                  )}
                </div>
              </section>

              <section>
                <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Details</div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {selected.director_name && <div><dt className="text-xs text-white/40">Director</dt><dd>{selected.director_name}</dd></div>}
                  {selected.sic_code && <div><dt className="text-xs text-white/40">SIC code</dt><dd className="font-mono">{selected.sic_code}</dd></div>}
                  {selected.utr_number && <div><dt className="text-xs text-white/40">UTR</dt><dd className="font-mono">{selected.utr_number}</dd></div>}
                  {selected.auth_code && <div><dt className="text-xs text-white/40">Auth code</dt><dd className="font-mono">{selected.auth_code}</dd></div>}
                  {selected.activation_code && <div><dt className="text-xs text-white/40">Activation</dt><dd className="font-mono">{selected.activation_code}</dd></div>}
                  {selected.companies_house_personal_code && <div><dt className="text-xs text-white/40">CH personal code</dt><dd className="font-mono">{selected.companies_house_personal_code}</dd></div>}
                </dl>
              </section>

              <section className="space-y-2">
                <div className="text-xs text-white/50 uppercase tracking-wider">Addresses</div>
                {selected.registered_address && <div className="text-sm"><span className="text-xs text-white/40 block">Registered office</span>{selected.registered_address}</div>}
                {selected.company_address && <div className="text-sm"><span className="text-xs text-white/40 block">Company</span>{selected.company_address}</div>}
                {selected.correspondence_address && <div className="text-sm"><span className="text-xs text-white/40 block">Correspondence</span>{selected.correspondence_address}</div>}
              </section>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => openInLegacy(selected.user_id, "companies")} className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/15 inline-flex items-center justify-center gap-2">
                  <Building2 className="w-4 h-4" /> Company workflows
                </button>
                <button onClick={() => openInLegacy(selected.user_id, "addresses")} className="px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-500 hover:opacity-90 inline-flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4" /> Address workflows
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
