// Reminder Center — Phase 1 UI scaffold (mock data only).
// No backend, no scheduling logic. Pure interface.

import { useMemo, useState } from "react";
import {
  Bell, CheckCircle2, Clock, AlertTriangle, CalendarDays, ListChecks,
  Search, Filter, X, Building2, Banknote, ShieldCheck, FileText,
  ShoppingBag, Users, PoundSterling, Wrench, Flag, MoreHorizontal,
  Check, Clock3, SkipForward, UserPlus, ExternalLink, ChevronRight,
} from "lucide-react";

/* ------------------------- Types & mock data --------------------------- */

type Priority = "high" | "medium" | "low";
type Status = "today" | "upcoming" | "overdue" | "completed";
type Category =
  | "Company Formation" | "Banking" | "Compliance" | "Documents"
  | "Orders" | "Customers" | "Finance" | "Internal Tasks";

type Reminder = {
  id: string;
  title: string;
  client: string;
  category: Category;
  priority: Priority;
  status: Status;
  due: string;             // human label
  dueAt: string;           // sortable ISO-ish
  assignee: string;
  notes: string;
};

const CATEGORIES: { name: Category; icon: any; tint: string }[] = [
  { name: "Company Formation", icon: Building2,    tint: "cyan"    },
  { name: "Banking",           icon: Banknote,     tint: "emerald" },
  { name: "Compliance",        icon: ShieldCheck,  tint: "indigo"  },
  { name: "Documents",         icon: FileText,     tint: "pink"    },
  { name: "Orders",            icon: ShoppingBag,  tint: "gold"    },
  { name: "Customers",         icon: Users,        tint: "purple"  },
  { name: "Finance",           icon: PoundSterling,tint: "mustard" },
  { name: "Internal Tasks",    icon: Wrench,       tint: "cyan"    },
];

const TINT: Record<string, string> = {
  cyan:    "bg-cyan-500/10 text-cyan-300",
  emerald: "bg-emerald-500/10 text-emerald-300",
  pink:    "bg-pink-500/10 text-pink-300",
  indigo:  "bg-indigo-500/10 text-indigo-300",
  gold:    "bg-amber-500/10 text-amber-300",
  purple:  "bg-purple-500/10 text-purple-300",
  mustard: "bg-yellow-500/10 text-yellow-300",
  red:     "bg-red-500/10 text-red-300",
};

const PRIORITY_TINT: Record<Priority, string> = {
  high:   "bg-red-500/10 text-red-300 border-red-400/20",
  medium: "bg-amber-500/10 text-amber-300 border-amber-400/20",
  low:    "bg-emerald-500/10 text-emerald-300 border-emerald-400/20",
};

const STATUS_TINT: Record<Status, string> = {
  today:     "bg-cyan-500/10 text-cyan-300",
  upcoming:  "bg-indigo-500/10 text-indigo-300",
  overdue:   "bg-red-500/10 text-red-300",
  completed: "bg-emerald-500/10 text-emerald-300",
};

