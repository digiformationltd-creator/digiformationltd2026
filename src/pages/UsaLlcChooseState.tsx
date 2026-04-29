import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Search, Star, CheckCircle2, Loader2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

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
    "24/7 Support",
  ],
  Silver: [
    "U.S. LLC Registration",
    "Unique Business Address (with portal & mail support)",
    "Articles of Organization",
    "Employer Identification Number (EIN)",
    "Digital Company Documents (PDF)",
    "Certificate of Formation (Digital)",
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
    "Priority 24/7 Support",
  ],
};

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const UsaLlcChooseState = () => {
  const [states, setStates] = useState<StatePricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Choose Your State — U.S. LLC Formation | Digiformation Ltd";
    const meta = (n: string, c: string) => {
      let el = document.querySelector(`meta[name="${n}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute("name", n); document.head.appendChild(el); }
      el.setAttribute("content", c);
    };
    meta("description", "Select the U.S. state where you want to register your LLC. Pricing for Starter, Silver, and Gold packages updates automatically based on your chosen state.");
    meta("keywords", "US LLC state, LLC formation pricing, Wyoming LLC, Delaware LLC, Florida LLC, Texas LLC");
  }, []);

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return states;
    return states.filter(
      (s) => s.state_name.toLowerCase().includes(q) || s.state_code.toLowerCase().includes(q),
    );
  }, [states, query]);

  const popular = useMemo(() => states.filter((s) => s.is_popular), [states]);
  const selected = useMemo(
    () => states.find((s) => s.state_code === selectedCode) ?? null,
    [states, selectedCode],
  );

  const scrollToPackages = () => {
    setTimeout(() => document.getElementById("packages")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
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
              <span className="h-px w-7 bg-primary" />
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">Step 1 of 3 — Choose State</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight">
              <em className="not-italic text-gradient">Choose your state</em> to register your LLC
            </h1>
            <p className="mt-6 text-lg md:text-xl leading-relaxed max-w-2xl opacity-90">
              Each U.S. state has its own filing fees and rates. Select your state first — your package pricing will be calculated automatically based on it.
            </p>
          </div>
        </div>
      </section>

      {/* State picker */}
      <section className="py-10 md:py-14 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Search */}
          <div className="glass rounded-2xl p-4 md:p-5 mb-8 flex items-center gap-3">
            <Search className="w-5 h-5 opacity-70" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search state by name or code (e.g. Texas, TX)"
              className="flex-1 bg-transparent outline-none text-base placeholder:opacity-60"
            />
          </div>

          {loading ? (
            <div className="py-20 grid place-items-center opacity-70">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              {/* Popular */}
              {!query && popular.length > 0 && (
                <div className="mb-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold uppercase tracking-[0.14em]">Popular Choices</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {popular.map((s) => (
                      <StateCard
                        key={s.id}
                        state={s}
                        active={selectedCode === s.state_code}
                        onSelect={() => { setSelectedCode(s.state_code); scrollToPackages(); }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] mb-4 opacity-80">
                  {query ? `Results (${filtered.length})` : "All States"}
                </h3>
                {filtered.length === 0 ? (
                  <div className="opacity-70 text-center py-10">No states matched your search.</div>
                ) : (
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filtered.map((s) => (
                      <StateCard
                        key={s.id}
                        state={s}
                        compact
                        active={selectedCode === s.state_code}
                        onSelect={() => { setSelectedCode(s.state_code); scrollToPackages(); }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
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
    </Layout>
  );
};

const StateCard = ({
  state,
  active,
  compact,
  onSelect,
}: {
  state: StatePricing;
  active: boolean;
  compact?: boolean;
  onSelect: () => void;
}) => (
  <button
    onClick={onSelect}
    className={`group text-left glass rounded-2xl p-4 md:p-5 transition-all border hover:-translate-y-0.5 hover:shadow-elegant ${
      active ? "border-primary shadow-glow ring-2 ring-primary/40" : "border-border/40 hover:border-primary/40"
    }`}
  >
    <div className="flex items-start justify-between gap-2">
      <div>
        <div className="text-[10px] uppercase tracking-[0.16em] opacity-70">{state.state_code}</div>
        <div className={`font-semibold ${compact ? "text-base" : "text-lg"}`}>{state.state_name}</div>
      </div>
      {state.is_popular && !compact && (
        <span className="text-[9px] uppercase tracking-[0.14em] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
          Popular
        </span>
      )}
    </div>
    <div className="mt-3 flex items-baseline gap-1">
      <span className="text-xs opacity-70">from</span>
      <span className="text-lg font-bold text-gradient">{formatUSD(Number(state.starter_price_usd))}</span>
    </div>
    <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
      Select <ArrowRight className="w-3 h-3" />
    </div>
  </button>
);

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
