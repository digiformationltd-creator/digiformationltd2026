// AI Command Center — the heart of Business OS.
// Professional ChatGPT/Claude/Gemini-style operating surface.
// UI only — no backend, no AI calls, no persistence.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCommandMachine, STATE_LABELS, STATE_TINT, type CommandAction } from "@/businessos/lib/useCommandMachine";
import { PreviewDiff } from "@/businessos/components/PreviewDiff";
import { CommandPalette, useCommandPaletteHotkey } from "@/businessos/components/CommandPalette";
import { CommandLibraryPanel } from "@/businessos/components/CommandLibraryPanel";
import { BusinessPreviewCard, type AgentPlan } from "@/businessos/components/BusinessPreviewCard";
import { pushRecent } from "@/businessos/lib/commandLibrary";
import {
  getActiveCompany, setActiveCompany,
  getActiveCustomer, setActiveCustomer,
  clearBusinessMemory,
  type ActiveCompany, type ActiveCustomer,
} from "@/businessos/lib/businessMemory";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, Send, Paperclip, Bot, User, Eraser, RotateCcw,
  CheckCircle2, XCircle, ClipboardPaste, ChevronDown, Plus, Search,
  Pin, MessageSquarePlus, Copy, Pencil, Play, Save, Building2, FileSearch,
  Bell, Mail, UserCog, Globe, MessageSquare, ListChecks, Briefcase, Receipt,
  Brain, History, Zap, PanelLeftClose, PanelRightClose, Undo2, ShieldAlert,
  BookOpen, Command as CommandIcon, Languages, Wand2, Code2, X,
} from "lucide-react";

type Msg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  at: string;
  kind?: "text" | "code" | "table";
  plan?: AgentPlan;
  intent?: string;
};

type Thread = { id: string; title: string; updatedAt: string; pinned?: boolean };

// Static quick prompts have been removed by design. The Command Center
// opens with a clean composer. Context-aware suggestions are surfaced
// from live pending data on Company Detail / Dashboard and deep-link
// here with `?q=...` already prefilled.



const AGENTS = ["Auto (default)", "Reminder Agent", "Email Agent", "Company Agent", "Customer Agent"];

const PINNED: Thread[] = [
  { id: "p1", title: "Daily reminder triage SOP", updatedAt: "Pinned", pinned: true },
  { id: "p2", title: "Companies House parser", updatedAt: "Pinned", pinned: true },
];

const RECENT: Thread[] = [
  { id: "r1", title: "Update Acme Ltd registered address", updatedAt: "2m ago" },
  { id: "r2", title: "Draft reply to invoice dispute", updatedAt: "1h ago" },
  { id: "r3", title: "Extract directors from CH filing", updatedAt: "Today" },
  { id: "r4", title: "Reminder: VAT return for Nova LLC", updatedAt: "Yesterday" },
  { id: "r5", title: "Summarise website — bluemoon.co.uk", updatedAt: "Tue" },
  { id: "r6", title: "Customer note from WhatsApp thread", updatedAt: "Mon" },
];

const SEED_MESSAGES: Msg[] = [
  {
    id: "seed-1",
    role: "assistant",
    text:
      "Hi 👋 — I'm your Business Agent. Tell me what to do in English, Urdu, or Roman Urdu. " +
      "Examples: *“Haventon Ltd ki details fill kar do”*, *“update Acme address to 10 Downing St”*, *“show pending compliance”*. " +
      "I'll prepare a plan and wait for your approval before changing anything.",
    at: "now",
  },
];

function MarkdownPreview({ text }: { text: string }) {
  // Lightweight UI-only renderer: **bold**, `code`, and ```fenced``` blocks.
  const blocks = useMemo(() => {
    const parts: { type: "text" | "code"; value: string; lang?: string }[] = [];
    const re = /```(\w+)?\n?([\s\S]*?)```/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) parts.push({ type: "text", value: text.slice(last, m.index) });
      parts.push({ type: "code", value: m[2], lang: m[1] });
      last = m.index + m[0].length;
    }
    if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
    return parts;
  }, [text]);

  return (
    <div className="space-y-2">
      {blocks.map((b, i) =>
        b.type === "code" ? (
          <div key={i} className="rounded-lg bg-black/40 border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 text-[10px] uppercase tracking-wider text-white/40">
              <span>{b.lang || "code"}</span>
              <button
                onClick={() => navigator.clipboard.writeText(b.value)}
                className="inline-flex items-center gap-1 hover:text-white/80"
              >
                <Copy className="w-3 h-3" /> Copy
              </button>
            </div>
            <pre className="p-3 text-xs text-white/80 overflow-x-auto font-mono">{b.value}</pre>
          </div>
        ) : (
          <div key={i} className="text-sm leading-relaxed whitespace-pre-wrap">
            {b.value.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((seg, j) => {
              if (seg.startsWith("**") && seg.endsWith("**"))
                return <strong key={j} className="text-white">{seg.slice(2, -2)}</strong>;
              if (seg.startsWith("`") && seg.endsWith("`"))
                return (
                  <code key={j} className="px-1 py-0.5 rounded bg-white/10 text-[12px] font-mono text-cyan-200">
                    {seg.slice(1, -1)}
                  </code>
                );
              return <span key={j}>{seg}</span>;
            })}
          </div>
        ),
      )}
    </div>
  );
}

