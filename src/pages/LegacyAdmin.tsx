import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { checkAdminSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Search, ArrowLeft, Save, ShieldCheck, Users, Trash2, FileText, Download, UserPlus, Copy, Mail, KeyRound, Ban } from "lucide-react";
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

const LegacyAdmin = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(searchParams.get("client"));
  const [initialTab, setInitialTab] = useState<"company" | "addresses" | "orders" | "invoices" | "wallet" | "docs" | "emails">((searchParams.get("tab") as any) || "company");
  const [loadingClients, setLoadingClients] = useState(false);
  // affiliate view removed

  useSeo({ title: "Admin Panel | Digiformation", description: "Internal admin panel", noindex: true });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const result = await checkAdminSession();
      if (!mounted) return;
      if (!result.ok) {
        const failure = result as Extract<typeof result, { ok: false }>;
        if (failure.reason === "role_check_failed") {
          toast.error("Unable to verify admin access. Please check your connection and try again.");
          setLoading(false);
          return;
        }
        if (failure.reason === "not_admin") toast.error("Admin access required");
        navigate(failure.reason === "not_admin" ? "/dashboard" : "/auth", { replace: true });
        return;
      }
      setAuthorized(true);
      await loadClients();
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
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

  if (selected) return <Layout><ClientDetail userId={selected} initialTab={initialTab} onBack={() => { setSelected(null); setSearchParams({}); }} /></Layout>;

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
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadClients} disabled={loadingClients}>
              {loadingClients ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
              Refresh Clients
            </Button>
          </div>

        </div>


        <>

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
                      <Button size="sm" onClick={() => { setInitialTab("company"); setSelected(c.user_id); }}>Manage</Button>
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
          </>
      </div>
    </Layout>
  );
};

const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const computeAddressExpireDate = (a: any): string | null => {
  if (a?.expire_date) return a.expire_date;
  if (a?.start_date) return addDays(a.start_date, 365);
  if (a?.created_at) return addDays(String(a.created_at).slice(0, 10), 365);
  return null;
};

const computeCompanyDueDate = (
  template: "confirmation-statement-reminder" | "annual-accounts-reminder",
  c: any,
): string | null => {
  if (template === "confirmation-statement-reminder") {
    if (c?.confirmation_due) return c.confirmation_due;
    if (c?.incorporation_date) return addDays(c.incorporation_date, 365 + 14);
  } else {
    if (c?.accounts_filing_due) return c.accounts_filing_due;
    if (c?.incorporation_date) return addDays(c.incorporation_date, Math.round(30.44 * 21));
  }
  return null;
};

const generateRandomPassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const sym = "!@#$%&*";
  let pw = "";
  for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  pw += sym[Math.floor(Math.random() * sym.length)];
  return pw;
};

