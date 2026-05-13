import { Zap, Eye, ShieldCheck, Globe2, Headphones, Award } from "lucide-react";
import whyBg from "@/assets/premium-why-choose-bg.jpg";

const reasons = [
  { icon: Zap, title: "Speed & Efficiency", desc: "Quick UK & US company formation and compliance — most setups completed within days." },
  { icon: Eye, title: "Transparency", desc: "Clear, upfront pricing with no hidden fees. You know exactly what you're paying for, every step of the way." },
  { icon: ShieldCheck, title: "Full Compliance", desc: "UTR, EIN/ITIN, ID verification, annual filings and tax compliance — all handled by certified specialists." },
  { icon: Globe2, title: "Global Expertise", desc: "Supporting entrepreneurs across multiple jurisdictions with deep local regulatory knowledge." },
  { icon: Headphones, title: "Dedicated Support", desc: "Personalized account managers for every client — real humans, fast responses, no ticket queues." },
  { icon: Award, title: "Proven Success", desc: "Over 300 companies registered globally with a 98% client retention rate." },
];

const DigiWhyChoose = () => (
  <section className="py-14 md:py-10 relative overflow-hidden">
    <div
      aria-hidden
      className="absolute inset-0 bg-cover bg-center opacity-25 pointer-events-none"
      style={{ backgroundImage: `url(${whyBg})` }}
    />
    <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/70 to-background/90 pointer-events-none" />
    <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />
    <div className="absolute -left-40 top-1/3 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl" />

    <div className="container mx-auto px-4 relative z-10">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="mb-5 text-sm md:text-base uppercase tracking-[0.18em] font-semibold text-primary">Why Choose Us</div>
        <h2 data-reveal="rise" className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
          Why founders choose <em className="not-italic text-gradient">Digiformation</em>
        </h2>
      </div>

      <div data-reveal-stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {reasons.map((r) => (
          <div key={r.title} className="glass rounded-2xl p-7 hover:-translate-y-1 hover:shadow-elegant transition-all duration-300">
            <div className="w-11 h-11 rounded-xl bg-muted/40 border border-border/40 grid place-items-center mb-4 shadow-card text-muted-foreground animate-float">
              <r.icon className="w-5 h-5 text-muted-foreground" strokeWidth={1.75} />
            </div>
            <h3 className="font-display text-lg font-semibold mb-2">{r.title}</h3>
            <p className="text-sm leading-relaxed opacity-90">{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default DigiWhyChoose;
