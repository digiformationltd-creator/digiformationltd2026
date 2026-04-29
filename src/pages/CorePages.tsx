import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

/* ---------- helpers ---------- */
const setMeta = (title: string, description: string) => {
  document.title = title;
  const set = (n: string, c: string) => {
    let el = document.querySelector(`meta[name="${n}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", n);
      document.head.appendChild(el);
    }
    el.setAttribute("content", c);
  };
  set("description", description);
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
  service: z.string().trim().min(2, "Please choose a service"),
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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMeta(
      "Contact Digiformation Ltd – UK Company Formation & Business Services",
      "Contact Digiformation Ltd for UK LTD & LLC formation, address services, ID verification and annual compliance. Reach us via email, WhatsApp or our inquiry form."
    );
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Please check the form.");
      return;
    }
    setSubmitting(true);
    const text =
      `Hello Digiformation,%0A%0A` +
      `Name: ${encodeURIComponent(form.fullName)}%0A` +
      `Email: ${encodeURIComponent(form.email)}%0A` +
      `Country: ${encodeURIComponent(form.country)}%0A` +
      `Service: ${encodeURIComponent(form.service)}%0A%0A` +
      `${encodeURIComponent(form.message)}`;
    window.open(`https://wa.me/921644674644?text=${text}`, "_blank", "noopener,noreferrer");
    toast.success("Opening WhatsApp — we'll reply within one business day.");
    setSubmitting(false);
  };

  return (
    <Layout>
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="container mx-auto px-4 py-24 md:py-28 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="h-px w-7 bg-primary" />
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">Contact</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight">
              Get in touch with <em className="not-italic text-gradient">Digiformation</em>
            </h1>
            <p className="mt-8 text-lg md:text-xl leading-relaxed opacity-90">
              We're here to help you start, manage and grow your business in the UK and USA.
              Whether you need a new company, address services or compliance support — our team is ready.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 max-w-6xl grid lg:grid-cols-5 gap-10">
          {/* Quick info */}
          <aside className="lg:col-span-2 space-y-5">
            <a href="mailto:Info@digiformation.uk" className="glass rounded-2xl p-7 flex gap-4 hover:-translate-y-1 transition-transform">
              <Mail className="w-6 h-6 text-primary mt-1" />
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] mb-1 opacity-80">Business Email</div>
                <div className="font-display text-xl font-semibold">Info@digiformation.uk</div>
              </div>
            </a>
            <a href="https://wa.me/921644674644" target="_blank" rel="noopener noreferrer" className="glass rounded-2xl p-7 flex gap-4 hover:-translate-y-1 transition-transform">
              <MessageCircle className="w-6 h-6 text-primary mt-1" />
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] mb-1 opacity-80">WhatsApp (Fast Support)</div>
                <div className="font-display text-xl font-semibold">+92 164 467 464</div>
              </div>
            </a>
            <div className="glass rounded-2xl p-7 flex gap-4">
              <Clock className="w-6 h-6 text-primary mt-1" />
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] mb-1 opacity-80">Business Hours</div>
                <div className="font-display text-base font-semibold leading-relaxed">
                  Mon – Sat: 10:00 AM – 11:00 PM<br />
                  Sunday: Closed
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-7">
              <div className="text-[10px] uppercase tracking-[0.18em] mb-3 opacity-80">Why Digiformation?</div>
              <ul className="space-y-2 text-sm">
                {[
                  "Fast UK & USA company registration",
                  "Transparent pricing — no hidden fees",
                  "Dedicated customer support",
                  "Complete compliance & documentation",
                  "Trusted by 300+ international clients",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 glass rounded-2xl p-8 space-y-5">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Send us a message</h2>
              <p className="opacity-80 text-sm">Fill the form — we'll reply via WhatsApp or email within one business day.</p>
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
              <Select value={form.service} onValueChange={(v) => setForm({ ...form, service: v })}>
                <SelectTrigger id="service"><SelectValue placeholder="Choose a service" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UK LTD Formation">UK LTD Formation</SelectItem>
                  <SelectItem value="LLC Formation">USA LLC Formation</SelectItem>
                  <SelectItem value="Address Services">Address Services</SelectItem>
                  <SelectItem value="ID Verification">ID Verification</SelectItem>
                  <SelectItem value="Annual Filing">Annual Filing</SelectItem>
                  <SelectItem value="Company Changes">Company Changes</SelectItem>
                  <SelectItem value="Banking & Payments">Banking & Payments</SelectItem>
                  <SelectItem value="Web Development">Web Development</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="message">Your Message</Label>
              <Textarea id="message" rows={5} maxLength={1500} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
            </div>

            <Button type="submit" variant="hero" size="lg" className="rounded-full w-full sm:w-auto" disabled={submitting}>
              Get Free Consultation <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </section>
    </Layout>
  );
};

