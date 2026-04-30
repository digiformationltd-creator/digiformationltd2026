import earthMap from "@/assets/earth-map.jpg";

/**
 * GlowingEarth — single still earth with soft glow and emanating light rays.
 */
const GlowingEarth = () => {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-start sm:items-center justify-center overflow-hidden pt-32 sm:pt-0"
    >
      <div className="earth-wrap">
        {/* Emanating light rays */}
        <div className="earth-rays" />
        {/* Outer atmospheric glow */}
        <div className="earth-halo" />

        {/* The sphere (still) */}
        <div className="earth-sphere">
          <div
            className="earth-texture"
            style={{ backgroundImage: `url(${earthMap})` }}
          />
          <div className="earth-lights" />
          <div className="earth-shade" />
          <div className="earth-rim" />
        </div>
      </div>

      <style>{`
        .earth-wrap {
          position: relative;
          width: clamp(250px, 72vw, 300px);
          aspect-ratio: 1 / 1;
          opacity: 0.55;
        }
        @media (min-width: 640px) {
          .earth-wrap {
            width: clamp(300px, 58vw, 680px);
          }
        }
        .earth-rays {
          position: absolute;
          inset: -60%;
          border-radius: 50%;
          background:
            conic-gradient(
              from 0deg,
              transparent 0deg,
              hsl(200 90% 70% / 0.10) 8deg,
              transparent 16deg,
              transparent 40deg,
              hsl(210 90% 75% / 0.08) 50deg,
              transparent 60deg,
              transparent 95deg,
              hsl(195 90% 70% / 0.10) 105deg,
              transparent 115deg,
              transparent 150deg,
              hsl(205 90% 75% / 0.08) 160deg,
              transparent 170deg,
              transparent 210deg,
              hsl(200 90% 70% / 0.10) 220deg,
              transparent 230deg,
              transparent 270deg,
              hsl(210 90% 75% / 0.09) 280deg,
              transparent 290deg,
              transparent 320deg,
              hsl(195 90% 70% / 0.10) 330deg,
              transparent 340deg
            );
          filter: blur(2px);
          mask-image: radial-gradient(circle, transparent 28%, black 36%, black 70%, transparent 92%);
          -webkit-mask-image: radial-gradient(circle, transparent 28%, black 36%, black 70%, transparent 92%);
          animation: earth-rays-pulse 6s ease-in-out infinite;
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
          animation: earth-pulse 7s ease-in-out infinite;
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
          background-repeat: no-repeat;
          background-size: 200% 100%;
          background-position: 25% center;
          opacity: 0.92;
          mix-blend-mode: screen;
          filter: brightness(0.9) contrast(1.1) hue-rotate(-8deg);
        }
        .earth-lights {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(1.5px 1.5px at 22% 38%, hsl(45 100% 75% / 0.9), transparent 60%),
            radial-gradient(1px 1px at 28% 42%, hsl(45 100% 75% / 0.7), transparent 60%),
            radial-gradient(1.5px 1.5px at 48% 35%, hsl(45 100% 75% / 0.8), transparent 60%),
            radial-gradient(1px 1px at 52% 40%, hsl(45 100% 75% / 0.6), transparent 60%),
            radial-gradient(1.5px 1.5px at 68% 45%, hsl(45 100% 75% / 0.85), transparent 60%),
            radial-gradient(1px 1px at 72% 48%, hsl(45 100% 75% / 0.5), transparent 60%),
            radial-gradient(1.5px 1.5px at 78% 38%, hsl(45 100% 75% / 0.75), transparent 60%);
          animation: earth-lights-pulse 4s ease-in-out infinite;
          mix-blend-mode: screen;
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
        @keyframes earth-pulse {
          0%, 100% { opacity: 0.9; transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.04); }
        }
        @keyframes earth-lights-pulse {
          0%, 100% { opacity: 0.6; }
          50%      { opacity: 1; }
        }
        @keyframes earth-rays-pulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.06); }
        }
        @media (prefers-reduced-motion: reduce) {
          .earth-halo, .earth-lights, .earth-rays { animation: none; }
        }
      `}</style>
    </div>
  );
};

export default GlowingEarth;
