import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CalendarDays, ShoppingBag, Wallet, Building2, FileText, UserCog,
  MapPin, ShoppingCart, Ticket, LifeBuoy, LogOut, UserCircle2,
  ChevronRight, Loader2, Inbox, Download, ArrowUpRight,
  LayoutDashboard,
  Menu, ShieldCheck, Save, Trash2, ChevronDown, ArrowLeft, Home,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logo from "@/assets/digiformation-logo.png";
import UserDrawer from "@/components/UserDrawer";
import { downloadInvoicePdf } from "@/lib/invoice";

type SectionId =
  | "overview" | "company" | "addresses" | "orders" | "invoices" | "wallet" | "documents"
  | "editAccount" | "newServices" | "tickets" | "openTicket";

const menu: { id: SectionId; label: string; icon: any }[] = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "company", label: "My Company", icon: Building2 },
  { id: "addresses", label: "Address Subscription", icon: MapPin },
  { id: "orders", label: "My Orders", icon: ShoppingBag },
  { id: "invoices", label: "My Invoices", icon: FileText },
  { id: "wallet", label: "My Wallet", icon: Wallet },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "editAccount", label: "Edit Account", icon: UserCog },
  { id: "newServices", label: "Order New Services", icon: ShoppingCart },
  { id: "tickets", label: "My Tickets", icon: Ticket },
  { id: "openTicket", label: "Open a Ticket", icon: LifeBuoy },
];

interface Profile {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  avatar_initials: string | null;
}

interface CompanyDetails {
  id: string;
  company_name: string | null;
  company_number: string | null;
  director_name: string | null;
  company_address: string | null;
  registered_address: string | null;
  correspondence_address: string | null;
  address_expire: string | null;
  confirmation_due: string | null;
  accounts_filing_due: string | null;
  auth_code: string | null;
  utr_number: string | null;
  activation_code: string | null;
  incorporation_date: string | null;
  sic_code: string | null;
  address_start: string | null;
  companies_house_personal_code: string | null;
}

const services = [
  { name: "Registered Office Address", price: "£40/yr", desc: "Use our address for your company (1 year contract)", icon: MapPin, link: "/uk-services/registered-office-address" },
  { name: "Business Service Address", price: "£60/yr", desc: "Use for company registration & marketing", icon: MapPin, link: "/uk-services/registered-office-address" },
  { name: "Director Service Address", price: "£20/yr", desc: "Address for 1 Director (1 year contract)", icon: UserCog, link: "/uk-services/registered-office-address#director-service" },
  { name: "Confirmation Statement", price: "£80", desc: "Annual confirmation filing with Companies House", icon: FileText, link: "/uk-compliance/confirmation-statement" },
  { name: "Annual Accounts Filing", price: "From £120", desc: "Annual accounts submission to HMRC", icon: FileText, link: "/uk-compliance/annual-accounts-filing" },
  { name: "Director Appoint / Remove", price: "£10", desc: "Add or remove a director", icon: UserCog, link: "/uk-compliance/director-appoint-remove" },
  { name: "Company Name Change", price: "£30", desc: "Change your registered company name", icon: Building2, link: "/uk-compliance/company-name-change" },
  { name: "Company Address Change", price: "£10", desc: "Update your registered office address", icon: MapPin, link: "/uk-compliance/company-address-change" },
  { name: "EIN Number (US)", price: "$30", desc: "EIN registration with IRS for your US LLC", icon: FileText, link: "/usa-services/ein-number" },
];

const StatusBadge = ({ status }: { status: string }) => {
  const variant =
    status === "ACTIVE" || status === "Active" || status === "Completed"
      ? "default"
      : status === "Pending" || status === "Open"
      ? "secondary"
      : "outline";
  return <Badge variant={variant}>{status}</Badge>;
};

