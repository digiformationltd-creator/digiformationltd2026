import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Handshake,
  Link2,
  ShoppingBag,
  Wallet,
  TrendingUp,
  ShieldCheck,
  Mail,
  UserCircle2,
  Send,
  Loader2,
} from "lucide-react";
import { z } from "zod";

const formSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().min(6, "Please enter a valid phone").max(30),
  company: z.string().trim().max(150).optional().or(z.literal("")),
  country: z.string().trim().min(2, "Please enter your country").max(80),
  audience: z.string().trim().min(2, "Tell us about your audience").max(200),
  monthlyVolume: z.string().trim().min(1, "Please choose volume").max(60),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

const benefits = [
  { icon: Wallet, title: "Recurring Commissions", desc: "Earn on every order your referrals place — formations, addresses, compliance & more." },
  { icon: Link2, title: "Personal Referral Link", desc: "Track every click & conversion from a unique link in your dashboard." },
  { icon: ShoppingBag, title: "Live Order Tracking", desc: "See referred orders, statuses, and payouts in real-time." },
  { icon: TrendingUp, title: "Tiered Payouts", desc: "Higher volumes unlock better rates — perfect for agencies & resellers." },
  { icon: ShieldCheck, title: "Trusted Brand", desc: "DigiFormation Ltd · UK registered · 256-bit secure portal." },
  { icon: Handshake, title: "Dedicated Support", desc: "Direct WhatsApp line to our partner team for queries & escalations." },
];

const dashboardPreview = [
  { label: "Your Referral Link", value: "digiformation.uk/?ref=YOUR-CODE" },
  { label: "Total Clicks", value: "—" },
  { label: "Signups", value: "—" },
  { label: "Paid Orders", value: "—" },
  { label: "Pending Commission", value: "£ —" },
  { label: "Lifetime Earnings", value: "£ —" },
];