/* ---------- Pricing (kept) ---------- */
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
      { name: "PayPal Account Creation", price: "£20", link: "/banks-payment-solutions/paypal" },
      { name: "Payoneer Account Creation", price: "£20", link: "/banks-payment-solutions/payoneer" },
      { name: "WorldFirst Account Creation", price: "£20", link: "/banks-payment-solutions/worldfirst" },
      { name: "Stripe Account Creation", price: "£20", link: "/banks-payment-solutions/stripe" },
      { name: "Tide Account Creation", price: "£50", link: "/banks-payment-solutions/tide" },
      { name: "Sumup Account Creation", price: "£50", link: "/banks-payment-solutions/sumup" },
      { name: "Wise Account Creation", price: "£70", link: "/banks-payment-solutions/wise" },
      { name: "Zyla Account Creation", price: "£30", link: "/banks-payment-solutions/zyla" },
      { name: "Airwallex Account Creation", price: "£50", link: "/banks-payment-solutions/airwallex" },
      { name: "Mollie Account Creation", price: "£30", link: "/banks-payment-solutions/mollie" },
      { name: "Zionpe Account Creation", price: "£50", link: "/banks-payment-solutions/zionpe" },
      { name: "Wallester Account Creation", price: "£50", link: "/banks-payment-solutions/wallester" },
      { name: "Pingpong Account Creation", price: "£50", link: "/banks-payment-solutions/pingpong" },
    ],
  },
];

