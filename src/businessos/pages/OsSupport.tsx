import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TableSkeleton } from "../components/Skeletons";
import {
  Search, RefreshCw, Loader2, ExternalLink, Filter, MessageSquare,
  User, Calendar, CheckCircle2, Clock, AlertCircle, XCircle, Send, StickyNote,
} from "lucide-react";

interface Ticket {
  id: string;
  user_id: string;
  ticket_ref: string;
  subject: string;
  message: string;
  status: string;
  replies_count: number;
  created_at: string;
  updated_at: string;
}
interface ProfileLite { user_id: string; full_name: string | null; email: string | null; company_name: string | null; }

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "Open", label: "Open" },
  { key: "Pending", label: "Pending" },
  { key: "Resolved", label: "Resolved" },
  { key: "Closed", label: "Closed" },
];

const DATE_FILTERS = [
  { key: "all", label: "All time" },
  { key: "7", label: "Last 7 days" },
  { key: "30", label: "Last 30 days" },
  { key: "90", label: "Last 90 days" },
];

function statusColor(s: string) {
  const v = (s || "").toLowerCase();
  if (v === "open") return "bg-blue-500/15 text-blue-300 border-blue-400/30";
  if (v === "pending") return "bg-amber-500/15 text-amber-300 border-amber-400/30";
  if (v === "resolved") return "bg-emerald-500/15 text-emerald-300 border-emerald-400/30";
  if (v === "closed") return "bg-white/10 text-white/60 border-white/20";
  return "bg-white/10 text-white/70 border-white/20";
}

function statusIcon(s: string) {
  const v = (s || "").toLowerCase();
  if (v === "open") return <AlertCircle className="w-3.5 h-3.5" />;
  if (v === "pending") return <Clock className="w-3.5 h-3.5" />;
  if (v === "resolved") return <CheckCircle2 className="w-3.5 h-3.5" />;
  if (v === "closed") return <XCircle className="w-3.5 h-3.5" />;
  return <MessageSquare className="w-3.5 h-3.5" />;
}

