import AdaptiveLogo from "@/components/AdaptiveLogo";
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
  { name: "ZionPe", logo: zionpe },
  { name: "Wallester", logo: wallester },
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
                <AdaptiveLogo
                  src={p.logo}
                  alt={`${p.name} logo`}
                  cardBg="#000000"
                  className="max-h-12 max-w-[130px] w-auto h-auto object-contain"
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
