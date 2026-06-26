// Automation Hub — Phase 1.1 (UI polish)
// Pure UI with mock data. No backend. Adds Quick Actions, Agent Status,
// Timeline filters, Reminder Summary, and Future Modules.

import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Mail, Zap, Clock, Bot, Workflow, Activity, Bell, CheckCircle2,
  AlertTriangle, Database, Cpu, MessageSquare, ArrowRight, Play,
  PauseCircle, RefreshCw, Eye, SkipForward, ShieldCheck, Send,
  TrendingUp, TrendingDown, Minus, ScanLine, FileCheck2, Wallet,
  Search, Globe, PenLine, ListChecks,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Overview KPIs                                                      */
/* ------------------------------------------------------------------ */

type Trend = "up" | "down" | "flat";
type Kpi = { label: string; value: string; sub: string; icon: any; tint: string; trend: Trend; delta?: string };

const OVERVIEW: Kpi[] = [
  { label: "Active Automations", value: "12",      sub: "3 paused",            icon: Zap,         tint: "lime",   trend: "up",   delta: "+2 this week" },
  { label: "Active AI Agents",   value: "0 / 6",   sub: "6 planned",           icon: Bot,         tint: "purple", trend: "flat", delta: "Phase 2" },
  { label: "Pending Reminders",  value: "7",       sub: "2 overdue",           icon: Bell,        tint: "amber",  trend: "up",   delta: "+3 today" },
  { label: "Running Jobs",       value: "1",       sub: "queue healthy",       icon: Activity,    tint: "cyan",   trend: "flat", delta: "Stable" },
  { label: "Failed Jobs (24h)",  value: "0",       sub: "no incidents",        icon: AlertTriangle, tint: "red",  trend: "down", delta: "−1 vs yesterday" },
  { label: "System Health",      value: "Healthy", sub: "All systems nominal", icon: ShieldCheck, tint: "green",  trend: "flat", delta: "100% uptime" },
];

const TINT: Record<string, string> = {
  lime:   "bg-lime-500/10 text-lime-300",
  amber:  "bg-amber-500/10 text-amber-300",
  cyan:   "bg-cyan-500/10 text-cyan-300",
  blue:   "bg-blue-500/10 text-blue-300",
  purple: "bg-purple-500/10 text-purple-300",
  green:  "bg-green-500/10 text-green-300",
  red:    "bg-red-500/10 text-red-300",
  pink:   "bg-pink-500/10 text-pink-300",
};

/* ------------------------------------------------------------------ */
/*  Section cards (existing — kept)                                    */
/* ------------------------------------------------------------------ */

type Section = {
  label: string; to: string; icon: any; status: "available"|"coming";
  desc: string; meta: string; tint: string;
};

const SECTIONS: Section[] = [
  { label: "Email Marketing",         to: "/admin/automation/email-marketing", icon: Mail,     status: "coming",    desc: "Campaign builder powered by the existing email engine.", meta: "0 campaigns", tint: "pink" },
  { label: "Email Automation History",to: "/admin/automation/history",         icon: Clock,    status: "coming",    desc: "Logs of every automated email sent across Business OS.",  meta: "Logs ready",  tint: "blue" },
  { label: "Scheduled Jobs",          to: "/admin/automation/jobs",            icon: Workflow, status: "available", desc: "Cron and scheduled internal workflows.",                  meta: "9 jobs",      tint: "cyan" },
  { label: "AI Agents",               to: "/admin/automation/agents",          icon: Bot,      status: "available", desc: "Specialist agents for compliance, formation and ops.",    meta: "6 planned",   tint: "purple" },
  { label: "Business Automations",    to: "/admin/automation/workflows",       icon: Zap,      status: "available", desc: "Follow-ups, reminders, lead qualification and more.",     meta: "12 rules",    tint: "lime" },
];

/* ------------------------------------------------------------------ */
/*  Reminder Center (mock)                                             */
/* ------------------------------------------------------------------ */

type Reminder = { id: string; title: string; due: string; severity: "overdue"|"today"|"soon"; entity: string };

