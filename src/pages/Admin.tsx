import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Search, ArrowLeft, Save, Plus, ShieldCheck, Users, Trash2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useSeo } from "@/lib/seo";

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
  const [loadingClients, setLoadingClients] = useState(false);

  useSeo({ title: "Admin Panel | Digiformation", description: "Internal admin panel", noindex: true });

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const ownerEmail = "digiformationltd@gmail.com";
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

  if (selected) return <Layout><ClientDetail userId={selected} onBack={() => setSelected(null)} /></Layout>;

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
                      <Button size="sm" onClick={() => setSelected(c.user_id)}>Manage</Button>
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

const ClientDetail = ({ userId, onBack }: { userId: string; onBack: () => void }) => {
  const [tab, setTab] = useState<"profile" | "company" | "addresses" | "orders" | "subs" | "wallet" | "docs">("profile");
  const [profile, setProfile] = useState<any>({});
  const [companies, setCompanies] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const reload = async () => {
    const [p, c, a, o, s, w, d] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("client_company_details").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
      supabase.from("client_addresses").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
      supabase.from("client_orders").select("*").eq("user_id", userId).order("order_date", { ascending: false }),
      supabase.from("client_subscriptions").select("*").eq("user_id", userId),
      supabase.from("client_wallet_transactions").select("*").eq("user_id", userId).order("txn_date", { ascending: false }),
      supabase.from("client_documents").select("*").eq("user_id", userId).order("doc_date", { ascending: false }),
    ]);
    setProfile(p.data || { user_id: userId });
    setCompanies(c.data || []);
    setAddresses(a.data || []);
    setOrders(o.data || []);
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

  const addCompany = async () => {
    const { error } = await supabase.from("client_company_details").insert({ user_id: userId, company_name: "New Company" });
    if (error) toast.error(error.message); else { toast.success("Company added"); reload(); }
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

  const addAddress = async () => {
    const { error } = await supabase.from("client_addresses").insert({ user_id: userId, label: "New Address", service_type: "registered_office" });
    if (error) toast.error(error.message); else { toast.success("Address added"); reload(); }
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

  const addOrder = async () => {
    const ref = "ORD-" + Date.now().toString().slice(-6);
    const { error } = await supabase.from("client_orders").insert({ user_id: userId, order_ref: ref, service: "New Service", status: "Pending", amount_gbp: 0 });
    if (error) toast.error(error.message); else { toast.success("Order added"); reload(); }
  };
  const updateOrder = async (id: string, patch: any) => {
    const { error } = await supabase.from("client_orders").update(patch).eq("id", id);
    if (error) toast.error(error.message); else reload();
  };
  const deleteRow = async (table: any, id: string) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); reload(); }
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
    { id: "company", label: "Company" },
    { id: "orders", label: `Orders (${orders.length})` },
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
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Company Name" value={company.company_name} onChange={(v) => setCompany({ ...company, company_name: v })} />
              <Field label="Company Number" value={company.company_number} onChange={(v) => setCompany({ ...company, company_number: v })} />
              <Field label="Director Name" value={company.director_name} onChange={(v) => setCompany({ ...company, director_name: v })} />
              <Field label="SIC Code" value={company.sic_code} onChange={(v) => setCompany({ ...company, sic_code: v })} />
              <Field label="Auth Code" value={company.auth_code} onChange={(v) => setCompany({ ...company, auth_code: v })} />
              <Field label="Incorporation Date" type="date" value={company.incorporation_date} onChange={(v) => setCompany({ ...company, incorporation_date: v })} />
              <Field label="Address Expire" type="date" value={company.address_expire} onChange={(v) => setCompany({ ...company, address_expire: v })} />
              <Field label="Confirmation Due" type="date" value={company.confirmation_due} onChange={(v) => setCompany({ ...company, confirmation_due: v })} />
              <Field label="Accounts Filing Due" type="date" value={company.accounts_filing_due} onChange={(v) => setCompany({ ...company, accounts_filing_due: v })} />
            </div>
            <div>
              <Label>Company Address</Label>
              <Textarea value={company.company_address || ""} onChange={(e) => setCompany({ ...company, company_address: e.target.value })} />
            </div>
            <div>
              <Label>Registered Address</Label>
              <Textarea value={company.registered_address || ""} onChange={(e) => setCompany({ ...company, registered_address: e.target.value })} />
            </div>
            <Button onClick={saveCompany} disabled={saving}><Save className="w-4 h-4 mr-2" />Save Company</Button>
          </div>
        )}

        {tab === "orders" && (
          <div className="space-y-3">
            <Button onClick={addOrder} size="sm"><Plus className="w-4 h-4 mr-2" />Add Order</Button>
            {orders.map(o => (
              <div key={o.id} className="border border-border/40 rounded-lg p-3 grid md:grid-cols-5 gap-2 items-center">
                <Input defaultValue={o.order_ref} onBlur={(e) => updateOrder(o.id, { order_ref: e.target.value })} placeholder="Ref" />
                <Input defaultValue={o.service} onBlur={(e) => updateOrder(o.id, { service: e.target.value })} placeholder="Service" />
                <Input defaultValue={o.status} onBlur={(e) => updateOrder(o.id, { status: e.target.value })} placeholder="Status" />
                <Input type="number" defaultValue={o.amount_gbp} onBlur={(e) => updateOrder(o.id, { amount_gbp: parseFloat(e.target.value) || 0 })} placeholder="£" />
                <Button variant="ghost" size="sm" onClick={() => deleteRow("client_orders", o.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        )}

        {tab === "subs" && (
          <div className="space-y-3">
            <Button onClick={addSub} size="sm"><Plus className="w-4 h-4 mr-2" />Add Subscription</Button>
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
            <Button onClick={addWallet} size="sm"><Plus className="w-4 h-4 mr-2" />Add Transaction</Button>
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
            <Button onClick={addDoc} size="sm"><Plus className="w-4 h-4 mr-2" />Add Document</Button>
            {docs.map(d => (
              <div key={d.id} className="border border-border/40 rounded-lg p-3 grid md:grid-cols-5 gap-2 items-center">
                <Input defaultValue={d.name} onBlur={(e) => updateDoc(d.id, { name: e.target.value })} placeholder="Name" />
                <Input defaultValue={d.file_type || ""} onBlur={(e) => updateDoc(d.id, { file_type: e.target.value })} placeholder="Type" />
                <Input defaultValue={d.file_size || ""} onBlur={(e) => updateDoc(d.id, { file_size: e.target.value })} placeholder="Size" />
                <Input defaultValue={d.file_url || ""} onBlur={(e) => updateDoc(d.id, { file_url: e.target.value })} placeholder="URL" />
                <Button variant="ghost" size="sm" onClick={() => deleteRow("client_documents", d.id)}><Trash2 className="w-4 h-4" /></Button>
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

export default Admin;
