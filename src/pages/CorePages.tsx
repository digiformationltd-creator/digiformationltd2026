import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import SimplePage from "@/components/SimplePage";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { compliancePages } from "@/data/compliance";

export const About = () => (
  <SimplePage eyebrow="About Us" title="Building global businesses, one formation at a time" description="Digiformation Ltd is the trusted one-stop platform for UK & US company formation, banking, payment gateways, compliance and web development. We've helped 300+ entrepreneurs in 60+ countries launch and scale." />
);

export const Contact = () => (
  <SimplePage eyebrow="Contact" title="Let's start a conversation" description="Book a free 30-minute consultation or send us a message. Our specialists respond within one business day.">
    <div className="grid md:grid-cols-2 gap-6 mt-12 max-w-4xl">
      <div className="glass rounded-2xl p-8">
        <div className="text-[10px] uppercase tracking-[0.18em] mb-2 opacity-80">Email</div>
        <div className="font-display text-2xl font-semibold">hello@digiformation.co.uk</div>
      </div>
      <div className="glass rounded-2xl p-8">
        <div className="text-[10px] uppercase tracking-[0.18em] mb-2 opacity-80">Phone</div>
        <div className="font-display text-2xl font-semibold">+44 (0) 20 0000 0000</div>
      </div>
    </div>
  </SimplePage>
);

type PriceItem = { name: string; price: string; note?: string; link: string };
type PriceGroup = { title: string; tag: string; intro: string; items: PriceItem[] };

const priceGroups: PriceGroup[] = [
  {
    title: "UK Company Formation",
    tag: "01 — UK Formation",
    intro: "All-inclusive UK LTD incorporation packages with Companies House registration.",
    items: [
      { name: "Starter Package", price: "£140", note: "3–5 business days", link: "/uk-services/uk-ltd-formation#packages" },
      { name: "Silver Package", price: "£170", note: "Most Popular", link: "/uk-services/uk-ltd-formation#packages" },
      { name: "Gold Package", price: "£180", link: "/uk-services/uk-ltd-formation#packages" },
      { name: "Platinum Package", price: "£200", link: "/uk-services/uk-ltd-formation#packages" },
    ],
  },
  {
    title: "UK Compliance Services",
    tag: "02 — UK Compliance",
    intro: "Keep your UK company fully compliant — Companies House and HMRC filings.",
    items: compliancePages.map((p) => ({
      name: p.title.replace(" Service", ""),
      price: p.price,
      link: `/uk-compliance/${p.slug}`,
    })),
  },
  {
    title: "USA Company Formation",
    tag: "03 — USA Services",
    intro: "Form your US LLC or C-Corp with EIN, registered agent, and full compliance.",
    items: [
      { name: "USA LLC Formation", price: "From $299", note: "EIN + Registered Agent included", link: "/usa-services/us-llc-formation#packages" },
      { name: "USA C-Corp Formation", price: "From $399", link: "/usa-services" },
      { name: "EIN Application Only", price: "$149", link: "/usa-services" },
      { name: "ITIN Application", price: "$199", link: "/usa-services" },
    ],
  },
  {
    title: "Banking & Payment Gateways",
    tag: "04 — Banking",
    intro: "Account creation & setup service charges for leading payment gateways and business banks.",
    items: [
      { name: "PayPal Account Creation", price: "£20", link: "/banking" },
      { name: "Payoneer Account Creation", price: "£20", link: "/banking" },
      { name: "WorldFirst Account Creation", price: "£20", link: "/banking" },
      { name: "Stripe Account Creation", price: "£20", link: "/banking" },
      { name: "Tide Account Creation", price: "£50", link: "/banking" },
      { name: "Sumup Account Creation", price: "£50", link: "/banking" },
      { name: "Wise Account Creation", price: "£70", link: "/banking" },
      { name: "Zyla Account Creation", price: "£30", link: "/banking" },
      { name: "Airwallex Account Creation", price: "£50", link: "/banking" },
      { name: "Mollie Account Creation", price: "£30", link: "/banking" },
      { name: "Zionpe Account Creation", price: "£50", link: "/banking" },
      { name: "Wallester Account Creation", price: "£50", link: "/banking" },
      { name: "Pingpong Account Creation", price: "£50", link: "/banking" },
    ],
  },
];

export const Pricing = () => {
  useEffect(() => {
    document.title = "Transparent Pricing — UK & US Formation, Compliance & Banking | Digiformation";
    const meta = (n: string, c: string) => {
      let el = document.querySelector(`meta[name="${n}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute("name", n); document.head.appendChild(el); }
      el.setAttribute("content", c);
    };
    meta("description", "All Digiformation pricing in one place — UK formation, compliance, USA company services and banking. Fixed fees, no hidden costs.");
  }, []);

  return (
    <Layout>
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="container mx-auto px-4 py-24 md:py-28 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="h-px w-7 bg-primary" />
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">Pricing</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight">
              Transparent pricing, <em className="not-italic text-gradient">no surprises</em>
            </h1>
            <p className="mt-8 text-lg md:text-xl leading-relaxed opacity-90">
              Every service we offer — UK formation, compliance, USA company setup and banking — with fixed fees and zero hidden add-ons.
            </p>
          </div>
        </div>
      </section>

      {priceGroups.map((g, gi) => (
        <section key={g.title} className={`py-20 ${gi % 2 === 1 ? "bg-muted/20" : ""} border-t border-border/60`}>
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] uppercase tracking-[0.22em] opacity-70 font-mono">{g.tag}</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{g.title}</h2>
              <p className="opacity-80 max-w-md md:text-right">{g.intro}</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {g.items.map((it) => (
                <Link
                  key={it.name + it.price}
                  to={it.link}
                  className="glass rounded-2xl p-6 hover:-translate-y-1 hover:shadow-elegant transition-all group flex flex-col"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <h3 className="text-lg font-semibold leading-snug group-hover:text-gradient">{it.name}</h3>
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0 opacity-70" />
                  </div>
                  <div className="text-3xl font-bold text-gradient mb-2">{it.price}</div>
                  {it.note && <div className="text-xs opacity-70 mb-4">{it.note}</div>}
                  <div className="mt-auto pt-4 text-[11px] uppercase tracking-[0.16em] opacity-80 group-hover:opacity-100">
                    View details →
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="py-20 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Need help choosing?</h2>
          <p className="opacity-80 mb-8">Book a free 30-minute consultation and we'll recommend the right package for you.</p>
          <Button asChild variant="hero" size="lg" className="rounded-full">
            <Link to="/contact">Talk to a Specialist <ArrowRight className="w-4 h-4" /></Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export const FAQ = () => (
  <SimplePage eyebrow="FAQ" title="Frequently asked questions" description="Answers to the most common questions about UK & US company formation, banking, compliance and more." />
);

export const Blog = () => (
  <SimplePage eyebrow="Blog" title="Insights & guides for global founders" description="Practical articles on company formation, taxation, banking and growing your international business." />
);

export const ClientArea = () => (
  <SimplePage eyebrow="Client Area" title="Your dedicated client portal" description="Sign in to track applications, upload documents, and access all your services in one secure place." />
);

export const WebDevelopment = () => (
  <SimplePage eyebrow="Web Development" title="Websites that grow your business" description="Professional websites, landing pages and e-commerce solutions for your UK or US business — from concept to launch." />
);

export const Privacy = () => (
  <SimplePage eyebrow="Legal" title="Privacy Policy" description="How we collect, use and protect your personal data." />
);

export const Terms = () => (
  <SimplePage eyebrow="Legal" title="Terms of Service" description="The terms and conditions that govern use of our services." />
);
