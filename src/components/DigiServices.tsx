import { Link } from "react-router-dom";
import { Building2, ShieldCheck, Landmark, Code2, FileCheck, Globe2 } from "lucide-react";

const items = [
  { icon: Building2, title: "Company Formation", desc: "UK Ltd & US LLC formation handled end-to-end with full compliance.", href: "/uk-services/uk-ltd-formation" },
  { icon: ShieldCheck, title: "Identity & Verification", desc: "DIATF-compliant ID verification for directors, PSCs and shareholders.", href: "/uk-services/ltd-id-verification" },
  { icon: Landmark, title: "Banking & Payments", desc: "Stripe, PayPal, Wise, Tide, Airwallex and 9 more global gateways.", href: "/banks-payment-solutions/stripe" },
  { icon: FileCheck, title: "Annual Compliance", desc: "Annual accounts, confirmation statements and statutory filings.", href: "/uk-compliance/annual-accounts-filing" },
  { icon: Globe2, title: "USA Tax Services", desc: "EIN, ITIN, BIO reports and annual tax filing for non-US founders.", href: "/usa-services/ein-number" },
  { icon: Code2, title: "Web Development", desc: "Conversion-focused websites and e-commerce builds for your brand.", href: "/web-development" },
];

const DigiServices = () => (
  <section className="py-24 md:py-32 relative overflow-hidden">
    <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />
    <div className="container mx-auto px-4 relative z-10">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-3 mb-5">
          <span className="h-px w-7 bg-primary" />
          <span className="text-xs uppercase tracking-[0.18em] font-semibold">Our Services</span>
          <span className="h-px w-7 bg-primary" />
        </div>
        <h2 className="text-4xl md:text-5xl font-bold leading-tight">
          Built for founders who <em className="not-italic text-gradient">move fast</em>
        </h2>
        <p className="text-lg mt-5 opacity-90">From day-one formation to year-round compliance — every service you need to operate globally, in one trusted place.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((it) => (
          <Link key={it.title} to={it.href} className="glass rounded-2xl p-7 hover:-translate-y-1 hover:shadow-elegant transition-all duration-300 block group">
            <div className="w-12 h-12 rounded-xl bg-gradient-brand grid place-items-center mb-5 shadow-card">
              <it.icon className="w-5 h-5" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2 group-hover:text-gradient transition">{it.title}</h3>
            <p className="text-sm leading-relaxed opacity-90">{it.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default DigiServices;
