// Email Marketing — LIVE backend wiring (Phase 8).
// All KPIs, queue, logs and campaign data come from public.email_send_log,
// public.email_campaigns and public.leads. Tabs without a backend show
// "No live data available" empty states. NO fake/mock data.

import { useEffect, useMemo, useState } from "react";
import {
  Mail, Users, Send, Inbox, Clock, Search,
  Sparkles, FileText, Activity, BarChart3, Compass, ListChecks,
  Megaphone, TrendingUp, RefreshCw, AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import EmailTemplateManager from "../components/EmailTemplateManager";

type Tab =
  | "overview" | "campaigns" | "templates"
  | "queue" | "logs" | "analytics" | "discovery" | "review";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "overview",   label: "Overview",       icon: BarChart3 },
  { id: "campaigns",  label: "Campaigns",      icon: Megaphone },
  { id: "templates",  label: "Templates",      icon: FileText },
  { id: "queue",      label: "Queue",          icon: Clock },
  { id: "logs",       label: "Logs",           icon: Activity },
  { id: "analytics",  label: "Analytics",      icon: TrendingUp },
  { id: "discovery",  label: "Lead Discovery", icon: Compass },
  { id: "review",     label: "Lead Review",    icon: ListChecks },
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

type LogRow = {
  message_id: string | null;
  template_name: string | null;
  recipient_email: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
};

type Campaign = {
  id: string; name: string; subject: string; status: string;
  scheduled_at: string | null; sent_count: number;
  opened_count: number; clicked_count: number;
  template_name: string | null; updated_at: string;
};

type Counts = {
  totalLeads: number;
  newLeads7d: number;
  activeCampaigns: number;
  sent: number;
  failed: number;
  pending: number;
  suppressed: number;
};

