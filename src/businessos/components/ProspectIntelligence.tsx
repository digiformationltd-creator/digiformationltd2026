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
  auto_campaigns_assigned: number;
  reply_rate: number;
  meetings_booked: number;
  orders_generated: number;
  avg_confidence: number;
  rejected_total: number;
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
        { label: "Awaiting AI Qualification", value: s.awaiting_qualification, tint: "bg-amber-500/10 text-amber-300" },
        { label: "AI Qualified Today",        value: s.qualified_today,        tint: "bg-cyan-500/10 text-cyan-300" },
        { label: "Auto Campaigns Assigned",   value: s.auto_campaigns_assigned, tint: "bg-indigo-500/10 text-indigo-300" },
        { label: "Reply Rate",                value: `${s.reply_rate}%`,       tint: "bg-purple-500/10 text-purple-300" },
        { label: "Meetings Booked",           value: s.meetings_booked,        tint: "bg-emerald-500/10 text-emerald-300" },
        { label: "Orders Generated",          value: s.orders_generated,       tint: "bg-emerald-500/10 text-emerald-300" },
        { label: "Avg Confidence",            value: s.avg_confidence ? `${Math.round(Number(s.avg_confidence) * 100)}%` : "—", tint: "bg-white/5 text-white/70" },
        { label: "Rejected",                  value: s.rejected_total,         tint: "bg-red-500/10 text-red-300" },
      ]
    : [];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {!s
        ? Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="os-glass p-3 animate-pulse h-[78px]" />
          ))
        : items.map((it) => (
            <div key={it.label} className="os-glass p-3">
              <div className={`inline-flex text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${it.tint}`}>{it.label}</div>
              <div className="text-2xl font-bold mt-2">{typeof it.value === "number" ? it.value.toLocaleString() : it.value}</div>
            </div>
          ))}
    </div>
  );
}

const EVENT_ICON: Record<string, JSX.Element> = {
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
