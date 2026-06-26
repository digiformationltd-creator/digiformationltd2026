// Single source of truth for declared-source options used across attribution UIs.
// SourceHeardSelect (forms) and Growth Intelligence both read from here.
import type { DeclaredSource } from "@/lib/attribution";

export const SOURCE_OPTIONS: (DeclaredSource & { emoji?: string })[] = [
  // AI
  { id: "chatgpt", label: "ChatGPT", category: "ai", emoji: "🤖" },
  { id: "gemini", label: "Gemini", category: "ai", emoji: "✨" },
  { id: "claude", label: "Claude", category: "ai", emoji: "🧠" },
  { id: "perplexity", label: "Perplexity", category: "ai", emoji: "🔎" },
  { id: "grok", label: "Grok", category: "ai", emoji: "⚡" },
  { id: "deepseek", label: "DeepSeek", category: "ai", emoji: "🌊" },
  { id: "copilot", label: "Microsoft Copilot", category: "ai", emoji: "🧭" },
  { id: "google_ai_overview", label: "Google AI / AI Overview", category: "ai", emoji: "🧬" },
  { id: "other_ai", label: "Other AI", category: "ai", emoji: "🤖" },
  // Search
  { id: "google", label: "Google Search", category: "search", emoji: "🔍" },
  { id: "google_ads", label: "Google Ads", category: "search", emoji: "🅖" },
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
