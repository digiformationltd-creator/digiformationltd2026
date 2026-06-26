// Agent Detail — Phase 1 UI (mock data only).
// Tabs: Overview, Knowledge, Settings, Tasks, Queue, Logs, Health, Permissions.

import { useMemo, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import {
  ArrowLeft, BookOpen, Settings as SettingsIcon, ListChecks, Clock,
  Activity, HeartPulse, ShieldCheck, ChevronRight, CheckCircle2,
  AlertTriangle, Cpu, FileText, Search, Zap, AlertCircle,
} from "lucide-react";
import { AGENTS, TINT, STATUS_TINT, HEALTH_TINT, type Agent } from "./OsAutomationAgents";

type Tab = "overview" | "knowledge" | "settings" | "tasks" | "queue" | "logs" | "health" | "permissions";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "overview",    label: "Overview",    icon: Activity },
  { id: "knowledge",   label: "Knowledge",   icon: BookOpen },
  { id: "settings",    label: "Settings",    icon: SettingsIcon },
  { id: "tasks",       label: "Tasks",       icon: ListChecks },
  { id: "queue",       label: "Queue",       icon: Clock },
  { id: "logs",        label: "Logs",        icon: FileText },
  { id: "health",      label: "Health",      icon: HeartPulse },
  { id: "permissions", label: "Permissions", icon: ShieldCheck },
];