export const Pricing = () => {
  useEffect(() => {
    setMeta(
      "Transparent Pricing — UK & US Formation, Compliance & Banking | Digiformation",
      "All Digiformation pricing in one place — UK formation, compliance, USA company services and banking. Fixed fees, no hidden costs."
    );
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

/* ---------- FAQ ---------- */
const faqList = [
  {
    q: "In which US states can I register my LLC through Digiformation Ltd?",
    a: "You can register your LLC in the following U.S. states through Digiformation Ltd: Montana, Wyoming, Texas, Florida, New Mexico, Colorado, Missouri, Kentucky and more.",
  },
  {
    q: "How do I register a UK company online?",
    a: "We guide you step-by-step: choose company type, provide director/shareholder details, submit documents, and get your company incorporated with Companies House.",
  },
  {
    q: "What documents are required for UK company registration?",
    a: "Valid ID, proof of address, company name, director and shareholder details. Depending on the company type, you may need SIC codes or additional compliance documents.",
  },
  {
    q: "How do I verify my ID for UK company registration?",
    a: "Digiformation Ltd requires passport or national ID for verification. This is mandatory to comply with Companies House and anti-money laundering regulations.",
  },
  {
    q: "What is a UTR number and why is it important?",
    a: "A Unique Taxpayer Reference (UTR) is issued by HMRC to each company. It's used for tax filings, annual returns, and communication with HMRC.",
  },
  {
    q: "How often do I need to file taxes for my UK company?",
    a: "Annual Corporation Tax return must be filed within 12 months of the accounting period end. VAT, PAYE, and other filings may be required depending on your business.",
  },
  {
    q: "What is an annual confirmation statement?",
    a: "The confirmation statement (previously annual return) is a mandatory document filed yearly with Companies House to confirm company details are accurate.",
  },
  {
    q: "Can foreign nationals register a UK company?",
    a: "Yes. Digiformation Ltd supports international clients with incorporation, ID verification, and compliance guidance.",
  },
  {
    q: "Can I open a UK business bank account or Payoneer account?",
    a: "Yes. Digiformation Ltd assists in setting up Payoneer accounts and provides guidance for UK business bank accounts to handle international transactions.",
  },
  {
    q: "What are common mistakes when registering a UK company?",
    a: "Choosing the wrong company type, incorrect director/shareholder info, missing documents, and ignoring tax obligations. We guide clients to avoid these errors.",
  },
  {
    q: "How do I update company information after registration?",
    a: "You can update directors, shareholders, company address, and SIC codes via Companies House. Digiformation Ltd provides ongoing support for all updates.",
  },
  {
    q: "Does Digiformation Ltd provide advisory services after registration?",
    a: "Yes, we offer continuous support for compliance, tax filing, and business growth solutions.",
  },
];

export const FAQ = () => {
  const [open, setOpen] = useState<number | null>(0);

  useEffect(() => {
    setMeta(
      "UK Company FAQ – Digiformation Ltd | Registration, Taxes & Compliance",
      "Discover answers to common questions about UK company registration, taxes, compliance, ID verification, and business services offered by Digiformation Ltd."
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

  return (
    <Layout>
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="container mx-auto px-4 py-24 md:py-28 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="h-px w-7 bg-primary" />
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">FAQ</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight">
              Frequently asked <em className="not-italic text-gradient">questions</em>
            </h1>
            <p className="mt-8 text-lg md:text-xl leading-relaxed opacity-90">
              Answers to the most common questions about UK & US company formation, banking, compliance and ongoing support.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl space-y-3">
          {faqList.map((f, i) => {
            const isOpen = open === i;
            return (
              <button
                key={f.q}
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full text-left glass rounded-2xl p-6 transition-all hover:shadow-elegant"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-display text-lg md:text-xl font-semibold leading-snug">
                    {i + 1}. {f.q}
                  </h3>
                  <ChevronDown className={`w-5 h-5 mt-1 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </div>
                {isOpen && <p className="mt-4 opacity-85 leading-relaxed">{f.a}</p>}
              </button>
            );
          })}
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
      "UK Company Registration & Business Tips | Digiformation Ltd",
      "Learn how to register a UK company, comply with HMRC rules, verify your ID, and manage your business efficiently with Digiformation Ltd."
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
        <div className="container mx-auto px-4 py-24 md:py-28 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="h-px w-7 bg-primary" />
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
  { icon: LayoutIcon, title: "Landing Page Design & Development", desc: "Standalone landing pages engineered for ad campaigns and product launches." },
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
  { q: "How long does a website take?", a: "A standard marketing site takes 4–6 weeks. E-commerce or custom builds typically take 8–12 weeks depending on scope." },
  { q: "What CMS should I use?", a: "We recommend WordPress for content-heavy sites, Shopify for e-commerce, and headless React/Next.js when you need maximum performance and flexibility." },
  { q: "What about hosting?", a: "We can host on Vercel, Netlify, or your preferred provider. We handle SSL, CDN configuration, and ongoing performance monitoring." },
  { q: "Will my site be SEO-ready?", a: "Yes. Every site we build ships with semantic HTML, schema markup, optimised meta tags, sitemap.xml and Core Web Vitals tuning." },
  { q: "Do you offer ongoing support?", a: "Absolutely — choose from monthly maintenance plans covering updates, backups, security patches and content edits." },
];

export const WebDevelopment = () => {
  const [open, setOpen] = useState<number | null>(0);

  useEffect(() => {
    setMeta(
      "Web Design & Development Services UK | Digiformation Ltd",
      "Get a conversion-focused website from Digiformation Ltd. Custom design, WordPress, Shopify, landing pages & ongoing support. Request a free quote."
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
        <div className="container mx-auto px-4 py-24 md:py-28 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="h-px w-7 bg-primary" />
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">Web Design & Development</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight">
              Websites designed to <em className="not-italic text-gradient">convert</em>
            </h1>
            <p className="mt-8 text-lg md:text-xl leading-relaxed opacity-90">
              Conversion-focused websites that complement your digital marketing — built on modern stacks, optimised for SEO and engineered for speed.
            </p>
            <Button asChild variant="hero" size="lg" className="rounded-full mt-10">
              <Link to="/contact">Request a Free Quote <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <span className="text-[10px] uppercase tracking-[0.22em] opacity-70 font-mono">01 — Services</span>
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
      <section className="py-20 bg-muted/20 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <span className="text-[10px] uppercase tracking-[0.22em] opacity-70 font-mono">02 — Process</span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mt-3">Our design process</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {webProcess.map(({ icon: Icon, label }, i) => (
              <div key={label} className="glass rounded-2xl p-5 text-center">
                <div className="text-[10px] font-mono opacity-60 mb-2">0{i + 1}</div>
                <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-sm font-semibold">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio placeholder */}
      <section className="py-20 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-12 max-w-2xl">
            <span className="text-[10px] uppercase tracking-[0.22em] opacity-70 font-mono">03 — Portfolio</span>
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
      <section className="py-20 bg-muted/20 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-10 max-w-2xl">
            <span className="text-[10px] uppercase tracking-[0.22em] opacity-70 font-mono">04 — Tech Stack</span>
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
      <section className="py-20 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="mb-10">
            <span className="text-[10px] uppercase tracking-[0.22em] opacity-70 font-mono">05 — FAQ</span>
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
      "Digiformation Ltd | Privacy Policy & Terms of Service",
      "Read Digiformation Ltd's Privacy Policy and Terms of Service. Learn how we protect your data, handle company registration services, and ensure compliance."
    );
  }, []);

  return (
    <Layout>
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="container mx-auto px-4 py-20 md:py-24 relative">
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
            <p>📲 WhatsApp: +92 164 467 464</p>
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
