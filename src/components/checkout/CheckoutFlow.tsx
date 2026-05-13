import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  ShoppingBag,
  UserRound,
  ClipboardCheck,
  Mail,
  Clock,
  ShieldCheck,
  Upload,
  Eye,
  X,
  ChevronDown,
  IdCard,
  BookUser,
  Car,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { buildOrderRef } from "@/lib/orderRef";
import exampleHoldingSelfie from "@/assets/example-holding-selfie.jpg";
import exampleIdFront from "@/assets/example-id-front.jpg";
import exampleIdBack from "@/assets/example-id-back.jpg";
import examplePassport from "@/assets/example-passport.jpg";

export type CheckoutItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  /** When false the item is shown but cannot be deselected (used for fixed packages) */
  fixed?: boolean;
};

export type CheckoutFlowProps = {
  /** e.g. "UK LTD Formation", "Address Services" */
  serviceTitle: string;
  /** Order/invoice serviceCode, e.g. "LTD", "LLC", "ADZ" */
  serviceCode: string;
  /** Currency: GBP or USD */
  currency: "GBP" | "USD";
  /** Selectable items shown in step 1 */
  items: CheckoutItem[];
  /** Initial selected ids; if items[].fixed they always stay selected */
  defaultSelectedIds?: string[];
  /** When true: skip selection step, sum of items is locked total */
  lockSelection?: boolean;
  /** Allow multi-item selection. Default true unless lockSelection */
  multiSelect?: boolean;
  /** VAT rate, default 0 */
  vatRate?: number;
  /** Optional secondary metadata appended to order summary email */
  contextLabel?: string;
  /** Back link */
  backHref?: string;
  backLabel?: string;
  /** Subtitle/eyebrow under title */
  eyebrow?: string;
  /** Placeholder text for notes textarea */
  notesPlaceholder?: string;
  /** Optional pre-filled package name shown on invoice */
  fixedPackageName?: string;
  /** How the live-selfie step is handled. "upload" = direct upload field (default),
   *  "link" = no upload; show a notice that a verification link will be emailed,
   *  "none" = hide the live selfie field entirely */
  liveSelfieMode?: "upload" | "link" | "none";
  /** Verification link to email when liveSelfieMode === "link" */
  liveSelfieLink?: string;
  /** Show a "Business type" field in the details step (used for LLC) */
  showBusinessType?: boolean;
  /** Show a "Company name to register" field at the top of details (used for UK LTD) */
  showCompanyName?: boolean;
  /** Show the "what do you need?" service-mode picker at top of details (UK LTD) */
  showServiceMode?: boolean;
};

const STEP_ICONS = [ShoppingBag, UserRound, ClipboardCheck];
const STEP_LABELS = ["Services", "Your details", "Review"];

const formatMoney = (n: number, currency: "GBP" | "USD") =>
  new Intl.NumberFormat(currency === "GBP" ? "en-GB" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);

