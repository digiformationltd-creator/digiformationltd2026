// Business Automations — real automation_rules + recent automation_runs.

import { useEffect, useState } from "react";
import { Zap, RefreshCw, CheckCircle2, XCircle, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Rule = {
  id: string; name: string; trigger_event: string; action_type: string;
  is_enabled: boolean; updated_at: string;
};
type Run = {
  id: string; job_name: string; status: string; started_at: string;
  duration_ms: number | null; error: string | null;
};

const STATUS_TINT: Record<string, string> = {
  success: "bg-green-500/10 text-green-300",
  failed:  "bg-red-500/10 text-red-300",
  running: "bg-cyan-500/10 text-cyan-300",
};

export default function OsAutomationWorkflows() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setErr(null);
    const [r1, r2] = await Promise.all([
      supabase.from("automation_rules").select("*").order("updated_at", { ascending: false }),
      supabase.rpc("automation_runs_recent", { _limit: 30 }),
    ]);
    if (r1.error) setErr(r1.error.message);
    if (r2.error) setErr(r2.error.message);
    setRules((r1.data ?? []) as Rule[]);
    setRuns((r2.data ?? []) as Run[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (rule: Rule) => {
    await supabase.from("automation_rules")
      .update({ is_enabled: !rule.is_enabled })
      .eq("id", rule.id);
    load();
  };

  return (
    <div className="space-y-6 os-fade-in">
      <div className="os-glass p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl grid place-items-center bg-lime-500/10 text-lime-300">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Business Automations</h2>
              <p className="text-sm text-white/50 mt-1 max-w-2xl">
                Rule-based automations stored in <code className="text-white/70">automation_rules</code>,
                with recent execution history from <code className="text-white/70">automation_runs</code>.
              </p>
            </div>
          </div>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {err && <div className="os-glass p-4 text-sm text-red-300">{err}</div>}

      {/* Rules */}
      <div className="os-glass p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-lime-300" /> Rules</h3>
        {rules.length === 0 && !loading && (
          <div className="text-sm text-white/50 py-4">No automation rules defined yet. Create one from the AI Command Center to wire a trigger to an action.</div>
        )}
        <div className="space-y-2">
          {rules.map((r) => (
            <div key={r.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="text-sm font-medium">{r.name}</div>
                <div className="text-[11px] text-white/40 mt-0.5">
                  Trigger · {r.trigger_event} → {r.action_type}
                </div>
              </div>
              <button onClick={() => toggle(r)}
                className={`w-9 h-5 rounded-full relative transition ${r.is_enabled ? "bg-lime-500/40" : "bg-white/10"}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition ${r.is_enabled ? "left-[18px]" : "left-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent runs */}
      <div className="os-glass p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-300" /> Recent execution history</h3>
        {runs.length === 0 && !loading && (
          <div className="text-sm text-white/50 py-4">No executions recorded yet.</div>
        )}
        <ul className="divide-y divide-white/5">
          {runs.map((r) => (
            <li key={r.id} className="py-2.5 flex items-center gap-3 text-sm">
              {r.status === "success" ? <CheckCircle2 className="w-4 h-4 text-green-300" />
                : r.status === "failed" ? <XCircle className="w-4 h-4 text-red-300" />
                : <Activity className="w-4 h-4 text-cyan-300" />}
              <div className="flex-1 min-w-0">
                <div className="text-white/85 truncate">{r.job_name}</div>
                {r.error && <div className="text-[11px] text-red-300/70 truncate" title={r.error}>{r.error}</div>}
              </div>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md ${STATUS_TINT[r.status] ?? "bg-white/5 text-white/40"}`}>{r.status}</span>
              <span className="text-[11px] text-white/40 w-20 text-right">{r.duration_ms != null ? `${r.duration_ms} ms` : ""}</span>
              <span className="text-[11px] text-white/30 w-32 text-right">{new Date(r.started_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
