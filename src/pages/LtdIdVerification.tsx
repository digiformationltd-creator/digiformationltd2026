
import { Link } from "react-router-dom";
import { useSeo } from "@/lib/seo";
import { ArrowRight, CheckCircle2, ShieldCheck, FileCheck, Globe2, Lock, AlertTriangle, UserCheck } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

const requiredFor = [
  "Company Director",
  "Person with Significant Control (PSC)",
  "Company Secretary",
  "Shareholder",
];

const covers = [
  { icon: Lock, label: "Secure digital identity verification" },
  { icon: FileCheck, label: "Fast document review" },
  { icon: Globe2, label: "For UK & non-UK officers" },
  { icon: ShieldCheck, label: "Accepted for Companies House" },
  { icon: UserCheck, label: "Compliance-ready processing" },
];

const risks = [
  "Filings may be rejected",
  "Director / PSC updates can fail",
  "Your company may face compliance issues",
];

const verificationRequirements = [
  "ID Card / Passport Picture",
  "Live Selfie",
  "Home Address",
  "Residential Bank Statement",
  "Email Address",
];

const LtdIdVerification = () => {
  useSeo({
    title: "UK LTD ID Verification | Companies House Identity Check 2026",
    description: "Fast and secure UK LTD identity verification for directors, PSCs, shareholders, and company officers worldwide. Companies House compliant.",
    keywords: "UK LTD ID verification, Companies House verification 2026, director verification UK, PSC verification UK, non resident director ID check",
    type: "website",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "UK Services", path: "/uk-services" },
      { name: "LTD ID Verification", path: "/uk-services/ltd-id-verification" },
    ],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "UK LTD ID Verification",
      provider: { "@type": "Organization", name: "Digiformation Ltd" },
      areaServed: "Worldwide",
      description: "Companies House identity verification for directors, PSCs, secretaries and shareholders.",
      offers: { "@type": "Offer", price: "20", priceCurrency: "GBP" },
    },
  });

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="container mx-auto px-4 py-12 md:py-14 relative">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">UK Services · Compliance</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight">
              LTD <em className="not-italic text-gradient">ID Verification</em>
            </h1>
            <p className="mt-8 text-lg md:text-xl leading-relaxed max-w-2xl opacity-90">
              Ready to verify your identity and keep your UK LTD compliant? Begin your secure Companies House identity check in minutes.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <Button asChild variant="hero" size="lg" className="rounded-full">
                <Link to="/uk-services/ltd-id-verification/checkout">Get Started — £20 <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <span className="text-sm opacity-80">One-time fee · Worldwide officers accepted</span>
            </div>
          </div>
        </div>
      </section>

      {/* Required for */}
      <section className="py-10 border-t border-border/60">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <div className="inline-flex items-center gap-3 mb-5">
                <span className="text-xs uppercase tracking-[0.18em] font-semibold">Who Needs It</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
                Verification is <em className="not-italic text-gradient">mandatory</em> for these roles
              </h2>
              <p className="opacity-90 mb-8">If you hold any of these positions in a UK Limited Company, identity verification with Companies House is now required.</p>
              <div className="space-y-3">
                {requiredFor.map((role) => (
                  <div key={role} className="flex items-start gap-3 glass glass-tint-cyan rounded-xl p-4">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 text-primary" />
                    <span className="font-medium">{role}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass glass-tint-cyan rounded-2xl p-10">
              <div className="text-[10px] uppercase tracking-[0.2em] mb-3 opacity-80">What this service covers</div>
              <ul className="space-y-5 mt-6">
                {covers.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="pt-2 opacity-90">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-10 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="text-xs uppercase tracking-[0.18em] font-semibold">Requirements</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            ID Verification <em className="not-italic text-gradient">Requirements</em>
          </h2>
          <p className="opacity-80 mb-10 max-w-2xl">Please prepare the following documents before starting your verification. This ensures fast, smooth processing with Companies House.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {verificationRequirements.map((r, i) => (
              <div key={r} className="glass glass-tint-cyan rounded-xl p-5 flex gap-4 items-start">
                <div className="w-7 h-7 rounded-full bg-gradient-brand grid place-items-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                <span className="font-medium">{r}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why important */}
      <section className="py-10 bg-muted/20 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="text-xs uppercase tracking-[0.18em] font-semibold">Why It's Important</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-10">Without ID verification…</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {risks.map((r) => (
              <div key={r} className="glass glass-tint-cyan rounded-2xl p-7 border border-destructive/20">
                <AlertTriangle className="w-7 h-7 text-destructive mb-4" />
                <p className="font-medium">{r}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-lg opacity-90">This service keeps your company <em className="not-italic text-gradient font-semibold">fully compliant</em> with UK regulations.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="glass glass-tint-cyan rounded-3xl p-14 text-center max-w-3xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-bold">
              Verify your identity <em className="not-italic text-gradient">today</em>
            </h3>
            <p className="mt-4 opacity-90">Stay compliant with UK regulations — secure, fast, and accepted by Companies House.</p>
            <Button asChild variant="hero" size="lg" className="rounded-full mt-8">
              <Link to="/uk-services/ltd-id-verification/checkout">Start Verification — £20 <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default LtdIdVerification;
