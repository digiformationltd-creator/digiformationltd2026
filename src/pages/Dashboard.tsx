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
} from "lucide-react";
import logo from "@/assets/digiformation-logo.png";

type SectionId =
  | "subscriptions" | "orders" | "wallet" | "company" | "documents"
  | "editAccount" | "editAddress" | "newServices" | "tickets" | "openTicket";

const menu: { id: SectionId; label: string; icon: any }[] = [
  { id: "subscriptions", label: "Subscriptions", icon: CalendarDays },
  { id: "orders", label: "My Orders", icon: ShoppingBag },
  { id: "wallet", label: "My Wallet", icon: Wallet },
  { id: "company", label: "Company Details", icon: Building2 },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "editAccount", label: "Edit Account", icon: UserCog },
  { id: "editAddress", label: "Edit Address", icon: MapPin },
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
  { name: "Registered Address", price: "£49.99/yr", desc: "Use our address for your company", icon: MapPin },
  { name: "Confirmation Statement", price: "£13.99", desc: "Annual confirmation filing", icon: FileText },
  { name: "Accounts Filing", price: "£49.99", desc: "Annual accounts submission", icon: FileText },
  { name: "Director Change", price: "£29.99", desc: "Add or remove a director", icon: UserCog },
  { name: "Share Certificate", price: "£19.99", desc: "Official share certificate", icon: FileText },
  { name: "VAT Registration", price: "£99.99", desc: "Register for VAT with HMRC", icon: Building2 },
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
  const [active, setActive] = useState<SectionId>("subscriptions");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.title = "Client Dashboard | Digiformation";

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth", { replace: true });
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }
      setUser(session.user);
    });

    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [{ data: prof }, { data: comp }] = await Promise.all([
        supabase.from("profiles").select("full_name,email,phone,company_name,avatar_initials").eq("user_id", user.id).maybeSingle(),
        supabase.from("client_company_details").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      setProfile(prof as Profile);
      setCompany(comp as CompanyDetails);
      setLoading(false);
    })();
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
    <div className="min-h-screen bg-gradient-hero grid-pattern flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:sticky top-0 left-0 z-40 h-screen w-72 glass border-r border-border/40 flex flex-col transition-transform`}>
        <div className="p-5 border-b border-border/40">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Digiformation" className="h-12 w-auto object-contain" />
          </Link>
        </div>

        <div className="p-5 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-brand grid place-items-center font-semibold text-sm shadow-glow">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{displayName}</div>
              <div className="text-xs opacity-70 truncate">{user.email}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {menu.map((m) => {
            const Icon = m.icon;
            const isActive = active === m.id;
            return (
              <button
                key={m.id}
                onClick={() => { setActive(m.id); setSidebarOpen(false); }}
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
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {sidebarOpen && (
        <button className="lg:hidden fixed inset-0 z-30 bg-black/60" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />
      )}

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 glass border-b border-border/40 px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <UserCircle2 className="w-6 h-6" />
            </button>
            <div>
              <div className="text-xs opacity-70">Client Dashboard</div>
              <h1 className="text-base sm:text-lg font-semibold">
                {menu.find((m) => m.id === active)?.label}
              </h1>
            </div>
          </div>
          <div className="text-xs opacity-70 hidden sm:block">
            Signed in as <span className="opacity-100 font-medium">{user.email}</span>
          </div>
        </header>

        <div className="p-4 sm:p-8 max-w-6xl mx-auto">
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
            <EmptyState
              icon={FileText}
              title="No documents yet"
              description="Certificates, memorandums, confirmation statements and letters will be available to download here."
            />
          )}

          {active === "editAccount" && (
            <EditAccountForm profile={profile} email={user.email || ""} onSaved={(p) => setProfile(p)} />
          )}

          {active === "editAddress" && <EditAddressForm />}

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
                          <Link to="/pricing">Order <ArrowUpRight className="w-3.5 h-3.5" /></Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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

const EditAddressForm = () => {
  const fields = ["Address Line 1", "Address Line 2", "City", "County", "Postcode", "Country"];
  return (
    <form onSubmit={(e) => { e.preventDefault(); toast.success("Address updated"); }} className="glass rounded-2xl p-6 sm:p-8 space-y-5 max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f}>
            <Label>{f}</Label>
            <Input placeholder={f} className="mt-1.5" />
          </div>
        ))}
      </div>
      <Button type="submit" variant="hero" className="rounded-full">Update Address</Button>
    </form>
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

export default Dashboard;
