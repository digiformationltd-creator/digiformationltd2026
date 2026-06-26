// Phase 5 — AI Command Library
// Pure UX/discovery layer. No backend, no new intents.
// Every command maps to an intent already supported by os-command-execute
// (or to a system-owned automation we deliberately link to as read-only).

import {
  Building2, Users, ShoppingBag, FileText, Bell, Mail, Search,
  ClipboardList, Activity, type LucideIcon,
} from "lucide-react";

export type RiskTier = "safe" | "sensitive" | "destructive";

export type LibraryCommand = {
  id: string;                 // stable id, used for favorites/recents
  title: string;              // short display name
  description: string;        // one-line plain-English purpose
  examples: string[];         // natural-language prompts copy-to-composer
  category: CategoryId;
  risk: RiskTier;
  systemOwned?: boolean;      // true → read-only badge, never executable via CC
};

export type CategoryId =
  | "companies" | "customers" | "orders" | "invoices"
  | "reminders" | "email" | "lookups" | "system";

export type Category = {
  id: CategoryId;
  label: string;
  icon: LucideIcon;
  tint: string;
  blurb: string;
};

export const CATEGORIES: Category[] = [
  { id: "companies", label: "Companies",        icon: Building2,    tint: "bg-blue-500/10 text-blue-300",       blurb: "Manage registered companies, addresses and notes." },
  { id: "customers", label: "Customers",        icon: Users,        tint: "bg-cyan-500/10 text-cyan-300",       blurb: "Look up customers and review their history." },
  { id: "orders",    label: "Orders",           icon: ShoppingBag,  tint: "bg-purple-500/10 text-purple-300",   blurb: "Create and update orders." },
  { id: "invoices",  label: "Invoices",         icon: FileText,     tint: "bg-emerald-500/10 text-emerald-300", blurb: "Manual overrides for invoice status and meta." },
  { id: "reminders", label: "Reminders & Tasks",icon: Bell,         tint: "bg-amber-500/10 text-amber-300",     blurb: "Schedule reminders, follow-ups and tasks." },
  { id: "email",     label: "Email",            icon: Mail,         tint: "bg-pink-500/10 text-pink-300",       blurb: "Draft and send transactional emails." },
  { id: "lookups",   label: "Lookups",          icon: Search,       tint: "bg-lime-500/10 text-lime-300",       blurb: "Read-only queries — never mutate." },
  { id: "system",    label: "System Automations",icon: Activity,    tint: "bg-white/10 text-white/60",          blurb: "Always-on backend automations. Read-only here." },
];

