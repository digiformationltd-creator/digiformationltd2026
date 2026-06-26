// Knowledge Center — Phase 1 UI (mock data only). No AI, no search backend.

import { useMemo, useState } from "react";
import {
  BookOpen, Search, FileText, ListChecks, BookMarked, FileCode2, GitBranch,
  Bot, Clock, Building2, Landmark, ShieldCheck, Megaphone, ScanText, Mail,
  PoundSterling, Users, Lock, Star, Eye, Pencil, Plus, Filter, ChevronRight, Tag,
} from "lucide-react";

type Tab = "documents" | "sops" | "playbooks" | "templates" | "trees" | "agents" | "recent";
type CatId =
  | "all" | "formation" | "banking" | "compliance" | "marketing"
  | "ocr" | "email" | "finance" | "crm" | "internal";

const TINT: Record<string, string> = {
  cyan: "bg-cyan-500/10 text-cyan-300 border-cyan-400/20",
  emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-400/20",
  pink: "bg-pink-500/10 text-pink-300 border-pink-400/20",
  indigo: "bg-indigo-500/10 text-indigo-300 border-indigo-400/20",
  gold: "bg-amber-500/10 text-amber-300 border-amber-400/20",
  purple: "bg-purple-500/10 text-purple-300 border-purple-400/20",
  red: "bg-red-500/10 text-red-300 border-red-400/20",
  slate: "bg-white/5 text-white/70 border-white/10",
};

const CATEGORIES: { id: CatId; label: string; icon: any; tint: string; count: number; desc: string }[] = [
  { id: "all",        label: "All",               icon: BookOpen,     tint: "slate",   count: 64, desc: "Everything in the library" },
  { id: "formation",  label: "Company Formation", icon: Building2,    tint: "cyan",    count: 14, desc: "UK Ltd, US LLC, incorporation flows" },
  { id: "banking",    label: "Banking",           icon: Landmark,     tint: "emerald", count: 9,  desc: "Wise, Stripe, PayPal, Airwallex" },
  { id: "compliance", label: "Compliance",        icon: ShieldCheck,  tint: "purple",  count: 11, desc: "CS, AA, PSC, KYC, AML" },
  { id: "marketing",  label: "Marketing",         icon: Megaphone,    tint: "pink",    count: 7,  desc: "Campaigns, outreach, attribution" },
  { id: "ocr",        label: "OCR",               icon: ScanText,     tint: "cyan",    count: 4,  desc: "Document parsing & extraction" },
  { id: "email",      label: "Email",             icon: Mail,         tint: "indigo",  count: 6,  desc: "Templates, deliverability, sequences" },
  { id: "finance",    label: "Finance",           icon: PoundSterling,tint: "gold",    count: 5,  desc: "Pricing, invoicing, refunds" },
  { id: "crm",        label: "CRM",               icon: Users,        tint: "purple",  count: 4,  desc: "Client lifecycle, WhatsApp, support" },
  { id: "internal",   label: "Internal",          icon: Lock,         tint: "slate",   count: 4,  desc: "HR, ops, admin policies" },
];

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "documents", label: "Documents",      icon: FileText },
  { id: "sops",      label: "SOPs",           icon: ListChecks },
  { id: "playbooks", label: "Playbooks",      icon: BookMarked },
  { id: "templates", label: "Templates",      icon: FileCode2 },
  { id: "trees",     label: "Decision Trees", icon: GitBranch },
  { id: "agents",    label: "Agent Knowledge",icon: Bot },
  { id: "recent",    label: "Recently Updated", icon: Clock },
];

type Item = {
  id: string;
  title: string;
  type: "Document" | "SOP" | "Playbook" | "Template" | "Tree" | "Agent";
  category: Exclude<CatId, "all">;
  tags: string[];
  updated: string;
  author: string;
  reads: number;
  pinned?: boolean;
  summary: string;
};

