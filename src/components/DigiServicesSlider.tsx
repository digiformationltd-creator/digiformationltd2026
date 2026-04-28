import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Hand } from "lucide-react";

type Service = {
  num: string;
  flag: string;
  category: string;
  title: string;
  desc: string;
  href: string;
};

const services: Service[] = [
  { num: "01", flag: "🇬🇧", category: "UK Formation", title: "UK LTD Company Formation", desc: "Register a UK Limited Company with Companies House. Fast, compliant, managed from anywhere in the world.", href: "/uk-services/uk-ltd-formation" },
  { num: "02", flag: "🪪", category: "UK Compliance", title: "LTD ID Verification", desc: "Companies House identity verification for directors & PSCs. Secure, fast, and fully DIATF compliant.", href: "/uk-services/ltd-id-verification" },
  { num: "03", flag: "📋", category: "UK Compliance", title: "Company Compliance Services", desc: "Name change, director updates, address change, SIC code, PSC, shareholders, confirmation statements & more.", href: "/uk-compliance/confirmation-statement" },
  { num: "04", flag: "🇺🇸", category: "USA Formation", title: "US LLC Formation", desc: "Register a US LLC remotely. Access PayPal, Stripe, Amazon, and the US market without being physically present.", href: "/usa-services/us-llc-formation" },
  { num: "05", flag: "🏦", category: "Banking", title: "Banks & Payment Solutions", desc: "Tide, Airwallex, Wise, Payoneer, Stripe, PayPal, WorldFirst, Sunrate, Zyla, Mollie, Wallester & more.", href: "/banks-payment-solutions/stripe" },
  { num: "06", flag: "📊", category: "UK Compliance", title: "Company Annual Filing", desc: "Confirmation statements, annual accounts filing and all statutory returns submitted to Companies House on time.", href: "/uk-services/company-annual-filing" },
  { num: "07", flag: "💻", category: "Technology", title: "Web Development", desc: "Professional websites, landing pages, and e-commerce solutions for your UK or US business — concept to launch.", href: "/web-development" },
  { num: "08", flag: "🔢", category: "USA Services", title: "EIN Number Registration", desc: "Get your US Employer Identification Number (EIN) from the IRS. Required for US business banking and tax compliance.", href: "/usa-services/ein-number" },
];

const total = services.length;
const angleStep = 360 / total;

type Dim = { radius: number; cardW: number; cardH: number; stageH: number };

const useDims = (): Dim => {
  const [d, setD] = useState<Dim>({ radius: 360, cardW: 260, cardH: 340, stageH: 420 });
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      if (w < 480)        setD({ radius: 220, cardW: 210, cardH: 300, stageH: 380 });
      else if (w < 640)   setD({ radius: 250, cardW: 230, cardH: 320, stageH: 400 });
      else if (w < 1024)  setD({ radius: 310, cardW: 250, cardH: 330, stageH: 410 });
      else                setD({ radius: 380, cardW: 270, cardH: 350, stageH: 430 });
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  return d;
};

