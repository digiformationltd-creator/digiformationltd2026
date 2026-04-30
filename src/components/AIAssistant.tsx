import { useEffect, useRef, useState } from "react";
import { Bot, Send, X, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK_QUESTIONS = [
  "How do I register a UK LTD company?",
  "Can I open a US LLC from Pakistan?",
  "How to get a Stripe account?",
  "Tell me about PayPal setup",
  "What are your pricing packages?",
  "How do I get an EIN number?",
];

const WELCOME: Msg = {
  role: "assistant",
  content:
    "👋 **Hi! I'm Digi Assistant.** I can answer questions about UK LTD & US LLC formation, banking (PayPal, Stripe, Wise, Payoneer…), compliance, and more. Pick a quick question below or type your own!",
};

const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    const userMsg: Msg = { role: "user", content: text };
    setMessages((p) => [...p, userMsg]);
    setInput("");
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
        aria-label="Open Digi AI Assistant"
        className="fixed bottom-24 right-5 z-50 group flex items-center justify-center bg-gradient-brand text-primary-foreground rounded-full shadow-glow hover:shadow-elegant hover:scale-110 transition-all w-14 h-14 sm:w-16 sm:h-16"
      >
        <Bot className="w-7 h-7 sm:w-8 sm:h-8" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
        </span>
        {/* Tooltip on hover (desktop) */}
        <span className="hidden sm:block absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-foreground text-background text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Ask AI Assistant
        </span>
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:left-5 z-[60] sm:w-[400px] sm:h-[600px] bg-background sm:rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-gradient-brand text-primary-foreground p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur p-2 rounded-full">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">Digi Assistant</h3>
                <p className="text-xs opacity-90 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  Online • Replies instantly
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
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
                      {m.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
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
                {QUICK_QUESTIONS.map((q) => (
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
      )}
    </>
  );
};

export default AIAssistant;
