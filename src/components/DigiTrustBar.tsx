import airwallex from "@/assets/partners/airwallex.png";
import ebay from "@/assets/partners/ebay.png";
import wise from "@/assets/partners/wise.png";
import payoneer from "@/assets/partners/payoneer.png";
import tide from "@/assets/partners/tide.png";
import worldfirst from "@/assets/partners/worldfirst.png";
import sunrate from "@/assets/partners/sunrate.png";
import zyla from "@/assets/partners/zyla.png";
import irs from "@/assets/partners/irs.png";

type Partner = { name: string; src: string };

const partners: Partner[] = [
  { name: "Airwallex", src: airwallex },
  { name: "Wise", src: wise },
  { name: "Payoneer", src: payoneer },
  { name: "Tide", src: tide },
  { name: "WorldFirst", src: worldfirst },
  { name: "Sunrate", src: sunrate },
  { name: "Zyla", src: zyla },
  { name: "eBay", src: ebay },
  { name: "IRS", src: irs },
];

// Duplicate for seamless marquee loop
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
                <img
                  src={p.src}
                  alt={`${p.name} logo`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DigiTrustBar;
