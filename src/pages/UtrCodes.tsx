import { useEffect, useState } from "react";
import { useSeo } from "@/lib/seo";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, FileText, KeyRound, Power, AlertCircle } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/card-hero-tax.jpg";

const rotatingCtas = [
  "Get Your UTR Today",
  "Recover Your Missing UTR",
  "Register Your UTR Now",
  "Fix Your HMRC Tax Status",
  "Start UK Tax Compliance",
];

type Card = {
  id: string;
  icon: typeof FileText;
  eyebrow: string;
  title: string;
  intro: string;
  what: string[];
  why?: string[];
  did?: string[];
  ctas: string[];
};

const cards: Card[] = [
  {
    id: "utr",
    icon: FileText,
    eyebrow: "Card 01",
    title: "What is UTR?",
    intro: "A UTR (Unique Taxpayer Reference) is a 10-digit number issued by HMRC.",
    what: [
      "File Corporation Tax",
      "Submit Self Assessment",
      "Open UK business bank accounts",
      "Register for VAT",
      "Prove your business is tax-registered",
    ],
    did: [
      "They used a virtual or third-party address",
      "Their mail is delayed or lost",
      "Director lives outside the UK",
      "They registered themselves and made errors",
      "HMRC could not verify their identity",
      "The letter was returned or rejected",
    ],
    ctas: ["Get Your UTR Today", "Recover Your Missing UTR", "Register Your UTR Now"],
  },
  {
    id: "auth-code",
    icon: KeyRound,
    eyebrow: "Card 02",
    title: "HMRC Authentication Code",
    intro: "An HMRC Authentication Code is a security code used to access HMRC's online services.",
    what: [
      "Activate your HMRC online account",
      "Link your company to HMRC services",
      "File Corporation Tax & VAT online",
      "Access your tax dashboard",
      "Authorise your accountant",
    ],
    ctas: ["Get Your HMRC Code Now", "Activate Your Tax Account", "Fix Your HMRC Access"],
  },
  {
    id: "activation-code",
    icon: Power,
    eyebrow: "Card 03",
    title: "Company Activation Code",
    intro: "A Company Activation Code is required to fully activate your company on HMRC systems.",
    what: [
      "Activate your HMRC Corporation Tax account",
      "Submit CT600 returns",
      "Register for PAYE or VAT",
      "Fully activate your company on HMRC systems",
    ],
    why: [
      "You never activated your company after registration",
      "Code letter expired",
      "Address or director mismatch",
      "Online account setup errors",
      "Company registered by third party",
    ],
    ctas: ["Get Your Activation Code", "Fix HMRC Mismatch", "Activate Your Company"],
  },
];

const RotatingCta = () => {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % rotatingCtas.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <Button asChild variant="hero" size="lg" className="rounded-full">
      <Link to="/checkout?service=utr-number">
        <span key={i} className="inline-block animate-fade-in">{rotatingCtas[i]}</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </Button>
  );
};

const UtrCodes = () => {
  useSeo({
    title: "UTR, HMRC Auth & Company Activation Codes | Digiformation",
    description: "Get or recover your UTR, HMRC Authentication Code, and Company Activation Code. Stay fully compliant with HMRC and Companies House for your UK Limited Company.",
    keywords: "UTR registration, HMRC authentication code, company activation code, HMRC corporation tax, UK tax compliance 2026, UTR for non resident UK company",
    type: "website",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "UK Services", path: "/uk-services" },
      { name: "UTR & Auth Codes", path: "/uk-services/utr-codes" },
    ],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "UTR, HMRC & Companies House Code Services",
      provider: { "@type": "Organization", name: "Digiformation Ltd" },
      areaServed: "United Kingdom",
      description: "Apply for or recover your UTR, HMRC Authentication Code, and Companies House Activation Code.",
    },
  });

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="container mx-auto px-4 py-12 md:py-14 relative">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-14 items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-3 mb-6">
                <span className="text-xs uppercase tracking-[0.18em] font-semibold">HMRC · UK Tax Compliance</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight">
                UTR, Auth Code & <em className="not-italic text-gradient">Activation Code</em>
              </h1>
              <p className="mt-8 text-lg md:text-xl leading-relaxed max-w-2xl opacity-90">
                Get or recover the three essential codes every UK Limited Company needs to file taxes, access HMRC, and stay compliant.
              </p>
              <div className="mt-10"><RotatingCta /></div>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative rounded-2xl overflow-hidden glass shadow-elegant aspect-[4/3]">
                <img src={heroImg} alt="UK UTR number & HMRC tax compliance for non-resident UK Limited Company directors" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-tr from-background/40 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="py-10 border-t border-border/60">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-6">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.id} id={c.id} className="glass glass-tint-mustard rounded-3xl p-8 flex flex-col">
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.18em] opacity-70">{c.eyebrow}</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{c.title}</h3>
                  <p className="text-sm opacity-90 mb-5">{c.intro}</p>

                  <div className="text-[10px] uppercase tracking-[0.18em] opacity-70 mb-3">It is required to</div>
                  <ul className="space-y-2 mb-6">
                    {c.what.map((w) => (
                      <li key={w} className="flex gap-3 text-sm">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                        <span className="opacity-90">{w}</span>
                      </li>
                    ))}
                  </ul>

                  {c.did && (
                    <>
                      <div className="text-[10px] uppercase tracking-[0.18em] opacity-70 mb-3">Why clients never receive it</div>
                      <ul className="space-y-2 mb-6">
                        {c.did.map((d) => (
                          <li key={d} className="flex gap-3 text-sm">
                            <AlertCircle className="w-4 h-4 mt-0.5 text-destructive flex-shrink-0" />
                            <span className="opacity-90">{d}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {c.why && (
                    <>
                      <div className="text-[10px] uppercase tracking-[0.18em] opacity-70 mb-3">Why this happens</div>
                      <ul className="space-y-2 mb-6">
                        {c.why.map((d) => (
                          <li key={d} className="flex gap-3 text-sm">
                            <AlertCircle className="w-4 h-4 mt-0.5 text-destructive flex-shrink-0" />
                            <span className="opacity-90">{d}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  <div className="mt-auto space-y-2">
                    {c.ctas.map((cta) => (
                      <Button key={cta} asChild variant="ghostGlow" className="rounded-full w-full">
                        <Link to={`/checkout?service=${encodeURIComponent(c.id)}`}>{cta} <ArrowRight className="w-4 h-4" /></Link>
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What we do */}
      <section className="py-10 bg-muted/20 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="text-xs uppercase tracking-[0.18em] font-semibold">What We Do For You</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-8">
            We <em className="not-italic text-gradient">recover, request and activate</em> on your behalf
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "Request a new activation code",
              "Verify HMRC records",
              "Fix account mismatches",
              "Recover missing UTRs",
              "Re-issue authentication letters",
              "Full HMRC online setup",
            ].map((s) => (
              <div key={s} className="flex items-start gap-3 glass glass-tint-mustard rounded-xl p-4">
                <CheckCircle2 className="w-5 h-5 mt-0.5 text-primary" />
                <span className="font-medium">{s}</span>
              </div>
            ))}
          </div>
          <div className="mt-10"><RotatingCta /></div>
        </div>
      </section>
    </Layout>
  );
};

export default UtrCodes;