const EmptyState = ({ icon: Icon, title, description, action }: { icon: any; title: string; description: string; action?: React.ReactNode }) => (
  <div className="glass rounded-2xl p-10 text-center">
    <div className="inline-flex w-14 h-14 items-center justify-center rounded-full bg-primary/10 mb-3">
      <Icon className="w-7 h-7 opacity-70" />
    </div>
    <h3 className="text-lg font-semibold mb-1">{title}</h3>
    <p className="text-sm opacity-70 max-w-md mx-auto">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [companies, setCompanies] = useState<CompanyDetails[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [walletRows, setWalletRows] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [active, setActive] = useState<SectionId>("overview");
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  // Sync active section from ?section= query param (used by the global UserDrawer for deep linking).
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const s = params.get("section") as SectionId | null;
    if (s && menu.some(m => m.id === s)) setActive(s);
  }, [location.search]);

  useEffect(() => {
    document.title = "Client Dashboard | DigiFormation Ltd";

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        navigate("/reset-password", { replace: true });
        return;
      }
      if (event === "SIGNED_OUT") {
        setUser(null);
        navigate("/auth", { replace: true });
        return;
      }
      // Handle initial session + sign in. INITIAL_SESSION always fires once on mount,
      // so we don't need a separate getSession() call (which would cause duplicate refreshes).
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        if (!session) {
          navigate("/auth", { replace: true });
          return;
        }
        if (session.user.email?.toLowerCase() === "info@digiformation.uk") {
          navigate("/admin", { replace: true });
          return;
        }
        setUser((prev) => (prev?.id === session.user.id ? prev : session.user));
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [{ data: prof }, { data: comps }, { data: role }, { data: orderRows }, { data: subRows }, { data: walletData }, { data: ticketRows }] = await Promise.all([
        supabase.from("profiles").select("full_name,email,phone,company_name,avatar_initials").eq("user_id", user.id).maybeSingle(),
        supabase.from("client_company_details").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
        supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle(),
        supabase.from("client_orders").select("*").eq("user_id", user.id).order("order_date", { ascending: false }),
        supabase.from("client_subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("client_wallet_transactions").select("*").eq("user_id", user.id).order("txn_date", { ascending: false }),
        supabase.from("client_tickets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      setProfile(prof as Profile);
      setCompanies((comps as CompanyDetails[]) || []);
      setOrders(orderRows || []);
      setSubscriptions(subRows || []);
      setWalletRows(walletData || []);
      setTickets(ticketRows || []);
      setIsAdmin(user.email?.toLowerCase() === "info@digiformation.uk" || !!role);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/", { replace: true });
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <Loader2 className="w-8 h-8 animate-spin opacity-60" />
      </div>
    );
  }

  const initials = profile?.avatar_initials || (profile?.full_name?.slice(0, 2) || user.email?.slice(0, 2) || "U").toUpperCase();
  const displayName = profile?.full_name?.trim() || user.email?.split("@")[0] || "Client";
  const walletBalance = walletRows.reduce((sum, row) => sum + (row.txn_type === "Debit" ? -Number(row.amount_gbp || 0) : Number(row.amount_gbp || 0)), 0);
  const formatGBP = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n || 0);

  return (
    <div className="min-h-screen bg-gradient-hero grid-pattern">
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="p-0 w-[280px] sm:w-[320px] bg-sidebar border-r border-border/40 flex flex-col">
          <div className="p-5 border-b border-border/40">
            <Link to="/" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
              <img src={logo} alt="Digiformation Ltd logo — UK LTD & US LLC formation for non-residents worldwide" className="h-20 sm:h-24 w-auto object-contain" />
              <div className="leading-tight">
                <div className="text-sm font-semibold">Client Portal</div>
              </div>
            </Link>
          </div>

          <div className="p-5 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gradient-brand grid place-items-center font-semibold text-sm shadow-glow shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{displayName}</div>
                <div className="text-xs opacity-70 truncate">{user.email}</div>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-3">
            {isAdmin && (
              <Button asChild variant="hero" className="w-full mb-3 rounded-full justify-start">
                <Link to="/admin" onClick={() => setMenuOpen(false)}>
                  <ShieldCheck className="w-4 h-4" />
                  Admin Panel
                </Link>
              </Button>
            )}
            {menu.map((m) => {
              const Icon = m.icon;
              const isActive = active === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => { setActive(m.id); setMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                    isActive ? "bg-primary/15 text-foreground" : "hover:bg-primary/10 opacity-80"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">{m.label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </nav>

          <div className="p-3 border-t border-border/40">
            <Button onClick={handleSignOut} variant="outline" className="w-full rounded-full">
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main */}
      <main className="min-w-0">
        {/* Portal context bar — clearly separates portal from public website */}
        <div className="sticky top-0 z-30 bg-primary/15 border-b border-border/40 backdrop-blur-md px-4 sm:px-6 py-2 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span className="font-semibold tracking-wide uppercase truncate">Client Portal</span>
            <span className="hidden sm:inline opacity-60">— Secure area</span>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 hover:bg-primary/10 transition shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <Home className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Back to Website</span>
            <span className="xs:hidden">Home</span>
          </Link>
        </div>

        {/* Top bar */}
        <header className="sticky top-[36px] sm:top-[40px] z-20 glass border-b border-border/40 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full w-12 h-12 sm:w-14 sm:h-14"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="!w-7 !h-7 sm:!w-8 sm:!h-8" />
            </Button>
            {active !== "overview" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActive("overview")}
                className="rounded-full hidden sm:inline-flex"
              >
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-brand grid place-items-center font-semibold text-sm shadow-glow"
              title={displayName}
            >
              {initials}
            </div>
            <Button onClick={handleSignOut} variant="hero" size="sm" className="rounded-full h-12 sm:h-14 px-4">
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        <div className="p-4 sm:p-8 max-w-6xl mx-auto">
          {active === "overview" && (
            <div className="space-y-6">
              <div className="glass rounded-2xl p-6 sm:p-8">
                <div className="text-xs opacity-70">Welcome back</div>
                <h2 className="text-2xl sm:text-3xl font-semibold mt-1">{displayName}</h2>
                <p className="text-sm opacity-75 mt-2 max-w-xl">
                  This is your client dashboard. Manage your company, track orders, raise tickets and order new services from one place.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Address", value: String(subscriptions.length || 0), icon: CalendarDays, id: "addresses" as SectionId },
                  { label: "Orders", value: String(orders.length), icon: ShoppingBag, id: "orders" as SectionId },
                  { label: "Wallet", value: formatGBP(walletBalance), icon: Wallet, id: "wallet" as SectionId },
                  { label: "Tickets", value: String(tickets.length), icon: Ticket, id: "tickets" as SectionId },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.label}
                      onClick={() => setActive(s.id)}
                      className="glass rounded-2xl p-5 text-left hover:shadow-glow transition"
                    >
                      <Icon className="w-5 h-5 opacity-70 mb-2" />
                      <div className="text-[11px] uppercase tracking-widest opacity-70">{s.label}</div>
                      <div className="text-xl font-semibold mt-1">{s.value}</div>
                    </button>
                  );
                })}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <button onClick={() => setActive("newServices")} className="glass rounded-2xl p-6 text-left hover:shadow-glow transition">
                  <ShoppingCart className="w-6 h-6 opacity-80 mb-2" />
                  <div className="font-semibold">Order New Services</div>
                  <p className="text-xs opacity-70 mt-1">Browse formations, addresses, compliance and more.</p>
                </button>
                <button onClick={() => setActive("openTicket")} className="glass rounded-2xl p-6 text-left hover:shadow-glow transition">
                  <LifeBuoy className="w-6 h-6 opacity-80 mb-2" />
                  <div className="font-semibold">Need help?</div>
                  <p className="text-xs opacity-70 mt-1">Open a support ticket — we usually reply within 24h.</p>
                </button>
              </div>
            </div>
          )}


          {active === "company" && (
            <MyCompaniesSection userId={user.id} companies={companies} onChange={setCompanies} editable={false} />
          )}

          {active === "addresses" && (
            <MyAddressesSection userId={user.id} editable={false} />
          )}

          {active === "orders" && (
            <ClientOrdersSection rows={orders} onBrowse={() => setActive("newServices")} />
          )}

          {active === "invoices" && (
            <ClientInvoicesSection userId={user.id} />
          )}

          {active === "wallet" && (
            <ClientWalletSection rows={walletRows} balance={walletBalance} />
          )}

          {active === "documents" && (
            <ClientDocumentsSection userId={user.id} />
          )}

          {active === "editAccount" && (
            <EditAccountForm profile={profile} email={user.email || ""} onSaved={(p) => setProfile(p)} />
          )}

          {active === "newServices" && (
            <div>
              <p className="text-sm opacity-70 mb-5">Browse and order any additional service for your company.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.name} className="glass rounded-xl p-5 hover:shadow-glow transition">
                      <Icon className="w-7 h-7 mb-3 opacity-80" />
                      <div className="font-semibold">{s.name}</div>
                      <div className="text-xs opacity-70 mt-1">{s.desc}</div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="font-semibold text-sm">{s.price}</span>
                        <Button asChild size="sm" variant="hero" className="rounded-full">
                          <Link to={(s as any).link || "/pricing"}>Order <ArrowUpRight className="w-3.5 h-3.5" /></Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}



          {active === "tickets" && (
            <ClientTicketsSection rows={tickets} onOpen={() => setActive("openTicket")} />
          )}

          {active === "openTicket" && <OpenTicketForm userId={user.id} onSubmitted={() => setActive("tickets")} />}
        </div>
      </main>
      <UserDrawer />
    </div>
  );
};