const REMINDERS: Reminder[] = [
  { id: "r1", title: "Confirmation Statement due — Ascend Ltd",     due: "Overdue · 2d",   severity: "overdue", entity: "Ascend Ltd" },
  { id: "r2", title: "Follow up Stripe application — Nova Trading", due: "Today",          severity: "today",   entity: "Nova Trading" },
  { id: "r3", title: "VAT registration documents — Helix Studios",  due: "Today",          severity: "today",   entity: "Helix Studios" },
  { id: "r4", title: "Annual Accounts reminder — Bramble & Co",     due: "In 3 days",      severity: "soon",    entity: "Bramble & Co" },
  { id: "r5", title: "Renewal — Registered Address (Orbit Labs)",   due: "In 6 days",      severity: "soon",    entity: "Orbit Labs" },
];

const SEV_TINT: Record<Reminder["severity"], string> = {
  overdue: "bg-red-500/10 text-red-300 border-red-500/20",
  today:   "bg-amber-500/10 text-amber-300 border-amber-500/20",
  soon:    "bg-white/5 text-white/60 border-white/10",
};

/* ------------------------------------------------------------------ */
/*  Activity timeline (mock)                                           */
/* ------------------------------------------------------------------ */

type Event = { id: string; kind: string; text: string; at: string; icon: any; tint: string };

const ACTIVITY: Event[] = [
  { id: "e1", kind: "reminder",   text: "Reminder created — Confirmation Statement for Ascend Ltd",  at: "2m ago",  icon: Bell,        tint: "amber" },
  { id: "e2", kind: "automation", text: "Order Automation executed — Welcome flow for Nova Trading", at: "11m ago", icon: Zap,         tint: "lime" },
  { id: "e3", kind: "email",      text: "Email scheduled — Annual Accounts reminder (3 recipients)", at: "26m ago", icon: Mail,        tint: "pink" },
  { id: "e4", kind: "agent",      text: "Agent triggered — Compliance Agent (planned)",              at: "1h ago",  icon: Bot,         tint: "purple" },
  { id: "e5", kind: "queue",      text: "Queue updated — 4 tasks moved from waiting to running",    at: "2h ago",  icon: RefreshCw,   tint: "cyan" },
  { id: "e6", kind: "reminder",   text: "Reminder completed — Stripe follow-up (Helix Studios)",     at: "3h ago",  icon: CheckCircle2, tint: "green" },
];

/* ------------------------------------------------------------------ */
/*  Queue + System Health (mock)                                       */
/* ------------------------------------------------------------------ */

const QUEUE = [
  { label: "Waiting",   value: 3, tint: "amber" },
  { label: "Running",   value: 1, tint: "cyan" },
  { label: "Completed", value: 142, tint: "green" },
  { label: "Failed",    value: 0, tint: "red" },
];

const HEALTH = [
  { label: "Database",           status: "Operational", ok: true,  icon: Database },
  { label: "Scheduler",          status: "Operational", ok: true,  icon: Clock },
  { label: "Automation Engine",  status: "Operational", ok: true,  icon: Cpu },
  { label: "Discord Connection", status: "Not Connected", ok: false, icon: MessageSquare },
];

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

