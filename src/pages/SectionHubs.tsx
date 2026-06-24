import Layout from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { ukServices, usaServices, banking, ukCompliance, type NavItem } from "@/data/navigation";
import { useSeo } from "@/lib/seo";
import { glassTintFor, inferGlassCategory } from "@/lib/glassCategory";

type HubProps = {
  title: string;
  eyebrow: string;
  description: string;
  items: NavItem[];
  seo: { title: string; description: string; keywords: string; path: string; crumb: string };
};

const SectionHub = ({ title, eyebrow, description, items, seo }: HubProps) => {
  const parts = title.split(" ");
  const lead = parts.slice(0, -1).join(" ");
  const accent = parts.slice(-1).join(" ");

  useSeo({
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    path: seo.path,
    type: "website",
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: seo.crumb, path: seo.path },
    ],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: seo.title,
      description: seo.description,
      url: typeof window !== "undefined" ? window.location.origin + seo.path : seo.path,
      hasPart: items.map((i) => ({ "@type": "Service", name: i.name, url: (typeof window !== "undefined" ? window.location.origin : "") + i.path })),
    },
  });

  return (
    <Layout>
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">{eyebrow}</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.02]">
              {lead} <em className="not-italic text-gradient">{accent}</em>
            </h1>
            <p className="mt-8 text-lg md:text-xl leading-relaxed max-w-2xl opacity-90">{description}</p>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <Link key={item.path} to={item.path} className={`glass ${glassTintFor(inferGlassCategory(`${eyebrow} ${item.name} ${item.path}`))} rounded-2xl p-7 hover:-translate-y-1 hover:shadow-elegant transition-all duration-300 group block`}>
                <h2 className="font-display text-2xl font-semibold mb-3 group-hover:text-gradient transition">{item.name}</h2>
                <p className="text-sm opacity-90">Professional {item.name.toLowerCase()} — fully managed.</p>
                <div className="mt-5 text-[11px] uppercase tracking-[0.14em]">Explore →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export const UKServicesHub = () => (
  <SectionHub
    title="UK Business Services"
    eyebrow="UK Services"
    description="From company formation to VAT, UTR codes and identity verification — every UK service you need under one roof."
    items={ukServices}
    seo={{
      title: "UK Business Services 2026 — LTD Formation, VAT, UTR & ID Verification | Digiformation",
      description: "Full-stack UK business services for non-residents in 2026 — UK LTD formation, VAT, UTR, Companies House ID verification, registered office and ongoing compliance.",
      keywords: "UK business services 2026, UK LTD formation non resident, VAT registration UK, UTR code, Companies House ID verification, registered office London",
      path: "/uk-services",
      crumb: "UK Services",
    }}
  />
);

export const UKComplianceHub = () => (
  <SectionHub
    title="UK Company Compliance"
    eyebrow="UK Compliance"
    description="Stay fully compliant with Companies House. Director changes, name changes, accounts, statements and more."
    items={ukCompliance}
    seo={{
      title: "UK Companies House Compliance Services 2026 — Annual Accounts & Filings | Digiformation",
      description: "Stay 100% compliant with Companies House in 2026. Confirmation statements, annual accounts, director changes, name changes, SIC codes and registered office updates.",
      keywords: "Companies House compliance 2026, confirmation statement UK, annual accounts filing, director change, company name change, SIC codes, registered office change",
      path: "/uk-compliance",
      crumb: "UK Compliance",
    }}
  />
);

export const USAServicesHub = () => (
  <SectionHub
    title="USA Business Services"
    eyebrow="USA Services"
    description="Form your US LLC remotely, get your EIN and ITIN, and stay tax-compliant from anywhere in the world."
    items={usaServices}
    seo={{
      title: "USA Business Services 2026 — LLC Formation, EIN, ITIN & BOI | Digiformation",
      description: "Form a US LLC from anywhere in 2026. EIN, ITIN, BOI report, annual tax filings and registered agent — fully managed for non-resident founders worldwide.",
      keywords: "US LLC formation non resident 2026, EIN application, ITIN service, BOI report, Wyoming LLC, Delaware LLC, US tax filing non resident",
      path: "/usa-services",
      crumb: "USA Services",
    }}
  />
);

export const BankingHub = () => (
  <SectionHub
    title="Banking & Payment Solutions"
    eyebrow="Banking"
    description="Open business accounts and connect global payment gateways — Stripe, PayPal, Wise, Tide, Airwallex and more."
    items={banking}
    seo={{
      title: "Business Banking & Payment Gateways 2026 — Stripe, PayPal, Wise, Tide | Digiformation",
      description: "Open global business bank accounts and payment gateways in 2026 — Stripe, PayPal, Wise, Payoneer, WorldFirst, Tide, Airwallex — for UK LTD and US LLC owners worldwide.",
      keywords: "business bank account UK 2026, Stripe non resident, PayPal business, Wise business account, Payoneer, WorldFirst, Tide bank, Airwallex, payment gateway non resident",
      path: "/banks-payment-solutions",
      crumb: "Banking & Payments",
    }}
  />
);
