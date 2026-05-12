import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin, Loader2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { buildOrderRef } from "@/lib/orderRef";

const JURISDICTIONS: Record<string, string> = {
  EW: "England & Wales",
  WA: "Wales",
  SC: "Scotland",
  NI: "Northern Ireland",
};

const PACKAGES = ["Starter", "Silver", "Gold", "Platinum"] as const;
type PackageName = (typeof PACKAGES)[number];

const PACKAGE_PRICES: Record<PackageName, number> = {
  Starter: 140,
  Silver: 170,
  Gold: 180,
  Platinum: 200,
};

const formatGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);

const UkLtdCheckout = () => {
  const [params] = useSearchParams();
  const jurCode = (params.get("jurisdiction") || "").toUpperCase();
  const pkgParam = params.get("package") as PackageName | null;
  const packageName: PackageName = PACKAGES.includes(pkgParam as PackageName) ? (pkgParam as PackageName) : "Silver";

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    whatsapp: "",
    country: "",
    message: "",
  });

  useEffect(() => {
    document.title = "Checkout — UK LTD Formation | Digiformation Ltd";
  }, []);

  const jurName = JURISDICTIONS[jurCode];
  const price = useMemo(() => PACKAGE_PRICES[packageName], [packageName]);

  if (!jurCode || !jurName) return <Navigate to="/uk-services/uk-ltd-formation/choose-jurisdiction" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const orderRef = buildOrderRef({ service: "LTD Formation", packageName, currency: "GBP" });
    const summary =
      `[UK LTD Order]\n` +
      `Ref: ${orderRef}\n` +
      `Jurisdiction: ${jurName} (${jurCode})\n` +
      `Package: ${packageName} — ${formatGBP(price)}\n\n` +
      `Customer note:\n${form.message || "(none provided)"}`;

    const { error } = await supabase.from("contact_submissions").insert({
      full_name: form.full_name,
      email: form.email,
      whatsapp: form.whatsapp,
      country: form.country,
      service: `UK LTD Formation — ${jurName} — ${packageName}`,
      message: summary,
      page_path: window.location.pathname + window.location.search,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
      return;
    }

    const service = `UK LTD Formation — ${jurName}`;
    const priceStr = formatGBP(price);
    const pagePath = window.location.pathname + window.location.search;

    // If logged-in: generate invoice PDF + create order/invoice rows
    let invoiceNumber: string | undefined;
    let invoiceUrl: string | undefined;
    let finalOrderRef = orderRef;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      try {
        const { data: inv, error: invErr } = await supabase.functions.invoke("generate-invoice", {
          body: {
            service,
            packageName,
            amount_gbp: price,
            currency: "GBP",
            customer: { full_name: form.full_name, email: form.email, address: form.country },
            notes: form.message,
            orderRef,
          },
        });
        if (invErr) throw invErr;
        invoiceNumber = (inv as any)?.invoiceNumber;
        invoiceUrl = (inv as any)?.invoiceUrl;
        if ((inv as any)?.orderRef) finalOrderRef = (inv as any).orderRef;
      } catch (err) {
        console.error("invoice generation failed", err);
      }
    }

    if (form.email) {
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "order-confirmation",
          recipientEmail: form.email,
          idempotencyKey: `order-confirm-${finalOrderRef}`,
          templateData: { customerName: form.full_name, service, packageName, price: priceStr, orderRef: finalOrderRef, invoiceNumber, invoiceUrl, notes: form.message },
        },
      }).catch((err) => console.error("order-confirmation failed", err));
    }
    supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "order-notification",
        idempotencyKey: `order-notify-${finalOrderRef}`,
        templateData: { customerName: form.full_name, customerEmail: form.email, whatsapp: form.whatsapp, country: form.country, service, packageName, price: priceStr, orderRef: finalOrderRef, invoiceNumber, pagePath, notes: form.message },
      },
    }).catch((err) => console.error("order-notification failed", err));

    setSubmitted(true);
    toast({ title: "Order received!", description: "Our team will contact you within 24 hours." });
  };

  return (
    <Layout>
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="container mx-auto px-4 py-12 md:py-14 relative">
          <Link
            to={`/uk-services/uk-ltd-formation/choose-jurisdiction`}
            className="inline-flex items-center gap-2 text-sm opacity-80 hover:opacity-100 mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to jurisdictions
          </Link>
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-xs uppercase tracking-[0.18em] font-semibold">Step 3 of 3 — Checkout</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Confirm your <em className="not-italic text-gradient">UK LTD order</em>
          </h1>
        </div>
      </section>

      <section className="py-10 md:py-14 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-6xl">
          {submitted ? (
            <div className="max-w-xl mx-auto text-center glass rounded-3xl p-10">
              <CheckCircle2 className="w-14 h-14 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-3">Order received</h2>
              <p className="opacity-80 mb-6">
                Thank you! Your order for a <strong>{packageName}</strong> package in{" "}
                <strong>{jurName}</strong> has been submitted. Our team will contact you within 24 hours to
                complete payment and start the incorporation process.
              </p>
              <Button asChild variant="hero" className="rounded-full">
                <Link to="/">Back to home</Link>
              </Button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-[1fr_380px] gap-8">
              {/* Form */}
              <form onSubmit={handleSubmit} className="glass rounded-3xl p-6 md:p-8 space-y-5">
                <h2 className="text-2xl font-bold">Your details</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} required minLength={2} />
                  <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
                  <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} required minLength={5} />
                  <Field label="Country of residence" value={form.country} onChange={(v) => setForm({ ...form, country: v })} required minLength={2} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Notes (proposed company name, business activity, etc.)</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    minLength={10}
                    required
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/40 focus:border-primary outline-none text-sm"
                    placeholder="Tell us your proposed company name, alternatives, and business activity..."
                  />
                </div>
                <Button type="submit" variant="hero" size="lg" disabled={submitting} className="rounded-full w-full">
                  {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>) : (<>Submit order <ArrowRight className="w-4 h-4" /></>)}
                </Button>
                <p className="text-xs opacity-70 text-center">
                  After submission our team will reach out via email/WhatsApp with secure payment instructions.
                </p>
              </form>

              {/* Summary */}
              <aside className="glass rounded-3xl p-6 md:p-8 h-fit lg:sticky lg:top-24">
                <h3 className="text-sm uppercase tracking-[0.16em] opacity-70 mb-4">Order Summary</h3>

                <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-primary/10 text-primary">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-semibold">{jurName}</span>
                </div>

                <div className="space-y-2 mb-4">
                  {PACKAGES.map((p) => {
                    const pPrice = PACKAGE_PRICES[p];
                    const active = p === packageName;
                    return (
                      <Link
                        key={p}
                        to={`/uk-services/uk-ltd-formation/checkout?jurisdiction=${jurCode}&package=${p}`}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          active ? "border-primary bg-primary/10" : "border-border/40 hover:border-primary/40"
                        }`}
                      >
                        <span className="text-sm font-semibold">{p}</span>
                        <span className={active ? "text-gradient font-bold" : "opacity-80"}>{formatGBP(pPrice)}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="border-t border-border/40 pt-4 mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="opacity-80">Selected package</span>
                    <span className="font-semibold">{packageName}</span>
                  </div>
                  <div className="flex items-center justify-between text-2xl font-bold">
                    <span>Total</span>
                    <span className="text-gradient">{formatGBP(price)}</span>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

const Field = ({
  label,
  value,
  onChange,
  type = "text",
  required,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
}) => (
  <div>
    <label className="block text-sm font-medium mb-1.5">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      minLength={minLength}
      className="w-full px-4 py-2.5 rounded-xl bg-muted/30 border border-border/40 focus:border-primary outline-none text-sm"
    />
  </div>
);

export default UkLtdCheckout;
