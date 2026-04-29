import { useEffect, useRef, useState } from "react";
import premiumFintech from "@/assets/premium-fintech.jpg";

const stats = [
  { value: 300, suffix: "+", label: "Companies Registered (UK & US)" },
  { value: 24, suffix: "/7", label: "Global Support for Entrepreneurs" },
  { value: 14, suffix: "+", label: "Banking & Payment Partners" },
  { value: 98, suffix: "%", label: "Client Retention Rate" },
];

const useCountUp = (end: number, duration = 1800) => {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(Math.round(end * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [end, duration]);
  return { val, ref };
};

const StatItem = ({ value, suffix, label, isFirst }: { value: number; suffix: string; label: string; isFirst: boolean }) => {
  const { val, ref } = useCountUp(value);
  return (
    <div ref={ref} className={`text-center md:text-left ${!isFirst ? "md:border-l md:border-border md:pl-10" : ""}`}>
      <div className="text-4xl md:text-6xl font-bold text-gradient font-display mb-2">
        {val}{suffix}
      </div>
      <div className="text-xs uppercase tracking-widest">{label}</div>
    </div>
  );
};

const DigiStats = () => (
  <section className="relative py-24 border-y border-border bg-secondary/30 overflow-hidden">
    {/* Premium background imagery */}
    <div
      aria-hidden
      className="absolute inset-0 bg-cover bg-center opacity-40 pointer-events-none"
      style={{ backgroundImage: `url(${premiumFintech})` }}
    />
    <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80 pointer-events-none" />

    <div className="container mx-auto px-4 relative z-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
        {stats.map((s, i) => (
          <StatItem key={s.label} {...s} isFirst={i === 0} />
        ))}
      </div>
    </div>
  </section>
);

export default DigiStats;
