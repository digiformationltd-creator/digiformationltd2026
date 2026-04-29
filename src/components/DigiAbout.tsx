import { Link } from "react-router-dom";
import { Award, Building2, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { icon: Building2, value: "71+", label: "UK Companies Registered Under My Name" },
  { icon: Award, value: "8+", label: "Years of Industry Experience" },
  { icon: ShieldCheck, value: "300+", label: "Clients Served Worldwide" },
];

const DigiAbout = () => (
  <section className="py-24 md:py-32 relative overflow-hidden">
    <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />
    <div className="absolute top-1/3 -left-32 w-[420px] h-[420px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />

    <div className="container mx-auto px-4 relative z-10">
      <div className="grid lg:grid-cols-[auto,1fr] gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
        {/* Founder portrait — monogram placeholder */}
        <div className="relative mx-auto lg:mx-0">
          <div className="relative w-56 h-56 md:w-72 md:h-72 rounded-3xl glass overflow-hidden grid place-items-center group">
            <div className="absolute inset-0 bg-gradient-brand opacity-30" />
            <div className="absolute inset-0 grid-pattern opacity-30" />
            <div className="relative z-10 text-center">
              <div className="font-display text-7xl md:text-8xl font-bold text-gradient leading-none">DF</div>
              <div className="mt-3 text-[10px] uppercase tracking-[0.22em] opacity-80">Founder</div>
            </div>
            <div className="absolute -inset-px rounded-3xl border border-primary/20 pointer-events-none" />
          </div>
          {/* Floating credential chip */}
          <div className="absolute -bottom-4 -right-4 glass rounded-2xl px-4 py-3 shadow-elegant">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <div>
                <div className="text-[10px] uppercase tracking-widest opacity-70">Verified</div>
                <div className="text-xs font-semibold">Companies House</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="h-px w-7 bg-primary" />
            <span className="text-xs uppercase tracking-[0.18em] font-semibold">About Digiformation</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold leading-[1.08] mb-6">
            Built by a founder who has registered{" "}
            <em className="not-italic text-gradient">71+ UK companies</em> under his own name.
          </h2>

          <p className="text-lg leading-relaxed opacity-90 mb-5">
            I started Digiformation Ltd to solve a problem I lived through myself — entrepreneurs
            outside the UK and US struggle to form a company, open a bank account and stay compliant
            without paying premium agency fees or getting lost in paperwork.
          </p>

          <p className="text-base leading-relaxed opacity-80 mb-8">
            Today, with <strong>71+ UK companies</strong> registered directly under my name with
            Companies House, and hundreds of clients served across the UK, USA and beyond — every
            formation, banking and compliance case I handle is backed by years of hands-on experience,
            not outsourced guesswork.
          </p>

          {/* Mini stats */}
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {stats.map((s) => (
              <div key={s.label} className="glass rounded-xl p-4">
                <s.icon className="w-5 h-5 mb-2 opacity-80" />
                <div className="text-2xl font-bold text-gradient">{s.value}</div>
                <div className="text-[11px] uppercase tracking-wider opacity-70 mt-1 leading-snug">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="hero" size="lg" className="rounded-full">
              <Link to="/about">
                Read Full Story <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="ghostGlow" size="lg" className="rounded-full">
              <Link to="/contact">Talk to the Founder</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default DigiAbout;
