import { Link, useParams, useLocation } from "react-router-dom";
import { ArrowRight, CheckCircle2, Wallet } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { usaServicePages } from "@/data/usaServices";
import { useSeo } from "@/lib/seo";
import EinHero from "@/components/hero-animations/EinHero";
import ItinHero from "@/components/hero-animations/ItinHero";
import ServiceFAQ, { FAQ } from "@/components/seo/ServiceFAQ";
import RelatedServices from "@/components/seo/RelatedServices";
import RecommendedGuides from "@/components/seo/RecommendedGuides";

const FAQS_BY_SLUG: Record<string, FAQ[]> = {
  "ein-number": [
    { q: "What is an EIN and why do I need one?", a: "An Employer Identification Number (EIN) is a 9-digit federal tax ID issued by the IRS. You need it to open a US bank account, register for Stripe or PayPal, hire employees, and file federal taxes for your LLC or corporation." },
    { q: "Can non-US residents get an EIN without an SSN or ITIN?", a: "Yes. We file IRS Form SS-4 by fax on your behalf as a third-party designee — no SSN or ITIN required. You only need a passport and a registered US business entity." },
    { q: "How long does EIN approval take?", a: "Standard processing is 4–6 weeks by IRS fax. Our expedited service typically returns your EIN confirmation letter (CP 575) within 7–15 business days." },
    { q: "Do I need a US LLC before applying for an EIN?", a: "Yes — the IRS requires a registered US entity (LLC, C-Corp, or sole-proprietorship). If you haven't formed your LLC yet, bundle EIN with our US LLC Formation service." },
    { q: "Is the EIN permanent?", a: "Yes. An EIN is permanent and never expires, even if you don't use it for years. It only changes if you change the legal structure of your business." },
  ],
  "itin-number": [
    { q: "What is an ITIN and who needs one?", a: "An Individual Taxpayer Identification Number (ITIN) is a 9-digit IRS tax processing number issued to non-residents who need to file US taxes but are not eligible for an SSN. It's required for multi-member LLC owners, US property investors, and dependents on US tax returns." },
    { q: "Do I need to visit the US to apply for an ITIN?", a: "No. As an IRS Certified Acceptance Agent partner, we process your application remotely — your passport is verified without sending the original to the IRS." },
    { q: "How long does ITIN approval take?", a: "IRS processing takes 8–12 weeks. We track the application and notify you the moment your ITIN is issued." },
    { q: "Can I use my ITIN to open a US bank account?", a: "Yes — many US fintech banks (Mercury, Wise, Relay) accept ITIN as a tax ID alongside your EIN for personal verification." },
    { q: "Will my ITIN expire?", a: "ITINs expire if not used on a federal tax return for three consecutive years. We can help you renew it before expiry." },
  ],
  "boi-report": [
    { q: "What is a BOI report?", a: "Under the US Corporate Transparency Act, most US LLCs and corporations must file a Beneficial Ownership Information (BOI) report with FinCEN disclosing each owner with 25%+ stake or substantial control." },
    { q: "When is the BOI report due?", a: "New entities formed in 2024+ must file within 90 days of formation. Existing entities had until 1 January 2025. Updates must be filed within 30 days of any ownership change." },
    { q: "What are the penalties for not filing?", a: "Civil penalties of up to $591/day and criminal penalties of up to $10,000 and 2 years imprisonment for willful failure to file." },
    { q: "Is the BOI report public?", a: "No. BOI data is held in a secure FinCEN database accessible only to authorized federal, state and law enforcement agencies." },
  ],
};

const HERO_BY_SLUG: Record<string, React.ComponentType> = {
  "ein-number": EinHero,
  "itin-number": ItinHero,
};