export default function OsAutomationAgentDetail() {
  const { id } = useParams<{ id: string }>();
  const agent = useMemo(() => AGENTS.find(a => a.id === id), [id]);
  const [tab, setTab] = useState<Tab>("overview");

  if (!agent) {
    return (
      <div className="os-glass p-10 text-center os-fade-in">
        <AlertCircle className="w-8 h-8 text-amber-300 mx-auto mb-3" />
        <div className="font-semibold">Agent not found</div>
        <p className="text-sm text-white/50 mt-1">No agent matches “{id}”.</p>
        <NavLink to="/admin/automation/agents" className="inline-flex mt-4 items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Agents
        </NavLink>
      </div>
    );
  }

  const Icon = agent.icon;

  return (
    <div className="space-y-6 os-fade-in">
      {/* Header */}
      <div className="os-glass p-6">
        <NavLink to="/admin/automation/agents" className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> All Agents
        </NavLink>
        <div className="flex items-start gap-4 flex-wrap">
          <div className={`w-14 h-14 rounded-2xl grid place-items-center ${TINT[agent.tint]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-[240px]">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold">{agent.name}</h2>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_TINT[agent.status]}`}>
                {agent.status === "in-design" ? "In Design" : agent.status}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-white/70">
                <span className={`w-2 h-2 rounded-full ${HEALTH_TINT[agent.health]}`} />
                <span className="capitalize">{agent.health}</span>
              </span>
            </div>
            <p className="text-sm text-white/55 mt-2 max-w-3xl">{agent.description}</p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-lg text-sm bg-white/5 border border-white/10 hover:bg-white/10">Pause</button>
            <button className="px-3 py-1.5 rounded-lg text-sm bg-purple-500/15 border border-purple-400/30 text-purple-100 hover:bg-purple-500/25">Configure</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-5 flex gap-1.5 flex-wrap">
          {TABS.map(t => {
            const TIcon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition border ${
                  active
                    ? "bg-purple-500/15 border-purple-400/30 text-purple-100"
                    : "bg-white/5 border-white/10 text-white/60 hover:text-white/90 hover:bg-white/10"
                }`}
              >
                <TIcon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "overview"    && <Overview a={agent} />}
      {tab === "knowledge"   && <Knowledge a={agent} />}
      {tab === "settings"    && <Settings a={agent} />}
      {tab === "tasks"       && <Tasks />}
      {tab === "queue"       && <Queue />}
      {tab === "logs"        && <Logs />}
      {tab === "health"      && <Health a={agent} />}
      {tab === "permissions" && <Permissions />}
    </div>
  );
}

/* ------------------------------ Tabs ----------------------------------- */

function Overview({ a }: { a: Agent }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Queue"        value={String(a.queue)}                                tint="cyan"    icon={Clock} />
        <Kpi label="Success Rate" value={a.successRate ? `${a.successRate}%` : "—"}     tint="emerald" icon={CheckCircle2} />
        <Kpi label="Last Activity"value={a.lastActivity}                                 tint="indigo"  icon={Activity} />
        <Kpi label="Health"       value={a.health}                                       tint={a.health === "excellent" ? "emerald" : a.health === "good" ? "cyan" : a.health === "warning" ? "gold" : "purple"} icon={HeartPulse} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="os-glass p-5">
          <div className="text-xs uppercase tracking-wider text-white/40 mb-3">Current Capabilities</div>
          <ul className="space-y-2 text-sm">
            {a.capabilities.map(c => (
              <li key={c} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" /> {c}
              </li>
            ))}
          </ul>
        </div>
        <div className="os-glass p-5">
          <div className="text-xs uppercase tracking-wider text-white/40 mb-3">Future Capabilities</div>
          <ul className="space-y-2 text-sm">
            {a.futureCapabilities.map(c => (
              <li key={c} className="flex items-center gap-2 text-white/70">
                <Zap className="w-4 h-4 text-amber-300" /> {c}
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40">Soon</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, tint, icon: Icon }: { label: string; value: string; tint: string; icon: any }) {
  return (
    <div className="os-glass p-4">
      <div className={`w-9 h-9 rounded-xl grid place-items-center ${TINT[tint]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="mt-3 text-2xl font-bold capitalize">{value}</div>
      <div className="text-xs text-white/50">{label}</div>
    </div>
  );
}

function Knowledge({ a }: { a: Agent }) {
  const items = [
    { name: `${a.name} · System Prompt`,  size: "2.1 KB",  updated: "2d ago",  status: "live"  },
    { name: "DigiFormation Services FAQ", size: "18.4 KB", updated: "1w ago",  status: "live"  },
    { name: "Pricing & Packages",         size: "6.2 KB",  updated: "3d ago",  status: "live"  },
    { name: "Tone & Brand Guidelines",    size: "1.8 KB",  updated: "2w ago",  status: "live"  },
    { name: "Internal Playbook (draft)",  size: "4.6 KB",  updated: "Today",   status: "draft" },
  ];
  return (
    <div className="os-glass overflow-hidden">
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div>
          <div className="font-semibold">Knowledge Base</div>
          <div className="text-xs text-white/50">Isolated knowledge files this agent can reference.</div>
        </div>
        <button disabled className="px-3 py-1.5 rounded-lg text-sm bg-white/5 border border-white/10 text-white/40">Add file · Soon</button>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-white/5 text-white/50 text-xs uppercase tracking-wider">
          <tr><th className="text-left px-5 py-3">Document</th><th className="text-left px-5 py-3">Size</th><th className="text-left px-5 py-3">Updated</th><th className="text-left px-5 py-3">Status</th></tr>
        </thead>
        <tbody>
          {items.map(i => (
            <tr key={i.name} className="border-t border-white/5">
              <td className="px-5 py-3 font-medium">{i.name}</td>
              <td className="px-5 py-3 text-white/60">{i.size}</td>
              <td className="px-5 py-3 text-white/60">{i.updated}</td>
              <td className="px-5 py-3">
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${i.status === "live" ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}>{i.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Settings({ a }: { a: Agent }) {
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card title="Model & Routing">
        <Row label="Primary model"  value="Gemini Flash Lite" />
        <Row label="Fallback model" value="Lovable Gateway" />
        <Row label="Max tokens"     value="1024" />
        <Row label="Temperature"    value="0.4" />
      </Card>
      <Card title="Limits">
        <Row label="Daily request cap"  value="2,000" />
        <Row label="Per-IP rate limit"  value="20 / hr" />
        <Row label="Concurrency"        value="4" />
        <Row label="Timeout"            value="30s" />
      </Card>
      <Card title="Triggers">
        <Row label="Schedule"     value={a.id === "reminder" ? "Daily 08:00 UTC" : "On demand"} />
        <Row label="Event driven" value="Yes" />
        <Row label="Manual run"   value="Admin only" />
      </Card>
      <Card title="Notifications">
        <Row label="On failure"   value="Email · Haroon" />
        <Row label="On stall"     value="WhatsApp digest" />
        <Row label="Daily report" value="08:00 UTC" />
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: any }) {
  return (
    <div className="os-glass p-5">
      <div className="text-xs uppercase tracking-wider text-white/40 mb-3">{title}</div>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/55">{label}</span>
      <span className="text-white/90">{value}</span>
    </div>
  );
}

function Tasks() {
  const tasks = [
    { name: "Scan stalled orders",        cadence: "Hourly",       last: "12m ago", status: "ok"   },
    { name: "Refresh compliance windows", cadence: "Daily · 08:00",last: "Today",   status: "ok"   },
    { name: "Build reminder digest",      cadence: "Daily · 09:00",last: "Today",   status: "ok"   },
    { name: "Re-score stale clients",     cadence: "Weekly",       last: "3d ago",  status: "warn" },
  ];
  return (
    <div className="os-glass overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-white/5 text-white/50 text-xs uppercase tracking-wider">
          <tr><th className="text-left px-5 py-3">Task</th><th className="text-left px-5 py-3">Cadence</th><th className="text-left px-5 py-3">Last Run</th><th className="text-left px-5 py-3">Status</th></tr>
        </thead>
        <tbody>
          {tasks.map(t => (
            <tr key={t.name} className="border-t border-white/5">
              <td className="px-5 py-3 font-medium">{t.name}</td>
              <td className="px-5 py-3 text-white/60">{t.cadence}</td>
              <td className="px-5 py-3 text-white/60">{t.last}</td>
              <td className="px-5 py-3">
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${t.status === "ok" ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}>{t.status === "ok" ? "Healthy" : "Warning"}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Queue() {
  const stats = [
    { label: "Waiting", value: 14, tint: "cyan" },
    { label: "Running", value: 2,  tint: "indigo" },
    { label: "Done",    value: 482,tint: "emerald" },
    { label: "Failed",  value: 6,  tint: "gold" },
  ];
  const rows = [
    { id: "T-9981", task: "Renewal scan · Brightline Ltd",   eta: "Now",        state: "running" },
    { id: "T-9982", task: "Reminder · Wise follow-up",        eta: "In 4m",     state: "waiting" },
    { id: "T-9983", task: "Digest · Today's overdue",         eta: "In 12m",    state: "waiting" },
    { id: "T-9980", task: "Renewal scan · Northwind Dental",  eta: "Done · 8m", state: "done" },
  ];
  const stateTint: Record<string, string> = {
    waiting: "bg-cyan-500/10 text-cyan-300",
    running: "bg-indigo-500/10 text-indigo-300",
    done:    "bg-emerald-500/10 text-emerald-300",
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="os-glass p-4">
            <div className="text-xs text-white/50">{s.label}</div>
            <div className="text-2xl font-bold mt-1">{s.value}</div>
            <div className={`mt-2 h-1 rounded-full ${TINT[s.tint].split(" ")[0].replace("/10","/40")}`} />
          </div>
        ))}
      </div>
      <div className="os-glass overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-white/50 text-xs uppercase tracking-wider">
            <tr><th className="text-left px-5 py-3">ID</th><th className="text-left px-5 py-3">Task</th><th className="text-left px-5 py-3">ETA</th><th className="text-left px-5 py-3">State</th></tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t border-white/5">
                <td className="px-5 py-3 font-mono text-xs text-white/60">{r.id}</td>
                <td className="px-5 py-3">{r.task}</td>
                <td className="px-5 py-3 text-white/60">{r.eta}</td>
                <td className="px-5 py-3"><span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${stateTint[r.state]}`}>{r.state}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Logs() {
  const logs = [
    { time: "09:42", level: "info",  msg: "Run completed · 8 reminders created" },
    { time: "09:41", level: "info",  msg: "Scanned 1,284 orders in 412ms" },
    { time: "08:00", level: "info",  msg: "Scheduled run started" },
    { time: "Yest",  level: "warn",  msg: "Retry · Companies House timed out" },
    { time: "Yest",  level: "info",  msg: "Run completed · 11 reminders created" },
    { time: "Mon",   level: "error", msg: "Run failed · upstream 503" },
  ];
  const tone: Record<string, string> = {
    info:  "text-cyan-300",
    warn:  "text-amber-300",
    error: "text-red-300",
  };
  return (
    <div className="os-glass p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="font-semibold">Activity Logs</div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 w-64 max-w-full">
          <Search className="w-4 h-4 text-white/40" />
          <input placeholder="Filter…" className="bg-transparent text-sm outline-none flex-1 placeholder:text-white/30" />
        </div>
      </div>
      <div className="font-mono text-xs space-y-1.5">
        {logs.map((l, i) => (
          <div key={i} className="flex gap-3">
            <span className="text-white/40 w-12 shrink-0">{l.time}</span>
            <span className={`uppercase w-12 shrink-0 ${tone[l.level]}`}>{l.level}</span>
            <span className="text-white/80">{l.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Health({ a }: { a: Agent }) {
  const checks = [
    { name: "Heartbeat",       state: "ok",   detail: "Last ping 12s ago" },
    { name: "Queue throughput",state: a.queue > 10 ? "warn" : "ok", detail: `${a.queue} pending` },
    { name: "Error rate",      state: a.successRate >= 95 ? "ok" : "warn", detail: `${100 - a.successRate}% in last 24h` },
    { name: "Upstream APIs",   state: "ok",   detail: "All providers reachable" },
  ];
  const tone: Record<string, { tint: string; icon: any }> = {
    ok:   { tint: "bg-emerald-500/10 text-emerald-300", icon: CheckCircle2 },
    warn: { tint: "bg-amber-500/10 text-amber-300",     icon: AlertTriangle },
    err:  { tint: "bg-red-500/10 text-red-300",         icon: AlertCircle },
  };
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="os-glass p-5">
        <div className="flex items-center gap-2 mb-4">
          <HeartPulse className="w-4 h-4 text-pink-300" />
          <h3 className="font-semibold">System Checks</h3>
        </div>
        <ul className="space-y-2">
          {checks.map(c => {
            const t = tone[c.state];
            const Icon = t.icon;
            return (
              <li key={c.name} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                <div className={`w-8 h-8 rounded-lg grid place-items-center ${t.tint}`}><Icon className="w-4 h-4" /></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-xs text-white/50">{c.detail}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="os-glass p-5">
        <div className="text-xs uppercase tracking-wider text-white/40 mb-3">Uptime · 30 days</div>
        <div className="text-3xl font-bold">99.6%</div>
        <div className="mt-4 grid grid-cols-30 gap-0.5">
          {Array.from({ length: 30 }).map((_, i) => {
            const bad = i === 11 || i === 21;
            return <div key={i} className={`h-8 rounded-sm ${bad ? "bg-amber-400/60" : "bg-emerald-400/40"}`} />;
          })}
        </div>
        <div className="mt-3 text-xs text-white/40">2 minor incidents · 0 outages</div>
      </div>
    </div>
  );
}

function Permissions() {
  const perms = [
    { scope: "Read · Orders",        granted: true  },
    { scope: "Read · Clients",       granted: true  },
    { scope: "Read · Invoices",      granted: true  },
    { scope: "Write · Reminders",    granted: true  },
    { scope: "Write · Email Log",    granted: true  },
    { scope: "Send · Transactional", granted: false },
    { scope: "Delete · Records",     granted: false },
    { scope: "Admin actions",        granted: false },
  ];
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="os-glass p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-emerald-300" />
          <h3 className="font-semibold">Granted Scopes</h3>
        </div>
        <ul className="space-y-2">
          {perms.map(p => (
            <li key={p.scope} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
              <span className="text-sm">{p.scope}</span>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${p.granted ? "bg-emerald-500/10 text-emerald-300" : "bg-white/5 text-white/40"}`}>
                {p.granted ? "Granted" : "Denied"}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="os-glass p-5">
        <div className="text-xs uppercase tracking-wider text-white/40 mb-3">Role Bindings</div>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
            <span>Service role</span><span className="text-white/60">agent-runner</span>
          </li>
          <li className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
            <span>Audit log</span><span className="text-white/60">agent_audit_log</span>
          </li>
          <li className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
            <span>HITL approval</span><span className="text-white/60">required &gt; £500</span>
          </li>
        </ul>
        <button disabled className="mt-4 w-full px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-white/40">
          Edit Permissions · Soon
        </button>
      </div>
    </div>
  );
}
