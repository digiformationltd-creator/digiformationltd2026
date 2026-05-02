import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, Tag } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { blogPosts } from "@/data/blog";

const setMeta = (name: string, content: string) => {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const BlogIndex = () => {
  useEffect(() => {
    document.title =
      "Digiformation Blog 2026 — UK LTD, US LLC, Stripe, PayPal, Banking & E-commerce Guides Worldwide";
    setMeta(
      "description",
      "Expert 2026 guides for non-resident founders worldwide — UK Limited Company & US LLC formation, Stripe, PayPal, Payoneer, Wise, WorldFirst, Tide, Amazon FBA, eBay, Shopify, BOI, EIN, ITIN, VAT and Companies House compliance."
    );
    setMeta(
      "keywords",
      "Digiformation blog, UK LTD blog 2026, US LLC blog, Stripe non resident, PayPal worldwide, Payoneer guide, Wise business, WorldFirst, Amazon FBA UK, eBay seller, Shopify worldwide, BOI report, EIN ITIN, Companies House ID verification"
    );
    setMeta("robots", "index, follow, max-snippet:-1, max-image-preview:large");
    const setProp = (p: string, c: string) => {
      let el = document.querySelector(`meta[property="${p}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute("property", p); document.head.appendChild(el); }
      el.setAttribute("content", c);
    };
    setProp("og:title", document.title);
    setProp("og:description", "Expert 2026 guides for non-resident founders worldwide — UK LTD & US LLC formation, banking, payment gateways and compliance.");
    setProp("og:type", "website");
    setProp("og:url", `${window.location.origin}/blog`);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", document.title);
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${window.location.origin}/blog`;
  }, []);

  const categories = Array.from(new Set(blogPosts.map((p) => p.category)));

  return (
    <Layout>
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">Insights & Guides</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight">
              The <em className="not-italic text-gradient">Digiformation</em> Blog
            </h1>
            <p className="mt-8 text-lg md:text-xl leading-relaxed max-w-2xl opacity-90">
              Practical guides on UK LTD &amp; US LLC formation, PayPal, Stripe, Payoneer, Wise, WorldFirst, Tide and the rest of the global business stack —
              written for Pakistani entrepreneurs and e-commerce sellers.
            </p>
          </div>
        </div>
      </section>

      <section className="py-10 border-t border-border/60">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 mb-10">
            {categories.map((c) => (
              <span key={c} className="text-[11px] uppercase tracking-[0.14em] glass rounded-full px-3 py-1.5 opacity-90">
                {c}
              </span>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((p) => (
              <Link
                key={p.slug}
                to={`/blog/${p.slug}`}
                className="group glass rounded-2xl p-6 flex flex-col hover:-translate-y-1 hover:shadow-elegant transition-all"
              >
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] opacity-80 mb-3">
                  <span className="inline-flex items-center gap-1"><Tag className="w-3 h-3" /> {p.category}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {p.readTime}</span>
                </div>
                <h2 className="font-display text-lg font-semibold leading-snug mb-3 group-hover:text-gradient">
                  {p.title}
                </h2>
                <p className="text-sm opacity-80 leading-relaxed flex-1">{p.excerpt}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] group-hover:gap-3 transition-all">
                  Read more <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </Layout>
  );
};

export default BlogIndex;
