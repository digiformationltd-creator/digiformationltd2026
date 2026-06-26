import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, Search, Sparkles, ShieldCheck, Keyboard, Compass, Wrench,
  PlayCircle, ExternalLink,
} from "lucide-react";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "@/components/ui/accordion";
import {
  FAQS, MODULES, SHORTCUTS, SAFETY_LEVELS, TROUBLESHOOTING,
} from "@/businessos/lib/helpContent";
import { COMMANDS, CATEGORIES } from "@/businessos/lib/commandLibrary";
import WelcomeTour, { resetTour } from "@/businessos/components/WelcomeTour";

type TabId = "start" | "command" | "examples" | "safety" | "shortcuts" | "modules" | "faq" | "troubleshooting";

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "start",           label: "Get Started",     icon: PlayCircle },
  { id: "command",         label: "Command Center",  icon: Sparkles },
  { id: "examples",        label: "Examples",        icon: BookOpen },
  { id: "safety",          label: "Safety",          icon: ShieldCheck },
  { id: "shortcuts",       label: "Shortcuts",       icon: Keyboard },
  { id: "modules",         label: "Modules",         icon: Compass },
  { id: "faq",             label: "FAQ",             icon: BookOpen },
  { id: "troubleshooting", label: "Troubleshooting", icon: Wrench },
];

