import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Clock, Tag, Calendar } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { blogPosts, findBlogPost } from "@/data/blog";

const setMeta = (name: string, content: string) => {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};
const setProp = (p: string, c: string) => {
  let el = document.querySelector(`meta[property="${p}"]`) as HTMLMetaElement | null;
  if (!el) { el = document.createElement("meta"); el.setAttribute("property", p); document.head.appendChild(el); }
  el.setAttribute("content", c);
};

const BlogPost = () => {
  const { slug } = useParams();
  const post = findBlogPost(slug);

  useEffect(() => {
    if (!post) return;
    document.title = post.metaTitle;
    setMeta("description", post.metaDescription);
    setMeta("keywords", post.keywords);
    setMeta("robots", "index, follow, max-snippet:-1, max-image-preview:large");
    setMeta("author", "Digiformation Ltd");
    setProp("og:title", post.metaTitle);
    setProp("og:description", post.metaDescription);
    setProp("og:type", "article");
    setProp("og:url", `${window.location.origin}/blog/${post.slug}`);
    setProp("article:published_time", post.date);
    setProp("article:section", post.category);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", post.metaTitle);
    setMeta("twitter:description", post.metaDescription);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${window.location.origin}/blog/${post.slug}`;

    const id = "blogpost-jsonld";
    document.getElementById(id)?.remove();
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.id = id;
    s.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.metaDescription,
      datePublished: post.date,
      author: { "@type": "Organization", name: "Digiformation Ltd" },
      publisher: { "@type": "Organization", name: "Digiformation Ltd" },
      mainEntityOfPage: `${window.location.origin}/blog/${post.slug}`,
      keywords: post.keywords,
    });
    document.head.appendChild(s);
  }, [post]);

  if (!post) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-5xl font-bold">Article not found</h1>
          <Link to="/blog" className="inline-block mt-8 px-6 py-3 rounded-full bg-gradient-brand">Back to Blog</Link>
        </div>
      </Layout>
    );
  }

  const related = blogPosts.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, 3);

  return (
    <Layout>
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.14em] opacity-90 mb-5">
              <Link to="/blog" className="inline-flex items-center gap-1 hover:text-primary">← Blog</Link>
              <span className="inline-flex items-center gap-1"><Tag className="w-3 h-3" /> {post.category}</span>
              <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime}</span>
              <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> {post.date}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight">
              {post.title}
            </h1>
            <p className="mt-6 text-lg md:text-xl leading-relaxed opacity-90">{post.excerpt}</p>
          </div>
        </div>
      </section>

      <article className="py-14">
        <div className="container mx-auto px-4 max-w-3xl space-y-8">
          {post.content && post.content.length > 0 ? (
            post.content.map((s) => (
              <section key={s.h}>
                <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-4">{s.h}</h2>
                <div
                  className="opacity-90 leading-relaxed prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: s.body }}
                />
              </section>
            ))
          ) : (
            <div className="glass glass-tint-pink rounded-2xl p-10 text-center">
              <h2 className="font-display text-2xl font-bold mb-3">Full article coming soon</h2>
              <p className="opacity-80">
                We're publishing the in-depth version of this guide shortly. In the meantime,
                speak with our specialists on WhatsApp for a personalised walkthrough.
              </p>
              <Button asChild variant="hero" className="rounded-full mt-6">
                <Link to="/contact">Talk to a Specialist <ArrowRight className="w-4 h-4" /></Link>
              </Button>
            </div>
          )}

          <section className="glass glass-tint-pink rounded-2xl p-8 mt-6">
            <h3 className="font-display text-xl font-semibold mb-4">Helpful Digiformation services</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/uk-services/uk-ltd-formation" className="text-primary hover:underline">→ UK LTD Formation</Link></li>
              <li><Link to="/usa-services/us-llc-formation" className="text-primary hover:underline">→ US LLC Formation</Link></li>
              <li><Link to="/banks-payment-solutions" className="text-primary hover:underline">→ Banks &amp; Payment Solutions</Link></li>
              <li><Link to="/contact" className="text-primary hover:underline">→ Free WhatsApp Consultation</Link></li>
            </ul>
          </section>
        </div>
      </article>

      {related.length > 0 && (
        <section className="py-10 border-t border-border/60">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-8">Related articles</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map((p) => (
                <Link key={p.slug} to={`/blog/${p.slug}`} className="glass glass-tint-pink rounded-2xl p-6 hover:-translate-y-1 transition-all">
                  <div className="text-[10px] uppercase tracking-[0.14em] opacity-80 mb-2">{p.category}</div>
                  <h3 className="font-semibold text-base leading-snug">{p.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default BlogPost;
