import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  ChevronRight, Loader2, Inbox, Plus, Download, ArrowUpRight,
  Handshake, Link2, TrendingUp, Copy, Megaphone, GraduationCap, LayoutDashboard,
  Menu, ShieldCheck,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logo from "@/assets/digiformation-logo.png";

type SectionId =
  | "overview" | "subscriptions" | "orders" | "wallet" | "company" | "documents"
  | "editAccount" | "editAddress" | "newServices" | "tickets" | "openTicket"
  | "affiliate";

const menu: { id: SectionId; label: string; icon: any }[] = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "subscriptions", label: "Subscriptions", icon: CalendarDays },
  { id: "orders", label: "My Orders", icon: ShoppingBag },
  { id: "wallet", label: "My Wallet", icon: Wallet },
  { id: "company", label: "My Companies", icon: Building2 },
  { id: "editAddress", label: "My Addresses", icon: MapPin },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "editAccount", label: "Edit Account", icon: UserCog },
  { id: "newServices", label: "Order New Services", icon: ShoppingCart },
  { id: "affiliate", label: "Affiliate Program", icon: Handshake },
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
  company_name: string | null;
  company_number: string | null;
  director_name: string | null;
  company_address: string | null;
  registered_address: string | null;
  address_expire: string | null;
  confirmation_due: string | null;
  accounts_filing_due: string | null;
  auth_code: string | null;
  incorporation_date: string | null;
  sic_code: string | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [active, setActive] = useState<SectionId>("overview");
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

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
      const [{ data: prof }, { data: comp }, { data: role }] = await Promise.all([
        supabase.from("profiles").select("full_name,email,phone,company_name,avatar_initials").eq("user_id", user.id).maybeSingle(),
        supabase.from("client_company_details").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle(),
      ]);
      if (cancelled) return;
      setProfile(prof as Profile);
      setCompany(comp as CompanyDetails);
      setIsAdmin(user.email?.toLowerCase() === "digiformationltd@gmail.com" || !!role);
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
  const displayName = profile?.full_name || user.email?.split("@")[0] || "Client";

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
        {/* Top bar */}
        <header className="sticky top-0 z-20 glass border-b border-border/40 px-4 sm:px-6 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full w-12 h-12 sm:w-14 sm:h-14"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="!w-7 !h-7 sm:!w-8 sm:!h-8" />
          </Button>
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
                  { label: "Subscriptions", value: "0", icon: CalendarDays, id: "subscriptions" as SectionId },
                  { label: "Orders", value: "0", icon: ShoppingBag, id: "orders" as SectionId },
                  { label: "Wallet", value: "£0.00", icon: Wallet, id: "wallet" as SectionId },
                  { label: "Tickets", value: "0", icon: Ticket, id: "tickets" as SectionId },
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

          {active === "subscriptions" && (
            <EmptyState
              icon={CalendarDays}
              title="No active subscriptions"
              description="When you purchase a recurring service like Registered Address or Confirmation Statement, your active subscriptions will appear here."
              action={<Button variant="hero" className="rounded-full" onClick={() => setActive("newServices")}><Plus className="w-4 h-4" /> Browse Services</Button>}
            />
          )}

          {active === "orders" && (
            <EmptyState
              icon={ShoppingBag}
              title="No orders yet"
              description="Your service orders — company formations, filings, address services — will be listed here once placed."
              action={<Button variant="hero" className="rounded-full" onClick={() => setActive("newServices")}><Plus className="w-4 h-4" /> Place First Order</Button>}
            />
          )}

          {active === "wallet" && (
            <div className="space-y-5">
              <div className="glass rounded-2xl p-6">
                <div className="text-xs opacity-70">Current Balance</div>
                <div className="text-3xl font-semibold mt-1">£0.00</div>
                <Button variant="hero" size="sm" className="rounded-full mt-4">
                  <Plus className="w-4 h-4" /> Top Up Wallet
                </Button>
              </div>
              <EmptyState
                icon={Wallet}
                title="No transactions yet"
                description="All wallet top-ups, payments and refunds will be tracked here for your records."
              />
            </div>
          )}

          {active === "company" && (
            <div className="glass rounded-2xl p-6 sm:p-8">
              {company ? (
                <>
                  <h2 className="text-xl font-semibold mb-1">{company.company_name || "Company"}</h2>
                  <p className="text-xs opacity-70 mb-6">Company No: {company.company_number || "—"}</p>
                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                    {[
                      ["Director Name", company.director_name],
                      ["Incorporation Date", company.incorporation_date],
                      ["Company Address", company.company_address],
                      ["Registered Address", company.registered_address],
                      ["Address Expire", company.address_expire],
                      ["Confirmation Due", company.confirmation_due],
                      ["Accounts Filing Due", company.accounts_filing_due],
                      ["Auth Code", company.auth_code],
                      ["SIC Code", company.sic_code],
                    ].map(([l, v]) => (
                      <div key={l as string}>
                        <div className="text-[11px] uppercase tracking-wider opacity-60">{l}</div>
                        <div className="text-sm mt-1">{(v as string) || "—"}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={Building2}
                  title="No company details on file"
                  description="Once you incorporate a company through us, all its details — company number, addresses, filing dates and authentication code — will appear here."
                  action={<Button asChild variant="hero" className="rounded-full"><Link to="/uk-services/uk-ltd-formation">Form a UK Company</Link></Button>}
                />
              )}
            </div>
          )}

          {active === "documents" && (
            <ClientDocumentsSection userId={user.id} />
          )}

          {active === "editAccount" && (
            <EditAccountForm profile={profile} email={user.email || ""} onSaved={(p) => setProfile(p)} />
          )}

          {active === "editAddress" && <MyAddressesSection userId={user.id} />}

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

          {active === "affiliate" && <AffiliateDashboardSection user={user} displayName={displayName} />}

          {active === "tickets" && (
            <EmptyState
              icon={Ticket}
              title="No support tickets"
              description="Any support requests you raise will be tracked here with replies from our team."
              action={<Button variant="hero" className="rounded-full" onClick={() => setActive("openTicket")}><Plus className="w-4 h-4" /> Open a Ticket</Button>}
            />
          )}

          {active === "openTicket" && <OpenTicketForm userId={user.id} onSubmitted={() => setActive("tickets")} />}
        </div>
      </main>
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
}

const MyAddressesSection = ({ userId }: { userId: string }) => {
  const [rows, setRows] = useState<AddressRow[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("client_addresses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setRows((data as AddressRow[]) || []);
    })();
  }, [userId]);

  if (rows === null) {
    return <div className="glass rounded-2xl p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto opacity-60" /></div>;
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title="No addresses on file"
        description="If you've purchased a standalone Registered Office Address or Director Service Address (without a company), it will appear here. Need one? Order below."
        action={<Button asChild variant="hero" className="rounded-full"><Link to="/uk-services/registered-office-address">Order Registered Address</Link></Button>}
      />
    );
  }

  const formatAddr = (a: AddressRow) =>
    [a.address_line1, a.address_line2, a.city, a.county, a.postcode, a.country].filter(Boolean).join(", ");

  return (
    <div className="space-y-4">
      <p className="text-sm opacity-70">Standalone address services you have purchased from DigiFormation Ltd.</p>
      {rows.map((a) => (
        <div key={a.id} className="glass rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 opacity-70" />
                <h3 className="font-semibold">{a.label}</h3>
                <StatusBadge status={a.status === "active" ? "Active" : "Expired"} />
              </div>
              <p className="text-sm opacity-80">{formatAddr(a) || "—"}</p>
            </div>
            <div className="text-xs opacity-70 text-right">
              {a.start_date && <div>Start: {a.start_date}</div>}
              {a.expire_date && <div>Expires: {a.expire_date}</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
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
    const { data, error } = await supabase.storage.from("client-docs").createSignedUrl(path, 60, { download: name });
    if (error) { toast.error(error.message); return; }
    window.open(data.signedUrl, "_blank");
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
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subject.trim().length < 3) return toast.error("Subject too short");
    if (message.trim().length < 10) return toast.error("Please describe your issue (min 10 chars)");
    setSubmitting(true);
    const ref = `TKT-${Date.now().toString().slice(-6)}`;
    const { error } = await supabase.from("client_tickets").insert({
      user_id: userId,
      ticket_ref: ref,
      subject: subject.trim().slice(0, 200),
      message: message.trim().slice(0, 5000),
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
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
      <p className="text-xs opacity-70">Our team typically responds within 24 hours at <a href="mailto:digiformationltd@gmail.com" className="underline">digiformationltd@gmail.com</a>.</p>
    </form>
  );
};

/* ---- Affiliate Dashboard Section ---- */

const AffiliateDashboardSection = ({ user, displayName }: { user: User; displayName: string }) => {
  const refCode = (user.id?.slice(0, 8) || "YOURCODE").toUpperCase();
  const refLink = `https://digiformation.uk/?ref=${refCode}`;

  const stats = [
    { label: "Total Clicks", value: "0", icon: Link2 },
    { label: "Signups", value: "0", icon: UserCircle2 },
    { label: "Paid Orders", value: "0", icon: ShoppingBag },
    { label: "Pending Commission", value: "£0.00", icon: Wallet },
    { label: "Lifetime Earnings", value: "£0.00", icon: TrendingUp },
    { label: "Tier", value: "Starter", icon: Handshake },
  ];

  const trainingItems = [
    { icon: Megaphone, title: "Advertising — done with you", desc: "We manually set up your Facebook, Google & TikTok ads and launch your first campaigns together." },
    { icon: GraduationCap, title: "Marketing funnel & strategy", desc: "Learn the exact methods, offers and audiences that convert in the formations market." },
    { icon: TrendingUp, title: "Order generation playbook", desc: "Proven scripts, funnels and follow-ups that turn clicks into paid orders." },
    { icon: Handshake, title: "1-on-1 manual guidance", desc: "Direct WhatsApp & screen-share sessions with our partner team — real humans, anytime." },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(refLink);
      toast.success("Referral link copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome + referral link */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-primary/15 text-primary inline-flex w-fit mb-3">
          <Handshake className="w-3.5 h-3.5" />
          <span>Affiliate / B2B Partner</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold mb-1">Welcome, {displayName}</h2>
        <p className="text-sm opacity-75 mb-5">Share your unique link, refer clients and earn recurring commissions on every paid order.</p>

        <Label htmlFor="ref-link" className="text-xs uppercase tracking-widest opacity-70">Your referral link</Label>
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <Input id="ref-link" value={refLink} readOnly className="font-mono text-sm" />
          <Button onClick={copyLink} variant="hero" className="rounded-full shrink-0">
            <Copy className="w-4 h-4" /> Copy Link
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass rounded-2xl p-5">
              <Icon className="w-5 h-5 opacity-70 mb-2" />
              <div className="text-[11px] uppercase tracking-widest opacity-70">{s.label}</div>
              <div className="text-xl font-semibold mt-1">{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Recent referrals empty state */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-1">Recent Referred Orders</h3>
        <p className="text-xs opacity-70 mb-4">Live orders placed through your link will appear here.</p>
        <EmptyState
          icon={Inbox}
          title="No referred orders yet"
          description="Share your link with clients, agencies or audiences. Once they place a paid order, it will show up here with status and commission."
        />
      </div>

      {/* Training & support */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-1">Your training & support</h3>
        <p className="text-xs opacity-70 mb-4">We teach you advertising, marketing and order generation — manually, step by step.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {trainingItems.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.title} className="rounded-xl border border-border/60 p-4 bg-background/30">
                <div className="w-9 h-9 rounded-lg bg-primary/15 grid place-items-center mb-2">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="font-semibold text-sm">{t.title}</div>
                <p className="text-xs opacity-75 mt-1">{t.desc}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant="hero" className="rounded-full">
            <a href="https://wa.me/923164467464?text=Hi%2C%20I%27m%20a%20DigiFormation%20partner%20and%20need%20guidance" target="_blank" rel="noopener noreferrer">
              <Handshake className="w-4 h-4" /> WhatsApp Partner Team
            </a>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <a href="mailto:Info@digiformation.uk?subject=Partner%20Support%20Request">
              Email Support
            </a>
          </Button>
        </div>
      </div>

      {/* Payout info */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-1">Payouts</h3>
        <p className="text-sm opacity-75">
          Commissions are paid monthly via bank transfer or wallet credit once your pending balance reaches <strong>£50</strong>.
          Payout settings will appear here once your first commission is earned.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
