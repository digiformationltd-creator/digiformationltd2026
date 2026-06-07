import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Users, UserPlus, Building2, CalendarClock, Send, MessageSquare, ShieldAlert,
  Search, Filter, FileText, Megaphone, Bell, Lock, Inbox,
} from "lucide-react";

type Contact = {
  id: string;
  phone_e164: string;
  display_name: string | null;
  country: string | null;
  source: string | null;
  tags: string[] | null;
  opt_in_status: "pending" | "opted_in" | "opted_out" | "blocked";
  user_id: string | null;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  last_broadcast_at: string | null;
  created_at: string;
};

type Template = {
  id: string;
  name: string;
  language: string;
  category: string;
  status: string;
  body_text: string | null;
};

type Broadcast = {
  id: string;
  name: string;
  status: string;
  total_recipients: number | null;
  sent_count: number | null;
  scheduled_at: string | null;
  created_at: string;
};

type Tab = "dashboard" | "contacts" | "templates" | "broadcasts" | "reminders" | "audit";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: MessageSquare },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "templates", label: "Templates", icon: FileText },
  { id: "broadcasts", label: "Broadcasts", icon: Megaphone },
  { id: "reminders", label: "Reminders", icon: Bell },
  { id: "audit", label: "Audit", icon: ShieldAlert },
];