const CheckoutFlow = ({
  serviceTitle,
  serviceCode,
  currency,
  items,
  defaultSelectedIds,
  lockSelection = false,
  multiSelect = true,
  vatRate = 0,
  contextLabel,
  backHref,
  backLabel,
  eyebrow,
  notesPlaceholder,
  fixedPackageName,
  liveSelfieMode = "upload",
  liveSelfieLink,
  showBusinessType = false,
  showCompanyName = false,
  showServiceMode = false,
}: CheckoutFlowProps) => {
  const initialSelected = useMemo(() => {
    if (defaultSelectedIds && defaultSelectedIds.length) return new Set(defaultSelectedIds);
    if (lockSelection || !multiSelect) return new Set(items.slice(0, 1).map((i) => i.id));
    return new Set(items.filter((i) => i.fixed).map((i) => i.id));
  }, [items, defaultSelectedIds, lockSelection, multiSelect]);

  const [selected, setSelected] = useState<Set<string>>(initialSelected);
  const [stepIdx, setStepIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ orderRef: string; invoiceUrl?: string } | null>(null);
  const [form, setForm] = useState({
    company_name: "",
    full_name: "",
    email: "",
    whatsapp: "",
    country: "",
    address_line1: "",
    address_line2: "",
    city: "",
    postal_code: "",
    business_type: "",
    message: "",
    additional_note: "",
    promo_code: "",
  });
  const [idType, setIdType] = useState<"id_card" | "passport" | "driving_licence">("id_card");
  const [idTypeOpen, setIdTypeOpen] = useState(false);
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [holdingSelfie, setHoldingSelfie] = useState<File | null>(null);
  const [exampleOpen, setExampleOpen] = useState<null | { title: string; src: string }>(null);
  const [serviceMode, setServiceMode] = useState<"ltd-only" | "both">("both");
  const [serviceModeOpen, setServiceModeOpen] = useState(true);
  const idVerificationActive = !showServiceMode || serviceMode === "both";

  // Skip selection step entirely when locked
  const steps = lockSelection ? STEP_LABELS.slice(1) : STEP_LABELS;
  const stepIcons = lockSelection ? STEP_ICONS.slice(1) : STEP_ICONS;
  const totalSteps = steps.length;

  const toggle = (id: string) => {
    if (lockSelection) return;
    const item = items.find((i) => i.id === id);
    if (item?.fixed) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!multiSelect) next.clear();
        next.add(id);
      }
      return next;
    });
  };

  const selectedItems = useMemo(
    () => items.filter((i) => selected.has(i.id)),
    [items, selected]
  );
  const subtotal = selectedItems.reduce((s, i) => s + i.price, 0);
  const vat = +(subtotal * vatRate).toFixed(2);
  const total = subtotal + vat;

  const canNext = () => {
    if (!lockSelection && stepIdx === 0) return selectedItems.length > 0;
    const detailsIdx = lockSelection ? 0 : 1;
    if (stepIdx === detailsIdx) {
      return (
        (!showCompanyName || form.company_name.trim().length >= 2) &&
        form.full_name.trim().length >= 2 &&
        /\S+@\S+\.\S+/.test(form.email) &&
        form.whatsapp.trim().length >= 5 &&
        form.country.trim().length >= 2 &&
        form.address_line1.trim().length >= 3 &&
        form.city.trim().length >= 2 &&
        form.postal_code.trim().length >= 3 &&
        (!showBusinessType || form.business_type.trim().length >= 2) &&
        form.message.trim().length >= 10
      );
    }
    return true;
  };

  const next = () => {
    if (!canNext()) {
      toast({ title: "Please complete the required fields", variant: "destructive" });
      return;
    }
    setStepIdx((s) => Math.min(s + 1, totalSteps - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const prev = () => setStepIdx((s) => Math.max(s - 1, 0));

  useEffect(() => {
    document.title = `Checkout — ${serviceTitle} | Digiformation Ltd`;
  }, [serviceTitle]);

  const submitOrder = async () => {
    if (selectedItems.length === 0) return;
    setSubmitting(true);

    const packageName =
      fixedPackageName ||
      (selectedItems.length === 1 ? selectedItems[0].name : `${selectedItems.length} services`);
    const orderRef = await buildOrderRef({
      service: serviceTitle,
      packageName,
      currency,
      serviceCode,
    });

    const lines = selectedItems
      .map((i) => `• ${i.name} — ${formatMoney(i.price, currency)}`)
      .join("\n");
    const addressBlock =
      `\nResidential address:\n` +
      `${form.address_line1}\n` +
      (form.address_line2 ? `${form.address_line2}\n` : "") +
      `${form.city}, ${form.postal_code}\n` +
      `${form.country}\n` +
      (showBusinessType && form.business_type ? `\nBusiness type: ${form.business_type}\n` : "");

    const summary =
      `[${serviceTitle} Order]\n` +
      `Ref: ${orderRef}\n` +
      (contextLabel ? `${contextLabel}\n` : "") +
      (showCompanyName && form.company_name ? `Proposed company name: ${form.company_name}\n` : "") +
      `Items:\n${lines}\n` +
      `Subtotal: ${formatMoney(subtotal, currency)}\n` +
      (vat ? `VAT (${(vatRate * 100).toFixed(0)}%): ${formatMoney(vat, currency)}\n` : "") +
      `Total: ${formatMoney(total, currency)}\n` +
      (form.promo_code ? `Promo code: ${form.promo_code}\n` : "") +
      addressBlock +
      `\nCustomer note:\n${form.message}` +
      (form.additional_note ? `\n\nAdditional note:\n${form.additional_note}` : "");

    const { error } = await supabase.from("contact_submissions").insert({
      full_name: form.full_name,
      email: form.email,
      whatsapp: form.whatsapp,
      country: form.country,
      service: `${serviceTitle} — ${packageName}`,
      message: summary,
      page_path: window.location.pathname + window.location.search,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
    });
    if (error) {
      setSubmitting(false);
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
      return;
    }

    let invoiceNumber: string | undefined;
    let invoiceUrl: string | undefined;
    let finalOrderRef = orderRef;
    try {
      const { data: inv, error: invErr } = await supabase.functions.invoke("generate-invoice", {
        body: {
          service: serviceTitle,
          packageName,
          amount_gbp: total,
          currency,
          customer: { full_name: form.full_name, email: form.email, address: form.country },
          notes: `${contextLabel ? contextLabel + "\n" : ""}${lines}\n${form.message}`,
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

    const priceStr = formatMoney(total, currency);
    const pagePath = window.location.pathname + window.location.search;
    if (form.email) {
      supabase.functions
        .invoke("send-transactional-email", {
          body: {
            templateName: "order-confirmation",
            recipientEmail: form.email,
            idempotencyKey: `order-confirm-${finalOrderRef}`,
            templateData: {
              customerName: form.full_name,
              service: serviceTitle,
              packageName,
              price: priceStr,
              orderRef: finalOrderRef,
              invoiceNumber,
              invoiceUrl,
              notes: form.message,
              liveSelfieLink: liveSelfieMode === "link" ? liveSelfieLink : undefined,
            },
          },
        })
        .catch((err) => console.error("order-confirmation failed", err));
    }
    supabase.functions
      .invoke("send-transactional-email", {
        body: {
          templateName: "order-notification",
          idempotencyKey: `order-notify-${finalOrderRef}`,
          templateData: {
            customerName: form.full_name,
            customerEmail: form.email,
            whatsapp: form.whatsapp,
            country: form.country,
            service: serviceTitle,
            packageName,
            price: priceStr,
            orderRef: finalOrderRef,
            invoiceNumber,
            pagePath,
            notes: form.message,
          },
        },
      })
      .catch((err) => console.error("order-notification failed", err));

    setSubmitting(false);
    setSuccessInfo({ orderRef: finalOrderRef, invoiceUrl });
    toast({ title: "Order received", description: "Our team will contact you as soon as possible." });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (successInfo) {
    return (
      <section className="py-14 md:py-20">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="glass rounded-3xl p-8 md:p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/15 grid place-items-center mx-auto mb-5">
              <CheckCircle2 className="w-9 h-9 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Thank you — your order is in</h2>
            <p className="opacity-85 mb-2">
              Your order reference is{" "}
              <span className="font-mono font-bold text-gradient">{successInfo.orderRef}</span>.
            </p>
            <p className="opacity-85 mb-6">
              Our team will contact you <strong>as soon as possible</strong> via email and WhatsApp with secure payment
              instructions and the next steps.
            </p>

            <div className="grid sm:grid-cols-3 gap-3 mb-7 text-left">
              <Info icon={Mail} title="Confirmation sent" body="Check your inbox for the receipt and invoice PDF." />
              <Info icon={Clock} title="Reply within 24h" body="A specialist reaches out shortly with next steps." />
              <Info icon={ShieldCheck} title="Secure & compliant" body="Your details are stored on encrypted servers." />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {successInfo.invoiceUrl && (
                <Button asChild variant="hero" className="rounded-full">
                  <a href={successInfo.invoiceUrl} target="_blank" rel="noopener noreferrer">
                    Download invoice (PDF)
                  </a>
                </Button>
              )}
              <Button asChild variant="ghostGlow" className="rounded-full">
                <Link to="/">Back to home</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const showSelection = !lockSelection && stepIdx === 0;
  const showDetails = stepIdx === (lockSelection ? 0 : 1);
  const showReview = stepIdx === (lockSelection ? 1 : 2);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="container mx-auto px-4 py-10 md:py-14 relative">
          {backHref && (
            <Link to={backHref} className="inline-flex items-center gap-2 text-sm opacity-80 hover:opacity-100 mb-5">
              <ArrowLeft className="w-4 h-4" /> {backLabel || "Back"}
            </Link>
          )}
          {eyebrow && (
            <div className="inline-flex items-center gap-3 mb-3">
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">{eyebrow}</span>
            </div>
          )}
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Checkout — <em className="not-italic text-gradient">{serviceTitle}</em>
          </h1>

          {/* Stepper */}
          <ol className="mt-8 flex items-center gap-2 md:gap-4 overflow-x-auto pb-1">
            {steps.map((label, i) => {
              const Icon = stepIcons[i];
              const active = i === stepIdx;
              const done = i < stepIdx;
              return (
                <li key={label} className="flex items-center gap-2 md:gap-4 min-w-fit">
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all ${
                      active
                        ? "border-primary bg-primary/15 text-primary"
                        : done
                          ? "border-primary/40 bg-primary/5 text-primary"
                          : "border-border/40 opacity-70"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full grid place-items-center text-[11px] font-bold ${
                        active || done ? "bg-primary text-primary-foreground" : "bg-muted/40"
                      }`}
                    >
                      {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                    </span>
                    <span className="text-xs md:text-sm font-semibold whitespace-nowrap">{label}</span>
                  </div>
                  {i < steps.length - 1 && <span className="h-px w-6 md:w-10 bg-border/60" />}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="py-8 md:py-12 border-t border-border/60">
        <div className="container mx-auto px-4 max-w-6xl flex flex-col gap-8 lg:grid lg:grid-cols-[1fr_380px]">
          <div className="space-y-6 lg:col-start-1 lg:row-start-1">
            {showSelection && (
              <div className="glass rounded-3xl p-6 md:p-8">
                <h2 className="text-2xl font-bold mb-1">Select your services</h2>
                <p className="text-sm opacity-75 mb-5">
                  {multiSelect
                    ? "Tick the items you'd like to order. The total updates instantly."
                    : "Choose the package that fits you best."}
                </p>
                <div className="space-y-3">
                  {items.map((it) => {
                    const active = selected.has(it.id);
                    return (
                      <button
                        type="button"
                        key={it.id}
                        onClick={() => toggle(it.id)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                          active
                            ? "border-primary bg-primary/10 shadow-glow"
                            : "border-border/40 hover:border-primary/40"
                        }`}
                      >
                        <span
                          className={`mt-0.5 w-5 h-5 rounded-md border-2 grid place-items-center flex-shrink-0 ${
                            active ? "bg-primary border-primary text-primary-foreground" : "border-border/60"
                          }`}
                        >
                          {active && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="flex items-baseline justify-between gap-3">
                            <span className="font-semibold">{it.name}</span>
                            <span className={active ? "text-gradient font-bold" : "font-semibold opacity-90"}>
                              {formatMoney(it.price, currency)}
                            </span>
                          </span>
                          {it.description && <span className="block text-sm opacity-75 mt-1">{it.description}</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {showDetails && (
              <div className="glass rounded-3xl p-6 md:p-8 space-y-5">
                <h2 className="text-2xl font-bold">Your details</h2>
                {showCompanyName && (
                  <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4 md:p-5">
                    <Field
                      label="Proposed company name (the company you want to register)"
                      value={form.company_name}
                      onChange={(v) => setForm({ ...form, company_name: v })}
                      required
                      minLength={2}
                      placeholder="e.g. Acme Trading Ltd"
                    />
                    <p className="text-xs opacity-70 mt-2">Tip: add 2-3 alternative names in the Notes field below in case your first choice is taken.</p>
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} required minLength={2} />
                  <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
                  <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} required minLength={5} />
                  <Field label="Country of residence" value={form.country} onChange={(v) => setForm({ ...form, country: v })} required minLength={2} />
                </div>

                {/* Residential address */}
                <div className="rounded-2xl border border-border/40 p-4 md:p-5 space-y-4">
                  <div>
                    <h3 className="font-semibold">Residential home address</h3>
                    <p className="text-xs opacity-70 mt-1">Used for verification and on official documents.</p>
                  </div>
                  <Field
                    label="Address line 1 (house no., street)"
                    value={form.address_line1}
                    onChange={(v) => setForm({ ...form, address_line1: v })}
                    required
                    minLength={3}
                  />
                  <Field
                    label="Address line 2 (area, road) — optional"
                    value={form.address_line2}
                    onChange={(v) => setForm({ ...form, address_line2: v })}
                  />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required minLength={2} />
                    <Field label="Postal code" value={form.postal_code} onChange={(v) => setForm({ ...form, postal_code: v })} required minLength={3} />
                  </div>
                </div>

                {showBusinessType && (
                  <Field
                    label="Business type / industry"
                    value={form.business_type}
                    onChange={(v) => setForm({ ...form, business_type: v })}
                    required
                    minLength={2}
                  />
                )}
                <div>
                  <label className="block text-sm font-medium mb-1.5">Notes (proposed company name, business activity, etc.)</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    minLength={10}
                    required
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/40 focus:border-primary outline-none text-sm"
                    placeholder={notesPlaceholder || "Share any details that will help us prepare your order..."}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Additional note <span className="opacity-60 font-normal">(optional)</span></label>
                  <textarea
                    value={form.additional_note}
                    onChange={(e) => setForm({ ...form, additional_note: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/40 focus:border-primary outline-none text-sm"
                    placeholder="Anything else you'd like our team to know?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Promo code <span className="opacity-60 font-normal">(optional)</span></label>
                  <input
                    type="text"
                    value={form.promo_code}
                    onChange={(e) => setForm({ ...form, promo_code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 rounded-xl bg-muted/30 border border-border/40 focus:border-primary outline-none text-sm uppercase tracking-wider"
                    placeholder="e.g. WELCOME10"
                  />
                </div>

                {/* ID Documents */}
                <div className="rounded-2xl border border-border/40 p-4 md:p-5 space-y-4">
                  <div>
                    <h3 className="font-semibold">ID documents <span className="opacity-60 font-normal text-sm">(optional — speeds up verification)</span></h3>
                    <p className="text-xs opacity-70 mt-1">Upload a clear photo of your ID and a holding-selfie. Tap "View example" to see what we need.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">ID type</label>
                    <div className="flex gap-2">
                      {(["id_card", "passport"] as const).map((t) => (
                        <button
                          type="button"
                          key={t}
                          onClick={() => { setIdType(t); if (t === "passport") setIdBack(null); }}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                            idType === t ? "border-primary bg-primary/15 text-primary" : "border-border/40 hover:border-primary/40"
                          }`}
                        >
                          {t === "id_card" ? "National ID Card" : "Passport"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <UploadField
                    label={idType === "passport" ? "Passport (photo page)" : "ID card — front"}
                    file={idFront}
                    onChange={setIdFront}
                    onViewExample={() =>
                      setExampleOpen(
                        idType === "passport"
                          ? { title: "Example: Passport photo page", src: examplePassport }
                          : { title: "Example: ID card (front)", src: exampleIdFront }
                      )
                    }
                  />

                  {idType === "id_card" && (
                    <UploadField
                      label="ID card — back"
                      file={idBack}
                      onChange={setIdBack}
                      onViewExample={() => setExampleOpen({ title: "Example: ID card (back)", src: exampleIdBack })}
                    />
                  )}

                  {liveSelfieMode === "upload" && (
                    <UploadField
                      label="Holding selfie (you holding your ID)"
                      file={holdingSelfie}
                      onChange={setHoldingSelfie}
                      onViewExample={() => setExampleOpen({ title: "Example: Holding selfie", src: exampleHoldingSelfie })}
                    />
                  )}

                  {liveSelfieMode === "link" && (
                    <div className="rounded-xl bg-primary/10 border border-primary/30 p-4 text-sm">
                      <p className="font-semibold text-primary mb-1">Live selfie verification</p>
                      <p className="opacity-85">
                        After you place your order, we will email you a secure live-selfie verification link.
                        Please complete it from your phone — it takes about 1 minute.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {showReview && (
              <div className="glass rounded-3xl p-6 md:p-8 space-y-5">
                <h2 className="text-2xl font-bold">Review &amp; confirm</h2>
                <div className="rounded-2xl border border-border/40 p-4">
                  <h3 className="font-semibold mb-2">Customer</h3>
                  <dl className="grid sm:grid-cols-2 gap-2 text-sm">
                    <ReviewLine label="Name" value={form.full_name} />
                    <ReviewLine label="Email" value={form.email} />
                    <ReviewLine label="WhatsApp" value={form.whatsapp} />
                    <ReviewLine label="Country" value={form.country} />
                  </dl>
                  <div className="text-sm font-semibold mt-4 mb-1">Address</div>
                  <p className="text-sm opacity-85 whitespace-pre-wrap">
                    {form.address_line1}
                    {form.address_line2 ? `\n${form.address_line2}` : ""}
                    {`\n${form.city}, ${form.postal_code}`}
                    {`\n${form.country}`}
                  </p>
                  {showBusinessType && form.business_type && (
                    <>
                      <div className="text-sm font-semibold mt-3 mb-1">Business type</div>
                      <p className="text-sm opacity-85">{form.business_type}</p>
                    </>
                  )}
                  {form.message && (
                    <>
                      <div className="text-sm font-semibold mt-4 mb-1">Notes</div>
                      <p className="text-sm opacity-85 whitespace-pre-wrap">{form.message}</p>
                    </>
                  )}
                </div>
                <div className="rounded-2xl border border-border/40 p-4">
                  <h3 className="font-semibold mb-3">Order Summary</h3>
                  <div className="text-sm font-semibold text-primary mb-2">{serviceTitle}</div>
                  <ul className="space-y-1.5 text-sm mb-3">
                    {selectedItems.map((i) => (
                      <li key={i.id} className="flex justify-between gap-3">
                        <span className="opacity-90">{i.name}</span>
                        <span className="font-semibold">{formatMoney(i.price, currency)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-border/40 pt-3 space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="opacity-80">Subtotal</span>
                      <span className="font-semibold">{formatMoney(subtotal, currency)}</span>
                    </div>
                    {vatRate > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="opacity-80">VAT ({(vatRate * 100).toFixed(0)}%)</span>
                        <span className="font-semibold">{formatMoney(vat, currency)}</span>
                      </div>
                    )}
                    {form.promo_code && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="opacity-80">Promo code</span>
                        <span className="font-semibold uppercase">{form.promo_code}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-lg font-bold pt-2">
                      <span>Total</span>
                      <span className="text-gradient">{formatMoney(total, currency)}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs opacity-70">
                  By placing the order you agree to our terms. Our team will contact you as soon as possible with secure
                  payment instructions.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
              {stepIdx > 0 ? (
                <Button type="button" variant="ghostGlow" className="rounded-full" onClick={prev}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
              ) : (
                <span className="hidden sm:block" />
              )}
              {showReview ? (
                <Button type="button" variant="hero" size="lg" className="rounded-full" disabled={submitting} onClick={submitOrder}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      Place Order — {formatMoney(total, currency)} <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button type="button" variant="hero" size="lg" className="rounded-full" onClick={next}>
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Summary */}
          <aside className="glass rounded-3xl p-6 md:p-8 lg:row-start-1 lg:col-start-2 lg:h-fit lg:sticky lg:top-24">
            <h3 className="text-sm uppercase tracking-[0.16em] opacity-70 mb-4">Order Summary</h3>
            {contextLabel && (
              <div className="mb-4 px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold">
                {contextLabel}
              </div>
            )}
            {selectedItems.length === 0 ? (
              <p className="text-sm opacity-70">No items selected yet.</p>
            ) : (
              <ul className="space-y-2 mb-4 text-sm">
                {selectedItems.map((i) => (
                  <li key={i.id} className="flex justify-between gap-3">
                    <span className="opacity-90">{i.name}</span>
                    <span className="font-semibold">{formatMoney(i.price, currency)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-border/40 pt-4 space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-80">Subtotal</span>
                <span className="font-semibold">{formatMoney(subtotal, currency)}</span>
              </div>
              {vatRate > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="opacity-80">VAT ({(vatRate * 100).toFixed(0)}%)</span>
                  <span className="font-semibold">{formatMoney(vat, currency)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-2xl font-bold pt-2">
                <span>Total</span>
                <span className="text-gradient">{formatMoney(total, currency)}</span>
              </div>
            </div>
            <p className="text-xs opacity-70 mt-4">
              Payment is taken securely after our team confirms the details. No card is charged at this step.
            </p>
          </aside>
        </div>
      </section>

      <Dialog open={!!exampleOpen} onOpenChange={(o) => !o && setExampleOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{exampleOpen?.title}</DialogTitle>
          </DialogHeader>
          {exampleOpen && (
            <img
              src={exampleOpen.src}
              alt={exampleOpen.title}
              loading="lazy"
              className="w-full h-auto rounded-xl border border-border/40"
            />
          )}
          <p className="text-xs opacity-70">This is just a reference example. Your photo should be sharp, well-lit and show all corners / details clearly.</p>
        </DialogContent>
      </Dialog>
    </>
  );
};

const Field = ({
  label,
  value,
  onChange,
  type = "text",
  required,
  minLength,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
}) => (
  <div>
    <label className="block text-sm font-medium mb-1.5">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      minLength={minLength}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 rounded-xl bg-muted/30 border border-border/40 focus:border-primary outline-none text-sm"
    />
  </div>
);

const ReviewLine = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col">
    <dt className="text-[11px] uppercase tracking-[0.14em] opacity-60">{label}</dt>
    <dd className="font-medium">{value || <span className="opacity-50">—</span>}</dd>
  </div>
);

const Info = ({ icon: Icon, title, body }: { icon: any; title: string; body: string }) => (
  <div className="rounded-2xl border border-border/40 p-4">
    <Icon className="w-5 h-5 text-primary mb-2" />
    <div className="font-semibold text-sm mb-1">{title}</div>
    <div className="text-xs opacity-75 leading-relaxed">{body}</div>
  </div>
);

const UploadField = ({
  label,
  file,
  onChange,
  onViewExample,
}: {
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
  onViewExample: () => void;
}) => {
  const inputId = `upload-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <label htmlFor={inputId} className="block text-sm font-medium">{label}</label>
        <button
          type="button"
          onClick={onViewExample}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <Eye className="w-3.5 h-3.5" /> View example
        </button>
      </div>
      <div className="flex items-center gap-2">
        <label
          htmlFor={inputId}
          className="flex-1 cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/30 border border-dashed border-border/60 hover:border-primary/60 text-sm transition-all"
        >
          <Upload className="w-4 h-4 opacity-70" />
          <span className="truncate">{file ? file.name : "Choose file (JPG / PNG / PDF)"}</span>
        </label>
        {file && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="p-2 rounded-xl border border-border/40 hover:border-destructive/60 text-destructive"
            aria-label="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <input
        id={inputId}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
    </div>
  );
};

export default CheckoutFlow;
