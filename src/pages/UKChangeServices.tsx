import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

type Card = {
  id: string;
  side: "left" | "right";
  title: string;
  price: string;
  description: string;
  requirements: string[];
};

const cards: Card[] = [
  {
    id: "name-change",
    side: "right",
    title: "Company Name Change",
    price: "£30",
    description: "Update your company name officially at Companies House with certificate and resolution document included.",
    requirements: ["Company Number (CRN)", "Company Authentication Code", "New Company Name"],
  },
  {
    id: "director-change",
    side: "left",
    title: "Director Change Only",
    price: "£10",
    description: "Change a director for your UK company. Simple, fast, Companies House updated.",
    requirements: ["Company Number (CRN)", "Company Authentication Code", "Director's Personal Code"],
  },
  {
    id: "director-id",
    side: "right",
    title: "Director Change + ID Verification",
    price: "£30",
    description: "Director change along with full ID verification including live selfie, passport/ID, and proof of address.",
    requirements: [
      "Company Number (CRN)",
      "Company Authentication Code",
      "Director's Personal Code",
      "Live Selfie",
      "Passport / ID Picture (can be combined)",
      "Residential Bank Statement (address proof)",
      "Registered Home Address",
      "Email Address",
    ],
  },
  {
    id: "address-change",
    side: "left",
    title: "Company Address Change",
    price: "£10",
    description: "Update your registered UK company address, valid for 1 year, includes email notifications and mail scanning if needed.",
    requirements: ["Company Number (CRN)", "Company Authentication Code", "New Address"],
  },
  {
    id: "residence-change",
    side: "right",
    title: "UK Country Residence Change",
    price: "£10",
    description: "Update your registered country of residence with full Companies House and HMRC compliance.",
    requirements: ["Company Number (CRN)", "Company Authentication Code", "New Country of Residence"],
  },
  {
    id: "sic-change",
    side: "left",
    title: "SIC Code Change",
    price: "£10",
    description: "Change your company's Standard Industrial Classification (SIC) code at Companies House.",
    requirements: ["Company Number (CRN)", "Company Authentication Code", "New SIC Code"],
  },
  {
    id: "shareholder-change",
    side: "right",
    title: "Shareholder Change",
    price: "£10",
    description: "Add or remove shareholders and update your UK company's ownership structure.",
    requirements: ["Company Number (CRN)", "Company Authentication Code", "Shareholder's Personal Code"],
  },
  {
    id: "psc-secretary",
    side: "left",
    title: "PSC / Secretary Change",
    price: "£10",
    description: "Appoint or remove Persons of Significant Control or Company Secretaries with full compliance.",
    requirements: ["Company Number (CRN)", "Company Authentication Code", "PSC / Secretary Personal Code"],
  },
];

const orderSchema = z.object({
  firstName: z.string().trim().min(1, "First name required").max(60),
  lastName: z.string().trim().min(1, "Last name required").max(60),
  companyName: z.string().trim().min(1, "Company name required").max(120),
  crn: z.string().trim().min(1, "CRN required").max(20),
  authCode: z.string().trim().min(1, "Auth code required").max(20),
  email: z.string().trim().email("Valid email required").max(255),
  phone: z.string().trim().min(5, "Phone required").max(30),
  notes: z.string().trim().max(1000).optional(),
});

const related = [
  { name: "Registered Office Address", path: "/uk-services/registered-office-address" },
  { name: "Director Service Address", path: "/uk-services/registered-office-address#director-service" },
  { name: "All Compliance Services", path: "/uk-compliance" },
];