export default function OsWhatsAppCRM() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [c, t, b, co, o] = await Promise.all([
      supabase.from("whatsapp_contacts").select("*").order("created_at", { ascending: false }).limit(2000),
      supabase.from("whatsapp_templates").select("*").order("created_at", { ascending: false }),
      supabase.from("whatsapp_broadcasts").select("*").order("created_at", { ascending: false }),
      supabase.from("client_company_details").select("user_id,company_name,confirmation_due,accounts_filing_due,address_expire"),
      supabase.from("client_orders").select("id,user_id,customer_whatsapp,customer_email,order_ref,service,status,created_at").order("created_at", { ascending: false }).limit(2000),
    ]);
    if (c.error) toast.error(c.error.message);
    setContacts((c.data || []) as Contact[]);
    setTemplates((t.data || []) as Template[]);
    setBroadcasts((b.data || []) as Broadcast[]);
    setCompanies(co.data || []);
    setOrders(o.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const now = Date.now();
    const monthMs = 30 * 24 * 60 * 60 * 1000;
    const usersWithCompany = new Set(companies.map(c => c.user_id));
    const upcomingDays = 60;
    const cutoff = new Date(Date.now() + upcomingDays * 24 * 60 * 60 * 1000);
    const upcomingUsers = new Set(
      companies.filter(c => {
        const dates = [c.confirmation_due, c.accounts_filing_due, c.address_expire]
          .filter(Boolean)
          .map(d => new Date(d as string));
        return dates.some(d => d <= cutoff && d.getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000);
      }).map(c => c.user_id),
    );
    return {
      total: contacts.length,
      newThisMonth: contacts.filter(c => now - new Date(c.created_at).getTime() < monthMs).length,
      guests: contacts.filter(c => !c.user_id).length,
      portal: contacts.filter(c => !!c.user_id).length,
      withCompany: contacts.filter(c => c.user_id && usersWithCompany.has(c.user_id)).length,
      missingCompany: contacts.filter(c => c.user_id && !usersWithCompany.has(c.user_id)).length,
      upcomingReminders: contacts.filter(c => c.user_id && upcomingUsers.has(c.user_id)).length,
      broadcastReady: contacts.filter(c => c.opt_in_status === "opted_in").length,
      optedOut: contacts.filter(c => c.opt_in_status === "opted_out" || c.opt_in_status === "blocked").length,
    };
  }, [contacts, companies]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500/30 to-emerald-500/20 grid place-items-center">
              <MessageSquare className="w-5 h-5 text-green-300" />
            </span>
            WhatsApp CRM
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Management-only. No live sending — provider not connected yet.
          </p>
        </div>
        <div className="os-glass px-3 py-2 rounded-xl flex items-center gap-2 text-xs text-amber-300">
          <Lock className="w-3.5 h-3.5" /> Live sending disabled in this phase
        </div>
      </div>

      <div className="os-glass p-1.5 rounded-2xl flex gap-1 overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3.5 h-9 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition ${
                active ? "bg-gradient-to-r from-green-500/30 to-emerald-500/20 text-white" : "text-white/55 hover:bg-white/5"
              }`}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="os-glass p-12 text-center text-white/40 text-sm">Loading CRM data…</div>
      ) : (
        <>
          {tab === "dashboard" && <DashboardView stats={stats} contacts={contacts} broadcasts={broadcasts} />}
          {tab === "contacts" && <ContactsView contacts={contacts} companies={companies} orders={orders} />}
          {tab === "templates" && <TemplatesView templates={templates} onChanged={load} />}
          {tab === "broadcasts" && <BroadcastsView broadcasts={broadcasts} templates={templates} contacts={contacts} onChanged={load} />}
          {tab === "reminders" && <RemindersView companies={companies} contacts={contacts} />}
          {tab === "audit" && <AuditView contacts={contacts} broadcasts={broadcasts} />}
        </>
      )}
    </div>
  );
}

/* ---------------- Dashboard ---------------- */

function StatCard({ label, value, icon: Icon, tone = "blue" }: any) {
  const tones: Record<string, string> = {
    blue: "from-blue-500/20 to-cyan-500/10 text-blue-300",
    green: "from-green-500/20 to-emerald-500/10 text-green-300",
    purple: "from-purple-500/20 to-pink-500/10 text-purple-300",
    amber: "from-amber-500/20 to-orange-500/10 text-amber-300",
    red: "from-red-500/20 to-rose-500/10 text-red-300",
    lime: "from-lime-500/20 to-green-500/10 text-lime-300",
  };
  return (
    <div className="os-glass p-4 rounded-2xl">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-white/45">{label}</span>
        <span className={`w-8 h-8 rounded-xl bg-gradient-to-br grid place-items-center ${tones[tone]}`}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <div className="mono text-2xl font-bold mt-2">{value}</div>
    </div>
  );
}

function DashboardView({ stats, contacts, broadcasts }: any) {
  const recent = contacts.slice(0, 8);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total Contacts" value={stats.total} icon={Users} tone="blue" />
        <StatCard label="New (30d)" value={stats.newThisMonth} icon={UserPlus} tone="green" />
        <StatCard label="Guest Leads" value={stats.guests} icon={Inbox} tone="amber" />
        <StatCard label="Portal Clients" value={stats.portal} icon={Users} tone="purple" />
        <StatCard label="With Company" value={stats.withCompany} icon={Building2} tone="lime" />
        <StatCard label="Missing Company" value={stats.missingCompany} icon={Building2} tone="amber" />
        <StatCard label="Upcoming Reminders" value={stats.upcomingReminders} icon={CalendarClock} tone="red" />
        <StatCard label="Broadcast Ready" value={stats.broadcastReady} icon={Send} tone="green" />
        <StatCard label="Opted Out" value={stats.optedOut} icon={ShieldAlert} tone="red" />
        <StatCard label="Broadcast Drafts" value={broadcasts.length} icon={Megaphone} tone="purple" />
      </div>

      <div className="os-glass p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Recently captured WhatsApp contacts</h3>
          <span className="text-xs text-white/40">Auto-captured from orders & inquiries</span>
        </div>
        <div className="divide-y divide-white/5">
          {recent.length === 0 && <div className="text-sm text-white/40 py-6 text-center">No contacts yet.</div>}
          {recent.map((c: Contact) => (
            <Link key={c.id} to={`/admin/whatsapp/${c.id}`} className="flex items-center justify-between py-3 hover:bg-white/5 -mx-2 px-2 rounded-lg">
              <div>
                <div className="font-medium text-sm">{c.display_name || "Unnamed"}</div>
                <div className="mono text-xs text-white/45">{c.phone_e164}</div>
              </div>
              <div className="flex items-center gap-2">
                <OptBadge status={c.opt_in_status} />
                {c.source && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300">{c.source}</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function OptBadge({ status }: { status: Contact["opt_in_status"] }) {
  const map: Record<string, string> = {
    pending: "bg-white/10 text-white/60",
    opted_in: "bg-green-500/20 text-green-300",
    opted_out: "bg-red-500/20 text-red-300",
    blocked: "bg-red-500/30 text-red-200",
  };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full ${map[status]}`}>{status}</span>;
}