export default function OsEmailMarketing() {
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [counts, setCounts] = useState<Counts>({
    totalLeads: 0, newLeads7d: 0, activeCampaigns: 0,
    sent: 0, failed: 0, pending: 0, suppressed: 0,
  });

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const since7d = new Date(Date.now() - 7 * 86400000).toISOString();

      const [leadsAll, leadsNew, camps, logsRecent, sentC, failedC, pendingC, suppressedC] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", since7d),
        supabase.from("email_campaigns").select("*").order("updated_at", { ascending: false }).limit(50),
        supabase
          .from("email_send_log")
          .select("message_id,template_name,recipient_email,status,error_message,created_at")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase.from("email_send_log").select("message_id", { count: "exact", head: true }).eq("status", "sent"),
        supabase.from("email_send_log").select("message_id", { count: "exact", head: true }).in("status", ["failed", "dlq", "bounced"]),
        supabase.from("email_send_log").select("message_id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("email_send_log").select("message_id", { count: "exact", head: true }).eq("status", "suppressed"),
      ]);

      if (leadsAll.error) throw leadsAll.error;
      if (camps.error) throw camps.error;
      if (logsRecent.error) throw logsRecent.error;

      const campaignsData = (camps.data ?? []) as Campaign[];
      setCampaigns(campaignsData);
      setLogs((logsRecent.data ?? []) as LogRow[]);
      setCounts({
        totalLeads: leadsAll.count ?? 0,
        newLeads7d: leadsNew.count ?? 0,
        activeCampaigns: campaignsData.filter(c => ["running", "scheduled", "sending"].includes(c.status)).length,
        sent: sentC.count ?? 0,
        failed: failedC.count ?? 0,
        pending: pendingC.count ?? 0,
        suppressed: suppressedC.count ?? 0,
      });
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Deduplicate by message_id, keep newest (logs are already DESC-ordered)
  const dedupLogs = useMemo(() => {
    const seen = new Set<string>();
    const out: LogRow[] = [];
    for (const r of logs) {
      const key = r.message_id ?? `${r.recipient_email}-${r.created_at}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(r);
    }
    return out;
  }, [logs]);

  return (
    <div className="space-y-6 os-fade-in">
      {/* Header */}
      <div className="os-glass p-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-12 h-12 rounded-2xl grid place-items-center bg-pink-500/10 text-pink-300">
            <Mail className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-[240px]">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold">Email Marketing</h2>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-400/20">
                Live
              </span>
            </div>
            <p className="text-sm text-white/50 mt-1 max-w-2xl">
              Read-only view over <code className="text-white/70">email_send_log</code>,{" "}
              <code className="text-white/70">email_campaigns</code> and <code className="text-white/70">leads</code>.
              No fake data, no duplicated logic.
            </p>
          </div>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        <div className="mt-5 flex gap-1.5 flex-wrap">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition border ${
                  active
                    ? "bg-pink-500/15 border-pink-400/30 text-pink-100"
                    : "bg-white/5 border-white/10 text-white/60 hover:text-white/90 hover:bg-white/10"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {err && (
        <div className="os-glass p-4 text-sm text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {err}
        </div>
      )}

      {tab === "overview"  && <Overview counts={counts} loading={loading} />}
      {tab === "campaigns" && <Campaigns campaigns={campaigns} loading={loading} />}
      {tab === "templates" && <EmailTemplateManager />}
      {tab === "queue"     && <Queue logs={dedupLogs} pending={counts.pending} sent={counts.sent} failed={counts.failed} />}
      {tab === "logs"      && <Logs logs={dedupLogs} loading={loading} />}
      {tab === "analytics" && <Analytics campaigns={campaigns} counts={counts} />}
      {tab === "discovery" && <NoBackend title="Lead Discovery" detail="No lead-discovery backend is connected. Categories, scans, and quality scoring will appear here once an outbound discovery service is wired in." />}
      {tab === "review"    && <NoBackend title="Lead Review" detail="No lead-review queue exists yet. When a discovery engine populates candidate leads, they will appear here for approval." />}
    </div>
  );
}

/* ------------------------------ OVERVIEW -------------------------------- */

function KPI({ label, value, sub, icon: Icon, tint }: any) {
  return (
    <div className="os-glass p-4">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl grid place-items-center ${TINT[tint]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="text-xs text-white/50">{label}</div>
      {sub && <div className="text-[10px] text-white/40 mt-0.5">{sub}</div>}
    </div>
  );
}

function Overview({ counts, loading }: { counts: Counts; loading: boolean }) {
  const items = [
    { label: "Total Leads",       value: counts.totalLeads,     sub: `${counts.newLeads7d} new (7d)`, icon: Users,    tint: "cyan" },
    { label: "Active Campaigns",  value: counts.activeCampaigns, sub: "running / scheduled / sending", icon: Megaphone, tint: "pink" },
    { label: "Emails Sent",       value: counts.sent,           sub: "all-time (unique)",             icon: Send,     tint: "indigo" },
    { label: "Pending",           value: counts.pending,        sub: "in queue",                      icon: Clock,    tint: "gold" },
    { label: "Failed",            value: counts.failed,         sub: "incl. bounced / DLQ",           icon: AlertCircle, tint: "red" },
    { label: "Suppressed",        value: counts.suppressed,     sub: "unsubscribed / blocked",        icon: Inbox,    tint: "purple" },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {items.map((k) => (
          <KPI key={k.label} {...k} value={loading ? "—" : k.value.toLocaleString()} />
        ))}
      </div>
      <div className="os-glass p-5 text-xs text-white/50">
        Source: <code className="text-white/70">email_send_log</code> (deduplicated by <code>message_id</code>),{" "}
        <code className="text-white/70">email_campaigns</code>, <code className="text-white/70">leads</code>.
      </div>
    </div>
  );
}

/* ------------------------------ CAMPAIGNS ------------------------------- */

const CAMP_STATUS: Record<string, string> = {
  running:   "bg-emerald-500/10 text-emerald-300",
  sending:   "bg-emerald-500/10 text-emerald-300",
  scheduled: "bg-cyan-500/10 text-cyan-300",
  draft:     "bg-white/5 text-white/60",
  paused:    "bg-amber-500/10 text-amber-300",
  completed: "bg-purple-500/10 text-purple-300",
};

function Campaigns({ campaigns, loading }: { campaigns: Campaign[]; loading: boolean }) {
  if (!loading && campaigns.length === 0) {
    return <NoData title="No campaigns yet" detail="Campaigns created in the AI Command Center or backend will appear here." />;
  }
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {campaigns.map((c) => {
        const totalKnown = c.sent_count || 0;
        const openPct = totalKnown ? Math.round((c.opened_count / totalKnown) * 100) : 0;
        return (
          <div key={c.id} className="os-glass p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold truncate">{c.name}</div>
                <div className="text-xs text-white/50 mt-0.5 truncate">{c.subject}</div>
              </div>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${CAMP_STATUS[c.status] ?? "bg-white/5 text-white/60"}`}>
                {c.status}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <Stat label="Sent" value={c.sent_count} />
              <Stat label="Opened" value={c.opened_count} />
              <Stat label="Clicked" value={c.clicked_count} />
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-white/40">
              <span>{c.scheduled_at ? new Date(c.scheduled_at).toLocaleString() : "—"}</span>
              <span>{openPct}% open</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-white/40">{label}</div>
      <div className="font-semibold text-white/90">{value.toLocaleString()}</div>
    </div>
  );
}

