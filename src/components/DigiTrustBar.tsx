import shopify from "@/assets/partners/shopify.png";
import companiesHouse from "@/assets/partners/companies-house.png";
import hmrc from "@/assets/partners/hmrc.png";
import paypal from "@/assets/partners/paypal.png";
import airwallex from "@/assets/partners/airwallex.png";
import stripe from "@/assets/partners/stripe.png";
import ebay from "@/assets/partners/ebay.png";
import wise from "@/assets/partners/wise.png";
import payoneer from "@/assets/partners/payoneer.png";

const logos = [
  { src: companiesHouse, alt: "Companies House" },
  { src: hmrc, alt: "HM Revenue & Customs" },
  { src: paypal, alt: "PayPal" },
  { src: stripe, alt: "Stripe" },
  { src: payoneer, alt: "Payoneer" },
  { src: wise, alt: "Wise" },
  { src: airwallex, alt: "Airwallex" },
  { src: shopify, alt: "Shopify" },
  { src: ebay, alt: "eBay" },
];

const DigiTrustBar = () => {
  const loop = [...logos, ...logos];
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

      <div className="trust-strip">
        <div className="trust-track">
          {loop.map((l, i) => (
            <div className="trust-slot" key={i}>
              <img src={l.src} alt={l.alt} loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DigiTrustBar;