/* ---------------- Contacts ---------------- */

const CONTACT_FILTERS = [
  { id: "all", label: "All" },
  { id: "guest", label: "Guest leads" },
  { id: "portal", label: "Portal clients" },
  { id: "with_company", label: "With company" },
  { id: "missing_company", label: "Missing company" },
  { id: "reminders", label: "Upcoming reminders" },
  { id: "opted_out", label: "Suppressed" },
] as const;

function ContactsView({ contacts, companies, orders }: any) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<typeof CONTACT_FILTERS[number]["id"]>("all");

  const usersWithCompany = useMemo(() => new Set(companies.map((c: any) => c.user_id)), [companies]);
  const cutoff = Date.now() + 60 * 24 * 60 * 60 * 1000;
  const upcomingUsers = useMemo(() => new Set(
    companies.filter((c: any) => {
      const dates = [c.confirmation_due, c.accounts_filing_due, c.address_expire].filter(Boolean);
      return dates.some((d: string) => new Date(d).getTime() <= cutoff);
    }).map((c: any) => c.user_id),
  ), [companies, cutoff]);
  const lastOrderByContact = useMemo(() => {
    const m: Record<string, any> = {};
    for (const o of orders) {
      const k = (o.customer_whatsapp || "").replace(/\D/g, "");
      if (!k) continue;
      if (!m[k]) m[k] = o;
    }
    return m;
  }, [orders]);
  const companyByUser = useMemo(() => {
    const m: Record<string, any> = {};
    for (const c of companies) if (c.user_id && !m[c.user_id]) m[c.user_id] = c;
    return m;
  }, [companies]);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return (contacts as Contact[]).filter(c => {
      if (filter === "guest" && c.user_id) return false;
      if (filter === "portal" && !c.user_id) return false;
      if (filter === "with_company" && (!c.user_id || !usersWithCompany.has(c.user_id))) return false;
      if (filter === "missing_company" && (!c.user_id || usersWithCompany.has(c.user_id))) return false;
      if (filter === "reminders" && (!c.user_id || !upcomingUsers.has(c.user_id))) return false;
      if (filter === "opted_out" && c.opt_in_status !== "opted_out" && c.opt_in_status !== "blocked") return false;
      if (!needle) return true;
      const key = c.phone_e164.replace(/\D/g, "");
      const lo = lastOrderByContact[key];
      const co = c.user_id ? companyByUser[c.user_id] : null;
      return [c.display_name, c.phone_e164, lo?.customer_email, co?.company_name, lo?.order_ref]
        .filter(Boolean).join(" ").toLowerCase().includes(needle);
    });
  }, [contacts, q, filter, usersWithCompany, upcomingUsers, lastOrderByContact, companyByUser]);

  return (
    <div className="space-y-3">
      <div className="os-glass p-3 rounded-2xl flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-white/40" />
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search name, phone, email, company, order…"
            className="bg-transparent flex-1 h-9 outline-none text-sm" />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-white/40 shrink-0" />
          {CONTACT_FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`text-[11px] h-7 px-2.5 rounded-lg whitespace-nowrap ${
                filter === f.id ? "bg-white/15 text-white" : "text-white/50 hover:bg-white/5"
              }`}>{f.label}</button>
          ))}
        </div>
      </div>

      <div className="os-glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-white/40 border-b border-white/5">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">WhatsApp</th>
                <th className="text-left px-4 py-3">Company</th>
                <th className="text-left px-4 py-3">Latest Order</th>
                <th className="text-left px-4 py-3">Source</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(c => {
                const key = c.phone_e164.replace(/\D/g, "");
                const lo = lastOrderByContact[key];
                const co = c.user_id ? companyByUser[c.user_id] : null;
                const last = c.last_inbound_at || c.last_outbound_at || c.created_at;
                return (
                  <tr key={c.id} className="hover:bg-white/5">
                    <td className="px-4 py-3">
                      <Link to={`/admin/whatsapp/${c.id}`} className="font-medium hover:underline">
                        {c.display_name || lo?.customer_email || "Unnamed"}
                      </Link>
                      <div className="text-[10px] text-white/40">{c.user_id ? "Portal client" : "Guest"}</div>
                    </td>
                    <td className="px-4 py-3 mono text-xs">{c.phone_e164}</td>
                    <td className="px-4 py-3 text-xs">{co?.company_name || <span className="text-white/30">—</span>}</td>
                    <td className="px-4 py-3 text-xs">
                      {lo ? <><span className="mono">{lo.order_ref}</span><div className="text-white/40">{lo.service}</div></> : <span className="text-white/30">—</span>}
                    </td>
                    <td className="px-4 py-3"><span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300">{c.source || "manual"}</span></td>
                    <td className="px-4 py-3"><OptBadge status={c.opt_in_status} /></td>
                    <td className="px-4 py-3 text-xs text-white/50">{new Date(last).toLocaleDateString()}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center text-white/40 py-10 text-sm">No contacts match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Templates ---------------- */

function TemplatesView({ templates, onChanged }: { templates: Template[]; onChanged: () => void }) {
  const [editing, setEditing] = useState<Template | null>(null);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {templates.map(t => (
          <div key={t.id} className="os-glass p-4 rounded-2xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-sm">{t.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">{t.category}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/50">{t.language}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">{t.status}</span>
                </div>
              </div>
              <button onClick={() => setEditing(t)} className="text-xs text-blue-300 hover:underline">Edit</button>
            </div>
            <div className="mt-3 text-xs text-white/70 bg-black/30 rounded-lg p-3 whitespace-pre-wrap font-mono">
              {t.body_text || <span className="text-white/30">No body yet</span>}
            </div>
          </div>
        ))}
        {templates.length === 0 && <div className="os-glass p-8 text-center text-white/40 text-sm">No templates.</div>}
      </div>
      <div className="os-glass p-3 rounded-2xl text-xs text-white/50 flex items-center gap-2">
        <Lock className="w-3.5 h-3.5" /> Templates are drafts. They'll be submitted to Meta when the WhatsApp provider is connected.
      </div>
      {editing && <TemplateEditor template={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onChanged(); }} />}
    </div>
  );
}

function TemplateEditor({ template, onClose, onSaved }: { template: Template; onClose: () => void; onSaved: () => void }) {
  const [body, setBody] = useState(template.body_text || "");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("whatsapp_templates").update({ body_text: body }).eq("id", template.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Template draft saved");
    onSaved();
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
      <div className="os-glass-strong w-full max-w-xl p-6 rounded-2xl">
        <h3 className="font-bold text-lg mb-1">{template.name}</h3>
        <p className="text-xs text-white/50 mb-4">Draft — not yet submitted to Meta.</p>
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={10}
          className="w-full bg-black/30 rounded-lg p-3 text-sm font-mono outline-none border border-white/10" />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="h-9 px-4 rounded-xl text-sm border border-white/10 hover:bg-white/5">Cancel</button>
          <button disabled={saving} onClick={save} className="h-9 px-5 rounded-xl text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white disabled:opacity-50">
            {saving ? "Saving…" : "Save Draft"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Broadcasts ---------------- */

function BroadcastsView({ broadcasts, templates, contacts, onChanged }: any) {
  const [showNew, setShowNew] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/50">Draft broadcasts. No real WhatsApp messages will be sent.</p>
        <button onClick={() => setShowNew(true)}
          className="h-9 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white flex items-center gap-2">
          <Megaphone className="w-3.5 h-3.5" /> New Draft
        </button>
      </div>
      <div className="os-glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase tracking-wider text-white/40 border-b border-white/5">
            <tr><th className="text-left px-4 py-3">Name</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Recipients</th><th className="px-4 py-3 text-left">Created</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {broadcasts.map((b: Broadcast) => (
              <tr key={b.id} className="hover:bg-white/5">
                <td className="px-4 py-3 font-medium">{b.name}</td>
                <td className="px-4 py-3"><span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">{b.status}</span></td>
                <td className="px-4 py-3 mono text-xs">{b.total_recipients ?? 0}</td>
                <td className="px-4 py-3 text-xs text-white/50">{new Date(b.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {broadcasts.length === 0 && <tr><td colSpan={4} className="text-center text-white/40 py-10 text-sm">No drafts yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {showNew && <NewBroadcast templates={templates} contacts={contacts} onClose={() => setShowNew(false)} onSaved={() => { setShowNew(false); onChanged(); }} />}
    </div>
  );
}

function NewBroadcast({ templates, contacts, onClose, onSaved }: any) {
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState<string>(templates[0]?.id || "");
  const [audience, setAudience] = useState<"opted_in" | "portal" | "all">("opted_in");
  const [saving, setSaving] = useState(false);

  const tmpl = templates.find((t: Template) => t.id === templateId);
  const audienceCount = useMemo(() => {
    return (contacts as Contact[]).filter(c => {
      if (audience === "opted_in") return c.opt_in_status === "opted_in";
      if (audience === "portal") return !!c.user_id && c.opt_in_status !== "opted_out" && c.opt_in_status !== "blocked";
      return c.opt_in_status !== "opted_out" && c.opt_in_status !== "blocked";
    }).length;
  }, [contacts, audience]);

  const save = async () => {
    if (!name.trim() || !templateId) return toast.error("Name and template required");
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("whatsapp_broadcasts").insert({
      name, template_id: templateId, status: "draft" as any,
      audience_filter: { type: audience },
      total_recipients: audienceCount, created_by: u.user?.id,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Draft saved");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
      <div className="os-glass-strong w-full max-w-lg p-6 rounded-2xl">
        <h3 className="font-bold text-lg mb-4">New Broadcast (Draft)</h3>
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="text-xs text-white/50 block mb-1">Campaign name</span>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full h-10 rounded-lg px-3 bg-black/30 border border-white/10 outline-none" />
          </label>
          <label className="block">
            <span className="text-xs text-white/50 block mb-1">Template</span>
            <select value={templateId} onChange={e => setTemplateId(e.target.value)} className="w-full h-10 rounded-lg px-3 bg-black/30 border border-white/10 outline-none">
              {templates.map((t: Template) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-white/50 block mb-1">Audience</span>
            <select value={audience} onChange={e => setAudience(e.target.value as any)} className="w-full h-10 rounded-lg px-3 bg-black/30 border border-white/10 outline-none">
              <option value="opted_in">Opted-in only (safest)</option>
              <option value="portal">All portal clients (not opted-out)</option>
              <option value="all">All contacts (not opted-out)</option>
            </select>
          </label>
          <div className="os-glass p-3 rounded-xl text-xs">
            <div className="flex items-center justify-between">
              <span className="text-white/50">Estimated audience</span>
              <span className="mono font-semibold text-green-300">{audienceCount}</span>
            </div>
            {tmpl?.body_text && (
              <div className="mt-3 bg-black/30 rounded-lg p-2 font-mono whitespace-pre-wrap text-white/70 max-h-32 overflow-auto">{tmpl.body_text}</div>
            )}
          </div>
          <div className="os-glass p-3 rounded-xl text-xs text-amber-300 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <div>Safety: opt-out respected, 1 broadcast / contact / 14 days, quiet hours 22:00–08:00 enforced when provider goes live.</div>
          </div>
        </div>
        <div className="flex justify-between items-center mt-5">
          <button onClick={() => toast.error("WhatsApp provider not connected yet.")} className="h-9 px-4 rounded-xl text-xs font-semibold border border-white/10 text-white/40 cursor-not-allowed">
            <Send className="w-3.5 h-3.5 inline mr-1.5" /> Send Now
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="h-9 px-4 rounded-xl text-sm border border-white/10 hover:bg-white/5">Cancel</button>
            <button disabled={saving} onClick={save} className="h-9 px-5 rounded-xl text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white disabled:opacity-50">
              {saving ? "Saving…" : "Save Draft"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Reminders ---------------- */

function RemindersView({ companies, contacts }: any) {
  const contactByUser = useMemo(() => {
    const m: Record<string, Contact> = {};
    for (const c of contacts as Contact[]) if (c.user_id && !m[c.user_id]) m[c.user_id] = c;
    return m;
  }, [contacts]);
  const now = Date.now();
  const horizon = now + 90 * 24 * 60 * 60 * 1000;

  const rows: { type: string; date: string; company: string; contact: Contact | null }[] = [];
  for (const c of companies) {
    const contact = contactByUser[c.user_id];
    if (!contact) continue;
    const checks: [string, string | null][] = [
      ["Confirmation statement", c.confirmation_due],
      ["Annual accounts", c.accounts_filing_due],
      ["Registered address renewal", c.address_expire],
    ];
    for (const [type, date] of checks) {
      if (!date) continue;
      const ts = new Date(date).getTime();
      if (ts >= now - 7 * 24 * 60 * 60 * 1000 && ts <= horizon) {
        rows.push({ type, date, company: c.company_name || "—", contact });
      }
    }
  }
  rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="os-glass rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-white/5 text-xs text-white/50">
        WhatsApp reminder candidates — within 90 days. (Will send via WhatsApp once provider is connected; aligned with existing email reminder logic.)
      </div>
      <table className="w-full text-sm">
        <thead className="text-[11px] uppercase tracking-wider text-white/40 border-b border-white/5">
          <tr><th className="text-left px-4 py-3">Reminder</th><th className="px-4 py-3 text-left">Due</th><th className="px-4 py-3 text-left">Company</th><th className="px-4 py-3 text-left">Contact</th><th className="px-4 py-3 text-left">Status</th></tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-white/5">
              <td className="px-4 py-3 font-medium">{r.type}</td>
              <td className="px-4 py-3 mono text-xs">{r.date}</td>
              <td className="px-4 py-3 text-xs">{r.company}</td>
              <td className="px-4 py-3 text-xs">
                <Link to={`/admin/whatsapp/${r.contact!.id}`} className="hover:underline">
                  {r.contact!.display_name || r.contact!.phone_e164}
                </Link>
              </td>
              <td className="px-4 py-3"><OptBadge status={r.contact!.opt_in_status} /></td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={5} className="text-center text-white/40 py-10 text-sm">No upcoming reminders.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Audit ---------------- */

function AuditView({ contacts, broadcasts }: any) {
  const sources = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of contacts as Contact[]) m[c.source || "manual"] = (m[c.source || "manual"] || 0) + 1;
    return m;
  }, [contacts]);
  const optBuckets = useMemo(() => {
    const m: Record<string, number> = { pending: 0, opted_in: 0, opted_out: 0, blocked: 0 };
    for (const c of contacts as Contact[]) m[c.opt_in_status] = (m[c.opt_in_status] || 0) + 1;
    return m;
  }, [contacts]);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <div className="os-glass p-4 rounded-2xl">
        <h3 className="font-semibold text-sm mb-3">Contacts by source</h3>
        <div className="space-y-2">
          {Object.entries(sources).map(([s, n]) => (
            <div key={s} className="flex items-center justify-between text-sm">
              <span className="text-white/70">{s}</span><span className="mono text-white/50">{n}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="os-glass p-4 rounded-2xl">
        <h3 className="font-semibold text-sm mb-3">Opt-in distribution</h3>
        <div className="space-y-2">
          {Object.entries(optBuckets).map(([s, n]) => (
            <div key={s} className="flex items-center justify-between text-sm">
              <span className="text-white/70">{s}</span><span className="mono text-white/50">{n}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="os-glass p-4 rounded-2xl lg:col-span-2">
        <h3 className="font-semibold text-sm mb-3">Broadcast log</h3>
        <div className="text-xs text-white/50">
          {broadcasts.length === 0
            ? "No broadcasts created yet."
            : `${broadcasts.length} draft(s). No live sends recorded — provider not connected.`}
        </div>
      </div>
    </div>
  );
}