const ITEMS: Item[] = [
  { id: "K-1101", title: "UK Ltd Incorporation — Silver Package Workflow",      type: "Playbook", category: "formation",  tags: ["UK Ltd", "Silver", "Default"], updated: "2d ago",  author: "Adeel K.",  reads: 412, pinned: true,  summary: "End-to-end flow for our default £170 formation package, from order to delivery." },
  { id: "K-1100", title: "Companies House Auth Code — Recovery SOP",            type: "SOP",      category: "formation",  tags: ["CH", "Auth Code"],            updated: "1w ago",  author: "Sara M.",   reads: 188, summary: "Step-by-step recovery when client loses authentication code." },
  { id: "K-1099", title: "Wise Business Account Opening Guide",                 type: "Document", category: "banking",    tags: ["Wise", "EMI"],                updated: "3d ago",  author: "Adeel K.",  reads: 267, summary: "What clients need to prepare before applying for Wise Business." },
  { id: "K-1098", title: "Stripe High-Risk Industry Checklist",                 type: "Playbook", category: "banking",    tags: ["Stripe", "Risk"],             updated: "5d ago",  author: "Sara M.",   reads: 143, summary: "Handling adult, crypto and supplements clients on Stripe." },
  { id: "K-1097", title: "Confirmation Statement Reminder Sequence",            type: "Template", category: "compliance", tags: ["CS", "Reminder"],             updated: "Today",   author: "System",    reads: 92, pinned: true, summary: "T-30, T-7, T-1 email reminders for CS filings." },
  { id: "K-1096", title: "AML / KYC Document Requirements",                     type: "Document", category: "compliance", tags: ["KYC", "AML"],                 updated: "2w ago",  author: "Adeel K.",  reads: 521, summary: "Acceptable IDs, proof of address rules and verification flow." },
  { id: "K-1095", title: "Lead Discovery — Decision Tree",                      type: "Tree",     category: "marketing",  tags: ["Outreach", "Leads"],          updated: "4d ago",  author: "Sara M.",   reads: 73,  summary: "Decide whether a discovered lead qualifies for outreach." },
  { id: "K-1094", title: "Campaign Briefing Template",                          type: "Template", category: "marketing",  tags: ["Campaign"],                   updated: "1w ago",  author: "Adeel K.",  reads: 41,  summary: "Standard structure for new outreach campaigns." },
  { id: "K-1093", title: "OCR Confidence Thresholds & Manual Review Rules",    type: "SOP",      category: "ocr",        tags: ["OCR", "Review"],              updated: "Yesterday", author: "System",  reads: 58,  summary: "When the OCR worker should auto-attach vs. route to manual review." },
  { id: "K-1092", title: "Cold Email Deliverability Playbook",                  type: "Playbook", category: "email",      tags: ["Deliverability"],             updated: "6d ago",  author: "Sara M.",   reads: 134, summary: "Domain warmup, SPF/DKIM, send caps and content rules." },
  { id: "K-1091", title: "Order Confirmation Email — Master Template",         type: "Template", category: "email",      tags: ["Transactional"],              updated: "2w ago",  author: "Adeel K.",  reads: 318, summary: "Canonical structure for the order confirmation email." },
  { id: "K-1090", title: "Refund & Cancellation Policy",                        type: "Document", category: "finance",    tags: ["Refund", "Policy"],           updated: "3w ago",  author: "Adeel K.",  reads: 209, summary: "When refunds are allowed, exceptions, and admin actions." },
  { id: "K-1089", title: "Invoice Dispute — Decision Tree",                     type: "Tree",     category: "finance",    tags: ["Invoicing"],                  updated: "1w ago",  author: "Sara M.",   reads: 47,  summary: "Routes disputes between support, finance and management." },
  { id: "K-1088", title: "WhatsApp CRM — Response Time SLA",                    type: "SOP",      category: "crm",        tags: ["WhatsApp", "SLA"],            updated: "5d ago",  author: "Sara M.",   reads: 162, summary: "First-response targets per lead stage and channel." },
  { id: "K-1087", title: "Client Offboarding Checklist",                        type: "SOP",      category: "crm",        tags: ["Offboarding"],                updated: "2w ago",  author: "Adeel K.",  reads: 88,  summary: "Final handover, data export and reminders cleanup." },
  { id: "K-1086", title: "Internal — Admin Permissions Matrix",                 type: "Document", category: "internal",   tags: ["RBAC", "Admin"],              updated: "1m ago",  author: "Adeel K.",  reads: 24,  summary: "Who can do what across Business OS modules." },
];

const AGENTS = [
  { id: "reminder",  name: "Reminder Agent",   docs: 6,  category: "compliance" as CatId, sources: ["Reminder SOP", "CS Sequence", "Compliance Calendar"] },
  { id: "ocr",       name: "OCR Agent",        docs: 4,  category: "ocr" as CatId,        sources: ["OCR Thresholds", "Doc Templates", "Manual Review Rules"] },
  { id: "compliance",name: "Compliance Agent", docs: 11, category: "compliance" as CatId, sources: ["AML/KYC", "PSC Guide", "CS Playbook"] },
  { id: "marketing", name: "Marketing Agent",  docs: 7,  category: "marketing" as CatId,  sources: ["Lead Discovery", "Campaign Briefs", "Deliverability"] },
  { id: "support",   name: "Support Agent",    docs: 8,  category: "crm" as CatId,        sources: ["Refund Policy", "WhatsApp SLA", "FAQ Library"] },
  { id: "sales",     name: "Sales Agent",      docs: 9,  category: "formation" as CatId,  sources: ["Silver Playbook", "Pricing Sheet", "Objection Handling"] },
];

