// BusinessPreviewCard
// Clean business-grade preview replacing raw JSON in the AI Command Center.
// Pure presentational — execution is wired by the parent.

import {
  Target, ListChecks, AlertTriangle, Boxes, ShieldAlert, ShieldCheck, Shield,
} from "lucide-react";

export type AgentPlan = {
  goal: string;
  required: string[];
  missing: string[];
  steps: string[];
  modules: string[];
  risk: "safe" | "sensitive" | "destructive";
};

const RISK_TINT: Record<AgentPlan["risk"], { wrap: string; pill: string; icon: any; label: string }> = {
  safe:        { wrap: "border-emerald-500/20", pill: "bg-emerald-500/15 text-emerald-200", icon: ShieldCheck, label: "Safe" },
  sensitive:   { wrap: "border-amber-500/30",   pill: "bg-amber-500/15 text-amber-200",     icon: Shield,      label: "Sensitive — review" },
  destructive: { wrap: "border-red-500/30",     pill: "bg-red-500/15 text-red-200",         icon: ShieldAlert, label: "Destructive — confirm" },
};

export function BusinessPreviewCard({
  intent,
  plan,
  message,
}: {
  intent: string;
  plan: AgentPlan;
  message?: string;
}) {
  const tint = RISK_TINT[plan.risk] ?? RISK_TINT.safe;
  const RiskIcon = tint.icon;
  const blocked = plan.missing.length > 0;

  return (
    <div className={`rounded-xl bg-white/[0.03] border ${tint.wrap} p-3 space-y-3`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-wider text-white/40">Action plan</div>
          <div className="text-sm font-semibold text-white/95 truncate" title={plan.goal}>
            {plan.goal || intent}
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium whitespace-nowrap ${tint.pill}`}>
          <RiskIcon className="w-3 h-3" /> {tint.label}
        </span>
      </div>

      {message && (
        <div className="text-[12px] text-white/75 leading-relaxed">{message}</div>
      )}

      {/* Missing info — blocks execution */}
      {blocked && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5">
          <div className="flex items-center gap-1.5 text-[11px] text-amber-200 mb-1">
            <AlertTriangle className="w-3.5 h-3.5" /> I need additional information
          </div>
          <ul className="text-[11px] text-amber-100/90 pl-4 list-disc space-y-0.5">
            {plan.missing.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
      )}

      {/* Steps */}
      {plan.steps.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/40 mb-1">
            <ListChecks className="w-3 h-3" /> What will happen
          </div>
          <ol className="text-[12px] text-white/80 pl-4 list-decimal space-y-0.5">
            {plan.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </div>
      )}

      {/* Modules */}
      {plan.modules.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/40 mb-1">
            <Boxes className="w-3 h-3" /> Affected modules
          </div>
          <div className="flex flex-wrap gap-1">
            {plan.modules.map((m) => (
              <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/70 border border-white/5">
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[10px] text-white/35 pt-1">
        <Target className="w-3 h-3" />
        <span>Intent: <code className="text-white/60">{intent}</code></span>
      </div>
    </div>
  );
}
