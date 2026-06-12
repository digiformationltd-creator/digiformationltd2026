import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, TrendingUp, Award, Users, ShoppingBag, PoundSterling, Percent, Download } from "lucide-react";
import { SOURCE_OPTIONS } from "@/components/attribution/SourceHeardPicker";

type Row = {
  source: string; category: string;
  leads: number; orders: number; revenue: number; conv_rate: number; aov: number;
};

const RANGES: { id: string; label: string; days: number | null }[] = [
  { id: "7", label: "Last 7 days", days: 7 },
  { id: "30", label: "Last 30 days", days: 30 },
  { id: "90", label: "Last 90 days", days: 90 },
  { id: "365", label: "Last year", days: 365 },
  { id: "all", label: "All time", days: null },
];

const labelFor = (id: string) => SOURCE_OPTIONS.find((s) => s.id === id)?.label || id;
const emojiFor = (id: string) => SOURCE_OPTIONS.find((s) => s.id === id)?.emoji || "•";

const AI_IDS = ["chatgpt","gemini","claude","perplexity","grok","deepseek","copilot","other_ai"];

const fmtGBP = (n: number) => `£${Number(n || 0).toLocaleString("en-GB")}`;

export default function OsAttribution() {
  const [range, setRange] = useState("90");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const days = RANGES.find((r) => r.id === range)?.days;
    const since = days === null
      ? new Date(2000, 0, 1).toISOString()
      : new Date(Date.now() - (days as number) * 86400000).toISOString();

    supabase.rpc("attribution_totals_by_source", { _since: since }).then(({ data, error }) => {
      if (cancelled) return;
      if (error) console.error(error);
      setRows((data || []) as Row[]);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [range]);

  const totalLeads = rows.reduce((s, r) => s + Number(r.leads || 0), 0);
  const totalOrders = rows.reduce((s, r) => s + Number(r.orders || 0), 0);
  const totalRevenue = rows.reduce((s, r) => s + Number(r.revenue || 0), 0);
  const topChannel = rows[0];
  const aiRows = rows.filter((r) => AI_IDS.includes(r.source));
  const topAI = aiRows.slice().sort((a, b) => Number(b.revenue) - Number(a.revenue))[0];
  const topConv = rows.slice().sort((a, b) => Number(b.conv_rate) - Number(a.conv_rate))
    .find((r) => Number(r.leads) >= 3) || rows[0];
  const topAOV = rows.slice().sort((a, b) => Number(b.aov) - Number(a.aov))
    .find((r) => Number(r.orders) >= 1) || rows[0];

  // Insights
  const insights: string[] = [];
  if (topChannel) insights.push(`${labelFor(topChannel.source)} is your top revenue channel with ${fmtGBP(Number(topChannel.revenue))} from ${topChannel.orders} orders.`);
  if (topAI) insights.push(`${labelFor(topAI.source)} is the strongest AI source — ${topAI.leads} leads, ${topAI.orders} orders, ${fmtGBP(Number(topAI.revenue))}.`);
  if (topConv && Number(topConv.conv_rate) > 0) insights.push(`Highest conversion: ${labelFor(topConv.source)} at ${Number(topConv.conv_rate).toFixed(1)}%.`);
  if (topAOV) insights.push(`Highest average order value: ${labelFor(topAOV.source)} at ${fmtGBP(Number(topAOV.aov))}.`);
  if (rows.some((r) => r.category === "ai") && rows.some((r) => r.category === "search")) {
    const aiLeads = rows.filter((r) => r.category === "ai").reduce((s, r) => s + Number(r.leads), 0);
    const searchLeads = rows.filter((r) => r.category === "search").reduce((s, r) => s + Number(r.leads), 0);
    if (aiLeads > searchLeads) insights.push(`AI platforms now send more leads than search engines (${aiLeads} vs ${searchLeads}).`);
  }

  const exportCSV = () => {
    const head = "Source,Category,Leads,Orders,Revenue (GBP),Conv %,AOV (GBP)\n";
    const body = rows.map((r) =>
      [labelFor(r.source), r.category, r.leads, r.orders, r.revenue, r.conv_rate, r.aov].join(",")
    ).join("\n");
    const blob = new Blob([head + body], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `attribution-${range}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 os-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Lead Attribution</h1>
          <p className="text-sm text-white/60">Where every lead, order and pound comes from — including AI platforms.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm"
          >
            {RANGES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
          <button onClick={exportCSV} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-sm hover:bg-white/[0.08]">
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Total Leads" value={String(totalLeads)} icon={Users} tone="purple" />
        <Kpi label="Total Orders" value={String(totalOrders)} icon={ShoppingBag} tone="green" />
        <Kpi label="Revenue" value={fmtGBP(totalRevenue)} icon={PoundSterling} tone="lime" />
        <Kpi label="Top Channel" value={topChannel ? labelFor(topChannel.source) : "—"} sub={topChannel ? fmtGBP(Number(topChannel.revenue)) : ""} icon={Award} tone="amber" />
        <Kpi label="Top AI Platform" value={topAI ? labelFor(topAI.source) : "—"} sub={topAI ? `${topAI.orders} orders` : ""} icon={Sparkles} tone="blue" />
        <Kpi label="Best Conv. Rate" value={topConv ? `${Number(topConv.conv_rate).toFixed(1)}%` : "—"} sub={topConv ? labelFor(topConv.source) : ""} icon={Percent} tone="cyan" />
        <Kpi label="Highest AOV" value={topAOV ? fmtGBP(Number(topAOV.aov)) : "—"} sub={topAOV ? labelFor(topAOV.source) : ""} icon={TrendingUp} tone="pink" />
        <Kpi label="AI Leads" value={String(aiRows.reduce((s, r) => s + Number(r.leads), 0))} icon={Sparkles} tone="purple" />
      </div>

      {/* AI breakdown cards */}
      <div className="os-glass os-glow-blue p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-blue-400" /> AI Recommendation Tracking</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {AI_IDS.map((id) => {
            const r = aiRows.find((x) => x.source === id);
            return (
              <div key={id} className="rounded-xl bg-white/[0.03] border border-white/5 p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{emojiFor(id)}</span>
                  <div className="font-semibold text-sm">{labelFor(id)}</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <Stat label="Leads" value={r?.leads ?? 0} />
                  <Stat label="Orders" value={r?.orders ?? 0} />
                  <Stat label="Conv" value={`${Number(r?.conv_rate || 0).toFixed(0)}%`} />
                </div>
                <div className="text-xs mt-2 text-green-400 mono font-semibold">{fmtGBP(Number(r?.revenue || 0))}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* By source table */}
      <div className="os-glass os-glow-green p-5">
        <h3 className="font-semibold mb-4">Performance by Source</h3>
        {loading ? (
          <div className="text-sm text-white/60">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-white/60">No attribution data yet. Place your first tracked order to populate this view.</div>
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
                {rows.map((r) => (
                  <tr key={r.source + r.category} className="border-b border-white/5">
                    <td className="py-2 pr-3 font-medium">{emojiFor(r.source)} {labelFor(r.source)}</td>
                    <td className="py-2 pr-3 text-xs uppercase text-white/50">{r.category}</td>
                    <td className="py-2 pr-3 text-right mono">{r.leads}</td>
                    <td className="py-2 pr-3 text-right mono">{r.orders}</td>
                    <td className="py-2 pr-3 text-right mono text-green-400 font-semibold">{fmtGBP(Number(r.revenue))}</td>
                    <td className="py-2 pr-3 text-right mono">{Number(r.conv_rate).toFixed(1)}%</td>
                    <td className="py-2 pr-3 text-right mono">{fmtGBP(Number(r.aov))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="os-glass os-glow-purple p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-purple-400" /> Auto Insights</h3>
          <ul className="space-y-2 text-sm">
            {insights.map((t, i) => (
              <li key={i} className="flex gap-2"><span className="text-purple-400">•</span><span>{t}</span></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, sub, icon: Icon, tone }: { label: string; value: string; sub?: string; icon: any; tone: string }) {
  return (
    <div className={`os-glass os-glow-${tone} p-5`}>
      <div className="flex items-start justify-between">
        <div className="text-xs uppercase tracking-wider text-white/50 font-semibold">{label}</div>
        <div className={`w-9 h-9 rounded-lg grid place-items-center bg-${tone}-500/10 text-${tone}-400`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-bold mono truncate">{value}</div>
      {sub && <div className="text-xs text-white/40 mt-1 truncate">{sub}</div>}
    </div>
  );
}
function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-white/50">{label}</div>
      <div className="mono font-semibold">{value}</div>
    </div>
  );
}
