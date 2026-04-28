import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

const headlines = [
  "Establish Your UK or US Business in Days",
  "500+ Companies Successfully Registered",
  "Banking, Payments & Compliance — All In One Place",
];

const Hero = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % headlines.length), 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden">
      <div className="glow-orb -top-40 -right-40" />
      <div className="glow-orb -bottom-40 -left-40" style={{ animationDelay: "2s" }} />
      <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,hsl(var(--gold)/0.08),transparent_60%)] pointer-events-none" />

      <div className="container relative z-10 px-4 py-20 mx-auto text-center">
        <div className="eyebrow justify-center mb-8 animate-fade-in-up">
          <Sparkles className="w-3.5 h-3.5" />
          Trusted by 500+ global entrepreneurs
        </div>

        <h1 className="font-display text-[clamp(2.5rem,7vw,6.5rem)] font-light leading-[0.95] tracking-tight max-w-5xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <span key={index} className="block animate-fade-in">
            {headlines[index].split(" ").map((word, i, arr) => {
              const isAccent = i === arr.length - 1 || i === arr.length - 2;
              return (
                <span key={i} className={isAccent ? "italic font-semibold gradient-text-gold" : ""}>
                  {word}{i < arr.length - 1 ? " " : ""}
                </span>
              );
            })}
          </span>
        </h1>

        <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          Fast, transparent, and fully supported company formation, banking, payments, compliance & web services for entrepreneurs worldwide.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <Link to="/contact" className="btn-gold group">
            Book Your Free Consultation
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link to="#services" className="btn-ghost-gold">
            Explore All Services
          </Link>
        </div>

        <div className="mt-20 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-xs font-utility uppercase tracking-[0.18em] text-muted-foreground animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <span className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gold" /> Companies House Verified</span>
          <span className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gold" /> IRS Authorised</span>
          <span className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gold" /> 4.9 ★ Client Rating</span>
        </div>
      </div>
    </section>
  );
};

export default Hero;
