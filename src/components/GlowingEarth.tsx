/**
 * GlowingEarth — pure CSS rotating transparent glowing globe.
 * Sits behind the hero headline. Theme-matched silver/grey glow.
 * Fully responsive (scales with viewport).
 */
const GlowingEarth = () => {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
    >
      <div className="earth-wrap">
        <div className="earth-glow" />
        <div className="earth-sphere">
          <div className="earth-map" />
          <div className="earth-shading" />
          <div className="earth-atmosphere" />
        </div>
      </div>

      <style>{`
        .earth-wrap {
          position: relative;
          width: clamp(280px, 55vw, 620px);
          height: clamp(280px, 55vw, 620px);
          opacity: 0.55;
        }
        .earth-glow {
          position: absolute;
          inset: -18%;
          border-radius: 50%;
          background:
            radial-gradient(circle at 50% 50%,
              hsl(220 30% 80% / 0.35) 0%,
              hsl(220 20% 60% / 0.18) 35%,
              transparent 70%);
          filter: blur(30px);
          animation: earth-pulse 6s ease-in-out infinite;
        }
        .earth-sphere {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          overflow: hidden;
          background:
            radial-gradient(circle at 30% 30%,
              hsl(220 25% 35% / 0.55) 0%,
              hsl(220 30% 18% / 0.65) 55%,
              hsl(220 40% 8% / 0.75) 100%);
          box-shadow:
            inset 0 0 60px hsl(220 30% 70% / 0.25),
            inset -20px -30px 80px hsl(220 60% 4% / 0.7),
            0 0 80px hsl(220 25% 70% / 0.18);
          backdrop-filter: blur(2px);
        }
        .earth-map {
          position: absolute;
          top: 0;
          left: 0;
          width: 200%;
          height: 100%;
          background-image:
            radial-gradient(ellipse 8% 14% at 12% 35%, hsl(220 15% 80% / 0.45), transparent 60%),
            radial-gradient(ellipse 6% 10% at 22% 55%, hsl(220 15% 80% / 0.4), transparent 60%),
            radial-gradient(ellipse 10% 16% at 35% 30%, hsl(220 15% 80% / 0.45), transparent 60%),
            radial-gradient(ellipse 7% 12% at 42% 60%, hsl(220 15% 80% / 0.4), transparent 60%),
            radial-gradient(ellipse 9% 14% at 55% 38%, hsl(220 15% 80% / 0.45), transparent 60%),
            radial-gradient(ellipse 6% 10% at 65% 65%, hsl(220 15% 80% / 0.35), transparent 60%),
            radial-gradient(ellipse 11% 18% at 78% 32%, hsl(220 15% 80% / 0.45), transparent 60%),
            radial-gradient(ellipse 7% 11% at 88% 58%, hsl(220 15% 80% / 0.4), transparent 60%),
            /* repeat for seamless loop */
            radial-gradient(ellipse 8% 14% at 62% 35%, hsl(220 15% 80% / 0.45), transparent 60%),
            radial-gradient(ellipse 6% 10% at 72% 55%, hsl(220 15% 80% / 0.4), transparent 60%),
            radial-gradient(ellipse 10% 16% at 85% 30%, hsl(220 15% 80% / 0.45), transparent 60%);
          animation: earth-spin 40s linear infinite;
          mix-blend-mode: screen;
          opacity: 0.85;
        }
        .earth-shading {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background:
            radial-gradient(circle at 30% 30%,
              hsl(220 30% 95% / 0.18) 0%,
              transparent 40%),
            radial-gradient(circle at 70% 75%,
              hsl(220 60% 4% / 0.55) 0%,
              transparent 50%);
          pointer-events: none;
        }
        .earth-atmosphere {
          position: absolute;
          inset: -3%;
          border-radius: 50%;
          background: radial-gradient(circle,
            transparent 62%,
            hsl(220 40% 75% / 0.18) 70%,
            hsl(220 40% 75% / 0.08) 80%,
            transparent 92%);
          pointer-events: none;
        }
        @keyframes earth-spin {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes earth-pulse {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }
        @media (prefers-reduced-motion: reduce) {
          .earth-map, .earth-glow { animation: none; }
        }
      `}</style>
    </div>
  );
};

export default GlowingEarth;
