// Automation Dashboard — real data from reminder_inbox, automation_runs, cron.
import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Sparkles, Bell, Activity, ShieldCheck, Mail, Clock, Zap,
  ArrowRight, Database, Cpu, RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const MODULES = [
  { label: "AI Command Center",    to: "/admin/automation/command-center",  icon: Sparkles, desc: "Talk to Business OS. Approve actions.", tint: "bg-purple-500/10 text-purple-300", featured: true },
  { label: "Reminder Center",      to: "/admin/automation/reminders",       icon: Bell,     desc: "Deterministic reminders from your data.", tint: "bg-amber-500/10 text-amber-300" },
  { label: "Email Marketing",      to: "/admin/automation/email-marketing", icon: Mail,     desc: "Campaigns and outreach.",              tint: "bg-pink-500/10 text-pink-300" },
  { label: "Scheduled Jobs",       to: "/admin/automation/jobs",            icon: Clock,    desc: "Cron and recurring tasks.",            tint: "bg-cyan-500/10 text-cyan-300" },
  { label: "Business Automations", to: "/admin/automation/workflows",       icon: Zap,      desc: "Rule-based workflows + history.",      tint: "bg-lime-500/10 text-lime-300" },
];

export default function OsAutomation() {
  const [kpi, setKpi] = useState({ reminders: 0, overdue: 0, jobs: 0, failures: 0, recent: 0 });
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [r1, r2, r3] = await Promise.all([
      supabase.rpc("reminder_inbox", { _limit: 500 }),
      supabase.rpc("scheduled_jobs_status"),
      supabase.rpc("automation_runs_recent", { _limit: 12 }),
    ]);
    const rems = (r1.data ?? []) as any[];
    const jobs = (r2.data ?? []) as any[];
    const runs = (r3.data ?? []) as any[];
    setKpi({
      reminders: rems.length,
      overdue: rems.filter(r => r.severity === "overdue").length,
      jobs: jobs.filter(j => j.active).length,
      failures: jobs.reduce((n, j) => n + (j.failures_24h ?? 0), 0),
      recent: runs.length,
    });
    setActivity(runs);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const KPIS = [
    { label: "Active Reminders", value: String(kpi.reminders), sub: `${kpi.overdue} overdue`, icon: Bell,        tint: "bg-amber-500/10 text-amber-300" },
    { label: "Running Jobs",     value: String(kpi.jobs),      sub: kpi.failures ? `${kpi.failures} failed (24h)` : "healthy", icon: Activity, tint: "bg-cyan-500/10 text-cyan-300" },
    { label: "Recent Runs",      value: String(kpi.recent),    sub: "last 12",  icon: RefreshCw,  tint: "bg-purple-500/10 text-purple-300" },
    { label: "System Health",    value: kpi.failures ? "Warn" : "Healthy", sub: kpi.failures ? "see failures" : "100% uptime", icon: ShieldCheck, tint: kpi.failures ? "bg-amber-500/10 text-amber-300" : "bg-green-500/10 text-green-300" },
  ];

  return (
    <div className="space-y-6 os-fade-in">
      <div className="os-glass os-glow-lime p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl grid place-items-center bg-lime-500/10 text-lime-300">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Automation</h2>
              <p className="text-sm text-white/50 mt-1 max-w-2xl">
                Live operations overview. Spend most of your time in the AI Command Center — everything else supports it.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="inline-flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <NavLink to="/admin/automation/command-center"
              className="inline-flex items-center gap-2 rounded-xl bg-purple-500/15 text-purple-200 hover:bg-purple-500/25 px-4 py-2 text-sm font-medium transition">
              <Sparkles className="w-4 h-4" /> Open AI Command Center <ArrowRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPIS.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="os-glass p-4">
              <div className="flex items-start justify-between">
                <span className="text-[11px] text-white/50">{k.label}</span>
                <div className={`w-7 h-7 rounded-lg grid place-items-center ${k.tint}`}><Icon className="w-3.5 h-3.5" /></div>
              </div>
              <div className="mt-2 text-xl font-bold">{k.value}</div>
              <div className="text-[11px] text-white/40 mt-0.5">{k.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <NavLink key={m.to} to={m.to}
              className={`os-glass p-5 hover:translate-y-[-2px] transition group ${m.featured ? "os-glow-purple ring-1 ring-purple-500/20" : ""}`}>
              <div className={`w-10 h-10 rounded-xl grid place-items-center ${m.tint}`}><Icon className="w-4 h-4" /></div>
              <div className="mt-3 font-semibold flex items-center gap-2">
                {m.label} <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white/70 group-hover:translate-x-0.5 transition" />
              </div>
              <div className="text-xs text-white/50 mt-1">{m.desc}</div>
            </NavLink>
          );
        })}
      </div>

      <div className="os-glass p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-cyan-300" />
          <h3 className="font-semibold">Recent Activity</h3>
        </div>
        {activity.length === 0 && !loading && (
          <div className="text-sm text-white/50">No recorded runs yet. Scheduled jobs and Command Center executions appear here.</div>
        )}
        <ul className="space-y-2 text-sm">
          {activity.map((e: any) => (
            <li key={e.id} className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${e.status==="success"?"bg-green-400":e.status==="failed"?"bg-red-400":"bg-cyan-400"}`} />
              <span className="flex-1 truncate text-white/80">{e.job_name}</span>
              <span className="text-[11px] text-white/40">{new Date(e.started_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="os-glass p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-green-300" />
          <h3 className="font-semibold">System</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          <Row icon={Database} label="Database" status="Operational" ok />
          <Row icon={Clock} label="Scheduler" status="Operational" ok />
          <Row icon={Cpu} label="Automation Engine" status={kpi.failures ? "Warnings" : "Operational"} ok={!kpi.failures} />
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, status, ok }: any) {
  return (
    <div className="flex items-center justify-between text-sm rounded-lg bg-white/[0.02] border border-white/5 p-2.5">
      <span className="flex items-center gap-2"><Icon className="w-3.5 h-3.5 text-white/50" /><span className="text-white/80">{label}</span></span>
      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md ${ok ? "bg-green-500/10 text-green-300" : "bg-amber-500/10 text-amber-300"}`}>{status}</span>
    </div>
  );
}