const REMINDERS: Reminder[] = [
  { id: "r1",  title: "File Confirmation Statement",     client: "Brightline Ltd",      category: "Compliance",        priority: "high",   status: "overdue",   due: "2 days overdue", dueAt: "2026-06-24", assignee: "Haroon", notes: "CS01 due — Companies House filing window closed." },
  { id: "r2",  title: "Renew Registered Address",        client: "Quokka Kitchen Ltd",  category: "Compliance",        priority: "high",   status: "overdue",   due: "Yesterday",      dueAt: "2026-06-25", assignee: "Sarah",  notes: "Address renewal expired — invoice already issued." },
  { id: "r3",  title: "Send UK LTD certificate pack",    client: "Aurora Web Studio",   category: "Documents",         priority: "medium", status: "today",     due: "Today · 14:00",  dueAt: "2026-06-26", assignee: "Haroon", notes: "Memorandum + share certificates ready for delivery." },
  { id: "r4",  title: "Follow-up Wise application",      client: "Vertex Software",     category: "Banking",           priority: "medium", status: "today",     due: "Today · 16:30",  dueAt: "2026-06-26", assignee: "Sarah",  notes: "Awaiting POA upload from client." },
  { id: "r5",  title: "Approve UK LTD draft name",       client: "Cobalt Marketing",    category: "Company Formation", priority: "high",   status: "today",     due: "Today · 11:00",  dueAt: "2026-06-26", assignee: "Haroon", notes: "Client confirmed by WhatsApp — needs admin approval." },
  { id: "r6",  title: "Annual Accounts intake call",     client: "Northwind Dental",    category: "Compliance",        priority: "medium", status: "upcoming",  due: "Mon 09:00",      dueAt: "2026-06-29", assignee: "Sarah",  notes: "Collect bookkeeping summary and bank statements." },
  { id: "r7",  title: "Chase unpaid invoice INV-2041",   client: "Bramley Law",         category: "Finance",           priority: "high",   status: "upcoming",  due: "Tue 10:00",      dueAt: "2026-06-30", assignee: "Haroon", notes: "Net-7 elapsed — soft reminder + retry link." },
  { id: "r8",  title: "Mark order COMP-1187 dispatched", client: "Pixel & Pine SEO",    category: "Orders",            priority: "low",    status: "upcoming",  due: "Wed 12:00",      dueAt: "2026-07-01", assignee: "Sarah",  notes: "Awaiting tracking number from courier." },
  { id: "r9",  title: "Onboarding welcome call",         client: "Highland Salon Co",   category: "Customers",         priority: "low",    status: "upcoming",  due: "Thu 15:00",      dueAt: "2026-07-02", assignee: "Haroon", notes: "Walk through dashboard + WhatsApp support channel." },
  { id: "r10", title: "Internal · review automation memo",client: "Internal",          category: "Internal Tasks",    priority: "low",    status: "upcoming",  due: "Fri 17:00",      dueAt: "2026-07-03", assignee: "Haroon", notes: "Phase-2 wiring plan for reminder engine." },
  { id: "r11", title: "Issued share certificates",       client: "Greenleaf Studio",    category: "Documents",         priority: "low",    status: "completed", due: "Yesterday",      dueAt: "2026-06-25", assignee: "Sarah",  notes: "Delivered via email + WhatsApp." },
  { id: "r12", title: "Stripe activation confirmed",     client: "Lumen Labs",          category: "Banking",           priority: "medium", status: "completed", due: "2 days ago",     dueAt: "2026-06-24", assignee: "Haroon", notes: "Account verified, payouts enabled." },
];

/* ------------------------------ Page ------------------------------------ */

type Tab = "today" | "upcoming" | "overdue" | "completed" | "all";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "today",     label: "Today",     icon: Clock },
  { id: "upcoming",  label: "Upcoming",  icon: CalendarDays },
  { id: "overdue",   label: "Overdue",   icon: AlertTriangle },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
  { id: "all",       label: "All",       icon: ListChecks },
];

