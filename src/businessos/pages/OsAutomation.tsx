// Automation Dashboard — AI-first command surface.
// Simplified overview: Active Reminders, Running Jobs, Recent Activity,
// System Health, lightweight Agent Status widget, and quick links to the
// four kept sub-modules (AI Command Center, Email Marketing, Scheduled
// Jobs, Business Automations). UI only. No backend changes.

import { NavLink } from "react-router-dom";
import {
  Sparkles, Bell, Activity, ShieldCheck, Bot, Mail, Clock, Zap,
  CheckCircle2, AlertTriangle, RefreshCw, ArrowRight, Database, Cpu,
} from "lucide-react";

/* -- Mock data ----------------------------------------------------- */

const KPIS = [
  { label: "Active Reminders", value: "7",       sub: "2 overdue",      icon: Bell,       tint: "bg-amber-500/10 text-amber-300" },
  { label: "Running Jobs",     value: "1",       sub: "queue healthy",  icon: Activity,   tint: "bg-cyan-500/10 text-cyan-300"   },
  { label: "Recent Activity",  value: "12",      sub: "today",          icon: RefreshCw,  tint: "bg-purple-500/10 text-purple-300" },
  { label: "System Health",    value: "Healthy", sub: "100% uptime",    icon: ShieldCheck,tint: "bg-green-500/10 text-green-300" },
];

const REMINDERS = [
  { title: "Confirmation Statement due — Ascend Ltd",     due: "Overdue · 2d", sev: "overdue" },
  { title: "Follow up Stripe application — Nova Trading", due: "Today",        sev: "today"   },
  { title: "VAT documents — Helix Studios",               due: "Today",        sev: "today"   },
  { title: "Annual Accounts — Bramble & Co",              due: "In 3 days",    sev: "soon"    },
];

const SEV: Record<string, string> = {
  overdue: "bg-red-500/10 text-red-300 border-red-500/20",
  today:   "bg-amber-500/10 text-amber-300 border-amber-500/20",
  soon:    "bg-white/5 text-white/60 border-white/10",
};

const ACTIVITY = [
  { text: "Reminder created — Confirmation Statement (Ascend Ltd)", at: "2m ago",  icon: Bell,         tint: "text-amber-300" },
  { text: "Welcome flow executed — Nova Trading",                   at: "11m ago", icon: Zap,          tint: "text-lime-300"  },
  { text: "Email scheduled — Annual Accounts reminder (×3)",        at: "26m ago", icon: Mail,         tint: "text-pink-300"  },
  { text: "Reminder completed — Stripe follow-up (Helix Studios)",  at: "3h ago",  icon: CheckCircle2, tint: "text-green-300" },
  { text: "Workflow retried — Lead qualification (Orbit Labs)",     at: "Yesterday", icon: RefreshCw,  tint: "text-cyan-300"  },
];

const HEALTH = [
  { label: "Database",          status: "Operational",   ok: true,  icon: Database },
  { label: "Scheduler",         status: "Operational",   ok: true,  icon: Clock    },
  { label: "Automation Engine", status: "Operational",   ok: true,  icon: Cpu      },
  { label: "Discord Bridge",    status: "Not Connected", ok: false, icon: AlertTriangle },
];

const AGENTS = [
  { name: "Reminder Agent", status: "Planned", health: "n/a", last: "—" },
  { name: "Email Agent",    status: "Planned", health: "n/a", last: "—" },
  { name: "Company Agent",  status: "Planned", health: "n/a", last: "—" },
  { name: "Customer Agent", status: "Planned", health: "n/a", last: "—" },
];

const MODULES = [
  { label: "AI Workspace",        to: "/admin/automation/workspace",       icon: Sparkles, desc: "Paste, instruct, preview, approve.",  tint: "bg-purple-500/10 text-purple-300", featured: true },
  { label: "Email Marketing",     to: "/admin/automation/email-marketing", icon: Mail,     desc: "Campaigns and lead outreach.",         tint: "bg-pink-500/10 text-pink-300" },
  { label: "Scheduled Jobs",      to: "/admin/automation/jobs",            icon: Clock,    desc: "Cron and recurring tasks.",            tint: "bg-cyan-500/10 text-cyan-300" },
  { label: "Business Automations",to: "/admin/automation/workflows",       icon: Zap,      desc: "Follow-ups, reminders, lead rules.",   tint: "bg-lime-500/10 text-lime-300" },
];

