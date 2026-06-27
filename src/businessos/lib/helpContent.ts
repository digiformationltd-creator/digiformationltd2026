// Phase 6 — Help Center content.
// Pure static content. No backend, no fetches.

export type FaqEntry = { q: string; a: string; tags: string[] };
export type ModuleEntry = { name: string; path: string; what: string; when: string };
export type Shortcut = { keys: string; label: string; scope: "Global" | "Command Center" | "Tables" };

export const FAQS: FaqEntry[] = [
  { q: "What is Business OS?", a: "Business OS is the internal admin workspace for DigiFormation. It centralises Leads, Clients, Companies, Orders, Invoices, Support, Compliance and Automation in one place.", tags: ["overview", "intro"] },
  { q: "What is the AI Command Center?", a: "A conversational assistant that lets you describe an action in plain English, preview exactly what would change, approve it, and (when supported) undo it within 10 seconds.", tags: ["ai", "command center"] },
  { q: "Will the AI ever change things without asking?", a: "No. Every action runs Prompt → Preview → Approval → Execution. Destructive actions also require you to type CONFIRM.", tags: ["safety", "ai"] },
  { q: "What are system-owned automations?", a: "Invoices, order confirmation emails, scheduled reminders and the email queue run automatically in the background. They are read-only from the Command Center to prevent duplicates.", tags: ["safety", "automation"] },
  { q: "How do I undo an action?", a: "Eligible actions show an Undo button for ~10 seconds after execution. After that, contact a developer for manual rollback.", tags: ["undo", "safety"] },
  { q: "How do I find a client or order?", a: "Use the Search field in the top bar, or open the relevant module from the sidebar.", tags: ["search", "navigation"] },
  { q: "Why is a module empty?", a: "Modules start empty until data flows in (e.g. an inquiry, an order, a ticket). Each empty page explains how to get started.", tags: ["empty", "onboarding"] },
  { q: "What is the difference between Companies and Managed Companies?", a: "Companies = customer-owned entities tracked in CRM. Managed Companies = internal inventory of UK shelf companies we administer.", tags: ["companies"] },
  { q: "Can I restart the welcome tour?", a: "Yes — open Help in the top bar and click Restart Tour.", tags: ["onboarding"] },
];

export const MODULES: ModuleEntry[] = [
  { name: "Dashboard",            path: "/admin",                    what: "KPIs and recent activity across the business.", when: "Daily check-in." },
  { name: "Leads",                path: "/admin/leads",              what: "Inbound enquiries before they become orders.",  when: "Triage new leads and move them through stages." },
  { name: "Clients",              path: "/admin/clients",            what: "All customers and their full journey.",          when: "Look up a customer, view history, send email." },
  { name: "Companies",            path: "/admin/companies",          what: "Customer-owned company records.",                when: "Update registered details or company status." },
  { name: "Managed Companies",    path: "/admin/managed-companies",  what: "Internal inventory of UK shelf companies.",      when: "Allocate, retire or update a managed entity." },
  { name: "Orders",               path: "/admin/orders",             what: "All service orders.",                            when: "Track fulfilment, mark complete, cancel." },
  { name: "Invoices",             path: "/admin/invoices",           what: "Generated invoices (auto-issued with orders).",  when: "Review status, download PDF, manual overrides." },
  { name: "WhatsApp CRM",         path: "/admin/whatsapp",           what: "WhatsApp conversations with leads & clients.",   when: "Reply, tag, link to a client." },
  { name: "Growth Intelligence",  path: "/admin/attribution",        what: "Lead attribution and growth analytics.",         when: "Weekly performance review." },
  { name: "Support",              path: "/admin/support",            what: "Customer support tickets.",                      when: "Reply, update status, internal notes." },
  { name: "Documents",            path: "/admin/documents",          what: "Customer-uploaded and issued documents.",        when: "Verify uploads, share files." },
  { name: "Compliance",           path: "/admin/compliance",         what: "Filing deadlines and statutory reminders.",      when: "Plan upcoming filings, monitor risk." },
  { name: "Email Marketing",      path: "/admin/automation/email-marketing", what: "Campaigns, templates, queue, logs, analytics, and operations.", when: "Send, monitor, retry, or audit any outbound email." },
  { name: "Automation",           path: "/admin/automation",         what: "Hub for Command Center, Workflows, Jobs and Reminders.", when: "Run manual commands or review automation health." },
  { name: "Settings",             path: "/admin/settings",           what: "Configuration, services catalog and team.",      when: "Adjust pricing, services or roles." },
];

export const SHORTCUTS: Shortcut[] = [
  { keys: "⌘K / Ctrl+K", label: "Open Command Library palette",  scope: "Command Center" },
  { keys: "Enter",         label: "Send prompt",                  scope: "Command Center" },
  { keys: "Shift+Enter",   label: "New line in composer",         scope: "Command Center" },
  { keys: "Esc",           label: "Close palette / cancel preview", scope: "Command Center" },
  { keys: "/",             label: "Focus search",                 scope: "Global" },
  { keys: "G then D",      label: "Go to Dashboard",              scope: "Global" },
  { keys: "G then O",      label: "Go to Orders",                 scope: "Global" },
  { keys: "G then C",      label: "Go to Clients",                scope: "Global" },
  { keys: "?",             label: "Open Help",                    scope: "Global" },
];

export const SAFETY_LEVELS = [
  { level: "Safe",        tone: "text-emerald-300 bg-emerald-500/10", description: "Read-only or low-impact (lookups, summaries, notes). Executes after one click." },
  { level: "Sensitive",   tone: "text-amber-300 bg-amber-500/10",     description: "Updates customer-facing data. Requires preview + approval." },
  { level: "Destructive", tone: "text-rose-300 bg-rose-500/10",       description: "Cancels, deletes or permanently changes records. Requires typing CONFIRM." },
];

export const TROUBLESHOOTING = [
  { problem: "I sent a prompt but nothing happens.", fix: "Wait for the Preview card to render. If it stays blank, your prompt was likely ambiguous — try rephrasing with explicit names or IDs." },
  { problem: "The Undo button disappeared.",         fix: "Undo is available for ~10s after execution. After that the action is permanent; use the relevant module to make a correcting change." },
  { problem: "An automation didn't fire.",           fix: "Check Automation → Jobs for the latest run. System-owned jobs (invoices, reminders) run on schedule, not on demand." },
  { problem: "A customer didn't receive their email.", fix: "Open Email Marketing → Operations and search by recipient. The status column shows queued / sent / bounced / suppressed." },
  { problem: "A module is empty.",                   fix: "That's expected before data exists. The empty state explains how to seed the module." },
];
