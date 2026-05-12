import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Search, ArrowLeft, Save, ShieldCheck, Users, Trash2, FileText, Download } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useSeo } from "@/lib/seo";
import { SERVICE_CODES, generateInvoiceNumber, generateOrderNumber, downloadInvoicePdf } from "@/lib/invoice";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ClientRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [initialTab, setInitialTab] = useState<"profile" | "company" | "addresses">("profile");
  const [loadingClients, setLoadingClients] = useState(false);

  useSeo({ title: "Admin Panel | Digiformation", description: "Internal admin panel", noindex: true });

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const ownerEmail = "info@digiformation.uk";
      const isOwner = session.user.email?.toLowerCase() === ownerEmail;
      let isAdmin = isOwner;
      if (!isAdmin) {
        const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "admin").maybeSingle();
        isAdmin = !!role;
      }
      if (!isAdmin) { toast.error("Admin access required"); navigate("/dashboard"); return; }
      setAuthorized(true);
      await loadClients();
      setLoading(false);
    })();
  }, [navigate]);

  const loadClients = async () => {
    setLoadingClients(true);
    const { data, error } = await supabase.functions.invoke("admin-clients", { method: "GET" });
    setLoadingClients(false);
    if (error) {
      toast.error(error.message || "Unable to load clients");
      return;
    }
    if (data?.error) {
      toast.error(data.error);
      return;
    }
    setClients(data?.clients || []);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter(c =>
      (c.full_name || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.company_name || "").toLowerCase().includes(q)
    );
  }, [clients, search]);

  if (loading) return <Layout><div className="container mx-auto py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div></Layout>;
  if (!authorized) return null;

  if (selected) return <Layout><ClientDetail userId={selected} initialTab={initialTab} onBack={() => setSelected(null)} /></Layout>;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground text-sm">Manage clients and their data</p>
          </div>
          </div>
          <Button variant="outline" onClick={loadClients} disabled={loadingClients}>
            {loadingClients ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            Refresh Clients
          </Button>
        </div>

        <div className="glass rounded-2xl p-4 mb-4 flex items-center gap-3">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input placeholder="Search by name, email, or company…" value={search} onChange={(e) => setSearch(e.target.value)} className="border-0 focus-visible:ring-0" />
          <Badge variant="secondary"><Users className="w-3 h-3 mr-1" />{filtered.length}</Badge>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-left">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3 hidden md:table-cell">Phone</th>
                  <th className="p-3 hidden md:table-cell">Company</th>
                  <th className="p-3 hidden lg:table-cell">Joined</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.user_id} className="border-t border-border/40 hover:bg-primary/5">
                    <td className="p-3 font-medium">{c.full_name || "—"}</td>
                    <td className="p-3">{c.email}</td>
                    <td className="p-3 hidden md:table-cell">{c.phone || "—"}</td>
                    <td className="p-3 hidden md:table-cell">{c.company_name || "—"}</td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      <div className="flex gap-1.5 justify-end flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => { setInitialTab("company"); setSelected(c.user_id); }}>Company</Button>
                        <Button size="sm" variant="outline" onClick={() => { setInitialTab("addresses"); setSelected(c.user_id); }}>Address</Button>
                        <Button size="sm" onClick={() => { setInitialTab("profile"); setSelected(c.user_id); }}>Manage</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No clients found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const ClientDetail = ({ userId, initialTab = "profile", onBack }: { userId: string; initialTab?: "profile" | "company" | "addresses"; onBack: () => void }) => {
  const [tab, setTab] = useState<"profile" | "company" | "addresses" | "orders" | "invoices" | "subs" | "wallet" | "docs">(initialTab);
  const [profile, setProfile] = useState<any>({});
  const [companies, setCompanies] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    const [p, c, a, o, inv, s, w, d] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("client_company_details").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
      supabase.from("client_addresses").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
      supabase.from("client_orders").select("*").eq("user_id", userId).order("order_date", { ascending: false }),
      supabase.from("invoices").select("*").eq("user_id", userId).order("issue_date", { ascending: false }),
      supabase.from("client_subscriptions").select("*").eq("user_id", userId),
      supabase.from("client_wallet_transactions").select("*").eq("user_id", userId).order("txn_date", { ascending: false }),
      supabase.from("client_documents").select("*").eq("user_id", userId).order("doc_date", { ascending: false }),
    ]);
    setProfile(p.data || { user_id: userId });
    setCompanies(c.data || []);
    setAddresses(a.data || []);
    setOrders(o.data || []);
    setInvoices(inv.data || []);
    setSubs(s.data || []);
    setWallet(w.data || []);
    setDocs(d.data || []);
  };

  useEffect(() => { reload(); }, [userId]);

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name, phone: profile.phone, company_name: profile.company_name,
    }).eq("user_id", userId);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Profile updated");
  };

  const updateCompanyField = (id: string, patch: any) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  };
  const saveCompany = async (c: any) => {
    setSaving(true);
    const { id, created_at, updated_at, ...payload } = c;
    const cleaned: any = { ...payload };
    ["incorporation_date", "address_expire", "confirmation_due", "accounts_filing_due"].forEach(k => {
      if (cleaned[k] === "") cleaned[k] = null;
    });
    const { error } = await supabase.from("client_company_details").update(cleaned).eq("id", id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Company saved");
  };

  const updateAddressField = (id: string, patch: any) => {
    setAddresses(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  };
  const saveAddress = async (a: any) => {
    setSaving(true);
    const { id, created_at, updated_at, ...payload } = a;
    const cleaned: any = { ...payload };
    ["start_date", "expire_date"].forEach(k => { if (cleaned[k] === "") cleaned[k] = null; });
    const { error } = await supabase.from("client_addresses").update(cleaned).eq("id", id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Address saved");
  };

  const addOrder = async (
    serviceCode: string = "O",
    serviceDescription?: string,
    amount: number = 0,
    vatRate: number = 0,
    autoInvoice: boolean = true,
  ) => {
    const ref = await generateOrderNumber(serviceCode);
    const description = serviceDescription || SERVICE_CODES[serviceCode] || "New Service";
    const { data: orderRow, error } = await supabase
      .from("client_orders")
      .insert({ user_id: userId, order_ref: ref, service: description, status: "Pending", amount_gbp: amount })
      .select()
      .single();
    if (error) { toast.error(error.message); return; }

    if (autoInvoice) {
      const number = await generateInvoiceNumber(serviceCode);
      const vat = +(amount * vatRate / 100).toFixed(2);
      const total = +(amount + vat).toFixed(2);
      const { error: invErr } = await supabase.from("invoices").insert({
        user_id: userId,
        order_id: orderRow?.id,
        invoice_number: number,
        service_code: serviceCode,
        service_description: description,
        bill_to_name: profile.full_name || null,
        bill_to_email: profile.email || null,
        amount_gbp: amount, vat_rate: vatRate, vat_gbp: vat, total_gbp: total,
        status: "Unpaid",
      });
      if (invErr) toast.error(`Order saved but invoice failed: ${invErr.message}`);
      else {
        toast.success(`Order ${ref} + Invoice ${number} created`);
        if (profile.email) {
          supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "invoice-issued",
              recipientEmail: profile.email,
              idempotencyKey: `invoice-issued-${number}`,
              templateData: { customerName: profile.full_name, invoiceNumber: number, service: description, amount: `£${total}` },
            },
          }).catch(console.error);
        }
      }
    } else {
      toast.success(`Order ${ref} added`);
    }
    reload();
  };
  const updateOrder = async (id: string, patch: any) => {
    const prev = orders.find(o => o.id === id);
    const { error } = await supabase.from("client_orders").update(patch).eq("id", id);
    if (error) { toast.error(error.message); return; }
    // If status moved to Completed, send completion email
    if (patch.status && patch.status !== prev?.status && /complete/i.test(patch.status) && profile.email) {
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "order-completed",
          recipientEmail: profile.email,
          idempotencyKey: `order-completed-${id}`,
          templateData: { customerName: profile.full_name, orderRef: prev?.order_ref, service: prev?.service },
        },
      }).catch(console.error);
    }
    reload();
  };
  const deleteRow = async (table: any, id: string) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); reload(); }
  };

  const addInvoice = async (serviceCode = "O") => {
    const number = await generateInvoiceNumber(serviceCode);
    const { error } = await supabase.from("invoices").insert({
      user_id: userId,
      invoice_number: number,
      service_code: serviceCode,
      service_description: SERVICE_CODES[serviceCode] || "Service",
      bill_to_name: profile.full_name || null,
      bill_to_email: profile.email || null,
      amount_gbp: 0, vat_rate: 0, vat_gbp: 0, total_gbp: 0,
      status: "Unpaid",
    });
    if (error) toast.error(error.message); else { toast.success(`Invoice ${number} created`); reload(); }
  };
  const updateInvoice = async (id: string, patch: any) => {
    const current = invoices.find(i => i.id === id);
    const prevStatus = current?.status;
    if (current) {
      const merged = { ...current, ...patch };
      const amount = parseFloat(merged.amount_gbp) || 0;
      const rate = parseFloat(merged.vat_rate) || 0;
      const vat = +(amount * rate / 100).toFixed(2);
      const total = +(amount + vat).toFixed(2);
      patch = { ...patch, vat_gbp: vat, total_gbp: total };
    }
    const { error } = await supabase.from("invoices").update(patch).eq("id", id);
    if (error) { toast.error(error.message); return; }
    if (patch.status && patch.status !== prevStatus && /paid/i.test(patch.status) && profile.email) {
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "invoice-paid",
          recipientEmail: profile.email,
          idempotencyKey: `invoice-paid-${id}`,
          templateData: { customerName: profile.full_name, invoiceNumber: current?.invoice_number, amount: `£${current?.total_gbp}`, service: current?.service_description },
        },
      }).catch(console.error);
    }
    reload();
  };

  const addSub = async () => {
    const { error } = await supabase.from("client_subscriptions").insert({ user_id: userId, plan_name: "New Plan", price_gbp: 0, period: "year", status: "ACTIVE" });
    if (error) toast.error(error.message); else { toast.success("Subscription added"); reload(); }
  };
  const updateSub = async (id: string, patch: any) => {
    const { error } = await supabase.from("client_subscriptions").update(patch).eq("id", id);
    if (error) toast.error(error.message); else reload();
  };

  const addWallet = async () => {
    const ref = "TXN-" + Date.now().toString().slice(-6);
    const { error } = await supabase.from("client_wallet_transactions").insert({ user_id: userId, txn_ref: ref, txn_type: "Credit", description: "Manual entry", amount_gbp: 0 });
    if (error) toast.error(error.message); else { toast.success("Transaction added"); reload(); }
  };
  const updateWallet = async (id: string, patch: any) => {
    const { error } = await supabase.from("client_wallet_transactions").update(patch).eq("id", id);
    if (error) toast.error(error.message); else reload();
  };

  const addDoc = async () => {
    const { error } = await supabase.from("client_documents").insert({ user_id: userId, name: "New Document", file_url: "", file_type: "PDF", file_size: "—" });
    if (error) toast.error(error.message); else { toast.success("Document added"); reload(); }
  };
  const updateDoc = async (id: string, patch: any) => {
    const { error } = await supabase.from("client_documents").update(patch).eq("id", id);
    if (error) toast.error(error.message); else reload();
  };

  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "company", label: `Company (${companies.length})` },
    { id: "addresses", label: `Address (${addresses.length})` },
    { id: "orders", label: `Orders (${orders.length})` },
    { id: "invoices", label: `Invoices (${invoices.length})` },
    { id: "subs", label: `Subs (${subs.length})` },
    { id: "wallet", label: `Wallet (${wallet.length})` },
    { id: "docs", label: `Docs (${docs.length})` },
  ] as const;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Button variant="ghost" onClick={onBack} className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" />Back to clients</Button>
      <div className="glass rounded-2xl p-6 mb-4">
        <h2 className="text-2xl font-bold">{profile.full_name || profile.email || "Client"}</h2>
        <p className="text-sm text-muted-foreground">{profile.email}</p>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {tabs.map(t => (
          <Button key={t.id} variant={tab === t.id ? "default" : "outline"} size="sm" onClick={() => setTab(t.id as any)}>{t.label}</Button>
        ))}
      </div>

      <div className="glass rounded-2xl p-6">
        {tab === "profile" && (
          <div className="space-y-4">
            <Field label="Full Name" value={profile.full_name} onChange={(v) => setProfile({ ...profile, full_name: v })} />
            <Field label="Phone" value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v })} />
            <Field label="Company Name" value={profile.company_name} onChange={(v) => setProfile({ ...profile, company_name: v })} />
            <Button onClick={saveProfile} disabled={saving}><Save className="w-4 h-4 mr-2" />Save Profile</Button>
          </div>
        )}

        {tab === "company" && (
          <CompanyFormSection
            userId={userId}
            companies={companies}
            saving={saving}
            updateCompanyField={updateCompanyField}
            saveCompany={saveCompany}
            deleteRow={deleteRow}
            reload={reload}
          />
        )}

        {tab === "addresses" && (
          <AddressFormSection
            userId={userId}
            addresses={addresses}
            saving={saving}
            updateAddressField={updateAddressField}
            saveAddress={saveAddress}
            deleteRow={deleteRow}
            reload={reload}
          />
        )}

        {tab === "orders" && (
          <div className="space-y-3">
            <NewOrderForm onCreate={addOrder} />
            {orders.map(o => {
              const linkedInvoice = invoices.find(i => i.order_id === o.id);
              return (
              <div key={o.id} className="border border-border/40 rounded-lg p-3 grid md:grid-cols-6 gap-2 items-center">
                <Input defaultValue={o.order_ref} onBlur={(e) => updateOrder(o.id, { order_ref: e.target.value })} placeholder="Ref" />
                <Input defaultValue={o.service} onBlur={(e) => updateOrder(o.id, { service: e.target.value })} placeholder="Service" />
                <Input defaultValue={o.status} onBlur={(e) => updateOrder(o.id, { status: e.target.value })} placeholder="Status" />
                <Input type="number" defaultValue={o.amount_gbp} onBlur={(e) => updateOrder(o.id, { amount_gbp: parseFloat(e.target.value) || 0 })} placeholder="£" />
                <div className="flex items-center gap-2">
                  {linkedInvoice ? (
                    <>
                      <Badge variant="secondary" className="text-xs">Invoice created</Badge>
                      <Button size="sm" variant="outline" onClick={() => downloadInvoicePdf(linkedInvoice)} title={linkedInvoice.invoice_number}>
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">Not created</Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteRow("client_orders", o.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
              );
            })}
          </div>
        )}

        {tab === "invoices" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Create invoice for:</span>
              {Object.entries(SERVICE_CODES).map(([code, label]) => (
                <Button key={code} onClick={() => addInvoice(code)} size="sm" variant="outline">{code} — {label}</Button>
              ))}
            </div>
            {invoices.length === 0 && <p className="text-sm text-muted-foreground">No invoices yet. Pick a service code above to generate one (auto-numbered as DF + code + date + sequence).</p>}
            {invoices.map(i => (
              <div key={i.id} className="border border-border/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="font-mono font-semibold text-primary">{i.invoice_number}</div>
                    <div className="text-xs text-muted-foreground">Issued {i.issue_date} • Status: {i.status}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => downloadInvoicePdf(i)}>
                      <Download className="w-3 h-3 mr-1" />PDF
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteRow("invoices", i.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <Label>Service Code</Label>
                    <Select value={i.service_code} onValueChange={(v) => updateInvoice(i.id, { service_code: v, service_description: SERVICE_CODES[v] || i.service_description })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(SERVICE_CODES).map(([code, label]) => (
                          <SelectItem key={code} value={code}>{code} — {label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={i.status} onValueChange={(v) => updateInvoice(i.id, { status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Unpaid">Unpaid</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Overdue">Overdue</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                        <SelectItem value="Refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Service Description</Label>
                    <Input defaultValue={i.service_description} onBlur={(e) => updateInvoice(i.id, { service_description: e.target.value })} />
                  </div>
                  <div>
                    <Label>Issue Date</Label>
                    <Input type="date" defaultValue={i.issue_date} onBlur={(e) => updateInvoice(i.id, { issue_date: e.target.value })} />
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input type="date" defaultValue={i.due_date || ""} onBlur={(e) => updateInvoice(i.id, { due_date: e.target.value || null })} />
                  </div>
                  <div>
                    <Label>Bill To Name</Label>
                    <Input defaultValue={i.bill_to_name || ""} onBlur={(e) => updateInvoice(i.id, { bill_to_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Bill To Email</Label>
                    <Input defaultValue={i.bill_to_email || ""} onBlur={(e) => updateInvoice(i.id, { bill_to_email: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Bill To Address</Label>
                    <Textarea defaultValue={i.bill_to_address || ""} onBlur={(e) => updateInvoice(i.id, { bill_to_address: e.target.value })} />
                  </div>
                  <div>
                    <Label>Amount (£)</Label>
                    <Input type="number" step="0.01" defaultValue={i.amount_gbp} onBlur={(e) => updateInvoice(i.id, { amount_gbp: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>VAT Rate (%)</Label>
                    <Input type="number" step="0.01" defaultValue={i.vat_rate} onBlur={(e) => updateInvoice(i.id, { vat_rate: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>VAT (£)</Label>
                    <Input value={Number(i.vat_gbp).toFixed(2)} disabled />
                  </div>
                  <div>
                    <Label>Total (£)</Label>
                    <Input value={Number(i.total_gbp).toFixed(2)} disabled className="font-bold text-primary" />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Notes</Label>
                    <Textarea defaultValue={i.notes || ""} onBlur={(e) => updateInvoice(i.id, { notes: e.target.value })} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "subs" && (
          <div className="space-y-3">
            <Button onClick={addSub} size="sm">Add Subscription</Button>
            {subs.map(s => (
              <div key={s.id} className="border border-border/40 rounded-lg p-3 grid md:grid-cols-6 gap-2 items-center">
                <Input defaultValue={s.plan_name} onBlur={(e) => updateSub(s.id, { plan_name: e.target.value })} placeholder="Plan" />
                <Input type="number" defaultValue={s.price_gbp} onBlur={(e) => updateSub(s.id, { price_gbp: parseFloat(e.target.value) || 0 })} placeholder="£" />
                <Input defaultValue={s.period} onBlur={(e) => updateSub(s.id, { period: e.target.value })} placeholder="year" />
                <Input defaultValue={s.status} onBlur={(e) => updateSub(s.id, { status: e.target.value })} placeholder="Status" />
                <Input type="date" defaultValue={s.renewal_date || ""} onBlur={(e) => updateSub(s.id, { renewal_date: e.target.value || null })} />
                <Button variant="ghost" size="sm" onClick={() => deleteRow("client_subscriptions", s.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        )}

        {tab === "wallet" && (
          <div className="space-y-3">
            <Button onClick={addWallet} size="sm">Add Transaction</Button>
            {wallet.map(w => (
              <div key={w.id} className="border border-border/40 rounded-lg p-3 grid md:grid-cols-5 gap-2 items-center">
                <Input defaultValue={w.txn_ref} onBlur={(e) => updateWallet(w.id, { txn_ref: e.target.value })} />
                <Input defaultValue={w.txn_type} onBlur={(e) => updateWallet(w.id, { txn_type: e.target.value })} placeholder="Credit/Debit" />
                <Input defaultValue={w.description} onBlur={(e) => updateWallet(w.id, { description: e.target.value })} />
                <Input type="number" defaultValue={w.amount_gbp} onBlur={(e) => updateWallet(w.id, { amount_gbp: parseFloat(e.target.value) || 0 })} />
                <Button variant="ghost" size="sm" onClick={() => deleteRow("client_wallet_transactions", w.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        )}

        {tab === "docs" && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="file"
                id="admin-doc-upload"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
                  const { error: upErr } = await supabase.storage.from("client-docs").upload(path, file, { upsert: false, contentType: file.type });
                  if (upErr) { toast.error(upErr.message); return; }
                  const sizeKb = file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / 1024 / 1024).toFixed(2)} MB`;
                  const ext = file.name.split(".").pop()?.toUpperCase() || "FILE";
                  const { data: docRow, error: insErr } = await supabase.from("client_documents").insert({
                    user_id: userId, name: file.name, file_url: path, file_type: ext, file_size: sizeKb,
                  }).select().single();
                  if (insErr) toast.error(insErr.message);
                  else {
                    toast.success("Document uploaded");
                    if (profile.email) {
                      supabase.functions.invoke("send-transactional-email", {
                        body: {
                          templateName: "document-uploaded",
                          recipientEmail: profile.email,
                          idempotencyKey: `doc-uploaded-${docRow?.id}`,
                          templateData: {
                            customerName: profile.full_name,
                            documentName: file.name,
                            docDate: new Date().toISOString().slice(0, 10),
                            loginUrl: `${window.location.origin}/dashboard`,
                          },
                        },
                      }).catch(console.error);
                    }
                    reload();
                  }
                  e.target.value = "";
                }}
              />
              <Button size="sm" onClick={() => document.getElementById("admin-doc-upload")?.click()}>Upload Document</Button>
              <p className="text-xs text-muted-foreground">PDF, images, or any file. Stored privately — only this client can download.</p>
            </div>
            {docs.map(d => (
              <div key={d.id} className="border border-border/40 rounded-lg p-3 grid md:grid-cols-6 gap-2 items-center">
                <Input defaultValue={d.name} onBlur={(e) => updateDoc(d.id, { name: e.target.value })} placeholder="Name" className="md:col-span-2" />
                <Input defaultValue={d.file_type || ""} onBlur={(e) => updateDoc(d.id, { file_type: e.target.value })} placeholder="Type" />
                <Input defaultValue={d.file_size || ""} onBlur={(e) => updateDoc(d.id, { file_size: e.target.value })} placeholder="Size" />
                <Button variant="outline" size="sm" onClick={async () => {
                  if (!d.file_url) return toast.error("No file attached");
                  const { data, error } = await supabase.storage.from("client-docs").createSignedUrl(d.file_url, 60);
                  if (error) toast.error(error.message); else window.open(data.signedUrl, "_blank");
                }}>View</Button>
                <Button variant="ghost" size="sm" onClick={async () => {
                  if (d.file_url) await supabase.storage.from("client-docs").remove([d.file_url]);
                  await deleteRow("client_documents", d.id);
                }}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, type = "text" }: { label: string; value: any; onChange: (v: string) => void; type?: string }) => (
  <div>
    <Label>{label}</Label>
    <Input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} />
  </div>
);

const NewOrderForm = ({ onCreate }: { onCreate: (code: string, desc: string, amount: number, vatRate: number, autoInvoice: boolean) => Promise<void> }) => {
  const [code, setCode] = useState("O");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [vatRate, setVatRate] = useState("0");
  const [autoInvoice, setAutoInvoice] = useState(true);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    await onCreate(
      code,
      desc || SERVICE_CODES[code] || "Service",
      parseFloat(amount) || 0,
      parseFloat(vatRate) || 0,
      autoInvoice,
    );
    setBusy(false);
    setDesc(""); setAmount(""); setVatRate("0");
  };

  return (
    <div className="border border-border/40 rounded-xl p-4 space-y-3 bg-muted/20">
      <div className="font-semibold text-sm flex items-center gap-2">New Order {autoInvoice && <Badge variant="secondary" className="text-xs">auto invoice</Badge>}</div>
      <div className="grid md:grid-cols-4 gap-3">
        <div>
          <Label>Service</Label>
          <Select value={code} onValueChange={(v) => { setCode(v); if (!desc) setDesc(SERVICE_CODES[v] || ""); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(SERVICE_CODES).map(([c, l]) => (
                <SelectItem key={c} value={c}>{c} — {l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Description</Label>
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={SERVICE_CODES[code]} />
        </div>
        <div>
          <Label>Amount (£)</Label>
          <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <Label>VAT Rate (%)</Label>
          <Input type="number" step="0.01" value={vatRate} onChange={(e) => setVatRate(e.target.value)} placeholder="0" />
        </div>
        <div className="flex items-center gap-2 md:col-span-2">
          <input id="auto-inv" type="checkbox" checked={autoInvoice} onChange={(e) => setAutoInvoice(e.target.checked)} className="w-4 h-4" />
          <Label htmlFor="auto-inv" className="cursor-pointer">Auto-generate invoice</Label>
        </div>
        <div className="md:col-span-1 flex items-end">
          <Button onClick={submit} disabled={busy} size="sm" className="w-full">
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create
          </Button>
        </div>
      </div>
    </div>
  );
};

const CompanyFormSection = ({
  userId, companies, saving, updateCompanyField, saveCompany, deleteRow, reload,
}: {
  userId: string;
  companies: any[];
  saving: boolean;
  updateCompanyField: (id: string, patch: any) => void;
  saveCompany: (c: any) => void;
  deleteRow: (table: any, id: string) => void;
  reload: () => Promise<void>;
}) => {
  return (
    <div className="space-y-6">
      {companies.length === 0 && (
        <div className="border border-dashed border-border rounded-xl p-8 text-center space-y-3">
          <p className="text-sm text-muted-foreground">No company on file for this client yet.</p>
        </div>
      )}
      {companies.map((c, idx) => (
        <div key={c.id} className="border border-border/40 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Company Details{c.company_name ? ` — ${c.company_name}` : ""}</h3>
            {companies.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => deleteRow("client_company_details", c.id)}><Trash2 className="w-4 h-4" /></Button>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Company Name" value={c.company_name} onChange={(v) => updateCompanyField(c.id, { company_name: v })} />
            <Field label="Company Number" value={c.company_number} onChange={(v) => updateCompanyField(c.id, { company_number: v })} />
            <Field label="Director Name" value={c.director_name} onChange={(v) => updateCompanyField(c.id, { director_name: v })} />
            <Field label="SIC Code" value={c.sic_code} onChange={(v) => updateCompanyField(c.id, { sic_code: v })} />
            <Field label="Auth Code" value={c.auth_code} onChange={(v) => updateCompanyField(c.id, { auth_code: v })} />
            <Field label="UTR Number" value={(c as any).utr_number} onChange={(v) => updateCompanyField(c.id, { utr_number: v } as any)} />
            <Field label="Incorporation Date" type="date" value={c.incorporation_date} onChange={(v) => updateCompanyField(c.id, { incorporation_date: v })} />
            <Field label="Address Expire" type="date" value={c.address_expire} onChange={(v) => updateCompanyField(c.id, { address_expire: v })} />
            <Field label="Confirmation Due" type="date" value={c.confirmation_due} onChange={(v) => updateCompanyField(c.id, { confirmation_due: v })} />
            <Field label="Accounts Filing Due" type="date" value={c.accounts_filing_due} onChange={(v) => updateCompanyField(c.id, { accounts_filing_due: v })} />
          </div>
          <div>
            <Label>Registered Office Address</Label>
            <Textarea value={c.registered_address || ""} onChange={(e) => updateCompanyField(c.id, { registered_address: e.target.value })} />
          </div>
          <div>
            <Label>Correspondence Address <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea value={c.correspondence_address || ""} onChange={(e) => updateCompanyField(c.id, { correspondence_address: e.target.value })} placeholder="Leave blank if not purchased" />
          </div>
          <Button onClick={() => saveCompany(c)} disabled={saving} size="sm"><Save className="w-4 h-4 mr-2" />Save Company</Button>
        </div>
      ))}
    </div>
  );
};

const AddressFormSection = ({
  userId, addresses, saving, updateAddressField, saveAddress, deleteRow, addAddress, reload,
}: {
  userId: string;
  addresses: any[];
  saving: boolean;
  updateAddressField: (id: string, patch: any) => void;
  saveAddress: (a: any) => void;
  deleteRow: (table: any, id: string) => void;
  addAddress: () => Promise<void> | void;
  reload: () => Promise<void>;
}) => {
  const [creating, setCreating] = useState(false);

  const addBlankAddress = async () => {
    setCreating(true);
    const { error } = await supabase.from("client_addresses").insert({
      user_id: userId, label: "", service_type: "registered_office", country: "United Kingdom", status: "active",
    });
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    await reload();
  };

  return (
    <div className="space-y-6">
      {addresses.length === 0 && (
        <div className="border border-dashed border-border rounded-xl p-8 text-center space-y-3">
          <p className="text-sm text-muted-foreground">No address on file for this client yet.</p>
          <Button onClick={addBlankAddress} disabled={creating} size="sm">
            {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Create Address
          </Button>
        </div>
      )}
      {addresses.map((a, idx) => (
        <div key={a.id} className="border border-border/40 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Address #{idx + 1}{a.label ? ` — ${a.label}` : ""}</h3>
            {addresses.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => deleteRow("client_addresses", a.id)}><Trash2 className="w-4 h-4" /></Button>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Label" value={a.label} onChange={(v) => updateAddressField(a.id, { label: v })} />
            <Field label="Service Type" value={a.service_type} onChange={(v) => updateAddressField(a.id, { service_type: v })} />
            <Field label="Address Line 1" value={a.address_line1} onChange={(v) => updateAddressField(a.id, { address_line1: v })} />
            <Field label="Address Line 2" value={a.address_line2} onChange={(v) => updateAddressField(a.id, { address_line2: v })} />
            <Field label="City" value={a.city} onChange={(v) => updateAddressField(a.id, { city: v })} />
            <Field label="County" value={a.county} onChange={(v) => updateAddressField(a.id, { county: v })} />
            <Field label="Postcode" value={a.postcode} onChange={(v) => updateAddressField(a.id, { postcode: v })} />
            <Field label="Country" value={a.country} onChange={(v) => updateAddressField(a.id, { country: v })} />
            <Field label="Start Date" type="date" value={a.start_date} onChange={(v) => updateAddressField(a.id, { start_date: v })} />
            <Field label="Expire Date" type="date" value={a.expire_date} onChange={(v) => updateAddressField(a.id, { expire_date: v })} />
            <Field label="Status" value={a.status} onChange={(v) => updateAddressField(a.id, { status: v })} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={a.notes || ""} onChange={(e) => updateAddressField(a.id, { notes: e.target.value })} />
          </div>
          <Button onClick={() => saveAddress(a)} disabled={saving} size="sm"><Save className="w-4 h-4 mr-2" />Save Address</Button>
        </div>
      ))}
    </div>
  );
};

export default Admin;
