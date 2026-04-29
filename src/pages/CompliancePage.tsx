import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, ShieldCheck, Building2, Clock, FileCheck } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { findCompliancePage } from "@/data/compliance";
import NotFound from "./NotFound";

const trust = [
  { icon: Building2, label: "Companies House Approved" },
  { icon: Clock, label: "Fast Turnaround" },
  { icon: ShieldCheck, label: "100% Compliance" },
  { icon: FileCheck, label: "Documents Included" },
];

const CompliancePage = () => {
  const { slug } = useParams();
  const page = findCompliancePage(slug);

  useEffect(() => {
    if (!page) return;
    document.title = page.metaTitle;
    const meta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    meta("description", page.metaDescription);
    meta("keywords", page.keywords);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = window.location.href;

    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Service",
          name: page.title,
          provider: { "@type": "Organization", name: "Digiformation Ltd" },
          areaServed: "United Kingdom",
          description: page.description,
          offers: { "@type": "Offer", price: page.price.replace(/[^0-9.]/g, ""), priceCurrency: "GBP" },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: window.location.origin + "/" },
            { "@type": "ListItem", position: 2, name: "UK Compliance", item: window.location.origin + "/uk-compliance" },
            { "@type": "ListItem", position: 3, name: page.title, item: window.location.href },
          ],
        },
      ],
    };
    let s = document.getElementById("ldjson-compliance") as HTMLScriptElement | null;
    if (!s) { s = document.createElement("script"); s.type = "application/ld+json"; s.id = "ldjson-compliance"; document.head.appendChild(s); }
    s.text = JSON.stringify(schema);
  }, [page]);

  if (!page) return <NotFound />;

  return (
    <Layout>
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="container mx-auto px-4 py-24 md:py-28 relative">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="h-px w-7 bg-primary" />
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">{page.eyebrow}</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight">
              <em className="not-italic text-gradient">{page.hero}</em>
            </h1>
            <p className="mt-8 text-lg md:text-xl leading-relaxed max-w-2xl opacity-90">{page.description}</p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <Button asChild variant="hero" size="lg" className="rounded-full">
                <Link to="/contact">Get Started — {page.price} <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button asChild variant="ghostGlow" size="lg" className="rounded-full">
                <Link to="/uk-compliance">All Compliance Services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-border/60">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <div className="inline-flex items-center gap-3 mb-5">
                <span className="h-px w-7 bg-primary" />
                <span className="text-xs uppercase tracking-[0.18em] font-semibold">Service Overview</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-8">
                What's <em className="not-italic text-gradient">included</em>
              </h2>
              <ul className="space-y-4">
                {page.overview.map((o) => (
                  <li key={o} className="flex items-start gap-3 glass rounded-xl p-4">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                    <span className="font-medium">{o}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass rounded-2xl p-10">
              <div className="text-[10px] uppercase tracking-[0.18em] opacity-70 mb-2">Service Charge</div>
              <div className="text-5xl font-bold text-gradient">{page.price}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/20 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="h-px w-7 bg-primary" />
            <span className="text-xs uppercase tracking-[0.18em] font-semibold">Requirements</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            What we'll <em className="not-italic text-gradient">need from you</em>
          </h2>
          <p className="opacity-80 mb-10 max-w-2xl">Please have the following details ready so we can complete your filing quickly with Companies House.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {page.requirements.map((r, i) => (
              <div key={r} className="glass rounded-xl p-5 flex gap-4 items-start">
                <div className="w-7 h-7 rounded-full bg-gradient-brand grid place-items-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                <span className="font-medium">{r}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="glass rounded-3xl p-14 text-center max-w-3xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-bold">
              Ready to <em className="not-italic text-gradient">file?</em>
            </h3>
            <p className="mt-4 opacity-90">Speak with our specialists today — fast, compliant, and Companies House approved.</p>
            <Button asChild variant="hero" size="lg" className="rounded-full mt-8">
              <Link to="/contact">Start Your Filing <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CompliancePage;
