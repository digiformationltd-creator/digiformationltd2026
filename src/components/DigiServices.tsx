import { Link } from "react-router-dom";
import { Building2, Flag, Landmark, CreditCard, Code2 } from "lucide-react";

const items = [
  {
    icon: Building2,
    title: "UK LTD Formation",
    desc: "Establish your UK Limited Company with Companies House, including UTR, Registered Office, and full compliance support.",
    cta: "Learn More",
    href: "/uk-services/uk-ltd-formation",
  },
  {
    icon: Flag,
    title: "US LLC Formation",
    desc: "Start a compliant US LLC in any state, complete with EIN, ITIN (if applicable), registered agent, and BIO report.",
    cta: "Learn More",
    href: "/usa-services/us-llc-formation",
  },
  {
    icon: Landmark,
    title: "Business Banking Solutions",
    desc: "Activate multi-currency business accounts with Tide, Sunrate, WorldFirst, Wise, and more — fast and fully verified.",
    cta: "Learn More",
    href: "/banks-payment-solutions/tide",
  },
  {
    icon: CreditCard,
    title: "Payment Gateway Setup",
    desc: "Start accepting payments worldwide using Stripe, PayPal, and Mollie. Verified merchant accounts ready for your business.",
    cta: "Get Started",
    href: "/banks-payment-solutions/stripe",
  },
  {
    icon: Code2,
    title: "Web Development Services",
    desc: "Establish your online presence with custom websites and landing pages, fully SEO-ready and business-ready.",
    cta: "Learn More",
    href: "/web-development",
  },
];

const DigiServices = () => (
  <section className="py-24 md:py-32 relative overflow-hidden">
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
          <article key={it.title} className="glass rounded-2xl p-7 hover:-translate-y-1 hover:shadow-elegant transition-all duration-300 flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-gradient-brand grid place-items-center mb-5 shadow-card">
              <it.icon className="w-5 h-5" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">{it.title}</h3>
            <p className="text-sm leading-relaxed opacity-90 flex-1">{it.desc}</p>
            <Link
              to={it.href}
              className="inline-flex items-center gap-2 mt-5 text-xs font-semibold uppercase tracking-[0.12em] hover:gap-3 transition-all"
            >
              {it.cta} →
            </Link>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default DigiServices;