/* -- Page ---------------------------------------------------------- */

export default function OsAutomation() {
  return (
    <div className="space-y-6 os-fade-in">
      {/* Header */}
      <div className="os-glass os-glow-lime p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl grid place-items-center bg-lime-500/10 text-lime-300">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Automation</h2>
              <p className="text-sm text-white/50 mt-1 max-w-2xl">
                A simple overview of what's running. Spend most of your time in the AI Workspace — everything else
                supports it.
              </p>
            </div>
          </div>
          <NavLink
            to="/admin/automation/workspace"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-500/15 text-purple-200 hover:bg-purple-500/25 px-4 py-2 text-sm font-medium transition"
          >
            <Sparkles className="w-4 h-4" />
            Open AI Workspace
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPIS.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="os-glass p-4">
              <div className="flex items-start justify-between">
                <span className="text-[11px] text-white/50">{k.label}</span>
                <div className={`w-7 h-7 rounded-lg grid place-items-center ${k.tint}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 text-xl font-bold">{k.value}</div>
              <div className="text-[11px] text-white/40 mt-0.5">{k.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <NavLink
              key={m.to}
              to={m.to}
              className={`os-glass p-5 hover:translate-y-[-2px] transition group ${
                m.featured ? "os-glow-purple ring-1 ring-purple-500/20" : ""
              }`}
            >
              <div className={`w-10 h-10 rounded-xl grid place-items-center ${m.tint}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="mt-3 font-semibold flex items-center gap-2">
                {m.label}
                <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white/70 group-hover:translate-x-0.5 transition" />
              </div>
              <div className="text-xs text-white/50 mt-1">{m.desc}</div>
              {m.featured && (
                <div className="mt-3 inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300">
                  Primary
                </div>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Reminders + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="os-glass p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-300" />
              <h3 className="font-semibold">Active Reminders</h3>
            </div>
            <NavLink to="/admin/automation/reminders" className="text-xs text-white/40 hover:text-white/70">
              View all
            </NavLink>
          </div>
          <div className="space-y-2">
            {REMINDERS.map((r) => (
              <div key={r.title} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 flex items-center gap-3">
                <span className={`shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border ${SEV[r.sev]}`}>
                  {r.due}
                </span>
                <span className="text-sm text-white/80 truncate">{r.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Status widget */}
        <div className="os-glass p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-4 h-4 text-purple-300" />
            <h3 className="font-semibold">Agent Status</h3>
          </div>
          <div className="space-y-2">
            {AGENTS.map((a) => (
              <div key={a.name} className="flex items-center justify-between text-sm">
                <div>
                  <div className="text-white/80">{a.name}</div>
                  <div className="text-[10px] text-white/40">Last activity: {a.last}</div>
                </div>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 text-white/40">
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity + Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="os-glass p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-cyan-300" />
            <h3 className="font-semibold">Recent Activity</h3>
          </div>
          <ul className="space-y-2.5">
            {ACTIVITY.map((e, i) => {
              const Icon = e.icon;
              return (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <Icon className={`w-4 h-4 mt-0.5 ${e.tint}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-white/80 truncate">{e.text}</div>
                    <div className="text-[10px] text-white/40">{e.at}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="os-glass p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-green-300" />
            <h3 className="font-semibold">System Health</h3>
          </div>
          <div className="space-y-2">
            {HEALTH.map((h) => {
              const Icon = h.icon;
              return (
                <div key={h.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-white/50" />
                    <span className="text-white/80">{h.label}</span>
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    h.ok ? "bg-green-500/10 text-green-300" : "bg-white/5 text-white/40"
                  }`}>
                    {h.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
