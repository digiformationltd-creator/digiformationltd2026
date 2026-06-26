// Reminder Center — real reminders from public.reminder_inbox().
// Deterministic SQL aggregation: tasks, compliance (CS / accounts / address),
// missing company auth code, stalled paid orders, inquiries awaiting follow-up.

import { useEffect, useMemo, useState } from "react";
import { Bell, AlertTriangle, Clock, Inbox, Filter, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Row = {
  source: string;
  category: string;
  severity: "overdue" | "today" | "soon" | "info";
  title: string;
  due_date: string | null;
  target_type: string | null;
  target_id: string | null;
  payload: Record<string, any> | null;
};

const SEV_BADGE: Record<Row["severity"], string> = {
  overdue: "bg-red-500/10 text-red-300 border-red-500/20",
  today:   "bg-amber-500/10 text-amber-300 border-amber-500/20",
  soon:    "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  info:    "bg-white/5 text-white/60 border-white/10",
};

const SEV_ORDER = { overdue: 0, today: 1, soon: 2, info: 3 } as const;

export default function OsReminderCenter() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | Row["severity"] | string>("all");

  const load = async () => {
    setLoading(true); setErr(null);
    const { data, error } = await supabase.rpc("reminder_inbox", { _limit: 300 });
    if (error) setErr(error.message);
    else setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => ({
    total: rows.length,
    overdue: rows.filter(r => r.severity === "overdue").length,
    today:   rows.filter(r => r.severity === "today").length,
    soon:    rows.filter(r => r.severity === "soon").length,
  }), [rows]);

  const categories = useMemo(
    () => Array.from(new Set(rows.map(r => r.category))).sort(),
    [rows],
  );

  const visible = useMemo(() => {
    let v = rows;
    if (filter !== "all") {
      v = rows.filter(r =>
        (["overdue","today","soon","info"].includes(filter) ? r.severity === filter : r.category === filter)
      );
    }
    return [...v].sort((a, b) =>
      (SEV_ORDER[a.severity] - SEV_ORDER[b.severity]) ||
      ((a.due_date ?? "9999") < (b.due_date ?? "9999") ? -1 : 1)
    );
  }, [rows, filter]);

  return (
    <div className="space-y-6 os-fade-in">
      <div className="os-glass p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl grid place-items-center bg-amber-500/10 text-amber-300">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Reminder Center</h2>
              <p className="text-sm text-white/50 mt-1 max-w-2xl">
                Deterministic reminders generated from your database — compliance deadlines, missing data,
                stalled orders, and overdue tasks. No AI required.
              </p>
            </div>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Total" value={counts.total} icon={Inbox} tint="bg-white/10 text-white" />
        <KPI label="Overdue" value={counts.overdue} icon={AlertTriangle} tint="bg-red-500/10 text-red-300" />
        <KPI label="Today"   value={counts.today}   icon={Clock} tint="bg-amber-500/10 text-amber-300" />
        <KPI label="Soon"    value={counts.soon}    icon={Bell}  tint="bg-cyan-500/10 text-cyan-300" />
      </div>

      {/* Filters */}
      <div className="os-glass p-3 flex items-center gap-2 flex-wrap text-xs">
        <Filter className="w-3.5 h-3.5 text-white/40" />
        {(["all","overdue","today","soon","info"] as const).map(f => (
          <FilterChip key={f} active={filter===f} onClick={() => setFilter(f)}>{f}</FilterChip>
        ))}
        <span className="text-white/20">·</span>
        {categories.map(c => (
          <FilterChip key={c} active={filter===c} onClick={() => setFilter(c)}>{c.replaceAll("_"," ")}</FilterChip>
        ))}
      </div>

      {/* List */}
      <div className="os-glass p-0 overflow-hidden">
        {err && <div className="p-4 text-sm text-red-300">{err}</div>}
        {loading && rows.length === 0 && <div className="p-6 text-sm text-white/50">Loading…</div>}
        {!loading && visible.length === 0 && (
          <div className="p-6 text-sm text-white/50">No reminders match the current filter.</div>
        )}
        <ul className="divide-y divide-white/5">
          {visible.map((r, i) => (
            <li key={`${r.target_type}-${r.target_id}-${i}`} className="p-3 flex items-center gap-3 hover:bg-white/[0.02]">
              <span className={`shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border ${SEV_BADGE[r.severity]}`}>
                {r.severity}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white/90 truncate">{r.title}</div>
                <div className="text-[11px] text-white/40 mt-0.5">
                  {r.category.replaceAll("_"," ")}
                  {r.due_date && <> · due {r.due_date}</>}
                  {r.payload?.amount_gbp != null && <> · £{Number(r.payload.amount_gbp).toFixed(2)}</>}
                </div>
              </div>
              <span className="hidden md:inline text-[10px] text-white/30 px-2">{r.source}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function KPI({ label, value, icon: Icon, tint }: any) {
  return (
    <div className="os-glass p-4">
      <div className="flex items-start justify-between">
        <span className="text-[11px] text-white/50">{label}</span>
        <div className={`w-7 h-7 rounded-lg grid place-items-center ${tint}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="mt-2 text-xl font-bold">{value}</div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: any) {
  return (
    <button onClick={onClick}
      className={`px-2.5 py-1 rounded-md border transition ${
        active ? "bg-amber-500/15 border-amber-500/30 text-amber-200"
               : "bg-white/[0.02] border-white/5 text-white/60 hover:text-white"}`}>
      {children}
    </button>
  );
}
