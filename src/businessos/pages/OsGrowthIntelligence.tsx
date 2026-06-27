// Growth Intelligence
// Decision-making dashboard. Every widget answers a single business question and
// drills down into the underlying records. Powered by:
//   - rpc('growth_overview',         { _since, _until })  → KPIs + by_source + by_category
//   - rpc('growth_records_by_source',{ _since, _until, _source?, _category? })  → drill-down list
// Reuses existing BUSINESS OS look (os-glass, os-glow-*, os-fade-in) for native feel.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SOURCE_OPTIONS } from "@/lib/attribution-sources";
import {
  Users, UserCheck, ShoppingBag, PoundSterling, Percent, Sparkles, Search,
  Share2, Globe, HelpCircle, X, ExternalLink, Loader2, Download, Calendar,
  TrendingUp, TrendingDown, Minus, Activity, ArrowRight,
} from "lucide-react";

type SourceRow = {
  source: string; category: string;
  leads: number; orders: number; revenue: number;
  conv_rate: number; aov: number;
};
type CategoryRow = { category: string; leads: number; orders: number; revenue: number };
type Overview = {
  visitors: number; leads: number; orders: number; revenue: number; conv_rate: number;
  by_source: SourceRow[]; by_category: CategoryRow[];
};

const labelFor = (id: string) => SOURCE_OPTIONS.find((s) => s.id === id)?.label || id;
const emojiFor = (id: string) => SOURCE_OPTIONS.find((s) => s.id === id)?.emoji || "•";
const fmtGBP = (n: number) => `£${Number(n || 0).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
const fmtPct = (n: number) => `${Number(n || 0).toFixed(1)}%`;

const RANGES = [
  { id: "today", label: "Today" },
  { id: "7",     label: "Last 7 days" },
  { id: "30",    label: "Last 30 days" },
  { id: "90",    label: "Last 90 days" },
  { id: "custom",label: "Custom" },
] as const;

function rangeToWindow(range: string, fromISO?: string, toISO?: string): { since: Date; until: Date } {
  const now = new Date();
  const startOfToday = new Date(now); startOfToday.setHours(0,0,0,0);
  if (range === "today") return { since: startOfToday, until: now };
  if (range === "custom" && fromISO && toISO) {
    const since = new Date(fromISO); since.setHours(0,0,0,0);
    const until = new Date(toISO);   until.setHours(23,59,59,999);
    return { since, until };
  }
  const days = parseInt(range, 10) || 30;
  return { since: new Date(now.getTime() - days * 86400000), until: now };
}

// Previous comparison window: same length, immediately preceding `since`.
function previousWindow(since: Date, until: Date): { since: Date; until: Date } {
  const span = until.getTime() - since.getTime();
  return { since: new Date(since.getTime() - span), until: new Date(since.getTime()) };
}

const CATEGORY_META: Record<string, { label: string; icon: any; tone: string; q: string }> = {
  ai:       { label: "AI Referrals",     icon: Sparkles,   tone: "purple", q: "How much business is AI driving?" },
  search:   { label: "Search Referrals", icon: Search,     tone: "blue",   q: "Is SEO bringing customers?" },
  social:   { label: "Social Media",     icon: Share2,     tone: "pink",   q: "Are social channels paying off?" },
  direct:   { label: "Direct & Referral",icon: Globe,      tone: "green",  q: "How strong is brand demand?" },
  unknown:  { label: "Unknown",          icon: HelpCircle, tone: "amber",  q: "How much data is missing?" },
};
const CATEGORY_ORDER = ["ai","search","social","direct","unknown"];

/* ------------- Rule-based business health (no AI opinions) ------------- */
type HealthStatus = "excellent" | "good" | "attention";
function computeHealth(curr: Overview | null, prev: Overview | null): {
  status: HealthStatus; label: string; tone: string; reasons: string[];
} {
  if (!curr) return { status: "good", label: "—", tone: "white", reasons: [] };
  let score = 0;
  const reasons: string[] = [];

  // Conversion rate (lead → order)
  if (curr.conv_rate >= 8) { score += 2; reasons.push(`Conversion strong at ${fmtPct(curr.conv_rate)}`); }
  else if (curr.conv_rate >= 3) { score += 1; }
  else if (curr.leads >= 5) { score -= 1; reasons.push(`Conversion low at ${fmtPct(curr.conv_rate)}`); }

  // Lead volume vs previous period
  if (prev) {
    const leadDelta = prev.leads === 0 ? (curr.leads > 0 ? 100 : 0) : ((curr.leads - prev.leads) / prev.leads) * 100;
    if (leadDelta >= 10) { score += 1; reasons.push(`Leads up ${leadDelta.toFixed(0)}% vs previous period`); }
    else if (leadDelta <= -15) { score -= 1; reasons.push(`Leads down ${Math.abs(leadDelta).toFixed(0)}% vs previous period`); }

    const revDelta = prev.revenue === 0 ? (curr.revenue > 0 ? 100 : 0) : ((curr.revenue - prev.revenue) / prev.revenue) * 100;
    if (revDelta >= 10) { score += 1; reasons.push(`Revenue up ${revDelta.toFixed(0)}%`); }
    else if (revDelta <= -15) { score -= 1; reasons.push(`Revenue down ${Math.abs(revDelta).toFixed(0)}%`); }

    const visDelta = prev.visitors === 0 ? 0 : ((curr.visitors - prev.visitors) / prev.visitors) * 100;
    if (visDelta <= -25 && curr.visitors > 0) { score -= 1; reasons.push(`Visitor traffic down ${Math.abs(visDelta).toFixed(0)}%`); }
  }

  // Activity floor
  if (curr.leads === 0 && curr.visitors < 5) { score -= 2; reasons.push("Very low activity in this period"); }

  let status: HealthStatus = "good";
  let label = "Good";
  let tone = "blue";
  if (score >= 3) { status = "excellent"; label = "Excellent"; tone = "green"; }
  else if (score <= -1) { status = "attention"; label = "Needs Attention"; tone = "amber"; }

  return { status, label, tone, reasons: reasons.slice(0, 4) };
}

/* ------------- Actionable insights (data-driven, no speculation) ------------- */
type Insight = { tone: "up"|"down"|"flat"; text: string };
function computeInsights(curr: Overview | null, prev: Overview | null): Insight[] {
  if (!curr || !prev) return [];
  const out: Insight[] = [];

  const catMap = (ov: Overview) => Object.fromEntries((ov.by_category || []).map(c => [c.category, c]));
  const c = catMap(curr); const p = catMap(prev);

  const pctChange = (a: number, b: number) =>
    b === 0 ? (a > 0 ? 100 : 0) : ((a - b) / b) * 100;

  // AI referrals trend
  const aiNow = c.ai?.leads || 0, aiPrev = p.ai?.leads || 0;
  if (aiNow >= 3 || aiPrev >= 3) {
    const d = pctChange(aiNow, aiPrev);
    if (d >= 15) out.push({ tone: "up", text: `AI referrals increased ${d.toFixed(0)}% (${aiPrev} → ${aiNow} leads).` });
    else if (d <= -15) out.push({ tone: "down", text: `AI referrals dropped ${Math.abs(d).toFixed(0)}% (${aiPrev} → ${aiNow} leads).` });
  }

  // Search trend
  const sNow = c.search?.leads || 0, sPrev = p.search?.leads || 0;
  if (sNow >= 3 || sPrev >= 3) {
    const d = pctChange(sNow, sPrev);
    if (d <= -15) out.push({ tone: "down", text: `Search traffic dropped ${Math.abs(d).toFixed(0)}% vs previous period.` });
    else if (d >= 15) out.push({ tone: "up", text: `Search traffic up ${d.toFixed(0)}% vs previous period.` });
  }

  // Social vs Search by orders
  const socO = c.social?.orders || 0, srcO = c.search?.orders || 0;
  if (socO > srcO && socO >= 2) {
    out.push({ tone: "up", text: `Social is producing more orders than Search (${socO} vs ${srcO}).` });
  }

  // Conversion change
  const convDelta = curr.conv_rate - prev.conv_rate;
  if (Math.abs(convDelta) >= 1 && (curr.leads >= 5 || prev.leads >= 5)) {
    if (convDelta > 0) out.push({ tone: "up", text: `Conversion improved by ${convDelta.toFixed(1)} pts (${fmtPct(prev.conv_rate)} → ${fmtPct(curr.conv_rate)}).` });
    else out.push({ tone: "down", text: `Conversion fell by ${Math.abs(convDelta).toFixed(1)} pts (${fmtPct(prev.conv_rate)} → ${fmtPct(curr.conv_rate)}).` });
  }

  // Revenue vs leads divergence
  const leadDelta = pctChange(curr.leads, prev.leads);
  const revDelta = pctChange(curr.revenue, prev.revenue);
  if (revDelta >= 15 && leadDelta <= 0 && curr.revenue > 0) {
    out.push({ tone: "up", text: `Revenue increased ${revDelta.toFixed(0)}% despite fewer leads — order value is rising.` });
  }
  if (revDelta <= -15 && leadDelta >= 0) {
    out.push({ tone: "down", text: `Revenue fell ${Math.abs(revDelta).toFixed(0)}% even though leads held steady — average order value is dropping.` });
  }

  // Unknown share warning
  const totalLeads = curr.leads || 0;
  const unknownLeads = c.unknown?.leads || 0;
  if (totalLeads >= 10 && unknownLeads / totalLeads >= 0.4) {
    out.push({ tone: "flat", text: `${Math.round((unknownLeads/totalLeads)*100)}% of leads have no source — review attribution coverage.` });
  }

  return out.slice(0, 5);
}

export default function OsGrowthIntelligence() {
  const navigate = useNavigate();
  const [range, setRange] = useState<string>("30");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate]     = useState<string>("");
  const [loading, setLoading]   = useState(true);
  const [data, setData]         = useState<Overview | null>(null);
  const [prevData, setPrevData] = useState<Overview | null>(null);

  // Drill-down drawer state
  const [drill, setDrill] = useState<{ kind: "source"|"category"; key: string; label: string } | null>(null);

  const { since, until } = useMemo(
    () => rangeToWindow(range, fromDate, toDate),
    [range, fromDate, toDate]
  );
  const prevWin = useMemo(() => previousWindow(since, until), [since, until]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      supabase.rpc("growth_overview", { _since: since.toISOString(), _until: until.toISOString() }),
      supabase.rpc("growth_overview", { _since: prevWin.since.toISOString(), _until: prevWin.until.toISOString() }),
    ]).then(([curr, prev]) => {
      if (cancelled) return;
      if (curr.error) { console.error(curr.error); setData(null); }
      else setData(curr.data as unknown as Overview);
      if (prev.error) setPrevData(null);
      else setPrevData(prev.data as unknown as Overview);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [since.getTime(), until.getTime(), prevWin.since.getTime(), prevWin.until.getTime()]);

  const ov = data;
  const health = useMemo(() => computeHealth(data, prevData), [data, prevData]);
  const insights = useMemo(() => computeInsights(data, prevData), [data, prevData]);

  const exportCSV = () => {
    if (!ov) return;
    const head = "Source,Category,Leads,Orders,Revenue (GBP),Conv %,AOV (GBP)\n";
    const body = (ov.by_source || []).map((r) =>
      [labelFor(r.source), r.category, r.leads, r.orders, r.revenue, r.conv_rate, r.aov].join(",")
    ).join("\n");
    const blob = new Blob([head + body], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `growth-intelligence-${range}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 os-fade-in">
      {/* Header + filters */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" /> Growth Intelligence
          </h1>
          <p className="text-sm text-white/60">
            Where customers come from, what they convert to, and which channels deserve more investment.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm"
          >
            {RANGES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
          {range === "custom" && (
            <div className="flex items-center gap-1 text-xs">
              <Calendar className="w-3.5 h-3.5 text-white/50" />
              <input type="date" value={fromDate} onChange={(e)=>setFromDate(e.target.value)}
                className="bg-white/[0.04] border border-white/10 rounded-lg px-2 py-2" />
              <span className="text-white/40">→</span>
              <input type="date" value={toDate} onChange={(e)=>setToDate(e.target.value)}
                className="bg-white/[0.04] border border-white/10 rounded-lg px-2 py-2" />
            </div>
          )}
          <button onClick={exportCSV} disabled={!ov}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-sm hover:bg-white/[0.08] disabled:opacity-40">
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
      </div>

      {/* Business Health — single decision-first banner */}
      <div className={`os-glass os-glow-${health.tone} p-5`}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className={`w-12 h-12 rounded-xl grid place-items-center bg-${health.tone}-500/15 text-${health.tone}-400 shrink-0`}>
              <Activity className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider text-white/50 font-semibold">Business Health</div>
              <div className={`text-2xl font-bold mt-0.5 text-${health.tone}-300`}>
                {loading ? <span className="inline-block w-32 h-7 bg-white/5 rounded animate-pulse" /> : health.label}
              </div>
              {!loading && health.reasons.length > 0 && (
                <ul className="mt-2 text-xs text-white/60 space-y-0.5">
                  {health.reasons.map((r, i) => <li key={i}>• {r}</li>)}
                </ul>
              )}
              {!loading && health.reasons.length === 0 && (
                <div className="text-xs text-white/40 mt-2">Not enough activity in this period to draw conclusions.</div>
              )}
            </div>
          </div>
          {/* Quick actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <QuickAction icon={ShoppingBag} label="View Orders" onClick={() => navigate("/admin/orders")} />
            <QuickAction icon={UserCheck} label="View Leads" onClick={() => navigate("/admin/automation/leads")} />
            <QuickAction icon={Download} label="Export CSV" onClick={exportCSV} disabled={!ov} />
          </div>
        </div>
      </div>

      {/* Priority KPIs — top of dashboard, business health in 1 second */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Kpi label="Visitors" value={ov ? ov.visitors.toLocaleString() : "—"}
             prev={prevData?.visitors} curr={ov?.visitors}
             sub="Unique sessions" icon={Users} tone="cyan" loading={loading} />
        <Kpi label="Leads" value={ov ? ov.leads.toLocaleString() : "—"}
             prev={prevData?.leads} curr={ov?.leads}
             sub="Inquiries + orders (deduped)" icon={UserCheck} tone="purple" loading={loading} />
        <Kpi label="Orders" value={ov ? ov.orders.toLocaleString() : "—"}
             prev={prevData?.orders} curr={ov?.orders}
             sub="Paid + in-progress" icon={ShoppingBag} tone="green" loading={loading} />
        <Kpi label="Conversion" value={ov ? fmtPct(ov.conv_rate) : "—"}
             prev={prevData?.conv_rate} curr={ov?.conv_rate} suffix="pts"
             sub="Lead → order" icon={Percent} tone="amber" loading={loading} />
        <Kpi label="Revenue" value={ov ? fmtGBP(ov.revenue) : "—"}
             prev={prevData?.revenue} curr={ov?.revenue}
             sub="Priced orders only" icon={PoundSterling} tone="lime" loading={loading} />
      </div>

      {/* Actionable insights — only when data supports them */}
      {!loading && insights.length > 0 && (
        <div className="os-glass os-glow-blue p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" /> What changed vs previous period
            </h3>
            <span className="text-[11px] text-white/40">Rule-based, derived from your data</span>
          </div>
          <ul className="space-y-2">
            {insights.map((ins, i) => {
              const Icon = ins.tone === "up" ? TrendingUp : ins.tone === "down" ? TrendingDown : Minus;
              const color = ins.tone === "up" ? "text-green-400" : ins.tone === "down" ? "text-rose-400" : "text-white/50";
              return (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
                  <span className="text-white/80">{ins.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Category breakdown — 5 cards covering the channels the user listed */}
      <div className="os-glass os-glow-purple p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Lead Sources by Channel</h3>
          <span className="text-[11px] text-white/40">Click any card to see the customers behind it</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {CATEGORY_ORDER.map((cat) => {
            const meta = CATEGORY_META[cat];
            const row = ov?.by_category?.find((c) => c.category === cat);
            const leads = row?.leads || 0;
            const orders = row?.orders || 0;
            const revenue = row?.revenue || 0;
            const totalLeads = ov?.leads || 0;
            const share = totalLeads > 0 ? Math.round((leads / totalLeads) * 100) : 0;
            const Icon = meta.icon;
            return (
              <button
                key={cat}
                onClick={() => leads > 0 && setDrill({ kind: "category", key: cat, label: meta.label })}
                disabled={leads === 0}
                className={`text-left rounded-xl bg-white/[0.03] border border-white/5 p-4 hover:bg-white/[0.06] hover:border-white/10 transition disabled:opacity-50 disabled:hover:bg-white/[0.03] disabled:cursor-default`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 rounded-lg grid place-items-center bg-${meta.tone}-500/10 text-${meta.tone}-400`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="font-semibold text-sm">{meta.label}</div>
                </div>
                <div className="text-2xl font-bold mono">{leads.toLocaleString()}</div>
                <div className="text-[11px] text-white/50 mt-0.5">leads • {share}% share</div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-white/60">{orders} orders</span>
                  <span className="text-green-400 mono font-semibold">{fmtGBP(revenue)}</span>
                </div>
                <div className="text-[10px] text-white/30 mt-2 italic">{meta.q}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Top sources table — drill-down per source */}
      <div className="os-glass os-glow-green p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Top Sources</h3>
          <button
            onClick={() => navigate("/admin/automation/leads")}
            className="text-[11px] text-white/50 hover:text-white/80 inline-flex items-center gap-1"
          >
            Open all leads <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        {loading ? (
          <div className="text-sm text-white/60 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
        ) : !ov || ov.by_source.length === 0 ? (
          <div className="text-sm text-white/60">No attribution data for this range yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-white/50 border-b border-white/10">
                  <th className="py-2 pr-3">Source</th>
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 pr-3 text-right">Leads</th>
                  <th className="py-2 pr-3 text-right">Orders</th>
                  <th className="py-2 pr-3 text-right">Revenue</th>
                  <th className="py-2 pr-3 text-right">Conv %</th>
                  <th className="py-2 pr-3 text-right">AOV</th>
                </tr>
              </thead>
              <tbody>
                {ov.by_source.map((r) => (
                  <tr
                    key={r.source}
                    onClick={() => setDrill({ kind: "source", key: r.source, label: labelFor(r.source) })}
                    className="border-b border-white/5 hover:bg-white/[0.03] cursor-pointer"
                  >
                    <td className="py-2 pr-3 font-medium">{emojiFor(r.source)} {labelFor(r.source)}</td>
                    <td className="py-2 pr-3 text-xs uppercase text-white/50">{r.category}</td>
                    <td className="py-2 pr-3 text-right mono">{r.leads}</td>
                    <td className="py-2 pr-3 text-right mono">{r.orders}</td>
                    <td className="py-2 pr-3 text-right mono text-green-400 font-semibold">{fmtGBP(Number(r.revenue))}</td>
                    <td className="py-2 pr-3 text-right mono">{fmtPct(Number(r.conv_rate))}</td>
                    <td className="py-2 pr-3 text-right mono">{fmtGBP(Number(r.aov))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drill-down drawer */}
      {drill && (
        <DrillDrawer
          kind={drill.kind}
          keyId={drill.key}
          title={drill.label}
          since={since}
          until={until}
          onClose={() => setDrill(null)}
          onOpenOrder={(id) => navigate(`/admin/orders?focus=${id}`)}
          onOpenInquiry={(id) => navigate(`/admin/automation/leads?focus=${id}`)}
        />
      )}
    </div>
  );
}

/* ------------------------------ Quick action ------------------------------ */
function QuickAction({ icon: Icon, label, onClick, disabled }:
  { icon: any; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-xs hover:bg-white/[0.08] disabled:opacity-40"
    >
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );
}

/* ------------------------------ KPI card ------------------------------ */
function Kpi({ label, value, sub, icon: Icon, tone, loading, curr, prev, suffix }:
  { label: string; value: string; sub?: string; icon: any; tone: string; loading?: boolean;
    curr?: number; prev?: number; suffix?: string; }) {
  let delta: { text: string; up: boolean | null } | null = null;
  if (typeof curr === "number" && typeof prev === "number") {
    if (suffix === "pts") {
      const d = curr - prev;
      if (Math.abs(d) >= 0.1) delta = { text: `${d >= 0 ? "+" : ""}${d.toFixed(1)} pts`, up: d >= 0 };
    } else if (prev === 0 && curr > 0) {
      delta = { text: "new", up: true };
    } else if (prev > 0) {
      const pct = ((curr - prev) / prev) * 100;
      if (Math.abs(pct) >= 1) delta = { text: `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`, up: pct >= 0 };
    }
  }
  return (
    <div className={`os-glass os-glow-${tone} p-5`}>
      <div className="flex items-start justify-between">
        <div className="text-xs uppercase tracking-wider text-white/50 font-semibold">{label}</div>
        <div className={`w-9 h-9 rounded-lg grid place-items-center bg-${tone}-500/10 text-${tone}-400`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-bold mono truncate">
        {loading ? <span className="inline-block w-16 h-6 bg-white/5 rounded animate-pulse" /> : value}
      </div>
      <div className="flex items-center justify-between mt-1 gap-2">
        {sub && <div className="text-xs text-white/40 truncate">{sub}</div>}
        {delta && !loading && (
          <div className={`text-[11px] mono font-semibold shrink-0 ${delta.up ? "text-green-400" : "text-rose-400"}`}>
            {delta.text}
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------- Drill-down drawer --------------------------- */
type DrillRecord = {
  entity_type: string;
  entity_id: string;
  name: string | null;
  email: string | null;
  service: string | null;
  amount_gbp: number;
  status: string;
  converted_at: string;
  source: string | null;
  category: string | null;
  order_id: string | null;
  inquiry_id: string | null;
};

function DrillDrawer({
  kind, keyId, title, since, until, onClose, onOpenOrder, onOpenInquiry,
}: {
  kind: "source" | "category";
  keyId: string;
  title: string;
  since: Date;
  until: Date;
  onClose: () => void;
  onOpenOrder: (id: string) => void;
  onOpenInquiry: (id: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<DrillRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase.rpc("growth_records_by_source", {
      _since: since.toISOString(),
      _until: until.toISOString(),
      _source: kind === "source" ? keyId : null,
      _category: kind === "category" ? keyId : null,
    }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) console.error(error);
      setRows((data || []) as DrillRecord[]);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [kind, keyId, since.getTime(), until.getTime()]);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full sm:max-w-2xl bg-[#0a0a14] border-l border-white/10 flex flex-col">
        <div className="p-5 border-b border-white/10 flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-white/40">
              {kind === "category" ? "Channel" : "Source"} • {rows.length} record{rows.length === 1 ? "" : "s"}
            </div>
            <h3 className="text-lg font-bold mt-1">{title}</h3>
            <div className="text-[11px] text-white/40 mt-0.5">
              {since.toLocaleDateString("en-GB")} → {until.toLocaleDateString("en-GB")}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {loading ? (
            <div className="text-sm text-white/60 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-white/60">No records found for this selection.</div>
          ) : rows.map((r) => {
            const isOrder = r.order_id != null;
            const open = () => isOrder ? onOpenOrder(r.order_id!) : r.inquiry_id ? onOpenInquiry(r.inquiry_id) : null;
            return (
              <button
                key={r.entity_type + r.entity_id}
                onClick={open}
                className="w-full text-left rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] p-3.5 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-semibold ${
                        isOrder ? "bg-green-500/15 text-green-300" : "bg-purple-500/15 text-purple-300"
                      }`}>
                        {isOrder ? "Order" : "Inquiry"}
                      </span>
                      <span className="text-xs text-white/50">{r.status}</span>
                    </div>
                    <div className="font-medium mt-1.5 truncate">{r.name || "Unknown"}</div>
                    <div className="text-xs text-white/50 truncate">{r.email || "—"}</div>
                    <div className="text-xs text-white/40 truncate mt-1">{r.service || "—"}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold mono text-green-400">{fmtGBP(Number(r.amount_gbp || 0))}</div>
                    <div className="text-[11px] text-white/40 mt-1">
                      {new Date(r.converted_at).toLocaleDateString("en-GB")}
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-white/30 mt-2 ml-auto group-hover:text-white/70" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
