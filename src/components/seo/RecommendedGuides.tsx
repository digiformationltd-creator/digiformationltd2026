import { Link } from "react-router-dom";
import { BookOpen, ArrowRight } from "lucide-react";
import { blogPosts } from "@/data/blog";

type Props = {
  title?: string;
  eyebrow?: string;
  /** Filter blog posts by category (case-insensitive substring match). */
  categories?: string[];
  /** Or pass specific slugs to pin the order. */
  slugs?: string[];
  limit?: number;
  className?: string;
};

const RecommendedGuides = ({
  title = "Recommended Guides",
  eyebrow = "From The Knowledge Base",
  categories,
  slugs,
  limit = 3,
  className,
}: Props) => {
  let picks = blogPosts;
  if (slugs?.length) {
    picks = slugs.map((s) => blogPosts.find((p) => p.slug === s)).filter(Boolean) as typeof blogPosts;
  } else if (categories?.length) {
    const cats = categories.map((c) => c.toLowerCase());
    picks = blogPosts.filter((p) => cats.some((c) => p.category.toLowerCase().includes(c)));
  }
  picks = picks.slice(0, limit);
  if (!picks.length) return null;

  return (
    <section className={`py-12 md:py-16 border-t border-border/60 bg-gradient-to-b from-transparent to-muted/20 ${className ?? ""}`}>
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-end justify-between gap-6 mb-10 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] font-semibold opacity-70 mb-2">{eyebrow}</div>
            <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
          </div>
          <Link to="/blog" className="text-sm font-semibold text-primary inline-flex items-center gap-1.5 hover:gap-2 transition-all">
            View all guides <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {picks.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="glass rounded-2xl p-6 hover:-translate-y-1 hover:shadow-elegant transition-all group flex flex-col"
            >
              <div className="w-11 h-11 rounded-lg bg-primary/10 grid place-items-center mb-4">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-primary mb-2">{post.category}</div>
              <h3 className="font-semibold text-lg leading-snug group-hover:text-gradient line-clamp-3">{post.title}</h3>
              <div className="mt-auto pt-4 text-[11px] uppercase tracking-[0.14em] opacity-70 inline-flex items-center gap-1.5">
                Read guide <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecommendedGuides;
