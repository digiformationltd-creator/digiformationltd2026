import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Building2, FileText, ShoppingBag, Clock, MessageSquare, ShieldAlert, Lock } from "lucide-react";

export default function OsWhatsAppContactDetail() {
  const { id } = useParams();
  const [contact, setContact] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: c } = await supabase.from("whatsapp_contacts").select("*").eq("id", id).maybeSingle();
      setContact(c);
      if (c) {
        const digits = (c.phone_e164 as string).replace(/\D/g, "");
        const [p, co, o, inv, dc, msg] = await Promise.all([
          c.user_id ? supabase.from("profiles").select("*").eq("user_id", c.user_id).maybeSingle() : Promise.resolve({ data: null }),
          c.user_id ? supabase.from("client_company_details").select("*").eq("user_id", c.user_id).maybeSingle() : Promise.resolve({ data: null }),
          supabase.from("client_orders").select("*").or(`customer_whatsapp.ilike.%${digits}%${c.user_id ? `,user_id.eq.${c.user_id}` : ""}`).order("created_at", { ascending: false }),
          c.user_id ? supabase.from("invoices").select("*").eq("user_id", c.user_id).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
          c.user_id ? supabase.from("client_documents").select("*").eq("user_id", c.user_id).order("created_at", { ascending: false }).limit(10) : Promise.resolve({ data: [] }),
          supabase.from("whatsapp_message_log").select("*").eq("contact_id", c.id).order("created_at", { ascending: false }).limit(50),
        ]);
        setProfile(p.data);
        setCompany(co.data);
        setOrders(o.data || []);
        setInvoices(inv.data || []);
        setDocs(dc.data || []);
        setMessages(msg.data || []);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="os-glass p-12 text-center text-white/40">Loading…</div>;
  if (!contact) return <div className="os-glass p-12 text-center text-white/50">Contact not found.</div>;

  const cooldownDays = contact.last_broadcast_at
    ? Math.max(0, 14 - Math.floor((Date.now() - new Date(contact.last_broadcast_at).getTime()) / (24 * 60 * 60 * 1000)))
    : 0;
  const broadcastEligible = contact.opt_in_status === "opted_in" && cooldownDays === 0;

  return (
    <div className="space-y-4">
      <Link to="/admin/whatsapp" className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to WhatsApp CRM
      </Link>

      <div className="os-glass p-5 rounded-2xl">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500/30 to-emerald-500/10 grid place-items-center">
                <MessageSquare className="w-5 h-5 text-green-300" />
              </span>
              {contact.display_name || profile?.full_name || "Unnamed contact"}
            </h1>
            <div className="mono text-sm text-white/60 mt-1">{contact.phone_e164}</div>
            {profile?.email && <div className="text-xs text-white/45">{profile.email}</div>}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`text-[11px] px-2.5 py-1 rounded-full ${
              contact.opt_in_status === "opted_in" ? "bg-green-500/20 text-green-300" :
              contact.opt_in_status === "opted_out" || contact.opt_in_status === "blocked" ? "bg-red-500/20 text-red-300" :
              "bg-white/10 text-white/70"
            }`}>{contact.opt_in_status}</span>
            <span className="text-[10px] text-white/40">Source: {contact.source || "manual"}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <Kv label="Created" value={new Date(contact.created_at).toLocaleDateString()} />
          <Kv label="Last inbound" value={contact.last_inbound_at ? new Date(contact.last_inbound_at).toLocaleDateString() : "—"} />
          <Kv label="Last broadcast" value={contact.last_broadcast_at ? new Date(contact.last_broadcast_at).toLocaleDateString() : "—"} />
          <Kv label="Cooldown" value={cooldownDays > 0 ? `${cooldownDays}d left` : "Ready"} tone={cooldownDays > 0 ? "amber" : "green"} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section icon={Building2} title="Linked company">
          {company ? (
            <div className="space-y-1 text-sm">
              <div className="font-semibold">{company.company_name}</div>
              <div className="text-xs text-white/50 mono">{company.company_number}</div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <Kv label="Confirmation due" value={company.confirmation_due || "—"} />
                <Kv label="Accounts due" value={company.accounts_filing_due || "—"} />
                <Kv label="Address expires" value={company.address_expire || "—"} />
                <Kv label="Incorporated" value={company.incorporation_date || "—"} />
              </div>
            </div>
          ) : <Empty>No company linked yet.</Empty>}
        </Section>

        <Section icon={ShieldAlert} title="Broadcast eligibility">
          <div className="space-y-2 text-sm">
            <Row label="Opt-in" ok={contact.opt_in_status === "opted_in"}>{contact.opt_in_status}</Row>
            <Row label="14-day cooldown" ok={cooldownDays === 0}>{cooldownDays > 0 ? `${cooldownDays} days remaining` : "Clear"}</Row>
            <Row label="Quiet hours respected" ok>Enforced at send time</Row>
            <Row label="Provider connected" ok={false}>Not connected (CRM-only phase)</Row>
            <div className={`mt-3 text-xs px-3 py-2 rounded-lg ${broadcastEligible ? "bg-green-500/10 text-green-300" : "bg-amber-500/10 text-amber-300"}`}>
              {broadcastEligible ? "Contact passes safety checks." : "Contact not currently broadcast-eligible."}
            </div>
          </div>
        </Section>

        <Section icon={ShoppingBag} title={`Orders (${orders.length})`}>
          {orders.length === 0 ? <Empty>No orders.</Empty> : (
            <ul className="divide-y divide-white/5 text-sm">
              {orders.slice(0, 8).map(o => (
                <li key={o.id} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="mono text-xs text-white/80">{o.order_ref}</div>
                    <div className="text-xs text-white/50">{o.service}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/60">{o.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section icon={FileText} title={`Invoices (${invoices.length})`}>
          {invoices.length === 0 ? <Empty>No invoices.</Empty> : (
            <ul className="divide-y divide-white/5 text-sm">
              {invoices.slice(0, 8).map((i: any) => (
                <li key={i.id} className="py-2 flex items-center justify-between">
                  <span className="mono text-xs">{i.invoice_number}</span>
                  <span className="mono text-xs text-white/60">£{Number(i.total || 0).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section icon={FileText} title={`Documents (${docs.length})`}>
          {docs.length === 0 ? <Empty>No documents.</Empty> : (
            <ul className="divide-y divide-white/5 text-sm">
              {docs.map((d: any) => (
                <li key={d.id} className="py-2 text-xs text-white/70">{d.title || d.file_name}</li>
              ))}
            </ul>
          )}
        </Section>

        <Section icon={Clock} title="Timeline">
          <ul className="space-y-2 text-xs">
            <TimelineItem date={contact.created_at} text="WhatsApp contact captured" />
            {orders.slice(0, 5).map(o => (
              <TimelineItem key={o.id} date={o.created_at} text={`Order ${o.order_ref} — ${o.service} (${o.status})`} />
            ))}
            {invoices.slice(0, 3).map((i: any) => (
              <TimelineItem key={i.id} date={i.created_at} text={`Invoice ${i.invoice_number} generated`} />
            ))}
            {company?.address_expire && <TimelineItem date={company.address_expire} text="Registered address renewal due" />}
            {company?.confirmation_due && <TimelineItem date={company.confirmation_due} text="Confirmation statement due" />}
            {company?.accounts_filing_due && <TimelineItem date={company.accounts_filing_due} text="Annual accounts due" />}
          </ul>
        </Section>
      </div>

      <Section icon={MessageSquare} title="Message history">
        {messages.length === 0 ? (
          <div className="text-xs text-white/50 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" /> No messages yet. Live WhatsApp messaging will appear here once the provider is connected.
          </div>
        ) : (
          <ul className="divide-y divide-white/5 text-sm">
            {messages.map((m: any) => (
              <li key={m.id} className="py-2">
                <div className="flex justify-between text-xs text-white/50">
                  <span>{m.direction} · {m.template_name || m.category}</span>
                  <span>{new Date(m.created_at).toLocaleString()}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, children }: any) {
  return (
    <div className="os-glass p-4 rounded-2xl">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Icon className="w-4 h-4 text-white/60" /> {title}</h3>
      {children}
    </div>
  );
}
function Kv({ label, value, tone }: any) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
      <div className={`text-sm font-medium ${tone === "amber" ? "text-amber-300" : tone === "green" ? "text-green-300" : ""}`}>{value}</div>
    </div>
  );
}
function Empty({ children }: any) { return <div className="text-xs text-white/40">{children}</div>; }
function Row({ label, ok, children }: any) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/60">{label}</span>
      <span className={`text-xs px-2 py-0.5 rounded-full ${ok ? "bg-green-500/20 text-green-300" : "bg-amber-500/20 text-amber-300"}`}>{children}</span>
    </div>
  );
}
function TimelineItem({ date, text }: { date: string; text: string }) {
  return (
    <li className="flex items-start gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 shrink-0" />
      <div className="flex-1">
        <div className="text-white/80">{text}</div>
        <div className="text-[10px] text-white/40 mono">{new Date(date).toLocaleString()}</div>
      </div>
    </li>
  );
}
