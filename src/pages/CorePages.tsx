import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { buildOrderRef } from "@/lib/orderRef";
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  MessageCircle,
  Clock,
  Shield,
  Sparkles,
  Code2,
  ShoppingBag,
  Layout as LayoutIcon,
  RefreshCw,
  LifeBuoy,
  Search,
  PenTool,
  Rocket,
  TestTube,
  Wrench,
  ChevronDown,
  MapPin,
  Building2,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  ShieldCheck,
  Globe,
  Quote,
  Star,
  Lock,
} from "lucide-react";
import SimplePage from "@/components/SimplePage";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { z } from "zod";
import { compliancePages } from "@/data/compliance";
import { bankingProviders } from "@/data/banking";
import heroWeb from "@/assets/card-hero-web.jpg";
import SourceHeardSelect from "@/components/attribution/SourceHeardSelect";
import { recordLeadAttribution, type DeclaredSource } from "@/lib/attribution";

/* ---------- helpers ---------- */
const setMeta = (title: string, description: string, keywords?: string) => {
  document.title = title;
  const setName = (n: string, c: string) => {
    let el = document.querySelector(`meta[name="${n}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", n);
      document.head.appendChild(el);
    }
    el.setAttribute("content", c);
  };
  const setProp = (p: string, c: string) => {
    let el = document.querySelector(`meta[property="${p}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("property", p);
      document.head.appendChild(el);
    }
    el.setAttribute("content", c);
  };
  setName("description", description);
  if (keywords) setName("keywords", keywords);
  setName("robots", "index, follow, max-snippet:-1, max-image-preview:large");
  setProp("og:title", title);
  setProp("og:description", description);
  setProp("og:type", "website");
  setProp("og:url", window.location.href);
  setName("twitter:card", "summary_large_image");
  setName("twitter:title", title);
  setName("twitter:description", description);
  // canonical
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = window.location.origin + window.location.pathname;
};

const injectJsonLd = (id: string, data: object) => {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
  return () => {
    el?.remove();
  };
};

/* ---------- About ---------- */
export const About = () => (
  <SimplePage
    eyebrow="About Us"
    title="Building global businesses, one formation at a time"
    description="Digiformation Ltd is the trusted one-stop platform for UK & US company formation, banking, payment gateways, compliance and web development. We've helped 300+ entrepreneurs in 60+ countries launch and scale."
  />
);

/* ---------- Contact ---------- */
const contactSchema = z.object({
  fullName: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  whatsapp: z.string().trim().min(5, "WhatsApp number required").max(30),
  country: z.string().trim().min(2, "Country is required").max(80),
  service: z.string().trim().max(120).optional().default(""),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(1500),
});

export const Contact = () => {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    whatsapp: "",
    country: "",
    service: "",
    message: "",
  });
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [declaredSource, setDeclaredSource] = useState<DeclaredSource | null>(null);
  const [sourceError, setSourceError] = useState(false);

  useEffect(() => {
    setMeta(
      "Contact Digiformation Ltd — UK LTD & US LLC Support",
      "Contact Digiformation Ltd for UK LTD & US LLC formation, registered office, ID verification and compliance. WhatsApp, email or inquiry form.",
      "contact Digiformation, UK company formation contact, US LLC formation help, Companies House support, registered office contact, ID verification help worldwide"
    );
    const cleanup = injectJsonLd("contact-page-schema", {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: "Contact Digiformation Ltd",
      url: "https://digiformation.uk/contact",
      mainEntity: {
        "@type": "Organization",
        name: "Digiformation Ltd",
        email: "Info@digiformation.uk",
        telephone: "+92-316-446-7464",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Office 1006, 85 Dunstall Hill",
          addressLocality: "Wolverhampton",
          postalCode: "WV6 0SR",
          addressCountry: "GB",
        },
        contactPoint: [{
          "@type": "ContactPoint",
          contactType: "customer support",
          email: "Info@digiformation.uk",
          telephone: "+92-316-446-7464",
          availableLanguage: ["English", "Urdu"],
          areaServed: ["GB", "US", "PK", "Worldwide"],
        }],
      },
    });
    const params = new URLSearchParams(window.location.search);
    const svc = params.get("service");
    if (svc) setForm((f) => ({ ...f, service: svc }));
    return cleanup;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (website) {
      // Honeypot triggered — silently succeed
      setSubmitted(true);
      return;
    }
    const result = contactSchema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    if (!declaredSource) {
      setSourceError(true);
      toast.error("Please tell us how you found us.");
      return;
    }
    setSubmitting(true);
    const orderRef = await buildOrderRef({ service: form.service });

    // Save to database (non-blocking for UX — log error but still proceed)
    const { data: inserted, error: dbError } = await supabase
      .from("contact_submissions")
      .insert({
        full_name: form.fullName,
        email: form.email,
        whatsapp: form.whatsapp,
        country: form.country,
        service: form.service?.trim() ? form.service.trim() : "General Inquiry",
        message: form.message,
        page_path: window.location.pathname,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent.slice(0, 500),
        declared_source: declaredSource.id,
        declared_source_label: declaredSource.label,
      })
      .select("id")
      .single();
    if (dbError) {
      console.error("Failed to save submission:", dbError);
    }

    // Link attribution to this inquiry — surfaces it inside Growth Intelligence.
    if (inserted?.id) {
      void recordLeadAttribution({
        entityType: "inquiry",
        entityId: inserted.id,
        declared: declaredSource,
      });
    }

    if (form.email) {
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-confirmation",
          recipientEmail: form.email,
          idempotencyKey: `contact-confirm-${orderRef}`,
          triggerSource: "system",
          templateData: { customerName: form.fullName, ticketRef: orderRef, subject: form.service || "Inquiry", message: form.message },
        },
      }).catch((err) => console.error("contact-confirmation failed", err));
    }
    supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "order-notification",
        idempotencyKey: `order-notify-${orderRef}`,
        triggerSource: "system",
        templateData: { customerName: form.fullName, customerEmail: form.email, whatsapp: form.whatsapp, country: form.country, service: form.service || "Inquiry", orderRef, pagePath: window.location.pathname, notes: form.message },
      },
    }).catch((err) => console.error("order-notification failed", err));

    setSubmitted(true);
    setSubmitting(false);
    toast.success("Message received — we'll get back to you soon.");
  };

  return (
    <Layout>
      <section className="py-10">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="sr-only">Contact Digiformation Ltd</h1>
          {/* Form */}
          {submitted ? (
            <div className="glass rounded-2xl p-10 flex flex-col items-center justify-center text-center space-y-4 min-h-[420px]">
              <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">Thank you, {form.fullName.split(" ")[0] || "there"}!</h2>
              <p className="opacity-80 max-w-md">
                Your message has been received. Our team will get back to you via email as soon as possible.
              </p>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-5">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Send us a message</h2>
              <p className="opacity-80 text-sm">Fill the form — we'll reply via WhatsApp or email as soon as possible.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" maxLength={100} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" maxLength={255} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <Input id="whatsapp" maxLength={30} value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input id="country" maxLength={80} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required />
              </div>
            </div>

            <div>
              <Label htmlFor="service">Service Interested In</Label>
            {(() => {
              // Categorized service catalog. When the visitor arrives from a
              // specific service page (?service=...), we restrict the dropdown
              // to that category only — so a banking applicant doesn't see
              // unrelated UK LTD / web-dev options. On /contact (no service
              // param) we show every category grouped.
              const CATEGORIES: { key: string; label: string; services: string[] }[] = [
                {
                  key: "uk-address",
                  label: "UK Address Services",
                  services: [
                    "Registered Office Address",
                    "Business Service Address",
                    "Director Service Address",
                    "Address Services",
                  ],
                },
                {
                  key: "uk-services",
                  label: "UK Services",
                  services: [
                    "UK LTD Formation",
                    "Register UK Limited Company",
                    "Companies House ID Verification",
                    "ID Verification",
                    "LTD ID Verification",
                    "Confirmation Statement Filing",
                    "Get UTR Number (HMRC)",
                    "UTR Number Registration",
                    "Companies House Authentication Code",
                    "Activation Code Service",
                    "UK VAT Registration & Submission",
                    "VAT Registration",
                  ],
                },
                {
                  key: "uk-compliance",
                  label: "UK Compliance & Filings",
                  services: [
                    "Company Name Change Service",
                    "Company Address Change Service",
                    "Annual Accounts Filing Service",
                    "Confirmation Statement Service",
                    "Company Director Appoint & Remove Service",
                    "Company Shareholder Appoint & Remove Service",
                    "Company PSC & Secretary Appoint & Remove Service",
                    "Company Residence Change Service",
                    "AD01 Form Post Service",
                    "Annual Filing",
                    "Company Changes",
                    "Dormant Company Filing",
                  ],
                },
                {
                  key: "usa",
                  label: "USA Services",
                  services: [
                    "USA LLC Formation",
                    "Form US LLC for Non-Residents",
                    "EIN Number",
                    "EIN Number Service",
                    "ITIN Number",
                    "ITIN Number Service",
                    "US LLC Annual Tax Return",
                    "Annual Tax Filing Service",
                    "BOI Report (Beneficial Ownership)",
                    "BOI Report Service",
                    "UTR / EIN / ITIN",
                  ],
                },
                {
                  key: "banking",
                  label: "Banking & Payment Solutions",
                  services: [
                    "PayPal","Payoneer","WorldFirst","Stripe","Tide","Sunrate","Wise","Zyla",
                    "Airwallex","Mollie","ZionPe","Wallester","PingPong","Grey","TapTap Send",
                    "Nsave Business","Banking & Payments",
                  ],
                },
                {
                  key: "other",
                  label: "Other",
                  services: ["Web Development", "Other"],
                },
              ];

              const norm = (s: string) => s.trim().toLowerCase();
              const incoming = norm(form.service);
              const activeCategory = incoming
                ? CATEGORIES.find((c) =>
                    c.services.some((s) => norm(s) === incoming || incoming.includes(norm(s)) || norm(s).includes(incoming))
                  )
                : null;
              const groupsToShow = activeCategory ? [activeCategory] : CATEGORIES;

              return (
                <Select value={form.service} onValueChange={(v) => setForm({ ...form, service: v })}>
                  <SelectTrigger id="service"><SelectValue placeholder="Choose a service" /></SelectTrigger>
                  <SelectContent>
                    {/* Ensure incoming value is always a valid option even if it
                        doesn't appear in our static catalog (e.g. specific
                        provider names from new pages). */}
                    {form.service && !groupsToShow.some((g) => g.services.includes(form.service)) && (
                      <SelectItem value={form.service}>{form.service}</SelectItem>
                    )}
                    {groupsToShow.map((g) => (
                      <div key={g.key} className="py-1">
                        {!activeCategory && (
                          <div className="px-2 py-1 text-[10px] uppercase tracking-[0.16em] opacity-60">{g.label}</div>
                        )}
                        {g.services.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              );
            })()}
            </div>

            <div>
              <Label htmlFor="message">Your Message</Label>
              <Textarea id="message" rows={5} maxLength={1500} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
            </div>

            {/* Honeypot — hidden from real users, bots fill it */}
            <div aria-hidden="true" className="absolute left-[-9999px] w-px h-px overflow-hidden">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <SourceHeardSelect
              value={declaredSource}
              onChange={(v) => { setDeclaredSource(v); setSourceError(false); }}
              error={sourceError}
            />



            {(() => {
              const applicationServices = [
                "PayPal","Payoneer","Stripe","Wise","WorldFirst","Tide","Airwallex","PingPong","Mollie","Wallester","Sunrate","ZionPe","Banking & Payments",
                "EIN Number Service","ITIN Number Service","Annual Tax Filing Service","BOI Report Service",
                "UK LTD Formation","USA LLC Formation","ID Verification","UTR / EIN / ITIN","Annual Filing","Company Changes","Address Services",
              ];
              const isApplication = applicationServices.includes(form.service);
              const idleLabel = isApplication ? "Apply Now" : "Send Message";
              const busyLabel = isApplication ? "Applying…" : "Sending…";
              return (
                <Button type="submit" variant="hero" size="lg" className="rounded-full w-full sm:w-auto" disabled={submitting}>
                  {submitting ? busyLabel : idleLabel} <ArrowRight className="w-4 h-4" />
                </Button>
              );
            })()}

            <p className="text-[11px] opacity-70 leading-relaxed pt-1">
              By submitting this form, you agree to our{" "}
              <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
              Your details are stored securely and never shared with third parties.
            </p>
          </form>
          )}
        </div>
      </section>
    </Layout>
  );
};

/* ---------- Pricing (full detailed) ---------- */
type DetailPkg = {
  name: string;
  price: string;
  badge?: string;
  note?: string;
  tone: string;
  ring: string;
  features: string[];
  link?: string;
};

type PricingSection = {
  title: string;
  tag: string;
  intro: string;
  packages: DetailPkg[];
  cols?: 2 | 3 | 4;
};

// UK LTD Formation
const ukLtdPackages: DetailPkg[] = [
  {
    name: "Starter",
    price: "£140",
    note: "3–5 Business Days",
    tone: "from-emerald-500/20 to-emerald-500/5",
    ring: "ring-emerald-500/40",
    link: "/uk-services/uk-ltd-formation/choose-jurisdiction?package=Starter",
    features: [
      "UK LTD (Company) Registration",
      "Companies House Incorporation Fee Included",
      "Digital Certificate of Incorporation",
      "Digital Memorandum & Articles of Association",
      "Digital Copy of All Documents (PDF)",
      "Digital Shares Certificate",
      "ID Verification Included",
      "12/6 Phone & WhatsApp Support",
    ],
  },
  {
    name: "Silver",
    price: "£170",
    badge: "Most Popular",
    tone: "from-sky-500/25 to-sky-500/5",
    ring: "ring-sky-400/60",
    link: "/uk-services/uk-ltd-formation/choose-jurisdiction?package=Silver",
    features: [
      "UK LTD (Company) Registration",
      "Companies House Incorporation Fee Included",
      "Digital + Printed Certificate of Incorporation",
      "Digital Memorandum & Articles of Association",
      "Registered Office Address",
      "Company Authentication Code",
      "UTR Number",
      "Digital Shares Certificate",
      "ID Verification Included",
    ],
  },
  {
    name: "Gold",
    price: "£180",
    tone: "from-amber-400/25 to-amber-400/5",
    ring: "ring-amber-400/50",
    link: "/uk-services/uk-ltd-formation/choose-jurisdiction?package=Gold",
    features: [
      "UK LTD (Company) Registration",
      "Companies House Incorporation Fee Included",
      "Digital Certificate of Incorporation",
      "Digital Memorandum & Articles of Association",
      "Registered Office Address",
      "Company Authentication Code",
      "UTR Number",
      "Digital Shares Certificate",
      "ID Verification Included",
      "Director Service Address",
    ],
  },
  {
    name: "Platinum",
    price: "£200",
    tone: "from-rose-500/25 to-rose-500/5",
    ring: "ring-rose-400/50",
    link: "/uk-services/uk-ltd-formation/choose-jurisdiction?package=Platinum",
    features: [
      "UK LTD (Company) Registration",
      "Companies House Incorporation Fee Included",
      "Digital Certificate of Incorporation",
      "Digital Memorandum & Articles of Association",
      "London Registered Office Address",
      "Company Authentication Code",
      "UTR Number",
      "Digital Shares Certificate",
      "ID Verification Included",
      "Director Service Address",
    ],
  },
];

// USA LLC Formation
const usaLlcPackages: DetailPkg[] = [
  {
    name: "Starter",
    price: "£150",
    note: "Base price — state surcharge may apply",
    tone: "from-emerald-500/20 to-emerald-500/5",
    ring: "ring-emerald-500/40",
    link: "/usa-services/us-llc-formation/choose-state?package=Starter",
    features: [
      "U.S. LLC Registration",
      "Shared Business Address (no portal, no mail support)",
      "Articles of Organization",
      "Employer Identification Number (EIN)",
      "Digital Company Documents (PDF)",
      "Certificate of Formation (Digital)",
      "24/7 Support",
    ],
  },
  {
    name: "Silver",
    price: "£200",
    badge: "Most Popular",
    tone: "from-sky-500/25 to-sky-500/5",
    ring: "ring-sky-400/60",
    link: "/usa-services/us-llc-formation/choose-state?package=Silver",
    features: [
      "U.S. LLC Registration",
      "Unique Business Address (with portal access & mail support)",
      "Articles of Organization",
      "Employer Identification Number (EIN)",
      "Digital Company Documents (PDF)",
      "Certificate of Formation (Digital)",
      "24/7 Support",
    ],
  },
  {
    name: "Gold",
    price: "£400",
    tone: "from-amber-400/25 to-amber-400/5",
    ring: "ring-amber-400/50",
    link: "/usa-services/us-llc-formation/choose-state?package=Gold",
    features: [
      "U.S. LLC Registration",
      "Unique Business Address (with portal access & mail support)",
      "Articles of Organization",
      "Employer Identification Number (EIN)",
      "Individual Taxpayer Identification Number (ITIN) included",
      "Digital Company Documents (PDF)",
      "Certificate of Formation (Digital)",
      "24/7 Support",
    ],
  },
];

// UK Address Packages
const addressPackages: DetailPkg[] = [
  {
    name: "Registered Office Address",
    price: "£40",
    note: "1 Year Contract",
    tone: "from-emerald-500/20 to-emerald-500/5",
    ring: "ring-emerald-500/40",
    link: "/checkout?service=registered-office-address",
    features: [
      "Unique Office Number with Address",
      "Use address for registration of 1 Company/Business",
      "Receive all mail from UK government bodies",
      "Receive Post (up to 10 items/month)",
      "Notify via email when mail received",
      "Proof of Address provided",
      "Scan & Email Your Mail",
      "Forward Your Mail (Paid)",
    ],
  },
  {
    name: "Business Service Address",
    price: "£60",
    badge: "Most Popular",
    note: "1 Year Contract",
    tone: "from-sky-500/25 to-sky-500/5",
    ring: "ring-sky-400/60",
    link: "/checkout?service=business-service-address",
    features: [
      "Unique Office Number with Address",
      "Use for registration of 1 Company/Business",
      "Use address for marketing & advertising",
      "Receive Post (up to 10 items/month)",
      "Notify via email when mail received",
      "Proof of Address provided",
      "Scan & Email Your Mail",
      "Forward Your Mail (Paid)",
    ],
  },
  {
    name: "Director Service Address",
    price: "£20",
    note: "1 Year Contract",
    tone: "from-amber-400/25 to-amber-400/5",
    ring: "ring-amber-400/50",
    link: "/checkout?service=director-service-address",
    features: [
      "Unique Office Number with Address",
      "Use address for 1 Director",
      "Receive all mail from UK government bodies",
      "Receive Post (up to 10 items/month)",
      "Notify via email when mail received",
      "Scan & Email Your Mail",
      "Forward Your Mail (Paid)",
    ],
  },
];

// USA Add-on Services

const usaExtraPackages: DetailPkg[] = [
  {
    name: "EIN Number Service",
    price: "$30",
    tone: "from-emerald-500/20 to-emerald-500/5",
    ring: "ring-emerald-500/40",
    features: [
      "EIN Registration with IRS",
      "Digital Certificate Delivery (PDF)",
      "Fast Processing",
      "Compliant & Secure",
      "Support included",
    ],
    link: "/usa-services/ein-number",
  },
  {
    name: "ITIN Number Service",
    price: "$199",
    tone: "from-sky-500/25 to-sky-500/5",
    ring: "ring-sky-400/60",
    features: [
      "ITIN Application Assistance",
      "IRS-Compliant Submission",
      "Digital ITIN Certificate",
      "Fast & Secure Process",
      "Support Included",
    ],
    link: "/usa-services/itin-number",
  },
  {
    name: "Annual Tax Filing",
    price: "$99",
    tone: "from-amber-400/25 to-amber-400/5",
    ring: "ring-amber-400/50",
    features: [
      "Federal & State Tax Submission",
      "IRS & State Compliant",
      "Portal Access for Filings",
      "Support & Guidance",
      "Ongoing Tax Assistance",
    ],
    link: "/usa-services/annual-tax-filing",
  },
  {
    name: "BOI Report Service",
    price: "$99",
    tone: "from-rose-500/25 to-rose-500/5",
    ring: "ring-rose-400/50",
    features: [
      "Digital BOI Report Submission",
      "U.S. Government Compliant",
      "Fast Processing",
      "Secure Document Delivery (PDF)",
      "Support Included",
    ],
    link: "/usa-services/bio-report",
  },
];

// Tone rotation for compliance & banking
const toneCycle = [
  { tone: "from-emerald-500/20 to-emerald-500/5", ring: "ring-emerald-500/40" },
  { tone: "from-sky-500/25 to-sky-500/5", ring: "ring-sky-400/60" },
  { tone: "from-amber-400/25 to-amber-400/5", ring: "ring-amber-400/50" },
  { tone: "from-rose-500/25 to-rose-500/5", ring: "ring-rose-400/50" },
  { tone: "from-violet-500/25 to-violet-500/5", ring: "ring-violet-400/50" },
  { tone: "from-cyan-500/25 to-cyan-500/5", ring: "ring-cyan-400/50" },
];

const compliancePackages: DetailPkg[] = compliancePages.map((p, i) => ({
  name: p.title.replace(" Service", ""),
  price: p.price,
  tone: toneCycle[i % toneCycle.length].tone,
  ring: toneCycle[i % toneCycle.length].ring,
  features: p.overview,
  link: `/uk-compliance/${p.slug}`,
}));

const bankingPackages: DetailPkg[] = bankingProviders.map((b, i) => ({
  name: b.name,
  price: b.setupPrice,
  note: b.tagline,
  tone: toneCycle[i % toneCycle.length].tone,
  ring: toneCycle[i % toneCycle.length].ring,
  features: b.features,
  link: `/banks-payment-solutions/${b.slug}`,
}));

// Web Development Packages
const webDevPackages: DetailPkg[] = [
  {
    name: "E-commerce Store",
    price: "£30",
    badge: "Best Value",
    note: "E-commerce Setup",
    tone: "from-rose-500/25 to-rose-500/5",
    ring: "ring-rose-400/60",
    link: "/checkout?service=web-ecommerce-shopify",
    features: [
      "Free domain included",
      "Shopify trial arranged from our end",
      "Full website setup & configuration",
      "Theme installation & customization",
      "Product upload (up to 20 products)",
      "Payment gateway integration",
      "Shipping & tax configuration",
      "Mobile-responsive storefront",
      "Basic SEO setup",
      "Launch support & training",
    ],
  },
  {
    name: "React Basic",
    price: "£40",
    note: "Website Package",
    tone: "from-emerald-500/20 to-emerald-500/5",
    ring: "ring-emerald-500/40",
    link: "/checkout?service=web-react-basic",
    features: [
      "4-page React website (Home, About, Services, Contact)",
      "Basic logo design with 1 revision",
      "Mobile-responsive design",
      "Basic contact form",
      "Social media links integration",
      "Free hosting setup (Netlify/Vercel)",
      "14 days post-launch support",
    ],
  },
  {
    name: "React Standard",
    price: "£60",
    badge: "Most Popular",
    note: "Website Package",
    tone: "from-sky-500/25 to-sky-500/5",
    ring: "ring-sky-400/60",
    link: "/checkout?service=web-react-standard",
    features: [
      "6-page React website",
      "Enhanced logo design (2 concepts, 3 revisions)",
      "Professional color scheme and typography",
      "Smooth animations and transitions",
      "Newsletter signup form",
      "Image gallery or portfolio section",
      "Google Analytics integration",
      "Basic SEO optimization with meta tags",
      "Advanced contact form with validation",
      "SSL certificate setup + Premium hosting setup",
      "30 days post-launch support, minor updates",
    ],
  },
  {
    name: "React Premium",
    price: "£150",
    note: "Website Package",
    tone: "from-amber-400/25 to-amber-400/5",
    ring: "ring-amber-400/60",
    link: "/checkout?service=web-react-premium",
    features: [
      "10-page React website",
      "Comprehensive logo package (3 concepts, unlimited revisions)",
      "Complete brand style guide",
      "Advanced animations and interactive elements",
      "CMS integration for easy content updates",
      "Full blog functionality with categories and tags",
      "Booking/appointment system integration",
      "Customer testimonials section with carousel",
      "FAQ section with accordion + Social media integration",
      "Third-party integrations (Mailchimp, Google Maps, social feeds)",
      "Advanced SEO, schema markup and sitemap + Contact form with file upload",
      "Performance optimization + 60 days post-launch support",
    ],
  },
  {
    name: "Basic E-Commerce React",
    price: "£90",
    note: "E-Commerce Website Package",
    tone: "from-fuchsia-500/25 to-fuchsia-500/5",
    ring: "ring-fuchsia-400/60",
    link: "/checkout?service=web-react-ecommerce-basic",
    features: [
      "Multi-page React website (Home, Shop, About, Services, Contact)",
      "Product catalog (image, title, price, short description)",
      "Basic product detail page (no complex variants)",
      "Category & keyword search/filter",
      "Mobile-first responsive UI",
      "Custom brand-aligned e-commerce theme",
      "Basic logo design with 1 revision",
      "Inquiry-based contact form (no checkout)",
      "Instagram, Facebook & WhatsApp integration",
      "Basic SEO (meta tags, titles, Open Graph)",
      "Free deployment (Netlify/Vercel)",
      "14 days post-launch support",
    ],
  },
];


const pricingSections: PricingSection[] = [
  {
    title: "UK Company Formation",
    tag: "UK Formation",
    intro: "All-inclusive UK LTD incorporation packages with Companies House registration.",
    packages: ukLtdPackages,
    cols: 4,
  },
  {
    title: "UK Address Services",
    tag: "UK Address",
    intro: "Three address solutions to keep your UK company professionally registered and compliant.",
    packages: addressPackages,
    cols: 3,
  },
  {
    title: "USA LLC Formation",
    tag: "USA Formation",
    intro: "Form your U.S. LLC with EIN, business address, and full digital documentation.",
    packages: usaLlcPackages,
    cols: 3,
  },
  {
    title: "USA Add-on Services",
    tag: "USA Services",
    intro: "Standalone U.S. tax & compliance services for existing or new LLCs.",
    packages: usaExtraPackages,
    cols: 4,
  },
  {
    title: "UK Compliance Services",
    tag: "UK Compliance",
    intro: "Stay fully compliant with Companies House and HMRC — every filing handled for you.",
    packages: compliancePackages,
    cols: 3,
  },
  {
    title: "Banking & Payment Solutions",
    tag: "Banking & Payments",
    intro: "Account creation & setup for leading payment gateways and business banks.",
    packages: bankingPackages,
    cols: 3,
  },
];

const colsClass = (n: 2 | 3 | 4 = 3) =>
  n === 4
    ? "grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
    : n === 3
    ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
    : "grid sm:grid-cols-2 gap-6";

const PackageCard = ({ p }: { p: DetailPkg }) => (
  <div
    className={`relative glass rounded-3xl p-7 ring-1 ${p.ring} bg-gradient-to-b ${p.tone} flex flex-col`}
  >
    {p.badge && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-brand text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
        {p.badge}
      </div>
    )}
    <h3 className="text-xl font-bold mb-2 leading-snug">{p.name}</h3>
    <div className="mb-1 text-[10px] opacity-70 uppercase tracking-widest">Starting from</div>
    <div className="text-4xl font-bold text-gradient mb-1">{p.price}</div>
    {p.note && <div className="text-xs opacity-70 mb-4">{p.note}</div>}
    <ul className="space-y-2.5 mb-6 mt-3 flex-1">
      {p.features.map((f) => (
        <li key={f} className="flex gap-2.5 text-sm">
          <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
          <span className="opacity-90 leading-snug">{f}</span>
        </li>
      ))}
    </ul>
    <Button asChild variant="hero" className="rounded-full w-full mt-auto">
      <Link to={p.link ?? "/contact"}>
        Get Started <ArrowRight className="w-4 h-4" />
      </Link>
    </Button>
  </div>
);

export const Pricing = () => {
  useEffect(() => {
    setMeta(
      "Pricing & Packages 2026 | Digiformation",
      "Transparent 2026 pricing for UK LTD & US LLC formation, business banking and annual compliance. Fixed fees, no hidden costs.",
      "UK LTD pricing 2026, US LLC formation cost, business banking packages, Companies House fees, Digiformation pricing, non resident formation cost worldwide"
    );
  }, []);

  return (
    <Layout>
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">Packages</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight">
              Our <em className="not-italic text-gradient">Packages</em>
            </h1>
            <p className="mt-4 text-base md:text-lg opacity-85">
              Fixed fees, no hidden add-ons.
            </p>
          </div>
        </div>
      </section>

      {pricingSections
        .filter((s) => s.packages.length > 0)
        .map((s, gi) => (
          <section
            key={s.title}
            id={s.tag.toLowerCase().replace(/\s*&\s*/g, "-").replace(/\s+/g, "-")}
            className={`py-10 ${gi % 2 === 1 ? "bg-muted/20" : ""} border-t border-border/60 scroll-mt-28`}
          >
            <div className="container mx-auto px-4 max-w-7xl">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] uppercase tracking-[0.22em] opacity-70 font-mono">
                  {s.tag}
                </span>
              </div>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{s.title}</h2>
                <p className="opacity-80 max-w-md md:text-right">{s.intro}</p>
              </div>
              <div className={colsClass(s.cols)}>
                {s.packages.map((p) => (
                  <PackageCard key={p.name + p.price} p={p} />
                ))}
              </div>
            </div>
          </section>
        ))}

    </Layout>
  );
};

/* ---------- FAQ ---------- */
type FaqItem = { q: string; a: string; category: string };

const faqList: FaqItem[] = [
  // 📍 Company Formation
  {
    category: "Company Formation",
    q: "What are the requirements for UK LTD company formation?",
    a: "To register a UK LTD company, you need: ID Card or Passport picture, Live Selfie, Holding Selfie, Home Address, Residential Bank Statement, Email Address, Company Name, Business Category, Business Subcategory, and SIC Codes (Standard Industrial Classification Codes). These details are required for identity verification and to define the nature of your business during company registration.",
  },
  {
    category: "Company Formation",
    q: "What is the processing time for UK company formation?",
    a: "The standard processing time, including ID verification, is 3 to 5 business days.",
  },
  {
    category: "Company Formation",
    q: "In which US states can I register my LLC through Digiformation Ltd?",
    a: "You can register your LLC in the following U.S. states: Montana, Wyoming, Texas, Florida, New Mexico, Colorado, Missouri, Kentucky and more.",
  },
  {
    category: "Company Formation",
    q: "Can foreign nationals register a UK company?",
    a: "Yes. Digiformation Ltd supports international clients with incorporation, ID verification, and compliance guidance.",
  },

  // 📍 Address & Documentation
  {
    category: "Address & Documentation",
    q: "Can I receive documents on your registered office address?",
    a: "Yes, we provide a physical UK registered office address for one year along with a secure client portal. All official documents such as UTR Number, Authentication Code and Activation Code are received at this address and uploaded to your portal. Timeline: Authentication Code 7–10 days, Activation Code 7–10 days, UTR Number 15–20 days. Documents are shared via portal, email, or WhatsApp. Scanned copies are free, while physical deliveries (e.g., bank cards) may include additional charges.",
  },
  {
    category: "Address & Documentation",
    q: "Is the registered office address a physical UK address?",
    a: "Yes, it is a real physical UK address used for official company registration and government correspondence.",
  },
  {
    category: "Address & Documentation",
    q: "What is the difference between Registered Office Address, Correspondence Address, and Home Address?",
    a: "Registered Office Address: official company address used for government communication. Correspondence Address: used for general communication (optional). Home Address: your personal address used for verification.",
  },
  {
    category: "Address & Documentation",
    q: "Can I use my friend's UK address for company registration?",
    a: "Yes, you can use your friend's address if they can reliably receive important documents like the Authentication Code, UTR Number and Activation Code. Otherwise, you can use our professional registered address service.",
  },
  {
    category: "Address & Documentation",
    q: "What if I don't have access to my registered address or authentication code?",
    a: "No problem — we provide a complete solution. You only need your Company Number, and we will provide a new registered address and update your company details with Companies House. Service Charges: £100.",
  },

  // 📍 ID Verification
  {
    category: "ID Verification",
    q: "What are the requirements for ID verification?",
    a: "ID Verification Requirements: ID Card or Passport picture, Holding Selfie, Live Selfie, Home Address, Residential Bank Statement, and Email Address.",
  },
  {
    category: "ID Verification",
    q: "How long does ID verification take?",
    a: "ID verification typically takes 24 to 48 business hours.",
  },
  {
    category: "ID Verification",
    q: "Can ID verification be completed using a Pakistani ID card, or is a passport required?",
    a: "Yes, ID verification for UK company formation can be completed using any of the following government-issued documents:\n\n1. Pakistani National ID Card (CNIC)\n2. Passport\n3. Driving License\n\nPlease note: For UK business bank account opening, a Passport or Driving License is mandatory — a CNIC alone is not accepted by most banks.",
  },

  // 📍 Banking & Accounts
  {
    category: "Banking & Accounts",
    q: "What are the requirements for UK business bank accounts?",
    a: "General requirements for most UK business bank accounts: UK Company Number, UK Phone Number, Company Website, Passport or Driving License, Live Selfie Verification, and a Gmail ID & Password (you can provide one or we can arrange it). Important: most banks require a passport and live selfie verification. Wise does NOT require live selfie verification, and Payoneer can be created without a passport.",
  },
  {
    category: "Banking & Accounts",
    q: "I want to open a UK bank account — what do I need?",
    a: "To open a UK business bank account, you must first have a UK registered company. Then you'll need a Passport or Driving License, your company details, and verification documents. We provide complete guidance and support throughout the process.",
  },
  {
    category: "Banking & Accounts",
    q: "Can I open a bank account using a UK resident's identity?",
    a: "We do not deal with physical banks. However, for virtual banks that do not support Pakistani identity, we can assist if a UK resident completes ID verification and the account is created under their name.",
  },

  // 📍 Access & Support
  {
    category: "Access & Support",
    q: "How can I access my company?",
    a: "You will receive access to a secure client portal where you can view and download documents, access company details, and receive ongoing updates.",
  },
  {
    category: "Access & Support",
    q: "Does Digiformation Ltd provide advisory services after registration?",
    a: "Yes, we offer continuous support for compliance, tax filing, banking and business growth solutions.",
  },
];

const faqCategories = [
  "All",
  "Company Formation",
  "Address & Documentation",
  "ID Verification",
  "Banking & Accounts",
  "Access & Support",
];

export const FAQ = () => {
  const [open, setOpen] = useState<string | null>(faqList[0]?.q ?? null);
  const [activeCat, setActiveCat] = useState<string>("All");

  useEffect(() => {
    setMeta(
      "UK & US Company Formation FAQ 2026 | Digiformation",
      "Top 2026 answers on UK LTD & US LLC formation, Companies House ID verification, EIN, ITIN, BOI report, VAT and business banking.",
      "UK company formation FAQ 2026, US LLC FAQ, Companies House ID verification FAQ, EIN ITIN BOI FAQ, non resident formation questions worldwide, UK registered office address FAQ, SIC codes FAQ"
    );
    return injectJsonLd("faq-jsonld", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqList.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }, []);

  const visibleFaqs = activeCat === "All" ? faqList : faqList.filter((f) => f.category === activeCat);

  return (
    <Layout>
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="container mx-auto px-4 py-12 md:py-14 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">FAQ</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight">
              Frequently asked <em className="not-italic text-gradient">questions</em>
            </h1>
            <p className="mt-8 text-lg md:text-xl leading-relaxed opacity-90">
              Answers to the most common questions about UK & US company formation, registered office address, ID verification, banking and ongoing support.
            </p>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex flex-wrap gap-2 mb-8">
            {faqCategories.map((cat) => {
              const active = activeCat === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCat(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.14em] transition-all border ${
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-glow"
                      : "bg-transparent border-border/60 hover:border-primary/60 opacity-80 hover:opacity-100"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            {visibleFaqs.map((f) => {
              const isOpen = open === f.q;
              return (
                <button
                  key={f.q}
                  type="button"
                  onClick={() => setOpen(isOpen ? null : f.q)}
                  className="w-full text-left glass rounded-2xl p-6 transition-all hover:shadow-elegant"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.18em] opacity-60 mb-2">{f.category}</div>
                      <h3 className="font-display text-lg md:text-xl font-semibold leading-snug">
                        {f.q}
                      </h3>
                    </div>
                    <ChevronDown className={`w-5 h-5 mt-1 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                  {isOpen && <p className="mt-4 opacity-85 leading-relaxed whitespace-pre-line">{f.a}</p>}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Still have questions?</h2>
          <p className="opacity-80 mb-8">Our specialists are one message away.</p>
          <Button asChild variant="hero" size="lg" className="rounded-full">
            <Link to="/contact">Contact Us <ArrowRight className="w-4 h-4" /></Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

/* ---------- Blog ---------- */
const blogSections = [
  {
    h: "1. Choosing the Right Type of Company",
    body: (
      <>
        <p className="mb-3">The first step in starting a UK business is deciding on the company type. Most entrepreneurs choose:</p>
        <ul className="space-y-2 list-disc pl-5 opacity-90">
          <li><strong>Private Limited Company (LTD)</strong> – The most common type, limiting personal liability.</li>
          <li><strong>Limited Liability Partnership (LLP)</strong> – Suitable for partnerships wanting limited liability.</li>
          <li><strong>Public Limited Company (PLC)</strong> – For larger businesses planning to offer shares publicly.</li>
          <li><strong>Sole Trader</strong> – Ideal for individual business owners.</li>
        </ul>
        <p className="mt-3">Selecting the right company type impacts taxation, liability, and administrative requirements. Digiformation Ltd helps you choose the best structure based on your goals.</p>
      </>
    ),
  },
  {
    h: "2. Registration Process",
    body: (
      <>
        <p className="mb-3">Registering a UK company involves several key steps:</p>
        <ol className="space-y-2 list-decimal pl-5 opacity-90">
          <li><strong>Choose a Company Name</strong> – Must be unique and comply with UK naming rules.</li>
          <li><strong>Provide Director & Shareholder Details</strong> – Include valid ID and contact information.</li>
          <li><strong>Prepare a Registered Address</strong> – This is your company's official correspondence address.</li>
          <li><strong>Submit Incorporation Documents</strong> – Companies House requires a Memorandum and Articles of Association.</li>
          <li><strong>Receive Company Number & UTR</strong> – Upon approval you get your registration number and UTR from HMRC.</li>
        </ol>
        <p className="mt-3">Our team ensures each step is completed correctly, avoiding delays or rejection.</p>
      </>
    ),
  },
  {
    h: "3. ID Verification & Compliance",
    body: <p>All company directors and shareholders must undergo ID verification. This ensures compliance with anti-money-laundering regulations. Digiformation Ltd securely handles verification, helping you meet all legal obligations without hassle.</p>,
  },
  {
    h: "4. Understanding Taxes & Annual Filings",
    body: (
      <>
        <p className="mb-3">Once registered, UK companies must comply with tax obligations:</p>
        <ul className="space-y-2 list-disc pl-5 opacity-90">
          <li><strong>Corporation Tax</strong> – Paid annually based on company profits.</li>
          <li><strong>VAT</strong> – Required if turnover exceeds the VAT threshold.</li>
          <li><strong>PAYE</strong> – For employees' salaries and national-insurance contributions.</li>
          <li><strong>Annual Confirmation Statement</strong> – Confirms company information is up to date with Companies House.</li>
        </ul>
        <p className="mt-3">Digiformation Ltd provides support and reminders for timely filings, helping you avoid penalties.</p>
      </>
    ),
  },
  {
    h: "5. Bank Accounts & Payoneer Integration",
    body: <p>Having a UK business bank account or Payoneer account is essential for international transactions. We guide clients on opening accounts, managing payments and integrating payment solutions for smooth operations.</p>,
  },
  {
    h: "6. Common Mistakes to Avoid",
    body: (
      <ul className="space-y-2 list-disc pl-5 opacity-90">
        <li>Incorrectly registering company type</li>
        <li>Missing ID verification or documentation</li>
        <li>Ignoring annual tax or confirmation-statement deadlines</li>
        <li>Using an invalid company name or address</li>
      </ul>
    ),
  },
  {
    h: "7. Ongoing Support & Advisory Services",
    body: (
      <>
        <p className="mb-3">Our services don't end at registration. We provide:</p>
        <ul className="space-y-2 list-disc pl-5 opacity-90">
          <li>Compliance and regulatory guidance</li>
          <li>Tax-filing assistance</li>
          <li>Business growth strategies</li>
          <li>International client support</li>
        </ul>
      </>
    ),
  },
];

export const Blog = () => {
  useEffect(() => {
    setMeta(
      "Digiformation Blog 2026 — UK LTD & US LLC Guides",
      "Expert 2026 guides for non-resident founders: UK LTD & US LLC formation, Stripe, PayPal, Wise, Tide, Amazon FBA, Shopify and compliance.",
      "UK LTD blog 2026, US LLC guide, Stripe non resident, PayPal worldwide, Payoneer Wise WorldFirst, Amazon FBA UK, Shopify worldwide, ecommerce formation blog"
    );
    return injectJsonLd("blog-jsonld", {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: "How to Start and Manage Your UK Company Successfully",
      author: { "@type": "Organization", name: "Digiformation Ltd" },
      publisher: { "@type": "Organization", name: "Digiformation Ltd" },
      datePublished: "2026-01-01",
    });
  }, []);

  return (
    <Layout>
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="container mx-auto px-4 py-12 md:py-14 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">Blog · Featured Post</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight">
              How to Start and Manage Your UK Company <em className="not-italic text-gradient">Successfully</em>
            </h1>
            <p className="mt-8 text-lg md:text-xl leading-relaxed opacity-90">
              Starting a company in the UK can be rewarding — but it comes with responsibilities and legal requirements. Whether you're a local entrepreneur or an international investor, this guide walks you through every step.
            </p>
          </div>
        </div>
      </section>

      <article className="py-16">
        <div className="container mx-auto px-4 max-w-3xl space-y-10">
          {blogSections.map((s) => (
            <section key={s.h}>
              <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-4">{s.h}</h2>
              <div className="opacity-90 leading-relaxed">{s.body}</div>
            </section>
          ))}

          <section className="glass rounded-2xl p-8 mt-10">
            <h3 className="font-display text-xl font-semibold mb-4">Helpful links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/faq" className="text-primary hover:underline">→ Read our FAQ for common questions</Link></li>
              <li><Link to="/pricing" className="text-primary hover:underline">→ See transparent pricing for every service</Link></li>
              <li><Link to="/contact" className="text-primary hover:underline">→ Contact us for a free consultation</Link></li>
            </ul>
          </section>
        </div>
      </article>
    </Layout>
  );
};

/* ---------- ClientArea ---------- */
export const ClientArea = () => (
  <SimplePage
    eyebrow="Client Area"
    title="Your dedicated client portal"
    description="Sign in to track applications, upload documents, and access all your services in one secure place."
  />
);

/* ---------- Web Development ---------- */
const webServices = [
  { icon: Code2, title: "Custom Website Design & Development", desc: "Bespoke, conversion-focused websites built to reflect your brand and drive measurable results." },
  { icon: ShoppingBag, title: "E-commerce (Shopify)", desc: "Beautiful, high-performance Shopify stores with conversion-optimised product pages and checkout." },
  { icon: LayoutIcon, title: "Landing Page Design & Development", desc: "Standalone landing pages for product launches, lead capture and service-specific offers." },
  { icon: RefreshCw, title: "Website Redesign & Migration", desc: "Modernise an outdated site or migrate to a faster, safer stack with zero SEO loss." },
  { icon: LifeBuoy, title: "Ongoing Maintenance & Support", desc: "Updates, security patches, performance tuning and content edits — all handled for you." },
];

const webProcess = [
  { icon: Search, label: "Discovery" },
  { icon: PenTool, label: "Wireframing" },
  { icon: Sparkles, label: "Design" },
  { icon: Code2, label: "Development" },
  { icon: TestTube, label: "Testing" },
  { icon: Rocket, label: "Launch" },
  { icon: Wrench, label: "Support" },
];

const techStack = ["WordPress", "Shopify", "React", "Next.js", "Figma", "Tailwind CSS", "Vite", "TypeScript"];

const webFaqs = [
  { q: "How long does a website take?", a: "A standard business website takes 4–6 weeks. E-commerce or custom builds typically take 8–12 weeks depending on scope." },
  { q: "What CMS should I use?", a: "We recommend WordPress for content-heavy sites, Shopify for e-commerce, and headless React/Next.js when you need maximum performance and flexibility." },
  { q: "What about hosting?", a: "We can host on Vercel, Netlify, or your preferred provider. We handle SSL, CDN configuration, and ongoing performance monitoring." },
  { q: "Will my site be SEO-ready?", a: "Yes. Every site we build ships with semantic HTML, schema markup, optimised meta tags, sitemap.xml and Core Web Vitals tuning." },
  { q: "Do you offer ongoing support?", a: "Absolutely — choose from monthly maintenance plans covering updates, backups, security patches and content edits." },
];

export const WebDevelopment = () => {
  const [open, setOpen] = useState<number | null>(0);

  useEffect(() => {
    setMeta(
      "Business Website Development 2026 — Shopify, WordPress & Custom Web Design (Worldwide)",
      "Conversion-focused business website development in 2026 — Shopify, WooCommerce, WordPress, custom React builds, landing pages and ongoing support. SEO-ready websites for founders in UK, USA, Pakistan, India, UAE & worldwide.",
      "business website development 2026, Shopify development, WordPress design, custom web development, ecommerce website worldwide, conversion landing pages"
    );
    return injectJsonLd("web-faq-jsonld", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: webFaqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }, []);

  return (
    <Layout>
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-14 items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-3 mb-4">
                <span className="text-xs uppercase tracking-[0.18em] font-semibold">Web Design & Development</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-[1.05] tracking-tight">
                Websites that <em className="not-italic text-gradient">convert</em>
              </h1>
              <p className="mt-4 text-base md:text-lg opacity-90">
                Fast, modern websites & Shopify stores. Fixed prices, no hidden fees.
              </p>
              <Button asChild variant="hero" size="lg" className="rounded-full mt-6">
                <Link to="/contact">Request a Free Quote <ArrowRight className="w-4 h-4" /></Link>
              </Button>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative rounded-2xl overflow-hidden glass shadow-elegant aspect-[4/3]">
                <img src={heroWeb} alt="Business website development — Shopify, WordPress and custom React builds for global founders" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-tr from-background/40 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Packages */}
      <section className="py-12 md:py-16 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] uppercase tracking-[0.22em] opacity-70 font-mono">Packages</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Web Development Packages</h2>
            <p className="opacity-80 max-w-md md:text-right">
              Pick the package that fits — Shopify stores or custom React websites. Fixed prices, no hidden fees.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {webDevPackages.map((p) => (
              <PackageCard key={p.name + p.price} p={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-10 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <span className="text-[10px] uppercase tracking-[0.22em] opacity-70 font-mono">Services</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-3">Our web services</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {webServices.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass rounded-2xl p-6 hover:-translate-y-1 transition-transform">
                <Icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-display text-lg font-semibold mb-2">{title}</h3>
                <p className="text-sm opacity-85 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-10 bg-muted/20 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <span className="text-[10px] uppercase tracking-[0.22em] opacity-70 font-mono">Process</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-3">Our design process</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {webProcess.map(({ icon: Icon, label }) => (
              <div key={label} className="glass rounded-2xl p-5 text-center">
                <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-sm font-semibold">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio placeholder */}
      <section className="py-10 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <span className="text-[10px] uppercase tracking-[0.22em] opacity-70 font-mono">Portfolio</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-3">Selected work</h2>
            <p className="opacity-80 mt-3">A glimpse of recent projects. Full case studies available on request.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { tag: "E-commerce", title: "Shopify storefront — fashion brand", metric: "+212% conversion lift" },
              { tag: "SaaS", title: "Marketing site — fintech startup", metric: "1.2s LCP, 98 Lighthouse" },
              { tag: "Migration", title: "WordPress → Next.js migration", metric: "0% SEO traffic loss" },
            ].map((p) => (
              <div key={p.title} className="glass rounded-2xl p-6">
                <div className="text-[10px] uppercase tracking-[0.18em] opacity-70 mb-2">{p.tag}</div>
                <h3 className="font-display text-lg font-semibold mb-3">{p.title}</h3>
                <div className="text-sm text-primary font-semibold">{p.metric}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="py-10 bg-muted/20 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-10 max-w-2xl">
            <span className="text-[10px] uppercase tracking-[0.22em] opacity-70 font-mono">Tech Stack</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-3">Modern, proven tools</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {techStack.map((t) => (
              <span key={t} className="glass rounded-full px-5 py-2 text-sm font-semibold">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-10 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="mb-10">
            <span className="text-[10px] uppercase tracking-[0.22em] opacity-70 font-mono">FAQ</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-3">Web design FAQ</h2>
          </div>
          <div className="space-y-3">
            {webFaqs.map((f, i) => {
              const isOpen = open === i;
              return (
                <button
                  key={f.q}
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full text-left glass rounded-2xl p-6 transition-all hover:shadow-elegant"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-display text-lg font-semibold">{f.q}</h3>
                    <ChevronDown className={`w-5 h-5 mt-1 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                  {isOpen && <p className="mt-4 opacity-85 leading-relaxed">{f.a}</p>}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to build?</h2>
          <p className="opacity-80 mb-8">Tell us about your project and get a free quote within 24 hours.</p>
          <Button asChild variant="hero" size="lg" className="rounded-full">
            <Link to="/contact">Start Your Project <ArrowRight className="w-4 h-4" /></Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

/* ---------- Privacy & Terms (combined, full text) ---------- */
const LegalSection = ({
  num,
  title,
  children,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
}) => (
  <section className="mb-8">
    <h3 className="font-display text-xl md:text-2xl font-bold tracking-tight mb-3">
      <span className="text-primary mr-2">{num}.</span>
      {title}
    </h3>
    <div className="opacity-90 leading-relaxed space-y-2">{children}</div>
  </section>
);

export const Privacy = () => {
  useEffect(() => {
    setMeta(
      "Privacy Policy & Terms of Service — Digiformation Ltd (GDPR & UK DPA Compliant)",
      "Read Digiformation Ltd's GDPR & UK Data Protection Act compliant Privacy Policy and Terms of Service. How we protect client data during UK LTD, US LLC and banking services worldwide.",
      "Digiformation privacy policy, GDPR privacy, UK DPA compliance, terms of service company formation, data protection worldwide"
    );
  }, []);

  return (
    <Layout>
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="container mx-auto px-4 py-10 md:py-12 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 mb-5">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">Legal · Last updated 2026</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight">
              Privacy Policy & <em className="not-italic text-gradient">Terms of Service</em>
            </h1>
            <p className="mt-6 text-lg leading-relaxed opacity-90 max-w-2xl">
              How Digiformation Ltd collects, uses and protects your data — and the terms governing the use of our services.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-8">Privacy Policy</h2>

          <LegalSection num="1" title="Introduction">
            <p>Digiformation Ltd ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store and protect your personal information when you use our website and services related to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>UK LTD Company Registration</li>
              <li>US LLC Formation</li>
              <li>Registered Office & Business Address Services</li>
              <li>Annual Filing, ID Verification & Compliance Support</li>
            </ul>
            <p className="mt-2">By using our website, you agree to this policy.</p>
          </LegalSection>

          <LegalSection num="2" title="Information We Collect">
            <p><strong>Personal Information:</strong> name, email, phone/WhatsApp, address, passport/ID (for verification), company details.</p>
            <p><strong>Business Information:</strong> company name, shareholders, directors, registered address, nature of business.</p>
            <p><strong>Technical Data:</strong> IP address, browser type, device info, cookies, pages visited.</p>
          </LegalSection>

          <LegalSection num="3" title="How We Use Your Information">
            <ul className="list-disc pl-5 space-y-1">
              <li>Register and manage your company</li>
              <li>Process ID verification</li>
              <li>Provide compliance & annual filing services</li>
              <li>Respond to inquiries & support</li>
              <li>Improve our website & services</li>
              <li>Meet legal and regulatory requirements</li>
            </ul>
          </LegalSection>

          <LegalSection num="4" title="Data Protection & Security">
            <p>We implement secure systems and encryption to protect your data. Only authorised staff can access sensitive information.</p>
          </LegalSection>

          <LegalSection num="5" title="Data Sharing">
            <p>We do not sell or rent your data. We may share limited information with:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Government authorities (Companies House, IRS, etc.)</li>
              <li>Payment processors</li>
              <li>Legal or compliance partners</li>
            </ul>
            <p>(Only when required to deliver services.)</p>
          </LegalSection>

          <LegalSection num="6" title="Cookies">
            <p>Our website uses cookies to improve user experience, track website performance and remember preferences. You may disable cookies from your browser settings.</p>
          </LegalSection>

          <LegalSection num="7" title="Your Rights">
            <ul className="list-disc pl-5 space-y-1">
              <li>Request access to your data</li>
              <li>Ask for correction or deletion</li>
              <li>Withdraw consent</li>
              <li>Request data portability</li>
            </ul>
          </LegalSection>

          <LegalSection num="8" title="Contact for Privacy">
            <p>📧 Email: <a className="text-primary hover:underline" href="mailto:info@digiformation.uk">info@digiformation.uk</a></p>
            <p>📲 WhatsApp: +92 316 446 7464</p>
          </LegalSection>
        </div>
      </section>

      {/* Terms */}
      <section className="py-16 bg-muted/20 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-8">Terms of Service</h2>

          <LegalSection num="1" title="Services">
            <p>Digiformation Ltd provides:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>UK LTD & US LLC Registration</li>
              <li>Address Services</li>
              <li>Annual Filings</li>
              <li>ID Verification</li>
              <li>Business Support Services</li>
            </ul>
            <p className="mt-2">We are not a law firm or tax advisor. We provide administrative and filing assistance only.</p>
          </LegalSection>

          <LegalSection num="2" title="User Responsibilities">
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide accurate information</li>
              <li>Not use our services for illegal purposes</li>
              <li>Complete ID verification when required</li>
            </ul>
          </LegalSection>

          <LegalSection num="3" title="Payments & Refunds">
            <ul className="list-disc pl-5 space-y-1">
              <li>All fees must be paid in advance</li>
              <li>Registration fees are non-refundable once processing begins</li>
              <li>Service charges are non-refundable after submission to authorities</li>
            </ul>
          </LegalSection>

          <LegalSection num="4" title="Processing Time">
            <p>Timeframes depend on government authorities. We are not responsible for delays caused by third parties.</p>
          </LegalSection>

          <LegalSection num="5" title="Limitation of Liability">
            <p>Digiformation Ltd is not liable for government rejections, legal/tax penalties or business losses.</p>
          </LegalSection>

          <LegalSection num="6" title="Account Termination">
            <p>We may suspend services if false information is provided, the service is misused, or laws are violated.</p>
          </LegalSection>

          <LegalSection num="7" title="Changes to Terms">
            <p>We may update this policy at any time. Continued use of our website means you accept the changes.</p>
          </LegalSection>

          <div className="mt-10 text-center">
            <Button asChild variant="hero" size="lg" className="rounded-full">
              <Link to="/contact">Contact Us <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

// Terms route reuses the same combined legal page (anchor below Privacy).
export const Terms = Privacy;