const TYPE_TINT: Record<Item["type"], string> = {
  Document: "indigo", SOP: "cyan", Playbook: "pink", Template: "gold", Tree: "purple", Agent: "emerald",
};

export default function OsKnowledgeCenter() {
  const [tab, setTab] = useState<Tab>("documents");
  const [cat, setCat] = useState<CatId>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Item | null>(null);

  const filtered = useMemo(() => {
    const byType: Partial<Record<Tab, Item["type"]>> = {
      documents: "Document", sops: "SOP", playbooks: "Playbook",
      templates: "Template", trees: "Tree",
    };
    let list = ITEMS;
    if (tab === "recent") {
      list = [...ITEMS].slice().sort((a, b) => a.updated.localeCompare(b.updated));
    } else if (tab !== "agents") {
      const t = byType[tab];
      if (t) list = list.filter(i => i.type === t);
    }
    if (cat !== "all") list = list.filter(i => i.category === cat);
    if (q) {
      const s = q.toLowerCase();
      list = list.filter(i =>
        (i.title + i.summary + i.tags.join(" ") + i.id).toLowerCase().includes(s)
      );
    }
    return list;
  }, [tab, cat, q]);

  const pinned = useMemo(() => ITEMS.filter(i => i.pinned), []);
  const recent = useMemo(() => ITEMS.slice(0, 6), []);

  return (
    <div className="space-y-6 os-fade-in">
      {/* Header */}
      <div className="os-glass p-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className={`w-12 h-12 rounded-2xl grid place-items-center ${TINT.indigo} border`}>
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-[240px]">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold">Knowledge Center</h2>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-200 border border-indigo-400/20">
                Living Library
              </span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10">
                Phase 1 · UI
              </span>
            </div>
            <p className="text-sm text-white/50 mt-1 max-w-2xl">
              SOPs, playbooks, templates and decision trees that power every agent and admin. One source of truth for how DigiFormation operates.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-100 text-sm">
            <Plus className="w-4 h-4" /> New Entry
          </button>
        </div>

        {/* Search */}
        <div className="mt-5 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
          <Search className="w-4 h-4 text-white/40" />
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search SOPs, playbooks, templates, decision trees…"
            className="bg-transparent text-sm outline-none flex-1 placeholder:text-white/30" />
          <span className="text-[11px] text-white/40 px-2 py-0.5 rounded bg-white/5 border border-white/10">⌘ K</span>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Total entries"   value={64} tint="indigo"  icon={BookOpen} />
          <Kpi label="SOPs"            value={12} tint="cyan"    icon={ListChecks} />
          <Kpi label="Playbooks"       value={9}  tint="pink"    icon={BookMarked} />
          <Kpi label="Agent knowledge" value={6}  tint="emerald" icon={Bot} />
        </div>
      </div>

      {/* Categories */}
      <div className="os-glass p-5">
        <div className="text-xs uppercase tracking-wider text-white/40 mb-3">Categories</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {CATEGORIES.map(c => {
            const Icon = c.icon;
            const a = cat === c.id;
            return (
              <button key={c.id} onClick={() => setCat(c.id)}
                className={`text-left p-3 rounded-xl border transition ${
                  a ? `${TINT[c.tint]} ring-1 ring-white/10`
                    : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] text-white/80"
                }`}>
                <div className="flex items-center justify-between">
                  <Icon className="w-4 h-4" />
                  <span className="text-[11px] opacity-70">{c.count}</span>
                </div>
                <div className="mt-2 text-sm font-semibold">{c.label}</div>
                <div className="text-[11px] opacity-60 mt-0.5 line-clamp-1">{c.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="os-glass p-3 flex gap-1.5 flex-wrap">
        {TABS.map(t => {
          const Icon = t.icon;
          const a = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition border ${
                a ? "bg-indigo-500/15 border-indigo-400/30 text-indigo-100"
                  : "bg-white/5 border-white/10 text-white/60 hover:text-white/90 hover:bg-white/10"
              }`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
        <div className="ml-auto inline-flex items-center gap-2 text-xs text-white/50">
          <Filter className="w-3.5 h-3.5" /> {filtered.length} results
        </div>
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {tab === "agents" ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {AGENTS.map(a => (
                <div key={a.id} className={`os-glass p-4 border ${TINT.emerald}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl grid place-items-center ${TINT.emerald} border`}><Bot className="w-4 h-4" /></div>
                    <div>
                      <div className="font-semibold">{a.name}</div>
                      <div className="text-[11px] text-white/50">{a.docs} linked documents</div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {a.sources.map(s => (
                      <div key={s} className="text-xs text-white/70 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-white/40" /> {s}
                      </div>
                    ))}
                  </div>
                  <button className="mt-4 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80">
                    Manage Knowledge <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <>
              {filtered.map(i => (
                <button key={i.id} onClick={() => setOpen(i)}
                  className="w-full text-left os-glass p-4 hover:bg-white/[0.04] transition">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl grid place-items-center border ${TINT[TYPE_TINT[i.type]]}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {i.pinned && <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300/60" />}
                        <span className="font-semibold truncate">{i.title}</span>
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${TINT[TYPE_TINT[i.type]]}`}>{i.type}</span>
                      </div>
                      <p className="text-xs text-white/55 mt-1 line-clamp-2">{i.summary}</p>
                      <div className="mt-2 flex items-center gap-3 flex-wrap text-[11px] text-white/50">
                        <span className="font-mono">{i.id}</span>
                        <span>· {i.author}</span>
                        <span>· Updated {i.updated}</span>
                        <span>· {i.reads} reads</span>
                        <div className="flex gap-1 ml-auto">
                          {i.tags.map(t => (
                            <span key={t} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] inline-flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5" /> {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="os-glass p-10 text-center text-sm text-white/50">No entries match your filters.</div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="os-glass p-5">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-amber-300" />
              <div className="text-sm font-semibold">Pinned</div>
            </div>
            <ul className="space-y-2">
              {pinned.map(p => (
                <li key={p.id}>
                  <button onClick={() => setOpen(p)} className="w-full text-left p-2 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06]">
                    <div className="text-sm font-medium line-clamp-1">{p.title}</div>
                    <div className="text-[11px] text-white/50 mt-0.5">{p.type} · {p.updated}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="os-glass p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-cyan-300" />
              <div className="text-sm font-semibold">Recently Updated</div>
            </div>
            <ul className="space-y-2">
              {recent.map(r => (
                <li key={r.id} className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-white/[0.04]">
                  <button onClick={() => setOpen(r)} className="text-left flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{r.title}</div>
                    <div className="text-[11px] text-white/50">{r.author} · {r.updated}</div>
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-white/40" />
                </li>
              ))}
            </ul>
          </div>

          <div className="os-glass p-5">
            <div className="text-xs uppercase tracking-wider text-white/40 mb-3">Top Tags</div>
            <div className="flex flex-wrap gap-1.5">
              {["UK Ltd","Stripe","Wise","CS","KYC","Refund","WhatsApp","Silver","Reminder","Deliverability","OCR","Policy"].map(t => (
                <span key={t} className="text-[11px] px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70 inline-flex items-center gap-1">
                  <Tag className="w-3 h-3" /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {open && <DetailDrawer item={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Kpi({ label, value, tint, icon: Icon }: { label: string; value: number; tint: string; icon: any }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg grid place-items-center border ${TINT[tint]}`}><Icon className="w-4 h-4" /></div>
      <div>
        <div className="text-xl font-bold leading-none">{value}</div>
        <div className="text-[11px] text-white/50 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function DetailDrawer({ item, onClose }: { item: Item; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-xl h-full bg-[#0b0f1a] border-l border-white/10 p-6 overflow-y-auto os-fade-in">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl grid place-items-center border ${TINT[TYPE_TINT[item.type]]}`}>
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wider text-white/40">{item.id} · {item.type}</div>
              <div className="font-semibold leading-tight">{item.title}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 grid place-items-center text-white/70">×</button>
        </div>

        <div className="flex gap-2 mt-4 flex-wrap text-[11px] text-white/60">
          <span>{item.author}</span><span>·</span>
          <span>Updated {item.updated}</span><span>·</span>
          <span>{item.reads} reads</span>
        </div>

        <p className="text-sm text-white/75 mt-5">{item.summary}</p>

        <div className="mt-6">
          <div className="text-xs uppercase tracking-wider text-white/40 mb-2">Sample Content</div>
          <ol className="space-y-2 text-sm text-white/80 list-decimal pl-5">
            <li>Confirm prerequisites and required documents.</li>
            <li>Notify client through the preferred channel.</li>
            <li>Execute the workflow inside Business OS.</li>
            <li>Log the outcome and update related reminders.</li>
            <li>Hand off to the next responsible agent or admin.</li>
          </ol>
        </div>

        <div className="mt-6 flex flex-wrap gap-1.5">
          {item.tags.map(t => (
            <span key={t} className="text-[11px] px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/70 inline-flex items-center gap-1">
              <Tag className="w-3 h-3" /> {t}
            </span>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-400/30 bg-indigo-500/15 text-indigo-100 px-3 py-2.5 text-sm"><Eye className="w-4 h-4" /> Open Full</button>
          <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-white/80 px-3 py-2.5 text-sm"><Pencil className="w-4 h-4" /> Edit</button>
        </div>
      </div>
    </div>
  );
}
