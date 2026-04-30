import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, ShieldCheck, Building2, FileCheck, Lock, Users, Star } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/card-hero-uk-ltd.jpg";

const rotatingHeadlines = [
  { lead: "Register Your UK Limited Company in", accent: "Days" },
  { lead: "Establish Your Business in the UK with", accent: "Confidence" },
  { lead: "Start Your UK Company the", accent: "Smart Way" },
];

const trustSignals = [
  { icon: Building2, label: "Registered with Companies House" },
  { icon: Users, label: "300+ UK Companies Formed" },
  { icon: Star, label: "98% Success Rate" },
  { icon: Lock, label: "Secure Document Handling" },
  { icon: ShieldCheck, label: "Dedicated Support Team" },
];

const whatYouGet = [
  "Companies House incorporation",
  "Digital & printed company documents",
  "UTR registration",
  "Company authentication code",
  "Registered office & director service address",
  "ID verification",
  "Ongoing support",
];

type Pkg = {
  name: string;
  price: string;
  tone: string;
  ring: string;
  badge?: string;
  features: string[];
  cta: string;
  processing?: string;
};

const packages: Pkg[] = [
  {
    name: "Starter",
    price: "£140",
    tone: "from-emerald-500/20 to-emerald-500/5",
    ring: "ring-emerald-500/40",
    processing: "3–5 Business Days",
    features: [
      "UK LTD (Company) Registration",
      "Companies House Incorporation Fee Included",
      "Digital Certificate of Incorporation",
      "Digital Memorandum & Articles of Association",
      "Digital Copy of All Documents (PDF)",
      "Digital Shares Certificate",
      "ID Verification Included",
      "12/6 Phone & WhatsApp Support",
    ],
    cta: "Select Starter",
  },
  {
    name: "Silver",
    price: "£170",
    tone: "from-sky-500/25 to-sky-500/5",
    ring: "ring-sky-400/60",
    badge: "Most Popular",
    features: [
      "UK LTD (Company) Registration",
      "Companies House Incorporation Fee Included",
      "Digital + Printed Certificate of Incorporation",
      "Digital Memorandum & Articles of Association",
      "Registered Office Address",
      "Company Authentication Code",
      "UTR Number",
      "Digital Shares Certificate",
      "ID Verification Included",
    ],
    cta: "Select Silver",
  },
  {
    name: "Gold",
    price: "£180",
    tone: "from-amber-400/25 to-amber-400/5",
    ring: "ring-amber-400/50",
    features: [
      "UK LTD (Company) Registration",
      "Companies House Incorporation Fee Included",
      "Digital Certificate of Incorporation",
      "Digital Memorandum & Articles of Association",
      "Registered Office Address",
      "Company Authentication Code",
      "UTR Number",
      "Digital Shares Certificate",
      "ID Verification Included",
      "Director Service Address",
    ],
    cta: "Select Gold",
  },
  {
    name: "Platinum",
    price: "£200",
    tone: "from-rose-500/25 to-rose-500/5",
    ring: "ring-rose-400/50",
    features: [
      "UK LTD (Company) Registration",
      "Companies House Incorporation Fee Included",
      "Digital Certificate of Incorporation",
      "Digital Memorandum & Articles of Association",
      "London Registered Office Address",
      "Company Authentication Code",
      "UTR Number",
      "Digital Shares Certificate",
      "ID Verification Included",
      "Director Service Address",
    ],
    cta: "Select Platinum",
  },
];