/* ---- forms ---- */

const EditAccountForm = ({ profile, email, onSaved }: { profile: Profile | null; email: string; onSaved: (p: Profile) => void }) => {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [companyName, setCompanyName] = useState(profile?.company_name || "");
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const update = {
      full_name: fullName.trim().slice(0, 100),
      phone: phone.trim().slice(0, 30),
      company_name: companyName.trim().slice(0, 150),
      avatar_initials: (fullName.trim() || email).slice(0, 2).toUpperCase(),
    };
    const { error } = await supabase.from("profiles").update(update).eq("user_id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Account updated");
    onSaved({ ...(profile || {} as Profile), ...update, email });
  };

  return (
    <form onSubmit={save} className="glass rounded-2xl p-6 sm:p-8 space-y-5 max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fn">Full Name</Label>
          <Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="em">Email</Label>
          <Input id="em" value={email} disabled className="mt-1.5 opacity-70" />
        </div>
        <div>
          <Label htmlFor="ph">Phone</Label>
          <Input id="ph" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 7700 000000" className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="co">Company Name</Label>
          <Input id="co" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1.5" />
        </div>
      </div>
      <Button type="submit" variant="hero" className="rounded-full" disabled={saving}>
        {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
      </Button>
    </form>
  );
};

interface AddressRow {
  id: string;
  label: string;
  service_type: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  county: string | null;
  postcode: string | null;
  country: string | null;
  start_date: string | null;
  expire_date: string | null;
  status: string;
  notes: string | null;
  utr_number: string | null;
  auth_code: string | null;
  activation_code: string | null;
}

