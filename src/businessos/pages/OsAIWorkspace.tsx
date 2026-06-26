// AI Workspace — Phase 1 UI only.
// The heart of the Automation module. No backend, no AI calls.
// Future: connect to local Ollama / agent router.

import { useRef, useState } from "react";
import {
  Sparkles, Send, Paperclip, Bot, User, Eraser, RotateCcw,
  CheckCircle2, XCircle, ClipboardPaste, Upload, ChevronDown,
  Building2, FileSearch, Bell, Mail, UserCog, Globe, MessageSquare, ListChecks,
} from "lucide-react";

type Msg = { id: string; role: "user" | "assistant"; text: string; at: string };

const QUICK_PROMPTS = [
  { label: "Update Company Details",    icon: Building2,    tint: "bg-blue-500/10 text-blue-300" },
  { label: "Extract Company Info",      icon: FileSearch,   tint: "bg-cyan-500/10 text-cyan-300" },
  { label: "Create Reminder",           icon: Bell,         tint: "bg-amber-500/10 text-amber-300" },
  { label: "Generate Email",            icon: Mail,         tint: "bg-pink-500/10 text-pink-300" },
  { label: "Update Customer",           icon: UserCog,      tint: "bg-purple-500/10 text-purple-300" },
  { label: "Summarise Website",         icon: Globe,        tint: "bg-green-500/10 text-green-300" },
  { label: "Draft Reply",               icon: MessageSquare,tint: "bg-lime-500/10 text-lime-300" },
  { label: "Check Missing Information", icon: ListChecks,   tint: "bg-red-500/10 text-red-300" },
];

const AGENTS = ["Auto (default)", "Reminder Agent", "Email Agent", "Company Agent", "Customer Agent"];

