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
  GraduationCap,
  Megaphone,
  Target,
  LineChart,
  Rocket,
  Users,
  Download,
  CheckCircle2,
} from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { buildApplicationPdf, downloadApplicationPdf, type ApplicationData } from "@/lib/applicationPdf";

const formSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  whatsapp: z
    .string()
    .trim()
    .min(6, "Please enter a valid WhatsApp number")
    .max(30)
    .regex(/^[+0-9 ()\-]+$/, "WhatsApp number can only contain digits, +, -, () and spaces"),
  employeeCode: z.string().trim().max(60).optional().or(z.literal("")),
  joiningDate: z.string().trim().max(20).optional().or(z.literal("")),
  education: z.string().trim().max(300).optional().or(z.literal("")),
  experience: z.string().trim().max(1000).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

const benefits = [
  { icon: Wallet, title: "Recurring Commissions", desc: "Earn on every order your referrals place — formations, addresses, compliance & more." },
  { icon: Link2, title: "Personal Referral Link", desc: "Track every click & conversion from a unique link in your dashboard." },
  { icon: ShoppingBag, title: "Live Order Tracking", desc: "See referred orders, statuses, and payouts in real-time." },
  { icon: TrendingUp, title: "Tiered Payouts", desc: "Higher volumes unlock better rates — perfect for agencies & resellers." },
  { icon: ShieldCheck, title: "Trusted Brand", desc: "DigiFormation Ltd · UK registered · 256-bit secure portal." },
  { icon: Handshake, title: "Dedicated Support", desc: "Direct WhatsApp line to our partner team for queries & escalations." },
];

const pad4 = (n: number) => n.toString().padStart(4, "0");

const generateApplicationId = async (): Promise<string> => {
  const { count } = await supabase
    .from("affiliate_applications")
    .select("id", { count: "exact", head: true });
  const next = (count || 0) + 1;
  return `Application-${pad4(next)}`;
};

const Affiliate = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<ApplicationData | null>(null);

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
      whatsapp: String(fd.get("whatsapp") || ""),
      employeeCode: String(fd.get("employeeCode") || ""),
      joiningDate: String(fd.get("joiningDate") || ""),
      education: String(fd.get("education") || ""),
      experience: String(fd.get("experience") || ""),
      message: String(fd.get("message") || ""),
    };
    const v = formSchema.safeParse(data);
    if (!v.success) return toast.error(v.error.issues[0].message);

    setLoading(true);
    try {
      const application_id = await generateApplicationId();
      const submitted_at = new Date().toISOString();

      const { data: inserted, error: insErr } = await supabase
        .from("affiliate_applications")
        .insert({
          application_id,
          full_name: v.data.fullName,
          email: v.data.email,
          whatsapp: v.data.whatsapp,
          employee_code: v.data.employeeCode || null,
          joining_date: v.data.joiningDate || null,
          education: v.data.education || null,
          experience: v.data.experience || null,
          message: v.data.message || null,
          page_path: window.location.pathname,
          user_agent: navigator.userAgent.slice(0, 500),
        })
        .select()
        .single();
      if (insErr) throw insErr;

      const appData: ApplicationData = {
        application_id,
        full_name: v.data.fullName,
        email: v.data.email,
        whatsapp: v.data.whatsapp,
        employee_code: v.data.employeeCode || null,
        joining_date: v.data.joiningDate || null,
        education: v.data.education || null,
        experience: v.data.experience || null,
        message: v.data.message || null,
        submitted_at,
      };

      const { blob, filename } = await buildApplicationPdf(appData);
      const path = `${new Date().getFullYear()}/${filename}`;
      const { error: upErr } = await supabase.storage
        .from("affiliate-applications")
        .upload(path, blob, { contentType: "application/pdf", upsert: true });
      if (!upErr) {
        const { data: pub } = supabase.storage.from("affiliate-applications").getPublicUrl(path);
        await supabase
          .from("affiliate_applications")
          .update({ pdf_url: pub.publicUrl })
          .eq("id", inserted.id);
      }

      await downloadApplicationPdf(appData);

      setSubmitted(appData);
      toast.success("Application submitted! Your PDF has been downloaded.");
      (e.target as HTMLFormElement).reset();
      setTimeout(() => {
        document.getElementById("join")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Could not submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const redownload = async () => {
    if (submitted) await downloadApplicationPdf(submitted);
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

      {/* Why partner with us — combined: training (priority) + benefits */}
      <section className="container mx-auto px-4 py-10 md:py-14">
        <div className="glass rounded-3xl p-6 md:p-10 border border-primary/20">
          <div className="max-w-3xl mb-8 text-center mx-auto">
            <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-primary/15 text-primary mb-3">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Why choose DigiFormation as your partner</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold mb-3">
              We train you <span className="text-primary">from zero to selling</span> — then keep paying you
            </h2>
            <p className="opacity-80 text-sm md:text-base">
              You don't need prior marketing experience. Our team personally teaches every B2B
              partner & reseller advertising, marketing funnels and order generation — step by step,
              manually. Here's everything you get when you join us:
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Megaphone, title: "Advertising — done with you", desc: "We manually set up your Facebook, Google & TikTok ads, write the copy, pick the audiences and launch your first campaigns together." },
              { icon: Target, title: "Marketing funnel & strategy", desc: "Learn the exact marketing methods, offers and audiences that convert — for UK Ltd, USA LLC, banking and compliance services." },
              { icon: Rocket, title: "Order generation playbook", desc: "Proven scripts, funnels and follow-up flows that turn clicks into paid orders — the same system our in-house team uses every day." },
              { icon: LineChart, title: "Ads optimisation & scaling", desc: "We show you how to read the numbers, kill losing ads, scale winners and lower your cost per order week after week." },
              { icon: Users, title: "1-on-1 manual guidance", desc: "Direct WhatsApp & screen-share sessions with our partner team. Ask anything, anytime — no bots, no tickets, real humans." },
              { icon: GraduationCap, title: "Lifetime learning access", desc: "Ongoing updates, new ad creatives, fresh offers and market insights — so you stay ahead as the industry evolves." },
              ...benefits.map((b) => ({ icon: b.icon, title: b.title, desc: b.desc })),
            ].map((item) => (
              <div key={item.title} className="rounded-2xl p-5 bg-background/30 border border-border/60 hover:-translate-y-0.5 transition">
                <div className="w-10 h-10 rounded-lg bg-primary/15 grid place-items-center mb-3">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm opacity-75">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 text-sm opacity-80 border-t border-border/40 pt-5 text-center">
            <strong className="text-foreground">In short:</strong> we don't just hand you a referral
            link and disappear. We teach you advertising, marketing and order generation — and
            keep guiding you manually until you're earning consistently.
          </div>
        </div>
      </section>

      {/* Dashboard mention — full live data lives inside Client Dashboard → Affiliate */}
      <section className="container mx-auto px-4 py-8 md:py-10">
        <div className="glass rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest opacity-70 mb-1">Inside your dashboard</div>
            <h2 className="text-xl md:text-2xl font-bold">
              Your referral link, clicks, signups, paid orders, pending commission & lifetime earnings — all live in one place
            </h2>
            <p className="text-sm opacity-75 mt-2">
              Once approved, sign in to your Client Dashboard and open the <strong>Affiliate</strong> tab to track everything in real-time.
            </p>
          </div>
          <Button asChild variant="hero" size="lg" className="rounded-full shrink-0">
            <Link to="/dashboard"><UserCircle2 className="w-4 h-4" /> Open Dashboard</Link>
          </Button>
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
