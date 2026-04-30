import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const cases = [
  {
    tag: "UK Startup",
    title: "Full LTD setup in under 48 hours",
    points: [
      "UK Limited Company registered with Companies House",
      "Business banking activated and verified",
      "Full compliance & ID verification completed",
    ],
  },
  {
    tag: "US LLC",
    title: "Merchant-ready in 3 days",
    points: [
      "US LLC formation with registered agent",
      "EIN, ITIN, and BIO report processed",
      "Stripe & PayPal merchant accounts approved",
    ],
  },
  {
    tag: "UK Compliance",
    title: "Annual filing handled end-to-end",
    points: [
      "Confirmation statement filed on time",
      "Annual accounts prepared and submitted",
      "Director and PSC records kept fully compliant",
    ],
  },
];

const DigiCaseStudies = () => (
  <section className="py-14 md:py-10 relative overflow-hidden border-y border-border/40">
    <div className="absolute inset-0 grid-pattern opacity-15 pointer-events-none" />
    <div className="container mx-auto px-4 relative z-10">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="mb-5 text-sm md:text-base uppercase tracking-[0.18em] font-semibold text-primary">Case Studies</div>
        <h2 className="text-5xl md:text-6xl font-bold leading-tight">
          Real founders. <em className="not-italic text-gradient">Real results.</em>
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {cases.map((c) => (
          <article key={c.tag} className="glass rounded-2xl p-7 hover:-translate-y-1 hover:shadow-elegant transition-all duration-300 flex flex-col">
            <span className="inline-block self-start text-[10px] font-semibold uppercase tracking-[0.16em] px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
              {c.tag}
            </span>
            <h3 className="font-display text-xl font-semibold mb-4 leading-snug">{c.title}</h3>
            <ul className="space-y-2 mb-6 flex-1">
              {c.points.map((p) => (
                <li key={p} className="flex gap-2 text-sm opacity-90">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] hover:gap-3 transition-all"
            >
              Read Full Case Study <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default DigiCaseStudies;
