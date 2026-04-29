import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { usaServicePages } from "@/data/usaServices";

const UsaServicePage = () => {
  const { slug } = useParams();
  const page = usaServicePages.find((p) => p.slug === slug);

  useEffect(() => {
    if (!page) return;
    document.title = page.metaTitle;
    const meta = (n: string, c: string) => {
      let el = document.querySelector(`meta[name="${n}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute("name", n); document.head.appendChild(el); }
      el.setAttribute("content", c);
    };
    meta("description", page.metaDescription);
    meta("keywords", page.keywords);
  }, [page]);

  if (!page) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="font-display text-5xl font-bold">Service not found</h1>
          <Link to="/usa-services" className="inline-block mt-8 px-6 py-3 rounded-full bg-gradient-brand">Back to USA Services</Link>
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
        <div className="container mx-auto px-4 py-24 md:py-28 relative">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="h-px w-7 bg-primary" />
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">USA Services</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight">{page.hero}</h1>
            <p className="mt-8 text-lg md:text-xl leading-relaxed max-w-2xl opacity-90">{page.description}</p>
            <div className="mt-10">
              <Button variant="hero" size="lg" className="rounded-full" onClick={() => scrollTo("requirements")}>
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-xs uppercase tracking-[0.18em] opacity-70 mb-3">Service Features</div>
          <h2 className="text-4xl font-bold mb-10">What's included</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {page.features.map((f) => (
              <div key={f} className="glass rounded-2xl p-6 flex gap-4 hover:-translate-y-1 transition-transform">
                <CheckCircle2 className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                <span className="font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="requirements" className="py-20 bg-muted/20 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Ready to get started?</h2>
          <p className="opacity-80 mb-8">Submit your details and our team will be in touch within one business day.</p>
          <Button asChild variant="hero" size="lg" className="rounded-full">
            <Link to="/contact">Get Started <ArrowRight className="w-4 h-4" /></Link>
          </Button>
        </div>
      </section>

      <section className="py-20 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold mb-8">Other USA Services</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {usaServicePages.filter((p) => p.slug !== page.slug).map((p) => (
              <Link key={p.slug} to={`/usa-services/${p.slug}`} className="glass rounded-2xl p-6 hover:-translate-y-1 hover:shadow-elegant transition-all group">
                <h3 className="font-semibold text-lg group-hover:text-gradient">{p.title.replace(" Service", "")}</h3>
                <div className="mt-3 text-[11px] uppercase tracking-[0.14em]">Explore →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default UsaServicePage;
