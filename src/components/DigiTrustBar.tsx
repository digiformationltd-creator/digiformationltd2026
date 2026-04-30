import shopify from "@/assets/partners/shopify.png";
import companiesHouse from "@/assets/partners/companies-house.png";
import hmrc from "@/assets/partners/hmrc.png";
import paypal from "@/assets/partners/paypal.png";
import airwallex from "@/assets/partners/airwallex.png";
import stripe from "@/assets/partners/stripe.png";
import ebay from "@/assets/partners/ebay.png";
import wise from "@/assets/partners/wise.png";
import worldfirst from "@/assets/partners/worldfirst.png";
import tide from "@/assets/partners/tide.png";
import sunrate from "@/assets/partners/sunrate.png";
import irs from "@/assets/partners/irs.png";

const logos = [
  { src: companiesHouse, alt: "Companies House", size: "xl", id: "companies-house" },
  { src: hmrc, alt: "HM Revenue & Customs", size: "lg", id: "hmrc" },
  { src: irs, alt: "IRS", size: "md", id: "irs" },
  { src: paypal, alt: "PayPal", size: "xl", id: "paypal" },
  { src: stripe, alt: "Stripe", size: "md", id: "stripe" },
  { src: wise, alt: "Wise", size: "lg", id: "wise" },
  { src: worldfirst, alt: "WorldFirst", size: "xl", id: "worldfirst" },
  { src: airwallex, alt: "Airwallex", size: "xl", id: "airwallex" },
  { src: tide, alt: "Tide", size: "md", id: "tide" },
  { src: sunrate, alt: "Sunrate", size: "xl", id: "sunrate" },
  { src: shopify, alt: "Shopify", size: "md", id: "shopify" },
  { src: ebay, alt: "eBay", size: "md", id: "ebay" },
];

const DigiTrustBar = () => {
  const loop = [...logos, ...logos];
  return (
    <section className="relative py-12 md:py-16 overflow-hidden border-y border-border/30">
      <div className="container mx-auto px-4 mb-8 text-center">
        <div className="mb-4 text-sm md:text-base uppercase tracking-[0.18em] font-semibold text-primary">Trusted Network</div>
        <h2 className="text-4xl md:text-5xl font-bold leading-tight">
          Trusted Partners &amp; <em className="not-italic text-gradient">Official Integrations</em>
        </h2>
      </div>

      <div className="trust-strip">
        <div className="trust-track">
          {loop.map((l, i) => (
            <div className={`trust-slot trust-slot-${l.size}`} data-logo={l.id} key={i}>
              <img src={l.src} alt={l.alt} loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DigiTrustBar;
