import { useEffect, useMemo, useState } from "react";
import { useSeo } from "@/lib/seo";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, MapPin, CheckCircle2, Loader2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import heroImg from "@/assets/card-hero-us-llc.jpg";
import { supabase } from "@/integrations/supabase/client";
import ServiceFAQ from "@/components/seo/ServiceFAQ";
import RelatedServices from "@/components/seo/RelatedServices";
import RecommendedGuides from "@/components/seo/RecommendedGuides";

type StatePricing = {
  id: string;
  state_code: string;
  state_name: string;
  starter_price_usd: number;
  silver_price_usd: number;
  gold_price_usd: number;
  display_order: number;
  is_popular: boolean;
};

const PACKAGE_FEATURES = {
  Starter: [
    "U.S. LLC Registration",
    "Shared Business Address",
    "Articles of Organization",
    "Employer Identification Number (EIN)",
    "Digital Company Documents (PDF)",
    "Certificate of Formation (Digital)",
    "Client Portal Access (document uploads & status updates)",
    "24/7 Support",
  ],
  Silver: [
    "U.S. LLC Registration",
    "Unique Business Address (with portal & mail support)",
    "Articles of Organization",
    "Employer Identification Number (EIN)",
    "Digital Company Documents (PDF)",
    "Certificate of Formation (Digital)",
    "Client Portal Access (document uploads & status updates)",
    "24/7 Support",
  ],
  Gold: [
    "U.S. LLC Registration",
    "Unique Business Address (with portal & mail support)",
    "Articles of Organization",
    "Employer Identification Number (EIN)",
    "Individual Taxpayer Identification Number (ITIN) included",
    "Digital Company Documents (PDF)",
    "Certificate of Formation (Digital)",
    "Client Portal Access (document uploads & status updates)",
    "Priority 24/7 Support",
  ],
};

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const UsaLlcChooseState = () => {
  const [states, setStates] = useState<StatePricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  useSeo({
    title: "Choose Your State — U.S. LLC Formation | Digiformation",
    description: "Select the U.S. state for your LLC. Compare Wyoming, Delaware, Florida and Texas pricing for Starter, Silver, and Gold packages — non-resident friendly.",
    keywords: "US LLC state, LLC formation pricing, Wyoming LLC, Delaware LLC, Florida LLC, Texas LLC, non resident LLC formation",
    type: "website",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "USA Services", path: "/usa-services" },
      { name: "US LLC Formation", path: "/usa-services/us-llc-formation" },
      { name: "Choose State", path: "/usa-services/us-llc-formation/choose-state" },
    ],
  });

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("us_llc_state_pricing")
        .select("*")
        .order("display_order", { ascending: true });
      if (!error && data) setStates(data as StatePricing[]);
      setLoading(false);
    })();
  }, []);

  // Pre-select state from ?state= query param (from homepage Quick Start widget)
  useEffect(() => {
    const code = searchParams.get("state");
    if (!code || states.length === 0) return;
    const match = states.find((s) => s.state_code.toUpperCase() === code.toUpperCase());
    if (match) {
      setSelectedCode(match.state_code);
      // Wait for the packages section to mount, then scroll
      const tryScroll = (attempt = 0) => {
        const el = document.getElementById("packages");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        } else if (attempt < 10) {
          setTimeout(() => tryScroll(attempt + 1), 100);
        }
      };
      setTimeout(() => tryScroll(), 150);
    }
  }, [searchParams, states]);

  const popular = useMemo(() => states.filter((s) => s.is_popular), [states]);
  const sortedStates = useMemo(
    () => [...states].sort((a, b) => a.state_name.localeCompare(b.state_name)),
    [states],
  );
  const selected = useMemo(
    () => states.find((s) => s.state_code === selectedCode) ?? null,
    [states, selectedCode],
  );

  const scrollToPackages = () => {
    setTimeout(() => document.getElementById("packages")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const handleSelect = (code: string) => {
    setSelectedCode(code);
    scrollToPackages();
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-14 items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-3 mb-6">
                <span className="text-xs uppercase tracking-[0.18em] font-semibold">Step 1 of 3 — Choose State</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight">
                <em className="not-italic text-gradient">Choose your state</em> to register your LLC
              </h1>
              <p className="mt-6 text-lg md:text-xl leading-relaxed max-w-2xl opacity-90">
                Each U.S. state has its own filing fees and rates. Select your state first — your package pricing will be calculated automatically based on it.
              </p>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative rounded-2xl overflow-hidden glass shadow-elegant aspect-[4/3]">
                <img src={heroImg} alt="Form a US LLC for non-residents — Delaware & Wyoming LLC formation worldwide" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-tr from-background/40 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* State picker */}
      <section className="py-10 md:py-14 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-3xl">
          {loading ? (
            <div className="py-20 grid place-items-center opacity-70">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="glass rounded-3xl p-6 md:p-8 border border-border/50 shadow-elegant">
              <label className="block text-xs uppercase tracking-[0.18em] font-semibold opacity-80 mb-3">
                Select your state
              </label>
              <Select value={selectedCode ?? undefined} onValueChange={handleSelect}>
                <SelectTrigger className="h-14 text-base rounded-xl bg-background/60 border-border/60">
                  <SelectValue placeholder="— Choose a U.S. state —" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {sortedStates.map((s) => (
                    <SelectItem key={s.state_code} value={s.state_code}>
                      {s.state_name} ({s.state_code}) — from {formatUSD(Number(s.starter_price_usd))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {popular.length > 0 && (
                <div className="mt-6">
                  <div className="text-[11px] uppercase tracking-[0.16em] opacity-70 mb-3">Popular choices</div>
                  <div className="flex flex-wrap gap-2">
                    {popular.map((s) => (
                      <button
                        key={s.state_code}
                        onClick={() => handleSelect(s.state_code)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition ${
                          selectedCode === s.state_code
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border/60 hover:border-primary/60 hover:bg-primary/5"
                        }`}
                      >
                        {s.state_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="mt-5 text-xs opacity-70">
                Pricing for Starter, Silver, and Gold updates automatically based on your selected state's filing fees.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Packages */}
      {selected && (
        <section id="packages" className="py-12 md:py-16 border-t border-border/60 bg-muted/20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-[0.14em]">
                <MapPin className="w-3.5 h-3.5" /> {selected.state_name} ({selected.state_code})
              </div>
              <h2 className="text-4xl md:text-5xl font-bold">
                Choose your <em className="not-italic text-gradient">package</em>
              </h2>
              <p className="opacity-80 mt-3">Pricing tailored for {selected.state_name}. All amounts in USD.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <PackageCard
                name="Starter"
                price={Number(selected.starter_price_usd)}
                features={PACKAGE_FEATURES.Starter}
                tone="from-emerald-500/15 to-emerald-500/5"
                ring="ring-emerald-500/40"
                stateCode={selected.state_code}
              />
              <PackageCard
                name="Silver"
                price={Number(selected.silver_price_usd)}
                features={PACKAGE_FEATURES.Silver}
                tone="from-sky-500/20 to-sky-500/5"
                ring="ring-sky-400/60"
                stateCode={selected.state_code}
                badge="Most Popular"
              />
              <PackageCard
                name="Gold"
                price={Number(selected.gold_price_usd)}
                features={PACKAGE_FEATURES.Gold}
                tone="from-amber-400/20 to-amber-400/5"
                ring="ring-amber-400/50"
                stateCode={selected.state_code}
              />
            </div>
          </div>
        </section>
      )}

      <RelatedServices
        eyebrow="Bundle With"
        title="Complete Your US Business Stack"
        items={[
          { name: "EIN Number", path: "/usa-services/ein-number", description: "Federal Employer Identification Number — required for US banking, Stripe and tax filings.", icon: "ein" },
          { name: "ITIN Application", path: "/usa-services/itin-number", description: "Individual Taxpayer Identification Number for non-resident owners and shareholders.", icon: "itin" },
          { name: "BOI Report Filing", path: "/usa-services/boi-report", description: "Mandatory Beneficial Ownership Information report under the Corporate Transparency Act.", icon: "boi" },
          { name: "US Business Banking", path: "/banks-payment-solutions", description: "Open Mercury, Wise or Payoneer accounts for your new LLC.", icon: "banking" },
          { name: "Stripe & PayPal Setup", path: "/banks-payment-solutions", description: "Activate global payment gateways on your LLC in days.", icon: "payments" },
          { name: "Annual Tax Filings", path: "/usa-services", description: "Form 5472, 1120, and state reports prepared and filed for you.", icon: "compliance" },
        ]}
      />
      <RecommendedGuides
        title="Guides for US LLC Founders"
        categories={["USA Formation", "Stripe", "PayPal"]}
      />
      <ServiceFAQ
        id="us-llc-choose-state"
        faqs={[
          { q: "Which state is best for a non-resident US LLC?", a: "Wyoming and Delaware are the most popular for non-residents — Wyoming for low fees and strong privacy, Delaware for credibility with US investors. Florida and Texas are common when you have a physical or e-commerce presence in those markets." },
          { q: "Do I need a US address or SSN to form an LLC?", a: "No. You do not need US residency, a US address, or an SSN. We provide the registered agent and business address; an EIN is then obtained from the IRS using your foreign passport." },
          { q: "How long does formation take?", a: "Most states approve LLC filings within 1–5 business days. Your EIN is typically issued within 7–10 business days after formation." },
          { q: "Will I be taxed in the US as a non-resident?", a: "A single-member non-resident LLC with no US-source effectively connected income is generally not subject to US federal income tax, but it must file Form 5472 + 1120 annually. We handle this for you." },
          { q: "Can I open a US bank account remotely?", a: "Yes. Mercury, Wise Business, Payoneer and Relay accept most non-resident LLCs once you have your EIN and formation documents." },
          { q: "Are state filing fees included in the price?", a: "Yes — every package includes the state filing fee for the state you choose. The displayed price is the all-in one-time formation cost." },
        ]}
      />
    </Layout>
  );
};


const PackageCard = ({
  name,
  price,
  features,
  tone,
  ring,
  badge,
  stateCode,
}: {
  name: "Starter" | "Silver" | "Gold";
  price: number;
  features: string[];
  tone: string;
  ring: string;
  badge?: string;
  stateCode: string;
}) => (
  <div className={`relative glass rounded-3xl p-8 ring-1 ${ring} bg-gradient-to-b ${tone} flex flex-col`}>
    {badge && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-brand text-xs font-bold uppercase tracking-widest">
        {badge}
      </div>
    )}
    <h3 className="text-2xl font-bold mb-2">{name}</h3>
    <div className="mb-1 text-xs opacity-70 uppercase tracking-widest">One-time price</div>
    <div className="text-5xl font-bold text-gradient mb-6">{formatUSD(price)}</div>
    <ul className="space-y-3 mb-8 flex-1">
      {features.map((f) => (
        <li key={f} className="flex gap-3 text-sm">
          <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
          <span className="opacity-90">{f}</span>
        </li>
      ))}
    </ul>
    <Button asChild variant="hero" className="rounded-full w-full">
      <Link to={`/usa-services/us-llc-formation/checkout?state=${stateCode}&package=${name}`}>
        Continue with {name} <ArrowRight className="w-4 h-4" />
      </Link>
    </Button>
  </div>
);

export default UsaLlcChooseState;