const UsaServicePage = () => {
  const params = useParams();
  const location = useLocation();
  // Routes are registered as literal paths (no :slug param), so derive slug from the URL.
  const slug = params.slug || location.pathname.split("/").filter(Boolean).pop() || "";
  const page = usaServicePages.find((p) => p.slug === slug);

  useSeo(
    page
      ? {
          title: page.metaTitle,
          description: page.metaDescription,
          keywords: page.keywords,
          type: "website",
          breadcrumbs: [
            { name: "Home", path: "/" },
            { name: "USA Services", path: "/usa-services" },
            { name: page.title, path: `/usa-services/${page.slug}` },
          ],
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "Service",
            name: page.title,
            description: page.metaDescription,
            provider: { "@type": "Organization", name: "Digiformation Ltd" },
            areaServed: "United States",
            serviceType: page.title,
            offers: {
              "@type": "Offer",
              price: page.price,
              priceCurrency: page.currency,
            },
          },
        }
      : { title: "Service Not Found | Digiformation", description: "Service not found.", noindex: true },
    [slug]
  );

  if (!page) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-5xl font-bold">Service not found</h1>
          <Link to="/usa-services" className="inline-block mt-8 px-6 py-3 rounded-full bg-gradient-brand">Back to USA Services</Link>
        </div>
      </Layout>
    );
  }

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const HeroAnim = HERO_BY_SLUG[page.slug];

  return (
    <Layout>
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="container mx-auto px-4 py-12 md:py-14 relative">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-3 mb-6">
                <span className="text-xs uppercase tracking-[0.18em] font-semibold">USA Services</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight">{page.hero}</h1>
              <p className="mt-8 text-lg md:text-xl leading-relaxed max-w-2xl opacity-90">{page.description}</p>
              <div className="mt-10 flex flex-wrap gap-4 items-center">
                <Button variant="hero" size="lg" className="rounded-full" onClick={() => scrollTo("apply")}>
                  Apply Now <ArrowRight className="w-4 h-4" />
                </Button>
                <div className="glass rounded-full px-5 py-2 text-sm flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Service fee: <span className="font-bold text-gradient">${page.price} {page.currency}</span>
                </div>
                <div className="glass rounded-full px-5 py-2 text-sm">
                  Turnaround: <span className="font-semibold">{page.turnaround}</span>
                </div>
              </div>
            </div>
            {HeroAnim && (
              <div className="relative hidden lg:block">
                <HeroAnim />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-10 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-xs uppercase tracking-[0.18em] opacity-70 mb-3">Service Features</div>
          <h2 className="text-4xl font-bold mb-10">What's included</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {page.features.map((f) => (
              <div key={f} className="glass rounded-2xl p-6 flex gap-4 hover:-translate-y-1 transition-transform">
                <CheckCircle2 className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                <span className="font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="requirements" className="py-10 border-t border-border/60 bg-muted/10">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-xs uppercase tracking-[0.18em] opacity-70 mb-3">Application Requirements</div>
          <h2 className="text-4xl font-bold mb-4">What you'll need to apply</h2>
          <p className="opacity-80 mb-10 max-w-2xl">Please prepare the following before starting your {page.title.replace(" Service", "")} application. This helps us complete your filing quickly and without delays.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {page.requirements.map((r, i) => (
              <div key={r} className="glass rounded-xl p-5 flex gap-4 items-start">
                <div className="w-7 h-7 rounded-full bg-gradient-brand grid place-items-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                <span className="font-medium text-sm leading-relaxed">{r}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-xs uppercase tracking-[0.18em] opacity-70 mb-3">How It Works</div>
          <h2 className="text-4xl font-bold mb-10">Simple 4-step process</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {page.process.map((p, i) => (
              <div key={p} className="glass rounded-2xl p-6">
                <div className="w-9 h-9 rounded-full bg-gradient-brand grid place-items-center font-bold mb-4">{i + 1}</div>
                <p className="text-sm leading-relaxed font-medium">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="apply" className="py-10 bg-muted/20 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Apply for {page.title.replace(" Service", "")}</h2>
          <p className="opacity-80 mb-8">Service fee <span className="text-gradient font-bold">${page.price} {page.currency}</span> — turnaround {page.turnaround}. We handle the filing end-to-end and keep you updated.</p>
          <Button asChild variant="hero" size="lg" className="rounded-full">
            <Link to={`/contact?service=${encodeURIComponent(page.title)}`}>Apply Now <ArrowRight className="w-4 h-4" /></Link>
          </Button>
        </div>
      </section>


      <section className="py-10 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold mb-8">Other USA Services</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {usaServicePages.filter((p) => p.slug !== page.slug).map((p) => (
              <Link key={p.slug} to={`/usa-services/${p.slug}`} className="glass rounded-2xl p-6 hover:-translate-y-1 hover:shadow-elegant transition-all group">
                <h3 className="font-semibold text-lg group-hover:text-gradient">{p.title.replace(" Service", "")}</h3>
                <div className="mt-3 text-[11px] uppercase tracking-[0.14em]">Explore →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default UsaServicePage;
