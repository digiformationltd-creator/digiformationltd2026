import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, Wallet } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { bankingProviders } from "@/data/banking";

const BankingProviderPage = () => {
  const { slug } = useParams();
  const provider = bankingProviders.find((p) => p.slug === slug);

  useEffect(() => {
    if (!provider) return;
    document.title = provider.metaTitle;
    const meta = (n: string, c: string) => {
      let el = document.querySelector(`meta[name="${n}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute("name", n); document.head.appendChild(el); }
      el.setAttribute("content", c);
    };
    meta("description", provider.metaDescription);
    meta("keywords", provider.keywords);
  }, [provider]);

  if (!provider) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-5xl font-bold">Provider not found</h1>
          <Link to="/banks-payment-solutions" className="inline-block mt-8 px-6 py-3 rounded-full bg-gradient-brand">View all providers</Link>
        </div>
      </Layout>
    );
  }

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <Layout>
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="container mx-auto px-4 py-12 md:py-14 relative">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="h-px w-7 bg-primary" />
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">Banks & Payment Solutions</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight">
              {provider.name} <em className="not-italic text-gradient">Account Setup</em>
            </h1>
            <p className="mt-6 text-lg md:text-xl leading-relaxed max-w-2xl opacity-90">{provider.tagline}</p>
            <p className="mt-4 text-base leading-relaxed max-w-2xl opacity-80">{provider.description}</p>
            <div className="mt-10 flex flex-wrap gap-4 items-center">
              <Button variant="hero" size="lg" className="rounded-full" onClick={() => scrollTo("apply")}>
                Apply Now <ArrowRight className="w-4 h-4" />
              </Button>
              <div className="glass rounded-full px-5 py-2 text-sm flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Setup fee: <span className="font-bold text-gradient">{provider.setupPrice}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-xs uppercase tracking-[0.18em] opacity-70 mb-3">Key Features</div>
          <h2 className="text-4xl font-bold mb-10">Why choose {provider.name}</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {provider.features.map((f) => (
              <div key={f} className="glass rounded-2xl p-6 flex gap-4 hover:-translate-y-1 transition-transform">
                <CheckCircle2 className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                <span className="font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 border-t border-border/60 bg-muted/10">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-xs uppercase tracking-[0.18em] opacity-70 mb-3">Application Requirements</div>
          <h2 className="text-4xl font-bold mb-4">What you'll need to apply</h2>
          <p className="opacity-80 mb-10 max-w-2xl">Please prepare the following documents and details before starting your {provider.name} application. This helps us complete your setup quickly and without delays.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {provider.requirements.map((r, i) => (
              <div key={r} className="glass rounded-xl p-5 flex gap-4 items-start">
                <div className="w-7 h-7 rounded-full bg-gradient-brand grid place-items-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                <span className="font-medium text-sm leading-relaxed">{r}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="apply" className="py-10 bg-muted/20 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Apply for {provider.name}</h2>
          <p className="opacity-80 mb-8">Setup fee <span className="text-gradient font-bold">{provider.setupPrice}</span> — we handle the application end-to-end and keep you updated.</p>
          <Button asChild variant="hero" size="lg" className="rounded-full">
            <Link to={`/contact?service=${encodeURIComponent(provider.name)}`}>Apply for {provider.name} <ArrowRight className="w-4 h-4" /></Link>
          </Button>
        </div>
      </section>

      <section className="py-10 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold mb-8">Other Payment Providers</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {bankingProviders.filter((p) => p.slug !== provider.slug).slice(0, 8).map((p) => (
              <Link key={p.slug} to={`/banks-payment-solutions/${p.slug}`} className="glass rounded-2xl p-6 hover:-translate-y-1 hover:shadow-elegant transition-all group">
                <h3 className="font-semibold text-lg group-hover:text-gradient">{p.name}</h3>
                <div className="text-xs opacity-70 mt-1">{p.setupPrice} setup</div>
                <div className="mt-3 text-[11px] uppercase tracking-[0.14em]">Explore →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default BankingProviderPage;