const MyCompaniesSection = ({ userId, companies, onChange, editable = false }: { userId: string; companies: CompanyDetails[]; onChange: (c: CompanyDetails[]) => void; editable?: boolean }) => {
  const [savingId, setSavingId] = useState<string | null>(null);

  const updateField = (id: string, patch: Partial<CompanyDetails>) => {
    onChange(companies.map(c => c.id === id ? { ...c, ...patch } : c));
  };

  const saveCompany = async (c: CompanyDetails) => {
    setSavingId(c.id);
    const { id, ...rest } = c as any;
    const cleaned: any = { ...rest };
    delete cleaned.created_at; delete cleaned.updated_at; delete cleaned.user_id;
    ["incorporation_date", "address_expire", "address_start", "confirmation_due", "accounts_filing_due"].forEach(k => {
      if (cleaned[k] === "") cleaned[k] = null;
    });
    const { error } = await supabase.from("client_company_details").update(cleaned).eq("id", id);
    setSavingId(null);
    if (error) toast.error(error.message); else toast.success("Company saved");
  };

  const deleteCompany = async (id: string) => {
    if (!confirm("Delete this company?")) return;
    const { error } = await supabase.from("client_company_details").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    onChange(companies.filter(c => c.id !== id));
    toast.success("Company removed");
  };

  // Top section (company info) — order matches admin panel
  const topFields: { key: keyof CompanyDetails; label: string; type?: string }[] = [
    { key: "company_name", label: "Company Name" },
    { key: "company_number", label: "Company Number" },
    { key: "incorporation_date", label: "Incorporation Date", type: "date" },
    { key: "confirmation_due", label: "Confirmation Statement Due", type: "date" },
    { key: "accounts_filing_due", label: "Annual Filing Due", type: "date" },
    { key: "auth_code", label: "Authentication Code" },
    { key: "activation_code", label: "Activation Code" },
    { key: "utr_number", label: "UTR Number" },
    { key: "director_name", label: "Director Name" },
    { key: "sic_code", label: "SIC Code" },
  ];
  // Address section — order matches admin panel
  const addressTextFields: { key: keyof CompanyDetails; label: string }[] = [
    { key: "registered_address", label: "Registered Office Address" },
    { key: "correspondence_address", label: "Correspondence Address" },
  ];
  const addressDateFields: { key: keyof CompanyDetails; label: string }[] = [
    { key: "address_start", label: "Address Start Date" },
    { key: "address_expire", label: "Address Expiry Date" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm opacity-70">Your registered company details. Contact our team if anything needs updating.</p>
      </div>

      {companies.length === 0 && (
        <EmptyState
          icon={Building2}
          title="No company details on file"
          description="Your company details will appear here once added by our team."
        />
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        {companies.map((c, idx) => (
          <CompanyCard
            key={c.id}
            company={c}
            index={idx}
            topFields={topFields}
            addressTextFields={addressTextFields}
            addressDateFields={addressDateFields}
            editable={editable}
            saving={savingId === c.id}
            onChange={(patch) => updateField(c.id, patch)}
            onSave={() => saveCompany(c)}
            onDelete={() => deleteCompany(c.id)}
          />
        ))}
      </div>
    </div>
  );
};

const CompanyCard = ({
  company: c, index: idx, topFields, addressTextFields, addressDateFields, saving, editable = true, onChange, onSave, onDelete,
}: {
  company: CompanyDetails; index: number;
  topFields: { key: keyof CompanyDetails; label: string; type?: string }[];
  addressTextFields: { key: keyof CompanyDetails; label: string }[];
  addressDateFields: { key: keyof CompanyDetails; label: string }[];
  saving: boolean;
  editable?: boolean;
  onChange: (patch: Partial<CompanyDetails>) => void;
  onSave: () => void; onDelete: () => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="px-6 pt-5 pb-3 border-b border-border/40">
        <h3 className="font-bold text-lg uppercase tracking-wide">{c.company_name?.trim() || `Company #${idx + 1}`}</h3>
      </div>
      <div className="p-6 space-y-3 text-sm">
        <Row label="Company No:" value={c.company_number} />
        <Row label="Director's Name:" value={c.director_name} />
        <Row label="Registered Office Address" value={c.registered_address} multiline />
        <Row label="Correspondence Address" value={c.correspondence_address} multiline />
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 underline hover:opacity-80 mt-2"
        >
          {open ? "Hide Info" : "View More Info"}
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="pt-4 mt-2 border-t border-border/40 space-y-5">
            {(() => {
              const nameField = topFields.find(f => f.key === "company_name");
              const restFields = topFields.filter(f => f.key !== "company_name");
              const renderField = (f: { key: keyof CompanyDetails; label: string; type?: string }) => (
                <div key={f.key as string}>
                  <Label className="text-[11px] uppercase tracking-wider text-white/60">{f.label}</Label>
                  <Input
                    type={f.type || "text"}
                    value={(c[f.key] as string) || ""}
                    onChange={(e) => onChange({ [f.key]: e.target.value } as any)}
                    className="mt-1.5 text-white"
                    readOnly={!editable}
                    disabled={!editable}
                  />
                </div>
              );
              return (
                <>
                  {nameField && (
                    <div className="grid sm:grid-cols-2 gap-3">{renderField(nameField)}</div>
                  )}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-white/80">Companies House Personal Code</h4>
                    <p className="text-[11px] text-white/60">11-character code per director. Add one per line for multiple directors.</p>
                    <Textarea
                      value={(c.companies_house_personal_code as string) || ""}
                      onChange={(e) => onChange({ companies_house_personal_code: e.target.value } as any)}
                      className="mt-1.5 text-white"
                      rows={4}
                      placeholder={"Director 1: XXXXXXXXXXX\nDirector 2: XXXXXXXXXXX"}
                      readOnly={!editable}
                      disabled={!editable}
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">{restFields.map(renderField)}</div>
                </>
              );
            })()}

            <div className="pt-4 border-t border-border/40 space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white/80">Address Details</h4>
              {addressTextFields.map(f => (
                <div key={f.key as string}>
                  <Label className="text-[11px] uppercase tracking-wider text-white/60">{f.label}</Label>
                  <Textarea
                    value={(c[f.key] as string) || ""}
                    onChange={(e) => onChange({ [f.key]: e.target.value } as any)}
                    className="mt-1.5 text-white"
                    rows={2}
                    readOnly={!editable}
                    disabled={!editable}
                  />
                </div>
              ))}
              <div className="grid sm:grid-cols-2 gap-3">
                {addressDateFields.map(f => (
                  <div key={f.key as string}>
                    <Label className="text-[11px] uppercase tracking-wider text-white/60">{f.label}</Label>
                    <Input
                      type="date"
                      value={(c[f.key] as string) || ""}
                      onChange={(e) => onChange({ [f.key]: e.target.value } as any)}
                      className="mt-1.5 text-white"
                      readOnly={!editable}
                      disabled={!editable}
                    />
                  </div>
                ))}
              </div>
            </div>

            {editable && (
              <div className="flex justify-between items-center">
                <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
                <Button variant="hero" size="sm" className="rounded-full" onClick={onSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save</>}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Row = ({ label, value, multiline = false }: { label: string; value?: string | null; multiline?: boolean }) => (
  <div className={multiline ? "grid grid-cols-[140px_1fr] gap-3 items-start" : "grid grid-cols-[140px_1fr] gap-3 items-center"}>
    <span className="font-semibold text-white">{label}</span>
    <span className={multiline ? "text-white whitespace-pre-line" : "text-white"}>{value?.trim() || "—"}</span>
  </div>
);


const MyAddressesSection = ({ userId, editable = false }: { userId: string; editable?: boolean }) => {
  const [rows, setRows] = useState<AddressRow[] | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("client_addresses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setRows((data as AddressRow[]) || []);
  };

  useEffect(() => {
    load();
  }, [userId]);

  const updateField = (id: string, patch: Partial<AddressRow>) => {
    setRows(prev => (prev || []).map(a => a.id === id ? { ...a, ...patch } : a));
  };

  const saveAddress = async (a: AddressRow) => {
    setSavingId(a.id);
    const { id, ...rest } = a as any;
    const cleaned = { ...rest };
    ["start_date", "expire_date"].forEach(k => { if (cleaned[k] === "") cleaned[k] = null; });
    const { error } = await supabase.from("client_addresses").update(cleaned).eq("id", id);
    setSavingId(null);
    if (error) toast.error(error.message); else toast.success("Address saved");
  };

  const deleteAddress = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    const { error } = await supabase.from("client_addresses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows(prev => (prev || []).filter(a => a.id !== id));
    toast.success("Address removed");
  };

  if (rows === null) {
    return <div className="glass rounded-2xl p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto opacity-60" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm opacity-70">{editable ? "Manage registered office, business service, and director address records." : "Standalone address services you have purchased from DigiFormation Ltd."}</p>
      </div>
      {rows.length === 0 && <EmptyState icon={MapPin} title="No address on file" description="Address details will appear here once added by our team." />}
      <div className="grid sm:grid-cols-2 gap-5">
        {rows.map((a) => (
          <AddressCard
            key={a.id}
            address={a}
            editable={editable}
            saving={savingId === a.id}
            onChange={(patch) => updateField(a.id, patch)}
            onSave={() => saveAddress(a)}
            onDelete={() => deleteAddress(a.id)}
          />
        ))}
      </div>
    </div>
  );
};

const AddressCard = ({
  address: a, editable, saving, onChange, onSave, onDelete,
}: {
  address: AddressRow; editable: boolean; saving: boolean;
  onChange: (patch: Partial<AddressRow>) => void;
  onSave: () => void; onDelete: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const fullAddress = [a.address_line1, a.address_line2, a.city, a.county, a.postcode, a.country].filter(Boolean).join(", ");
  const isExpired = (() => {
    if (a.expire_date) {
      const exp = new Date(a.expire_date);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (!isNaN(exp.getTime()) && exp < today) return true;
    }
    return a.status !== "active";
  })();

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="px-6 pt-5 pb-3 border-b border-border/40 flex items-center justify-between gap-2">
        <h3 className="font-bold text-lg uppercase tracking-wide truncate">{a.label?.trim() || "Address"}</h3>
        <StatusBadge status={isExpired ? "Expired" : "Active"} />
      </div>
      <div className="p-6 space-y-3 text-sm">
        <Row label="Service Type:" value={(a.service_type || "").replace(/_/g, " ")} />
        <Row label="Postcode:" value={a.postcode} />
        <Row label="Address" value={fullAddress} multiline />
        {(editable || a.start_date || a.expire_date) && (
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 underline hover:opacity-80 mt-2"
          >
            {open ? "Hide Info" : "View More Info"}
            <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        )}
        {open && (
          <div className="pt-4 mt-2 border-t border-border/40 space-y-4">
            {editable ? (
              <>
                <div className="grid sm:grid-cols-2 gap-3">
                  <AddressField label="Label" value={a.label} onChange={(v) => onChange({ label: v })} />
                  <AddressField label="Service Type" value={a.service_type} onChange={(v) => onChange({ service_type: v })} />
                  <AddressField label="Address Line 1" value={a.address_line1} onChange={(v) => onChange({ address_line1: v })} />
                  <AddressField label="Address Line 2" value={a.address_line2} onChange={(v) => onChange({ address_line2: v })} />
                  <AddressField label="City" value={a.city} onChange={(v) => onChange({ city: v })} />
                  <AddressField label="County" value={a.county} onChange={(v) => onChange({ county: v })} />
                  <AddressField label="Postcode" value={a.postcode} onChange={(v) => onChange({ postcode: v })} />
                  <AddressField label="Country" value={a.country} onChange={(v) => onChange({ country: v })} />
                  <AddressField label="Start Date" type="date" value={a.start_date} onChange={(v) => onChange({ start_date: v })} />
                  <AddressField label="Expiry Date" type="date" value={a.expire_date} onChange={(v) => onChange({ expire_date: v })} />
                  <AddressField label="Status" value={a.status} onChange={(v) => onChange({ status: v })} />
                </div>
                <div>
                  <Label className="text-[11px] uppercase tracking-wider opacity-60">Notes</Label>
                  <Textarea value={a.notes || ""} onChange={(e) => onChange({ notes: e.target.value })} className="mt-1.5" rows={3} />
                </div>
                <div className="flex justify-between items-center">
                  <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </Button>
                  <Button variant="hero" size="sm" className="rounded-full" onClick={onSave} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save</>}
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-[11px] uppercase tracking-wider opacity-60">Start Date</Label><div className="mt-1">{a.start_date || "—"}</div></div>
                  <div><Label className="text-[11px] uppercase tracking-wider opacity-60">Expiry Date</Label><div className="mt-1">{a.expire_date || "—"}</div></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div><Label className="text-[11px] uppercase tracking-wider opacity-60">Auth Code</Label><div className="mt-1 font-mono">{a.auth_code || "—"}</div></div>
                  <div><Label className="text-[11px] uppercase tracking-wider opacity-60">Activation Code</Label><div className="mt-1 font-mono">{a.activation_code || "—"}</div></div>
                  <div><Label className="text-[11px] uppercase tracking-wider opacity-60">UTR Number</Label><div className="mt-1 font-mono">{a.utr_number || "—"}</div></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const AddressField = ({ label, value, onChange, type = "text" }: { label: string; value: any; onChange: (v: string) => void; type?: string }) => (
  <div>
    <Label className="text-[11px] uppercase tracking-wider opacity-60">{label}</Label>
    <Input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} className="mt-1.5" />
  </div>
);

const ClientOrdersSection = ({ rows, onBrowse }: { rows: any[]; onBrowse: () => void }) => {
  const fmt = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n || 0);
  if (rows.length === 0) return <EmptyState icon={ShoppingBag} title="No orders yet" description="Your service orders will appear here automatically once placed." action={<Button variant="hero" className="rounded-full" onClick={onBrowse}>Place First Order</Button>} />;
  return <div className="space-y-3"><p className="text-sm opacity-70">Your orders are generated automatically from service requests.</p>{rows.map((o) => <div key={o.id} className="glass rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap"><div><div className="font-mono font-semibold text-primary">{o.order_ref}</div><div className="text-sm">{o.service}</div><div className="text-xs opacity-60">{o.order_date} • {fmt(Number(o.amount_gbp))}</div></div><StatusBadge status={o.status} /></div>)}</div>;
};

const ClientSubscriptionsSection = ({ rows, onBrowse }: { rows: any[]; onBrowse: () => void }) => {
  const fmt = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n || 0);
  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  if (rows.length === 0) return <EmptyState icon={CalendarDays} title="No active subscriptions" description="Recurring services like address renewals will appear here automatically." action={<Button variant="hero" className="rounded-full" onClick={onBrowse}>Browse Services</Button>} />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold">My Subscriptions</h3>
          <p className="text-sm opacity-70">Manage recurring services, view renewal dates and take action on each subscription.</p>
        </div>
        <Button variant="hero" size="sm" className="rounded-full" onClick={onBrowse}>Browse Services</Button>
      </div>

      {/* Desktop table */}
      <div className="glass rounded-2xl overflow-hidden hidden md:block">
        <table className="w-full text-sm">
          <thead className="bg-primary/5 text-left text-xs uppercase tracking-wider opacity-80">
            <tr>
              <th className="px-5 py-3 font-semibold">Subscription</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Start Date</th>
              <th className="px-5 py-3 font-semibold">Next Payment</th>
              <th className="px-5 py-3 font-semibold">Total</th>
              <th className="px-5 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {rows.map((s) => (
              <tr key={s.id} className="hover:bg-primary/5 transition-colors">
                <td className="px-5 py-4">
                  <div className="font-mono text-xs text-primary">#{String(s.id).slice(0, 8).toUpperCase()}</div>
                  <div className="font-semibold">{s.plan_name}</div>
                </td>
                <td className="px-5 py-4"><StatusBadge status={s.status} /></td>
                <td className="px-5 py-4 whitespace-nowrap">{fmtDate(s.start_date)}</td>
                <td className="px-5 py-4 whitespace-nowrap">{fmtDate(s.next_billing || s.renewal_date)}</td>
                <td className="px-5 py-4 whitespace-nowrap font-semibold">{fmt(Number(s.price_gbp))} <span className="opacity-60 font-normal text-xs">/ {s.period}</span></td>
                <td className="px-5 py-4 text-right">
                  <Button size="sm" variant="outline" className="rounded-full">View</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {rows.map((s) => (
          <div key={s.id} className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] text-primary">#{String(s.id).slice(0, 8).toUpperCase()}</div>
                <div className="font-semibold">{s.plan_name}</div>
              </div>
              <StatusBadge status={s.status} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><div className="opacity-60">Start</div><div className="font-medium">{fmtDate(s.start_date)}</div></div>
              <div><div className="opacity-60">Next Payment</div><div className="font-medium">{fmtDate(s.next_billing || s.renewal_date)}</div></div>
              <div className="col-span-2"><div className="opacity-60">Total</div><div className="font-semibold">{fmt(Number(s.price_gbp))} <span className="opacity-60 font-normal">/ {s.period}</span></div></div>
            </div>
            <Button size="sm" variant="outline" className="rounded-full w-full">View</Button>
          </div>
        ))}
      </div>
    </div>
  );
};

const ClientWalletSection = ({ rows, balance }: { rows: any[]; balance: number }) => {
  const fmt = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n || 0);
  return <div className="space-y-5"><div className="glass rounded-2xl p-6"><div className="text-xs opacity-70">Current Balance</div><div className="text-3xl font-semibold mt-1">{fmt(balance)}</div></div>{rows.length === 0 ? <EmptyState icon={Wallet} title="No transactions yet" description="Wallet top-ups, payments and refunds will be tracked here automatically." /> : <div className="space-y-3">{rows.map((w) => <div key={w.id} className="glass rounded-xl p-4 flex items-center justify-between gap-3"><div><div className="font-medium">{w.description}</div><div className="text-xs opacity-60">{w.txn_ref} • {w.txn_date} • {w.txn_type}</div></div><div className="font-semibold">{fmt(Number(w.amount_gbp))}</div></div>)}</div>}</div>;
};

const ClientTicketsSection = ({ rows, onOpen }: { rows: any[]; onOpen: () => void }) => {
  if (rows.length === 0) return <EmptyState icon={Ticket} title="No support tickets" description="Any support requests you raise will be tracked here with replies from our team." action={<Button variant="hero" className="rounded-full" onClick={onOpen}>Open a Ticket</Button>} />;
  return <div className="space-y-3"><div className="flex justify-end"><Button variant="hero" size="sm" className="rounded-full" onClick={onOpen}>Open Ticket</Button></div>{rows.map((t) => <div key={t.id} className="glass rounded-xl p-4"><div className="flex items-center justify-between gap-3 flex-wrap"><div><div className="font-mono text-xs text-primary">{t.ticket_ref}</div><div className="font-semibold">{t.subject}</div></div><StatusBadge status={t.status} /></div><p className="text-sm opacity-75 mt-2 line-clamp-2">{t.message}</p><div className="text-xs opacity-60 mt-2">{new Date(t.created_at).toLocaleString()}</div></div>)}</div>;
};

const ClientDocumentsSection = ({ userId }: { userId: string }) => {
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("client_documents")
        .select("*")
        .eq("user_id", userId)
        .order("doc_date", { ascending: false });
      setRows(data || []);
    })();
  }, [userId]);

  const download = async (path: string, name: string) => {
    const { data, error } = await supabase.storage.from("client-docs").createSignedUrl(path, 60, { download: name || true });
    if (error) { toast.error(error.message); return; }
    window.location.href = data.signedUrl;
  };

  if (rows === null) return <div className="glass rounded-2xl p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto opacity-60" /></div>;
  if (rows.length === 0) return (
    <EmptyState icon={FileText} title="No documents yet" description="Certificates, memorandums, confirmation statements and letters will be available to download here." />
  );

  return (
    <div className="space-y-3">
      <p className="text-sm opacity-70">Documents uploaded by DigiFormation. You can download them but cannot edit.</p>
      {rows.map((d) => (
        <div key={d.id} className="glass rounded-xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="w-5 h-5 opacity-70 shrink-0" />
            <div className="min-w-0">
              <div className="font-medium truncate">{d.name}</div>
              <div className="text-xs opacity-60">{[d.file_type, d.file_size, d.doc_date].filter(Boolean).join(" • ")}</div>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => download(d.file_url, d.name)} disabled={!d.file_url}>
            <Download className="w-4 h-4 mr-2" />Download
          </Button>
        </div>
      ))}
    </div>
  );
};

const ClientInvoicesSection = ({ userId }: { userId: string }) => {
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", userId)
        .order("issue_date", { ascending: false });
      setRows(data || []);
    })();
  }, [userId]);

  if (rows === null) return <div className="glass rounded-2xl p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto opacity-60" /></div>;
  if (rows.length === 0) return (
    <EmptyState icon={FileText} title="No invoices yet" description="Invoices for your purchased services will appear here. You can download each one as a PDF." />
  );

  const fmt = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n || 0);

  return (
    <div className="space-y-3">
      <p className="text-sm opacity-70">Your invoices. Read-only — download as PDF for your records.</p>
      {rows.map((i) => (
        <div key={i.id} className="glass rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="font-mono font-semibold text-primary">{i.invoice_number}</div>
            <div className="text-sm truncate">{i.service_description}</div>
            <div className="text-xs opacity-60">Issued {i.issue_date} • {i.status} • {fmt(Number(i.total_gbp))}</div>
          </div>
          <Button size="sm" variant="outline" onClick={() => downloadInvoicePdf(i)}>
            <Download className="w-4 h-4 mr-2" />Download PDF
          </Button>
        </div>
      ))}
    </div>
  );
};

