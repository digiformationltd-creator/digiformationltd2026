import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Calendar, Clock, ExternalLink, FileText } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { findInsight, insights, type Insight } from "@/data/insights";
import { applySeo } from "@/lib/seo";

const Article = ({ insight }: { insight: Insight }) => {
  useEffect(() => {
    const origin = window.location.origin;
    const url = `${origin}/insights/${insight.slug}`;
    const articleLd: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: insight.title,
      description: insight.metaDescription,
      datePublished: insight.publishedDate,
      dateModified: insight.publishedDate,
      author: { "@type": "Organization", name: "Digiformation Ltd", url: origin },
      publisher: {
        "@type": "Organization",
        name: "Digiformation Ltd",
        logo: { "@type": "ImageObject", url: `${origin}/og-image.jpg` },
      },
      mainEntityOfPage: url,
      keywords: insight.keywords,
      articleSection: insight.category,
    };
    const ldArray: Record<string, unknown>[] = [articleLd];
    if (insight.dataset) {
      ldArray.push({
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: insight.dataset.name,
        description: insight.dataset.description,
        creator: { "@type": "Organization", name: "Digiformation Ltd" },
        datePublished: insight.publishedDate,
        license: "https://creativecommons.org/licenses/by/4.0/",
        ...(insight.dataset.measurementTechnique && { measurementTechnique: insight.dataset.measurementTechnique }),
        ...(insight.dataset.variableMeasured && { variableMeasured: insight.dataset.variableMeasured }),
      });
    }
    if (insight.faq?.length) {
      ldArray.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: insight.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      });
    }
    applySeo({
      title: insight.metaTitle,
      description: insight.metaDescription,
      keywords: insight.keywords,
      type: "article",
      path: `/insights/${insight.slug}`,
      breadcrumbs: [
        { name: "Home", path: "/" },
        { name: "Insights", path: "/insights" },
        { name: insight.title, path: `/insights/${insight.slug}` },
      ],
      jsonLd: ldArray,
    });
  }, [insight]);

  return (
    <Layout>
      <article>
        <section className="relative overflow-hidden bg-gradient-hero">
          <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
          <div className="container mx-auto px-4 py-12 md:py-16 relative">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-3 mb-6 text-xs uppercase tracking-[0.18em] opacity-80">
                <span>{insight.category}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> Last updated {insight.lastUpdated}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {insight.readingTime}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight">
                <em className="not-italic text-gradient">{insight.h1}</em>
              </h1>
              <p className="mt-8 text-lg md:text-xl leading-relaxed max-w-3xl opacity-90">{insight.heroIntro}</p>
            </div>
          </div>
        </section>

        <section className="py-12 border-t border-border/60">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-[1fr_320px] gap-12">
              <div className="max-w-3xl">
                <div className="glass glass-tint-pink rounded-2xl p-8 mb-12">
                  <h2 className="text-2xl font-bold mb-4">Key findings</h2>
                  <ul className="space-y-3">
                    {insight.keyFindings.map((f, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="text-primary font-bold flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
                        <span className="opacity-90">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {insight.sections.map((s) => (
                  <section key={s.id} id={s.id} className="mb-12 scroll-mt-24">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">{s.h2}</h2>
                    {s.intro && <p className="text-lg opacity-90 mb-4">{s.intro}</p>}
                    {s.paragraphs?.map((p, i) => (
                      <p key={i} className="opacity-90 leading-relaxed mb-4">{p}</p>
                    ))}
                    {s.bullets && (
                      <ul className="space-y-2 mb-6">
                        {s.bullets.map((b, i) => (
                          <li key={i} className="flex gap-3 opacity-90">
                            <span className="text-primary mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {s.table && (
                      <div className="my-6 overflow-x-auto rounded-xl border border-border/60">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/40">
                            <tr>
                              {s.table.headers.map((h, i) => (
                                <th key={i} className="px-4 py-3 text-left font-semibold">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {s.table.rows.map((row, ri) => (
                              <tr key={ri} className="border-t border-border/60">
                                {row.map((cell, ci) => (
                                  <td key={ci} className="px-4 py-3 opacity-90">{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {s.table.caption && (
                          <div className="px-4 py-2 text-xs opacity-70 bg-muted/20">{s.table.caption}</div>
                        )}
                      </div>
                    )}
                    {s.subsections?.map((sub, i) => (
                      <div key={i} className="mb-6">
                        <h3 className="text-xl font-semibold mb-2">{sub.h3}</h3>
                        <p className="opacity-90 leading-relaxed">{sub.body}</p>
                        {sub.bullets && (
                          <ul className="space-y-2 mt-3">
                            {sub.bullets.map((b, j) => (
                              <li key={j} className="opacity-90">• {b}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                    {s.expertInsight && (
                      <blockquote className="my-6 p-6 rounded-xl border-l-4 border-primary bg-primary/5">
                        <div className="text-xs uppercase tracking-[0.18em] mb-2 opacity-80">Expert insight</div>
                        <p className="italic opacity-95 text-lg">"{s.expertInsight.quote}"</p>
                        <div className="mt-3 text-sm opacity-80">— {s.expertInsight.author}, {s.expertInsight.role}</div>
                      </blockquote>
                    )}
                  </section>
                ))}

                <section id="methodology" className="mb-12 scroll-mt-24">
                  <h2 className="text-3xl font-bold mb-4">Methodology</h2>
                  <p className="opacity-90 leading-relaxed">{insight.methodology}</p>
                </section>

                <section id="sources" className="mb-12 scroll-mt-24">
                  <h2 className="text-3xl font-bold mb-4">Official sources</h2>
                  <ul className="space-y-2">
                    {insight.sources.map((src, i) => (
                      <li key={i}>
                        <a href={src.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-2 text-primary hover:underline">
                          <ExternalLink className="w-4 h-4" /> {src.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>

                {insight.faq?.length ? (
                  <section id="faq" className="mb-12 scroll-mt-24">
                    <h2 className="text-3xl font-bold mb-4">Frequently asked questions</h2>
                    <div className="space-y-5">
                      {insight.faq.map((f, i) => (
                        <div key={i}>
                          <h3 className="text-lg font-semibold mb-1">{f.q}</h3>
                          <p className="opacity-90">{f.a}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                <div className="mt-12 p-8 rounded-2xl bg-gradient-brand text-primary-foreground">
                  <h3 className="text-2xl font-bold mb-3">Need help applying this?</h3>
                  <p className="opacity-95 mb-6">Digiformation handles UK + US incorporation, banking and compliance end-to-end for non-resident founders.</p>
                  <Button asChild variant="hero" size="lg" className="rounded-full">
                    <Link to="/contact">Talk to a specialist <ArrowRight className="w-4 h-4" /></Link>
                  </Button>
                </div>
              </div>

              <aside className="space-y-8">
                <div className="glass glass-tint-pink rounded-2xl p-6 sticky top-28">
                  <div className="text-xs uppercase tracking-[0.18em] mb-3 opacity-80">On this page</div>
                  <ul className="space-y-2 text-sm">
                    {insight.sections.map((s) => (
                      <li key={s.id}>
                        <a href={`#${s.id}`} className="opacity-80 hover:opacity-100 hover:text-primary">{s.h2}</a>
                      </li>
                    ))}
                    <li><a href="#methodology" className="opacity-80 hover:text-primary">Methodology</a></li>
                    <li><a href="#sources" className="opacity-80 hover:text-primary">Sources</a></li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-border/60 p-6">
                  <div className="text-xs uppercase tracking-[0.18em] mb-3 opacity-80">Related services</div>
                  <ul className="space-y-2">
                    {insight.internalLinks.map((l) => (
                      <li key={l.href}>
                        <Link to={l.href} className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                          <FileText className="w-3 h-3" /> {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </article>
    </Layout>
  );
};

export const InsightPage = () => {
  const { slug } = useParams();
  const insight = findInsight(slug);
  if (!insight) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold">Report not found</h1>
          <Link to="/insights" className="inline-block mt-6 text-primary hover:underline">Back to Insights</Link>
        </div>
      </Layout>
    );
  }
  return <Article insight={insight} />;
};

export const InsightsIndex = () => {
  useEffect(() => {
    applySeo({
      title: "Insights & Reports — Digiformation 2026 Authority Hub",
      description: "Original 2026 research from Digiformation: UK formation costs, non-resident jurisdiction benchmarks, Stripe approval data and Companies House compliance reports.",
      keywords: "Digiformation insights, UK company formation data, Stripe approval rates, non resident company reports",
      path: "/insights",
      breadcrumbs: [
        { name: "Home", path: "/" },
        { name: "Insights", path: "/insights" },
      ],
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Digiformation Insights & Reports",
        hasPart: insights.map((i) => ({
          "@type": "Article",
          headline: i.title,
          url: `${typeof window !== "undefined" ? window.location.origin : ""}/insights/${i.slug}`,
        })),
      },
    });
  }, []);

  return (
    <Layout>
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <div className="max-w-4xl">
            <span className="text-xs uppercase tracking-[0.18em] font-semibold">Authority Reports</span>
            <h1 className="mt-6 text-5xl md:text-7xl font-bold leading-[1.02]">
              Digiformation <em className="not-italic text-gradient">Insights</em>
            </h1>
            <p className="mt-8 text-lg md:text-xl max-w-2xl opacity-90">
              Original, source-cited research on UK and US company formation, non-resident incorporation, Stripe approval data and Companies House compliance — updated for 2026.
            </p>
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-6">
          {insights.map((i) => (
            <Link key={i.slug} to={`/insights/${i.slug}`} className="group glass glass-tint-pink rounded-2xl p-8 hover:scale-[1.01] transition">
              <div className="text-xs uppercase tracking-[0.18em] opacity-80 mb-3">{i.category} • {i.lastUpdated}</div>
              <h2 className="text-2xl font-bold mb-3 group-hover:text-primary">{i.title}</h2>
              <p className="opacity-80 mb-4">{i.metaDescription}</p>
              <span className="text-sm text-primary inline-flex items-center gap-1">Read report <ArrowRight className="w-4 h-4" /></span>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
};
