// AI Agents Management — Phase 1 UI (mock data only).
// Enterprise-grade agent catalogue with health, queue, success rate and roadmap.
// Detail view is rendered in OsAutomationAgentDetail.tsx via /admin/automation/agents/:id.

import { NavLink } from "react-router-dom";
import {
  Bot, Bell, ScanText, Building2, Users, ShieldCheck, Mail, PoundSterling,
  Search, Globe, MessageCircle, Sparkles, ChevronRight, Activity, Clock,
  CheckCircle2, AlertTriangle, Pause, Cpu,
} from "lucide-react";

export type AgentStatus = "active" | "in-design" | "planned" | "paused";
export type HealthLevel = "excellent" | "good" | "warning" | "offline";

export type Agent = {
  id: string;
  name: string;
  icon: any;
  tint: string;
  status: AgentStatus;
  health: HealthLevel;
  queue: number;
  lastActivity: string;
  successRate: number;
  description: string;
  capabilities: string[];
  futureCapabilities: string[];
};

export const AGENTS: Agent[] = [
  {
    id: "reminder", name: "Reminder Agent", icon: Bell, tint: "gold",
    status: "in-design", health: "good", queue: 12, lastActivity: "8m ago", successRate: 96,
    description: "Detects stalled orders, missing compliance data and renewal windows, then opens reminders the team can action in one click.",
    capabilities: ["Native SQL detection", "pg_cron scheduling", "Zero AI credits"],
    futureCapabilities: ["Smart snoozing", "Per-client cadence", "Cross-channel delivery"],
  },
  {
    id: "ocr", name: "OCR Agent", icon: ScanText, tint: "cyan",
    status: "planned", health: "offline", queue: 0, lastActivity: "—", successRate: 0,
    description: "Extracts structured data from uploaded ID, address proofs and invoices via an external Tesseract worker.",
    capabilities: ["External worker", "Zero AI credits", "Auto-attach to orders"],
    futureCapabilities: ["Multi-page PDFs", "Confidence scoring", "Field-level review"],
  },
  {
    id: "company", name: "Company Agent", icon: Building2, tint: "indigo",
    status: "planned", health: "offline", queue: 0, lastActivity: "—", successRate: 0,
    description: "Keeps managed company records accurate by reconciling Companies House data on a schedule.",
    capabilities: ["Companies House sync", "Officers + PSC", "Filing watch"],
    futureCapabilities: ["Auto-import filings", "Diff alerts", "Bulk reconciliation"],
  },
  {
    id: "customer", name: "Customer Agent", icon: Users, tint: "purple",
    status: "planned", health: "offline", queue: 0, lastActivity: "—", successRate: 0,
    description: "Drafts status update emails when an order milestone changes and surfaces them for one-tap approval.",
    capabilities: ["AI drafting", "Approval gate", "Tone presets"],
    futureCapabilities: ["Sentiment routing", "Auto-personalisation", "Multi-language"],
  },
  {
    id: "compliance", name: "Compliance Agent", icon: ShieldCheck, tint: "emerald",
    status: "in-design", health: "good", queue: 4, lastActivity: "1h ago", successRate: 92,
    description: "Monitors CS / AA / Address renewal deadlines across the client base and orchestrates the reminder cascade.",
    capabilities: ["Renewal watch", "Cascade rules", "Deterministic"],
    futureCapabilities: ["HMRC integration", "Penalty forecasting", "Auto-filing prep"],
  },
  {
    id: "email", name: "Email Agent", icon: Mail, tint: "pink",
    status: "active", health: "excellent", queue: 2, lastActivity: "Just now", successRate: 99,
    description: "Routes transactional emails, retries soft failures and writes every send to the unified email log.",
    capabilities: ["Template registry", "DLQ retries", "Per-entity history"],
    futureCapabilities: ["Open / click tracking", "Inbound parsing", "AI summaries"],
  },
  {
    id: "finance", name: "Finance Agent", icon: PoundSterling, tint: "mustard",
    status: "planned", health: "offline", queue: 0, lastActivity: "—", successRate: 0,
    description: "Reconciles invoices, payouts and refunds across Stripe, Wise and PayPal into a single ledger view.",
    capabilities: ["Multi-PSP reconciliation", "Refund tracking", "Ledger export"],
    futureCapabilities: ["Tax automation", "Cash-flow forecast", "Auto-dunning"],
  },
  {
    id: "seo", name: "SEO Agent", icon: Search, tint: "cyan",
    status: "planned", health: "offline", queue: 0, lastActivity: "—", successRate: 0,
    description: "Monitors keyword positions, technical SEO health and content freshness across DigiFormation properties.",
    capabilities: ["Rank tracking", "Tech audits", "Content freshness"],
    futureCapabilities: ["Auto-meta drafts", "Internal link suggestions", "Competitor watch"],
  },
  {
    id: "website-audit", name: "Website Audit Agent", icon: Globe, tint: "emerald",
    status: "planned", health: "offline", queue: 0, lastActivity: "—", successRate: 0,
    description: "Runs scheduled performance, accessibility and security audits and files findings into the workflow queue.",
    capabilities: ["Lighthouse audits", "A11y scoring", "Security checks"],
    futureCapabilities: ["Auto-fix PRs", "Regression alerts", "Per-route budgets"],
  },
  {
    id: "whatsapp", name: "WhatsApp Agent", icon: MessageCircle, tint: "emerald",
    status: "in-design", health: "good", queue: 6, lastActivity: "20m ago", successRate: 94,
    description: "Triages inbound WhatsApp conversations, links them to clients and proposes next-best replies.",
    capabilities: ["Contact linking", "Reply suggestions", "CRM sync"],
    futureCapabilities: ["Voice notes", "Auto-routing", "Multilingual replies"],
  },
  {
    id: "assistant", name: "AI Assistant", icon: Sparkles, tint: "purple",
    status: "active", health: "excellent", queue: 0, lastActivity: "Live", successRate: 98,
    description: "Customer-facing concierge that qualifies leads, recommends packages and hands off to humans when needed.",
    capabilities: ["Sales tone", "Rate-limited", "Handoff protocol"],
    futureCapabilities: ["Voice mode", "Proactive nudges", "Account-aware answers"],
  },
];