export default function OsAIWorkspace() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "seed",
      role: "assistant",
      text: "Hi. Paste any text — a website, an email, Companies House data — and tell me what to do. I'll prepare a preview for you to approve before anything is saved.",
      at: "now",
    },
  ]);
  const [input, setInput] = useState("");
  const [paste, setPaste] = useState("");
  const [agent, setAgent] = useState(AGENTS[0]);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const send = () => {
    const t = input.trim();
    if (!t) return;
    const id = crypto.randomUUID();
    setMessages((p) => [
      ...p,
      { id, role: "user", text: t, at: "just now" },
      {
        id: id + "-a",
        role: "assistant",
        text:
          "Preview ready (mock). I would apply this instruction once connected to the AI backend. Use **Approve** to commit or **Cancel** to discard.",
        at: "just now",
      },
    ]);
    setInput("");
    taRef.current?.focus();
  };

  const clearChat = () =>
    setMessages([{ id: "seed", role: "assistant", text: "Workspace cleared. Ready for a new instruction.", at: "now" }]);

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <div className="space-y-6 os-fade-in">
      {/* Header */}
      <div className="os-glass os-glow-purple p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl grid place-items-center bg-purple-500/10 text-purple-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Workspace</h2>
              <p className="text-sm text-white/50 mt-1 max-w-2xl">
                Paste text, give a natural-language instruction, review the preview, then approve. The administrator's
                primary surface for running Business OS through conversation.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={agent}
                onChange={(e) => setAgent(e.target.value)}
                className="appearance-none bg-white/5 border border-white/10 rounded-lg pl-3 pr-8 py-1.5 text-xs text-white/80 focus:outline-none focus:border-purple-400/40"
              >
                {AGENTS.map((a) => (
                  <option key={a} value={a} className="bg-[#0b0d10]">{a}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-white/40 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <span className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
              UI Preview
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Conversation */}
        <div className="os-glass p-0 lg:col-span-2 flex flex-col min-h-[540px]">
          {/* Quick prompts */}
          <div className="p-4 border-b border-white/5">
            <div className="text-[11px] uppercase tracking-wider text-white/40 mb-2">Quick prompts</div>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((q) => {
                const Icon = q.icon;
                return (
                  <button
                    key={q.label}
                    onClick={() => setInput(q.label)}
                    className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 px-3 py-1.5 text-xs text-white/80 transition"
                  >
                    <span className={`w-5 h-5 rounded-md grid place-items-center ${q.tint}`}>
                      <Icon className="w-3 h-3" />
                    </span>
                    {q.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 shrink-0 rounded-lg grid place-items-center bg-purple-500/10 text-purple-300">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-white/10 text-white rounded-br-sm"
                      : "bg-white/[0.03] border border-white/5 text-white/80 rounded-bl-sm"
                  }`}
                >
                  {m.text}
                  <div className="text-[10px] text-white/30 mt-1">{m.at}</div>
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
          <div className="border-t border-white/5 p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={taRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask anything, or describe an update… (Shift+Enter for new line)"
                rows={2}
                className="flex-1 resize-none bg-white/5 border border-white/10 focus:border-purple-400/40 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none"
              />
              <button
                onClick={send}
                disabled={!input.trim()}
                className="h-10 px-4 inline-flex items-center gap-2 rounded-xl bg-purple-500/20 text-purple-200 hover:bg-purple-500/30 disabled:opacity-40 transition"
              >
                <Send className="w-4 h-4" />
                <span className="text-xs font-medium">Run</span>
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2 text-[11px] text-white/40">
                <Paperclip className="w-3.5 h-3.5" />
                File upload coming soon
              </div>
              <button
                onClick={clearChat}
                className="inline-flex items-center gap-1 text-[11px] text-white/50 hover:text-white/80 transition"
              >
                <Eraser className="w-3 h-3" />
                Clear conversation
              </button>
            </div>
          </div>
        </div>

        {/* Side panel: Paste area + Preview */}
        <div className="space-y-4">
          {/* Paste area */}
          <div className="os-glass p-4">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardPaste className="w-4 h-4 text-cyan-300" />
              <h3 className="font-semibold text-sm">Large Paste Area</h3>
            </div>
            <textarea
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder="Paste a website, an email thread, Companies House data, a document…"
              rows={8}
              className="w-full resize-none bg-white/5 border border-white/10 focus:border-cyan-400/40 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-white/40">{paste.length.toLocaleString()} characters</span>
              <button
                onClick={() => setPaste("")}
                disabled={!paste}
                className="text-[11px] text-white/50 hover:text-white/80 disabled:opacity-30"
              >
                Clear
              </button>
            </div>
          </div>

          {/* File upload placeholder */}
          <div className="os-glass p-4 border-dashed">
            <div className="flex flex-col items-center justify-center text-center py-4 border border-dashed border-white/10 rounded-xl">
              <Upload className="w-5 h-5 text-white/40 mb-2" />
              <div className="text-xs font-medium text-white/70">Drop files here</div>
              <div className="text-[10px] text-white/40 mt-1">PDF, images, docs · Coming soon</div>
            </div>
          </div>

          {/* Preview panel */}
          <div className="os-glass p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-300" />
                <h3 className="font-semibold text-sm">Preview</h3>
              </div>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 text-white/40">Mock</span>
            </div>
            <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3 min-h-[110px] text-xs text-white/70 leading-relaxed">
              {lastAssistant?.text ?? "Run a prompt to see the preview here."}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-green-500/15 text-green-300 hover:bg-green-500/25 py-2 text-xs font-medium transition">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve
              </button>
              <button className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20 py-2 text-xs font-medium transition">
                <XCircle className="w-3.5 h-3.5" />
                Cancel
              </button>
              <button className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 py-2 text-xs font-medium transition">
                <Eraser className="w-3.5 h-3.5" />
                Clear
              </button>
              <button className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 py-2 text-xs font-medium transition">
                <RotateCcw className="w-3.5 h-3.5" />
                Run Again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
