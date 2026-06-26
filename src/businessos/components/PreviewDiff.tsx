/**
 * Phase 2 — Preview Diff Engine
 *
 * Renders a field-level before/after diff for AI Command Center actions
 * that target an existing DB row. Only rendered when:
 *   state === "awaiting_approval" AND before_snapshot exists.
 *
 * Risk-tier drives the header color (safe/sensitive/destructive).
 */
import type { CommandAction, RiskTier } from "@/businessos/lib/useCommandMachine";

type DiffKind = "added" | "modified" | "removed" | "unchanged";

const TIER_HEADER: Record<RiskTier, string> = {
  safe: "bg-emerald-500/10 border-emerald-400/30 text-emerald-200",
  sensitive: "bg-amber-500/10 border-amber-400/30 text-amber-200",
  destructive: "bg-red-500/10 border-red-400/40 text-red-200",
};

const KIND_TINT: Record<DiffKind, string> = {
  added: "text-emerald-300",
  modified: "text-amber-300",
  removed: "text-red-300",
  unchanged: "text-white/40",
};

const KIND_GLYPH: Record<DiffKind, string> = {
  added: "●",
  modified: "●",
  removed: "●",
  unchanged: "○",
};

function fmt(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "string") return v.length > 80 ? v.slice(0, 80) + "…" : v;
  if (typeof v === "object") return JSON.stringify(v).slice(0, 80);
  return String(v);
}

function classify(before: unknown, after: unknown): DiffKind {
  const b = before == null || before === "";
  const a = after == null || after === "";
  if (b && !a) return "added";
  if (!b && a) return "removed";
  if (JSON.stringify(before) !== JSON.stringify(after)) return "modified";
  return "unchanged";
}

interface Props {
  action: CommandAction | null;
}

export function PreviewDiff({ action }: Props) {
  if (!action) return null;
  const before = (action.before_snapshot ?? null) as Record<string, unknown> | null;
  const preview = (action.preview ?? {}) as Record<string, unknown>;
  const changedFields = (preview?.changed_fields as string[] | undefined) ?? [];
  const payload = (action.payload ?? {}) as Record<string, unknown>;

  // Only render diff when we have a snapshot AND changed_fields metadata.
  if (!before || changedFields.length === 0) return null;

  // Derive "after" candidate values per field from the payload.
  const proposed: Record<string, unknown> = {};
  for (const f of changedFields) {
    if (f === "registered_address") proposed[f] = payload.registered_address;
    else if (f === "assigned_to") proposed[f] = payload.assigned_to;
    else if (f === "notes" && action.intent === "add_note") {
      const existing = (before.notes as string | null) ?? "";
      const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
      proposed[f] = `${existing ? existing + "\n\n" : ""}[${stamp}] ${payload.note ?? ""}`.trim();
    } else if (f === "notes") proposed[f] = payload.notes;
    else if (f === "due_date") proposed[f] = payload.due_date;
    else if (f === "status") proposed[f] = payload.status;
    else if ((payload as any).field === f) proposed[f] = payload.value;
    else proposed[f] = (payload as any)[f];
  }

  const tier = (action.risk_tier ?? "safe") as RiskTier;

  return (
    <div className="os-glass overflow-hidden">
      <div className={`px-3 py-2 text-[11px] font-medium border-b ${TIER_HEADER[tier]} flex items-center justify-between`}>
        <span className="inline-flex items-center gap-2">
          <span>Change preview</span>
          <span className="px-1.5 py-0.5 rounded-full bg-black/30 text-[10px] uppercase tracking-wide">{tier}</span>
        </span>
        <span className="text-[10px] opacity-70">{changedFields.length} field{changedFields.length === 1 ? "" : "s"}</span>
      </div>
      <div className="divide-y divide-white/5">
        <div className="grid grid-cols-12 px-3 py-1.5 text-[10px] uppercase tracking-wide text-white/40">
          <div className="col-span-3">Field</div>
          <div className="col-span-4">Before</div>
          <div className="col-span-4">After</div>
          <div className="col-span-1 text-right">Δ</div>
        </div>
        {changedFields.map((field) => {
          const b = before?.[field];
          const a = proposed[field];
          const kind = classify(b, a);
          return (
            <div key={field} className="grid grid-cols-12 px-3 py-2 text-xs items-start hover:bg-white/[0.02]">
              <div className="col-span-3 font-mono text-white/70 truncate" title={field}>{field}</div>
              <div className="col-span-4 text-white/50 break-all">{fmt(b)}</div>
              <div className={`col-span-4 break-all ${kind === "unchanged" ? "text-white/40" : "text-white/90 font-medium"}`}>{fmt(a)}</div>
              <div className={`col-span-1 text-right ${KIND_TINT[kind]}`} title={kind}>{KIND_GLYPH[kind]}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