const UKChangeServices = () => {
  const { toast } = useToast();
  const [selected, setSelected] = useState<string>("name-change");
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState("");

  useEffect(() => {
    document.title = "UK Company Services – Director, Name & Address Change | DiGiFormation LTD";
    const meta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    meta("description", "Update your UK company details quickly with Digiformation LTD. Director Change, Company Name Change, Address Change, and optional ID verification.");
    meta("keywords", "UK Company Services, Director Change UK, Company Address Change UK, Company Name Change UK, Registered Office Address UK");

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = window.location.href;
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const selectedCard = cards.find((c) => c.id === selected) ?? cards[0];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());
    const result = orderSchema.safeParse(data);
    if (!result.success) {
      toast({ title: "Please check your details", description: result.error.errors[0]?.message, variant: "destructive" });
      return;
    }
    setSubmittedName(String(data.firstName || ""));
    setSubmitted(true);
    toast({ title: "Order received", description: `We'll be in touch about your "${selectedCard.title}" request.` });
    (e.target as HTMLFormElement).reset();
    setTimeout(() => {
      document.getElementById("order-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
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
              <span className="h-px w-7 bg-primary" />
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">UK Company Services</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.02] tracking-tight">
              Address, Director & <em className="not-italic text-gradient">Company Changes</em>
            </h1>
            <p className="mt-8 text-lg md:text-xl leading-relaxed max-w-2xl opacity-90">
              Easily update your UK company details — Director, Company Name, and Registered Office Address. Fast, fully compliant, and approved by Companies House.
            </p>
            <div className="mt-10">
              <Button variant="hero" size="lg" className="rounded-full" onClick={() => scrollTo("packages")}>
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Zig-Zag cards */}
      <section id="packages" className="py-10 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-6xl space-y-8">
          {cards.map((c) => (
            <div
              key={c.id}
              className={`glass rounded-3xl p-8 md:p-10 grid md:grid-cols-2 gap-8 items-center ${c.side === "left" ? "md:[&>*:first-child]:order-2" : ""}`}
            >
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] opacity-70 mb-2">Package</div>
                <h3 className="text-3xl font-bold mb-2">{c.title}</h3>
                <div className="text-4xl font-bold text-gradient mb-4">{c.price}</div>
                <p className="opacity-90 mb-6">{c.description}</p>
                <Button
                  variant="hero"
                  className="rounded-full"
                  onClick={() => { setSelected(c.id); scrollTo("requirements"); }}
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="bg-muted/20 rounded-2xl p-6">
                <div className="text-[10px] uppercase tracking-[0.18em] opacity-70 mb-3">What we'll need</div>
                <ul className="space-y-2">
                  {c.requirements.map((r) => (
                    <li key={r} className="flex gap-3 text-sm">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                      <span className="opacity-90">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Requirements summary */}
      <section id="requirements" className="py-10 bg-muted/20 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="h-px w-7 bg-primary" />
            <span className="text-xs uppercase tracking-[0.18em] font-semibold">Requirements</span>
          </div>
          <h2 className="text-4xl font-bold mb-3">{selectedCard.title}</h2>
          <p className="opacity-80 mb-8">Selected package: <span className="font-semibold text-gradient">{selectedCard.price}</span></p>
          <ul className="space-y-3">
            {selectedCard.requirements.map((r) => (
              <li key={r} className="flex items-start gap-3 glass rounded-xl p-4">
                <CheckCircle2 className="w-5 h-5 mt-0.5 text-primary" />
                <span className="font-medium">{r}</span>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <Button variant="hero" size="lg" className="rounded-full" onClick={() => scrollTo("order-form")}>
              Proceed to Order Form <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Order form */}
      <section id="order-form" className="py-12 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-3">Place Your Order</h2>
            <p className="opacity-90">Selected: <span className="font-semibold">{selectedCard.title}</span> — <span className="text-gradient font-bold">{selectedCard.price}</span></p>
          </div>
          {submitted ? (
            <div className="glass rounded-3xl p-10 md:p-12 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9 text-primary" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold">Thank you{submittedName ? `, ${submittedName}` : ""}!</h3>
              <p className="opacity-85 max-w-lg mx-auto">
                Your order for <span className="font-semibold">{selectedCard.title}</span> has been received. Our team will reach out shortly to confirm details and next steps.
              </p>
              <Button variant="ghostGlow" className="rounded-full" onClick={() => setSubmitted(false)}>
                Place another order
              </Button>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="glass rounded-3xl p-8 md:p-10 space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <input name="firstName" placeholder="First Name" className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/40 focus:border-primary outline-none" maxLength={60} required />
              <input name="lastName" placeholder="Last Name" className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/40 focus:border-primary outline-none" maxLength={60} required />
            </div>
            <input name="companyName" placeholder="Company Name" className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/40 focus:border-primary outline-none" maxLength={120} required />
            <div className="grid sm:grid-cols-2 gap-5">
              <input name="crn" placeholder="CRN" className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/40 focus:border-primary outline-none" maxLength={20} required />
              <input name="authCode" placeholder="Auth Code" className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/40 focus:border-primary outline-none" maxLength={20} required />
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <input name="email" type="email" placeholder="Email" className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/40 focus:border-primary outline-none" maxLength={255} required />
              <input name="phone" placeholder="Phone" className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/40 focus:border-primary outline-none" maxLength={30} required />
            </div>
            <textarea name="notes" placeholder="Additional notes (optional)" rows={4} maxLength={1000} className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/40 focus:border-primary outline-none resize-none" />
            <Button type="submit" variant="hero" size="lg" className="rounded-full w-full">
              Submit Order <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
          )}
        </div>
      </section>

      {/* Related */}
      <section className="py-10 bg-muted/20 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold mb-8">Related Services</h2>
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
    </Layout>
  );
};

export default UKChangeServices;
