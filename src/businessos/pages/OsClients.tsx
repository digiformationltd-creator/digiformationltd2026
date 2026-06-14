import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TableSkeleton } from "../components/Skeletons";
import {
  Search, RefreshCw, Loader2, Mail, Phone, Building2,
  ChevronRight, Users, ExternalLink, Calendar, Pin, CalendarClock, AlertTriangle,
} from "lucide-react";

interface ClientRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  created_at: string;
  order_count?: number;
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
  const [managedStats, setManagedStats] = useState({ total: 0, available: 0, reminders_active: 0, missing_dates: 0 });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-clients", { method: "GET" });
    setLoading(false);
    if (error) { toast.error(error.message || "Unable to load clients"); return; }
    if (data?.error) { toast.error(data.error); return; }
    const baseClients: ClientRow[] = data?.clients || [];
    const { data: orders } = await supabase
      .from("client_orders")
      .select("user_id, customer_email");
    const counts = new Map<string, number>();
    const emailToClient = new Map<string, string>();
    for (const client of baseClients) {
      if (client.email) emailToClient.set(client.email.toLowerCase(), client.user_id);
    }
    for (const order of orders || []) {
      const clientId = order.user_id || (order.customer_email ? emailToClient.get(order.customer_email.toLowerCase()) : null);
      if (clientId) counts.set(clientId, (counts.get(clientId) || 0) + 1);
    }
    const enriched = baseClients
      .map((client) => ({ ...client, order_count: counts.get(client.user_id) || 0 }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setClients(enriched);
  };

  const loadManagedStats = async () => {
    const { data } = await supabase
      .from("managed_companies")
      .select("status, confirmation_due, accounts_filing_due, address_expire");
    const s = { total: 0, available: 0, reminders_active: 0, missing_dates: 0 };
    for (const r of data || []) {
      s.total++;
      if (r.status === "available") s.available++;
      if (r.status !== "sold_out" && r.status !== "unavailable") {
        s.reminders_active++;
        if (!r.confirmation_due && !r.accounts_filing_due && !r.address_expire) s.missing_dates++;
      }
    }
    setManagedStats(s);
  };

  useEffect(() => { load(); loadManagedStats(); }, []);

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
  const totalOrders = clients.reduce((sum, client) => sum + (client.order_count || 0), 0);
  const newThisMonth = clients.filter(c => {
    const d = new Date(c.created_at);
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Clients" value={total} icon={Users} glow="blue" />
        <StatCard label="Client Orders" value={totalOrders} icon={ChevronRight} glow="cyan" />
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

      {/* Pinned internal record: Usman Companies (DigiFormation inventory) */}
      <button
        onClick={() => navigate("/admin/managed-companies")}
        className="w-full text-left os-glass p-4 sm:p-5 ring-1 ring-amber-400/30 hover:ring-amber-400/60 transition group relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl bg-amber-500/15 text-amber-200 text-[10px] uppercase tracking-widest font-bold flex items-center gap-1">
          <Pin className="w-3 h-3" /> Pinned · Internal
        </div>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/40 to-orange-600/40 grid place-items-center text-sm font-bold shrink-0">
            UC
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-base flex items-center gap-2">
              Usman Companies
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-white/60">DigiFormation inventory</span>
            </div>
            <div className="text-xs text-white/60 mt-0.5">
              Internal company inventory · CSV/Excel import · Confirmation Statement & Annual Accounts reminders
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
              <span className="inline-flex items-center gap-1.5 text-white/70"><Building2 className="w-3.5 h-3.5 text-blue-300" /> {managedStats.total} companies</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-300">● {managedStats.available} available</span>
              <span className="inline-flex items-center gap-1.5 text-cyan-300"><CalendarClock className="w-3.5 h-3.5" /> {managedStats.reminders_active} reminders active</span>
              {managedStats.missing_dates > 0 && (
                <span className="inline-flex items-center gap-1.5 text-orange-300"><AlertTriangle className="w-3.5 h-3.5" /> {managedStats.missing_dates} missing dates</span>
              )}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white/80 shrink-0 mt-1" />
        </div>
      </button>

      {/* Results count */}
      <div className="text-xs text-white/50 px-1">
        Showing <span className="text-white/80 font-semibold">{filtered.length}</span> of {total} clients (latest first, below pinned)
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
                  <th className="py-3 px-4 font-semibold">Orders</th>
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
                    <td className="py-3 px-4">
                      <button onClick={(e) => { e.stopPropagation(); openClient(c.user_id, "orders"); }} className="px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.10] text-xs font-semibold text-white/80">
                        {c.order_count || 0} orders
                      </button>
                    </td>
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
                    Joined {fmtDate(c.created_at)} · {c.order_count || 0} orders
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
