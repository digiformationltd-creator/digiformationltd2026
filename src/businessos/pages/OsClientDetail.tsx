// Native Business OS client workspace — /admin/clients/:id
// Replaces Legacy Admin's per-client workspace. All tabs read/write
// directly against existing tables (admin RLS already in place).
// No schema changes, no new edge functions.
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft, Building2, MapPin, FileText, Wallet, LifeBuoy, Mail,
  Loader2, Save, Plus, Upload, Trash2, Send, Download, CreditCard,
  Calendar, User, Phone, RefreshCw, ShoppingBag, Receipt,
} from "lucide-react";
import OsOrderDrawer from "../components/OsOrderDrawer";
import OsInvoiceDrawer from "../components/OsInvoiceDrawer";
import OsEmailHistoryPanel from "../components/OsEmailHistoryPanel";

type TabKey =
  | "company" | "addresses" | "orders" | "invoices" | "documents"
  | "wallet" | "subscriptions" | "tickets" | "emails";

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "company",       label: "Company",       icon: Building2 },
  { key: "addresses",     label: "Addresses",     icon: MapPin },
  { key: "orders",        label: "Orders",        icon: ShoppingBag },
  { key: "invoices",      label: "Invoices",      icon: Receipt },
  { key: "documents",     label: "Documents",     icon: FileText },
  { key: "wallet",        label: "Wallet",        icon: Wallet },
  { key: "subscriptions", label: "Subscriptions", icon: CreditCard },
  { key: "tickets",       label: "Support",       icon: LifeBuoy },
  { key: "emails",        label: "Emails",        icon: Mail },
];

const fmtGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n || 0);
const fmtDate = (s?: string | null) => {
  if (!s) return "—";
  try { return new Date(s).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return s; }
};

export default function OsClientDetail() {
  const { id: userId } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = (params.get("tab") as TabKey) || "company";

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const setTab = (t: TabKey) => { params.set("tab", t); setParams(params); };

  const loadProfile = async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
    setProfile(data);
    setLoading(false);
  };
  useEffect(() => { loadProfile(); }, [userId]);

  if (!userId) return null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="os-glass p-4 sm:p-5 flex items-start gap-4">
        <button
          onClick={() => navigate("/admin/clients")}
          className="h-10 w-10 rounded-xl bg-white/[0.05] hover:bg-white/[0.10] grid place-items-center shrink-0"
          title="Back to clients"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/40 to-purple-600/40 grid place-items-center text-sm font-bold shrink-0">
          {(profile?.full_name || profile?.email || "?").trim().slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-lg font-bold truncate">{profile?.full_name || "(no name)"}</div>
          <div className="text-xs text-white/60 flex flex-wrap gap-x-3 gap-y-1 mt-1">
            {profile?.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{profile.email}</span>}
            {profile?.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{profile.phone}</span>}
            {profile?.company_name && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{profile.company_name}</span>}
          </div>
          {loading && <div className="mt-2"><Loader2 className="w-3 h-3 animate-spin text-white/40" /></div>}
        </div>
      </div>

      {/* Tabs */}
      <div className="os-glass p-2 flex gap-1 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 px-3 h-9 rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition ${
                active ? "bg-white/[0.10] text-white" : "text-white/60 hover:bg-white/[0.04]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "company"       && <CompanyTab userId={userId} />}
      {tab === "addresses"     && <AddressesTab userId={userId} />}
      {tab === "orders"        && <OrdersTab userId={userId} email={profile?.email} />}
      {tab === "invoices"      && <InvoicesTab userId={userId} email={profile?.email} />}
      {tab === "documents"     && <DocumentsTab userId={userId} email={profile?.email} name={profile?.full_name} />}
      {tab === "wallet"        && <WalletTab userId={userId} />}
      {tab === "subscriptions" && <SubscriptionsTab userId={userId} />}
      {tab === "tickets"       && <TicketsTab userId={userId} />}
      {tab === "emails"        && <EmailsTab userId={userId} profile={profile} />}
    </div>
  );
}

