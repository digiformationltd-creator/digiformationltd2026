import { Link } from "react-router-dom";
import heroUkLtd from "@/assets/card-hero-uk-ltd.jpg";
import heroUsLlc from "@/assets/card-hero-us-llc.jpg";
import heroBanking from "@/assets/card-hero-banking.jpg";
import heroPayments from "@/assets/card-hero-payments.jpg";
import heroWeb from "@/assets/card-hero-web.jpg";
import heroTax from "@/assets/card-hero-tax.jpg";
import heroPackages from "@/assets/card-hero-packages.jpg";

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
  {
    tag: "PACK",
    title: "Packages",
    desc: "Explore our all-in-one bundles — formation, banking, compliance and web combined at transparent, value-driven prices.",
    cta: "View packages",
    href: "/pricing",
    image: heroPackages,
  },
];

const DigiServices = () => (
  <section className="py-14 md:py-10 relative overflow-hidden">
    <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />
    <div className="container mx-auto px-4 relative z-10">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-3 mb-5">
          <span className="h-px w-7 bg-primary" />
          <span className="text-xs uppercase tracking-[0.18em] font-semibold">Services Overview</span>
          <span className="h-px w-7 bg-primary" />
        </div>
        <h2 className="text-4xl md:text-5xl font-bold leading-tight">
          Everything to launch &amp; run your <em className="not-italic text-gradient">global business</em>
        </h2>
        <p className="text-lg mt-5 opacity-90">
          From day-one formation to year-round compliance — every service you need to operate globally, in one trusted place.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((it) => (
          <article
            key={it.title}
            className="group relative overflow-hidden rounded-2xl glass hover:-translate-y-1 hover:shadow-elegant transition-all duration-300 flex flex-col"
          >
            {/* Top hero image */}
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={it.image}
                alt={it.title}
                loading="lazy"
                width={1024}
                height={768}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Tag chip */}
              <div className="absolute top-4 left-4 z-10">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-background/70 backdrop-blur-md border border-border/50 text-[10px] font-semibold tracking-[0.14em] uppercase">
                  {it.tag}
                </span>
              </div>
              {/* Subtle bottom fade for blend */}
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            </div>

            {/* Bottom content */}
            <div className="p-6 flex flex-col flex-1">
              <h3 className="font-display text-xl font-semibold mb-2">{it.title}</h3>
              <p className="text-sm leading-relaxed opacity-80 flex-1">{it.desc}</p>
              <Link
                to={it.href}
                className="inline-flex items-center gap-2 mt-5 text-xs font-semibold uppercase tracking-[0.12em] hover:gap-3 transition-all"
              >
                {it.cta} →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default DigiServices;
