import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Building2, ShieldCheck, FileCheck, Landmark, CreditCard, FileText, Code2, Hash } from "lucide-react";

type Service = {
  num: string;
  category: string;
  title: string;
  desc: string;
  href: string;
  icon: React.ReactNode;
  flag?: string;
};

const services: Service[] = [
  { num: "01", category: "UK Formation", title: "UK LTD Company Formation", desc: "Register a UK Limited Company with Companies House. Fast, compliant, managed from anywhere in the world.", href: "/uk-services/uk-ltd-formation", flag: "🇬🇧", icon: <Building2 /> },
  { num: "02", category: "UK Compliance", title: "LTD ID Verification", desc: "Companies House identity verification for directors & PSCs. Secure, fast, and fully DIATF compliant.", href: "/uk-services/ltd-id-verification", icon: <ShieldCheck /> },
  { num: "03", category: "UK Compliance", title: "Company Compliance Services", desc: "Name change, director updates, address change, SIC code, PSC, shareholders, confirmation statements & more.", href: "/uk-compliance/confirmation-statement", icon: <FileCheck /> },
  { num: "04", category: "USA Formation", title: "US LLC Formation", desc: "Register a US LLC remotely. Access PayPal, Stripe, Amazon, and the US market without being physically present.", href: "/usa-services/us-llc-formation", flag: "🇺🇸", icon: <Building2 /> },
  { num: "05", category: "Banking", title: "Banks & Payment Solutions", desc: "Tide, Airwallex, Wise, Payoneer, Stripe, PayPal, WorldFirst, Sunrate, Zyla, Mollie, Wallester, Zionpe & more.", href: "/banks-payment-solutions/stripe", icon: <Landmark /> },
  { num: "06", category: "UK Compliance", title: "Company Annual Filing", desc: "Confirmation statements, annual accounts filing and all statutory returns submitted to Companies House on time.", href: "/uk-services/company-annual-filing", icon: <FileText /> },
  { num: "07", category: "Technology", title: "Web Development", desc: "Professional websites, landing pages, and e-commerce solutions for your UK or US business. From concept to launch.", href: "/web-development", icon: <Code2 /> },
  { num: "08", category: "USA Services", title: "EIN Number Registration", desc: "Get your US Employer Identification Number (EIN) from the IRS. Required for US business banking and tax compliance.", href: "/usa-services/ein-number", icon: <Hash /> },
];

const ServicesSlider = () => {
  const [active, setActive] = useState(0);
  const total = services.length;
  const next = () => setActive((a) => (a + 1) % total);
  const prev = () => setActive((a) => (a - 1 + total) % total);

  return (
    <section id="services" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="glow-orb -top-32 -right-32 opacity-50" />

      <div className="container px-4 relative z-10">
        <div className="text-center mb-20">
          <div className="eyebrow justify-center mb-5">Our Services</div>
          <h2 className="font-display text-4xl md:text-6xl font-light leading-[1.05]">
            Everything Your <br />
            <em className="font-semibold gradient-text-gold not-italic">Business Needs</em>
          </h2>
        </div>

        {/* Stage */}
        <div className="relative h-[460px] [perspective:1400px] select-none">
          <div className="relative w-full h-full [transform-style:preserve-3d]">
            {services.map((s, i) => {
              const offset = ((i - active + total) % total + total) % total;
              const rel = offset > total / 2 ? offset - total : offset;
              const abs = Math.abs(rel);
              const isActive = rel === 0;

              const translateX = rel * 200;
              const translateZ = abs === 0 ? 0 : -abs * 220;
              const rotateY = rel * -22;
              const opacity = abs > 2 ? 0 : 1 - abs * 0.18;
              const z = 100 - abs;

              return (
                <article
                  key={s.num}
                  onClick={() => setActive(i)}
                  className={`absolute top-1/2 left-1/2 w-[300px] h-[400px] -ml-[150px] -mt-[200px] glass-card glass-card-hover transition-all duration-700 ease-out cursor-pointer p-9 flex flex-col ${isActive ? "border-gold/50 shadow-[0_0_60px_hsl(var(--gold)/0.18)]" : ""}`}
                  style={{
                    transform: `translate3d(${translateX}px, 0, ${translateZ}px) rotateY(${rotateY}deg)`,
                    opacity,
                    zIndex: z,
                    pointerEvents: abs > 2 ? "none" : "auto",
                  }}
                >
                  {isActive && (
                    <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
                  )}
                  <span className="absolute top-5 right-6 font-display text-[68px] font-bold leading-none text-gold/[0.07]">
                    {s.num}
                  </span>

                  {s.flag ? (
                    <div className="text-4xl mb-5">{s.flag}</div>
                  ) : (
                    <div className="w-12 h-12 mb-6 text-gold [&_svg]:w-full [&_svg]:h-full [&_svg]:stroke-[1.2]">{s.icon}</div>
                  )}

                  <div className="font-utility text-[10px] font-semibold uppercase tracking-[0.16em] text-gold/80 mb-3">
                    {s.category}
                  </div>
                  <h3 className={`font-display text-2xl font-semibold leading-tight mb-3 transition-colors ${isActive ? "text-gold-light" : "text-foreground"}`}>
                    {s.title}
                  </h3>
                  <p className="text-[13.5px] text-muted-foreground/80 leading-relaxed flex-1">
                    {s.desc}
                  </p>

                  {isActive && (
                    <Link
                      to={s.href}
                      className="inline-flex items-center gap-2 mt-5 font-utility text-[11px] font-semibold uppercase tracking-[0.12em] text-gold hover:gap-3 transition-all"
                    >
                      Explore Service <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        </div>

        {/* Dots */}
        <div className="flex gap-2.5 justify-center mt-12">
          {services.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === active ? "w-7 bg-gold" : "w-1.5 bg-foreground/20 hover:bg-foreground/40"}`}
            />
          ))}
        </div>

        {/* Nav */}
        <div className="flex gap-4 justify-center mt-6">
          <button onClick={prev} aria-label="Previous" className="w-12 h-12 rounded-full border border-gold/25 text-foreground/60 hover:text-gold hover:border-gold hover:bg-gold/5 transition flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={next} aria-label="Next" className="w-12 h-12 rounded-full border border-gold/25 text-foreground/60 hover:text-gold hover:border-gold hover:bg-gold/5 transition flex items-center justify-center">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <p className="text-center mt-4 text-[10px] font-utility uppercase tracking-[0.14em] text-muted-foreground/60">
          Click cards or use arrows to explore
        </p>
      </div>
    </section>
  );
};

export default ServicesSlider;
