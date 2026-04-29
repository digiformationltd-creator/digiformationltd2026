import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, MapPin } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { usStates } from "@/data/usaServices";

type Pkg = {
  name: string;
  base: number;
  badge?: string;
  tone: string;
  ring: string;
  features: string[];
};

const packages: Pkg[] = [
  {
    name: "Starter",
    base: 150,
    tone: "from-emerald-500/20 to-emerald-500/5",
    ring: "ring-emerald-500/40",
    features: [
      "U.S. LLC Registration",
      "Shared Business Address (no portal, no mail support)",
      "Articles of Organization",
      "Employer Identification Number (EIN)",
      "Digital Company Documents (PDF)",
      "Certificate of Formation (Digital)",
      "24/7 Support",
    ],
  },
  {
    name: "Silver",
    base: 200,
    badge: "Most Popular",
    tone: "from-sky-500/25 to-sky-500/5",
    ring: "ring-sky-400/60",
    features: [
      "U.S. LLC Registration",
      "Unique Business Address (with portal access & mail support)",
      "Articles of Organization",
      "Employer Identification Number (EIN)",
      "Digital Company Documents (PDF)",
      "Certificate of Formation (Digital)",
      "24/7 Support",
    ],
  },
  {
    name: "Gold",
    base: 400,
    tone: "from-amber-400/25 to-amber-400/5",
    ring: "ring-amber-400/50",
    features: [
      "U.S. LLC Registration",
      "Unique Business Address (with portal access & mail support)",
      "Articles of Organization",
      "Employer Identification Number (EIN)",
      "Individual Taxpayer Identification Number (ITIN) included",
      "Digital Company Documents (PDF)",
      "Certificate of Formation (Digital)",
      "24/7 Support",
    ],
  },
];

const requirements = [
  "Proposed Company Name (with 2–3 alternatives)",
  "Member / Owner Full Name(s)",
  "Passport or Government-Issued ID (for each member)",
  "Residential Address Proof (utility bill or bank statement)",
  "Business Activity Description",
  "Email Address & Phone Number",
];

const UsaLlcFormation = () => {
  const [stateCode, setStateCode] = useState("DE");

  useEffect(() => {
    document.title = "U.S. LLC Formation Services | Digiformation Ltd";
    const meta = (n: string, c: string) => {
      let el = document.querySelector(`meta[name="${n}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute("name", n); document.head.appendChild(el); }
      el.setAttribute("content", c);
    };
    meta("description", "Start your U.S. LLC quickly and legally with Digiformation Ltd. Choose from Starter, Silver, or Gold packages including EIN, ITIN, business address, and digital company documents.");
    meta("keywords", "LLC formation UK, U.S. LLC registration, LLC formation services, EIN registration, business address for LLC");

    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    }
  }, []);

  const state = useMemo(() => usStates.find((s) => s.code === stateCode) ?? usStates[0], [stateCode]);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="container mx-auto px-4 py-24 md:py-28 relative">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="h-px w-7 bg-primary" />
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">USA LLC Formation</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight">
              Build your U.S. LLC — <em className="not-italic text-gradient">fast, secure & fully compliant</em>
            </h1>
            <p className="mt-8 text-lg md:text-xl leading-relaxed max-w-2xl opacity-90">
              Start your U.S. LLC with Digiformation Ltd. Choose the package that fits your business and get legally registered with all necessary documents and support.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button variant="hero" size="lg" className="rounded-full" onClick={() => scrollTo("packages")}>
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="ghostGlow" size="lg" className="rounded-full" onClick={() => scrollTo("state-selector")}>
                <MapPin className="w-4 h-4" /> Choose Your State
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* State selector */}
      <section id="state-selector" className="py-16 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="glass rounded-3xl p-8 md:p-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="h-px w-7 bg-primary" />
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">Step 1 — Pick Your State</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Where do you want to register?</h2>
            <p className="opacity-80 mb-6 max-w-2xl">
              State filing fees vary across the U.S. Pick your preferred state and we'll adjust the package price automatically.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 items-center">
              <select
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/40 focus:border-primary outline-none text-base"
              >
                {usStates.map((s) => (
                  <option key={s.code} value={s.code}>{s.name} ({s.code}){s.surcharge ? ` — +£${s.surcharge}` : " — included"}</option>
                ))}
              </select>
              <div className="text-sm opacity-90">
                State surcharge: <span className="font-semibold text-gradient">{state.surcharge ? `+£${state.surcharge}` : "Included"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="py-20 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-[0.18em] opacity-70 mb-3">Step 2 — Choose Your Package</div>
            <h2 className="text-4xl md:text-5xl font-bold">LLC Formation Packages</h2>
            <p className="opacity-80 mt-3">Prices update based on your selected state: <span className="font-semibold">{state.name}</span></p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {packages.map((p) => {
              const total = p.base + state.surcharge;
              return (
                <div
                  key={p.name}
                  className={`relative glass rounded-3xl p-8 ring-1 ${p.ring} bg-gradient-to-b ${p.tone} flex flex-col`}
                >
                  {p.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-brand text-xs font-bold uppercase tracking-widest">
                      {p.badge}
                    </div>
                  )}
                  <h3 className="text-2xl font-bold mb-2">{p.name}</h3>
                  <div className="mb-1 text-xs opacity-70 uppercase tracking-widest">Start from</div>
                  <div className="text-5xl font-bold text-gradient mb-6">£{total}</div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-3 text-sm">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                        <span className="opacity-90">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="hero" className="rounded-full w-full" onClick={() => scrollTo("requirements")}>
                    Get Started <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section id="requirements" className="py-20 bg-muted/20 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="h-px w-7 bg-primary" />
            <span className="text-xs uppercase tracking-[0.18em] font-semibold">Requirements</span>
          </div>
          <h2 className="text-4xl font-bold mb-3">What we'll need from you</h2>
          <p className="opacity-80 mb-8">Have these ready and we'll get your LLC filed quickly.</p>
          <ul className="space-y-3">
            {requirements.map((r) => (
              <li key={r} className="flex items-start gap-3 glass rounded-xl p-4">
                <CheckCircle2 className="w-5 h-5 mt-0.5 text-primary" />
                <span className="font-medium">{r}</span>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <Button asChild variant="hero" size="lg" className="rounded-full">
              <Link to="/contact">Submit Requirements <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Related */}
      <section className="py-20 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold mb-8">Related USA Services</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { name: "EIN Number", path: "/usa-services/ein-number" },
              { name: "ITIN Number", path: "/usa-services/itin-number" },
              { name: "Annual Tax Filing", path: "/usa-services/annual-tax-filing" },
              { name: "BOI Report", path: "/usa-services/bio-report" },
            ].map((r) => (
              <Link key={r.path} to={r.path} className="glass rounded-2xl p-6 hover:-translate-y-1 hover:shadow-elegant transition-all group">
                <h3 className="font-semibold text-lg group-hover:text-gradient">{r.name}</h3>
                <div className="mt-3 text-[11px] uppercase tracking-[0.14em]">Explore →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default UsaLlcFormation;