const CreateClientPanel = ({ onCreated }: { onCreated: () => void }) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState(() => generateRandomPassword());
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  const reset = () => {
    setEmail(""); setFullName(""); setPhone(""); setCompanyName("");
    setPassword(generateRandomPassword());
    setCreated(null);
  };

  const copy = async (text: string, label: string) => {
    try { await navigator.clipboard.writeText(text); toast.success(`${label} copied`); }
    catch { toast.error("Copy failed"); }
  };

  const create = async () => {
    if (!email.trim() || !password.trim()) { toast.error("Email and password required"); return; }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("admin-clients", {
      method: "POST",
      body: { email: email.trim(), password, full_name: fullName.trim(), phone: phone.trim(), company_name: companyName.trim() },
    });
    setCreating(false);
    if (error) { toast.error(error.message || "Failed to create client"); return; }
    if (data?.error) { toast.error(data.error); return; }
    toast.success("Client portal created");
    setCreated({ email: email.trim(), password });
    onCreated();
  };




  if (!open) {
    return (
      <div className="mb-4">
        <Button variant="hero" className="rounded-full" onClick={() => setOpen(true)}>
          <UserPlus className="w-4 h-4" /> Create New Client Portal
        </Button>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-5 mb-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Create New Client Portal</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { setOpen(false); reset(); }}>Close</Button>
      </div>

      {!created ? (
        <>
          <p className="text-xs text-white/70">
            Create the account here. Share the email & temporary password with the client — they can change it later from their dashboard or via <strong>Forgot Password</strong> on the login page.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@example.com" className="mt-1.5" />
            </div>
            <div>
              <Label>Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className="mt-1.5" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44…" className="mt-1.5" />
            </div>
            <div>
              <Label>Company Name</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Ltd" className="mt-1.5" />
            </div>
            <div className="sm:col-span-2">
              <Label>Temporary Password *</Label>
              <div className="flex gap-2 mt-1.5">
                <Input value={password} onChange={(e) => setPassword(e.target.value)} className="font-mono" />
                <Button type="button" variant="outline" onClick={() => setPassword(generateRandomPassword())}>
                  <KeyRound className="w-4 h-4" /> Regenerate
                </Button>
                <Button type="button" variant="outline" onClick={() => copy(password, "Password")}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>Cancel</Button>
            <Button variant="hero" onClick={create} disabled={creating} className="rounded-full">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Create Portal
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
            <div className="text-sm font-semibold text-primary">✓ Portal created successfully</div>
            <div className="grid grid-cols-[100px_1fr_auto] gap-2 items-center text-sm">
              <span className="opacity-70">Email:</span>
              <span className="font-mono break-all">{created.email}</span>
              <Button size="sm" variant="ghost" onClick={() => copy(created.email, "Email")}><Copy className="w-3.5 h-3.5" /></Button>
              <span className="opacity-70">Password:</span>
              <span className="font-mono break-all">{created.password}</span>
              <Button size="sm" variant="ghost" onClick={() => copy(created.password, "Password")}><Copy className="w-3.5 h-3.5" /></Button>
            </div>
            <p className="text-xs text-white/70 pt-2 border-t border-border/40">
              Share these credentials with the client. They can sign in immediately and change their password later from the dashboard or via <strong>Forgot Password</strong>.
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="hero" onClick={reset} className="rounded-full">
              <UserPlus className="w-4 h-4" /> Create Another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const ClientDetail = ({ userId, initialTab = "company", onBack }: { userId: string; initialTab?: "company" | "addresses" | "orders" | "invoices" | "wallet" | "docs" | "emails"; onBack: () => void }) => {
  const [tab, setTab] = useState<"company" | "addresses" | "orders" | "invoices" | "wallet" | "docs" | "emails">(initialTab);
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
    ["incorporation_date", "address_start", "address_expire", "confirmation_due", "accounts_filing_due"].forEach(k => {
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
      else toast.success(`Order ${ref} + Invoice ${number} created`);
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
    // If status moved to In Progress, send in-progress email
    if (patch.status && patch.status !== prev?.status && /progress/i.test(patch.status) && profile.email) {
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "order-in-progress",
          recipientEmail: profile.email,
          idempotencyKey: `order-in-progress-${id}`,
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
    { id: "company", label: `Company (${companies.length})` },
    { id: "addresses", label: `Address Subscription (${addresses.length})` },
    { id: "orders", label: `Orders (${orders.length})` },
    { id: "invoices", label: `Invoices (${invoices.length})` },
    { id: "wallet", label: `Wallet (${wallet.length})` },
    { id: "docs", label: `Docs (${docs.length})` },
    { id: "emails", label: "Emails" },
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

        {tab === "company" && (
          <CompanyFormSection
            userId={userId}
            companies={companies}
            saving={saving}
            updateCompanyField={updateCompanyField}
            saveCompany={saveCompany}
            deleteRow={deleteRow}
            reload={reload}
            clientEmail={profile.email}
            clientName={profile.full_name}
          />
        )}

        {tab === "addresses" && (
          <AddressFormSection
            userId={userId}
            addresses={addresses}
            docs={docs}
            saving={saving}
            updateAddressField={updateAddressField}
            saveAddress={saveAddress}
            deleteRow={deleteRow}
            reload={reload}
            clientEmail={profile.email}
            clientName={profile.full_name}
          />
        )}

        {tab === "orders" && (
          <div className="space-y-3">
            {(() => {
              const activeOrders = orders.filter(o => !/cancel/i.test(o.status || ""));
              const cancelledCount = orders.length - activeOrders.length;
              return (
                <div className="text-sm text-muted-foreground px-1">
                  Active orders: <span className="font-semibold text-foreground">{activeOrders.length}</span>
                  {cancelledCount > 0 && (
                    <span className="ml-2">• Cancelled: <span className="font-semibold text-destructive">{cancelledCount}</span> <span className="italic">(excluded from series)</span></span>
                  )}
                  <span className="ml-2 italic">Cancel test orders to keep them out of the active series.</span>
                </div>
              );
            })()}
            {orders.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No orders yet for this client.</p>
            )}
            {(() => {
              const activeOrdersDesc = orders.filter(o => !/cancel/i.test(o.status || ""));
              const seqMap = new Map<string, number>();
              activeOrdersDesc.forEach((o, i) => seqMap.set(o.id, activeOrdersDesc.length - i));
              return orders.map((o) => {
                const linkedInvoice = invoices.find(i => i.order_id === o.id);
                const isCancelled = /cancel/i.test(o.status || "");
                const seqLabel = isCancelled ? "—" : `#${String(seqMap.get(o.id) || 0).padStart(2, "0")}`;
                return (
              <div key={o.id} className={`border rounded-lg p-3 space-y-2 ${isCancelled ? "border-destructive/30 bg-destructive/5 opacity-75" : "border-border/40"}`}>
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-border/30">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${isCancelled ? "text-destructive bg-destructive/10" : "text-muted-foreground bg-muted/40"}`}>{seqLabel}</span>
                    <span className={`font-mono font-semibold text-sm ${isCancelled ? "text-muted-foreground line-through" : "text-primary"}`}>{o.order_ref || "(no ref)"}</span>
                    {isCancelled && <Badge variant="destructive" className="text-xs">Cancelled</Badge>}
                    {o.created_at && (
                      <span className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {!isCancelled ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (!confirm(`Cancel order ${o.order_ref}? It will be kept for records but excluded from the active series.`)) return;
                          await updateOrder(o.id, { status: "Cancelled" });
                          toast.success("Order cancelled");
                        }}
                        className="text-destructive hover:text-destructive"
                        title="Cancel this order (e.g. a test order). It stays for records but is excluded from the series."
                      >
                        <Ban className="w-4 h-4 mr-1" />Cancel
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => { await updateOrder(o.id, { status: "Pending" }); toast.success("Order restored"); }}
                        title="Restore this order"
                      >
                        Restore
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => deleteRow("client_orders", o.id)} title="Permanently delete"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
                <div className="grid md:grid-cols-5 gap-2 items-center">
                  <Input defaultValue={o.service} onBlur={(e) => updateOrder(o.id, { service: e.target.value })} placeholder="Service" className="md:col-span-2" />
                  <Input defaultValue={o.status} onBlur={(e) => updateOrder(o.id, { status: e.target.value })} placeholder="Status" />
                  <Input type="number" defaultValue={o.amount_gbp} onBlur={(e) => updateOrder(o.id, { amount_gbp: parseFloat(e.target.value) || 0 })} placeholder="£" />
                  <div className="flex items-center gap-2">
                    {linkedInvoice ? (
                      <>
                        <Badge variant="secondary" className="text-xs">Invoice</Badge>
                        <Button size="sm" variant="outline" onClick={() => downloadInvoicePdf(linkedInvoice)} title={linkedInvoice.invoice_number}>
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">No invoice</Badge>
                    )}
                  </div>
                </div>
                {!isCancelled && (() => {
                  const isDone = /complete/i.test(o.status || "");
                  const isInProgress = /progress/i.test(o.status || "");
                  const isPaid = /paid/i.test(o.status || "") || /paid/i.test(linkedInvoice?.status || "");
                  return (
                    <div className="flex flex-wrap gap-2">
                      {/* Payment Received → mark order Paid, invoice Paid, email client */}
                      {!isPaid && (
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={async () => {
                            await updateOrder(o.id, { status: "Paid" });
                            if (linkedInvoice) await updateInvoice(linkedInvoice.id, { status: "Paid" });
                            toast.success("Marked as Paid");
                          }}
                          title="Mark this order as Paid"
                        >
                          <Mail className="w-3.5 h-3.5 mr-1" />Payment Received
                        </Button>
                      )}
                      {isPaid && (
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Paid</Badge>
                      )}
                      {!isPaid && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await updateOrder(o.id, { status: "Pending" });
                            toast.success("Marked Pending");
                          }}
                          title="Mark this order as Pending"
                        >
                          Mark Pending
                        </Button>
                      )}
                      {!isDone && !isInProgress && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={async () => {
                            if (!profile.email) return toast.error("Client has no email");
                            await updateOrder(o.id, { status: "In Progress" });
                            toast.success("Order marked In Progress — email sent to client");
                          }}
                          title="Mark this order as In Progress and notify the client by email"
                        >
                          <Mail className="w-3.5 h-3.5 mr-1" />Start Work & Notify
                        </Button>
                      )}
                      {isInProgress && (
                        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">In Progress</Badge>
                      )}
                      {!isDone && (
                        <Button
                          size="sm"
                          onClick={async () => {
                            if (!profile.email) return toast.error("Client has no email");
                            await updateOrder(o.id, { status: "Completed" });
                            toast.success("Order marked Completed — email sent to client");
                          }}
                          title="Mark this order Completed and notify the client by email"
                        >
                          <Mail className="w-3.5 h-3.5 mr-1" />Mark Complete & Notify
                        </Button>
                      )}
                      {isDone && (
                        <>
                          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Completed</Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              if (!profile.email) return toast.error("Client has no email");
                              const { error } = await supabase.functions.invoke("send-transactional-email", {
                                body: {
                                  templateName: "order-completed",
                                  recipientEmail: profile.email,
                                  idempotencyKey: `order-completed-manual-${o.id}-${Date.now()}`,
                                  templateData: { customerName: profile.full_name, orderRef: o.order_ref, service: o.service },
                                },
                              });
                              if (error) toast.error(error.message); else toast.success("Completion email re-sent");
                            }}
                          >
                            <Mail className="w-3.5 h-3.5 mr-1" />Resend Email
                          </Button>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
              );
              });
            })()}
          </div>
        )}

        {tab === "invoices" && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground px-1">
              Total invoices: <span className="font-semibold text-foreground">{invoices.length}</span>
              <span className="ml-2 italic">Invoices are generated automatically when a client places an order — the PDF is also emailed to them.</span>
            </div>
            {invoices.length === 0 && <p className="text-sm text-muted-foreground italic">No invoices yet for this client.</p>}
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
                  const { data, error } = await supabase.storage.from("client-docs").createSignedUrl(d.file_url, 60, { download: d.name || true });
                  if (error) toast.error(error.message); else window.location.href = data.signedUrl;
                }}><Download className="w-4 h-4 mr-1" />Download</Button>
                <Button variant="ghost" size="sm" onClick={async () => {
                  if (d.file_url) await supabase.storage.from("client-docs").remove([d.file_url]);
                  await deleteRow("client_documents", d.id);
                }}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        )}

        {tab === "emails" && (
          <EmailsSection
            orders={orders}
            companies={companies}
            addresses={addresses}
            clientEmail={profile.email}
            clientName={profile.full_name}
          />
        )}
      </div>
    </div>
  );
};

