import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlowingEarth from "@/components/GlowingEarth";

const headlines = [
  { pre: "Establish Your", accent: "UK or US", post: "Business in Days" },
  { pre: "", accent: "300+", post: "Companies Successfully Registered" },
  { pre: "Banking, Payments &", accent: "Compliance", post: "— All In One Place" },
];

const DigiHero = () => {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % headlines.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-hero">
      <div className="absolute inset-0 grid-pattern opacity-50 pointer-events-none" />

      {/* floating orbs — source spec */}
      <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-primary/20 blur-3xl animate-float" aria-hidden />
      <div className="absolute -bottom-40 -right-20 w-[520px] h-[520px] rounded-full bg-accent/20 blur-3xl animate-float" aria-hidden style={{ animationDelay: "2s" }} />

      {/* Rotating glowing earth — sits behind headline */}
      <GlowingEarth />

      <div className="container mx-auto px-4 py-20 relative z-10 text-center">
        <div className="inline-flex glass rounded-full px-5 py-2 mt-10 md:mt-20 mb-10 animate-fade-up">
          <span className="text-[11px] uppercase tracking-widest">UK & US Company Formation • Banking • Compliance</span>
        </div>

        <div className="relative">
          {/* Massive glow emanating from behind the headline */}
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[260%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.55)_0%,hsl(var(--accent)/0.30)_28%,hsl(var(--primary)/0.12)_55%,transparent_75%)] blur-3xl animate-hero-glow" />
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[160%] rounded-full bg-[radial-gradient(circle,hsl(var(--accent)/0.45),transparent_70%)] blur-2xl animate-hero-glow-slow" />

          <h1 className="relative text-5xl md:text-7xl lg:text-[5.5rem] font-bold leading-[1.05] mb-8 min-h-[1.2em] animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <span key={i} className="block animate-headline-slide will-change-transform">
              {headlines[i].pre && <>{headlines[i].pre} </>}
              <span className="headline-accent-shimmer">{headlines[i].accent}</span>
              {headlines[i].post && <> {headlines[i].post}</>}
            </span>
          </h1>
        </div>
        <style>{`
          @keyframes hero-glow {
            0%, 100% { opacity: 0.85; transform: translate(-50%, -50%) scale(1); }
            50%      { opacity: 1;    transform: translate(-50%, -50%) scale(1.08); }
          }
          @keyframes hero-glow-slow {
            0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.05); }
            50%      { opacity: 1;   transform: translate(-50%, -50%) scale(0.95); }
          }
          .animate-hero-glow      { animation: hero-glow 5s ease-in-out infinite; }
          .animate-hero-glow-slow { animation: hero-glow-slow 8s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce) {
            .animate-hero-glow, .animate-hero-glow-slow { animation: none; }
          }
        `}</style>

        <p className="text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed animate-fade-up" style={{ animationDelay: "0.2s" }}>
          Fast, transparent and fully supported company formation, banking, payments, compliance and web services for entrepreneurs worldwide.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <Button asChild variant="hero" size="lg" className="rounded-full">
            <Link to="/uk-services/uk-ltd-formation/choose-jurisdiction">
              Register Your UK Company <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="hero" size="lg" className="rounded-full">
            <Link to="/usa-services/us-llc-formation/choose-state">
              Register Your USA Company <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="ghostGlow" size="lg" className="rounded-full">
            <a href="#services">Explore All Services</a>
          </Button>
        </div>

      </div>
    </section>
  );
};

export default DigiHero;
