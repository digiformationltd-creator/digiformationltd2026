import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, AlertTriangle, CheckCircle2, Clock, Ban, RefreshCw } from "lucide-react";

type LogRow = {
  id: string;
  message_id: string | null;
  template_name: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  created_at: string;
  metadata: any;
};

type Suppressed = { id: string; email: string; reason: string; created_at: string };

const RANGES = [
  { id: "24h",  label: "Last 24h",  hours: 24 },
  { id: "7d",   label: "Last 7d",   hours: 24 * 7 },
  { id: "30d",  label: "Last 30d",  hours: 24 * 30 },
];

const STATUS_FILTERS = ["all", "sent", "pending", "dlq", "failed", "suppressed", "bounced"];

const STATUS_COLORS: Record<string, string> = {
  sent:       "bg-green-500/15 text-green-300 border-green-500/30",
  pending:    "bg-amber-500/15 text-amber-300 border-amber-500/30",
  dlq:        "bg-red-500/15 text-red-300 border-red-500/30",
  failed:     "bg-red-500/15 text-red-300 border-red-500/30",
  suppressed: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  bounced:    "bg-orange-500/15 text-orange-300 border-orange-500/30",
  complained: "bg-pink-500/15 text-pink-300 border-pink-500/30",
};

export default function OsEmailOps() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [suppressed, setSuppressed] = useState<Suppressed[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("7d");
  const [template, setTemplate] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [retrying, setRetrying] = useState<string | null>(null);
  const [bulkRetrying, setBulkRetrying] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number; skipped: number; failed: number } | null>(null);


  const load = async () => {
    setLoading(true);
    const hours = RANGES.find(r => r.id === range)?.hours || 168;
    const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
    const [logRes, supRes] = await Promise.all([
      supabase.from("email_send_log")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("suppressed_emails")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);
    if (logRes.error) toast.error(logRes.error.message);
    if (supRes.error) toast.error(supRes.error.message);
    setLogs((logRes.data || []) as LogRow[]);
    setSuppressed((supRes.data || []) as Suppressed[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [range]);

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel("email-ops")
      .on("postgres_changes", { event: "*", schema: "public", table: "email_send_log" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "suppressed_emails" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  // Deduplicate by message_id — latest row per email
  const deduped = useMemo(() => {
    const map = new Map<string, LogRow>();
    for (const row of logs) {
      const key = row.message_id || row.id;
      const existing = map.get(key);
      if (!existing || new Date(row.created_at) > new Date(existing.created_at)) {
        map.set(key, row);
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [logs]);

  const templates = useMemo(() => {
    const set = new Set<string>();
    deduped.forEach(r => set.add(r.template_name));
    return ["all", ...Array.from(set).sort()];
  }, [deduped]);

  const filtered = useMemo(() => {
    return deduped.filter(r => {
      if (template !== "all" && r.template_name !== template) return false;
      if (status !== "all" && r.status !== status) return false;
      if (search && !r.recipient_email.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [deduped, template, status, search]);

  const stats = useMemo(() => {
    const s = { total: deduped.length, sent: 0, pending: 0, dlq: 0, failed: 0, suppressed: 0 };
    deduped.forEach(r => {
      if (r.status === "sent") s.sent++;
      else if (r.status === "pending") s.pending++;
      else if (r.status === "dlq") s.dlq++;
      else if (r.status === "failed") s.failed++;
      else if (r.status === "suppressed") s.suppressed++;
    });
    return s;
  }, [deduped]);

  // Retry guard: skip if a later "sent" row already exists for same recipient+template
  const isAlreadyDelivered = (row: LogRow) =>
    logs.some(
      (l) =>
        l.recipient_email === row.recipient_email &&
        l.template_name === row.template_name &&
        l.status === "sent" &&
        new Date(l.created_at) >= new Date(row.created_at)
    );

  const retryOne = async (row: LogRow) => {
    if (isAlreadyDelivered(row)) {
      toast.message("Skipped — already delivered");
      return { ok: true, skipped: true };
    }
    const meta = row.metadata || {};
    const { error } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        template: row.template_name,
        to: row.recipient_email,
        data: meta.data || {},
        idempotency_key: `dlq-retry-${row.id}`,
        purpose: "transactional",
        metadata: { retry_of: row.id, original_message_id: row.message_id, retried_at: new Date().toISOString() },
      },
    });
    if (error) throw error;
    return { ok: true, skipped: false };
  };

  const retry = async (row: LogRow) => {
    setRetrying(row.id);
    try {
      const r = await retryOne(row);
      if (!r.skipped) toast.success("Re-queued");
      load();
    } catch (e: any) {
      toast.error(e.message || "Retry failed");
    } finally {
      setRetrying(null);
    }
  };

  const bulkRetry = async () => {
    const targets = filtered.filter((r) => r.status === "dlq" || r.status === "failed");
    if (targets.length === 0) {
      toast.message("No DLQ rows in current filter");
      return;
    }
    if (!confirm(`Re-queue ${targets.length} failed email${targets.length === 1 ? "" : "s"}? Already-delivered duplicates will be skipped.`)) return;
    setBulkRetrying(true);
    setBulkProgress({ done: 0, total: targets.length, skipped: 0, failed: 0 });
    let skipped = 0, failed = 0;
    // Throttle to ~5/sec to respect queue dispatcher pacing
    for (let i = 0; i < targets.length; i++) {
      try {
        const r = await retryOne(targets[i]);
        if (r.skipped) skipped++;
      } catch {
        failed++;
      }
      setBulkProgress({ done: i + 1, total: targets.length, skipped, failed });
      await new Promise((res) => setTimeout(res, 200));
    }
    setBulkRetrying(false);
    toast.success(`Bulk retry done · ${targets.length - skipped - failed} queued · ${skipped} skipped · ${failed} failed`);
    load();
  };


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><Mail className="w-5 h-5" /> Email Operations</h2>
          <p className="text-sm text-white/50">Queue health · DLQ · suppression list · retries</p>
        </div>
        <button onClick={load} className="h-9 px-3 rounded-lg border border-white/10 hover:bg-white/5 text-sm flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard icon={<Mail className="w-4 h-4" />} label="Total" value={stats.total} tone="blue" />
        <StatCard icon={<CheckCircle2 className="w-4 h-4" />} label="Sent" value={stats.sent} tone="green" />
        <StatCard icon={<Clock className="w-4 h-4" />} label="Pending" value={stats.pending} tone="amber" />
        <StatCard icon={<AlertTriangle className="w-4 h-4" />} label="DLQ" value={stats.dlq} tone="red" />
        <StatCard icon={<Ban className="w-4 h-4" />} label="Suppressed" value={suppressed.length} tone="zinc" />
      </div>

      {/* Filters */}
      <div className="os-glass p-3 flex flex-wrap gap-2 items-center">
        <div className="flex gap-1">
          {RANGES.map(r => (
            <button key={r.id} onClick={() => setRange(r.id)}
              className={`h-8 px-3 rounded-lg text-xs ${range === r.id ? "bg-blue-500/25 text-blue-200 border border-blue-500/40" : "border border-white/10 hover:bg-white/5"}`}>
              {r.label}
            </button>
          ))}
        </div>
        <select value={template} onChange={e => setTemplate(e.target.value)}
          className="h-8 px-2 rounded-lg bg-white/5 border border-white/10 text-xs">
          {templates.map(t => <option key={t} value={t}>{t === "all" ? "All templates" : t}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="h-8 px-2 rounded-lg bg-white/5 border border-white/10 text-xs">
          {STATUS_FILTERS.map(s => <option key={s} value={s}>{s === "all" ? "All statuses" : s}</option>)}
        </select>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search recipient…"
          className="h-8 px-3 rounded-lg bg-white/5 border border-white/10 text-xs flex-1 min-w-[180px]" />
      </div>

      {/* Log table */}
      <div className="os-glass overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm font-semibold">Email log ({filtered.length})</div>
          <div className="flex items-center gap-3">
            {bulkProgress && (
              <span className="text-[11px] text-white/60 mono">
                {bulkProgress.done}/{bulkProgress.total} · skipped {bulkProgress.skipped} · failed {bulkProgress.failed}
              </span>
            )}
            <button
              onClick={bulkRetry}
              disabled={bulkRetrying || filtered.filter(r => r.status === "dlq" || r.status === "failed").length === 0}
              className="h-8 px-3 rounded-lg text-xs border border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              title="Re-queue all failed/DLQ emails in current filter. Already-delivered duplicates are skipped."
            >
              <RefreshCw className={`w-3.5 h-3.5 ${bulkRetrying ? "animate-spin" : ""}`} />
              {bulkRetrying ? "Retrying…" : `Retry all DLQ (${filtered.filter(r => r.status === "dlq" || r.status === "failed").length})`}
            </button>
            <div className="text-[11px] text-white/40">Deduplicated by message_id</div>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[520px] overflow-y-auto hidden md:block">
          <table className="w-full text-sm">
            <thead className="text-xs text-white/50 bg-white/[0.02] sticky top-0">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Template</th>
                <th className="text-left px-4 py-2 font-medium">Recipient</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">When</th>
                <th className="text-left px-4 py-2 font-medium">Error</th>
                <th className="text-right px-4 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="text-center py-8 text-white/40 text-xs">Loading…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-white/40 text-xs">No emails match the filter</td></tr>
              )}
              {filtered.map(r => (
                <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-2 text-xs">{r.template_name}</td>
                  <td className="px-4 py-2 text-xs">{r.recipient_email}</td>
                  <td className="px-4 py-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[r.status] || "bg-white/5 text-white/60 border-white/10"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-white/50 mono">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-xs text-red-300/80 max-w-[280px] truncate" title={r.error_message || ""}>
                    {r.error_message || "—"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {(r.status === "dlq" || r.status === "failed") && (
                      <button disabled={retrying === r.id} onClick={() => retry(r)}
                        className="h-7 px-2 rounded-md text-[11px] border border-white/10 hover:bg-white/5 disabled:opacity-50">
                        {retrying === r.id ? "…" : "Retry"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-white/5 max-h-[520px] overflow-y-auto">
          {loading && <div className="p-6 text-center text-white/40 text-xs">Loading…</div>}
          {!loading && filtered.length === 0 && <div className="p-6 text-center text-white/40 text-xs">No emails match the filter</div>}
          {filtered.map(r => (
            <div key={r.id} className="p-3 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold truncate">{r.template_name}</div>
                  <div className="text-[11px] text-white/60 truncate">{r.recipient_email}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${STATUS_COLORS[r.status] || "bg-white/5 text-white/60 border-white/10"}`}>
                  {r.status}
                </span>
              </div>
              <div className="text-[10px] text-white/40 mono">{new Date(r.created_at).toLocaleString()}</div>
              {r.error_message && (
                <div className="text-[11px] text-red-300/80 break-words">{r.error_message}</div>
              )}
              {(r.status === "dlq" || r.status === "failed") && (
                <button disabled={retrying === r.id} onClick={() => retry(r)}
                  className="w-full h-8 px-2 rounded-md text-[11px] border border-white/10 hover:bg-white/5 disabled:opacity-50">
                  {retrying === r.id ? "Retrying…" : "Retry"}
                </button>
              )}
            </div>
          ))}
        </div>

      </div>

      {/* Suppression list */}
      <div className="os-glass overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5 text-sm font-semibold flex items-center gap-2">
          <Ban className="w-4 h-4" /> Suppression list ({suppressed.length})
        </div>
        <div className="overflow-x-auto max-h-[280px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-white/50 bg-white/[0.02] sticky top-0">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Email</th>
                <th className="text-left px-4 py-2 font-medium">Reason</th>
                <th className="text-left px-4 py-2 font-medium">Added</th>
              </tr>
            </thead>
            <tbody>
              {suppressed.length === 0 && (
                <tr><td colSpan={3} className="text-center py-6 text-white/40 text-xs">No suppressed emails</td></tr>
              )}
              {suppressed.map(s => (
                <tr key={s.id} className="border-t border-white/5">
                  <td className="px-4 py-2 text-xs">{s.email}</td>
                  <td className="px-4 py-2 text-xs text-white/60">{s.reason}</td>
                  <td className="px-4 py-2 text-xs text-white/50 mono">{new Date(s.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: string }) {
  const toneClasses: Record<string, string> = {
    blue:  "from-blue-500/10 to-blue-500/0 border-blue-500/20 text-blue-300",
    green: "from-green-500/10 to-green-500/0 border-green-500/20 text-green-300",
    amber: "from-amber-500/10 to-amber-500/0 border-amber-500/20 text-amber-300",
    red:   "from-red-500/10 to-red-500/0 border-red-500/20 text-red-300",
    zinc:  "from-zinc-500/10 to-zinc-500/0 border-zinc-500/20 text-zinc-300",
  };
  return (
    <div className={`os-glass p-4 bg-gradient-to-br ${toneClasses[tone]} border`}>
      <div className="flex items-center gap-2 text-xs opacity-80">{icon}{label}</div>
      <div className="text-2xl font-bold mono mt-1">{value}</div>
    </div>
  );
}
