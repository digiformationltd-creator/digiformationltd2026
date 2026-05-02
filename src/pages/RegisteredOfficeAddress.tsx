import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Building2, Briefcase, UserCircle2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type Pkg = {
  id: string;
  name: string;
  price: string;
  icon: typeof Building2;
  short: string;
  features: string[];
  highlighted?: boolean;
};

const packages: Pkg[] = [
  {
    id: "registered-office",
    name: "Registered Office Address",
    price: "£40",
    icon: Building2,
    short: "Official UK Registered Office for company compliance and legal mail.",
    features: [
      "Unique Office Number with Address",
      "Use address for registration of 1 Company/Business",
      "Receive all mail from UK government bodies",
      "Receive Post (up to 10 items/month)",
      "Notify via email when mail received",
      "Proof of Address provided",
      "Scan & Email Your Mail",
      "Forward Your Mail (Paid)",
      "1 Year Contract (Billed Annually)",
    ],
  },
  {
    id: "business-service",
    name: "Business Service Address",
    price: "£60",
    icon: Briefcase,
    short: "Ideal for businesses needing a professional UK address for marketing, correspondence, and registration.",
    highlighted: true,
    features: [
      "Unique Office Number with Address",
      "Use for registration of 1 Company/Business",
      "Use address for marketing & advertising",
      "Receive Post (up to 10 items/month)",
      "Notify via email when mail received",
      "Proof of Address provided",
      "Scan & Email Your Mail",
      "Forward Your Mail (Paid)",
      "1 Year Contract (Billed Annually)",
    ],
  },
  {
    id: "director-service",
    name: "Director Service Address",
    price: "£20",
    icon: UserCircle2,
    short: "Perfect for individual directors needing an official UK address separate from personal residence.",
    features: [
      "Unique Office Number with Address",
      "Use address for 1 Director",
      "Receive all mail from UK government bodies",
      "Receive Post (up to 10 items/month)",
      "Notify via email when mail received",
      "Scan & Email Your Mail",
      "Forward Your Mail (Paid)",
      "1 Year Contract (Billed Annually)",
    ],
  },
];

const whoNeeds = [
  { role: "Directors", desc: "Receive official government mail" },
  { role: "Company Secretaries (PCS)", desc: "Maintain compliance with Companies House" },
  { role: "Shareholders", desc: "Official documentation & correspondence" },
  { role: "Small & Medium Businesses", desc: "Establish a professional UK business presence" },
];

const related = [
  { name: "Company Name & Address Change", path: "/uk-compliance/change-of-company-name" },
  { name: "LTD ID Verification", path: "/uk-services/ltd-id-verification" },
  { name: "UTR Registration", path: "/uk-services/utr-codes" },
];

const faqs = [
  { q: "Can I receive government letters at this address?", a: "Yes, all official correspondence from Companies House will be forwarded." },
  { q: "Can I use this address for multiple companies?", a: "No, each package is valid for one company or director only." },
  { q: "What if I need mail forwarding?", a: "You can forward your mail via post at an additional cost." },
];

const RegisteredOfficeAddress = () => {
  useEffect(() => {
    document.title = "UK Registered Office Address Services | Business & Director Solutions | Digiformation LTD";
    const meta = (name: string, content: string, attr: "name" | "property" = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    meta("description", "Secure your official UK company address with Digiformation LTD. Choose from Registered Office, Business Service, or Director Service Addresses.");
    meta("keywords", "UK registered office address, UK business service address, director service address, official UK company address");

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = window.location.href;

    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Service",
          name: "UK Registered Office Address",
          provider: { "@type": "Organization", name: "Digiformation Ltd" },
          areaServed: "Worldwide",
          description: "Official UK addresses for Registered Office, Business Service, and Director Service use.",
        },
        {
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: window.location.origin + "/" },
            { "@type": "ListItem", position: 2, name: "UK Services", item: window.location.origin + "/uk-services" },
            { "@type": "ListItem", position: 3, name: "Registered Office Address", item: window.location.href },
          ],
        },
      ],
    };
    let s = document.getElementById("ldjson-roa") as HTMLScriptElement | null;
    if (!s) { s = document.createElement("script"); s.type = "application/ld+json"; s.id = "ldjson-roa"; document.head.appendChild(s); }
    s.text = JSON.stringify(schema);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="container mx-auto px-4 py-12 md:py-14 relative">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">UK Services · Compliance</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight">
              Registered Office <em className="not-italic text-gradient">Address — UK LTD</em>
            </h1>
            <p className="mt-8 text-lg md:text-xl leading-relaxed max-w-2xl opacity-90">
              Use our secure and official UK Registered Office Addresses for your company registration and compliance. Receive all government correspondence digitally or via post — and maintain a professional UK business presence.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="lg" className="rounded-full" onClick={() => scrollTo("packages")}>
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
              <Button asChild variant="ghostGlow" size="lg" className="rounded-full">
                <Link to="/contact">Talk to Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why you need it */}
      <section className="py-10 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="text-xs uppercase tracking-[0.18em] font-semibold">Why You Need It</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-12">
            Essential for <em className="not-italic text-gradient">every UK business</em>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {whoNeeds.map((w) => (
              <div key={w.role} className="glass rounded-2xl p-7">
                <h3 className="font-semibold text-lg mb-2">{w.role}</h3>
                <p className="text-sm opacity-80">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="py-12 bg-muted/20 border-t border-border/60">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-3 mb-5">
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">Packages</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Choose your <em className="not-italic text-gradient">address solution</em>
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {packages.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  id={p.id}
                  key={p.id}
                  className={`glass rounded-3xl p-8 relative flex flex-col ${p.highlighted ? "ring-2 ring-primary shadow-glow" : ""}`}
                >
                  {p.highlighted && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-brand text-primary-foreground text-[10px] uppercase tracking-[0.18em] font-bold px-4 py-1.5 rounded-full">
                      Most Popular
                    </span>
                  )}
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{p.name}</h3>
                  <p className="text-sm opacity-80 mb-5">{p.short}</p>
                  <div className="text-4xl font-bold text-gradient mb-1">{p.price}</div>
                  <div className="text-xs uppercase tracking-[0.16em] opacity-70 mb-6">/ year</div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-3 text-sm">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                        <span className="opacity-90">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant={p.highlighted ? "hero" : "ghostGlow"} className="rounded-full w-full">
                    <Link to="/contact">Get Started</Link>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Related */}
      <section className="py-10 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-10">Related Services</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {related.map((r) => (
              <Link key={r.path} to={r.path} className="glass rounded-2xl p-6 hover:-translate-y-1 hover:shadow-elegant transition-all group">
                <h3 className="font-semibold text-lg group-hover:text-gradient">{r.name}</h3>
                <div className="mt-3 text-[11px] uppercase tracking-[0.14em]">Explore →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-10 bg-muted/20 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="glass rounded-2xl px-6">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border/40">
                <AccordionTrigger className="text-left font-medium">{f.q}</AccordionTrigger>
                <AccordionContent className="opacity-90">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </Layout>
  );
};

export default RegisteredOfficeAddress;
