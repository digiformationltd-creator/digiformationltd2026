import stripe from "@/assets/partners/stripe.svg";
import paypal from "@/assets/partners/paypal.svg";
import wise from "@/assets/partners/wise.svg";
import payoneer from "@/assets/partners/payoneer.svg";
import shopify from "@/assets/partners/shopify.svg";
import ebay from "@/assets/partners/ebay.svg";

type Partner = { name: string; logo?: string };

const partners: Partner[] = [
  { name: "Companies House" },
  { name: "IRS" },
  { name: "Stripe", logo: stripe },
  { name: "PayPal", logo: paypal },
  { name: "Wise", logo: wise },
  { name: "Payoneer", logo: payoneer },
  { name: "Tide" },
  { name: "Sunrate" },
  { name: "WorldFirst" },
  { name: "eBay", logo: ebay },
  { name: "Shopify", logo: shopify },
  { name: "Airwallex" },
  { name: "Zionpe" },
  { name: "Wallester" },
];

const DigiTrustBar = () => {
  const loop = [...partners, ...partners];
  return (
    <section className="py-20 border-y border-border/60 bg-secondary/20 overflow-hidden relative">
      <div className="container mx-auto px-4 mb-10 text-center">
        <p className="text-xs uppercase tracking-[0.18em]">Trusted Partners & Official Integrations</p>
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
                  className="max-h-9 max-w-[110px] w-auto h-auto object-contain opacity-90"
                  loading="lazy"
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