const Affiliate = () => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Affiliate & B2B Partner Program | DigiFormation Ltd";
    const desc = "Join the DigiFormation Ltd affiliate & B2B partner program. Earn recurring commissions on UK & USA company formations, banking and compliance services.";
    let m = document.querySelector('meta[name="description"]');
    if (!m) {
      m = document.createElement("meta");
      m.setAttribute("name", "description");
      document.head.appendChild(m);
    }
    m.setAttribute("content", desc);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      fullName: String(fd.get("fullName") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      company: String(fd.get("company") || ""),
      country: String(fd.get("country") || ""),
      audience: String(fd.get("audience") || ""),
      monthlyVolume: String(fd.get("monthlyVolume") || ""),
      message: String(fd.get("message") || ""),
    };
    const v = formSchema.safeParse(data);
    if (!v.success) return toast.error(v.error.issues[0].message);

    setLoading(true);
    // For now: open prefilled email to our team
    const subject = encodeURIComponent("New Affiliate / B2B Partner Application");
    const body = encodeURIComponent(
      `Name: ${v.data.fullName}\nEmail: ${v.data.email}\nPhone: ${v.data.phone}\nCompany: ${v.data.company || "-"}\nCountry: ${v.data.country}\nAudience: ${v.data.audience}\nMonthly Volume: ${v.data.monthlyVolume}\n\nMessage:\n${v.data.message || "-"}`
    );
    window.location.href = `mailto:Info@digiformation.uk?subject=${subject}&body=${body}`;
    setTimeout(() => {
      setLoading(false);
      toast.success("Application ready — please send the email to complete.");
      (e.target as HTMLFormElement).reset();
    }, 600);
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full glass mb-4">
              <Handshake className="w-3.5 h-3.5" />
              <span>Affiliate · B2B · Reseller Program</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Partner with <span className="text-primary">DigiFormation Ltd</span> — earn on every referral
            </h1>
            <p className="text-base md:text-lg opacity-80 mb-6">
              Refer clients for UK Ltd, USA LLC, banking, addresses & compliance services.
              Get a personal referral link, live order tracking, and recurring commissions —
              all from one professional dashboard.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg" className="rounded-full">
                <a href="#join">
                  <Handshake className="w-4 h-4" /> Join Us
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full">
                <Link to="/auth">
                  <UserCircle2 className="w-4 h-4" /> Partner Login
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-10 md:py-14">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Why partner with us</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <div key={b.title} className="glass rounded-2xl p-5 hover:-translate-y-0.5 transition">
              <div className="w-10 h-10 rounded-lg bg-primary/15 grid place-items-center mb-3">
                <b.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{b.title}</h3>
              <p className="text-sm opacity-75">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="container mx-auto px-4 py-10 md:py-14">
        <div className="glass rounded-3xl p-6 md:p-10">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <div>
              <div className="text-xs uppercase tracking-widest opacity-70">Affiliate Dashboard</div>
              <h2 className="text-2xl md:text-3xl font-bold">Everything you need, in one place</h2>
            </div>
            <Button asChild variant="hero" size="sm" className="rounded-full">
              <Link to="/auth"><UserCircle2 className="w-4 h-4" /> Login to Portal</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dashboardPreview.map((d) => (
              <div key={d.label} className="rounded-xl border border-border/60 p-4 bg-background/30">
                <div className="text-[11px] uppercase tracking-widest opacity-70">{d.label}</div>
                <div className="font-mono text-sm mt-1 break-all">{d.value}</div>
              </div>
            ))}
          </div>
          <p className="text-xs opacity-70 mt-5">
            * Live data appears in your portal once your application is approved.
          </p>
        </div>
      </section>

      {/* B2B + Form */}
      <section id="join" className="container mx-auto px-4 py-10 md:py-14">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left: B2B info */}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">B2B & Reseller Rates</h2>
            <p className="opacity-80 mb-4">
              Run an agency, accountancy or consultancy? Get our exclusive B2B rate list with
              wholesale pricing, white-label options and bulk volume discounts.
            </p>
            <div className="glass rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-primary" />
                <a href="mailto:Info@digiformation.uk?subject=B2B%20Rate%20List%20Request" className="hover:text-primary transition">
                  Mail us for B2B rate list — Info@digiformation.uk
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Send className="w-4 h-4 text-primary" />
                <a href="https://wa.me/923164467464?text=Hi%2C%20I%27m%20interested%20in%20B2B%20rates" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">
                  WhatsApp: +92 316 446 7464
                </a>
              </div>
              <p className="text-xs opacity-70 pt-2 border-t border-border/40">
                Already a partner? <Link to="/auth" className="underline">Sign in to your dashboard</Link>.
              </p>
            </div>
          </div>

          {/* Right: Form */}
          <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-xl font-semibold">Apply to Join</h3>
              <p className="text-xs opacity-70 mt-1">Tell us about you — we'll get back within 24 hours.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="aff-name">Full Name *</Label>
                <Input id="aff-name" name="fullName" required className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="aff-email">Email *</Label>
                <Input id="aff-email" name="email" type="email" required className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="aff-phone">Phone / WhatsApp *</Label>
                <Input id="aff-phone" name="phone" required className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="aff-country">Country *</Label>
                <Input id="aff-country" name="country" required className="mt-1.5" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="aff-company">Company / Brand (optional)</Label>
                <Input id="aff-company" name="company" className="mt-1.5" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="aff-audience">Your audience / niche *</Label>
                <Input id="aff-audience" name="audience" required placeholder="e.g. Accountants, freelancers, e-commerce sellers…" className="mt-1.5" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="aff-volume">Expected monthly referrals *</Label>
                <select
                  id="aff-volume"
                  name="monthlyVolume"
                  required
                  className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>Select volume…</option>
                  <option>1 – 5</option>
                  <option>5 – 20</option>
                  <option>20 – 50</option>
                  <option>50+</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="aff-msg">Message (optional)</Label>
                <Textarea id="aff-msg" name="message" rows={3} className="mt-1.5" />
              </div>
            </div>
            <Button type="submit" variant="hero" className="w-full rounded-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Application
            </Button>
            <p className="text-[11px] opacity-70 text-center">
              By submitting you agree to our{" "}
              <Link to="/terms" className="underline">Terms</Link> &{" "}
              <Link to="/privacy-policy" className="underline">Privacy Policy</Link>.
            </p>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default Affiliate;
