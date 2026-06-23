import { useEffect, useRef, useState } from "react";
import { Bot, Send, X, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Link, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

type Msg = { role: "user" | "assistant"; content: string };

// Pool of 50+ quick questions — rotates every hour (6 shown at a time)
const QUICK_QUESTIONS_POOL = [
  // Banking & Payments
  "Best bank for eCommerce?",
  "Best account for eBay sellers?",
  "Best account for Amazon sellers?",
  "Best bank for UK LTD companies?",
  "Best bank for freelancers?",
  "Best bank for startups / SaaS?",
  "Best bank for merchant card payments?",
  "Stripe eligibility requirements?",
  "Wise eligibility & approval time?",
  "Payoneer eligibility?",
  "PayPal Business approval requirements?",
  "How long does bank account approval take?",
  "Can non-residents open a UK business bank?",
  "Crypto-friendly business banks?",
  // UK LTD Formation
  "UK LTD formation requirements?",
  "How long to form a UK LTD?",
  "Can foreigners open a UK LTD?",
  "Do I need a UK address for my company?",
  "What is ID Verification (Companies House)?",
  "What's in Silver £170 vs Starter £140?",
  "How do I get a UTR number?",
  "What is the Companies House Auth Code?",
  "What is HMRC Activation Code?",
  // UK Compliance
  "How do I file AD01 (address change)?",
  "Common AD01 issues to avoid?",
  "When are Annual Accounts due?",
  "What is a Confirmation Statement?",
  "How do I change my company name?",
  "Do you help with VAT registration?",
  "UK annual filing deadlines?",
  // USA LLC
  "USA LLC formation requirements?",
  "Best US state for LLC formation?",
  "Cheapest US state for LLC?",
  "Best state for non-resident LLC?",
  "What is EIN and how do I get one?",
  "What is ITIN and do I need it?",
  "What is the BOI report?",
  "Annual tax for US LLC?",
  // Address services
  "Can I use your address for bank statements?",
  "What is Director Service Address?",
  "What's in the All-in-One address plan?",
  // ID Verification
  "How long does ID verification take?",
  "What documents are needed for ID verification?",
  "What if ID verification fails?",
  // Payment policy
  "Do you require advance payment?",
  "What's your refund policy?",
  "Do you offer discounts?",
  "Which payment methods do you accept?",
  // General
  "Are you available 24/7?",
  "Do you offer web development?",
  "Do you handle accounting after formation?",
  "How do I register a UK LTD company?",
  "Can I open a US LLC from Pakistan?",
  "What are your pricing packages?",
];

function getHourlyQuickQuestions(count = 6): string[] {
  // Deterministic rotation based on current hour — same for everyone, changes hourly.
  const hour = Math.floor(Date.now() / (1000 * 60 * 60));
  const pool = QUICK_QUESTIONS_POOL;
  const start = hour % pool.length;
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(pool[(start + i) % pool.length]);
  }
  return out;
}




const WELCOME: Msg = {
  role: "assistant",
  content: "Hi! 👋 What would you like to start today?",
};