export default function OsAutomation() {
  return (
    <div className="space-y-6 os-fade-in">
      {/* Header */}
      <div className="os-glass os-glow-lime p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl grid place-items-center bg-lime-500/10 text-lime-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Automation Center</h2>
              <p className="text-sm text-white/50 mt-1 max-w-2xl">
                A single command surface for every automated workflow inside Business OS — reminders, scheduled jobs, AI agents and downstream integrations. Phase 1 ships the interface; native backend wiring follows.
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md bg-lime-500/10 text-lime-300 border border-lime-500/20">
            Phase 1 · UI Live
          </span>
        </div>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {OVERVIEW.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="os-glass p-4">
              <div className="flex items-start justify-between">
                <span className="text-[11px] text-white/50">{k.label}</span>
                <div className={`w-7 h-7 rounded-lg grid place-items-center ${TINT[k.tint]}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2 text-xl font-bold">{k.value}</div>
              <div className="text-[11px] text-white/40 mt-0.5">{k.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Section cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const card = (
            <div className="os-glass p-5 h-full hover:translate-y-[-2px] transition group">
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl grid place-items-center ${TINT[s.tint]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md ${
                  s.status === "available"
                    ? "bg-green-500/10 text-green-300"
                    : "bg-white/5 text-white/40"
                }`}>
                  {s.status === "available" ? "Open" : "Coming soon"}
                </span>
              </div>
              <div className="mt-3 font-semibold flex items-center gap-2">
                {s.label}
                {s.status === "available" && (
                  <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white/70 group-hover:translate-x-0.5 transition" />
                )}
              </div>
              <div className="text-xs text-white/50 mt-1">{s.desc}</div>
              <div className="text-[11px] text-white/40 mt-3">{s.meta}</div>
            </div>
          );
          return s.status === "available"
            ? <NavLink key={s.to} to={s.to}>{card}</NavLink>
            : <div key={s.to} className="opacity-70 cursor-default">{card}</div>;
        })}
      </div>

      {/* Reminder Center + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="os-glass p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-300" />
              <h3 className="font-semibold">Reminder Center</h3>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 text-white/40">Mock</span>
            </div>
            <span className="text-xs text-white/40">{REMINDERS.length} open</span>
          </div>
          <div className="space-y-2">
            {REMINDERS.map((r) => (
              <div key={r.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 flex items-start gap-3">
                <div className={`shrink-0 mt-0.5 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border ${SEV_TINT[r.severity]}`}>
                  {r.due}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.title}</div>
                  <div className="text-[11px] text-white/40">{r.entity}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <ReminderBtn icon={CheckCircle2} label="Done" tint="green" />
                  <ReminderBtn icon={Clock}        label="Later" tint="amber" />
                  <ReminderBtn icon={SkipForward}  label="Skip"  tint="white" />
                  <ReminderBtn icon={Eye}          label="View"  tint="cyan" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="os-glass p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-300" />
              <h3 className="font-semibold">Activity</h3>
            </div>
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 text-white/40">Mock</span>
          </div>
          <div className="space-y-3">
            {ACTIVITY.map((e) => {
              const Icon = e.icon;
              return (
                <div key={e.id} className="flex items-start gap-3">
                  <div className={`shrink-0 w-7 h-7 rounded-lg grid place-items-center ${TINT[e.tint]}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white/80 leading-snug">{e.text}</div>
                    <div className="text-[10px] text-white/40 mt-0.5">{e.at}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Queue + Health + Discord */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="os-glass p-5">
          <div className="flex items-center gap-2 mb-4">
            <RefreshCw className="w-4 h-4 text-cyan-300" />
            <h3 className="font-semibold">Queue Monitor</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {QUEUE.map((q) => (
              <div key={q.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                <div className="text-[11px] text-white/50">{q.label}</div>
                <div className={`mt-1 text-2xl font-bold ${TINT[q.tint].split(" ")[1]}`}>{q.value}</div>
              </div>
            ))}
          </div>
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
                <div key={h.label} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-white/60" />
                    <span className="text-sm">{h.label}</span>
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

        <DiscordCard />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function ReminderBtn({ icon: Icon, label, tint }: { icon: any; label: string; tint: string }) {
  const tints: Record<string, string> = {
    green: "hover:bg-green-500/10 hover:text-green-300",
    amber: "hover:bg-amber-500/10 hover:text-amber-300",
    cyan:  "hover:bg-cyan-500/10 hover:text-cyan-300",
    white: "hover:bg-white/10 hover:text-white",
  };
  return (
    <button
      type="button"
      title={label}
      className={`w-7 h-7 rounded-md grid place-items-center text-white/40 transition ${tints[tint]}`}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}

function DiscordCard() {
  return (
    <div className="os-glass p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-300" />
          <h3 className="font-semibold">Discord Integration</h3>
        </div>
        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 text-white/40">Planned</span>
      </div>

      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/60">Status</span>
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 text-white/40">
            Not Connected
          </span>
        </div>
      </div>

      <button
        type="button"
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 text-indigo-200 text-sm py-2.5 transition"
      >
        <MessageSquare className="w-4 h-4" /> Connect Discord
      </button>

      <div className="mt-3 space-y-2 text-xs">
        <Toggle label="Reminders" enabled />
        <Toggle label="Order alerts" enabled />
        <Toggle label="System errors" enabled={false} />
      </div>

      <button
        type="button"
        disabled
        className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white/[0.03] border border-white/5 text-white/30 text-xs py-2 cursor-not-allowed"
      >
        <Send className="w-3.5 h-3.5" /> Test notification (backend pending)
      </button>
    </div>
  );
}

function Toggle({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/60">{label}</span>
      <div className={`w-9 h-5 rounded-full relative transition ${enabled ? "bg-indigo-500/40" : "bg-white/10"}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition ${enabled ? "left-[18px]" : "left-0.5"}`} />
      </div>
    </div>
  );
}