const OpenTicketForm = ({ userId, onSubmitted }: { userId: string; onSubmitted: () => void }) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim().length < 3) return toast.error("Subject too short");
    if (message.trim().length < 10) return toast.error("Please describe your issue (min 10 chars)");
    setSubmitting(true);
    const ref = `TKT-${Date.now().toString().slice(-6)}`;
    const trimmedSubject = subject.trim().slice(0, 200);
    const trimmedMessage = message.trim().slice(0, 5000);
    const { error } = await supabase.from("client_tickets").insert({
      user_id: userId,
      ticket_ref: ref,
      subject: trimmedSubject,
      message: trimmedMessage,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    // Send ticket confirmation email
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const { data: prof } = await supabase.from("profiles").select("full_name").eq("user_id", userId).maybeSingle();
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "ticket-received",
          recipientEmail: user.email,
          idempotencyKey: `ticket-${ref}`,
          templateData: { customerName: prof?.full_name, ticketRef: ref, subject: trimmedSubject, message: trimmedMessage },
        },
      }).catch(console.error);
    }
    toast.success(`Ticket ${ref} submitted`);
    setSubject(""); setMessage("");
    onSubmitted();
  };

  return (
    <form onSubmit={submit} className="glass rounded-2xl p-6 sm:p-8 space-y-5 max-w-2xl">
      <div>
        <Label htmlFor="sub">Subject</Label>
        <Input id="sub" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Address forwarding query" className="mt-1.5" />
      </div>
      <div>
        <Label htmlFor="msg">Message</Label>
        <Textarea id="msg" value={message} onChange={(e) => setMessage(e.target.value)} rows={6} placeholder="Describe your issue in detail..." className="mt-1.5" />
      </div>
      <Button type="submit" variant="hero" className="rounded-full" disabled={submitting}>
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Submit Ticket
      </Button>
      <p className="text-xs opacity-70">Our team typically responds within 24 hours at <a href="mailto:info@digiformation.uk" className="underline">info@digiformation.uk</a>.</p>
    </form>
  );
};


export default Dashboard;