const UKLtdFormation = () => {
  const [headlineIdx, setHeadlineIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setHeadlineIdx((i) => (i + 1) % rotatingHeadlines.length), 3500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    }
  }, []);

  useEffect(() => {
    document.title = "UK LTD Formation Services | Register Your Company with Companies House";

    const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const desc =
      "Register your UK Limited Company quickly with Digiformation Ltd. Includes UTR, ID verification, registered office address, and full compliance support.";
    setMeta("description", desc);
    setMeta(
      "keywords",
      "uk ltd formation, register uk company, uk company registration, companies house registration, uk business setup, ltd formation services"
    );
    setMeta("og:title", "UK LTD Formation Services | Digiformation Ltd", "property");
    setMeta("og:description", desc, "property");
    setMeta("og:type", "website", "property");

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `${window.location.origin}/uk-services/uk-ltd-formation`);

    const schemaId = "ld-uk-ltd-formation";
    document.getElementById(schemaId)?.remove();
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = schemaId;
    script.text = JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "UK LTD Formation",
        provider: { "@type": "Organization", name: "Digiformation Ltd" },
        areaServed: "GB",
        description: desc,
        offers: packages.map((p) => ({
          "@type": "Offer",
          name: `${p.name} Package`,
          price: p.price.replace("£", ""),
          priceCurrency: "GBP",
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${window.location.origin}/` },
          { "@type": "ListItem", position: 2, name: "UK Services", item: `${window.location.origin}/uk-services` },
          { "@type": "ListItem", position: 3, name: "UK LTD Formation", item: `${window.location.origin}/uk-services/uk-ltd-formation` },
        ],
      },
    ]);
    document.head.appendChild(script);
  }, []);

  const current = rotatingHeadlines[headlineIdx];

  return (
    <Layout>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-14 items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-3 mb-6">
                <span className="h-px w-7 bg-primary" />
                <span className="text-xs uppercase tracking-[0.18em] font-semibold">UK Services</span>
              </div>
              <h1
                key={headlineIdx}
                className="text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight animate-fade-in"
              >
                {current.lead} <em className="not-italic text-gradient">{current.accent}</em>
              </h1>
              <p className="mt-8 text-lg md:text-xl leading-relaxed max-w-2xl opacity-90">
                Fast, compliant, and fully supported UK LTD registration with UTR, ID verification, and registered office services.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Button asChild variant="hero" size="lg" className="rounded-full">
                  <Link to="/uk-services/uk-ltd-formation/choose-jurisdiction">Get Started <ArrowRight className="w-4 h-4" /></Link>
                </Button>
                <Button asChild variant="ghostGlow" size="lg" className="rounded-full">
                  <a href="#packages">View Packages</a>
                </Button>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative rounded-2xl overflow-hidden glass shadow-elegant aspect-[4/3]">
                <img src={heroImg} alt="UK LTD Formation" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-tr from-background/40 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST SIGNALS */}
      <section className="py-14 border-t border-border/60">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {trustSignals.map(({ icon: Icon, label }) => (
              <div key={label} className="glass rounded-xl p-5 flex flex-col items-center text-center gap-2">
                <Icon className="w-6 h-6 text-primary" />
                <p className="text-xs md:text-sm opacity-90 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="py-12 border-t border-border/60">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <div className="inline-flex items-center gap-3 mb-5">
                <span className="h-px w-7 bg-primary" />
                <span className="text-xs uppercase tracking-[0.18em] font-semibold">What You Get</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-8">
                Register your <em className="not-italic text-gradient">UK Limited Company</em> with everything covered
              </h2>
              <p className="opacity-90 max-w-xl">
                A fully managed service that takes you from idea to incorporated company — without the paperwork headache.
              </p>
            </div>
            <div className="glass rounded-2xl p-8 md:p-10">
              <div className="space-y-4">
                {whatYouGet.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary" />
                    <p className="opacity-90">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PACKAGES */}
      <section id="packages" className="py-12 border-t border-border/60">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-3 mb-5">
              <span className="h-px w-7 bg-primary" />
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">Packages</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              UK LTD Formation <em className="not-italic text-gradient">Packages</em>
            </h2>
            <p className="opacity-80 mt-4">
              All packages include Companies House filing fee and compliance setup.
            </p>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
            {packages.map((p) => (
              <div
                key={p.name}
                className={`relative glass rounded-2xl p-7 flex flex-col bg-gradient-to-b ${p.tone} ring-1 ${p.ring} ${
                  p.badge ? "xl:scale-[1.03] xl:-translate-y-1" : ""
                } transition-transform hover:-translate-y-1`}
              >
                {p.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.18em] font-bold bg-gradient-brand text-white px-3 py-1 rounded-full">
                    {p.badge}
                  </span>
                )}
                <div className="text-xs uppercase tracking-[0.18em] font-semibold opacity-80">{p.name}</div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-bold">{p.price}</span>
                </div>
                {p.processing && (
                  <p className="mt-1 text-xs opacity-70">Processing: {p.processing}</p>
                )}
                <ul className="mt-6 space-y-3 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <FileCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
                      <span className="opacity-90">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant={p.badge ? "hero" : "ghostGlow"} className="rounded-full mt-7 w-full">
                  <Link to={`/uk-services/uk-ltd-formation/checkout?jurisdiction=EW&package=${p.name}`}>{p.cta} <ArrowRight className="w-4 h-4" /></Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

    </Layout>
  );
};

export default UKLtdFormation;
