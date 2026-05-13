import { Link } from "react-router-dom";
import heroUkLtd from "@/assets/card-hero-uk-ltd.jpg";
import heroUsLlc from "@/assets/card-hero-us-llc.jpg";
import heroBanking from "@/assets/card-hero-banking.jpg";
import heroPayments from "@/assets/card-hero-payments.jpg";
import heroWeb from "@/assets/card-hero-web.jpg";
import heroTax from "@/assets/card-hero-tax.jpg";


const items = [
  {
    tag: "UK",
    title: "UK LTD Formation",
    desc: "Establish your UK Limited Company with Companies House, including UTR, Registered Office, and full compliance support.",
    cta: "Learn more",
    href: "/uk-services/uk-ltd-formation",
    image: heroUkLtd,
  },
  {
    tag: "USA",
    title: "US LLC Formation",
    desc: "Start a compliant US LLC in any state, complete with EIN, ITIN (if applicable), registered agent, and BOI report.",
    cta: "Learn more",
    href: "/usa-services/us-llc-formation",
    image: heroUsLlc,
  },
  {
    tag: "TAX",
    title: "Tax & Compliance",
    desc: "UTR, EIN, ITIN, VAT registration, BOI reports and annual filings — all handled by our specialists.",
    cta: "Learn more",
    href: "/uk-services/utr-codes",
    image: heroTax,
  },
  {
    tag: "BANK",
    title: "Business Banking",
    desc: "Activate multi-currency business accounts with Tide, Sunrate, WorldFirst, Wise, and more — fast and fully verified.",
    cta: "Learn more",
    href: "/banks-payment-solutions/tide",
    image: heroBanking,
  },
  {
    tag: "PAY",
    title: "Payment Gateway Setup",
    desc: "Start accepting payments worldwide using Stripe, PayPal, and Mollie. Verified merchant accounts ready for your business.",
    cta: "Learn more",
    href: "/banks-payment-solutions/stripe",
    image: heroPayments,
  },
  {
    tag: "WEB",
    title: "Web Development",
    desc: "Establish your online presence with custom websites and landing pages, fully SEO-ready and business-ready.",
    cta: "Learn more",
    href: "/web-development",
    image: heroWeb,
  },
];

const DigiServices = () => (
  <section className="py-14 md:py-10 relative overflow-hidden">
    <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />
    <div className="container mx-auto px-4 relative z-10">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="mb-5 text-sm md:text-base uppercase tracking-[0.18em] font-semibold text-primary">Services Overview</div>
        <h2 data-reveal="rise" className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
          Everything to launch &amp; run your <em className="not-italic text-gradient">global business</em>
        </h2>
        <p className="text-lg mt-5 opacity-90">
          From day-one formation to year-round compliance — every service you need to operate globally, in one trusted place.
        </p>
      </div>

      <div data-reveal-stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((it) => (
          <Link
            key={it.title}
            to={it.href}
            aria-label={`${it.title} — ${it.cta}`}
            className="group relative overflow-hidden rounded-2xl glass hover:-translate-y-1.5 hover:shadow-elegant hover:border-primary/40 transition-all duration-300 flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {/* Top hero image */}
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={it.image}
                alt={it.title}
                loading="lazy"
                decoding="async"
                width={1024}
                height={768}
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 360px"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            </div>

            {/* Bottom content */}
            <div className="p-6 flex flex-col flex-1">
              <h3 className="font-display text-xl font-semibold mb-2 group-hover:text-gradient transition-colors">{it.title}</h3>
              <p className="text-sm leading-relaxed opacity-80 flex-1">{it.desc}</p>
              <span className="inline-flex items-center gap-2 mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-primary group-hover:gap-3 transition-all">
                {it.cta} →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default DigiServices;
