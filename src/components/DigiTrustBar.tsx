import { Link } from "react-router-dom";
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

type Logo = {
  src: string;
  alt: string;
  size: "md" | "lg" | "xl";
  id: string;
  href?: string;
  glow?: string; // brand-color hsl for hover glow
};

const logos: Logo[] = [
  { src: companiesHouse, alt: "Companies House", size: "xl", id: "companies-house" },
  { src: hmrc, alt: "HM Revenue & Customs", size: "lg", id: "hmrc" },
  { src: irs, alt: "IRS", size: "md", id: "irs" },
  { src: paypal, alt: "PayPal", size: "xl", id: "paypal", href: "/banks-payment-solutions/paypal", glow: "210 100% 28%" },
  { src: stripe, alt: "Stripe", size: "md", id: "stripe", href: "/banks-payment-solutions/stripe", glow: "245 100% 67%" },
  { src: wise, alt: "Wise", size: "lg", id: "wise", href: "/banks-payment-solutions/wise", glow: "92 75% 60%" },
  { src: worldfirst, alt: "WorldFirst", size: "xl", id: "worldfirst", href: "/banks-payment-solutions/worldfirst", glow: "356 95% 45%" },
  { src: airwallex, alt: "Airwallex", size: "xl", id: "airwallex", href: "/banks-payment-solutions/airwallex", glow: "215 90% 53%" },
  { src: tide, alt: "Tide", size: "md", id: "tide", href: "/banks-payment-solutions/tide", glow: "44 92% 62%" },
  { src: sunrate, alt: "Sunrate", size: "xl", id: "sunrate", href: "/banks-payment-solutions/sunrate", glow: "200 90% 55%" },
  { src: shopify, alt: "Shopify", size: "md", id: "shopify", glow: "120 50% 45%" },
  { src: ebay, alt: "eBay", size: "md", id: "ebay", glow: "0 85% 55%" },
];

const DigiTrustBar = () => {
  const loop = [...logos, ...logos];
  return (
    <section className="relative py-12 md:py-16 overflow-hidden border-y border-border/30">
      <div className="container mx-auto px-4 mb-8 text-center">
        <div className="mb-4 text-sm md:text-base uppercase tracking-[0.18em] font-semibold text-primary">Trusted Network</div>
        <h2 data-reveal="rise" className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
          Our Banking &amp; <em className="not-italic text-gradient">Official Partners</em>
        </h2>
      </div>

      <div className="trust-strip">
        <div className="trust-track">
          {loop.map((l, i) => {
            const inner = (
              <div
                className={`trust-slot trust-slot-${l.size} group transition-transform duration-300 will-change-transform hover:-translate-y-1`}
                data-logo={l.id}
                style={l.glow ? ({ ["--brand-glow" as string]: `hsl(${l.glow} / 0.55)` } as React.CSSProperties) : undefined}
              >
                <img
                  src={l.src}
                  alt={l.alt}
                  loading="lazy"
                  className="transition-[filter] duration-300 group-hover:[filter:drop-shadow(0_6px_18px_var(--brand-glow,rgba(255,255,255,0.25)))]"
                />
              </div>
            );
            return l.href ? (
              <Link key={i} to={l.href} aria-label={l.alt}>
                {inner}
              </Link>
            ) : (
              <div key={i}>{inner}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default DigiTrustBar;
