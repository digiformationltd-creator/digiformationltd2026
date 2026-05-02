import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, MapPin, CheckCircle2, FileCheck } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const JURISDICTIONS = [
  {
    code: "EW",
    name: "England & Wales",
    blurb: "Most common — registered with Companies House in Cardiff. Suits the vast majority of UK businesses.",
  },
  {
    code: "WA",
    name: "Wales",
    blurb: "Wales-only jurisdiction — registered with Companies House in Cardiff. For businesses with a registered office in Wales that prefer a Welsh designation.",
  },
  {
    code: "SC",
    name: "Scotland",
    blurb: "Registered with Companies House in Edinburgh. Required for businesses with a Scottish registered office.",
  },
  {
    code: "NI",
    name: "Northern Ireland",
    blurb: "Registered with Companies House in Belfast. Required for businesses with a Northern Ireland registered office.",
  },
];

type Pkg = {
  name: "Starter" | "Silver" | "Gold" | "Platinum";
  price: string;
  tone: string;
  ring: string;
  badge?: string;
  processing?: string;
  features: string[];
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
  },
];

const UkLtdChooseJurisdiction = () => {
  const [searchParams] = useSearchParams();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Choose Your Jurisdiction — UK LTD Formation | Digiformation Ltd";
    const meta = (n: string, c: string) => {
      let el = document.querySelector(`meta[name="${n}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute("name", n); document.head.appendChild(el); }
      el.setAttribute("content", c);
    };
    meta("description", "Choose your UK Companies House jurisdiction — England & Wales, Scotland, or Northern Ireland — and pick a UK LTD formation package.");
    meta("keywords", "UK LTD jurisdiction, England Wales LTD, Scotland LTD, Northern Ireland LTD, Companies House");
  }, []);

  // Pre-select jurisdiction from ?jurisdiction= query (homepage Quick Start widget)
  useEffect(() => {
    const code = searchParams.get("jurisdiction");
    if (code && JURISDICTIONS.some((j) => j.code === code)) {
      setSelectedCode(code);
      setTimeout(() => document.getElementById("packages")?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    }
  }, [searchParams]);

  const selected = useMemo(
    () => JURISDICTIONS.find((j) => j.code === selectedCode) ?? null,
    [selectedCode],
  );

  const handleSelect = (code: string) => {
    setSelectedCode(code);
    setTimeout(() => document.getElementById("packages")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">Step 1 of 3 — Choose Jurisdiction</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight">
              <em className="not-italic text-gradient">Choose your jurisdiction</em> to register your UK LTD
            </h1>
            <p className="mt-6 text-lg md:text-xl leading-relaxed max-w-2xl opacity-90">
              The UK has three Companies House jurisdictions. Pick the one where your registered office will be — your package and pricing stay the same.
            </p>
          </div>
        </div>
      </section>

      {/* Picker */}
      <section className="py-10 md:py-14 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="glass rounded-3xl p-6 md:p-8 border border-border/50 shadow-elegant">
            <label className="block text-xs uppercase tracking-[0.18em] font-semibold opacity-80 mb-3">
              Select your jurisdiction
            </label>
            <Select value={selectedCode ?? undefined} onValueChange={handleSelect}>
              <SelectTrigger className="h-14 text-base rounded-xl bg-background/60 border-border/60">
                <SelectValue placeholder="— Choose a UK jurisdiction —" />
              </SelectTrigger>
              <SelectContent className="z-50">
                {JURISDICTIONS.map((j) => (
                  <SelectItem key={j.code} value={j.code}>
                    {j.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="mt-6 flex flex-wrap gap-2">
              {JURISDICTIONS.map((j) => (
                <button
                  key={j.code}
                  onClick={() => handleSelect(j.code)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition ${
                    selectedCode === j.code
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border/60 hover:border-primary/60 hover:bg-primary/5"
                  }`}
                >
                  {j.name}
                </button>
              ))}
            </div>

            {selected && (
              <p className="mt-5 text-sm opacity-80">{selected.blurb}</p>
            )}

            <p className="mt-5 text-xs opacity-70">
              All UK LTD packages include the Companies House incorporation fee — no hidden costs.
            </p>
          </div>
        </div>
      </section>

      {/* Packages */}
      {selected && (
        <section id="packages" className="py-12 md:py-16 border-t border-border/60 bg-muted/20">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-[0.14em]">
                <MapPin className="w-3.5 h-3.5" /> {selected.name}
              </div>
              <h2 className="text-4xl md:text-5xl font-bold">
                Choose your <em className="not-italic text-gradient">package</em>
              </h2>
              <p className="opacity-80 mt-3">All amounts in GBP. Companies House fee included.</p>
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
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
                        <span className="opacity-90">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant={p.badge ? "hero" : "ghostGlow"} className="rounded-full mt-7 w-full">
                    <Link to={`/uk-services/uk-ltd-formation/checkout?jurisdiction=${selected.code}&package=${p.name}`}>
                      Continue with {p.name} <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default UkLtdChooseJurisdiction;
