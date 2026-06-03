import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * EIN hero: IRS-styled form fills in, then a 9-digit EIN counts up
 * and an "Approved" badge stamps in. Idle loop: EIN number gold glow.
 */
const TARGET_EIN = "92-4738156";

const fields = [
  { label: "Legal name", value: "DIGIFORMATION LLC" },
  { label: "Entity type", value: "Limited Liability Company" },
  { label: "State", value: "Wyoming" },
];

const EinHero = () => {
  const reduce = useReducedMotion();
  const [ein, setEin] = useState(reduce ? TARGET_EIN : "—— ———");

  useEffect(() => {
    if (reduce) return;
    const start = setTimeout(() => {
      let frame = 0;
      const total = 30;
      const t = setInterval(() => {
        frame += 1;
        if (frame >= total) {
          setEin(TARGET_EIN);
          clearInterval(t);
          return;
        }
        const rnd = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join("");
        setEin(`${rnd.slice(0, 2)}-${rnd.slice(2)}`);
      }, 40);
    }, 900);
    return () => clearTimeout(start);
  }, [reduce]);

  return (
    <div
      role="img"
      aria-label="Animated IRS form filling in and generating an EIN number"
      className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden glass shadow-elegant"
      style={{ background: "radial-gradient(ellipse at top, hsl(215 60% 14%) 0%, hsl(220 60% 6%) 70%)" }}
    >
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute inset-[8%] rounded-xl bg-white shadow-2xl overflow-hidden"
      >
        {/* IRS header bar */}
        <div className="h-9 bg-[#0a3161] flex items-center px-4 justify-between">
          <div className="text-white font-bold text-sm tracking-wider">IRS · Form SS-4</div>
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-3 text-[#0a3161]">
          {fields.map((f, i) => (
            <motion.div
              key={f.label}
              initial={reduce ? false : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.2, duration: 0.35 }}
              className="border-b border-[#0a3161]/15 pb-1.5"
            >
              <div className="text-[8px] sm:text-[10px] uppercase tracking-wider opacity-60">{f.label}</div>
              <div className="text-xs sm:text-sm font-semibold">{f.value}</div>
            </motion.div>
          ))}

          {/* Progress bar */}
          <div className="pt-1">
            <div className="h-1.5 bg-[#0a3161]/10 rounded-full overflow-hidden">
              <motion.div
                initial={reduce ? false : { width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.4, duration: 1.4, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-500 to-[#0a3161]"
              />
            </div>
          </div>

          {/* EIN display */}
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.0, duration: 0.4 }}
            className="mt-2 p-3 rounded-lg border border-amber-500/30 bg-amber-50"
          >
            <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[#0a3161]/70">Employer Identification Number</div>
            <motion.div
              animate={reduce ? undefined : { textShadow: ["0 0 0px rgba(212,167,44,0)", "0 0 12px rgba(212,167,44,0.6)", "0 0 0px rgba(212,167,44,0)"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="mt-1 font-mono text-2xl sm:text-3xl font-bold tracking-[0.18em] text-[#0a3161] tabular-nums"
            >
              {ein}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Approved stamp */}
      <motion.div
        initial={reduce ? false : { scale: 0, rotate: -20, opacity: 0 }}
        animate={{ scale: 1, rotate: -8, opacity: 1 }}
        transition={{ delay: 1.5, type: "spring", stiffness: 260, damping: 14 }}
        className="absolute top-[18%] right-[10%] px-3 py-1.5 rounded-md border-2 border-emerald-500 text-emerald-600 font-bold tracking-widest text-xs sm:text-sm bg-white/90"
        style={{ boxShadow: "0 4px 14px rgba(16,185,129,0.35)" }}
      >
        APPROVED ✓
      </motion.div>
    </div>
  );
};

export default EinHero;
