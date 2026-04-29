import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  alt: string;
  /** Card background as "#rrggbb". Used to decide if logo needs inversion. */
  cardBg?: string;
  className?: string;
};

/** Parse "#rrggbb" → [r,g,b] */
const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const n = h.length === 3
    ? h.split("").map((c) => c + c).join("")
    : h.padEnd(6, "0");
  return [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16),
  ];
};

/** Relative luminance per WCAG. */
const luminance = (r: number, g: number, b: number) => {
  const a = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
};

const contrastRatio = (l1: number, l2: number) => {
  const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (a + 0.05) / (b + 0.05);
};

type Mode = "normal" | "invert";

/**
 * Samples opaque pixels of the logo, computes their average luminance,
 * and compares to the card background. If contrast is low, inverts the logo.
 * Falls back to "normal" on cross-origin/decoding errors.
 */
const AdaptiveLogo = ({ src, alt, cardBg = "#ffffff", className }: Props) => {
  const [mode, setMode] = useState<Mode>("normal");
  const cacheKey = useRef<string>("");

  useEffect(() => {
    const key = `${src}|${cardBg}`;
    if (cacheKey.current === key) return;
    cacheKey.current = key;

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";

    img.onload = () => {
      if (cancelled) return;
      try {
        const W = 32;
        const H = Math.max(1, Math.round((img.height / img.width) * W) || 32);
        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, W, H);
        const { data } = ctx.getImageData(0, 0, W, H);

        let lumSum = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 32) continue; // skip transparent
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // skip near-background pixels (e.g. white halo on white card)
          const [br, bg, bb] = hexToRgb(cardBg);
          const dist = Math.abs(r - br) + Math.abs(g - bg) + Math.abs(b - bb);
          if (dist < 24) continue;
          lumSum += luminance(r, g, b);
          count++;
        }
        if (count < 8) return; // not enough info → keep normal

        const logoLum = lumSum / count;
        const [br, bg, bb] = hexToRgb(cardBg);
        const bgLum = luminance(br, bg, bb);
        const ratio = contrastRatio(logoLum, bgLum);

        // WCAG-ish threshold: anything below 2.5 is hard to read on the card
        if (ratio < 2.5) setMode("invert");
        else setMode("normal");
      } catch {
        // tainted canvas or other failure → leave as-is
      }
    };

    img.onerror = () => {
      /* leave default */
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src, cardBg]);

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      style={mode === "invert" ? { filter: "invert(1) hue-rotate(180deg)" } : undefined}
    />
  );
};

export default AdaptiveLogo;
