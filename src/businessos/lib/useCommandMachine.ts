/**
 * Phase 1 — Interaction State Machine (frontend hook)
 *
 * Single source of truth for AI Command Center execution UI.
 * State lives in `command_actions.state` (backend). This hook mirrors it
 * locally and exposes derived flags so UI components stay declarative.
 *
 * Canonical states:
 *   idle → parsing → preview → awaiting_approval → executing
 *        → success | error | rejected | rolled_back
 */
import { useCallback, useState } from "react";

export type CommandState =
  | "idle"
  | "parsing"
  | "preview"
  | "awaiting_approval"
  | "executing"
  | "success"
  | "error"
  | "rejected"
  | "rolled_back";

export type RiskTier = "safe" | "sensitive" | "destructive";

export interface CommandAction {
  id: string;
  intent: string;
  state: CommandState;
  risk_tier: RiskTier;
  preview?: unknown;
  payload?: unknown;
  result?: unknown;
  error?: string | null;
  before_snapshot?: unknown;
  after_snapshot?: unknown;
  rolled_back_at?: string | null;
  [k: string]: unknown;
}

export const VALID_TRANSITIONS: Record<CommandState, CommandState[]> = {
  idle: ["parsing"],
  parsing: ["preview", "awaiting_approval", "error"],
  preview: ["awaiting_approval", "error"],
  awaiting_approval: ["executing", "rejected"],
  executing: ["success", "error", "rolled_back"],
  success: ["executing", "rolled_back"],
  error: ["idle"],
  rejected: ["idle"],
  rolled_back: ["idle"],
};

export function canTransition(from: CommandState, to: CommandState) {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export const STATE_LABELS: Record<CommandState, string> = {
  idle: "Idle",
  parsing: "Parsing…",
  preview: "Preview ready",
  awaiting_approval: "Awaiting approval",
  executing: "Executing…",
  success: "Success",
  error: "Error",
  rejected: "Cancelled",
  rolled_back: "Rolled back",
};

export const STATE_TINT: Record<CommandState, string> = {
  idle: "bg-white/10 text-white/60",
  parsing: "bg-sky-500/15 text-sky-300",
  preview: "bg-indigo-500/15 text-indigo-300",
  awaiting_approval: "bg-amber-500/15 text-amber-300",
  executing: "bg-purple-500/20 text-purple-200",
  success: "bg-emerald-500/15 text-emerald-300",
  error: "bg-red-500/15 text-red-300",
  rejected: "bg-white/10 text-white/50",
  rolled_back: "bg-orange-500/15 text-orange-300",
};

export function useCommandMachine() {
  const [action, setAction] = useState<CommandAction | null>(null);
  const [state, setState] = useState<CommandState>("idle");

  const set = useCallback((next: CommandState, nextAction?: CommandAction | null) => {
    setState((prev) => {
      // Local optimistic transition guard — backend is the hard guard.
      if (next !== prev && !canTransition(prev, next)) {
        // Allow forced reset to idle (e.g. clearChat) without throwing.
        if (next === "idle") return next;
        console.warn(`[useCommandMachine] invalid transition ${prev} → ${next}`);
        return prev;
      }
      return next;
    });
    if (nextAction !== undefined) setAction(nextAction);
  }, []);

  const hydrate = useCallback((a: CommandAction | null) => {
    setAction(a);
    setState(a?.state ?? "idle");
  }, []);

  const reset = useCallback(() => {
    setAction(null);
    setState("idle");
  }, []);

  const isBusy = state === "parsing" || state === "executing";
  const canApprove = state === "awaiting_approval" || state === "preview";
  const canCancel = state === "awaiting_approval" || state === "preview";

  return { state, action, set, hydrate, reset, isBusy, canApprove, canCancel };
}
