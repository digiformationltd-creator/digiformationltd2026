type Partner = {
  name: string;
  // Brand color for the logo text/mark
  color: string;
  // Optional: small mark/icon SVG path data (rendered before name)
  mark?: React.ReactNode;
  // Font style for the wordmark
  fontFamily?: string;
  fontWeight?: number;
  italic?: boolean;
  uppercase?: boolean;
  tracking?: string;
};

const partners: Partner[] = [
  {
    name: "Airwallex",
    color: "#FF5E3A",
    fontWeight: 700,
    mark: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
        <path
          d="M4 20 L12 4 L20 20 M7 14 L17 14"
          stroke="url(#aw)"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="aw" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FF8A5C" />
            <stop offset="1" stopColor="#FF3D1F" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    name: "wise",
    color: "#9FE870",
    fontWeight: 800,
    italic: true,
    mark: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
        <path d="M3 5 L14 5 L8 13 L18 13 L4 19 Z" fill="#9FE870" />
      </svg>
    ),
  },
  {
    name: "Payoneer",
    color: "#FFFFFF",
    fontWeight: 600,
    mark: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
        <defs>
          <linearGradient id="po" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FF7A00" />
            <stop offset="0.5" stopColor="#E91E63" />
            <stop offset="1" stopColor="#3F51B5" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="9" stroke="url(#po)" strokeWidth="3" fill="none" />
      </svg>
    ),
  },
  {
    name: "tide",
    color: "#3F2DEB",
    fontWeight: 700,
    mark: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="#3F2DEB" strokeWidth="2.5" fill="none" />
        <path d="M7 13 Q10 16 13 13 T19 13" stroke="#3F2DEB" strokeWidth="2" fill="none" />
      </svg>
    ),
  },
  {
    name: "WorldFirst",
    color: "#FF1F5A",
    fontWeight: 800,
  },
  {
    name: "SUNRATE",
    color: "#FFFFFF",
    fontWeight: 800,
    italic: true,
    uppercase: true,
    tracking: "0.04em",
    mark: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
        <path d="M4 12 L10 7 L10 17 Z M12 12 L18 7 L18 17 Z" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    name: "zyla",
    color: "#FFFFFF",
    fontWeight: 700,
    mark: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
        <defs>
          <linearGradient id="zy" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5B8DEF" />
            <stop offset="1" stopColor="#A24BFF" />
          </linearGradient>
        </defs>
        <path
          d="M5 8 Q5 5 8 5 Q11 5 11 8 L11 16 Q11 19 14 19 Q17 19 17 16 Q17 13 14 13 L10 13"
          stroke="url(#zy)"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    name: "ebay",
    color: "#E53238",
    fontWeight: 800,
    italic: true,
    // ebay multi-color is rendered with per-letter spans below
  },
  {
    name: "IRS",
    color: "#FFFFFF",
    fontWeight: 800,
    tracking: "0.05em",
  },
  {
    name: "Stripe",
    color: "#635BFF",
    fontWeight: 800,
    italic: true,
  },
  {
    name: "PayPal",
    color: "#FFFFFF",
    fontWeight: 800,
    italic: true,
  },
];

// eBay needs multi-color letters
const renderName = (p: Partner) => {
  if (p.name === "ebay") {
    const letters = [
      { c: "e", color: "#E53238" },
      { c: "b", color: "#0064D2" },
      { c: "a", color: "#F5AF02" },
      { c: "y", color: "#86B817" },
    ];
    return (
      <span className="italic font-extrabold">
        {letters.map((l, i) => (
          <span key={i} style={{ color: l.color }}>
            {l.c}
          </span>
        ))}
      </span>
    );
  }
  if (p.name === "PayPal") {
    return (
      <span className="italic font-extrabold">
        <span style={{ color: "#003087" }}>Pay</span>
        <span style={{ color: "#009CDE" }}>Pal</span>
      </span>
    );
  }
  return (
    <span
      style={{
        color: p.color,
        fontWeight: p.fontWeight ?? 700,
        fontStyle: p.italic ? "italic" : "normal",
        textTransform: p.uppercase ? "uppercase" : "none",
        letterSpacing: p.tracking ?? "normal",
      }}
    >
      {p.name}
    </span>
  );
};

const loop = [...partners, ...partners];

const DigiTrustBar = () => {
  return (
    <section className="relative py-12 md:py-16 overflow-hidden border-y border-border/30">
      <div className="container mx-auto px-4 mb-8 text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <span className="h-px w-7 bg-primary" />
          <span className="text-xs uppercase tracking-[0.18em] font-semibold">Trusted Network</span>
          <span className="h-px w-7 bg-primary" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold leading-tight">
          Trusted Partners &amp; <em className="not-italic text-gradient">Official Integrations</em>
        </h2>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-background to-transparent" />

        <div className="trust-marquee">
          <div className="trust-track">
            {loop.map((p, i) => (
              <div key={`${p.name}-${i}`} className="trust-card">
                {p.mark && <span className="trust-mark">{p.mark}</span>}
                <span className="trust-name">{renderName(p)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DigiTrustBar;