export default function OsHelpCenter() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabId>("start");
  const [tourOpen, setTourOpen] = useState(false);

  const q = query.trim().toLowerCase();
  const match = (s: string) => !q || s.toLowerCase().includes(q);

  const filteredFaqs = useMemo(
    () => FAQS.filter((f) => match(f.q) || match(f.a) || f.tags.some(match)),
    [q],
  );
  const filteredModules = useMemo(
    () => MODULES.filter((m) => match(m.name) || match(m.what) || match(m.when)),
    [q],
  );
  const filteredShortcuts = useMemo(
    () => SHORTCUTS.filter((s) => match(s.label) || match(s.keys) || match(s.scope)),
    [q],
  );
  const filteredExamples = useMemo(
    () => COMMANDS.filter((c) =>
      !c.systemOwned && (match(c.title) || match(c.description) || c.examples.some(match)),
    ),
    [q],
  );
  const filteredTrouble = useMemo(
    () => TROUBLESHOOTING.filter((t) => match(t.problem) || match(t.fix)),
    [q],
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="os-glass rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Help Center</h1>
            <p className="text-sm text-white/60 mt-1">
              Everything you need to operate Business OS confidently — no developer required.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { resetTour(); setTourOpen(true); }}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm bg-white/5 hover:bg-white/10"
            >
              <PlayCircle className="w-4 h-4" /> Restart tour
            </button>
            <Link
              to="/admin/automation/command-center"
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600"
            >
              <Sparkles className="w-4 h-4" /> Open Command Center
            </Link>
          </div>
        </div>

        <div className="relative mt-5">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search help — try “undo”, “invoice”, “shortcut”…"
            className="w-full h-11 rounded-xl pl-10 pr-3 text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-white/20"
          />
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabId)}>
        <TabsList className="bg-white/5 border border-white/10 flex-wrap h-auto p-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <TabsTrigger key={t.id} value={t.id} className="data-[state=active]:bg-white/10 gap-1.5">
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Get Started */}
        <TabsContent value="start" className="space-y-4">
          <Section title="What is Business OS?">
            <p className="text-sm text-white/75 leading-relaxed">
              Business OS is the internal admin workspace for DigiFormation. It centralises Leads,
              Clients, Companies, Orders, Invoices, Support, Compliance and Automation —
              the entire customer journey, one place, one source of truth.
            </p>
          </Section>
          <Section title="Your first 5 minutes">
            <ol className="text-sm text-white/75 space-y-2 list-decimal list-inside">
              <li>Skim the sidebar — every module is one click away.</li>
              <li>Open <strong>Dashboard</strong> to see today's KPIs.</li>
              <li>Open <strong>Automation → Command Center</strong> and try: <em>“Show recent activity”</em>.</li>
              <li>Review the <strong>Safety</strong> tab so you know how previews, approvals and undo work.</li>
              <li>Bookmark this Help Center. Press <kbd className="kbd">?</kbd> any time to reopen it.</li>
            </ol>
          </Section>
          <Section title="The golden rule">
            <p className="text-sm text-white/75">
              The AI never changes anything without your explicit approval. Every action
              previews first. Destructive actions require typing <code className="kbd">CONFIRM</code>.
            </p>
          </Section>
        </TabsContent>

        {/* Command Center */}
        <TabsContent value="command" className="space-y-4">
          <Section title="What the AI Command Center is">
            <ul className="text-sm text-white/75 space-y-1.5 list-disc list-inside">
              <li>A conversational admin assistant.</li>
              <li>A <strong>manual execution layer</strong> — you stay in control.</li>
              <li>Approval-first: nothing runs without a click.</li>
              <li>Safety-first: previews, risk tiers, undo and audit trail.</li>
            </ul>
          </Section>
          <Section title="Execution flow">
            <pre className="text-xs leading-6 text-white/70 bg-black/30 border border-white/10 rounded-xl p-4 overflow-x-auto">
{`Prompt
   ↓
Preview         ← see exactly what will change
   ↓
Approval        ← one click (or type CONFIRM if destructive)
   ↓
Execution
   ↓
Undo (≈10s)     ← available for eligible actions`}
            </pre>
          </Section>
          <Section title="What the AI cannot do">
            <ul className="text-sm text-white/75 space-y-1.5 list-disc list-inside">
              <li>Trigger system-owned automations (invoice generation, order confirmation email, scheduled reminders, email queue, DB triggers).</li>
              <li>Bypass approvals or undo windows.</li>
              <li>Send emails that duplicate transactional templates.</li>
              <li>Edit billing logic, taxes or auto-numbered references.</li>
            </ul>
          </Section>
        </TabsContent>

        {/* Examples */}
        <TabsContent value="examples" className="space-y-3">
          <p className="text-sm text-white/60">
            Browse by category. Click an example to copy it — then paste into the Command Center composer.
            Examples are copy-only here; nothing executes from this page.
          </p>
          <Accordion type="multiple" className="os-glass rounded-2xl px-4">
            {CATEGORIES.filter((c) => c.id !== "system").map((cat) => {
              const items = filteredExamples.filter((c) => c.category === cat.id);
              if (!items.length) return null;
              const Icon = cat.icon;
              return (
                <AccordionItem key={cat.id} value={cat.id} className="border-white/10">
                  <AccordionTrigger className="hover:no-underline">
                    <span className="flex items-center gap-2 text-sm">
                      <Icon className="w-4 h-4 text-white/70" /> {cat.label}
                      <span className="text-xs text-white/40">({items.length})</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 pb-2">
                      {items.flatMap((c) => c.examples.map((ex) => ({ ex, c }))).map(({ ex, c }, i) => (
                        <li key={`${c.id}-${i}`}>
                          <button
                            onClick={() => { navigator.clipboard?.writeText(ex); }}
                            className="w-full text-left p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 text-sm"
                            title="Copy example"
                          >
                            <div className="text-white/85">{ex}</div>
                            <div className="text-[11px] text-white/40 mt-0.5">{c.title} · click to copy</div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </TabsContent>

        {/* Safety */}
        <TabsContent value="safety" className="space-y-4">
          <Section title="Risk tiers">
            <div className="grid sm:grid-cols-3 gap-3">
              {SAFETY_LEVELS.map((s) => (
                <div key={s.level} className="rounded-xl border border-white/10 p-4">
                  <div className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold ${s.tone}`}>{s.level}</div>
                  <p className="text-xs text-white/70 mt-2 leading-relaxed">{s.description}</p>
                </div>
              ))}
            </div>
          </Section>
          <Section title="Controls">
            <dl className="text-sm text-white/75 space-y-2">
              <Row term="Preview" desc="Every action renders a diff (before → after) before it runs." />
              <Row term="Approval" desc="You must click Approve. Destructive actions require typing CONFIRM." />
              <Row term="Undo" desc="Eligible actions show an Undo button for ~10 seconds after execution." />
              <Row term="Rollback" desc="The state machine records every transition. Developers can rollback past the Undo window if needed." />
              <Row term="Audit trail" desc="Every command, preview, approval and execution is logged with actor and timestamp." />
            </dl>
          </Section>
          <Section title="System-owned automations">
            <p className="text-sm text-white/75">
              Invoices, order confirmation emails, scheduled reminders and the email queue
              run automatically in the background. The Command Center cannot trigger or
              duplicate them — by design. They appear in the library as <em>read-only</em>.
            </p>
          </Section>
        </TabsContent>

        {/* Shortcuts */}
        <TabsContent value="shortcuts" className="space-y-3">
          <div className="os-glass rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-xs text-white/50 bg-white/[0.03]">
                <tr>
                  <th className="text-left p-3 font-medium">Shortcut</th>
                  <th className="text-left p-3 font-medium">Action</th>
                  <th className="text-left p-3 font-medium">Scope</th>
                </tr>
              </thead>
              <tbody>
                {filteredShortcuts.map((s, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="p-3"><kbd className="kbd">{s.keys}</kbd></td>
                    <td className="p-3 text-white/85">{s.label}</td>
                    <td className="p-3 text-white/50 text-xs">{s.scope}</td>
                  </tr>
                ))}
                {filteredShortcuts.length === 0 && (
                  <tr><td colSpan={3} className="p-6 text-center text-white/40 text-sm">No shortcuts match “{query}”.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Modules */}
        <TabsContent value="modules" className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            {filteredModules.map((m) => (
              <Link
                key={m.path}
                to={m.path}
                className="os-glass rounded-2xl p-4 hover:bg-white/[0.06] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{m.name}</div>
                  <ExternalLink className="w-3.5 h-3.5 text-white/40" />
                </div>
                <p className="text-xs text-white/70 mt-1.5 leading-relaxed">{m.what}</p>
                <p className="text-[11px] text-white/45 mt-1.5"><span className="text-white/65">When to use: </span>{m.when}</p>
              </Link>
            ))}
            {filteredModules.length === 0 && (
              <p className="text-sm text-white/40 col-span-full text-center py-8">No modules match “{query}”.</p>
            )}
          </div>
        </TabsContent>

        {/* FAQ */}
        <TabsContent value="faq">
          <Accordion type="single" collapsible className="os-glass rounded-2xl px-4">
            {filteredFaqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-white/10">
                <AccordionTrigger className="text-left text-sm hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-white/75 leading-relaxed">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
            {filteredFaqs.length === 0 && (
              <div className="p-6 text-center text-white/40 text-sm">No FAQs match “{query}”.</div>
            )}
          </Accordion>
        </TabsContent>

        {/* Troubleshooting */}
        <TabsContent value="troubleshooting" className="space-y-3">
          {filteredTrouble.map((t, i) => (
            <div key={i} className="os-glass rounded-2xl p-4">
              <div className="text-sm font-semibold text-white/90">{t.problem}</div>
              <p className="text-sm text-white/70 mt-1.5 leading-relaxed">{t.fix}</p>
            </div>
          ))}
          {filteredTrouble.length === 0 && (
            <p className="text-sm text-white/40 text-center py-8">No items match “{query}”.</p>
          )}
        </TabsContent>
      </Tabs>

      <WelcomeTour open={tourOpen} onOpenChange={setTourOpen} />

      <style>{`
        .kbd {
          display: inline-flex; align-items: center; gap: 2px;
          padding: 2px 7px; font-size: 11px; font-family: ui-monospace, monospace;
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
          border-radius: 6px; color: rgba(255,255,255,0.85);
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="os-glass rounded-2xl p-5">
      <h2 className="text-sm font-semibold mb-3 text-white/90">{title}</h2>
      {children}
    </div>
  );
}

function Row({ term, desc }: { term: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <dt className="font-medium text-white/90 w-24 shrink-0">{term}</dt>
      <dd className="text-white/70">{desc}</dd>
    </div>
  );
}