// ─────────────────────────── COMPANY ───────────────────────────
function CompanyTab({ userId }: { userId: string }) {
  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("client_company_details").select("*").eq("user_id", userId).maybeSingle();
    setRow(data || { user_id: userId });
    setLoading(false);
  };
  useEffect(() => { load(); }, [userId]);

  const save = async () => {
    setSaving(true);
    const payload = { ...row, user_id: userId };
    const { error } = row?.id
      ? await supabase.from("client_company_details").update(payload).eq("id", row.id)
      : await supabase.from("client_company_details").insert(payload).select().single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Company saved");
    load();
  };

  const f = (k: string) => row?.[k] ?? "";
  const set = (k: string, v: string) => setRow({ ...row, [k]: v });
  const setDate = (k: string, v: string) => setRow({ ...row, [k]: v || null });

  if (loading) return <div className="os-glass p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-white/40" /></div>;

  return (
    <div className="os-glass p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Company name"        value={f("company_name")}        onChange={(v) => set("company_name", v)} />
        <Field label="Company number"      value={f("company_number")}      onChange={(v) => set("company_number", v)} />
        <Field label="Director name"       value={f("director_name")}       onChange={(v) => set("director_name", v)} />
        <Field label="SIC code"            value={f("sic_code")}            onChange={(v) => set("sic_code", v)} />
        <Field label="UTR number"          value={f("utr_number")}          onChange={(v) => set("utr_number", v)} />
        <Field label="Auth code"           value={f("auth_code")}           onChange={(v) => set("auth_code", v)} />
        <Field label="Activation code"     value={f("activation_code")}     onChange={(v) => set("activation_code", v)} />
        <Field label="CH personal code"    value={f("companies_house_personal_code")} onChange={(v) => set("companies_house_personal_code", v)} />
        <Field label="Registered address"  value={f("registered_address")}  onChange={(v) => set("registered_address", v)} colSpan={2} />
        <Field label="Correspondence address" value={f("correspondence_address")} onChange={(v) => set("correspondence_address", v)} colSpan={2} />
        <DateField label="Incorporation date"      value={f("incorporation_date")}      onChange={(v) => setDate("incorporation_date", v)} />
        <DateField label="Address start"           value={f("address_start")}           onChange={(v) => setDate("address_start", v)} />
        <DateField label="Address expire"          value={f("address_expire")}          onChange={(v) => setDate("address_expire", v)} />
        <DateField label="Confirmation due"        value={f("confirmation_due")}        onChange={(v) => setDate("confirmation_due", v)} />
        <DateField label="Accounts filing due"     value={f("accounts_filing_due")}     onChange={(v) => setDate("accounts_filing_due", v)} />
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="px-4 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save company
      </button>
    </div>
  );
}

