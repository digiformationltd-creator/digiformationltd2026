import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Layout from "@/components/layout/Layout";

type ServicePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  highlights?: string[];
  children?: React.ReactNode;
};

const ServicePage = ({ eyebrow, title, description, highlights, children }: ServicePageProps) => {
  const items = highlights ?? [
    "Fully managed end-to-end process",
    "Transparent fixed pricing — no hidden fees",
    "Dedicated specialist assigned to your case",
    "Status updates at every stage",
  ];

  return (
    <Layout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />
        <div className="glow-orb -top-40 -right-40 opacity-60" />
        <div className="container px-4 py-24 md:py-32 relative">
          <div className="max-w-4xl">
            <div className="eyebrow eyebrow-left mb-6">{eyebrow}</div>
            <h1 className="font-display text-5xl md:text-7xl font-light leading-[1.02] tracking-tight">
              {title.split(" ").slice(0, -2).join(" ")}{" "}
              <em className="font-semibold gradient-text-gold not-italic">
                {title.split(" ").slice(-2).join(" ")}
              </em>
            </h1>
            <p className="mt-8 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              {description}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link to="/contact" className="btn-gold group">
                Get Started
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/pricing" className="btn-ghost-gold">View Pricing</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 border-t border-gold/10">
        <div className="container px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <div className="eyebrow eyebrow-left mb-5">What's Included</div>
              <h2 className="font-display text-4xl md:text-5xl font-light leading-tight mb-8">
                A <em className="font-semibold gradient-text-gold not-italic">complete service</em>, handled for you
              </h2>
              <div className="space-y-4">
                {items.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <p className="text-muted-foreground group-hover:text-foreground transition-colors">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-10">
              <div className="font-utility text-[10px] uppercase tracking-[0.2em] text-gold mb-3">How it works</div>
              <ol className="space-y-6 mt-6">
                {["Book a free consultation", "We collect your details securely", "Our team handles every step", "You receive your documents"].map((step, i) => (
                  <li key={i} className="flex gap-5">
                    <div className="font-display text-3xl font-semibold gradient-text-gold w-10 flex-shrink-0">0{i + 1}</div>
                    <div className="pt-2 text-muted-foreground">{step}</div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {children && <div className="mt-20">{children}</div>}
        </div>
      </section>

      <section className="py-24">
        <div className="container px-4">
          <div className="glass-card p-14 text-center max-w-3xl mx-auto">
            <h3 className="font-display text-3xl md:text-4xl font-light">
              Ready to <em className="font-semibold gradient-text-gold not-italic">get started?</em>
            </h3>
            <p className="mt-4 text-muted-foreground">Speak with our specialists today — it's free and there's no obligation.</p>
            <Link to="/contact" className="btn-gold mt-8">Book Free Consultation</Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ServicePage;
