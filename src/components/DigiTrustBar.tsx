import stripe from "@/assets/partners/stripe.png";
import paypal from "@/assets/partners/paypal.png";
import wise from "@/assets/partners/wise.png";
import payoneer from "@/assets/partners/payoneer.png";
import shopify from "@/assets/partners/shopify.png";
import ebay from "@/assets/partners/ebay.svg";
import wallester from "@/assets/partners/wallester.png";
import zionpe from "@/assets/partners/zionpe.svg";
import companiesHouse from "@/assets/partners/companies-house.png";
import airwallex from "@/assets/partners/airwallex.png";
import tide from "@/assets/partners/tide.png";
import hmrc from "@/assets/partners/hmrc.png";
import sunrate from "@/assets/partners/sunrate.png";
import irs from "@/assets/partners/irs.png";
import worldfirst from "@/assets/partners/worldfirst.png";

type Partner = { name: string; logo?: string; whiten?: boolean };

const partners: Partner[] = [
  { name: "Companies House", logo: companiesHouse, whiten: true },
  { name: "HMRC", logo: hmrc, whiten: true },
  { name: "IRS", logo: irs, whiten: true },
  { name: "Stripe", logo: stripe },
  { name: "PayPal", logo: paypal },
  { name: "Wise", logo: wise, whiten: true },
  { name: "Payoneer", logo: payoneer, whiten: true },
  { name: "Tide", logo: tide, whiten: true },
  { name: "Sunrate", logo: sunrate, whiten: true },
  { name: "WorldFirst", logo: worldfirst, whiten: true },
  { name: "eBay", logo: ebay },
  { name: "Shopify", logo: shopify, whiten: true },
  { name: "Airwallex", logo: airwallex, whiten: true },
];

const DigiTrustBar = () => {
  const loop = [...partners, ...partners];
  return (
    <section className="py-12 border-y border-border/60 bg-secondary/20 overflow-hidden relative">
      <div className="container mx-auto px-4 mb-10 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-white">Trusted Partners & Official Integrations</p>
      </div>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        <div className="flex gap-6 animate-partner-slide" style={{ width: "max-content" }}>
          {loop.map((p, i) => (
            <div key={i} className="logo-card" title={p.name}>
              {p.logo ? (
                <img
                  src={p.logo}
                  alt={`${p.name} logo`}
                  loading="lazy"
                  className={`object-contain ${p.name === "WorldFirst" ? "h-24 w-[200px]" : "h-16 w-[150px]"}`}
                  style={p.whiten ? { filter: "brightness(0) invert(1)" } : undefined}
                />
              ) : (
                <span>{p.name}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DigiTrustBar;
