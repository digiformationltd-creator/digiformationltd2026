import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const headlines = [
  { pre: "Establish Your", accent: "UK or US", post: "Business in Days" },
  { pre: "", accent: "500+", post: "Companies Successfully Registered" },
  { pre: "Banking, Payments &", accent: "Compliance", post: "— All In One Place" },
];

const DigiHero = () => {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % headlines.length), 3800);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-hero">
      {/* hero bg image, dimmed */}
      <img
        src={heroBg}
        alt=""
        width={1920}
        height={1080}
        className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
      <div className="absolute inset-0 grid-pattern opacity-60 pointer-events-none" />

      {/* floating orbs */}
      <div className="absolute top-20 right-10 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-10 left-0 w-[400px] h-[400px] rounded-full bg-primary/10 blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

      <div className="container mx-auto px-4 py-20 relative z-10 text-center">
        <div className="inline-flex glass rounded-full px-5 py-2 mb-10 animate-fade-up">
          <span className="text-[11px] uppercase tracking-widest">UK & US Company Formation • Banking • Compliance</span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-bold leading-[1.05] mb-8 min-h-[1.1em] animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <span key={i} className="block animate-fade-up">
            {headlines[i].pre && <>{headlines[i].pre} </>}
            <span className="text-gradient">{headlines[i].accent}</span>
            {headlines[i].post && <> {headlines[i].post}</>}
          </span>
        </h1>

        <p className="text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed animate-fade-up" style={{ animationDelay: "0.2s" }}>
          Fast, transparent and fully supported company formation, banking, payments, compliance and web services for entrepreneurs worldwide.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <Button asChild variant="hero" size="lg" className="rounded-full">
            <Link to="/contact">
              Book Your Free Consultation <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="ghostGlow" size="lg" className="rounded-full">
            <a href="#services">Explore All Services</a>
          </Button>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs uppercase tracking-widest opacity-70 animate-fade-up" style={{ animationDelay: "0.4s" }}>
          <span>Companies House Authorised</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
          <span>IRS Acceptance Agent Network</span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
          <span>Global Delivery</span>
        </div>
      </div>
    </section>
  );
};

export default DigiHero;