export const TINT: Record<string, string> = {
  gold:    "bg-amber-500/10 text-amber-300",
  cyan:    "bg-cyan-500/10 text-cyan-300",
  indigo:  "bg-indigo-500/10 text-indigo-300",
  purple:  "bg-purple-500/10 text-purple-300",
  emerald: "bg-emerald-500/10 text-emerald-300",
  pink:    "bg-pink-500/10 text-pink-300",
  mustard: "bg-yellow-500/10 text-yellow-300",
};

export const STATUS_TINT: Record<AgentStatus, string> = {
  active:     "bg-emerald-500/10 text-emerald-300",
  "in-design":"bg-amber-500/10 text-amber-300",
  planned:    "bg-white/5 text-white/50",
  paused:     "bg-red-500/10 text-red-300",
};

export const HEALTH_TINT: Record<HealthLevel, string> = {
  excellent: "bg-emerald-400",
  good:      "bg-cyan-400",
  warning:   "bg-amber-400",
  offline:   "bg-white/20",
};

const STATUS_ICON: Record<AgentStatus, any> = {
  active: CheckCircle2,
  "in-design": Clock,
  planned: Cpu,
  paused: Pause,
};

export default function OsAutomationAgents() {
  const active = AGENTS.filter(a => a.status === "active").length;
  const inDesign = AGENTS.filter(a => a.status === "in-design").length;
  const planned = AGENTS.filter(a => a.status === "planned").length;
  const queue = AGENTS.reduce((s, a) => s + a.queue, 0);

  return (
    <div className="space-y-6 os-fade-in">
      {/* Header */}
      <div className="os-glass p-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className={`w-12 h-12 rounded-2xl grid place-items-center ${TINT.purple}`}>
            <Bot className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-[240px]">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold">AI Agents</h2>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-200 border border-purple-400/20">
                Agent Management
              </span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10">
                Phase 1 · UI
              </span>
            </div>
            <p className="text-sm text-white/50 mt-1 max-w-2xl">
              Manage every specialist agent powering Business OS — health, queue depth, success rate and the roadmap. Click any agent to open its detail surface.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStat label="Active"      value={active}   tint="emerald" icon={CheckCircle2} />
          <MiniStat label="In Design"   value={inDesign} tint="gold"    icon={Clock} />
          <MiniStat label="Planned"     value={planned}  tint="indigo"  icon={Cpu} />
          <MiniStat label="Queue Total" value={queue}    tint="cyan"    icon={Activity} />
        </div>
      </div>

      {/* Agent grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {AGENTS.map(a => <AgentCard key={a.id} a={a} />)}
      </div>
    </div>
  );
}

function MiniStat({ label, value, tint, icon: Icon }: { label: string; value: number; tint: string; icon: any }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg grid place-items-center ${TINT[tint]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="text-xl font-bold leading-none">{value}</div>
        <div className="text-[11px] text-white/50 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function AgentCard({ a }: { a: Agent }) {
  const Icon = a.icon;
  const SIcon = STATUS_ICON[a.status];
  return (
    <NavLink to={`/admin/automation/agents/${a.id}`} className="os-glass p-5 hover:bg-white/5 transition group block">
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl grid place-items-center ${TINT[a.tint]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-semibold truncate">{a.name}</div>
            <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_TINT[a.status]}`}>
              <SIcon className="w-3 h-3" /> {a.status === "in-design" ? "In Design" : a.status.charAt(0).toUpperCase() + a.status.slice(1)}
            </span>
          </div>
          <p className="text-xs text-white/55 mt-1 line-clamp-2">{a.description}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/70 transition" />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3 text-xs">
        <Metric label="Health"  value={
          <span className="inline-flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${HEALTH_TINT[a.health]}`} />
            <span className="capitalize">{a.health}</span>
          </span>
        } />
        <Metric label="Queue" value={<span className="font-semibold">{a.queue}</span>} />
        <Metric label="Success" value={
          <span className={a.successRate >= 95 ? "text-emerald-300 font-semibold" : a.successRate >= 80 ? "text-cyan-300 font-semibold" : "text-white/50"}>
            {a.successRate ? `${a.successRate}%` : "—"}
          </span>
        } />
        <Metric label="Last" value={<span className="text-white/70">{a.lastActivity}</span>} />
      </div>

      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5">Future Capabilities</div>
        <div className="flex flex-wrap gap-1.5">
          {a.futureCapabilities.map(f => (
            <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">
              {f}
            </span>
          ))}
        </div>
      </div>
    </NavLink>
  );
}

function Metric({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
      <div className="text-white/90 mt-0.5">{value}</div>
    </div>
  );
}
