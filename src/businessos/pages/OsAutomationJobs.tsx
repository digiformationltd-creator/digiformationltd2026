// Scheduled Jobs — real cron + automation_runs via scheduled_jobs_status RPC.

import { useEffect, useState } from "react";
import { Workflow, Clock, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Job = {
  jobname: string;
  schedule: string;
  active: boolean;
  last_run: string | null;
  last_status: string;
  duration_ms: number | null;
  last_error: string | null;
  run_count_24h: number;
  failures_24h: number;
};

const STATUS_TINT: Record<string, string> = {
  success: "bg-green-500/10 text-green-300",
  failed:  "bg-red-500/10 text-red-300",
  running: "bg-cyan-500/10 text-cyan-300",
  unknown: "bg-white/5 text-white/40",
};

function ago(iso: string | null) {
  if (!iso) return "—";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function OsAutomationJobs() {
  const [rows, setRows] = useState<Job[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true); setErr(null);
    const { data, error } = await supabase.rpc("scheduled_jobs_status");
    if (error) setErr(error.message); else setRows((data ?? []) as Job[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6 os-fade-in">
      <div className="os-glass p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl grid place-items-center bg-cyan-500/10 text-cyan-300">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Scheduled Jobs</h2>
              <p className="text-sm text-white/50 mt-1 max-w-2xl">
                Live cron jobs in Lovable Cloud, combined with execution history from automation_runs.
              </p>
            </div>
          </div>
          <button onClick={load} className="inline-flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {err && <div className="os-glass p-4 text-sm text-red-300">{err}</div>}

      <div className="os-glass overflow-hidden hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-white/5 text-[11px] uppercase tracking-wider text-white/40">
              <th className="py-3 px-4">Job</th>
              <th className="py-3 px-4">Schedule</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Last run</th>
              <th className="py-3 px-4">Duration</th>
              <th className="py-3 px-4">24h runs</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((j) => (
              <tr key={j.jobname} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <td className="py-3 px-4 font-medium">{j.jobname}</td>
                <td className="py-3 px-4 text-white/60">{j.schedule}</td>
                <td className="py-3 px-4">
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md ${STATUS_TINT[j.last_status] ?? STATUS_TINT.unknown}`}>
                    {j.active ? j.last_status : "paused"}
                  </span>
                  {j.last_error && <div className="text-[10px] text-red-300/70 mt-1 max-w-xs truncate" title={j.last_error}>{j.last_error}</div>}
                </td>
                <td className="py-3 px-4 text-white/60 inline-flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-white/30" /> {ago(j.last_run)}
                </td>
                <td className="py-3 px-4 text-white/60">{j.duration_ms != null ? `${j.duration_ms} ms` : "—"}</td>
                <td className="py-3 px-4 text-white/60">
                  {j.run_count_24h}
                  {j.failures_24h > 0 && <span className="text-red-300 ml-2">· {j.failures_24h} failed</span>}
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-white/40">No scheduled jobs.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {rows.map((j) => (
          <div key={j.jobname} className="os-glass p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium truncate">{j.jobname}</span>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md ${STATUS_TINT[j.last_status] ?? STATUS_TINT.unknown}`}>
                {j.active ? j.last_status : "paused"}
              </span>
            </div>
            <div className="text-[11px] text-white/50">{j.schedule}</div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-white/5">
              <div><div className="text-white/40">Last run</div><div>{ago(j.last_run)}</div></div>
              <div><div className="text-white/40">24h runs</div><div>{j.run_count_24h} ({j.failures_24h} failed)</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
