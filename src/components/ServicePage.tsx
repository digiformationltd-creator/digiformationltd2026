import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

type ServicePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  highlights?: string[];
  contactService?: string;
  children?: React.ReactNode;
};

const splitTitle = (t: string) => {
  const parts = t.split(" ");
  if (parts.length < 3) return { lead: "", accent: t };
  return { lead: parts.slice(0, -2).join(" "), accent: parts.slice(-2).join(" ") };
};

const ServicePage = ({ eyebrow, title, description, highlights, contactService, children }: ServicePageProps) => {
  const contactHref = contactService ? `/contact?service=${encodeURIComponent(contactService)}` : "/contact";
  const { lead, accent } = splitTitle(title);
  const items = highlights ?? [
    "Fully managed end-to-end process",
    "Transparent fixed pricing — no hidden fees",
    "Dedicated specialist assigned to your case",
    "Status updates at every stage",
  ];

  return (
    <Layout>
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="h-px w-7 bg-primary" />
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">{eyebrow}</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight">
              {lead && <>{lead} </>}
              <em className="not-italic text-gradient">{accent}</em>
            </h1>
            <p className="mt-8 text-lg md:text-xl leading-relaxed max-w-2xl opacity-90">{description}</p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button asChild variant="hero" size="lg" className="rounded-full">
                <Link to={contactHref}>Get Started <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button asChild variant="ghostGlow" size="lg" className="rounded-full">
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 border-t border-border/60">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <div>
              <div className="inline-flex items-center gap-3 mb-5">
                <span className="h-px w-7 bg-primary" />
                <span className="text-xs uppercase tracking-[0.18em] font-semibold">What's Included</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-8">
                A <em className="not-italic text-gradient">complete service</em>, handled for you
              </h2>
              <div className="space-y-4">
                {items.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="opacity-90">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-10">
              <div className="text-[10px] uppercase tracking-[0.2em] mb-3 opacity-80">How it works</div>
              <ol className="space-y-6 mt-6">
                {["Book a free consultation", "We collect your details securely", "Our team handles every step", "You receive your documents"].map((step, i) => (
                  <li key={i} className="flex gap-5 items-start">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div className="opacity-90">{step}</div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {children && <div className="mt-20">{children}</div>}
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="glass rounded-3xl p-14 text-center max-w-3xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-bold">
              Ready to <em className="not-italic text-gradient">get started?</em>
            </h3>
            <p className="mt-4 opacity-90">Speak with our specialists today — it's free and there's no obligation.</p>
            <Button asChild variant="hero" size="lg" className="rounded-full mt-8">
              <Link to={contactHref}>Book Free Consultation <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ServicePage;
