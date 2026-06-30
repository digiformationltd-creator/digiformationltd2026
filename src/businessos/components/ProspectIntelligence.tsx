// Phase 3 — Live dashboard widgets + Prospect Timeline drawer.
// Pure UI. Reads RPC prospect_dashboard_stats + prospect_timeline.

import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, X, Sparkles, Send, Reply, Calendar, ShoppingCart,
  CheckCircle2, XCircle, Target, Activity,
} from "lucide-react";

type Stats = {
  awaiting_qualification: number;
  qualified_today: number;
  imported_today: number;
  active_campaigns: number;
  auto_campaigns_assigned: number;
  reply_rate: number;
  replies_today: number;
  meetings_today: number;
  orders_today: number;
  meetings_booked: number;
  orders_generated: number;
  conversion_rate: number;
  avg_confidence: number;
  rejected_total: number;
  top_campaign: string | null;
  best_industry: string | null;
};

export function ProspectDashboardWidgets() {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase.rpc("prospect_dashboard_stats");
      if (!cancelled) setS(data as Stats);
    };
    load();
    const i = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(i); };
  }, []);

  const items: { label: string; value: string | number; tint: string }[] = s
    ? [
        { label: "Imported Today",          value: s.imported_today,          tint: "bg-cyan-500/10 text-cyan-300" },
        { label: "Qualified Today",         value: s.qualified_today,         tint: "bg-cyan-500/10 text-cyan-300" },
        { label: "Active Campaigns",        value: s.active_campaigns,        tint: "bg-indigo-500/10 text-indigo-300" },
        { label: "Replies Today",           value: s.replies_today,           tint: "bg-purple-500/10 text-purple-300" },
        { label: "Meetings Today",          value: s.meetings_today,          tint: "bg-emerald-500/10 text-emerald-300" },
        { label: "Orders Today",            value: s.orders_today,            tint: "bg-emerald-500/10 text-emerald-300" },
        { label: "Conversion Rate",         value: `${s.conversion_rate}%`,   tint: "bg-amber-500/10 text-amber-300" },
        { label: "AI Confidence",           value: s.avg_confidence ? `${Math.round(Number(s.avg_confidence) * 100)}%` : "—", tint: "bg-white/5 text-white/70" },
        { label: "Awaiting Qualification",  value: s.awaiting_qualification,  tint: "bg-amber-500/10 text-amber-300" },
        { label: "Reply Rate",              value: `${s.reply_rate}%`,        tint: "bg-purple-500/10 text-purple-300" },
        { label: "Top Performing Campaign", value: s.top_campaign ?? "—",     tint: "bg-indigo-500/10 text-indigo-300" },
        { label: "Best Industry",           value: s.best_industry ?? "—",    tint: "bg-emerald-500/10 text-emerald-300" },
      ]
    : [];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {!s
        ? Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="os-glass p-3 animate-pulse h-[78px]" />
          ))
        : items.map((it) => (
            <div key={it.label} className="os-glass p-3">
              <div className={`inline-flex text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${it.tint}`}>{it.label}</div>
              <div className="text-2xl font-bold mt-2 truncate" title={String(it.value)}>{typeof it.value === "number" ? it.value.toLocaleString() : it.value}</div>
            </div>
          ))}
    </div>
  );
}

/* ---------------- AI Insights & Smart Recommendations ---------------- */

type Insights = {
  top_campaigns: { campaign: string; enrolled: number; replies: number; orders: number; conv_rate: number }[];
  best_industries: { industry: string; enrolled: number; replies: number }[];
  worst_industries: { industry: string; enrolled: number; replies: number }[];
  best_subjects: { subject: string; sent: number; replies: number; reply_rate: number }[];
  best_hours_utc: { hour_utc: number; sends: number; replies: number }[];
  trend_14d: { day: string; replies: number; meetings: number; orders: number }[];
};

export function ProspectInsightsPanel() {
  const [data, setData] = useState<Insights | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data: d } = await supabase.rpc("prospect_insights");
      setData(d as Insights);
    })();
  }, [open]);

  return (
    <div className="os-glass p-4">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between text-left">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-300" />
          <span className="font-semibold">AI Insights & Recommendations</span>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-400/20">Live</span>
        </div>
        <span className="text-xs text-white/40">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {!data ? (
            <div className="text-center py-6 text-white/40"><Loader2 className="w-4 h-4 animate-spin mx-auto" /></div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <InsightTable title="Highest converting campaigns"
                cols={["Campaign","Enrolled","Replies","Orders","Reply rate"]}
                rows={data.top_campaigns.map((r) => [r.campaign, r.enrolled, r.replies, r.orders, `${r.conv_rate}%`])} />
              <InsightTable title="Best performing industries"
                cols={["Industry","Enrolled","Replies"]}
                rows={data.best_industries.map((r) => [r.industry, r.enrolled, r.replies])} />
              <InsightTable title="Lowest reply industries"
                cols={["Industry","Enrolled","Replies"]}
                rows={data.worst_industries.map((r) => [r.industry, r.enrolled, r.replies])} />
              <InsightTable title="Best subject lines"
                cols={["Subject","Sent","Replies","Reply rate"]}
                rows={data.best_subjects.map((r) => [r.subject, r.sent, r.replies, `${r.reply_rate}%`])} />
              <InsightTable title="Best sending hours (UTC)"
                cols={["Hour","Sends","Replies"]}
                rows={data.best_hours_utc.map((r) => [`${r.hour_utc}:00`, r.sends, r.replies])} />
              <InsightTable title="14-day conversion trend"
                cols={["Day","Replies","Meetings","Orders"]}
                rows={data.trend_14d.map((r) => [new Date(r.day).toLocaleDateString(), r.replies, r.meetings, r.orders])} />
            </div>
          )}
          <div className="text-[11px] text-white/40">
            Recommendations are advisory only — they never modify existing campaigns automatically.
          </div>
        </div>
      )}
    </div>
  );
}

