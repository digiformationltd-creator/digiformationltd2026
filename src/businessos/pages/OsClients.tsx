import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TableSkeleton } from "../components/Skeletons";
import {
  Search, RefreshCw, Loader2, Mail, Phone, Building2,
  ChevronRight, Users, ExternalLink, Calendar, UserPlus, X, Eye, EyeOff,
} from "lucide-react";

interface ClientRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  created_at: string;
}

const initialsOf = (c: ClientRow) => {
  const src = c.full_name || c.email || "?";
  return src.trim().slice(0, 2).toUpperCase();
};

const fmtDate = (s: string) => {
  try { return new Date(s).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return s; }
};

export default function OsClients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-clients", { method: "GET" });
    setLoading(false);
    if (error) { toast.error(error.message || "Unable to load clients"); return; }
    if (data?.error) { toast.error(data.error); return; }
    setClients(data?.clients || []);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter(c =>
      (c.full_name || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.company_name || "").toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q)
    );
  }, [clients, search]);

  const openClient = (id: string, tab: string = "company") => {
    navigate(`/admin/clients/${id}?tab=${tab}`);
  };

  const total = clients.length;
  const withCompany = clients.filter(c => c.company_name).length;
  const newThisMonth = clients.filter(c => {
    const d = new Date(c.created_at);
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Total Clients" value={total} icon={Users} glow="blue" />
        <StatCard label="With Companies" value={withCompany} icon={Building2} glow="purple" />
        <StatCard label="New This Month" value={newThisMonth} icon={Calendar} glow="green" />
      </div>

      {/* Toolbar */}
      <div className="os-glass p-3 sm:p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, company, phone…"
            className="w-full h-11 rounded-xl pl-10 pr-3 text-sm"
          />
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="h-11 px-4 rounded-xl os-glass text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
        {/* Legacy fallback removed — client management is now native at /admin/clients/:id */}
      </div>

      {/* Results count */}
      <div className="text-xs text-white/50 px-1">
        Showing <span className="text-white/80 font-semibold">{filtered.length}</span> of {total} clients
      </div>

      {/* Loading */}
      {loading && clients.length === 0 && (
        <div className="os-fade-in">
          <TableSkeleton columns={6} rows={8} />
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="os-glass p-12 text-center">
          <Users className="w-10 h-10 text-white/30 mx-auto mb-2" />
          <div className="text-sm text-white/60">
            {clients.length === 0 ? "No clients yet." : "No clients match your search."}
          </div>
        </div>
      )}

      {/* Desktop table */}
      {filtered.length > 0 && (
        <div className="os-glass overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-widest text-white/40 border-b border-white/5">
                  <th className="py-3 px-4 font-semibold">Client</th>
                  <th className="py-3 px-4 font-semibold">Email</th>
                  <th className="py-3 px-4 font-semibold">Company</th>
                  <th className="py-3 px-4 font-semibold">Phone</th>
                  <th className="py-3 px-4 font-semibold">Joined</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.user_id}
                    onClick={() => openClient(c.user_id)}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/40 to-purple-600/40 grid place-items-center text-xs font-bold shrink-0">
                          {initialsOf(c)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{c.full_name || "(no name)"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-white/70">{c.email || "—"}</td>
                    <td className="py-3 px-4 text-white/70">{c.company_name || "—"}</td>
                    <td className="py-3 px-4 text-white/70">{c.phone || "—"}</td>
                    <td className="py-3 px-4 text-white/50 text-xs whitespace-nowrap">{fmtDate(c.created_at)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs text-blue-300">
                        Manage <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile cards */}
      {filtered.length > 0 && (
        <div className="md:hidden space-y-3">
          {filtered.map((c) => (
            <button
              key={c.user_id}
              onClick={() => openClient(c.user_id)}
              className="os-glass p-4 w-full text-left active:scale-[0.99] transition"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/40 to-purple-600/40 grid place-items-center text-sm font-bold shrink-0">
                  {initialsOf(c)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{c.full_name || "(no name)"}</div>
                  {c.email && (
                    <div className="flex items-center gap-1.5 text-xs text-white/60 mt-0.5 truncate">
                      <Mail className="w-3 h-3 shrink-0" /><span className="truncate">{c.email}</span>
                    </div>
                  )}
                  {c.company_name && (
                    <div className="flex items-center gap-1.5 text-xs text-white/60 mt-0.5 truncate">
                      <Building2 className="w-3 h-3 shrink-0" /><span className="truncate">{c.company_name}</span>
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-white/60 mt-0.5">
                      <Phone className="w-3 h-3 shrink-0" /><span>{c.phone}</span>
                    </div>
                  )}
                  <div className="text-[10px] text-white/40 mt-1.5 uppercase tracking-wider">
                    Joined {fmtDate(c.created_at)}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/40 mt-1 shrink-0" />
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-white/5">
                {[
                  { l: "Company", t: "company" },
                  { l: "Address", t: "addresses" },
                  { l: "Orders", t: "orders" },
                  { l: "Docs", t: "docs" },
                ].map(q => (
                  <span
                    key={q.t}
                    onClick={(e) => { e.stopPropagation(); openClient(c.user_id, q.t); }}
                    className="text-[11px] font-medium rounded-lg py-1.5 text-center bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white transition"
                  >
                    {q.l}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, glow }: { label: string; value: number; icon: any; glow: string }) {
  return (
    <div className={`os-glass os-glow-${glow} p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] uppercase tracking-widest text-white/50">{label}</div>
        <Icon className="w-4 h-4 text-white/40" />
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