const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nudgedCountRef = useRef<number>(0);
  const nudgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { pathname } = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Close on ESC key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Human-like nudge: if assistant asked a question and user hasn't replied in ~30–60s,
  // ask the bot to send a gentle follow-up. Max 1 nudge per assistant turn.
  useEffect(() => {
    if (nudgeTimerRef.current) {
      clearTimeout(nudgeTimerRef.current);
      nudgeTimerRef.current = null;
    }
    if (!open || loading) return;
    if (input.trim().length > 0) return; // user is typing — cancel nudge
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant" || last === WELCOME) return;
    if (!last.content.includes("?")) return; // only nudge after a question
    if (nudgedCountRef.current >= messages.length) return; // already nudged for this turn
    const delayMs = 30000 + Math.floor(Math.random() * 30000); // 30–60s
    nudgeTimerRef.current = setTimeout(() => {
      nudgedCountRef.current = messages.length + 1;
      send(
        "[internal:user-idle] The user hasn't replied for a while. Send ONE short, friendly nudge in their language — gently rephrase or simplify your last question, or offer help. Keep it 1–2 lines. Do not repeat earlier text verbatim.",
        { hidden: true },
      );
    }, delayMs);
    return () => {
      if (nudgeTimerRef.current) {
        clearTimeout(nudgeTimerRef.current);
        nudgeTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, loading, open, input]);


  // Hide entirely on client portal / admin pages on mobile (must be after all hooks)
  const hideOnThisRoute = isMobile && (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"));
  if (hideOnThisRoute) return null;

  const send = async (text: string, opts: { hidden?: boolean } = {}) => {
    const { hidden = false } = opts;
    const userMsg: Msg = { role: "user", content: text };
    if (!hidden) {
      setMessages((p) => [...p, userMsg]);
      setInput("");
    }
    setLoading(true);

    const history = [...messages.filter((m) => m !== WELCOME), userMsg];

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: history }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Connection failed" }));
        setMessages((p) => [...p, { role: "assistant", content: `⚠️ ${err.error || "Something went wrong"}` }]);
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";
      let started = false;

      const append = (chunk: string) => {
        acc += chunk;
        setMessages((prev) => {
          if (!started) {
            started = true;
            return [...prev, { role: "assistant", content: acc }];
          }
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: acc } : m));
          }
          return [...prev, { role: "assistant", content: acc }];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) append(delta);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      setMessages((p) => [...p, { role: "assistant", content: "⚠️ Network error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = input.trim();
    if (t && !loading) send(t);
  };

  return (
    <>
      {/* Floating button — bottom-right, stacked above WhatsApp */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Ask AI"
        className="hide-on-nav-open fixed bottom-24 right-5 z-50 group flex items-center justify-center bg-gradient-brand text-primary-foreground rounded-full shadow-glow hover:shadow-elegant hover:scale-110 transition-all w-14 h-14 sm:w-16 sm:h-16"
      >
        <Bot className="w-7 h-7 sm:w-8 sm:h-8" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
        </span>
        {/* Tooltip on hover (desktop) */}
        <span className="hidden sm:block absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-foreground text-background text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Ask AI
        </span>
      </button>

      {/* Chat window */}
      {open && (
        <>
          {/* Backdrop — tap outside to close */}
          <div
            onClick={() => setOpen(false)}
            className="hide-on-nav-open fixed inset-0 z-[55] bg-black/40 sm:bg-black/20 animate-in fade-in duration-200"
            aria-hidden="true"
          />
          <div className="hide-on-nav-open fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-24 z-[60] sm:w-[400px] sm:h-[600px] bg-background sm:rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-gradient-brand text-primary-foreground p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-white/20 backdrop-blur p-2 rounded-full flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base leading-tight truncate">Ask AI</h3>
                <p className="text-xs opacity-90 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  Online • Replies instantly
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 active:bg-white/40 transition-colors flex-shrink-0 ring-1 ring-white/20"
            >
              <X className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
            {messages.flatMap((m, i) => {
              // Single-response enforcement: strip any legacy SPLIT markers and render as ONE bubble.
              const content = m.role === "assistant"
                ? m.content.replace(/\s*<<<SPLIT>>>\s*/g, "\n\n").trim()
                : m.content;
              const safeChunks = [content];
              return safeChunks.map((chunk, ci) => (
                <div key={`${i}-${ci}`} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-card border border-border rounded-bl-sm"
                    }`}
                  >
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-a:text-primary prose-a:underline">
                      <ReactMarkdown
                        components={{
                          a: ({ href, children }) => {
                            if (href?.startsWith("/")) {
                              return (
                                <Link to={href} onClick={() => setOpen(false)} className="text-primary underline">
                                  {children}
                                </Link>
                              );
                            }
                            return (
                              <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                                {children}
                              </a>
                            );
                          },
                        }}
                      >
                        {chunk}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ));
            })}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick questions (only when fresh) */}
          {messages.length <= 2 && !loading && (
            <div className="px-3 pb-2 bg-muted/30 border-t border-border">
              <p className="text-xs text-muted-foreground py-2 font-medium">Quick questions:</p>
              <div className="flex flex-wrap gap-1.5 pb-2">
                {getHourlyQuickQuestions(6).map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-xs bg-card border border-border hover:border-primary hover:bg-primary/5 rounded-full px-3 py-1.5 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-background flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question…"
              disabled={loading}
              className="flex-1 bg-muted/50 border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="bg-primary text-primary-foreground rounded-full p-2.5 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          </div>
        </>
      )}
    </>
  );
};

export default AIAssistant;