export const COMMANDS: LibraryCommand[] = [
  // Companies
  { id: "company.update_address", title: "Update registered address", description: "Change a company's registered office address.",
    category: "companies", risk: "sensitive",
    examples: [
      "Update the registered address for Acme Holdings Ltd to 10 Downing Street, London SW1A 2AA",
      "Change registered address of company #14829203 to 221B Baker Street, London NW1 6XE",
    ] },
  { id: "company.update_status", title: "Update company status", description: "Change a managed company's operational status.",
    category: "companies", risk: "sensitive",
    examples: ["Set company status of Acme Holdings Ltd to active", "Update company status to dissolved"] },
  { id: "company.add_note", title: "Add a note to a company", description: "Append an internal note to a company record.",
    category: "companies", risk: "safe",
    examples: ["Add note to Acme Holdings Ltd: client requested early renewal", "Append note: filed CS01 on 12 Jan"] },
  { id: "company.update_field", title: "Update a company field", description: "Edit a generic company field (notes, internal flags).",
    category: "companies", risk: "sensitive",
    examples: ["Update company notes for Acme Holdings Ltd: high-priority client"] },
  { id: "company.summarize", title: "Summarise a company", description: "Generate a short read-only summary for a company.",
    category: "companies", risk: "safe",
    examples: ["Summarise company Acme Holdings Ltd"] },

  // Customers
  { id: "customer.lookup", title: "Find a customer", description: "Look up a customer by name or email.",
    category: "customers", risk: "safe",
    examples: ["Find customer sarah@acme.co.uk", "Lookup client Sarah Johnson"] },
  { id: "customer.history", title: "Show client history", description: "Read-only timeline of a client's orders, invoices and tickets.",
    category: "customers", risk: "safe",
    examples: ["Show client history for sarah@acme.co.uk", "Customer history sarah@acme.co.uk"] },

  // Orders
  { id: "order.create", title: "Create order", description: "Create a new order for a customer.",
    category: "orders", risk: "sensitive",
    examples: ["Create order: UK LTD Formation Silver for sarah@acme.co.uk, £170"] },
  { id: "order.update_status", title: "Update order status", description: "Mark an order as in-progress, completed or cancelled.",
    category: "orders", risk: "sensitive",
    examples: ["Mark order ORD-2026-0481 as completed", "Update order status to in_progress"] },
  { id: "order.lookup", title: "Find a company", description: "Look up a managed company by name or number.",
    category: "orders", risk: "safe",
    examples: ["Find company Acme Holdings Ltd", "Lookup company 14829203"] },

  // Invoices (Batch 1 — manual override only; system never re-sends emails)
  { id: "invoice.update_status", title: "Update invoice status", description: "Manual override: paid, void, refunded, issued, draft.",
    category: "invoices", risk: "sensitive",
    examples: ["Mark invoice INV-2026-0931 as paid", "Set invoice status to void"] },
  { id: "invoice.update_meta", title: "Update invoice meta", description: "Edit due date or notes on an invoice (no re-send).",
    category: "invoices", risk: "sensitive",
    examples: ["Update invoice INV-2026-0931 due date to 2026-07-15", "Edit invoice notes: PO 5521 attached"] },

  // Reminders & tasks
  { id: "reminder.create", title: "Create reminder", description: "Schedule a high-priority reminder.",
    category: "reminders", risk: "safe",
    examples: ["Remind me tomorrow to call Sarah at Acme", "Reminder: VAT return for Nova LLC on Friday"] },
  { id: "task.create", title: "Create task", description: "Create a generic task (default fallback).",
    category: "reminders", risk: "safe",
    examples: ["Create task: prepare welcome pack for Acme", "Add task: review director details"] },
  { id: "task.create_followup", title: "Create follow-up", description: "Schedule a follow-up task linked to a thread.",
    category: "reminders", risk: "safe",
    examples: ["Create follow-up: chase invoice INV-2026-0931 next Monday"] },
  { id: "task.assign", title: "Assign task", description: "Assign an existing task to a teammate.",
    category: "reminders", risk: "sensitive",
    examples: ["Assign task T-291 to alex@digiformation.uk"] },

  // Email (manual drafts only — never duplicates system-owned emails)
  { id: "email.draft", title: "Draft an email", description: "Compose a draft reply — never auto-sent.",
    category: "email", risk: "safe",
    examples: ["Draft an email to sarah@acme.co.uk about her renewal", "Compose email reply to invoice dispute"] },
  { id: "email.send_template", title: "Send email template", description: "Send a non-system transactional template manually.",
    category: "email", risk: "sensitive",
    examples: ["Send email template welcome to sarah@acme.co.uk"] },

  // Lookups (read-only)
  { id: "lookup.reminders", title: "Show reminders", description: "List active reminders across the workspace.",
    category: "lookups", risk: "safe", examples: ["Show reminders", "Show all reminders"] },
  { id: "lookup.compliance", title: "Show pending compliance", description: "List companies with compliance items due.",
    category: "lookups", risk: "safe", examples: ["Show pending compliance", "Compliance due this month"] },
  { id: "lookup.jobs", title: "Show scheduled jobs", description: "Cron / scheduled job status.",
    category: "lookups", risk: "safe", examples: ["Show scheduled jobs", "Cron status"] },
  { id: "lookup.activity", title: "Show recent activity", description: "Recent automation runs and command executions.",
    category: "lookups", risk: "safe", examples: ["Show recent activity", "Recent automation runs"] },

  // System-owned — surfaced for discoverability ONLY (never runs via CC)
  { id: "system.invoice_autogen", title: "Auto-generate invoice on order", description: "Runs automatically when an order is created.",
    category: "system", risk: "safe", systemOwned: true, examples: [] },
  { id: "system.order_confirmation_email", title: "Order confirmation email", description: "Sent automatically by the backend on order creation.",
    category: "system", risk: "safe", systemOwned: true, examples: [] },
  { id: "system.reminder_scheduler", title: "Reminder scheduler", description: "Daily cron — sends compliance reminders.",
    category: "system", risk: "safe", systemOwned: true, examples: [] },
  { id: "system.mirror_inquiry", title: "Mirror inquiry → order", description: "DB trigger that links inquiries to orders.",
    category: "system", risk: "safe", systemOwned: true, examples: [] },
];

// ─────────────────────────────────────────────────────────────
// localStorage helpers — per-browser, no backend
// ─────────────────────────────────────────────────────────────

const FAV_KEY = "cc.library.favorites.v1";
const RECENT_KEY = "cc.library.recents.v1";
const MAX_RECENT = 12;

export type RecentEntry = { id: string; prompt: string; at: number };

const read = <T,>(k: string, fallback: T): T => {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fallback; }
  catch { return fallback; }
};
const write = (k: string, v: unknown) => {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* noop */ }
};

export const getFavorites = (): string[] => read<string[]>(FAV_KEY, []);
export const isFavorite = (id: string) => getFavorites().includes(id);
export const toggleFavorite = (id: string): string[] => {
  const cur = getFavorites();
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  write(FAV_KEY, next);
  return next;
};

export const getRecents = (): RecentEntry[] => read<RecentEntry[]>(RECENT_KEY, []);
export const pushRecent = (prompt: string, commandId?: string): RecentEntry[] => {
  const trimmed = prompt.trim();
  if (!trimmed) return getRecents();
  const cur = getRecents().filter((r) => r.prompt !== trimmed);
  const next = [{ id: commandId ?? trimmed.slice(0, 64), prompt: trimmed, at: Date.now() }, ...cur].slice(0, MAX_RECENT);
  write(RECENT_KEY, next);
  return next;
};
export const clearRecents = () => write(RECENT_KEY, []);

export const findCategory = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!;
export const commandsByCategory = (id: CategoryId) => COMMANDS.filter((c) => c.category === id);

export const KEYBOARD_SHORTCUTS: { keys: string; label: string }[] = [
  { keys: "⌘ K  /  Ctrl K", label: "Open Command Library palette" },
  { keys: "Enter",           label: "Send prompt" },
  { keys: "Shift + Enter",   label: "New line in composer" },
  { keys: "Esc",             label: "Close palette / cancel edit" },
];