export default function OsAICommandCenter() {
  const [messages, setMessages] = useState<Msg[]>(SEED_MESSAGES);
  const [input, setInput] = useState("");
  const [paste, setPaste] = useState("");
  const [agent, setAgent] = useState(AGENTS[0]);
  const [activeThread, setActiveThread] = useState<string>("r1");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [leftTab, setLeftTab] = useState<"history" | "library">("history");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const machine = useCommandMachine();
  const { state: ccState, action: pendingAction, isBusy: busy, canApprove, canCancel } = machine;
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Phase 6 — Business Agent additions
  const [devMode, setDevMode] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [lastPlan, setLastPlan] = useState<{ intent: string; plan: AgentPlan; message: string } | null>(null);
  const [activeCompany, setActiveCompanyState] = useState<ActiveCompany>(() => getActiveCompany());
  const [activeCustomer, setActiveCustomerState] = useState<ActiveCustomer>(() => getActiveCustomer());
  const updateActiveCompany = (c: ActiveCompany) => { setActiveCompany(c); setActiveCompanyState(c); };
  const updateActiveCustomer = (c: ActiveCustomer) => { setActiveCustomer(c); setActiveCustomerState(c); };

  useCommandPaletteHotkey(useCallback(() => setPaletteOpen((v) => !v), []));

  // Allow other pages (Company Detail, Pending widget) to deep-link with a
  // prepared command via `?q=...`. The prompt is only PREFILLED; the admin
  // must still send → preview → approve. The approval flow is unchanged.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q && q.trim()) {
      setInput(q);
      setTimeout(() => taRef.current?.focus(), 50);
    }
  }, []);

  const insertPrompt = useCallback((prompt: string) => {
    setInput(prompt);
    // give the textarea a moment to receive the value, then focus
    setTimeout(() => taRef.current?.focus(), 0);
  }, []);

  // Phase 3 — Execution Safety Layer
  const UNDO_SECONDS = 10;
  const [undoableId, setUndoableId] = useState<string | null>(null);
  const [undoableTier, setUndoableTier] = useState<"safe" | "sensitive" | "destructive" | null>(null);
  const [undoLeft, setUndoLeft] = useState(0);
  const [confirmText, setConfirmText] = useState("");
  const [rolling, setRolling] = useState(false);
  const undoTimer = useRef<number | null>(null);

  useEffect(() => {
    if (undoLeft <= 0) {
      if (undoTimer.current) window.clearInterval(undoTimer.current);
      return;
    }
    undoTimer.current = window.setInterval(() => {
      setUndoLeft((s) => {
        if (s <= 1) {
          if (undoTimer.current) window.clearInterval(undoTimer.current);
          setUndoableId(null);
          setUndoableTier(null);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (undoTimer.current) window.clearInterval(undoTimer.current); };
  }, [undoLeft > 0 ? 1 : 0]); // re-arm only when window opens

  const startUndoWindow = (id: string, tier: "safe" | "sensitive" | "destructive") => {
    if (tier === "destructive") return; // never auto-undo destructive
    setUndoableId(id);
    setUndoableTier(tier);
    setUndoLeft(UNDO_SECONDS);
  };

  const MAX_CHARS = 4000;
  const isDestructive = pendingAction?.risk_tier === "destructive";
  const confirmRequired = isDestructive
    ? (pendingAction?.intent === "create_order" ? "CONFIRM" : "CONFIRM")
    : null;
  const confirmOk = !confirmRequired || confirmText.trim() === confirmRequired;

  // Deterministic fallback parser — used only when the AI service is
  // unreachable. Maps obvious natural-language hints to typed intents
  // supported by `os-command-execute`. Defaults to create_task.
  const fallbackParse = (text: string): { intent: string; payload: Record<string, any> } => {
    const t = text.toLowerCase().trim();
    const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    const email = emailMatch?.[0];
    if (/^show .*reminder/.test(t) || t === "show reminders") return { intent: "show_reminders", payload: {} };
    if (/show .*(pending )?compliance|compliance due/.test(t)) return { intent: "show_pending_compliance", payload: {} };
    if (/show .*(scheduled )?jobs|cron status/.test(t)) return { intent: "show_jobs", payload: {} };
    if (/show .*(recent )?activity|automation runs|recent runs/.test(t)) return { intent: "show_recent_activity", payload: { limit: 25 } };
    if (/show .*history|client history|customer history/.test(t) && email) return { intent: "show_client_history", payload: { customer_email: email } };
    if (/^(find|lookup|search) .*company/.test(t)) return { intent: "lookup_company", payload: { query: text.replace(/^(find|lookup|search)\s+(a\s+)?company\s*/i, "").trim() } };
    return { intent: "create_task", payload: { title: text, priority: "normal" } };
  };

  // Phase 6 — Business Agent NLU. Calls the new `ai-command-parse` edge
  // function which uses Lovable AI Gateway (Gemini) for multilingual intent
  // parsing (English / Urdu / Roman Urdu / mixed) and produces a full
  // execution plan { goal, required, missing, steps, modules, risk }.
  const aiParse = async (text: string, paste: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("ai-command-parse", {
        body: {
          mode: "parse_intent",
          text,
          paste: paste || undefined,
          activeCompany,
          activeCustomer,
        },
      });
      if (error || !data?.ok) return null;
      return data as {
        ok: true; intent: string;
        payload: Record<string, any>;
        plan: AgentPlan; message: string;
      };
    } catch { return null; }
  };

  // Extract company fields from messy paste (Companies House, email, PDF text).
  const runExtraction = async () => {
    if (!paste.trim() || extracting) return;
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-command-parse", {
        body: { mode: "extract_company", text: paste },
      });
      if (error || !data?.ok) {
        setMessages((p) => [...p, {
          id: crypto.randomUUID(), role: "assistant", at: "just now",
          text: `❌ Extraction failed: ${error?.message ?? data?.error ?? "unknown"}`,
        }]);
        return;
      }
      const fields = data.fields ?? {};
      const filled = Object.entries(fields).filter(([, v]) => v && String(v).trim());
      const summary = filled.length
        ? "**Extracted from paste:**\n\n" + filled.map(([k, v]) => `- **${k}**: ${v}`).join("\n") +
          (Array.isArray(data.missing) && data.missing.length
            ? `\n\n_Missing:_ ${data.missing.join(", ")}`
            : "") +
          `\n\nTell me what to do with these (e.g. *“create company with these details”* or *“update ${activeCompany?.company_name ?? "this company"}”*).`
        : "I couldn't find any structured company data in the paste. Try a Companies House export or a fuller block of text.";
      setMessages((p) => [...p, {
        id: crypto.randomUUID(), role: "assistant", at: "just now", text: summary,
      }]);
    } finally { setExtracting(false); }
  };

  const send = async () => {
    const t = input.trim();
    if (!t || busy) return;
    machine.set("parsing");
    const uid = crypto.randomUUID();
    setMessages((p) => [...p, { id: uid, role: "user", text: t, at: "just now" }]);
    setInput("");
    pushRecent(t);

    // 1) Ask the AI agent to understand the instruction.
    const ai = await aiParse(t, paste);
    let intent: string;
    let payload: Record<string, any>;
    let plan: AgentPlan;
    let message: string;
    if (ai) {
      intent = ai.intent; payload = ai.payload ?? {}; plan = ai.plan; message = ai.message;
    } else {
      // AI unreachable — degrade to deterministic regex so the surface still works.
      const f = fallbackParse(t);
      intent = f.intent; payload = f.payload;
      plan = {
        goal: t, required: [], missing: [], steps: [`Run ${intent}`],
        modules: ["Business OS"], risk: "safe",
      };
      message = "AI parser unavailable — using deterministic fallback.";
    }
    setLastPlan({ intent, plan, message });

    // 2) Clarification — no preview, no execution.
    if (intent === "clarify") {
      setMessages((p) => [...p, {
        id: uid + "-a", role: "assistant", at: "just now",
        text: message || "Could you clarify what you'd like me to do?",
        intent, plan,
      }]);
      machine.reset();
      taRef.current?.focus();
      return;
    }

    // 3) Missing required info — show the plan, don't call backend preview.
    if (plan.missing.length > 0) {
      setMessages((p) => [...p, {
        id: uid + "-a", role: "assistant", at: "just now",
        text: message || "I need a bit more information before I can prepare this.",
        intent, plan,
      }]);
      machine.reset();
      taRef.current?.focus();
      return;
    }

    // 4) Hand off to the existing execution dispatcher for a real preview.
    const { data, error } = await supabase.functions.invoke("os-command-execute", {
      body: { action: "preview", intent, payload, prompt: t },
    });
    if (error || !data?.ok) {
      setMessages((p) => [...p, {
        id: uid + "-err", role: "assistant", at: "just now",
        text: `❌ Preview failed: ${error?.message ?? data?.error ?? "unknown error"}`,
        intent, plan,
      }]);
      machine.set("error", null);
      setTimeout(() => machine.reset(), 1200);
    } else {
      machine.hydrate(data.action as CommandAction);
      const baseText = message || `Ready to ${plan.goal || intent}.`;
      const devBlock = devMode
        ? `\n\n\`\`\`json\n${JSON.stringify(data.action.preview, null, 2)}\n\`\`\``
        : "";
      setMessages((p) => [...p, {
        id: uid + "-a", role: "assistant", at: "just now",
        text: baseText + devBlock,
        intent, plan,
      }]);
    }
    taRef.current?.focus();
  };

  const executePending = async () => {
    if (!pendingAction || !canApprove) return;
    if (isDestructive && !confirmOk) return; // gated by typed confirmation
    const tier = (pendingAction.risk_tier ?? "safe") as "safe" | "sensitive" | "destructive";
    const actionId = pendingAction.id;
    machine.set("executing");
    const { data, error } = await supabase.functions.invoke("os-command-execute", {
      body: { action: "execute", id: actionId },
    });
    const ok = !error && data?.ok;
    // Update business memory after successful company-scoped action.
    const pl = (pendingAction?.payload ?? {}) as Record<string, any>;
    const res = (data?.result ?? {}) as Record<string, any>;
    if (ok && pl.company_id) {
      const cname = (res.company_name ?? activeCompany?.company_name ?? "Company") as string;
      updateActiveCompany({ id: String(pl.company_id), company_name: cname });
    }
    if (ok && pendingAction?.intent === "lookup_company" && Array.isArray(res.results) && res.results.length === 1) {
      const r = res.results[0];
      updateActiveCompany({ id: r.id, company_name: r.company_name, company_number: r.company_number });
    }
    if (ok && (pl.customer_email || pl.recipient_email)) {
      updateActiveCustomer({ email: String(pl.customer_email ?? pl.recipient_email) });
    }
    setMessages((p) => [...p, {
      id: crypto.randomUUID(), role: "assistant", at: "just now",
      text: ok
        ? `✅ Done.${devMode ? `\n\n\`\`\`json\n${JSON.stringify(data.result, null, 2)}\n\`\`\`` : ""}`
        : `❌ Execution failed: ${error?.message ?? data?.error ?? "unknown"}`,
    }]);
    machine.set(ok ? "success" : "error", null);
    setConfirmText("");
    if (ok && tier !== "destructive") startUndoWindow(actionId, tier);
    setTimeout(() => machine.reset(), 1500);
  };

  const undoLast = async () => {
    if (!undoableId || rolling || undoLeft <= 0) return;
    setRolling(true);
    const { data, error } = await supabase.functions.invoke("os-command-execute", {
      body: { action: "rollback", id: undoableId },
    });
    setRolling(false);
    const ok = !error && data?.ok;
    setMessages((p) => [...p, {
      id: crypto.randomUUID(), role: "assistant", at: "just now",
      text: ok
        ? "↩️ **Changes successfully restored.**"
        : `❌ Rollback failed: ${error?.message ?? data?.error ?? "unknown"}`,
    }]);
    if (ok) machine.set("rolled_back", null);
    setUndoableId(null);
    setUndoableTier(null);
    setUndoLeft(0);
    setTimeout(() => machine.reset(), 1500);
  };

  const rejectPending = async () => {
    if (!pendingAction || !canCancel) return;
    await supabase.functions.invoke("os-command-execute", {
      body: { action: "reject", id: pendingAction.id },
    });
    setMessages((p) => [...p, {
      id: crypto.randomUUID(), role: "assistant", at: "just now",
      text: "Action cancelled.",
    }]);
    machine.set("rejected", null);
    setTimeout(() => machine.reset(), 800);
  };

  const clearChat = () => {
    setMessages([{ id: "seed", role: "assistant", text: "Workspace cleared. Ready for a new instruction.", at: "now" }]);
    machine.reset();
  };



  const newChat = () => {
    clearChat();
    setActiveThread("new");
  };

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const filteredRecent = RECENT.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="os-fade-in h-[calc(100dvh-10rem)] md:h-[calc(100vh-9rem)] min-h-[560px] flex flex-col gap-3 overflow-hidden">
      {/* Compact header */}
      <div className="os-glass os-glow-purple px-4 py-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={() => setLeftOpen((v) => !v)}
            className="lg:hidden inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 shrink-0"
            aria-label="Toggle history"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
          <div className="w-9 h-9 rounded-xl grid place-items-center bg-purple-500/10 text-purple-300 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0 hidden sm:block">
            <h2 className="text-sm font-bold leading-tight truncate">AI Command Center</h2>
            <p className="text-[11px] text-white/40 truncate">Conversational control surface for Business OS</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-[148px]">
            <select
              value={agent}
              onChange={(e) => setAgent(e.target.value)}
              className="appearance-none w-full bg-white/5 border border-white/10 rounded-lg pl-3 pr-8 py-1.5 text-xs text-white/80 focus:outline-none focus:border-purple-400/40 truncate"
            >
              {AGENTS.map((a) => (
                <option key={a} value={a} className="bg-[#0b0d10]">{a}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-white/40 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <button
            onClick={() => setRightOpen((v) => !v)}
            className="lg:hidden inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/70"
            aria-label="Toggle context"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
          <span className={`hidden md:inline text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md border whitespace-nowrap ${
            pendingAction ? "bg-amber-500/15 text-amber-200 border-amber-500/20"
                          : "bg-purple-500/10 text-purple-300 border-purple-500/20"}`}>
            {pendingAction ? "Awaiting approval" : "Ready"}
          </span>
        </div>
      </div>


      {/* Three-pane workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_300px] gap-3 min-h-0 overflow-hidden">
        {/* LEFT: History */}
        <aside
          className={`os-glass p-3 flex-col min-h-0 min-w-0 ${leftOpen ? "flex" : "hidden"} lg:flex`}
        >
          <button
            onClick={newChat}
            className="inline-flex items-center justify-center gap-2 w-full rounded-lg bg-purple-500/20 text-purple-100 hover:bg-purple-500/30 px-3 py-2 text-xs font-medium transition"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            New Chat
          </button>

          {/* Tabs: History / Library */}
          <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-white/5 p-1">
            <button
              onClick={() => setLeftTab("history")}
              className={`inline-flex items-center justify-center gap-1.5 rounded-md py-1 text-[11px] transition ${
                leftTab === "history" ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80"
              }`}
            >
              <History className="w-3 h-3" /> History
            </button>
            <button
              onClick={() => setLeftTab("library")}
              className={`inline-flex items-center justify-center gap-1.5 rounded-md py-1 text-[11px] transition ${
                leftTab === "library" ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80"
              }`}
            >
              <BookOpen className="w-3 h-3" /> Library
            </button>
          </div>

          {leftTab === "history" ? (
            <>
              <div className="relative mt-3">
                <Search className="w-3.5 h-3.5 text-white/30 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations…"
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400/40"
                />
              </div>

              <div className="flex-1 overflow-y-auto mt-3 -mr-1 pr-1 space-y-4 min-h-0">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/40 mb-1.5 px-1">
                    <Pin className="w-3 h-3" /> Pinned
                  </div>
                  <div className="space-y-0.5">
                    {PINNED.map((t) => (
                      <ThreadRow key={t.id} thread={t} active={activeThread === t.id} onClick={() => setActiveThread(t.id)} />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/40 mb-1.5 px-1">
                    <History className="w-3 h-3" /> Recent
                  </div>
                  <div className="space-y-0.5">
                    {filteredRecent.map((t) => (
                      <ThreadRow key={t.id} thread={t} active={activeThread === t.id} onClick={() => setActiveThread(t.id)} />
                    ))}
                    {filteredRecent.length === 0 && (
                      <div className="text-[11px] text-white/30 px-2 py-1">No matches</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-3 flex-1 min-h-0 flex flex-col">
              <button
                onClick={() => setPaletteOpen(true)}
                className="w-full inline-flex items-center justify-between gap-2 rounded-lg border border-purple-400/30 bg-purple-500/10 hover:bg-purple-500/20 px-2.5 py-1.5 text-[11px] text-purple-100 mb-2"
              >
                <span className="inline-flex items-center gap-1.5">
                  <CommandIcon className="w-3.5 h-3.5" /> Search all commands
                </span>
                <kbd className="font-mono text-[10px] bg-black/30 border border-white/10 rounded px-1.5 py-0.5">⌘K</kbd>
              </button>
              <CommandLibraryPanel onPick={insertPrompt} />
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-white/5 text-[10px] text-white/30 px-1">
            Local-only · UI preview
          </div>
        </aside>

        {/* CENTER: Conversation */}
        <section className="os-glass p-0 flex flex-col min-h-0 min-w-0">
          {/* Quick prompts removed — the Command Center now opens with a clean
              chat surface. Contextual suggestions (e.g. "Fill Address",
              "Find Website") are surfaced from live pending data on the
              Company Detail page and Dashboard's Pending Company Tasks
              widget, which deep-link here with the prompt pre-filled.
              The Command Library is still reachable via the ⌘K hotkey. */}



          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.map((m) => (
              <div key={m.id} className={`group flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 shrink-0 rounded-lg grid place-items-center bg-purple-500/10 text-purple-300">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className={`max-w-[80%] ${m.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-white/10 text-white rounded-br-sm"
                        : "bg-white/[0.03] border border-white/5 text-white/85 rounded-bl-sm"
                    }`}
                  >
                    {editingId === m.id ? (
                      <div className="space-y-2 min-w-[260px]">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          rows={3}
                          className="w-full resize-none bg-black/30 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:border-purple-400/40"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-[11px] text-white/50 hover:text-white/80"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              setMessages((prev) =>
                                prev.map((x) => (x.id === m.id ? { ...x, text: editingText } : x)),
                              );
                              setEditingId(null);
                            }}
                            className="text-[11px] px-2 py-1 rounded bg-purple-500/30 text-purple-100 hover:bg-purple-500/40"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <MarkdownPreview text={m.text} />
                        {m.role === "assistant" && m.plan && m.intent && (
                          <BusinessPreviewCard intent={m.intent} plan={m.plan} />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition">
                    <span className="text-[10px] text-white/30">{m.at}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(m.text)}
                      className="inline-flex items-center gap-1 text-[10px] text-white/40 hover:text-white/80"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                    {m.role === "assistant" && (
                      <button
                        onClick={send}
                        className="inline-flex items-center gap-1 text-[10px] text-white/40 hover:text-white/80"
                      >
                        <RotateCcw className="w-3 h-3" /> Regenerate
                      </button>
                    )}
                    {m.role === "user" && (
                      <button
                        onClick={() => {
                          setEditingId(m.id);
                          setEditingText(m.text);
                        }}
                        className="inline-flex items-center gap-1 text-[10px] text-white/40 hover:text-white/80"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                    )}
                  </div>
                </div>
                {m.role === "user" && (
                  <div className="w-7 h-7 shrink-0 rounded-lg grid place-items-center bg-white/5 text-white/70">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Composer */}
          <div className="border-t border-white/5 p-3 space-y-2 shrink-0">
            {/* Paste area collapsed inline */}
            <details className="group rounded-xl bg-white/[0.02] border border-white/5">
              <summary className="cursor-pointer list-none flex items-center justify-between px-3 py-2 text-[11px] uppercase tracking-wider text-white/40">
                <span className="inline-flex items-center gap-2 min-w-0">
                  <ClipboardPaste className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                  <span className="truncate">Paste area</span>
                  <span className="text-white/30 normal-case tracking-normal truncate">
                    {paste ? `· ${paste.length.toLocaleString()} chars` : ""}
                  </span>
                </span>
                <ChevronDown className="w-3.5 h-3.5 transition group-open:rotate-180 shrink-0" />
              </summary>
              <div className="px-3 pb-3">
                <textarea
                  value={paste}
                  onChange={(e) => setPaste(e.target.value)}
                  placeholder="Paste a website, an email thread, Companies House data, a document…"
                  rows={4}
                  className="w-full resize-none bg-black/30 border border-white/10 focus:border-cyan-400/40 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none"
                />
                <div className="flex items-center justify-between mt-1.5 gap-2 flex-wrap">
                  <span className="text-[10px] text-white/40">{paste.length.toLocaleString()} characters</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={runExtraction}
                      disabled={!paste.trim() || extracting}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25 disabled:opacity-30"
                    >
                      <Wand2 className="w-3 h-3" />
                      {extracting ? "Extracting…" : "Extract company info"}
                    </button>
                    <button
                      onClick={() => setPaste("")}
                      disabled={!paste}
                      className="text-[11px] text-white/50 hover:text-white/80 disabled:opacity-30"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </details>

            <div className="flex flex-col rounded-2xl bg-white/5 border border-white/10 focus-within:border-purple-400/40 transition overflow-hidden">
              <textarea
                ref={taRef}
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask anything, or describe an update…   (Shift+Enter for new line)"
                rows={3}
                className="w-full resize-none bg-transparent px-4 pt-3 pb-2 text-sm text-white placeholder:text-white/30 focus:outline-none border-0"
              />
              <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-white/5">
                <div className="flex items-center gap-2 text-[11px] text-white/40 min-w-0">
                  <button className="inline-flex items-center gap-1 hover:text-white/80 shrink-0">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Attach</span>
                  </button>
                  <span className="text-white/20 hidden sm:inline">·</span>
                  <span className="truncate tabular-nums">{input.length}/{MAX_CHARS}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={clearChat}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-white/50 hover:text-white/80 hover:bg-white/5"
                  >
                    <Eraser className="w-3 h-3" /> <span className="hidden sm:inline">Clear</span>
                  </button>
                  <button
                    onClick={send}
                    disabled={!input.trim() || busy}
                    className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg bg-purple-500/30 text-purple-100 hover:bg-purple-500/40 disabled:opacity-40 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Run</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* RIGHT: Context */}
        <aside className={`os-glass p-3 flex-col min-h-0 min-w-0 ${rightOpen ? "flex" : "hidden"} lg:flex`}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-wider text-white/40">Context</div>
            <button className="text-[10px] text-white/40 hover:text-white/80 inline-flex items-center gap-1">
              <Plus className="w-3 h-3" /> Attach
            </button>
          </div>

          <div className="flex-1 overflow-y-auto -mr-1 pr-1 space-y-2 min-h-0">
            <ContextCard
              icon={User}
              label="Current Customer"
              title="Sarah Johnson"
              subtitle="sarah@acme.co.uk · UK"
              tint="bg-cyan-500/10 text-cyan-300"
            />
            <ContextCard
              icon={Building2}
              label="Current Company"
              title="Acme Holdings Ltd"
              subtitle="#14829203 · Active"
              tint="bg-blue-500/10 text-blue-300"
            />
            <ContextCard
              icon={Briefcase}
              label="Selected Order"
              title="ORD-2026-0481"
              subtitle="UK LTD Formation · £170"
              tint="bg-purple-500/10 text-purple-300"
            />
            <ContextCard
              icon={Bell}
              label="Current Reminder"
              title="Confirmation Statement due"
              subtitle="In 12 days · Acme Holdings Ltd"
              tint="bg-amber-500/10 text-amber-300"
            />
            <ContextCard
              icon={Receipt}
              label="Recent Invoice"
              title="INV-2026-0931"
              subtitle="£204 · Paid"
              tint="bg-emerald-500/10 text-emerald-300"
            />

            <div className="pt-2">
              <div className="text-[10px] uppercase tracking-wider text-white/30 mb-1.5 px-1">Future</div>
              <FuturePill icon={Brain} label="Memory" desc="Persistent agent recall" />
              <FuturePill icon={Sparkles} label="Context" desc="Auto-injected entities" />
              <FuturePill icon={Play} label="Actions" desc="One-click executions" />
            </div>
          </div>

          {/* Preview Diff (Phase 2) — renders only while awaiting_approval + snapshot exists */}
          {ccState === "awaiting_approval" && pendingAction?.before_snapshot && (
            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                  <h3 className="text-[11px] uppercase tracking-wider text-white/40">Change Diff</h3>
                </div>
              </div>
              <PreviewDiff action={pendingAction} />
            </div>
          )}

          {/* Preview */}
          <div className="mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                <h3 className="text-[11px] uppercase tracking-wider text-white/40">Preview</h3>
              </div>
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-white/40">Live</span>
            </div>
            <div className="rounded-lg bg-black/30 border border-white/5 p-2.5 max-h-[160px] overflow-y-auto text-[11px] text-white/70 leading-relaxed">
              {lastAssistant ? (
                <MarkdownPreview text={lastAssistant.text} />
              ) : (
                "Run a prompt to see the preview here."
              )}
            </div>
          </div>

        </aside>
      </div>

      {/* Destructive typed-confirmation strip (Phase 3) */}
      {isDestructive && canApprove && (
        <div className="os-glass px-3 py-2 flex flex-wrap items-center gap-2 sm:gap-3 shrink-0 border border-red-500/30">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldAlert className="w-4 h-4 text-red-300 shrink-0" />
            <div className="text-[11px] text-red-200">
              Destructive action — type <code className="px-1 rounded bg-black/40 text-red-100">{confirmRequired}</code> to enable execute
            </div>
          </div>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={confirmRequired ?? ""}
            className="flex-1 min-w-[140px] bg-black/30 border border-red-500/30 focus:border-red-400/60 rounded-md px-2 py-1 text-xs text-white placeholder:text-white/30 focus:outline-none"
          />
        </div>
      )}

      {/* Undo banner (Phase 3) */}
      {undoableId && undoLeft > 0 && (
        <div className="os-glass px-3 py-2 flex items-center justify-between gap-3 shrink-0 border border-emerald-500/20">
          <div className="flex items-center gap-2 text-[11px] text-emerald-200 min-w-0">
            <Undo2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Action executed. Undo available — {undoLeft}s</span>
          </div>
          <button
            onClick={undoLast}
            disabled={rolling}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30 text-[11px] font-medium disabled:opacity-40"
          >
            <Undo2 className="w-3 h-3" /> Undo
          </button>
        </div>
      )}

      {/* Bottom action bar */}
      <div className="os-glass px-3 py-2 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 text-[11px] text-white/40 min-w-0 shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${STATE_TINT[ccState]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${busy ? "bg-current animate-pulse" : "bg-current"}`} />
            {STATE_LABELS[ccState]}
          </span>
          {pendingAction?.risk_tier && pendingAction.risk_tier !== "safe" && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${pendingAction.risk_tier === "destructive" ? "bg-red-500/15 text-red-300" : "bg-amber-500/15 text-amber-300"}`}>
              {pendingAction.risk_tier}
            </span>
          )}
          <span className="text-white/20 hidden md:inline">·</span>
          <span className="hidden md:inline truncate">Agent: <span className="text-white/70">{agent}</span></span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end min-w-0">
          <ActionBtn icon={Play}         label="Execute" disabled={!canApprove || (isDestructive && !confirmOk)} onClick={executePending} tint="bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30" />
          <ActionBtn icon={XCircle}      label="Cancel"  disabled={!canCancel} onClick={rejectPending} tint="bg-red-500/10 text-red-300 hover:bg-red-500/20" />
          <ActionBtn icon={Undo2}        label={undoableId && undoLeft > 0 ? `Undo (${undoLeft}s)` : "Undo"} disabled={!undoableId || undoLeft <= 0 || rolling} onClick={undoLast} tint="bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25" />
          <ActionBtn icon={Eraser}       label="Clear"    tint="bg-white/5 text-white/70 hover:bg-white/10" onClick={clearChat} />
        </div>
      </div>

      {/* ⌘K Command Palette (Phase 5) */}
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onPick={insertPrompt} />

    </div>
  );
}

/* ---------- Sub-components ---------- */

function ThreadRow({ thread, active, onClick }: { thread: Thread; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-2 py-1.5 rounded-lg flex items-start gap-2 transition ${
        active ? "bg-purple-500/15 border border-purple-400/20" : "hover:bg-white/5 border border-transparent"
      }`}
    >
      {thread.pinned ? (
        <Pin className="w-3 h-3 text-amber-300 mt-0.5 shrink-0" />
      ) : (
        <MessageSquare className="w-3 h-3 text-white/40 mt-0.5 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <div className="text-xs text-white/85 truncate">{thread.title}</div>
        <div className="text-[10px] text-white/30">{thread.updatedAt}</div>
      </div>
    </button>
  );
}

function ContextCard({
  icon: Icon, label, title, subtitle, tint,
}: { icon: any; label: string; title: string; subtitle: string; tint: string }) {
  return (
    <div className="rounded-lg bg-white/[0.02] border border-white/5 p-2.5 hover:border-white/15 transition cursor-pointer">
      <div className="flex items-center gap-2 mb-1">
        <span className={`w-5 h-5 rounded grid place-items-center ${tint}`}>
          <Icon className="w-3 h-3" />
        </span>
        <span className="text-[10px] uppercase tracking-wider text-white/40">{label}</span>
      </div>
      <div className="text-xs font-medium text-white/90 truncate">{title}</div>
      <div className="text-[10px] text-white/40 truncate">{subtitle}</div>
    </div>
  );
}

function FuturePill({ icon: Icon, label, desc }: { icon: any; label: string; desc: string }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-dashed border-white/10 bg-white/[0.01] mb-1">
      <Icon className="w-3.5 h-3.5 text-white/40" />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-white/70">{label}</div>
        <div className="text-[10px] text-white/30 truncate">{desc}</div>
      </div>
      <span className="text-[9px] uppercase tracking-wider text-white/30">Soon</span>
    </div>
  );
}

function ActionBtn({
  icon: Icon, label, tint, onClick, disabled,
}: { icon: any; label: string; tint: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0 ${tint}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}
