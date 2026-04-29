import stripe from "@/assets/partners/stripe.svg";
import paypal from "@/assets/partners/paypal.svg";
import wise from "@/assets/partners/wise.svg";
import payoneer from "@/assets/partners/payoneer.svg";
import shopify from "@/assets/partners/shopify.svg";
import ebay from "@/assets/partners/ebay.svg";
import wallester from "@/assets/partners/wallester.png";
import zionpe from "@/assets/partners/zionpe.svg";
import companiesHouse from "@/assets/partners/companies-house-raw.jpeg";
import airwallex from "@/assets/partners/airwallex-raw.jpeg";
import tide from "@/assets/partners/tide-raw.png";
import hmrc from "@/assets/partners/hmrc-raw.jpeg";
import sunrate from "@/assets/partners/sunrate-raw.png";
import irs from "@/assets/partners/irs.png";
import worldfirst from "@/assets/partners/worldfirst.png";

type Partner = { name: string; logo?: string };

const partners: Partner[] = [
  { name: "Companies House", logo: companiesHouse },
  { name: "HMRC", logo: hmrc },
  { name: "IRS", logo: irs },
  { name: "Stripe", logo: stripe },
  { name: "PayPal", logo: paypal },
  { name: "Wise", logo: wise },
  { name: "Payoneer", logo: payoneer },
  { name: "Tide", logo: tide },
  { name: "Sunrate", logo: sunrate },
  { name: "WorldFirst", logo: worldfirst },
  { name: "eBay", logo: ebay },
  { name: "Shopify", logo: shopify },
  { name: "Airwallex", logo: airwallex },
  { name: "Wallester", logo: wallester },
  { name: "ZionPe", logo: zionpe },
];

const DigiTrustBar = () => {
  const loop = [...partners, ...partners];
  return (
    <section className="py-20 border-y border-border/60 bg-secondary/20 overflow-hidden relative">
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
                  loading="eager"
                  decoding="async"
                  fetchPriority={i < partners.length ? "high" : "low"}
                  className={`object-contain ${p.name === "WorldFirst" ? "h-24 w-[200px]" : "h-16 w-[150px]"}`}
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
