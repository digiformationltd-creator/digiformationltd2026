import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import {
  Activity, AlertTriangle, CheckCircle2, Download, RefreshCw, Search,
  Sparkles, ShieldAlert, Undo2, Users, Zap, BarChart3, History, Gauge,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type Summary = {
  today: { total: number; executed: number; failed: number; rejected: number; rolled_back: number; avg_exec_ms: number };
  week:  { total: number; executed: number; failed: number; rolled_back: number };
  month: { total: number; executed: number; failed: number; rolled_back: number };
  active_admins_today: number;
  automation_failures_today: number;
};
type Insights = {
  top_commands: { intent: string; runs: number; executed: number; failed: number }[];
  most_failed:  { intent: string; failed: number; runs: number }[];
  most_rolled_back: { intent: string; rollbacks: number; runs: number }[];
  top_modules:  { module: string; runs: number }[];
  most_active_admins: { admin_id: string; name: string; runs: number }[];
};
type Health = {
  cards: Array<{ name: string; status: "healthy" | "warning" | "error"; window?: string;
    sent?: number; failed?: number; pending?: number; last_run?: string | null;
    last_status?: string; orders?: number; invoiced?: number; missing?: number;
    zero_amount?: number; runs?: number }>;
};
type Perf = {
  summary: {
    preview:  { p50: number; p95: number; avg: number };
    execute:  { p50: number; p95: number; avg: number };
    rollback: { p50: number; p95: number; avg: number };
  };
  trend: { day: string; runs: number; executed: number; failed: number; avg_exec_ms: number }[];
};
type AuditRow = {
  id: string; created_at: string; executed_at: string | null;
  intent: string; status: string; state: string | null; risk_tier: string | null;
  target_type: string | null; target_id: string | null; prompt: string | null;
  error: string | null; rolled_back_at: string | null;
  admin_id: string | null; admin_name: string | null;
};

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function OsAnalytics() {
  const [summary,  setSummary]  = useState<Summary | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [health,   setHealth]   = useState<Health | null>(null);
  const [perf,     setPerf]     = useState<Perf | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = async () => {
    setRefreshing(true);
    const [s, i, h, p] = await Promise.all([
      supabase.rpc("ops_dashboard_summary"),
      supabase.rpc("command_insights"),
      supabase.rpc("automation_health"),
      supabase.rpc("command_performance_metrics"),
    ]);
    if (!s.error) setSummary(s.data as Summary);
    if (!i.error) setInsights(i.data as Insights);
    if (!h.error) setHealth(h.data as Health);
    if (!p.error) setPerf(p.data as Perf);
    setLoading(false);
    setRefreshing(false);
  };
  useEffect(() => { loadAll(); }, []);

  const successRate = (s?: { total: number; executed: number }) =>
    !s || !s.total ? 0 : Math.round((s.executed / s.total) * 1000) / 10;
  const failureRate = (s?: { total: number; failed: number }) =>
    !s || !s.total ? 0 : Math.round((s.failed / s.total) * 1000) / 10;
  const rollbackRate = (s?: { total: number; rolled_back: number }) =>
    !s || !s.total ? 0 : Math.round((s.rolled_back / s.total) * 1000) / 10;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="os-glass rounded-2xl p-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-xs text-white/50 uppercase tracking-wider mb-1">
            <BarChart3 className="w-3.5 h-3.5" /> Phase 7 · Read-only
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Operations Analytics</h1>
          <p className="text-sm text-white/60 mt-1">
            Visibility into commands, automations and audit history. Nothing here triggers or modifies workflows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/automation" className="h-9 px-3 rounded-lg text-sm bg-white/5 hover:bg-white/10 inline-flex items-center gap-2">
            <Zap className="w-4 h-4" /> Automation Hub
          </Link>
          <button onClick={loadAll} disabled={refreshing}
            className="h-9 px-3 rounded-lg text-sm bg-white/10 hover:bg-white/15 inline-flex items-center gap-2 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Executive Summary banner */}
      {summary && <ExecBanner s={summary} successRate={successRate(summary.today)} />}

      <Tabs defaultValue="overview">
        <TabsList className="bg-white/5 border border-white/10 flex-wrap h-auto p-1">
          <TabsTrigger value="overview"   className="data-[state=active]:bg-white/10 gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Overview</TabsTrigger>
          <TabsTrigger value="ai"         className="data-[state=active]:bg-white/10 gap-1.5"><Sparkles className="w-3.5 h-3.5" /> AI Usage</TabsTrigger>
          <TabsTrigger value="health"     className="data-[state=active]:bg-white/10 gap-1.5"><Activity className="w-3.5 h-3.5" /> Automation Health</TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-white/10 gap-1.5"><Gauge className="w-3.5 h-3.5" /> Performance</TabsTrigger>
          <TabsTrigger value="insights"   className="data-[state=active]:bg-white/10 gap-1.5"><ShieldAlert className="w-3.5 h-3.5" /> Command Insights</TabsTrigger>
          <TabsTrigger value="audit"      className="data-[state=active]:bg-white/10 gap-1.5"><History className="w-3.5 h-3.5" /> Audit Explorer</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4">
          {loading ? <SkeletonGrid /> : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Kpi label="Commands today"   value={summary?.today.total ?? 0} />
                <Kpi label="Success rate"     value={`${successRate(summary?.today)}%`}  tone="emerald" />
                <Kpi label="Failure rate"     value={`${failureRate(summary?.today)}%`} tone="rose" />
                <Kpi label="Rollback rate"    value={`${rollbackRate(summary?.today)}%`} tone="amber" />
                <Kpi label="Avg execute (ms)" value={summary?.today.avg_exec_ms ?? 0} />
                <Kpi label="Active admins"    value={summary?.active_admins_today ?? 0} />
                <Kpi label="Commands this week"  value={summary?.week.total ?? 0} />
                <Kpi label="Commands this month" value={summary?.month.total ?? 0} />
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <ListCard title="Top 10 commands" icon={<Sparkles className="w-4 h-4" />}
                  rows={(insights?.top_commands ?? []).map((r) => ({
                    primary: r.intent, secondary: `${r.executed}/${r.runs} executed · ${r.failed} failed`,
                    metric: r.runs,
                  }))} />
                <ListCard title="Top modules used" icon={<BarChart3 className="w-4 h-4" />}
                  rows={(insights?.top_modules ?? []).map((r) => ({
                    primary: r.module, metric: r.runs,
                  }))} />
              </div>
            </>
          )}
        </TabsContent>

        {/* AI USAGE */}
        <TabsContent value="ai" className="space-y-4">
          <AiUsage insights={insights} loading={loading} perf={perf} />
        </TabsContent>

        {/* AUTOMATION HEALTH */}
        <TabsContent value="health" className="space-y-3">
          {loading ? <SkeletonGrid /> : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(health?.cards ?? []).map((c) => <HealthCard key={c.name} card={c} />)}
            </div>
          )}
        </TabsContent>

        {/* PERFORMANCE */}
        <TabsContent value="performance" className="space-y-4">
          {loading ? <SkeletonGrid /> : <PerformancePanel perf={perf} />}
        </TabsContent>

        {/* COMMAND INSIGHTS */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <ListCard title="Most successful" icon={<CheckCircle2 className="w-4 h-4 text-emerald-300" />}
              rows={(insights?.top_commands ?? [])
                .filter((r) => r.runs >= 3)
                .map((r) => ({ primary: r.intent, secondary: `${r.executed}/${r.runs}`, metric: `${Math.round(100*r.executed/r.runs)}%` }))} />
            <ListCard title="Most failed" icon={<AlertTriangle className="w-4 h-4 text-rose-300" />}
              empty="No failed commands in the window — nothing to learn from yet."
              rows={(insights?.most_failed ?? []).map((r) => ({
                primary: r.intent, secondary: `${r.failed}/${r.runs} failed`, metric: r.failed,
              }))} />
            <ListCard title="Most rolled back" icon={<Undo2 className="w-4 h-4 text-amber-300" />}
              empty="No rollbacks in the window."
              rows={(insights?.most_rolled_back ?? []).map((r) => ({
                primary: r.intent, secondary: `${r.rollbacks}/${r.runs} rolled back`, metric: r.rollbacks,
              }))} />
            <ListCard title="Most active admins" icon={<Users className="w-4 h-4" />}
              rows={(insights?.most_active_admins ?? []).map((r) => ({
                primary: r.name || "—", metric: r.runs,
              }))} />
          </div>
          <div className="os-glass rounded-2xl p-4 text-xs text-white/55 leading-relaxed">
            <strong className="text-white/80">Tip:</strong> commands that often fail or get rolled back are
            candidates for clearer Help-Center examples or stricter preview hints. Use this list to prioritise
            documentation updates — no code changes required.
          </div>
        </TabsContent>

        {/* AUDIT EXPLORER */}
        <TabsContent value="audit">
          <AuditExplorer />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────

function ExecBanner({ s, successRate }: { s: Summary; successRate: number }) {
  const lines = [
    `${s.today.total} commands executed`,
    `${successRate}% success`,
    `${s.today.rolled_back} rollback${s.today.rolled_back === 1 ? "" : "s"}`,
    `${s.active_admins_today} active admin${s.active_admins_today === 1 ? "" : "s"}`,
    `${s.automation_failures_today} automation failure${s.automation_failures_today === 1 ? "" : "s"}`,
  ];
  return (
    <div className="os-glass rounded-2xl p-5">
      <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Today</div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        {lines.map((l, i) => (
          <span key={i} className="text-white/85">{i > 0 && <span className="text-white/30 mr-6">·</span>}{l}</span>
        ))}
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number | string; tone?: "emerald" | "rose" | "amber" }) {
  const toneCls = tone === "emerald" ? "text-emerald-300" : tone === "rose" ? "text-rose-300" : tone === "amber" ? "text-amber-300" : "text-white";
  return (
    <div className="os-glass rounded-2xl p-4">
      <div className="text-[11px] text-white/50 uppercase tracking-wider">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${toneCls}`}>{value}</div>
    </div>
  );
}

function ListCard({
  title, icon, rows, empty,
}: { title: string; icon?: React.ReactNode; rows: { primary: string; secondary?: string; metric: number | string }[]; empty?: string }) {
  return (
    <div className="os-glass rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3"><span>{icon}</span><h3 className="text-sm font-semibold">{title}</h3></div>
      {rows.length === 0 ? (
        <p className="text-xs text-white/40 py-6 text-center">{empty ?? "No data yet."}</p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-1.5 px-2 rounded-lg hover:bg-white/5">
              <div className="min-w-0">
                <div className="text-sm font-mono truncate">{r.primary}</div>
                {r.secondary && <div className="text-[11px] text-white/45">{r.secondary}</div>}
              </div>
              <div className="text-sm font-semibold tabular-nums shrink-0">{r.metric}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function HealthCard({ card }: { card: Health["cards"][number] }) {
  const tone = card.status === "healthy" ? "border-emerald-400/30 bg-emerald-500/5" :
               card.status === "warning" ? "border-amber-400/30 bg-amber-500/5"   :
               "border-rose-400/30 bg-rose-500/5";
  const dot  = card.status === "healthy" ? "bg-emerald-400" :
               card.status === "warning" ? "bg-amber-400"   : "bg-rose-400";
  const label = card.status === "healthy" ? "Healthy" : card.status === "warning" ? "Warning" : "Error";
  return (
    <div className={`rounded-2xl border p-4 ${tone}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{card.name}</h3>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-white/75">
          <span className={`w-2 h-2 rounded-full ${dot}`} /> {label}
        </span>
      </div>
      <dl className="text-xs text-white/70 space-y-1">
        {card.window         && <Row k="Window"   v={card.window} />}
        {typeof card.sent    === "number" && <Row k="Sent"    v={card.sent} />}
        {typeof card.failed  === "number" && <Row k="Failed"  v={card.failed} />}
        {typeof card.pending === "number" && <Row k="Pending" v={card.pending} />}
        {typeof card.orders  === "number" && <Row k="Orders"  v={card.orders} />}
        {typeof card.invoiced === "number" && <Row k="Invoiced" v={card.invoiced} />}
        {typeof card.missing  === "number" && <Row k="Missing"  v={card.missing} />}
        {typeof card.runs     === "number" && <Row k="Runs"   v={card.runs} />}
        {typeof card.zero_amount === "number" && <Row k="Zero-amount" v={card.zero_amount} />}
        {card.last_run !== undefined && (
          <Row k="Last run" v={card.last_run ? new Date(card.last_run).toLocaleString() : "never"} />
        )}
        {card.last_status && <Row k="Last status" v={card.last_status} />}
      </dl>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string | number }) {
  return <div className="flex justify-between gap-3"><dt className="text-white/45">{k}</dt><dd className="text-white/85 tabular-nums">{v}</dd></div>;
}

function PerformancePanel({ perf }: { perf: Perf | null }) {
  if (!perf) return <SkeletonGrid />;
  const max = Math.max(1, ...perf.trend.map((d) => d.runs));
  return (
    <>
      <div className="grid sm:grid-cols-3 gap-3">
        {(["preview","execute","rollback"] as const).map((k) => {
          const s = perf.summary[k];
          return (
            <div key={k} className="os-glass rounded-2xl p-4">
              <div className="text-xs text-white/50 uppercase tracking-wider mb-2">{k} latency</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><div className="text-[10px] text-white/40">p50</div><div className="text-lg font-bold tabular-nums">{s.p50}</div></div>
                <div><div className="text-[10px] text-white/40">p95</div><div className="text-lg font-bold tabular-nums">{s.p95}</div></div>
                <div><div className="text-[10px] text-white/40">avg</div><div className="text-lg font-bold tabular-nums">{s.avg}</div></div>
              </div>
              <div className="text-[10px] text-white/40 text-center mt-2">milliseconds</div>
            </div>
          );
        })}
      </div>
      <div className="os-glass rounded-2xl p-4">
        <h3 className="text-sm font-semibold mb-3">14-day trend — commands per day</h3>
        {perf.trend.length === 0 ? (
          <p className="text-xs text-white/40 py-6 text-center">No activity in the window.</p>
        ) : (
          <div className="flex items-end gap-1 h-32">
            {perf.trend.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group" title={`${d.day} · ${d.runs} runs · ${d.executed} ok · ${d.failed} failed · avg ${d.avg_exec_ms}ms`}>
                <div className="w-full bg-blue-400/70 rounded-t group-hover:bg-blue-300 transition-colors"
                     style={{ height: `${(d.runs / max) * 100}%`, minHeight: d.runs ? "2px" : "0" }} />
                <div className="text-[9px] text-white/40">{d.day.slice(5)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function AiUsage({ insights, loading, perf }: { insights: Insights | null; loading: boolean; perf: Perf | null }) {
  // localStorage-only telemetry (per browser, optional)
  const local = useMemo(() => {
    try {
      const recents = JSON.parse(localStorage.getItem("cc.library.recents.v1") || "[]") as { prompt: string; at: number }[];
      const favs    = JSON.parse(localStorage.getItem("cc.library.favorites.v1") || "[]") as string[];
      const counts = new Map<string, number>();
      recents.forEach((r) => counts.set(r.prompt, (counts.get(r.prompt) ?? 0) + 1));
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
      return { recents, favs, top };
    } catch { return { recents: [] as { prompt: string; at: number }[], favs: [] as string[], top: [] as [string, number][] }; }
  }, []);

  if (loading) return <SkeletonGrid />;

  return (
    <>
      <div className="grid sm:grid-cols-4 gap-3">
        <Kpi label="Avg approval latency (ms)"  value={perf?.summary.preview.avg ?? 0} />
        <Kpi label="Avg execution latency (ms)" value={perf?.summary.execute.avg ?? 0} />
        <Kpi label="Recent prompts (this browser)" value={local.recents.length} />
        <Kpi label="Favourites (this browser)"     value={local.favs.length} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4 mt-3">
        <ListCard title="Most-used commands (server)" icon={<Sparkles className="w-4 h-4" />}
          rows={(insights?.top_commands ?? []).slice(0, 8).map((r) => ({ primary: r.intent, metric: r.runs }))} />
        <ListCard title="Most-used quick prompts (this browser)" icon={<Sparkles className="w-4 h-4" />}
          empty="No prompts recorded yet — use the Command Center to populate this."
          rows={local.top.map(([p, n]) => ({ primary: p.length > 60 ? p.slice(0, 60) + "…" : p, metric: n }))} />
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Audit Explorer
// ─────────────────────────────────────────────────────────────

const PAGE = 50;

function AuditExplorer() {
  const [q, setQ] = useState("");
  const [intent, setIntent] = useState("");
  const [risk, setRisk] = useState("");
  const [status, setStatus] = useState("");
  const [moduleF, setModuleF] = useState("");
  const [from, setFrom] = useState<string>(() => new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10));
  const [to,   setTo]   = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  const run = async (newOffset = 0) => {
    setLoading(true);
    setOffset(newOffset);
    const { data, error } = await supabase.rpc("audit_search", {
      _from: new Date(from).toISOString(),
      _to:   new Date(new Date(to).getTime() + 864e5 - 1).toISOString(),
      _admin: null,
      _intent: intent || null,
      _risk: risk || null,
      _status: status || null,
      _module: moduleF || null,
      _q: q || null,
      _limit: PAGE,
      _offset: newOffset,
    });
    if (!error && data) {
      setRows((data as any).rows ?? []);
      setTotal((data as any).total ?? 0);
    }
    setLoading(false);
  };
  useEffect(() => { run(0); /* initial */ /* eslint-disable-next-line */ }, []);

  const exportCsv = () => {
    if (rows.length === 0) return;
    const headers = ["created_at","admin_name","intent","status","risk_tier","target_type","target_id","executed_at","rolled_back_at","error","prompt"];
    const escape = (v: any) => {
      if (v === null || v === undefined) return "";
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const csv = [headers.join(",")].concat(
      rows.map((r) => headers.map((h) => escape((r as any)[h])).join(","))
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `audit-${from}-to-${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="os-glass rounded-2xl p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          <div className="col-span-2 lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search prompt or intent…"
              className="w-full h-9 rounded-lg pl-9 pr-3 text-sm bg-white/5 border border-white/10" />
          </div>
          <input value={intent} onChange={(e) => setIntent(e.target.value)} placeholder="Intent contains…"
            className="h-9 rounded-lg px-3 text-sm bg-white/5 border border-white/10" />
          <select value={risk} onChange={(e) => setRisk(e.target.value)}
            className="h-9 rounded-lg px-3 text-sm bg-white/5 border border-white/10">
            <option value="">All risk</option>
            <option value="safe">Safe</option>
            <option value="sensitive">Sensitive</option>
            <option value="destructive">Destructive</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="h-9 rounded-lg px-3 text-sm bg-white/5 border border-white/10">
            <option value="">All status</option>
            <option value="pending">Pending</option>
            <option value="executed">Executed</option>
            <option value="failed">Failed</option>
            <option value="rejected">Rejected</option>
          </select>
          <input value={moduleF} onChange={(e) => setModuleF(e.target.value)} placeholder="Module (target_type)"
            className="h-9 rounded-lg px-3 text-sm bg-white/5 border border-white/10" />
          <div className="flex gap-2">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="h-9 rounded-lg px-2 text-sm bg-white/5 border border-white/10 flex-1" />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="h-9 rounded-lg px-2 text-sm bg-white/5 border border-white/10 flex-1" />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 mt-3">
          <div className="text-xs text-white/50">{total.toLocaleString()} matching record{total === 1 ? "" : "s"}</div>
          <div className="flex items-center gap-2">
            <button onClick={() => run(0)} disabled={loading}
              className="h-8 px-3 rounded-lg text-xs bg-white/10 hover:bg-white/15 inline-flex items-center gap-1.5 disabled:opacity-50">
              <Search className="w-3.5 h-3.5" /> Apply
            </button>
            <button onClick={exportCsv} disabled={rows.length === 0}
              className="h-8 px-3 rounded-lg text-xs bg-white/5 hover:bg-white/10 inline-flex items-center gap-1.5 disabled:opacity-30">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="os-glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-white/50 bg-white/[0.03]">
              <tr>
                <th className="text-left p-3 font-medium">When</th>
                <th className="text-left p-3 font-medium">Admin</th>
                <th className="text-left p-3 font-medium">Intent</th>
                <th className="text-left p-3 font-medium">Risk</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Module</th>
                <th className="text-left p-3 font-medium">Prompt</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-white/5 align-top">
                  <td className="p-3 text-white/70 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3 text-white/85">{r.admin_name || "—"}</td>
                  <td className="p-3 font-mono text-xs">{r.intent}</td>
                  <td className="p-3"><RiskBadge risk={r.risk_tier} /></td>
                  <td className="p-3"><StatusBadge status={r.status} rolled={!!r.rolled_back_at} /></td>
                  <td className="p-3 text-white/60 text-xs">{r.target_type ?? "—"}</td>
                  <td className="p-3 text-white/75 max-w-md truncate" title={r.prompt ?? ""}>{r.prompt ?? "—"}</td>
                </tr>
              ))}
              {rows.length === 0 && !loading && (
                <tr><td colSpan={7} className="p-8 text-center text-white/40 text-sm">No records match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {total > PAGE && (
          <div className="flex items-center justify-between p-3 text-xs text-white/60 border-t border-white/5">
            <div>Showing {offset + 1}–{Math.min(offset + rows.length, total)} of {total.toLocaleString()}</div>
            <div className="flex gap-2">
              <button disabled={offset === 0 || loading} onClick={() => run(Math.max(0, offset - PAGE))}
                className="h-8 px-3 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30">Prev</button>
              <button disabled={offset + PAGE >= total || loading} onClick={() => run(offset + PAGE)}
                className="h-8 px-3 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RiskBadge({ risk }: { risk: string | null }) {
  if (!risk) return <span className="text-white/30 text-xs">—</span>;
  const cls = risk === "destructive" ? "text-rose-300 bg-rose-500/10" :
              risk === "sensitive"   ? "text-amber-300 bg-amber-500/10" :
              "text-emerald-300 bg-emerald-500/10";
  return <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${cls}`}>{risk}</span>;
}
function StatusBadge({ status, rolled }: { status: string; rolled: boolean }) {
  const tone =
    rolled              ? "text-amber-300 bg-amber-500/10" :
    status === "executed" ? "text-emerald-300 bg-emerald-500/10" :
    status === "failed"   ? "text-rose-300 bg-rose-500/10" :
    status === "rejected" ? "text-white/55 bg-white/10" :
                            "text-blue-300 bg-blue-500/10";
  return <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${tone}`}>{rolled ? "rolled-back" : status}</span>;
}

function SkeletonGrid() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="os-glass rounded-2xl p-4 animate-pulse">
          <div className="h-3 w-24 bg-white/10 rounded" />
          <div className="h-8 w-16 bg-white/10 rounded mt-3" />
        </div>
      ))}
    </div>
  );
}