/* ------------------------------ TEMPLATES ------------------------------- */

function Templates({ logs }: { logs: LogRow[] }) {
  const usage = useMemo(() => {
    const m = new Map<string, { name: string; count: number; lastUsed: string }>();
    for (const r of logs) {
      const name = r.template_name ?? "(unknown)";
      const cur = m.get(name);
      if (cur) { cur.count++; if (r.created_at > cur.lastUsed) cur.lastUsed = r.created_at; }
      else m.set(name, { name, count: 1, lastUsed: r.created_at });
    }
    return [...m.values()].sort((a, b) => b.count - a.count);
  }, [logs]);

  if (usage.length === 0) return <NoData title="No templates used yet" detail="Templates appear here once transactional or campaign emails have been sent." />;

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {usage.map((t) => (
        <div key={t.name} className="os-glass p-5">
          <div className="font-medium text-sm">{t.name}</div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <Stat label="Sends (recent)" value={t.count} />
            <div>
              <div className="text-white/40">Last used</div>
              <div className="font-semibold text-white/90">{new Date(t.lastUsed).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------- QUEUE --------------------------------- */

const Q_STATUS: Record<string, string> = {
  pending:    "bg-cyan-500/10 text-cyan-300",
  sent:       "bg-emerald-500/10 text-emerald-300",
  failed:     "bg-red-500/10 text-red-300",
  dlq:        "bg-red-500/10 text-red-300",
  bounced:    "bg-red-500/10 text-red-300",
  suppressed: "bg-amber-500/10 text-amber-300",
};

function Queue({ logs, pending, sent, failed }: { logs: LogRow[]; pending: number; sent: number; failed: number }) {
  const rows = logs.filter(l => l.status === "pending").slice(0, 50);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <KPI label="Pending" value={pending.toLocaleString()} icon={Clock} tint="cyan" />
        <KPI label="Sent (all-time)" value={sent.toLocaleString()} icon={Send} tint="emerald" />
        <KPI label="Failed" value={failed.toLocaleString()} icon={AlertCircle} tint="red" />
      </div>
      {rows.length === 0 ? (
        <NoData title="Queue is empty" detail="No pending sends in email_send_log." />
      ) : (
        <LogTable rows={rows} />
      )}
    </div>
  );
}

/* --------------------------------- LOGS --------------------------------- */

function Logs({ logs, loading }: { logs: LogRow[]; loading: boolean }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q) return logs;
    const lc = q.toLowerCase();
    return logs.filter(l =>
      (l.recipient_email ?? "").toLowerCase().includes(lc) ||
      (l.template_name ?? "").toLowerCase().includes(lc) ||
      (l.status ?? "").toLowerCase().includes(lc)
    );
  }, [logs, q]);

  return (
    <div className="space-y-4">
      <div className="os-glass p-3 flex gap-2 flex-wrap items-center">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-white/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search recipient, template, status…"
            className="bg-transparent text-sm outline-none flex-1 placeholder:text-white/30"
          />
        </div>
        <span className="text-xs text-white/40 px-2">{filtered.length} of {logs.length}</span>
      </div>
      {!loading && filtered.length === 0 ? (
        <NoData title="No logs" detail="Nothing matched your filter." />
      ) : (
        <LogTable rows={filtered.slice(0, 200)} />
      )}
    </div>
  );
}

function LogTable({ rows }: { rows: LogRow[] }) {
  return (
    <div className="os-glass overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/50 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Recipient</th>
              <th className="text-left px-4 py-3">Template</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={(r.message_id ?? "") + i} className="border-t border-white/5">
                <td className="px-4 py-3 text-white/80 truncate max-w-[260px]">{r.recipient_email ?? "—"}</td>
                <td className="px-4 py-3 text-white/60">{r.template_name ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${Q_STATUS[r.status] ?? "bg-white/5 text-white/60"}`}>
                    {r.status}
                  </span>
                  {r.error_message && <div className="text-[10px] text-red-300/70 mt-1 truncate max-w-[320px]" title={r.error_message}>{r.error_message}</div>}
                </td>
                <td className="px-4 py-3 text-white/60">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------ ANALYTICS ------------------------------- */

function Analytics({ campaigns, counts }: { campaigns: Campaign[]; counts: Counts }) {
  const totalAttempts = counts.sent + counts.failed + counts.suppressed;
  const deliveryRate = totalAttempts ? (counts.sent / totalAttempts) * 100 : 0;
  const failureRate  = totalAttempts ? (counts.failed / totalAttempts) * 100 : 0;
  const supRate      = totalAttempts ? (counts.suppressed / totalAttempts) * 100 : 0;

  const rates = [
    { label: "Delivery Rate", value: deliveryRate, tint: "emerald" },
    { label: "Failure Rate",  value: failureRate,  tint: "red" },
    { label: "Suppression",   value: supRate,      tint: "gold" },
  ];

  return (
    <div className="space-y-6">
      {totalAttempts === 0 ? (
        <NoData title="No live data available" detail="email_send_log has no rows yet." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rates.map((r) => (
            <div key={r.label} className="os-glass p-5">
              <div className="text-xs text-white/50">{r.label}</div>
              <div className="text-3xl font-bold mt-2">{r.value.toFixed(1)}%</div>
              <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className={`h-full ${
                  r.tint === "emerald" ? "bg-emerald-400/70" :
                  r.tint === "red"     ? "bg-red-400/70"     : "bg-amber-400/70"
                }`} style={{ width: `${Math.min(100, r.value)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="os-glass p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-semibold">Campaign Performance</div>
            <div className="text-xs text-white/50">Open rate per campaign (live data from email_campaigns).</div>
          </div>
        </div>
        {campaigns.length === 0 ? (
          <div className="text-sm text-white/50">No campaigns yet.</div>
        ) : (
          <div className="space-y-3">
            {campaigns.slice(0, 10).map((c) => {
              const open = c.sent_count ? Math.round((c.opened_count / c.sent_count) * 100) : 0;
              const reply = 0;
              return (
                <div key={c.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-white/80 truncate">{c.name}</span>
                    <span className="text-white/40">{c.sent_count.toLocaleString()} sent · {open}% open</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="h-2 rounded-full bg-cyan-400/60" style={{ width: `${Math.min(100, open)}%` }} />
                    {reply > 0 && <div className="h-2 rounded-full bg-pink-400/70" style={{ width: `${reply}%` }} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ EMPTY STATES ---------------------------- */

function NoData({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="os-glass p-8 text-center">
      <Inbox className="w-8 h-8 text-white/30 mx-auto mb-3" />
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-white/50 mt-1 max-w-md mx-auto">{detail}</div>
    </div>
  );
}

function NoBackend({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="os-glass p-8 text-center">
      <Sparkles className="w-8 h-8 text-white/30 mx-auto mb-3" />
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-white/50 mt-2 max-w-md mx-auto">{detail}</div>
      <div className="text-[11px] uppercase tracking-wider text-white/40 mt-3">No live data available</div>
    </div>
  );
}
