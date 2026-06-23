import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useSeo } from "@/lib/seo";
import { bankingProviders, BANKING_CATEGORIES, type BankingCategory } from "@/data/banking";
import { ArrowRight, Sparkles, Building2, Globe2, CreditCard } from "lucide-react";

const CATEGORY_ICON: Record<BankingCategory, any> = {
  "Payment Gateways": CreditCard,
  "Business Accounts": Building2,
  "International Transfers": Globe2,
};

const TAG_STYLE: Record<NonNullable<typeof bankingProviders[number]["tag"]>, string> = {
  Recommended: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
  Popular: "bg-amber-400/15 text-amber-300 ring-amber-400/30",
  "Best for Business": "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  New: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
};

type Filter = "All" | BankingCategory;

const BankingHub = () => {
  const [filter, setFilter] = useState<Filter>("All");

  useSeo({
    title: "Business Banking & Payment Gateways 2026 — Stripe, PayPal, Wise, Tide | Digiformation",
    description:
      "Pricing for every global payment gateway and business account we set up — Stripe, PayPal, Wise, Tide, Airwallex, Payoneer and more. Transparent fixed setup fees.",
    keywords:
      "business bank account UK 2026, Stripe non resident, PayPal business, Wise business account, Payoneer, WorldFirst, Tide bank, Airwallex, payment gateway non resident, pricing",
    path: "/banks-payment-solutions",
    type: "website",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Banking & Payments", path: "/banks-payment-solutions" },
    ],
  });

  const filtered = useMemo(
    () =>
      filter === "All"
        ? bankingProviders
        : bankingProviders.filter((p) => p.category === filter),
    [filter]
  );

  const tabs: Filter[] = ["All", ...BANKING_CATEGORIES];

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-primary/10 ring-1 ring-primary/30 text-xs uppercase tracking-[0.18em] font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Transparent pricing
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.02]">
              Banking &amp; <em className="not-italic text-gradient">Payment Solutions</em>
            </h1>
            <p className="mt-6 text-lg md:text-xl leading-relaxed max-w-2xl opacity-90">
              Fixed setup fees for every global gateway and business account we open on your behalf —
              no hidden costs, no monthly retainer.
            </p>
          </div>
        </div>
      </section>

      {/* Filter tabs */}
      <section className="py-8 border-b border-border/40">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => {
              const active = filter === t;
              const Icon = t === "All" ? Sparkles : CATEGORY_ICON[t];
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilter(t)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition ring-1 ${
                    active
                      ? "bg-primary text-primary-foreground ring-primary shadow-elegant"
                      : "bg-background/40 ring-border/40 hover:ring-primary/50 hover:bg-primary/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p) => (
              <article
                key={p.slug}
                className="relative flex flex-col rounded-2xl border border-border/40 bg-background/40 backdrop-blur-sm p-6 hover:-translate-y-1 hover:shadow-elegant hover:border-primary/40 transition-all duration-300 group"
              >
                {p.tag && (
                  <span
                    className={`absolute -top-3 left-5 text-[10px] uppercase tracking-[0.16em] font-bold px-2.5 py-1 rounded-full ring-1 ${TAG_STYLE[p.tag]}`}
                  >
                    {p.tag}
                  </span>
                )}

                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-2xl font-bold leading-tight">{p.name}</h2>
                  {p.category && (
                    <span className="text-[10px] uppercase tracking-wider opacity-60 text-right">
                      {p.category}
                    </span>
                  )}
                </div>

                <p className="text-sm opacity-80 mt-2 leading-relaxed line-clamp-2">{p.tagline}</p>

                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-[11px] uppercase tracking-[0.18em] opacity-60">Starting from</span>
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-5xl font-bold text-gradient leading-none">{p.setupPrice}</span>
                  <span className="text-sm opacity-60">one-off setup</span>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <Link
                    to={`/banks-payment-solutions/${p.slug}/checkout`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-gradient-brand text-primary-foreground font-semibold text-sm hover:shadow-elegant transition"
                  >
                    Request Setup <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/banks-payment-solutions/${p.slug}`}
                    className="inline-flex items-center justify-center gap-1 text-xs uppercase tracking-[0.16em] font-semibold opacity-70 hover:opacity-100 hover:text-primary transition"
                  >
                    View details
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="text-center opacity-60 py-12">No providers in this category yet.</p>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default BankingHub;