const DigiServicesSlider = () => {
  const [active, setActive] = useState(0);
  const { radius, cardW, cardH, stageH } = useDims();
  const rotation = -active * angleStep;

  const dragRef = useRef<{ startX: number; startActive: number; moved: boolean } | null>(null);
  const [paused, setPaused] = useState(false);

  // Auto-rotate: advance one card every 4s, pause on hover/drag
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive((a) => (a + 1) % total), 4000);
    return () => clearInterval(id);
  }, [paused]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startActive: active, moved: false };
    setPaused(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    if (Math.abs(dx) > 6) dragRef.current.moved = true;
    const steps = Math.round(-dx / 90);
    const next = ((dragRef.current.startActive + steps) % total + total) % total;
    if (next !== active) setActive(next);
  };
  const onPointerUp = () => { dragRef.current = null; };

  const next = () => setActive((a) => (a + 1) % total);
  const prev = () => setActive((a) => (a - 1 + total) % total);

  // shortest signed delta from active for relative styling
  const relIndex = (idx: number) => {
    let d = idx - active;
    if (d > total / 2) d -= total;
    if (d < -total / 2) d += total;
    return d;
  };

  return (
    <section id="services" className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />
      <div className="absolute -right-32 top-1/4 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="h-px w-7 bg-primary" />
            <span className="text-xs uppercase tracking-[0.18em] font-semibold">Our Services</span>
            <span className="h-px w-7 bg-primary" />
          </div>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[0.95]">
            Everything Your<br />
            <em className="not-italic text-gradient">Business Needs</em>
          </h2>
        </div>

        <div
          className="relative max-w-6xl mx-auto select-none touch-pan-y cursor-grab active:cursor-grabbing"
          style={{ perspective: "1600px", height: stageH }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div
            className="relative w-full h-full"
            style={{
              transformStyle: "preserve-3d",
              transform: `translateZ(-${radius}px) rotateY(${rotation}deg)`,
              transition: "transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)",
            }}
          >
            {services.map((s, idx) => {
              const isActive = idx === active;
              const rel = Math.abs(relIndex(idx));
              const opacity = isActive ? 1 : rel === 1 ? 0.55 : rel === 2 ? 0.28 : 0.12;
              const scale = isActive ? 1 : 0.92;
              return (
                <article
                  key={s.num}
                  onClick={(e) => {
                    if (dragRef.current?.moved) { e.preventDefault(); return; }
                    setActive(idx);
                  }}
                  className={`absolute top-1/2 left-1/2 rounded-2xl p-5 md:p-6 glass flex flex-col ${
                    isActive ? "border-primary/45 shadow-glow" : "border-border/30"
                  }`}
                  style={{
                    width: cardW,
                    height: cardH,
                    marginLeft: -cardW / 2,
                    marginTop: -cardH / 2,
                    transform: `rotateY(${idx * angleStep}deg) translateZ(${radius}px) scale(${scale})`,
                    opacity,
                    transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.23,1,0.32,1), border-color 0.4s ease, box-shadow 0.4s ease",
                    backfaceVisibility: "hidden",
                  }}
                >
                  {isActive && (
                    <span className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent rounded-t-2xl" />
                  )}
                  <span className="absolute top-3 right-4 font-display font-bold text-4xl md:text-5xl text-primary/10 leading-none pointer-events-none">
                    {s.num}
                  </span>

                  <div className="text-3xl md:text-4xl mb-3">{s.flag}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-2 opacity-80">
                    {s.category}
                  </div>
                  <h3 className={`font-display text-lg md:text-xl font-semibold leading-tight mb-2 transition-colors ${isActive ? "text-gradient" : ""}`}>
                    {s.title}
                  </h3>
                  <p className="text-[12px] md:text-[13px] leading-relaxed flex-1 opacity-90 line-clamp-4">
                    {s.desc}
                  </p>

                  <Link
                    to={s.href}
                    onClick={(e) => { if (!isActive) e.preventDefault(); }}
                    className={`inline-flex items-center gap-2 mt-3 text-[11px] font-semibold uppercase tracking-[0.1em] hover:gap-3 transition-all ${
                      isActive ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                    style={{ transition: "opacity 0.4s ease 0.15s" }}
                  >
                    Explore Service →
                  </Link>
                </article>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 justify-center mt-8">
          {services.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === active ? "w-7 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"}`}
            />
          ))}
        </div>

        <div className="flex gap-4 justify-center mt-5">
          <button onClick={prev} aria-label="Previous" className="w-11 h-11 rounded-full border border-primary/25 grid place-items-center hover:text-primary hover:border-primary hover:bg-primary/5 transition opacity-80">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={next} aria-label="Next" className="w-11 h-11 rounded-full border border-primary/25 grid place-items-center hover:text-primary hover:border-primary hover:bg-primary/5 transition opacity-80">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-4 text-[10px] uppercase tracking-[0.14em] opacity-60 text-center flex items-center justify-center gap-2">
          <Hand className="w-3 h-3" /> Drag or use arrows to explore
        </p>
      </div>
    </section>
  );
};

export default DigiServicesSlider;
