import Layout from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { Building2, Globe2, Landmark, Code2 } from "lucide-react";
import { ukServices, usaServices, banking, ukCompliance } from "@/data/navigation";

const groups = [
  { title: "UK Services", icon: Building2, items: ukServices, color: "🇬🇧" },
  { title: "UK Compliance", icon: Building2, items: ukCompliance, color: "🇬🇧" },
  { title: "USA Services", icon: Globe2, items: usaServices, color: "🇺🇸" },
  { title: "Banking & Payments", icon: Landmark, items: banking, color: "💳" },
];

const SectionHub = ({ title, eyebrow, description, group }: { title: string; eyebrow: string; description: string; group: typeof groups[number] }) => (
  <Layout>
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />
      <div className="glow-orb -top-40 -right-40 opacity-50" />
      <div className="container px-4 py-24 md:py-32 relative">
        <div className="max-w-4xl">
          <div className="eyebrow eyebrow-left mb-6">{eyebrow}</div>
          <h1 className="font-display text-5xl md:text-7xl font-light leading-[1.02]">
            {title.split(" ").slice(0, -1).join(" ")} <em className="gradient-text-gold not-italic font-semibold">{title.split(" ").slice(-1)}</em>
          </h1>
          <p className="mt-8 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">{description}</p>
        </div>
      </div>
    </section>

    <section className="py-20">
      <div className="container px-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {group.items.map((item, i) => (
            <Link key={item.path} to={item.path} className="glass-card glass-card-hover p-7 group block">
              <div className="font-display text-4xl font-semibold text-gold/15 mb-2">{String(i + 1).padStart(2, "0")}</div>
              <h3 className="font-display text-2xl font-semibold mb-3 group-hover:text-gold-light transition">{item.name}</h3>
              <p className="text-sm text-muted-foreground">Professional {item.name.toLowerCase()} — fully managed.</p>
              <div className="mt-5 font-utility text-[11px] uppercase tracking-[0.14em] text-gold">Explore →</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  </Layout>
);

export const UKServicesHub = () => <SectionHub title="UK Business Services" eyebrow="UK Services" description="From company formation to VAT, UTR codes and identity verification — every UK service you need under one roof." group={groups[0]} />;
export const UKComplianceHub = () => <SectionHub title="UK Company Compliance" eyebrow="UK Compliance" description="Stay fully compliant with Companies House. Director changes, name changes, accounts, statements and more." group={groups[1]} />;
export const USAServicesHub = () => <SectionHub title="USA Business Services" eyebrow="USA Services" description="Form your US LLC remotely, get your EIN and ITIN, and stay tax-compliant from anywhere in the world." group={groups[2]} />;
export const BankingHub = () => <SectionHub title="Banking & Payment Solutions" eyebrow="Banking" description="Open business accounts and connect global payment gateways — Stripe, PayPal, Wise, Tide, Airwallex and more." group={groups[3]} />;
