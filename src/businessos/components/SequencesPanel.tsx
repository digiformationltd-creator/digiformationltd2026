// Live AI Campaign Sequences dashboard (read-only).
// All numbers come from prospect_campaign_runs + email_prospects.
// No fake analytics, no mocks.

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, CheckCircle2, MailCheck, MessageSquare, Pause, Send, RefreshCw, Loader2, StopCircle, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Run = {
  id: string;
  prospect_id: string;
  campaign: string;
  status: "active" | "completed" | "stopped" | "replied" | "failed";
  current_step: number;
  next_send_at: string | null;
  last_subject: string | null;
  last_error: string | null;
  started_at: string;
  completed_at: string | null;
};

type ProspectLite = {
  id: string;
  business_name: string;
  contact_email: string | null;
  has_website: boolean;
  location: string | null;
  industry: string | null;
};

const STATUS_TINT: Record<Run["status"], string> = {
  active:    "bg-cyan-500/15 text-cyan-200",
  completed: "bg-emerald-500/15 text-emerald-200",
  stopped:   "bg-white/10 text-white/60",
  replied:   "bg-purple-500/15 text-purple-200",
  failed:    "bg-red-500/15 text-red-200",
};

export default function SequencesPanel() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [prospects, setProspects] = useState<Record<string, ProspectLite>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: r } = await supabase
      .from("prospect_campaign_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(500);
    const list = (r ?? []) as Run[];
    setRuns(list);
    if (list.length) {
      const ids = Array.from(new Set(list.map((x) => x.prospect_id)));
      const { data: ps } = await supabase
        .from("email_prospects")
        .select("id,business_name,contact_email,has_website,location,industry")
        .in("id", ids);
      const map: Record<string, ProspectLite> = {};
      for (const p of (ps ?? []) as ProspectLite[]) map[p.id] = p;
      setProspects(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const kpis = useMemo(() => {
    const active = runs.filter((r) => r.status === "active");
    const completed = runs.filter((r) => r.status === "completed");
    const replied = runs.filter((r) => r.status === "replied");
    const stopped = runs.filter((r) => r.status === "stopped");
    const failed = runs.filter((r) => r.status === "failed");
    const emailsSent = runs.reduce((s, r) => s + (r.current_step || 0), 0);
    const scheduled = active.filter((r) => r.next_send_at && new Date(r.next_send_at) > new Date()).length;
    const reached = runs.filter((r) => r.current_step >= 1).length;
    const conversion = reached > 0 ? Math.round((replied.length / reached) * 1000) / 10 : 0;
    return {
      activeCount: active.length,
      scheduled,
      emailsSent,
      replies: replied.length,
      completed: completed.length,
      stopped: stopped.length + failed.length,
      conversion,
    };
  }, [runs]);

  const control = async (prospect_id: string, action: "stop" | "replied" | "restart") => {
    setBusy(prospect_id + ":" + action);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`https://ltxopeehtajwxpbwbqfr.supabase.co/functions/v1/prospect-campaign-control`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token ?? ""}`,
      },
      body: JSON.stringify({ prospect_id, action }),
    });
    setBusy(null);
    if (!res.ok) {
      const e = await res.text();
      toast({ title: "Action failed", description: e.slice(0, 200), variant: "destructive" });
      return;
    }
    toast({ title: `Marked ${action}` });
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">AI Campaign Sequences</h3>
          <p className="text-xs text-white/50 mt-1">
            Live view of all prospect campaigns. Orchestrator runs every 15 min — max 3 new enrollments / day.
          </p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm border border-white/10">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Kpi icon={<Activity className="w-3.5 h-3.5" />} label="Active"     value={kpis.activeCount} tint="bg-cyan-500/10 text-cyan-200" />
        <Kpi icon={<Send className="w-3.5 h-3.5" />}     label="Scheduled"  value={kpis.scheduled}   tint="bg-indigo-500/10 text-indigo-200" />
        <Kpi icon={<MailCheck className="w-3.5 h-3.5" />} label="Sent"      value={kpis.emailsSent}  tint="bg-white/10 text-white/70" />
        <Kpi icon={<MessageSquare className="w-3.5 h-3.5" />} label="Replies" value={kpis.replies}    tint="bg-purple-500/10 text-purple-200" />
        <Kpi icon={<CheckCircle2 className="w-3.5 h-3.5" />} label="Completed" value={kpis.completed} tint="bg-emerald-500/10 text-emerald-200" />
        <Kpi icon={<Pause className="w-3.5 h-3.5" />} label="Stopped"      value={kpis.stopped}     tint="bg-red-500/10 text-red-200" />
        <Kpi icon={<Activity className="w-3.5 h-3.5" />} label="Conv. %"   value={`${kpis.conversion}%`} tint="bg-amber-500/10 text-amber-200" />
      </div>

      <div className="os-glass overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-white/40 text-sm">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading sequences…
          </div>
        ) : runs.length === 0 ? (
          <div className="p-10 text-center text-sm text-white/50">
            No campaigns yet. Assign a campaign to a prospect and set their status to <span className="text-white/80">Enrolled</span> — the orchestrator will pick them up.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-white/50 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Business</th>
                  <th className="text-left px-4 py-3">Campaign</th>
                  <th className="text-left px-4 py-3">Step</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Next send</th>
                  <th className="text-left px-4 py-3">Last subject</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => {
                  const p = prospects[r.prospect_id];
                  const next = r.next_send_at ? new Date(r.next_send_at) : null;
                  return (
                    <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white/90 truncate max-w-[200px]">{p?.business_name ?? "—"}</div>
                        <div className="text-xs text-white/40 truncate max-w-[200px]">{p?.contact_email ?? ""}</div>
                      </td>
                      <td className="px-4 py-3 text-white/70 text-xs">{r.campaign}</td>
                      <td className="px-4 py-3 text-white/70 text-xs">{r.current_step}/3</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_TINT[r.status]}`}>
                          {r.status}
                        </span>
                        {r.last_error && (
                          <div className="text-[10px] text-red-300/80 mt-1 truncate max-w-[200px]" title={r.last_error}>
                            {r.last_error}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-white/60 text-xs">
                        {r.status === "active" && next ? next.toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-white/60 text-xs truncate max-w-[260px]">{r.last_subject ?? "—"}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {r.status === "active" && (
                          <>
                            <button
                              onClick={() => control(r.prospect_id, "replied")}
                              disabled={busy?.startsWith(r.prospect_id)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-purple-500/15 hover:bg-purple-500/25 text-purple-200 mr-1 disabled:opacity-50">
                              <MessageSquare className="w-3 h-3" /> Replied
                            </button>
                            <button
                              onClick={() => control(r.prospect_id, "stop")}
                              disabled={busy?.startsWith(r.prospect_id)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/15 text-white/70 disabled:opacity-50">
                              <StopCircle className="w-3 h-3" /> Stop
                            </button>
                          </>
                        )}
                        {(r.status === "stopped" || r.status === "completed" || r.status === "failed") && (
                          <button
                            onClick={() => control(r.prospect_id, "restart")}
                            disabled={busy?.startsWith(r.prospect_id)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 disabled:opacity-50">
                            <RotateCcw className="w-3 h-3" /> Restart
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, tint }: { icon: React.ReactNode; label: string; value: number | string; tint: string }) {
  return (
    <div className="os-glass p-3">
      <div className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${tint}`}>
        {icon} {label}
      </div>
      <div className="text-2xl font-bold mt-2">{value}</div>
    </div>
  );
}
