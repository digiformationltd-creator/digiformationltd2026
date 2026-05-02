import earthMap from "@/assets/earth-map.jpg";

/**
 * GlowingEarth — slowly rotating earth with a soft halo.
 * Lightweight: pure CSS, no JS.
 */
const GlowingEarth = () => {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-start sm:items-center justify-center overflow-hidden pt-32 sm:pt-0 sm:translate-y-12 lg:translate-y-16"
    >
      <div className="earth-wrap">
        {/* Outer atmospheric glow (static) */}
        <div className="earth-halo" />

        {/* The sphere (still) */}
        <div className="earth-sphere">
          <div
            className="earth-texture"
            style={{ backgroundImage: `url(${earthMap})` }}
          />
          <div className="earth-shade" />
          <div className="earth-rim" />
        </div>
      </div>

      <style>{`
        .earth-wrap {
          position: relative;
          width: clamp(320px, 90vw, 420px);
          aspect-ratio: 1 / 1;
          opacity: 0.55;
        }
        @media (min-width: 640px) {
          .earth-wrap {
            width: clamp(260px, 46vw, 540px);
            opacity: 0.85;
          }
        }
        .earth-halo {
          position: absolute;
          inset: -22%;
          border-radius: 50%;
          background:
            radial-gradient(circle at 50% 50%,
              hsl(210 70% 65% / 0.22) 0%,
              hsl(210 50% 50% / 0.12) 35%,
              transparent 70%);
          filter: blur(40px);
        }
        .earth-sphere {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          overflow: hidden;
          background: radial-gradient(circle at 35% 30%,
            hsl(215 35% 28%) 0%,
            hsl(218 45% 14%) 60%,
            hsl(220 50% 6%) 100%);
          box-shadow:
            inset 0 0 80px hsl(220 50% 4% / 0.6),
            inset -30px -40px 100px hsl(220 60% 3% / 0.85),
            0 0 80px hsl(210 70% 65% / 0.30),
            0 0 160px hsl(210 70% 60% / 0.15);
        }
        .earth-texture {
          position: absolute;
          inset: 0;
          background-repeat: repeat-x;
          background-size: 200% 100%;
          background-position: 0% center;
          opacity: 0.92;
          mix-blend-mode: screen;
          filter: brightness(0.9) contrast(1.1) hue-rotate(-8deg);
          animation: earth-spin 60s linear infinite;
        }
        @keyframes earth-spin {
          from { background-position: 0% center; }
          to   { background-position: -200% center; }
        }
        @media (prefers-reduced-motion: reduce) {
          .earth-texture { animation: none; }
        }
        .earth-shade {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background:
            radial-gradient(circle at 28% 25%,
              hsl(210 80% 90% / 0.22) 0%,
              transparent 35%),
            radial-gradient(circle at 75% 80%,
              hsl(220 70% 3% / 0.7) 0%,
              transparent 55%);
        }
        .earth-rim {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          box-shadow:
            inset 0 0 2px hsl(210 80% 90% / 0.4),
            inset 4px 6px 30px hsl(210 70% 70% / 0.12);
        }
      `}</style>
    </div>
  );
};

export default GlowingEarth;
