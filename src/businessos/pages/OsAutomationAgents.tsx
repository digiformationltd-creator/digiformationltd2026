// AI Agents Management — Phase 1 UI scaffold (mock data only).

import { Bot, Bell, ScanText, Building2, Users, ShieldCheck, FileText, Sparkles } from "lucide-react";

type Agent = {
  id: string;
  name: string;
  icon: any;
  tint: string;
  status: "planned" | "in-design" | "beta";
  availability: string;
  progress: number;
  description: string;
  capability: string;
};

const AGENTS: Agent[] = [
  { id: "reminder",  name: "Reminder Agent",        icon: Bell,        tint: "amber",  status: "in-design", availability: "Q1 next phase", progress: 35, description: "Detects stalled orders, missing compliance data and renewal windows, then opens reminders the team can action in one click.", capability: "Native SQL + pg_cron · no AI calls" },
  { id: "ocr",       name: "OCR Agent",             icon: ScanText,    tint: "cyan",   status: "planned",   availability: "After Reminder", progress: 10, description: "Extracts structured data from uploaded ID, address proofs and invoices via an external Tesseract worker.", capability: "External worker · zero AI credits" },
  { id: "company",   name: "Company Detail Agent",  icon: Building2,   tint: "blue",   status: "planned",   availability: "After OCR",       progress: 5,  description: "Keeps managed company records (officers, address, SIC, filings) accurate by reconciling Companies House data on a schedule.", capability: "Deterministic · scheduled job" },
  { id: "customer",  name: "Customer Update Agent", icon: Users,       tint: "purple", status: "planned",   availability: "Phase 2",         progress: 0,  description: "Drafts status update emails when an order milestone changes and surfaces them for one-tap approval.", capability: "AI reasoning · approval-gated" },
  { id: "compliance",name: "Compliance Agent",      icon: ShieldCheck, tint: "green",  status: "planned",   availability: "Phase 2",         progress: 0,  description: "Monitors CS / AA / Address renewal deadlines across the client base and orchestrates the reminder cascade.", capability: "Rules engine · no AI" },
  { id: "document",  name: "Document Agent",        icon: FileText,    tint: "pink",   status: "planned",   availability: "Phase 3",         progress: 0,  description: "Files received documents into the correct order, validates completeness and requests anything missing.", capability: "Rules + AI fallback" },
];

const TINT: Record<string, string> = {
  amber:  "bg-amber-500/10 text-amber-300",
  cyan:   "bg-cyan-500/10 text-cyan-300",
  blue:   "bg-blue-500/10 text-blue-300",
  purple: "bg-purple-500/10 text-purple-300",
  green:  "bg-green-500/10 text-green-300",
  pink:   "bg-pink-500/10 text-pink-300",
};

const STATUS_TINT: Record<Agent["status"], string> = {
  planned:    "bg-white/5 text-white/40",
  "in-design":"bg-amber-500/10 text-amber-300",
  beta:       "bg-green-500/10 text-green-300",
};

export default function OsAutomationAgents() {
  return (
    <div className="space-y-6 os-fade-in">
      <div className="os-glass p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl grid place-items-center bg-purple-500/10 text-purple-300">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              AI Agents <Sparkles className="w-4 h-4 text-purple-300" />
            </h2>
            <p className="text-sm text-white/50 mt-1 max-w-2xl">
              Specialist agents that take repetitive operational work off the team. Each agent is scoped to one job, runs deterministically where possible and only escalates to AI reasoning when truly required.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AGENTS.map((a) => {
          const Icon = a.icon;
          return (
            <div key={a.id} className="os-glass p-5 h-full">
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl grid place-items-center ${TINT[a.tint]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md ${STATUS_TINT[a.status]}`}>
                  {a.status.replace("-", " ")}
                </span>
              </div>

              <div className="mt-3 font-semibold">{a.name}</div>
              <div className="text-xs text-white/50 mt-1 min-h-[3.25rem]">{a.description}</div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] text-white/40 mb-1">
                  <span>Build progress</span><span>{a.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full ${TINT[a.tint].split(" ")[0].replace("/10", "/40")}`}
                    style={{ width: `${a.progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <div className="text-white/40">Availability</div>
                  <div className="text-white/80 mt-0.5">{a.availability}</div>
                </div>
                <div>
                  <div className="text-white/40">Capability</div>
                  <div className="text-white/80 mt-0.5">{a.capability}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
