import Layout from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { ukServices, usaServices, banking, ukCompliance, type NavItem } from "@/data/navigation";

const SectionHub = ({ title, eyebrow, description, items }: { title: string; eyebrow: string; description: string; items: NavItem[] }) => {
  const parts = title.split(" ");
  const lead = parts.slice(0, -1).join(" ");
  const accent = parts.slice(-1).join(" ");
  return (
    <Layout>
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="h-px w-7 bg-primary" />
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">{eyebrow}</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.02]">
              {lead} <em className="not-italic text-gradient">{accent}</em>
            </h1>
            <p className="mt-8 text-lg md:text-xl leading-relaxed max-w-2xl opacity-90">{description}</p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item, i) => (
              <Link key={item.path} to={item.path} className="glass rounded-2xl p-7 hover:-translate-y-1 hover:shadow-elegant transition-all duration-300 group block">
                <h3 className="font-display text-2xl font-semibold mb-3 group-hover:text-gradient transition">{item.name}</h3>
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

export const UKServicesHub = () => <SectionHub title="UK Business Services" eyebrow="UK Services" description="From company formation to VAT, UTR codes and identity verification — every UK service you need under one roof." items={ukServices} />;
export const UKComplianceHub = () => <SectionHub title="UK Company Compliance" eyebrow="UK Compliance" description="Stay fully compliant with Companies House. Director changes, name changes, accounts, statements and more." items={ukCompliance} />;
export const USAServicesHub = () => <SectionHub title="USA Business Services" eyebrow="USA Services" description="Form your US LLC remotely, get your EIN and ITIN, and stay tax-compliant from anywhere in the world." items={usaServices} />;
export const BankingHub = () => <SectionHub title="Banking & Payment Solutions" eyebrow="Banking" description="Open business accounts and connect global payment gateways — Stripe, PayPal, Wise, Tide, Airwallex and more." items={banking} />;
