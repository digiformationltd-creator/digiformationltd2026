import earthMap from "@/assets/earth-map.jpg";

/**
 * GlowingEarth — realistic spinning earth using a world-map texture
 * masked into a sphere, with atmospheric glow + city-light glints.
 * Pure CSS animation, fully responsive.
 */
const GlowingEarth = () => {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-start sm:items-center justify-center overflow-hidden pt-52 sm:pt-0"
    >
      <div className="earth-wrap">
        {/* Outer atmospheric glow */}
        <div className="earth-halo" />

        {/* The sphere */}
        <div className="earth-sphere">
          {/* Rotating texture */}
          <div
            className="earth-texture"
            style={{ backgroundImage: `url(${earthMap})` }}
          />
          {/* City-light glints */}
          <div className="earth-lights" />
          {/* Spherical shading (lit side / dark side) */}
          <div className="earth-shade" />
          {/* Inner rim highlight */}
          <div className="earth-rim" />
        </div>

        {/* Soft outer atmosphere ring */}
        <div className="earth-atmosphere" />
      </div>

      <style>{`
        .earth-wrap {
          position: relative;
          width: clamp(300px, 58vw, 680px);
          aspect-ratio: 1 / 1;
          opacity: 0.35;
        }
        .earth-halo {
          position: absolute;
          inset: -22%;
          border-radius: 50%;
          background:
            radial-gradient(circle at 50% 50%,
              hsl(210 40% 60% / 0.14) 0%,
              hsl(210 30% 40% / 0.08) 35%,
              transparent 70%);
          filter: blur(50px);
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
            0 0 60px hsl(210 50% 60% / 0.15);
        }
        .earth-texture {
          position: absolute;
          top: 0;
          left: 0;
          width: 200%;
          height: 100%;
          background-repeat: repeat-x;
          background-size: 50% 100%;
          background-position: 0 center;
          animation: earth-spin 60s linear infinite;
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
          pointer-events: none;
        }
        .earth-rim {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          box-shadow:
            inset 0 0 2px hsl(210 80% 90% / 0.4),
            inset 4px 6px 30px hsl(210 70% 70% / 0.12);
          pointer-events: none;
        }
        .earth-atmosphere {
          display: none;
        }
        @keyframes earth-spin {
          from { background-position: 0 center; }
          to   { background-position: -100% center; }
        }
        @keyframes earth-pulse {
          0%, 100% { opacity: 0.9; transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.05); }
        }
        @keyframes earth-lights-pulse {
          0%, 100% { opacity: 0.6; }
          50%      { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .earth-texture, .earth-halo, .earth-lights { animation: none; }
        }
      `}</style>
    </div>
  );
};

export default GlowingEarth;