export default function OsReminderCenter() {
  const [tab, setTab] = useState<Tab>("today");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "All">("All");
  const [pri, setPri] = useState<Priority | "All">("All");
  const [active, setActive] = useState<Reminder | null>(null);

  const counts = useMemo(() => ({
    today:     REMINDERS.filter(r => r.status === "today").length,
    upcoming:  REMINDERS.filter(r => r.status === "upcoming").length,
    overdue:   REMINDERS.filter(r => r.status === "overdue").length,
    completed: REMINDERS.filter(r => r.status === "completed").length,
    high:      REMINDERS.filter(r => r.priority === "high" && r.status !== "completed").length,
    total:     REMINDERS.length,
  }), []);

  const list = useMemo(() => {
    return REMINDERS.filter(r => {
      if (tab !== "all" && r.status !== tab) return false;
      if (cat !== "All" && r.category !== cat) return false;
      if (pri !== "All" && r.priority !== pri) return false;
      if (q && !(r.title + r.client + r.assignee).toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [tab, cat, pri, q]);

  return (
    <div className="space-y-6 os-fade-in">
      {/* Header */}
      <div className="os-glass p-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className={`w-12 h-12 rounded-2xl grid place-items-center ${TINT.gold}`}>
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-[240px]">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold">Reminder Center</h2>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-200 border border-amber-400/20">
                Operational
              </span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10">
                Phase 1 · UI
              </span>
            </div>
            <p className="text-sm text-white/50 mt-1 max-w-2xl">
              Every reminder across Business OS — today's work, upcoming items, anything overdue, and a record of completed tasks. Mock data while the reminder engine ships.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-5 flex gap-1.5 flex-wrap">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            const c = t.id === "all" ? counts.total : (counts as any)[t.id];
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition border ${
                  active
                    ? "bg-amber-500/15 border-amber-400/30 text-amber-100"
                    : "bg-white/5 border-white/10 text-white/60 hover:text-white/90 hover:bg-white/10"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/70">{c}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Kpi label="Today"          value={counts.today}     tint="cyan"    icon={Clock} />
        <Kpi label="Upcoming"       value={counts.upcoming}  tint="indigo"  icon={CalendarDays} />
        <Kpi label="Overdue"        value={counts.overdue}   tint="red"     icon={AlertTriangle} />
        <Kpi label="Completed"      value={counts.completed} tint="emerald" icon={CheckCircle2} />
        <Kpi label="High Priority"  value={counts.high}      tint="gold"    icon={Flag} />
        <Kpi label="Total"          value={counts.total}     tint="purple"  icon={ListChecks} />
      </div>

      {/* Categories */}
      <div className="os-glass p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-semibold">Reminder Categories</div>
            <div className="text-xs text-white/50">Filter the queue by workstream.</div>
          </div>
          {cat !== "All" && (
            <button onClick={() => setCat("All")} className="text-xs text-white/60 hover:text-white inline-flex items-center gap-1">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
          {CATEGORIES.map(c => {
            const Icon = c.icon;
            const n = REMINDERS.filter(r => r.category === c.name).length;
            const active = cat === c.name;
            return (
              <button
                key={c.name}
                onClick={() => setCat(active ? "All" : c.name)}
                className={`text-left rounded-xl border p-3 transition ${
                  active ? "border-amber-400/40 bg-amber-500/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg grid place-items-center ${TINT[c.tint]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="mt-2 text-xs font-medium leading-tight">{c.name}</div>
                <div className="text-[10px] text-white/40 mt-0.5">{n} reminders</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter bar */}
      <div className="os-glass p-3 flex gap-2 flex-wrap items-center">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-white/40" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search title, client, assignee…"
            className="bg-transparent text-sm outline-none flex-1 placeholder:text-white/30"
          />
        </div>
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
          <Filter className="w-3.5 h-3.5 text-white/40" />
          <span className="text-xs text-white/40 mr-1">Priority</span>
          {(["All","high","medium","low"] as const).map(p => (
            <button
              key={p}
              onClick={() => setPri(p as any)}
              className={`text-[11px] capitalize px-2 py-1 rounded-md ${pri === p ? "bg-amber-500/15 text-amber-100" : "text-white/60 hover:text-white"}`}
            >
              {p}
            </button>
          ))}
        </div>
        <span className="text-xs text-white/40 px-2">{list.length} results</span>
      </div>

      {/* List + Timeline */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {list.length === 0 && (
            <div className="os-glass p-10 text-center text-sm text-white/50">No reminders match the current filters.</div>
          )}
          {list.map(r => (
            <ReminderRow key={r.id} r={r} onOpen={() => setActive(r)} />
          ))}
        </div>

        <div className="space-y-4">
          <Timeline />
          <Statistics />
        </div>
      </div>

      {/* Drawer */}
      {active && <DetailsDrawer r={active} onClose={() => setActive(null)} />}
    </div>
  );
}

/* --------------------------- Sub-components ----------------------------- */

function Kpi({ label, value, tint, icon: Icon }: { label: string; value: number; tint: string; icon: any }) {
  return (
    <div className="os-glass p-4">
      <div className={`w-9 h-9 rounded-xl grid place-items-center ${TINT[tint]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="mt-3 text-2xl font-bold">{value}</div>
      <div className="text-xs text-white/50">{label}</div>
    </div>
  );
}

function CategoryIcon({ name }: { name: Category }) {
  const c = CATEGORIES.find(x => x.name === name)!;
  const Icon = c.icon;
  return (
    <div className={`w-9 h-9 rounded-xl grid place-items-center ${TINT[c.tint]}`}>
      <Icon className="w-4 h-4" />
    </div>
  );
}

function ReminderRow({ r, onOpen }: { r: Reminder; onOpen: () => void }) {
  return (
    <div className="os-glass p-4 hover:bg-white/5 transition">
      <div className="flex items-start gap-3">
        <CategoryIcon name={r.category} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`w-2 h-2 rounded-full ${
              r.priority === "high" ? "bg-red-400" : r.priority === "medium" ? "bg-amber-400" : "bg-emerald-400"
            }`} />
            <button onClick={onOpen} className="font-medium hover:text-amber-200 truncate text-left">{r.title}</button>
            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_TINT[r.status]}`}>
              {r.status}
            </span>
            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${PRIORITY_TINT[r.priority]}`}>
              {r.priority}
            </span>
          </div>
          <div className="mt-1 text-xs text-white/50 flex flex-wrap gap-x-3 gap-y-1">
            <span>{r.client}</span>
            <span>·</span>
            <span>{r.category}</span>
            <span>·</span>
            <span>{r.due}</span>
            <span>·</span>
            <span>Assigned · {r.assignee}</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1">
          <ActionBtn icon={Check}        label="Done"  tone="emerald" />
          <ActionBtn icon={Clock3}       label="Later" tone="cyan" />
          <ActionBtn icon={SkipForward}  label="Skip"  tone="white" />
          <ActionBtn icon={UserPlus}     label="Assign" tone="purple" />
          <button onClick={onOpen} className="ml-1 w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 grid place-items-center" title="Open">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button onClick={onOpen} className="md:hidden w-8 h-8 rounded-lg bg-white/5 grid place-items-center text-white/70">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, tone }: { icon: any; label: string; tone: string }) {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20",
    cyan:    "bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20",
    purple:  "bg-purple-500/10 text-purple-300 hover:bg-purple-500/20",
    white:   "bg-white/5 text-white/70 hover:bg-white/10",
  };
  return (
    <button title={label} className={`w-8 h-8 rounded-lg grid place-items-center ${tones[tone]}`}>
      <Icon className="w-4 h-4" />
    </button>
  );
}

/* ---------- Timeline ---------- */

const TIMELINE = [
  { time: "09:12", text: "Sarah completed · Issued share certificates · Greenleaf Studio", tone: "emerald" },
  { time: "08:40", text: "Reminder snoozed · Wise application follow-up · +2h", tone: "cyan" },
  { time: "08:05", text: "Reassigned · Confirmation Statement · Haroon → Sarah", tone: "purple" },
  { time: "Yesterday", text: "Overdue flagged · Renew Registered Address · Quokka Kitchen", tone: "red" },
  { time: "Yesterday", text: "Reminder created · Onboarding welcome call · Highland Salon", tone: "indigo" },
];

function Timeline() {
  return (
    <div className="os-glass p-5">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-cyan-300" />
        <h3 className="font-semibold">Reminder Timeline</h3>
      </div>
      <div className="relative pl-4">
        <div className="absolute left-1.5 top-1.5 bottom-1.5 w-px bg-white/10" />
        <div className="space-y-3">
          {TIMELINE.map((t, i) => (
            <div key={i} className="relative">
              <span className={`absolute -left-3.5 top-1.5 w-2 h-2 rounded-full ${
                t.tone === "emerald" ? "bg-emerald-400" :
                t.tone === "cyan"    ? "bg-cyan-400"    :
                t.tone === "purple"  ? "bg-purple-400"  :
                t.tone === "red"     ? "bg-red-400"     : "bg-indigo-400"
              }`} />
              <div className="text-[11px] text-white/40">{t.time}</div>
              <div className="text-xs text-white/80">{t.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Statistics ---------- */

function Statistics() {
  const total = REMINDERS.length;
  const completed = REMINDERS.filter(r => r.status === "completed").length;
  const pct = Math.round((completed / total) * 100);
  const byPri: Record<Priority, number> = {
    high:   REMINDERS.filter(r => r.priority === "high").length,
    medium: REMINDERS.filter(r => r.priority === "medium").length,
    low:    REMINDERS.filter(r => r.priority === "low").length,
  };

  return (
    <div className="os-glass p-5">
      <div className="flex items-center gap-2 mb-4">
        <ListChecks className="w-4 h-4 text-amber-300" />
        <h3 className="font-semibold">Reminder Statistics</h3>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/50">Completion rate · 7d</span>
          <span className="font-semibold">{pct}%</span>
        </div>
        <div className="mt-1.5 h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-emerald-400/70" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <div className="text-xs text-white/50 mb-1">By Priority</div>
        {(["high","medium","low"] as Priority[]).map(p => (
          <div key={p} className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${p === "high" ? "bg-red-400" : p === "medium" ? "bg-amber-400" : "bg-emerald-400"}`} />
            <span className="text-xs capitalize text-white/80 flex-1">{p}</span>
            <span className="text-xs text-white/50">{byPri[p]}</span>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <div className="text-xs text-white/50 mb-2">By Category</div>
        <div className="space-y-1.5">
          {CATEGORIES.map(c => {
            const n = REMINDERS.filter(r => r.category === c.name).length;
            const w = Math.round((n / total) * 100);
            return (
              <div key={c.name}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-white/70">{c.name}</span>
                  <span className="text-white/40">{n}</span>
                </div>
                <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                  <div className={`h-full ${c.tint === "cyan" ? "bg-cyan-400/60" : c.tint === "emerald" ? "bg-emerald-400/60" : c.tint === "pink" ? "bg-pink-400/60" : c.tint === "indigo" ? "bg-indigo-400/60" : c.tint === "gold" ? "bg-amber-400/60" : c.tint === "purple" ? "bg-purple-400/60" : "bg-yellow-400/60"}`} style={{ width: `${w}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- Drawer ---------- */

function DetailsDrawer({ r, onClose }: { r: Reminder; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md h-full bg-[#0b0f1a] border-l border-white/10 p-6 overflow-y-auto os-fade-in">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <CategoryIcon name={r.category} />
            <div>
              <div className="text-xs uppercase tracking-wider text-white/40">{r.category}</div>
              <h3 className="font-semibold text-lg leading-tight mt-0.5">{r.title}</h3>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 grid place-items-center text-white/70">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2 mt-4 flex-wrap">
          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_TINT[r.status]}`}>{r.status}</span>
          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${PRIORITY_TINT[r.priority]}`}>{r.priority} priority</span>
        </div>

        <dl className="mt-6 space-y-3 text-sm">
          <Field label="Client"   value={r.client} />
          <Field label="Due"      value={r.due} />
          <Field label="Assignee" value={r.assignee} />
          <Field label="Notes"    value={r.notes} />
        </dl>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <DrawerBtn icon={Check}       label="Done"        tone="emerald" />
          <DrawerBtn icon={Clock3}      label="Later"       tone="cyan" />
          <DrawerBtn icon={SkipForward} label="Skip"        tone="white" />
          <DrawerBtn icon={UserPlus}    label="Assign"      tone="purple" />
          <DrawerBtn icon={ExternalLink}label="Open Client" tone="amber" full />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-white/40">{label}</dt>
      <dd className="text-white/90 mt-0.5">{value}</dd>
    </div>
  );
}

function DrawerBtn({ icon: Icon, label, tone, full }: { icon: any; label: string; tone: string; full?: boolean }) {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25 border-emerald-400/20",
    cyan:    "bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25 border-cyan-400/20",
    white:   "bg-white/5 text-white/80 hover:bg-white/10 border-white/10",
    purple:  "bg-purple-500/15 text-purple-200 hover:bg-purple-500/25 border-purple-400/20",
    amber:   "bg-amber-500/15 text-amber-200 hover:bg-amber-500/25 border-amber-400/20",
  };
  return (
    <button className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${tones[tone]} ${full ? "col-span-2" : ""}`}>
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}
