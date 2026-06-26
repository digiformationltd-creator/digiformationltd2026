// Business Automation Center — Phase 1 UI scaffold (mock data only).

import { useState } from "react";
import { Zap, ShoppingBag, Users, Bell, ShieldCheck, FileText, MessageCircle } from "lucide-react";

type Category = {
  id: string; label: string; icon: any; tint: string;
  automations: Automation[];
};

type Automation = {
  id: string;
  name: string;
  trigger: string;
  status: "active" | "paused" | "draft";
  lastRun: string;
  nextRun: string;
};

const CATEGORIES: Category[] = [
  {
    id: "orders", label: "Order Automation", icon: ShoppingBag, tint: "green",
    automations: [
      { id: "o1", name: "Send order confirmation",      trigger: "Order created",      status: "active", lastRun: "11m ago", nextRun: "On event" },
      { id: "o2", name: "Mirror inquiry → client_order",trigger: "Contact submission", status: "active", lastRun: "1h ago",  nextRun: "On event" },
      { id: "o3", name: "Notify team on new order",     trigger: "Order created",      status: "active", lastRun: "11m ago", nextRun: "On event" },
    ],
  },
  {
    id: "followups", label: "Customer Follow-ups", icon: Users, tint: "cyan",
    automations: [
      { id: "f1", name: "Banking application check-in",   trigger: "Order +48h",  status: "draft",  lastRun: "—",       nextRun: "Manual" },
      { id: "f2", name: "Document request reminder",     trigger: "Missing docs +24h", status: "active", lastRun: "3h ago", nextRun: "Every 4h" },
    ],
  },
  {
    id: "reminders", label: "Internal Reminders", icon: Bell, tint: "amber",
    automations: [
      { id: "r1", name: "Stalled order > 24h",           trigger: "Status unchanged", status: "active", lastRun: "Today 09:00", nextRun: "Today 21:00" },
      { id: "r2", name: "Lead untouched > 48h",          trigger: "No activity",      status: "paused", lastRun: "Yesterday",   nextRun: "—" },
    ],
  },
  {
    id: "compliance", label: "Company Compliance", icon: ShieldCheck, tint: "blue",
    automations: [
      { id: "c1", name: "Confirmation Statement reminder", trigger: "T-30 / T-7 / T-1", status: "active", lastRun: "Today 08:00", nextRun: "Tomorrow 08:00" },
      { id: "c2", name: "Annual Accounts reminder",       trigger: "T-60 / T-14",      status: "active", lastRun: "Today 08:00", nextRun: "Tomorrow 08:00" },
      { id: "c3", name: "Registered Address renewal",     trigger: "T-30",             status: "active", lastRun: "Today 08:00", nextRun: "Tomorrow 08:00" },
    ],
  },
  {
    id: "documents", label: "Document Processing", icon: FileText, tint: "pink",
    automations: [
      { id: "d1", name: "Auto-attach document to order",  trigger: "Document uploaded", status: "active", lastRun: "26m ago", nextRun: "On event" },
      { id: "d2", name: "OCR extract → review queue",     trigger: "ID uploaded",       status: "draft",  lastRun: "—",       nextRun: "Pending OCR worker" },
    ],
  },
  {
    id: "crm", label: "CRM Automation", icon: MessageCircle, tint: "purple",
    automations: [
      { id: "m1", name: "WhatsApp inbound → contact card", trigger: "New WhatsApp message", status: "active", lastRun: "9m ago", nextRun: "On event" },
      { id: "m2", name: "Tag lead by source",              trigger: "Lead created",         status: "active", lastRun: "1h ago", nextRun: "On event" },
    ],
  },
];

const TINT: Record<string, string> = {
  green: "bg-green-500/10 text-green-300",
  cyan:  "bg-cyan-500/10 text-cyan-300",
  amber: "bg-amber-500/10 text-amber-300",
  blue:  "bg-blue-500/10 text-blue-300",
  pink:  "bg-pink-500/10 text-pink-300",
  purple:"bg-purple-500/10 text-purple-300",
};

const STATUS_TINT: Record<Automation["status"], string> = {
  active: "bg-green-500/10 text-green-300",
  paused: "bg-amber-500/10 text-amber-300",
  draft:  "bg-white/5 text-white/40",
};

export default function OsAutomationWorkflows() {
  const [active, setActive] = useState<string>("all");
  const total = CATEGORIES.reduce((n, c) => n + c.automations.length, 0);
  const visible = active === "all" ? CATEGORIES : CATEGORIES.filter((c) => c.id === active);

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
                Every recurring workflow inside Business OS, grouped by domain. Toggles are interface-only in Phase 1; rule execution wires in next.
              </p>
            </div>
          </div>
          <div className="text-xs text-white/40">{total} automations</div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        <CatTab id="all" label="All" active={active === "all"} onClick={() => setActive("all")} />
        {CATEGORIES.map((c) => (
          <CatTab key={c.id} id={c.id} label={c.label} active={active === c.id} onClick={() => setActive(c.id)} />
        ))}
      </div>

      {/* Category sections */}
      <div className="space-y-6">
        {visible.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.id} className="os-glass p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-8 h-8 rounded-lg grid place-items-center ${TINT[c.tint]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-semibold">{c.label}</h3>
                <span className="text-[11px] text-white/40 ml-1">· {c.automations.length}</span>
              </div>

              <div className="space-y-2">
                {c.automations.map((a) => (
                  <div key={a.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="text-sm font-medium">{a.name}</div>
                      <div className="text-[11px] text-white/40 mt-0.5">Trigger · {a.trigger}</div>
                    </div>
                    <div className="hidden md:block text-[11px] text-white/50 min-w-[110px]">
                      <div className="text-white/40">Last run</div>
                      <div>{a.lastRun}</div>
                    </div>
                    <div className="hidden md:block text-[11px] text-white/50 min-w-[110px]">
                      <div className="text-white/40">Next run</div>
                      <div>{a.nextRun}</div>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md ${STATUS_TINT[a.status]}`}>
                      {a.status}
                    </span>
                    <FauxToggle on={a.status === "active"} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CatTab({ id, label, active, onClick }: { id: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-lg border transition ${
        active
          ? "bg-lime-500/15 border-lime-500/30 text-lime-200"
          : "bg-white/[0.02] border-white/5 text-white/60 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function FauxToggle({ on }: { on: boolean }) {
  return (
    <div className={`w-9 h-5 rounded-full relative transition ${on ? "bg-lime-500/40" : "bg-white/10"}`}>
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition ${on ? "left-[18px]" : "left-0.5"}`} />
    </div>
  );
}
