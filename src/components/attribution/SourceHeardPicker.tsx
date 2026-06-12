import { useState } from "react";
import { Sparkles, Search, Share2, MessageCircle, Check } from "lucide-react";
import type { DeclaredSource, SourceCategory } from "@/lib/attribution";

export const SOURCE_OPTIONS: (DeclaredSource & { emoji?: string })[] = [
  // AI
  { id: "chatgpt", label: "ChatGPT", category: "ai", emoji: "🤖" },
  { id: "gemini", label: "Gemini", category: "ai", emoji: "✨" },
  { id: "claude", label: "Claude", category: "ai", emoji: "🧠" },
  { id: "perplexity", label: "Perplexity", category: "ai", emoji: "🔎" },
  { id: "grok", label: "Grok", category: "ai", emoji: "⚡" },
  { id: "deepseek", label: "DeepSeek", category: "ai", emoji: "🌊" },
  { id: "copilot", label: "Microsoft Copilot", category: "ai", emoji: "🧭" },
  { id: "other_ai", label: "Other AI", category: "ai", emoji: "🤖" },
  // Search
  { id: "google", label: "Google Search", category: "search", emoji: "🔍" },
  { id: "bing", label: "Bing Search", category: "search", emoji: "🔍" },
  { id: "yahoo", label: "Yahoo Search", category: "search", emoji: "🔍" },
  { id: "other_search", label: "Other Search", category: "search", emoji: "🔍" },
  // Social
  { id: "facebook", label: "Facebook", category: "social", emoji: "📘" },
  { id: "instagram", label: "Instagram", category: "social", emoji: "📷" },
  { id: "tiktok", label: "TikTok", category: "social", emoji: "🎵" },
  { id: "youtube", label: "YouTube", category: "social", emoji: "▶️" },
  { id: "linkedin", label: "LinkedIn", category: "social", emoji: "💼" },
  { id: "twitter", label: "X (Twitter)", category: "social", emoji: "𝕏" },
  // Direct
  { id: "whatsapp", label: "WhatsApp", category: "direct", emoji: "💬" },
  { id: "referral", label: "Referral / Friend", category: "direct", emoji: "👥" },
  { id: "existing_client", label: "Existing Client", category: "direct", emoji: "⭐" },
  { id: "direct", label: "Direct Visit", category: "direct", emoji: "🌐" },
  { id: "other", label: "Other", category: "direct", emoji: "•" },
];

const CATEGORY_META: Record<SourceCategory, { label: string; icon: any }> = {
  ai: { label: "AI Platform", icon: Sparkles },
  search: { label: "Search Engine", icon: Search },
  social: { label: "Social Media", icon: Share2 },
  direct: { label: "Direct / Referral", icon: MessageCircle },
  referral: { label: "Referral", icon: MessageCircle },
};

const ORDER: SourceCategory[] = ["ai", "search", "social", "direct"];

export type SourceHeardPickerProps = {
  value: DeclaredSource | null;
  onChange: (v: DeclaredSource) => void;
  error?: boolean;
};

const SourceHeardPicker = ({ value, onChange, error }: SourceHeardPickerProps) => {
  const [openCat, setOpenCat] = useState<SourceCategory | null>(value?.category ?? "ai");

  return (
    <div className={`rounded-2xl border ${error ? "border-destructive/60" : "border-border/40"} p-4 md:p-5 space-y-3`}>
      <div>
        <h3 className="font-semibold text-base">How did you hear about DigiFormation? <span className="text-destructive">*</span></h3>
        <p className="text-xs opacity-70 mt-0.5">Required — helps us understand where our customers come from.</p>
      </div>

      <div className="space-y-2.5">
        {ORDER.map((cat) => {
          const meta = CATEGORY_META[cat];
          const Icon = meta.icon;
          const items = SOURCE_OPTIONS.filter((o) => o.category === cat);
          const isOpen = openCat === cat;
          const selectedInCat = value?.category === cat ? value : null;
          return (
            <div key={cat} className="rounded-xl border border-border/30 overflow-hidden bg-background/40">
              <button
                type="button"
                onClick={() => setOpenCat(isOpen ? null : cat)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-semibold hover:bg-primary/5 transition"
              >
                <span className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" />
                  {meta.label}
                  {selectedInCat && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                      <Check className="w-3 h-3" /> {selectedInCat.label}
                    </span>
                  )}
                </span>
                <span className="text-xs opacity-50">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-3 pt-1">
                  {items.map((opt) => {
                    const active = value?.id === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChange({ id: opt.id, label: opt.label, category: opt.category })}
                        className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-medium transition ${
                          active
                            ? "border-primary bg-primary/15 text-primary shadow-md"
                            : "border-border/40 hover:border-primary/50 hover:bg-primary/5"
                        }`}
                      >
                        <span className="text-lg leading-none">{opt.emoji}</span>
                        <span className="text-center leading-tight">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p className="text-xs text-destructive font-medium">Please select how you heard about us before placing the order.</p>
      )}
    </div>
  );
};

export default SourceHeardPicker;