const EmailsSection = ({
  orders, companies, addresses, clientEmail, clientName,
}: {
  orders: any[];
  companies: any[];
  addresses: any[];
  clientEmail?: string | null;
  clientName?: string | null;
}) => {
  const requireEmail = () => {
    if (!clientEmail) { toast.error("Client has no email on file"); return false; }
    return true;
  };

  const sendOrderComplete = async (o: any) => {
    if (!requireEmail()) return;
    const { error } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "order-completed",
        recipientEmail: clientEmail,
        idempotencyKey: `order-completed-manual-${o.id}-${Date.now()}`,
        templateData: { customerName: clientName, orderRef: o.order_ref, service: o.service },
      },
    });
    if (error) toast.error(error.message); else toast.success(`Order Completed email sent for ${o.order_ref}`);
  };

  const sendCompanyReminder = async (template: "confirmation-statement-reminder" | "annual-accounts-reminder", c: any, label: string) => {
    if (!requireEmail()) return;
    const dueDate = computeCompanyDueDate(template, c);
    if (!dueDate) return toast.error(`Please set the ${label} due date or Incorporation Date in Company tab first`);
    const daysRemaining = Math.max(0, Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    const templateData = { customerName: clientName, companyName: c.company_name, companyNumber: c.company_number, dueDate, daysRemaining };
    const { error } = await supabase.functions.invoke("send-transactional-email", {
      body: { templateName: template, recipientEmail: clientEmail, idempotencyKey: `${template}-${c.id}-${Date.now()}`, templateData },
    });
    // BCC: admin acknowledgement copy
    await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: template,
        recipientEmail: "info@digiformation.uk",
        idempotencyKey: `${template}-${c.id}-${Date.now()}-admin`,
        templateData: { ...templateData, customerName: `[ADMIN COPY] ${clientName || ""} <${clientEmail}>` },
      },
    });
    if (error) toast.error(error.message); else toast.success(`${label} reminder sent (${daysRemaining} days remaining) — admin copy sent to info@digiformation.uk`);
  };

  const sendAddressReminder = async (a: any) => {
    if (!requireEmail()) return;
    const expireDate = computeAddressExpireDate(a);
    if (!expireDate) return toast.error("Cannot determine expiry date — set Start Date or Expire Date first");
    const daysRemaining = Math.max(0, Math.ceil((new Date(expireDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    const templateData = { customerName: clientName, address: a.address_line1, expireDate, daysRemaining };
    const { error } = await supabase.functions.invoke("send-transactional-email", {
      body: { templateName: "address-renewal-reminder", recipientEmail: clientEmail, idempotencyKey: `address-renewal-${a.id}-${Date.now()}`, templateData },
    });
    await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "address-renewal-reminder",
        recipientEmail: "info@digiformation.uk",
        idempotencyKey: `address-renewal-${a.id}-${Date.now()}-admin`,
        templateData: { ...templateData, customerName: `[ADMIN COPY] ${clientName || ""} <${clientEmail}>` },
      },
    });
    if (error) toast.error(error.message); else toast.success(`Address renewal reminder sent (${daysRemaining} days remaining) — admin copy sent to info@digiformation.uk`);
  };

  const pendingOrders = orders.filter(o => !/complete/i.test(o.status || ""));

  return (
    <div className="space-y-6">
      <div className="border border-border/40 rounded-xl p-4 bg-muted/10">
        <p className="text-sm text-muted-foreground">
          One place to send all client emails. Each button uses the data from its related Order / Company / Address — including order number, company number and due dates.
          {!clientEmail && <span className="block text-destructive mt-2">⚠ This client has no email address on file.</span>}
        </p>
      </div>

      {/* Order Completion */}
      <div>
        <h3 className="font-semibold mb-2 flex items-center gap-2"><Mail className="w-4 h-4" />Order Completion</h3>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders for this client yet.</p>
        ) : (
          <div className="space-y-2">
            {orders.map(o => {
              const done = /complete/i.test(o.status || "");
              return (
                <div key={o.id} className="border border-border/40 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm">
                    <div className="font-medium">{o.order_ref} — {o.service}</div>
                    <div className="text-xs text-muted-foreground">£{o.amount_gbp} · Status: {o.status}</div>
                  </div>
                  <Button size="sm" variant={done ? "outline" : "default"} onClick={() => sendOrderComplete(o)}>
                    <Mail className="w-3.5 h-3.5 mr-1" />Send Order Complete
                  </Button>
                </div>
              );
            })}
            {pendingOrders.length === 0 && (
              <p className="text-xs text-muted-foreground">All orders marked completed — you can still resend the email above.</p>
            )}
          </div>
        )}
      </div>

      {/* Company Reminders */}
      <div>
        <h3 className="font-semibold mb-2 flex items-center gap-2"><Mail className="w-4 h-4" />Company Reminders</h3>
        {companies.length === 0 ? (
          <p className="text-sm text-muted-foreground">No company on file.</p>
        ) : (
          <div className="space-y-2">
            {companies.map(c => (
              <div key={c.id} className="border border-border/40 rounded-lg p-3 space-y-2">
                <div className="text-sm font-medium">{c.company_name || "Unnamed company"} {c.company_number && <span className="text-xs text-muted-foreground">({c.company_number})</span>}</div>
                <div className="text-xs text-muted-foreground">CS due: {c.confirmation_due || "—"} · Accounts due: {c.accounts_filing_due || "—"}</div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => sendCompanyReminder("confirmation-statement-reminder", c, "Confirmation Statement")}>
                    <Mail className="w-3.5 h-3.5 mr-1" />Send CS Reminder
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => sendCompanyReminder("annual-accounts-reminder", c, "Annual Accounts")}>
                    <Mail className="w-3.5 h-3.5 mr-1" />Send Accounts Reminder
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Address Reminders */}
      <div>
        <h3 className="font-semibold mb-2 flex items-center gap-2"><Mail className="w-4 h-4" />Address Renewal Reminders</h3>
        {addresses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No address on file.</p>
        ) : (
          <div className="space-y-2">
            {addresses.map(a => (
              <div key={a.id} className="border border-border/40 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm">
                  <div className="font-medium">{a.label || "Address"}</div>
                  <div className="text-xs text-muted-foreground">{a.address_line1 || "—"}</div>
                  <div className="text-xs text-muted-foreground">Expires: {a.expire_date || "—"}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => sendAddressReminder(a)}>
                  <Mail className="w-3.5 h-3.5 mr-1" />Send Renewal Reminder
                </Button>
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
  userId, companies, saving, updateCompanyField, saveCompany, deleteRow, reload, clientEmail, clientName,
}: {
  userId: string;
  companies: any[];
  saving: boolean;
  updateCompanyField: (id: string, patch: any) => void;
  saveCompany: (c: any) => void;
  deleteRow: (table: any, id: string) => void;
  reload: () => Promise<void>;
  clientEmail?: string | null;
  clientName?: string | null;
}) => {
  const sendCompanyReminder = async (
    template: "confirmation-statement-reminder" | "annual-accounts-reminder",
    c: any,
    label: string,
  ) => {
    if (!clientEmail) return toast.error("Client has no email");
    const dueDate = computeCompanyDueDate(template, c);
    if (!dueDate) return toast.error(`Please set the ${label} due date or Incorporation Date first`);
    const daysRemaining = Math.max(0, Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    const templateData = { customerName: clientName, companyName: c.company_name, companyNumber: c.company_number, dueDate, daysRemaining };
    const { error } = await supabase.functions.invoke("send-transactional-email", {
      body: { templateName: template, recipientEmail: clientEmail, idempotencyKey: `${template}-${c.id}-${Date.now()}`, templateData },
    });
    await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: template,
        recipientEmail: "info@digiformation.uk",
        idempotencyKey: `${template}-${c.id}-${Date.now()}-admin`,
        templateData: { ...templateData, customerName: `[ADMIN COPY] ${clientName || ""} <${clientEmail}>` },
      },
    });
    if (error) toast.error(error.message); else toast.success(`${label} reminder sent — admin copy sent`);
  };

  const sendAddressRenewalFromCompany = async (c: any) => {
    if (!clientEmail) return toast.error("Client has no email");
    const expireDate: string | null = c.address_expire || null;
    if (!expireDate) return toast.error("Please set the Address Expiry Date first");
    const daysRemaining = Math.max(0, Math.ceil((new Date(expireDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    const templateData = {
      customerName: clientName,
      address: c.registered_address || c.correspondence_address || c.company_name || "Registered Office Address",
      expireDate,
      daysRemaining,
    };
    const { error } = await supabase.functions.invoke("send-transactional-email", {
      body: { templateName: "address-renewal-reminder", recipientEmail: clientEmail, idempotencyKey: `address-renewal-co-${c.id}-${Date.now()}`, templateData },
    });
    await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "address-renewal-reminder",
        recipientEmail: "info@digiformation.uk",
        idempotencyKey: `address-renewal-co-${c.id}-${Date.now()}-admin`,
        templateData: { ...templateData, customerName: `[ADMIN COPY] ${clientName || ""} <${clientEmail}>` },
      },
    });
    if (error) toast.error(error.message); else toast.success(`Address renewal reminder sent (${daysRemaining} days remaining) — admin copy sent`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={async () => {
            const { error } = await supabase.from("client_company_details").insert({ user_id: userId });
            if (error) toast.error(error.message); else { toast.success("Company added"); await reload(); }
          }}
        >
          + Add Company
        </Button>
      </div>
      {companies.length === 0 && (
        <div className="border border-dashed border-border rounded-xl p-8 text-center space-y-3">
          <p className="text-sm text-muted-foreground">No company on file for this client yet. Click "Add Company" to create one.</p>
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
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Companies House Personal Code</Label>
            <p className="text-xs text-muted-foreground">Enter the 11-character personal code for each director. Add one per line for multiple directors.</p>
            <Textarea
              rows={4}
              value={(c as any).companies_house_personal_code || ""}
              onChange={(e) => updateCompanyField(c.id, { companies_house_personal_code: e.target.value } as any)}
              placeholder={"Director 1: XXXXXXXXXXX\nDirector 2: XXXXXXXXXXX"}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Company Number" value={c.company_number} onChange={(v) => updateCompanyField(c.id, { company_number: v })} />
            <Field label="Incorporation Date" type="date" value={c.incorporation_date} onChange={(v) => updateCompanyField(c.id, { incorporation_date: v })} />
            <Field label="Confirmation Statement Due" type="date" value={c.confirmation_due} onChange={(v) => updateCompanyField(c.id, { confirmation_due: v })} />
            <Field label="Annual Filing Due" type="date" value={c.accounts_filing_due} onChange={(v) => updateCompanyField(c.id, { accounts_filing_due: v })} />
            <Field label="Authentication Code" value={c.auth_code} onChange={(v) => updateCompanyField(c.id, { auth_code: v })} />
            <Field label="Activation Code" value={(c as any).activation_code} onChange={(v) => updateCompanyField(c.id, { activation_code: v } as any)} />
            <Field label="UTR Number" value={(c as any).utr_number} onChange={(v) => updateCompanyField(c.id, { utr_number: v } as any)} />
            <Field label="Director Name" value={c.director_name} onChange={(v) => updateCompanyField(c.id, { director_name: v })} />
            <Field label="SIC Code" value={c.sic_code} onChange={(v) => updateCompanyField(c.id, { sic_code: v })} />
          </div>
          <div className="space-y-4 pt-2 border-t border-border/40">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Address Details</h4>
            <div>
              <Label>Registered Office Address</Label>
              <Textarea value={c.registered_address || ""} onChange={(e) => updateCompanyField(c.id, { registered_address: e.target.value })} />
            </div>
            <div>
              <Label>Correspondence Address <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea value={c.correspondence_address || ""} onChange={(e) => updateCompanyField(c.id, { correspondence_address: e.target.value })} placeholder="Leave blank if not purchased" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Address Start Date" type="date" value={(c as any).address_start} onChange={(v) => updateCompanyField(c.id, { address_start: v } as any)} />
              <Field label="Address Expiry Date" type="date" value={c.address_expire} onChange={(v) => updateCompanyField(c.id, { address_expire: v })} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => saveCompany(c)} disabled={saving} size="sm"><Save className="w-4 h-4 mr-2" />Save Company</Button>
            <Button
              onClick={() => sendCompanyReminder("confirmation-statement-reminder", c, "Confirmation Statement")}
              size="sm"
              variant="outline"
              title="Send Confirmation Statement reminder email to client"
            >
              <Mail className="w-4 h-4 mr-2" />Send CS Reminder
            </Button>
            <Button
              onClick={() => sendCompanyReminder("annual-accounts-reminder", c, "Annual Accounts")}
              size="sm"
              variant="outline"
              title="Send Annual Accounts filing reminder email to client"
            >
              <Mail className="w-4 h-4 mr-2" />Send Accounts Reminder
            </Button>
            <Button
              onClick={() => sendAddressRenewalFromCompany(c)}
              size="sm"
              variant="outline"
              title="Send Address Renewal reminder email to client (uses this company's Address Expiry Date)"
            >
              <Mail className="w-4 h-4 mr-2" />Send Address Renewal Reminder
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

const AddressFormSection = ({
  userId, addresses, docs, saving, updateAddressField, saveAddress, deleteRow, reload, clientEmail, clientName,
}: {
  userId: string;
  addresses: any[];
  docs: any[];
  saving: boolean;
  updateAddressField: (id: string, patch: any) => void;
  saveAddress: (a: any) => void;
  deleteRow: (table: any, id: string) => void;
  reload: () => Promise<void>;
  clientEmail?: string | null;
  clientName?: string | null;
}) => {
  const sendAddressReminder = async (a: any) => {
    if (!clientEmail) return toast.error("Client has no email");
    const expireDate = computeAddressExpireDate(a);
    if (!expireDate) return toast.error("Cannot determine expiry date — set Start Date or Expire Date first");
    const daysRemaining = Math.max(0, Math.ceil((new Date(expireDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    const { error } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "address-renewal-reminder",
        recipientEmail: clientEmail,
        idempotencyKey: `address-renewal-${a.id}-${Date.now()}`,
        templateData: {
          customerName: clientName,
          address: a.address_line1,
          expireDate,
          daysRemaining,
        },
      },
    });
    if (error) toast.error(error.message); else toast.success(`Address renewal reminder sent (${daysRemaining} days remaining)`);
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={async () => {
            const { error } = await supabase.from("client_addresses").insert({
              user_id: userId,
              label: "New Address",
              service_type: "registered_office",
              status: "active",
            });
            if (error) toast.error(error.message); else { toast.success("Address added"); await reload(); }
          }}
        >
          + Add Address
        </Button>
      </div>
      {addresses.length === 0 && (
        <div className="border border-dashed border-border rounded-xl p-8 text-center space-y-3">
          <p className="text-sm text-muted-foreground">No address on file for this client yet. Click "Add Address" to create one.</p>
        </div>
      )}
      {addresses.map((a, idx) => {
        const addressDocs = (docs || []).filter((d: any) => d.address_id === a.id);
        return (
        <div key={a.id} className="border border-border/40 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Address #{idx + 1}{a.label ? ` — ${a.label}` : ""}</h3>
            {addresses.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => deleteRow("client_addresses", a.id)}><Trash2 className="w-4 h-4" /></Button>
            )}
          </div>
          <div>
            <Label>Full UK Address</Label>
            <Textarea
              rows={3}
              placeholder="e.g. 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom"
              value={a.address_line1 || ""}
              onChange={(e) => updateAddressField(a.id, { address_line1: e.target.value })}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Subscription Start Date" type="date" value={a.start_date} onChange={(v) => updateAddressField(a.id, { start_date: v })} />
            <Field label="Expiry Date" type="date" value={a.expire_date} onChange={(v) => updateAddressField(a.id, { expire_date: v })} />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="UTR Number" value={(a as any).utr_number} onChange={(v) => updateAddressField(a.id, { utr_number: v } as any)} />
            <Field label="Auth Code" value={(a as any).auth_code} onChange={(v) => updateAddressField(a.id, { auth_code: v } as any)} />
            <Field label="Activation Code" value={(a as any).activation_code} onChange={(v) => updateAddressField(a.id, { activation_code: v } as any)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => saveAddress(a)} disabled={saving} size="sm"><Save className="w-4 h-4 mr-2" />Save Address</Button>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a
                href={`https://wa.me/447418629900?text=${encodeURIComponent(`Hello Digiformation, I want to renew my registered office address${a.address_line1 ? ` (${a.address_line1})` : ""}. Please assist.`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Renew Address
              </a>
            </Button>
            <Button
              onClick={() => sendAddressReminder(a)}
              size="sm"
              variant="outline"
              title="Send address expiry reminder email to client"
            >
              <Mail className="w-4 h-4 mr-2" />Send Renewal Reminder
            </Button>
          </div>

          <div className="border-t border-border/40 pt-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="font-semibold text-sm">Address Documents</h4>
                <p className="text-xs text-muted-foreground">Upload proof / contracts / scans for this address.</p>
              </div>
              <input
                type="file"
                id={`addr-doc-upload-${a.id}`}
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
                  const { error: upErr } = await supabase.storage.from("client-docs").upload(path, file, { upsert: false, contentType: file.type });
                  if (upErr) { toast.error(upErr.message); e.target.value = ""; return; }
                  const sizeKb = file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / 1024 / 1024).toFixed(2)} MB`;
                  const ext = file.name.split(".").pop()?.toUpperCase() || "FILE";
                  const { error: insErr } = await supabase.from("client_documents").insert({
                    user_id: userId, name: file.name, file_url: path, file_type: ext, file_size: sizeKb, address_id: a.id,
                  } as any);
                  if (insErr) toast.error(insErr.message);
                  else { toast.success("Document uploaded"); await reload(); }
                  e.target.value = "";
                }}
              />
              <Button size="sm" variant="outline" onClick={() => document.getElementById(`addr-doc-upload-${a.id}`)?.click()}>
                Upload Document
              </Button>
            </div>
            {addressDocs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No documents attached to this address yet.</p>
            ) : (
              <div className="space-y-2">
                {addressDocs.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between gap-2 border border-border/40 rounded-lg p-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.file_type} · {d.file_size}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={async () => {
                      if (!d.file_url) return toast.error("No file attached");
                      const { data, error } = await supabase.storage.from("client-docs").createSignedUrl(d.file_url, 60, { download: d.name || true });
                      if (error) toast.error(error.message); else window.location.href = data.signedUrl;
                    }}><Download className="w-4 h-4 mr-1" />Download</Button>
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
      })}
    </div>
  );
};


export default LegacyAdmin;