function InsightTable({ title, cols, rows }: { title: string; cols: string[]; rows: (string | number)[][] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="text-xs uppercase tracking-wider text-white/50 mb-2">{title}</div>
      {rows.length === 0 ? (
        <div className="text-xs text-white/30 py-2">No data yet.</div>
      ) : (
        <table className="w-full text-xs">
          <thead className="text-white/40">
            <tr>{cols.map((c) => <th key={c} className="text-left font-normal pb-1">{c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-white/5">
                {row.map((v, j) => <td key={j} className="py-1 pr-2 truncate max-w-[160px]">{String(v)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}


const EVENT_ICON: Record<string, ReactNode> = {
  qualified: <Sparkles className="w-4 h-4" />,
  campaign_selected: <Target className="w-4 h-4" />,
  email_1: <Send className="w-4 h-4" />, email_2: <Send className="w-4 h-4" />, email_3: <Send className="w-4 h-4" />,
  reply: <Reply className="w-4 h-4" />,
  lead_created: <Activity className="w-4 h-4" />,
  meeting: <Calendar className="w-4 h-4" />,
  order: <ShoppingCart className="w-4 h-4" />,
  completed: <CheckCircle2 className="w-4 h-4" />,
  stopped: <XCircle className="w-4 h-4" />,
  rejected: <XCircle className="w-4 h-4" />,
  enrolled: <Sparkles className="w-4 h-4" />,
  restarted: <Sparkles className="w-4 h-4" />,
  requalify: <Sparkles className="w-4 h-4" />,
};

const EVENT_TINT: Record<string, string> = {
  qualified: "text-cyan-300 bg-cyan-500/10",
  campaign_selected: "text-indigo-300 bg-indigo-500/10",
  email_1: "text-white/70 bg-white/5", email_2: "text-white/70 bg-white/5", email_3: "text-white/70 bg-white/5",
  reply: "text-purple-300 bg-purple-500/10",
  lead_created: "text-emerald-300 bg-emerald-500/10",
  meeting: "text-emerald-300 bg-emerald-500/10",
  order: "text-emerald-300 bg-emerald-500/10",
  completed: "text-amber-300 bg-amber-500/10",
  stopped: "text-red-300 bg-red-500/10",
  rejected: "text-red-300 bg-red-500/10",
  enrolled: "text-cyan-300 bg-cyan-500/10",
  restarted: "text-cyan-300 bg-cyan-500/10",
  requalify: "text-cyan-300 bg-cyan-500/10",
};

export function ProspectTimelineDrawer({
  prospectId, businessName, aiNotes, confidence, onClose,
}: {
  prospectId: string;
  businessName: string;
  aiNotes?: string | null;
  confidence?: number | null;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("prospect_timeline")
        .select("*")
        .eq("prospect_id", prospectId)
        .order("created_at", { ascending: true });
      if (!cancelled) setRows(data ?? []);
    })();
    return () => { cancelled = true; };
  }, [prospectId]);

  return (
    <div className="fixed inset-0 z-[60] flex" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="ml-auto h-full w-full max-w-md bg-[#0b0d12] border-l border-white/10 overflow-y-auto relative animate-in slide-in-from-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-[#0b0d12] z-10">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/40">Prospect timeline</div>
            <div className="font-semibold truncate max-w-[280px]">{businessName}</div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {(aiNotes || confidence != null) && (
          <div className="px-5 py-4 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-cyan-300/80 mb-2">
              <Sparkles className="w-3 h-3" />
              AI Notes
              {confidence != null && (
                <span className="ml-auto text-white/60">Confidence: {Math.round(Number(confidence) * 100)}%</span>
              )}
            </div>
            <div className="text-sm text-white/80 whitespace-pre-wrap">{aiNotes || "—"}</div>
          </div>
        )}

        <div className="p-5">
          {rows === null ? (
            <div className="text-center py-12 text-white/40"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 text-white/40 text-sm">No timeline events yet.</div>
          ) : (
            <ol className="space-y-3">
              {rows.map((e) => {
                const icon = EVENT_ICON[e.event_type] || <Activity className="w-4 h-4" />;
                const tint = EVENT_TINT[e.event_type] || "text-white/60 bg-white/5";
                return (
                  <li key={e.id} className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tint}`}>{icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{e.title}</div>
                      {e.detail && <div className="text-xs text-white/60 mt-0.5 whitespace-pre-wrap break-words">{e.detail}</div>}
                      <div className="text-[10px] text-white/30 mt-1">{new Date(e.created_at).toLocaleString()}</div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