// ─────────────────────────── ADDRESSES ───────────────────────────
function AddressesTab({ userId }: { userId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("client_addresses").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    setRows(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [userId]);

  const blank = () => setEditing({
    user_id: userId, label: "Registered Office", service_type: "registered_office",
    country: "United Kingdom", status: "active",
  });

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const payload = { ...editing, user_id: userId };
    const { error } = editing.id
      ? await supabase.from("client_addresses").update(payload).eq("id", editing.id)
      : await supabase.from("client_addresses").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Address saved");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    const { error } = await supabase.from("client_addresses").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Address deleted");
    load();
  };

  const f = (k: string) => editing?.[k] ?? "";
  const set = (k: string, v: any) => setEditing({ ...editing, [k]: v });

  if (loading) return <div className="os-glass p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-white/40" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-white/60">{rows.length} address{rows.length === 1 ? "" : "es"}</div>
        <button onClick={blank} className="px-3 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold inline-flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add address
        </button>
      </div>

      {rows.map((a) => (
        <div key={a.id} className="os-glass p-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{a.label}</span>
              <span className="text-[10px] uppercase tracking-widest text-white/40">{a.service_type}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${a.status === "active" ? "bg-emerald-500/15 text-emerald-200" : "bg-white/[0.05] text-white/50"}`}>{a.status}</span>
            </div>
            <div className="text-xs text-white/60 mt-1">
              {[a.address_line1, a.address_line2, a.city, a.county, a.postcode, a.country].filter(Boolean).join(", ") || "—"}
            </div>
            <div className="text-[11px] text-white/40 mt-1">
              Start {fmtDate(a.start_date)} · Expire {fmtDate(a.expire_date)}
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => setEditing(a)} className="h-8 px-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] text-xs">Edit</button>
            <button onClick={() => remove(a.id)} className="h-8 w-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 grid place-items-center"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      ))}

      {editing && (
        <div className="os-glass p-5 space-y-3 ring-1 ring-blue-400/30">
          <div className="text-sm font-semibold">{editing.id ? "Edit address" : "New address"}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Label" value={f("label")} onChange={(v) => set("label", v)} />
            <SelectField label="Service type" value={f("service_type")} onChange={(v) => set("service_type", v)} options={["registered_office", "director_service", "correspondence", "trading"]} />
            <Field label="Address line 1" value={f("address_line1")} onChange={(v) => set("address_line1", v)} colSpan={2} />
            <Field label="Address line 2" value={f("address_line2")} onChange={(v) => set("address_line2", v)} colSpan={2} />
            <Field label="City" value={f("city")} onChange={(v) => set("city", v)} />
            <Field label="County" value={f("county")} onChange={(v) => set("county", v)} />
            <Field label="Postcode" value={f("postcode")} onChange={(v) => set("postcode", v)} />
            <Field label="Country" value={f("country")} onChange={(v) => set("country", v)} />
            <DateField label="Start date" value={f("start_date")} onChange={(v) => set("start_date", v || null)} />
            <DateField label="Expire date" value={f("expire_date")} onChange={(v) => set("expire_date", v || null)} />
            <SelectField label="Status" value={f("status")} onChange={(v) => set("status", v)} options={["active", "expired", "pending"]} />
            <Field label="UTR number" value={f("utr_number")} onChange={(v) => set("utr_number", v)} />
            <Field label="Auth code" value={f("auth_code")} onChange={(v) => set("auth_code", v)} />
            <Field label="Activation code" value={f("activation_code")} onChange={(v) => set("activation_code", v)} />
            <Field label="Notes" value={f("notes")} onChange={(v) => set("notes", v)} colSpan={2} />
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-100 text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </button>
            <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] text-sm">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── ORDERS ───────────────────────────
function OrdersTab({ userId, email }: { userId: string; email?: string | null }) {
  const [rows, setRows] = useState<any[]>([]);
  const [invCounts, setInvCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: linked }, { data: guest }] = await Promise.all([
      supabase.from("client_orders").select("*").eq("user_id", userId).order("order_date", { ascending: false }),
      email
        ? supabase.from("client_orders").select("*").is("user_id", null).ilike("customer_email", email).order("order_date", { ascending: false })
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const merged = [...(linked || [])];
    for (const row of guest || []) {
      if (!merged.some((order) => order.id === row.id)) merged.push(row);
    }
    merged.sort((a, b) => new Date(b.order_date || b.created_at).getTime() - new Date(a.order_date || a.created_at).getTime());
    setRows(merged);

    // Invoice counts per order — gives admin a quick at-a-glance "is this billed?"
    if (merged.length) {
      const { data: invs } = await supabase
        .from("invoices")
        .select("order_id")
        .in("order_id", merged.map((o) => o.id));
      const counts: Record<string, number> = {};
      for (const inv of invs || []) {
        if (inv.order_id) counts[inv.order_id] = (counts[inv.order_id] || 0) + 1;
      }
      setInvCounts(counts);
    } else {
      setInvCounts({});
    }
    setLoading(false);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel(`os-cd-orders-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "client_orders", filter: `user_id=eq.${userId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, email]);

  const statusTone = (s: string) => {
    const k = (s || "").toLowerCase();
    if (k.includes("complete")) return "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30";
    if (k.includes("progress")) return "bg-blue-500/15 text-blue-200 ring-blue-400/30";
    if (k.includes("deliver")) return "bg-cyan-500/15 text-cyan-200 ring-cyan-400/30";
    if (k.includes("revision")) return "bg-purple-500/15 text-purple-200 ring-purple-400/30";
    if (k.includes("cancel")) return "bg-rose-500/15 text-rose-200 ring-rose-400/30";
    return "bg-amber-500/15 text-amber-200 ring-amber-400/30";
  };

  if (loading) return <div className="os-glass p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-white/40" /></div>;
  if (!rows.length) return <div className="os-glass p-8 text-center text-sm text-white/50">No orders for this client.</div>;

  const total = rows.reduce((s, o) => s + Number(o.amount_gbp || 0), 0);

  return (
    <div className="space-y-3">
      <div className="os-glass p-3 flex items-center justify-between text-xs">
        <span className="text-white/60">{rows.length} order{rows.length === 1 ? "" : "s"} · Qty {rows.length}</span>
        <span className="font-semibold">Total: {fmtGBP(total)}</span>
      </div>
      {rows.map((o) => {
        const cancelled = (o.status || "").toLowerCase().includes("cancel");
        const cancelOrder = async (e: React.MouseEvent) => {
          e.stopPropagation();
          if (cancelled) return;
          if (!window.confirm(`Cancel order ${o.order_ref || ""}? This cannot be undone from here.`)) return;
          const { error } = await supabase.from("client_orders").update({ status: "Cancelled" }).eq("id", o.id);
          if (error) { toast.error(error.message); return; }
          toast.success("Order cancelled");
          load();
        };
        return (
          <div key={o.id} className="os-glass p-3 hover:bg-white/[0.04]">
            <button onClick={() => setOpenId(o.id)} className="w-full text-left">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase tracking-wider text-white/40">Order #</span>
                    <span className="font-mono text-xs text-white/90">{o.order_ref || "Reference pending"}</span>
                    {!o.user_id && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-200">guest</span>}
                  </div>
                  <div className="text-sm font-semibold truncate mt-0.5">{o.service}</div>
                  <div className="text-[11px] text-white/50 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    <span>Qty 1</span>
                    <span>{fmtDate(o.order_date)}</span>
                    {o.customer_email && <span className="truncate">{o.customer_email}</span>}
                    {o.customer_whatsapp && <span>{o.customer_whatsapp}</span>}
                    <span>{invCounts[o.id] || 0} invoice{(invCounts[o.id] || 0) === 1 ? "" : "s"}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold">{fmtGBP(Number(o.amount_gbp))}</div>
                  <div className={`text-[10px] mt-1 px-2 py-0.5 rounded-full ring-1 inline-block ${statusTone(o.status)}`}>{o.status}</div>
                </div>
              </div>
            </button>
            <div className="mt-2 pt-2 border-t border-white/5 flex justify-end">
              <button
                onClick={cancelOrder}
                disabled={cancelled}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 ring-1 ring-rose-400/30 text-rose-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3 h-3" />
                {cancelled ? "Cancelled" : "Cancel order"}
              </button>
            </div>
          </div>
        );
      })}
      <OsOrderDrawer orderId={openId} open={!!openId} onClose={() => setOpenId(null)} onChanged={load} />
    </div>
  );
}

// ─────────────────────────── INVOICES ───────────────────────────
function InvoicesTab({ userId, email }: { userId: string; email?: string | null }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: linked }, { data: guest }] = await Promise.all([
      supabase.from("invoices").select("*").eq("user_id", userId).order("issue_date", { ascending: false }),
      email
        ? supabase.from("invoices").select("*").is("user_id", null).ilike("bill_to_email", email).order("issue_date", { ascending: false })
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const merged = [...(linked || [])];
    for (const row of guest || []) {
      if (!merged.some((inv) => inv.id === row.id)) merged.push(row);
    }
    merged.sort((a, b) => new Date(b.issue_date || b.created_at).getTime() - new Date(a.issue_date || a.created_at).getTime());
    setRows(merged);
    setLoading(false);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel(`os-cd-inv-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices", filter: `user_id=eq.${userId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, email]);

  if (loading) return <div className="os-glass p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-white/40" /></div>;
  if (!rows.length) return <div className="os-glass p-8 text-center text-sm text-white/50">No invoices.</div>;

  return (
    <div className="space-y-2">
      {rows.map((i) => (
        <button key={i.id} onClick={() => setOpenId(i.id)} className="os-glass p-3 w-full text-left flex items-center justify-between gap-3 hover:bg-white/[0.04]">
          <div className="min-w-0">
            <div className="font-mono text-xs text-white/80">{i.invoice_number}</div>
            <div className="text-sm font-semibold truncate">{i.service_description}</div>
            <div className="text-[11px] text-white/40">Issued {fmtDate(i.issue_date)} · Due {fmtDate(i.due_date)}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-bold">{fmtGBP(Number(i.total_gbp))}</div>
            <div className="text-[10px] mt-0.5 px-2 py-0.5 rounded-full bg-white/[0.06] text-white/70 inline-block">{i.status}</div>
          </div>
        </button>
      ))}
      <OsInvoiceDrawer invoiceId={openId} open={!!openId} onClose={() => setOpenId(null)} onChanged={load} />
    </div>
  );
}

// ─────────────────────────── DOCUMENTS ───────────────────────────
function DocumentsTab({ userId, email, name }: { userId: string; email?: string; name?: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docName, setDocName] = useState("");
  const [notify, setNotify] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("client_documents").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    setRows(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [userId]);

  const onUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("client-docs").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const finalName = docName || file.name;
      const { error: insErr } = await supabase.from("client_documents").insert({
        user_id: userId,
        name: finalName,
        file_url: path,
        file_size: `${Math.round(file.size / 1024)} KB`,
        file_type: ext || file.type,
      });
      if (insErr) throw insErr;

      if (notify && email) {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "document-uploaded",
            recipientEmail: email,
            idempotencyKey: `doc-uploaded-${userId}-${Date.now()}`,
            templateData: { customerName: name || "", documentName: finalName },
          },
        });
      }
      toast.success("Document uploaded" + (notify && email ? " · client notified" : ""));
      setDocName("");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const download = async (path: string) => {
    if (path.startsWith("http")) { window.open(path, "_blank"); return; }
    const { data } = await supabase.storage.from("client-docs").createSignedUrl(path, 60 * 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const remove = async (row: any) => {
    if (!confirm(`Delete "${row.name}"?`)) return;
    if (row.file_url && !row.file_url.startsWith("http")) {
      await supabase.storage.from("client-docs").remove([row.file_url]);
    }
    await supabase.from("client_documents").delete().eq("id", row.id);
    toast.success("Deleted");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="os-glass p-4 space-y-3">
        <div className="text-sm font-semibold">Upload document</div>
        <Field label="Document name (optional)" value={docName} onChange={setDocName} />
        <label className="flex items-center gap-2 text-xs text-white/70">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="rounded" />
          Email client (document-uploaded)
        </label>
        <label className="block">
          <input
            type="file"
            disabled={uploading}
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
            className="block w-full text-xs file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-blue-500/20 file:text-blue-100 file:font-semibold hover:file:bg-blue-500/30 disabled:opacity-50"
          />
        </label>
        {uploading && <div className="text-xs text-white/60 inline-flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Uploading…</div>}
      </div>

      <div className="space-y-2">
        {loading && <div className="os-glass p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-white/40" /></div>}
        {!loading && !rows.length && <div className="os-glass p-8 text-center text-sm text-white/50">No documents yet.</div>}
        {rows.map((d) => (
          <div key={d.id} className="os-glass p-3 flex items-center gap-3">
            <FileText className="w-4 h-4 text-white/40 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{d.name}</div>
              <div className="text-[11px] text-white/40">{fmtDate(d.created_at)} · {d.file_size || ""} {d.file_type ? `· ${d.file_type}` : ""}</div>
            </div>
            <button onClick={() => download(d.file_url)} className="h-8 px-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] text-xs inline-flex items-center gap-1.5"><Download className="w-3.5 h-3.5" />Download</button>
            <button onClick={() => remove(d)} className="h-8 w-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 grid place-items-center"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────── WALLET ───────────────────────────
function WalletTab({ userId }: { userId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ type: string; amount: string; desc: string }>({ type: "credit", amount: "", desc: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("client_wallet_transactions").select("*").eq("user_id", userId).order("txn_date", { ascending: false });
    setRows(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [userId]);

  const balance = useMemo(() => rows.reduce((a, r) => a + (r.txn_type === "credit" ? Number(r.amount_gbp) : -Number(r.amount_gbp)), 0), [rows]);

  const addTxn = async () => {
    const amt = parseFloat(form.amount);
    if (!amt || !form.desc) { toast.error("Amount and description required"); return; }
    setSaving(true);
    const ref = `W-${Date.now().toString(36).toUpperCase()}`;
    const { error } = await supabase.from("client_wallet_transactions").insert({
      user_id: userId, txn_ref: ref, txn_type: form.type, amount_gbp: amt, description: form.desc,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Transaction added");
    setForm({ type: "credit", amount: "", desc: "" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="os-glass p-5 flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-white/50">Wallet balance</div>
          <div className="text-3xl font-bold mt-1">{fmtGBP(balance)}</div>
        </div>
        <Wallet className="w-8 h-8 text-white/30" />
      </div>

      <div className="os-glass p-4 space-y-3">
        <div className="text-sm font-semibold">Add transaction</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SelectField label="Type" value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={["credit", "debit"]} />
          <Field label="Amount (GBP)" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} type="number" />
          <Field label="Description" value={form.desc} onChange={(v) => setForm({ ...form, desc: v })} />
        </div>
        <button onClick={addTxn} disabled={saving} className="px-4 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-100 text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
        </button>
      </div>

      <div className="space-y-2">
        {loading && <div className="os-glass p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-white/40" /></div>}
        {!loading && !rows.length && <div className="os-glass p-8 text-center text-sm text-white/50">No transactions.</div>}
        {rows.map((t) => (
          <div key={t.id} className="os-glass p-3 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{t.description}</div>
              <div className="text-[11px] text-white/40">{t.txn_ref} · {fmtDate(t.txn_date)}</div>
            </div>
            <div className={`font-bold ${t.txn_type === "credit" ? "text-emerald-300" : "text-rose-300"}`}>
              {t.txn_type === "credit" ? "+" : "−"}{fmtGBP(Number(t.amount_gbp))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────── SUBSCRIPTIONS ───────────────────────────
function SubscriptionsTab({ userId }: { userId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("client_subscriptions").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    setRows(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [userId]);

  if (loading) return <div className="os-glass p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-white/40" /></div>;
  if (!rows.length) return <div className="os-glass p-8 text-center text-sm text-white/50">No subscriptions.</div>;

  return (
    <div className="space-y-2">
      {rows.map((s) => (
        <div key={s.id} className="os-glass p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{s.plan_name}</div>
            <div className="text-[11px] text-white/40">{s.period} · next {fmtDate(s.next_billing)}</div>
          </div>
          <div className="text-right">
            <div className="font-bold">{fmtGBP(Number(s.price_gbp))}</div>
            <div className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-white/70 mt-1 inline-block">{s.status}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────── TICKETS ───────────────────────────
function TicketsTab({ userId }: { userId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("client_tickets").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    setRows(data || []);
    setLoading(false);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel(`os-cd-tickets-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "client_tickets", filter: `user_id=eq.${userId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("client_tickets").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success(`Status → ${status}`);
  };

  if (loading) return <div className="os-glass p-8 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-white/40" /></div>;
  if (!rows.length) return <div className="os-glass p-8 text-center text-sm text-white/50">No support tickets.</div>;

  return (
    <div className="space-y-2">
      {rows.map((t) => (
        <div key={t.id} className="os-glass p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[11px] text-white/60">{t.ticket_ref}</div>
              <div className="text-sm font-semibold truncate">{t.subject}</div>
              <div className="text-xs text-white/60 mt-1 whitespace-pre-wrap line-clamp-3">{t.message}</div>
              <div className="text-[11px] text-white/40 mt-2">{fmtDate(t.created_at)} · {t.replies_count} replies</div>
            </div>
            <select
              value={t.status}
              onChange={(e) => updateStatus(t.id, e.target.value)}
              className="h-8 px-2 rounded-lg bg-white/[0.05] text-xs"
            >
              {["Open", "In Progress", "Resolved", "Closed"].map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────── EMAILS ───────────────────────────
const EMAIL_TEMPLATES = [
  { name: "welcome",                          label: "Welcome" },
  { name: "order-confirmation",               label: "Order confirmation" },
  { name: "order-in-progress",                label: "Order in progress" },
  { name: "order-completed",                  label: "Order completed" },
  { name: "invoice-issued",                   label: "Invoice issued" },
  { name: "invoice-paid",                     label: "Invoice paid receipt" },
  { name: "document-uploaded",                label: "Document uploaded" },
  { name: "address-renewal-reminder",         label: "Address renewal reminder" },
  { name: "confirmation-statement-reminder",  label: "Confirmation statement reminder" },
  { name: "annual-accounts-reminder",         label: "Annual accounts reminder" },
];

function EmailsTab({ userId, profile }: { userId: string; profile: any }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const send = async (template: string) => {
    if (!profile?.email) { toast.error("No client email"); return; }
    setBusy(template);
    const { error } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: template,
        recipientEmail: profile.email,
        idempotencyKey: `${template}-${userId}-${Date.now()}`,
        clientUserId: userId,
        triggerSource: "admin",
        templateData: {
          customerName: profile.full_name || "",
          companyName: profile.company_name || "",
        },
      },
    });
    setBusy(null);
    if (error) toast.error(error.message);
    else { toast.success(`Sent ${template}`); setTimeout(() => setRefreshKey((k) => k + 1), 1500); }
  };

  if (!profile?.email) return <div className="os-glass p-8 text-center text-sm text-white/50">No email on file for this client.</div>;

  return (
    <div className="space-y-4">
      <div className="os-glass p-4">
        <div className="text-sm font-semibold mb-3">Send email to {profile.email}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {EMAIL_TEMPLATES.map((t) => (
            <button
              key={t.name}
              disabled={busy !== null}
              onClick={() => send(t.name)}
              className="px-3 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] text-xs font-semibold inline-flex items-center justify-between disabled:opacity-50"
            >
              <span>{t.label}</span>
              {busy === t.name ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-white/40" />}
            </button>
          ))}
        </div>
      </div>

      <div className="os-glass p-4">
        <OsEmailHistoryPanel
          key={refreshKey}
          scope={{ clientUserId: userId, clientEmail: profile.email }}
          title="Email history for this client"
          density="full"
        />
      </div>
    </div>
  );
}


// ─────────────────────────── helpers ───────────────────────────
function Field({ label, value, onChange, type, colSpan }: { label: string; value: any; onChange: (v: string) => void; type?: string; colSpan?: number }) {
  return (
    <label className={`block text-xs text-white/60 ${colSpan === 2 ? "md:col-span-2" : ""}`}>
      <div className="mb-1">{label}</div>
      <input
        type={type || "text"}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-white/30"
      />
    </label>
  );
}
function DateField({ label, value, onChange }: { label: string; value: any; onChange: (v: string) => void }) {
  return (
    <label className="block text-xs text-white/60">
      <div className="mb-1">{label}</div>
      <input
        type="date"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-white/30"
      />
    </label>
  );
}
function SelectField({ label, value, onChange, options }: { label: string; value: any; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block text-xs text-white/60">
      <div className="mb-1">{label}</div>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-white/30"
      >
        {options.map((o) => <option key={o} value={o} className="bg-slate-900">{o}</option>)}
      </select>
    </label>
  );
}
