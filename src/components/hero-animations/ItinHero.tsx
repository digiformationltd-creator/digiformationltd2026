import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * ITIN hero: a wireframe globe rotates, zooms into USA, an ITIN number
 * generates digit by digit. Idle loop: globe continues slow rotation.
 */
const TARGET_ITIN = "9XX-7X-1234";

const ItinHero = () => {
  const reduce = useReducedMotion();
  const [itin, setItin] = useState(reduce ? TARGET_ITIN : "•••-••-••••");

  useEffect(() => {
    if (reduce) return;
    const start = setTimeout(() => {
      let i = 0;
      const t = setInterval(() => {
        i += 1;
        const visible = TARGET_ITIN.slice(0, i);
        const hidden = TARGET_ITIN.slice(i).replace(/[0-9X]/g, "•");
        setItin(visible + hidden);
        if (i >= TARGET_ITIN.length) clearInterval(t);
      }, 90);
    }, 1100);
    return () => clearTimeout(start);
  }, [reduce]);

  return (
    <div
      role="img"
      aria-label="Animated globe zooming to USA and issuing an ITIN number"
      className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden glass shadow-elegant"
      style={{ background: "radial-gradient(ellipse at center, hsl(190 60% 10%) 0%, hsl(220 60% 5%) 75%)" }}
    >
      {/* Globe */}
      <motion.svg
        viewBox="0 0 200 200"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] aspect-square opacity-80"
        initial={reduce ? false : { scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.85 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        <defs>
          <radialGradient id="globeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(180 80% 50%)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="hsl(180 80% 50%)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="95" fill="url(#globeGlow)" />
        <circle cx="100" cy="100" r="80" fill="none" stroke="hsl(180 70% 60%)" strokeWidth="0.6" opacity="0.7" />
        {/* Meridians */}
        <motion.g
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "100px 100px" }}
        >
          {[0, 30, 60, 90, 120, 150].map((angle) => (
            <ellipse
              key={angle}
              cx="100"
              cy="100"
              rx="80"
              ry="30"
              fill="none"
              stroke="hsl(180 70% 55%)"
              strokeWidth="0.5"
              opacity="0.5"
              transform={`rotate(${angle} 100 100)`}
            />
          ))}
        </motion.g>
        {/* Parallels */}
        {[20, 45, 70].map((ry) => (
          <ellipse key={ry} cx="100" cy="100" rx="80" ry={ry} fill="none" stroke="hsl(180 70% 55%)" strokeWidth="0.4" opacity="0.4" />
        ))}
        {/* USA pin */}
        <motion.g
          initial={reduce ? false : { opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1, type: "spring", stiffness: 220, damping: 14 }}
        >
          <circle cx="72" cy="86" r="5" fill="hsl(0 80% 60%)" />
          <motion.circle
            cx="72"
            cy="86"
            r="5"
            fill="none"
            stroke="hsl(0 80% 60%)"
            strokeWidth="2"
            animate={reduce ? undefined : { r: [5, 14], opacity: [0.8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
        </motion.g>
      </motion.svg>

      {/* ITIN card */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="absolute left-1/2 bottom-[12%] -translate-x-1/2 w-[78%] sm:w-[60%] rounded-xl p-3 sm:p-4 border border-cyan-400/30 backdrop-blur-md"
        style={{ background: "rgba(8, 26, 38, 0.7)" }}
      >
        <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-cyan-300/80">Individual Taxpayer Identification</div>
        <div className="mt-1 font-mono text-xl sm:text-2xl font-bold tracking-[0.2em] text-white tabular-nums">{itin}</div>
        <div className="mt-1 text-[10px] sm:text-xs text-emerald-400/90 font-medium">Issued · IRS</div>
      </motion.div>
    </div>
  );
};

export default ItinHero;