export default function OsSupport() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [note, setNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("client_tickets")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1000);
    if (error) { toast.error(error.message); setLoading(false); return; }
    const rows = (data || []) as Ticket[];
    setTickets(rows);
    const ids = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean)));
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

  const clientOptions = useMemo(() => {
    const set = new Map<string, string>();
    tickets.forEach(t => {
      const p = profiles[t.user_id];
      set.set(t.user_id, p?.full_name || p?.email || t.user_id.slice(0, 8));
    });
    return Array.from(set.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [tickets, profiles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = Date.now();
    return tickets.filter(t => {
      if (statusFilter !== "all" && (t.status || "").toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (clientFilter !== "all" && t.user_id !== clientFilter) return false;
      if (dateFilter !== "all") {
        const days = parseInt(dateFilter, 10);
        if (now - new Date(t.created_at).getTime() > days * 86400000) return false;
      }
      if (!q) return true;
      const p = profiles[t.user_id];
      return (
        t.ticket_ref?.toLowerCase().includes(q) ||
        t.subject?.toLowerCase().includes(q) ||
        t.message?.toLowerCase().includes(q) ||
        p?.full_name?.toLowerCase().includes(q) ||
        p?.email?.toLowerCase().includes(q) ||
        p?.company_name?.toLowerCase().includes(q)
      );
    });
  }, [tickets, search, statusFilter, dateFilter, clientFilter, profiles]);

  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter(t => (t.status || "").toLowerCase() === "open").length;
    const pending = tickets.filter(t => (t.status || "").toLowerCase() === "pending").length;
    const resolved = tickets.filter(t => (t.status || "").toLowerCase() === "resolved").length;
    return { total, open, pending, resolved };
  }, [tickets]);

  const updateStatus = async (t: Ticket, status: string) => {
    setUpdating(true);
    const { error } = await supabase.from("client_tickets").update({ status, updated_at: new Date().toISOString() }).eq("id", t.id);
    setUpdating(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Marked as ${status}`);
    setSelected(prev => prev && prev.id === t.id ? { ...prev, status } : prev);

    // Notify the client of the new status (no-op if no email on file)
    const recipient = profiles[t.user_id]?.email;
    if (recipient) {
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "ticket-status-update",
          recipientEmail: recipient,
          idempotencyKey: `ticket-status-${t.id}-${status}-${Date.now()}`,
          ticketId: t.id,
          clientUserId: t.user_id,
          triggerSource: "admin",
          templateData: {
            customerName: profiles[t.user_id]?.full_name || "",
            ticketRef: t.ticket_ref,
            subject: t.subject,
            status,
          },
        },
      }).catch((err) => console.error("ticket-status-update failed", err));
    }
    load();
  };

  const saveNote = async () => {
    if (!selected || !note.trim()) return;
    setUpdating(true);
    const stamped = `\n\n— Admin note (${new Date().toLocaleString()}):\n${note.trim()}`;
    const { error } = await supabase
      .from("client_tickets")
      .update({ message: (selected.message || "") + stamped, updated_at: new Date().toISOString() })
      .eq("id", selected.id);
    setUpdating(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Internal note saved");
    setNote("");
    load();
  };

  const openInLegacy = (userId: string) => navigate(`/admin/clients/${userId}?tab=tickets`);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support</h1>
          <p className="text-sm text-white/50 mt-0.5">Connected to production <code className="text-white/70">client_tickets</code> · existing RLS preserved</p>
        </div>
        <button onClick={load} className="os-glass px-3 py-2 rounded-xl text-sm inline-flex items-center gap-2 hover:bg-white/10">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Tickets", value: stats.total, glow: "from-blue-500/20 to-indigo-500/10" },
          { label: "Open", value: stats.open, glow: "from-blue-500/20 to-cyan-500/10" },
          { label: "Pending", value: stats.pending, glow: "from-amber-500/20 to-orange-500/10" },
          { label: "Resolved", value: stats.resolved, glow: "from-emerald-500/20 to-teal-500/10" },
        ].map(s => (
          <div key={s.label} className={`os-glass p-4 bg-gradient-to-br ${s.glow}`}>
            <div className="text-xs text-white/60">{s.label}</div>
            <div className="text-2xl font-bold mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="os-glass p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-white/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ref, subject, message, client…"
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-white/40"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-white/40" />
          {STATUS_FILTERS.map(s => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${statusFilter === s.key ? "bg-white/15 text-white" : "bg-white/5 text-white/60 hover:bg-white/10"}`}
            >{s.label}</button>
          ))}
        </div>
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="os-glass bg-transparent text-xs rounded-lg px-2 py-2 [&>option]:bg-slate-900">
          {DATE_FILTERS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
        </select>
        <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="os-glass bg-transparent text-xs rounded-lg px-2 py-2 max-w-[180px] [&>option]:bg-slate-900">
          <option value="all">All clients</option>
          {clientOptions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="os-fade-in"><TableSkeleton columns={6} rows={7} /></div>
      ) : filtered.length === 0 ? (
        <div className="os-glass p-12 text-center text-white/50">
          <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-50" />
          No tickets match your filters.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block os-glass overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-white/60 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Ticket</th>
                  <th className="text-left px-4 py-3">Client</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Replies</th>
                  <th className="text-left px-4 py-3">Updated</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(t => {
                  const p = profiles[t.user_id];
                  return (
                    <tr key={t.id} className="hover:bg-white/5 transition cursor-pointer" onClick={() => setSelected(t)}>
                      <td className="px-4 py-3">
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium truncate max-w-[320px]">{t.subject}</span>
                          <span className="text-xs text-white/40 font-mono">{t.ticket_ref}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={(e) => { e.stopPropagation(); openInLegacy(t.user_id); }} className="text-left hover:text-blue-300 transition truncate max-w-[200px] inline-block">
                          {p?.full_name || p?.email || t.user_id.slice(0, 8)}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs ${statusColor(t.status)}`}>
                          {statusIcon(t.status)} {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/70">{t.replies_count}</td>
                      <td className="px-4 py-3 text-white/60">{new Date(t.updated_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => setSelected(t)} title="View" className="p-2 rounded-lg hover:bg-white/10"><MessageSquare className="w-4 h-4" /></button>
                          <button onClick={() => openInLegacy(t.user_id)} title="Full Admin" className="p-2 rounded-lg hover:bg-white/10"><ExternalLink className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(t => {
              const p = profiles[t.user_id];
              return (
                <button key={t.id} onClick={() => setSelected(t)} className="os-glass p-4 w-full text-left">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 grid place-items-center shrink-0">
                      <MessageSquare className="w-4 h-4 text-blue-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{t.subject}</div>
                      <div className="text-xs text-white/40 font-mono mt-0.5">{t.ticket_ref}</div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] shrink-0 ${statusColor(t.status)}`}>
                      {statusIcon(t.status)} {t.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-white/60">
                    <User className="w-3.5 h-3.5" />
                    <span className="truncate">{p?.full_name || p?.email || t.user_id.slice(0, 8)}</span>
                    <span className="ml-auto inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(t.updated_at).toLocaleDateString()}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-6" onClick={() => setSelected(null)}>
          <div className="os-glass w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-white/10 flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs text-white/40 font-mono">{selected.ticket_ref}</div>
                <h2 className="text-lg font-bold mt-0.5">{selected.subject}</h2>
                <div className="flex items-center gap-2 mt-2 text-xs text-white/60">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border ${statusColor(selected.status)}`}>
                    {statusIcon(selected.status)} {selected.status}
                  </span>
                  <span>·</span>
                  <span>{profiles[selected.user_id]?.full_name || profiles[selected.user_id]?.email || selected.user_id.slice(0, 8)}</span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-white/10"><XCircle className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Conversation</div>
                <pre className="text-sm whitespace-pre-wrap bg-white/5 rounded-xl p-4 max-h-[40vh] overflow-y-auto font-sans">{selected.message}</pre>
              </div>

              <div>
                <div className="text-xs text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2"><StickyNote className="w-3.5 h-3.5" /> Internal admin note</div>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Add an internal note (appended to the ticket thread, admin only via legacy UI)…"
                  className="w-full bg-white/5 rounded-xl p-3 text-sm outline-none placeholder:text-white/30"
                />
                <button onClick={saveNote} disabled={updating || !note.trim()} className="mt-2 px-3 py-2 rounded-lg text-xs bg-white/10 hover:bg-white/20 disabled:opacity-40 inline-flex items-center gap-2">
                  <Send className="w-3.5 h-3.5" /> Save note
                </button>
              </div>

              <div>
                <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Quick status</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {["Open", "Pending", "Resolved", "Closed"].map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selected, s)}
                      disabled={updating || selected.status === s}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition ${selected.status === s ? statusColor(s) : "bg-white/5 border-white/10 hover:bg-white/10 text-white/70"} disabled:opacity-50`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => openInLegacy(selected.user_id)} className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-500 hover:opacity-90 inline-flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" /> Open in Full Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
