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
  Send,
  ScanFace,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { buildOrderRef } from "@/lib/orderRef";
import { COUNTRIES } from "@/lib/countries";
import exampleHoldingSelfie from "@/assets/example-holding-selfie.jpg";
import exampleIdFront from "@/assets/example-id-front.jpg";
import exampleIdBack from "@/assets/example-id-back.jpg";
import examplePassport from "@/assets/example-passport.jpg";

const BUSINESS_CATEGORIES: Record<string, string[]> = {
  "E-commerce": [
    "Clothing & Apparel",
    "Electronics & Gadgets",
    "Footwear",
    "Beauty & Cosmetics",
    "Home & Kitchen",
    "Health & Wellness",
    "Toys & Kids",
    "Jewelry & Accessories",
    "Food & Beverages",
    "General Store / Multi-niche",
  ],
  "IT Services": [
    "Cloud Services",
    "Cyber Security",
    "Software Development",
    "Web Development",
    "Mobile App Development",
    "IT Support / Desktop Engineer",
    "Data & Analytics",
    "DevOps & Infrastructure",
    "AI / Machine Learning",
    "QA & Testing",
  ],
  "Digital Marketing Services": [
    "SEO",
    "Google Ads / PPC",
    "Social Media Marketing",
    "Content Marketing",
    "Email Marketing",
    "Influencer Marketing",
    "Graphic Designing",
    "Video / Animation",
    "Branding",
    "Web Development",
  ],
};

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
  /** When true, the company name field is shown but not required (used for IDV) */
  companyNameOptional?: boolean;
  /** Show the "what do you need?" service-mode picker at top of details (UK LTD) */
  showServiceMode?: boolean;
  /** Show a role picker (Director / PSC / Shareholder / Secretary) — used for IDV */
  showRole?: boolean;
  /** Hide the entire "Business activity" section (used for IDV) */
  hideBusinessActivity?: boolean;
  /** Show a "Proof of address" upload field inside the ID documents section (used for IDV) */
  showProofOfAddress?: boolean;
  /** Show a "Date of birth" field (used for IDV) */
  showDateOfBirth?: boolean;
  /** Show a "Passport number" field (used for IDV) */
  showPassportNumber?: boolean;
  /** Show a "Website" field (used for banks) */
  showWebsite?: boolean;
  /** Override the WhatsApp field label (e.g. "UK Number", "USA Number"). Defaults to "WhatsApp". */
  whatsappLabel?: string;
  /** Placeholder hint for the WhatsApp/phone field */
  whatsappPlaceholder?: string;
  /** Optional extra add-on services grouped by category. */
  extras?: { categoryLabel: string; description?: string; items: CheckoutItem[] }[];
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
  companyNameOptional = false,
  showServiceMode = false,
  showRole = false,
  hideBusinessActivity = false,
  showProofOfAddress = false,
  showDateOfBirth = true,
  showPassportNumber = true,
  showWebsite = false,
  whatsappLabel = "WhatsApp",
  whatsappPlaceholder,
  extras,
}: CheckoutFlowProps) => {
  // Merge extras into the master items list so selection / pricing logic
  // continues to work uniformly.
  const allItems = useMemo(() => {
    const base = [...items];
    if (extras) for (const g of extras) for (const it of g.items) {
      if (!base.find((b) => b.id === it.id)) base.push(it);
    }
    return base;
  }, [items, extras]);
  const initialSelected = useMemo(() => {
    if (defaultSelectedIds && defaultSelectedIds.length) return new Set(defaultSelectedIds);
    if (lockSelection || !multiSelect) return new Set(items.slice(0, 1).map((i) => i.id));
    return new Set(items.filter((i) => i.fixed).map((i) => i.id));
  }, [items, defaultSelectedIds, lockSelection, multiSelect]);

  // Draft persistence: keep form data alive across refresh / network glitches for 10 min
  const DRAFT_TTL_MS = 10 * 60 * 1000;
  const draftKey = `checkout-draft:${serviceTitle}`;
  const loadDraft = (): any | null => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(draftKey) : null;
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.savedAt !== "number") return null;
      if (Date.now() - parsed.savedAt > DRAFT_TTL_MS) {
        window.localStorage.removeItem(draftKey);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  };
  const draft = typeof window !== "undefined" ? loadDraft() : null;

  const [selected, setSelected] = useState<Set<string>>(() => {
    if (draft?.selected && Array.isArray(draft.selected)) return new Set<string>(draft.selected);
    return initialSelected;
  });
  const [stepIdx, setStepIdx] = useState(draft?.stepIdx ?? 0);
  const [submitting, setSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    orderRef: string;
    invoiceUrl?: string;
    documents?: { label: string; url: string; filename: string }[];
  } | null>(null);
  const emptyForm = {
    company_name: "",
    first_name: "",
    last_name: "",
    full_name: "",
    email: "",
    whatsapp: "",
    country: "",
    nationality: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    business_type: "",
    message: "",
    business_category: "",
    business_subcategory: "",
    business_other: "",
    sic_codes: "",
    role: "",
    personal_code: "",
    date_of_birth: "",
    passport_number: "",
    website: "",
  };
  const [form, setForm] = useState(() => ({ ...emptyForm, ...(draft?.form ?? {}) }));
  const [idType, setIdType] = useState<"id_card" | "passport" | "driving_licence">("id_card");
  const [idTypeOpen, setIdTypeOpen] = useState(false);
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [holdingSelfie, setHoldingSelfie] = useState<File | null>(null);
  const [proofOfAddress, setProofOfAddress] = useState<File | null>(null);
  const [submitDocsManually, setSubmitDocsManually] = useState(false);
  const [showSicCodes, setShowSicCodes] = useState(false);
  const [verificationLinkRequested, setVerificationLinkRequested] = useState(false);
  const [exampleOpen, setExampleOpen] = useState<null | { title: string; src: string }>(null);
  const [serviceMode, setServiceMode] = useState<"ltd-only" | "both">(draft?.serviceMode ?? "both");
  const [serviceModeOpen, setServiceModeOpen] = useState(true);
  const idVerificationActive = !showServiceMode || serviceMode === "both";

  const hasDraftData = !!draft;
  const clearDraft = () => {
    try { window.localStorage.removeItem(draftKey); } catch {}
    setForm(emptyForm);
    setSelected(initialSelected);
    setStepIdx(0);
    setServiceMode("both");
    toast({ title: "Draft cleared", description: "Your saved form data was removed." });
  };

  // Persist draft on every change (debounced)
  useEffect(() => {
    if (successInfo) return; // don't save after success
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(draftKey, JSON.stringify({
          savedAt: Date.now(),
          form,
          selected: Array.from(selected),
          stepIdx,
          serviceMode,
        }));
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [form, selected, stepIdx, serviceMode, successInfo, draftKey]);

  // Clear draft after successful submit
  useEffect(() => {
    if (successInfo) {
      try { window.localStorage.removeItem(draftKey); } catch {}
    }
  }, [successInfo, draftKey]);

  // Skip selection step entirely when locked
  const steps = lockSelection ? STEP_LABELS.slice(1) : STEP_LABELS;
  const stepIcons = lockSelection ? STEP_ICONS.slice(1) : STEP_ICONS;
  const totalSteps = steps.length;

  const toggle = (id: string) => {
    if (lockSelection) return;
    const item = allItems.find((i) => i.id === id);
    if (item?.fixed) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        // Multi-select limit only applies to primary `items`; extras are
        // always additive (you can tick add-ons even with a fixed package).
        const isExtra = !items.find((i) => i.id === id);
        if (!multiSelect && !isExtra) next.clear();
        next.add(id);
      }
      return next;
    });
  };

  const selectedItems = useMemo(
    () => allItems.filter((i) => selected.has(i.id)),
    [allItems, selected]
  );
  const subtotal = selectedItems.reduce((s, i) => s + i.price, 0);
  const vat = +(subtotal * vatRate).toFixed(2);
  const total = subtotal + vat;

  const canNext = () => {
    if (!lockSelection && stepIdx === 0) return selectedItems.length > 0;
    const detailsIdx = lockSelection ? 0 : 1;
    if (stepIdx === detailsIdx) {
      return (
        (!showCompanyName || companyNameOptional || form.company_name.trim().length >= 2) &&
        (!showRole || form.role.trim().length > 0) &&
        form.first_name.trim().length >= 2 &&
        form.last_name.trim().length >= 2 &&
        /\S+@\S+\.\S+/.test(form.email) &&
        form.whatsapp.trim().length >= 5 &&
        form.country.trim().length >= 2 &&
        form.nationality.trim().length >= 2 &&
        form.address_line1.trim().length >= 3 &&
        form.address_line2.trim().length >= 2 &&
        form.city.trim().length >= 2 &&
        form.postal_code.trim().length >= 3 &&
        (!showBusinessType || form.business_type.trim().length >= 2) &&
        (hideBusinessActivity || form.business_category.trim().length > 0) &&
        (hideBusinessActivity || (form.business_category === "Other"
          ? form.business_other.trim().length >= 10
          : form.business_subcategory.trim().length > 0)) &&
        (!(idVerificationActive && liveSelfieLink) || verificationLinkRequested) &&
        (!(showServiceMode && serviceMode === "ltd-only") || form.personal_code.trim().length >= 8) &&
        (!showDateOfBirth || form.date_of_birth.trim().length >= 8) &&
        (!showPassportNumber || form.passport_number.trim().length >= 4) &&
        (!showWebsite || form.website.trim().length >= 3)
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

    // Use the actually selected item name (so if the user switches packages
    // on the page, the invoice reflects their choice — not the URL default).
    // Only fall back to fixedPackageName when the selection is locked.
    const stripPkgSuffix = (n: string) => n.replace(/\s*Package$/i, "");
    const packageName =
      lockSelection && fixedPackageName
        ? fixedPackageName
        : selectedItems.length === 1
          ? stripPkgSuffix(selectedItems[0].name)
          : fixedPackageName || `${selectedItems.length} services`;
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
      `${form.address_line2}\n` +
      `${form.city}${form.state ? `, ${form.state}` : ""}, ${form.postal_code}\n` +
      `${form.country}\n` +
      `Nationality: ${form.nationality}\n` +
      (showBusinessType && form.business_type ? `\nBusiness type: ${form.business_type}\n` : "");

    const serviceModeLabel =
      serviceMode === "ltd-only"
        ? "ID verification already done elsewhere — only register UK Ltd"
        : "Both: ID Verification + Company Formation";

    const activityText = hideBusinessActivity
      ? ""
      : (form.business_category === "Other"
          ? form.business_other.trim()
          : `${form.business_category}${form.business_subcategory ? ` — ${form.business_subcategory}` : ""}`) +
        (form.sic_codes.trim() ? `\nSIC codes: ${form.sic_codes.trim()}` : "");

    const summary =
      `[${serviceTitle} Order]\n` +
      `Ref: ${orderRef}\n` +
      (contextLabel ? `${contextLabel}\n` : "") +
      (showServiceMode ? `Service mode: ${serviceModeLabel}\n` : "") +
      (showServiceMode && serviceMode === "ltd-only" && form.personal_code ? `Companies House Personal Code: ${form.personal_code.trim()}\n` : "") +
      (showCompanyName && form.company_name ? `Proposed company name: ${form.company_name}\n` : "") +
      (showRole && form.role ? `Applicant role: ${form.role}\n` : "") +
      (showDateOfBirth && form.date_of_birth ? `Date of birth: ${form.date_of_birth}\n` : "") +
      (showPassportNumber && form.passport_number ? `Passport number: ${form.passport_number}\n` : "") +
      (showWebsite && form.website ? `Website: ${form.website}\n` : "") +
      `Items:\n${lines}\n` +
      `Subtotal: ${formatMoney(subtotal, currency)}\n` +
      (vat ? `VAT (${(vatRate * 100).toFixed(0)}%): ${formatMoney(vat, currency)}\n` : "") +
      `Total: ${formatMoney(total, currency)}\n` +
      
      addressBlock +
      (activityText ? `\nBusiness activity:\n${activityText}` : "");

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

    // ---- Upload submitted documents (ID front/back, holding selfie) to
    // private storage so they reach the business inbox + invoice as
    // download links. Each file gets its own folder under the order ref.
    const uploads: { file: File; label: string; key: string }[] = [];
    if (idFront) uploads.push({ file: idFront, label: `${idType.replace("_", " ")} (front)`, key: "id-front" });
    if (idBack) uploads.push({ file: idBack, label: `${idType.replace("_", " ")} (back)`, key: "id-back" });
    if (holdingSelfie) uploads.push({ file: holdingSelfie, label: "Holding selfie", key: "holding-selfie" });
    if (proofOfAddress) uploads.push({ file: proofOfAddress, label: "Proof of address", key: "proof-of-address" });

    const uploadedDocs: { label: string; path: string; filename: string }[] = [];
    await Promise.all(
      uploads.map(async ({ file, label, key }) => {
        const ext = (file.name.split(".").pop() || "bin").toLowerCase();
        const safeName = `${key}.${ext}`;
        const path = `submissions/${orderRef}/${safeName}`;
        const { error: upErr } = await supabase.storage
          .from("client-docs")
          .upload(path, file, { contentType: file.type || undefined, upsert: true });
        if (upErr) {
          console.error("doc upload failed", label, upErr);
          return;
        }
        uploadedDocs.push({ label, path, filename: file.name });
      })
    );

    let invoiceNumber: string | undefined;
    let invoiceUrl: string | undefined;
    let documentLinks: { label: string; url: string; filename: string }[] = [];
    let finalOrderRef = orderRef;
    try {
      const { data: inv, error: invErr } = await supabase.functions.invoke("generate-invoice", {
        body: {
          service: serviceTitle,
          packageName,
          amount_gbp: total,
          currency,
          customer: {
            full_name: form.full_name,
            email: form.email,
            address: [form.address_line1, form.address_line2, form.city, form.state, form.postal_code, form.country]
              .filter(Boolean)
              .join(", "),
            whatsapp: form.whatsapp,
            address_line1: form.address_line1,
            address_line2: form.address_line2,
            city: form.city,
            state: form.state,
            postal_code: form.postal_code,
            country: form.country,
          },
          notes: `${contextLabel ? contextLabel + "\n" : ""}${lines}\nBusiness activity: ${activityText}`,
          orderRef,
          documents: uploadedDocs,
        },
      });
      if (invErr) throw invErr;
      invoiceNumber = (inv as any)?.invoiceNumber;
      invoiceUrl = (inv as any)?.invoiceUrl;
      documentLinks = (inv as any)?.documentLinks ?? [];
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
              notes: `Business activity: ${activityText}`,
              liveSelfieLink: liveSelfieMode === "link" && idVerificationActive ? liveSelfieLink : undefined,
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
            addressLine1: form.address_line1,
            addressLine2: form.address_line2,
            city: form.city,
            state: form.state,
            postalCode: form.postal_code,
            service: serviceTitle,
            packageName,
            price: priceStr,
            orderRef: finalOrderRef,
            invoiceNumber,
            invoiceUrl,
            pagePath,
            notes: `Business activity: ${activityText}`,
            documents: documentLinks,
          },
        },
      })
      .catch((err) => console.error("order-notification failed", err));

    setSubmitting(false);
    setSuccessInfo({ orderRef: finalOrderRef, invoiceUrl, documents: documentLinks });
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
              <Info icon={Clock} title="Reply within 1h" body="A specialist reaches out shortly with next steps." />
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

            {successInfo.documents && successInfo.documents.length > 0 && (
              <div className="mt-6 text-left">
                <p className="text-xs uppercase tracking-wider opacity-60 mb-2 text-center">
                  Your uploaded documents
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {successInfo.documents.map((d) => (
                    <a
                      key={d.url}
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs hover:bg-primary/10"
                    >
                      <span className="font-medium">{d.label}:</span>
                      <span className="opacity-80">{d.filename}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
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
          {backHref ? (
            <Link to={backHref} className="inline-flex items-center gap-2 text-sm opacity-80 hover:opacity-100 mb-5">
              <ArrowLeft className="w-4 h-4" /> {backLabel || "Back"}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => (window.history.length > 1 ? window.history.back() : (window.location.href = "/"))}
              className="inline-flex items-center gap-2 text-sm opacity-80 hover:opacity-100 mb-5"
            >
              <ArrowLeft className="w-4 h-4" /> {backLabel || "Back"}
            </button>
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

            {showSelection && extras && extras.length > 0 && extras.map((group) => (
              <div key={group.categoryLabel} className="glass rounded-3xl p-6 md:p-8">
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <h2 className="text-xl md:text-2xl font-bold">{group.categoryLabel}</h2>
                  <span className="text-[11px] uppercase tracking-[0.16em] opacity-60">Add-ons</span>
                </div>
                <p className="text-sm opacity-75 mb-5">
                  {group.description || "Optional add-ons in this category. Tick any you'd like to include."}
                </p>
                <div className="space-y-3">
                  {group.items.map((it) => {
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
            ))}

            {showDetails && (
              <div className="glass rounded-3xl p-6 md:p-8 space-y-5">
                <h2 className="text-2xl font-bold">Your details</h2>

                {showServiceMode && (
                  <div className="rounded-2xl border border-primary/40 bg-primary/5 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setServiceModeOpen((o) => !o)}
                      className="w-full flex items-center justify-between gap-3 p-4 md:p-5 text-left"
                      aria-expanded={serviceModeOpen}
                    >
                      <span>
                        <span className="block text-sm font-semibold text-primary">What do you need?</span>
                        <span className="block text-xs opacity-80 mt-0.5">
                          {serviceMode === "ltd-only"
                            ? "Only register UK Ltd (ID verification already done elsewhere)"
                            : "Both: ID Verification + Company Formation"}
                        </span>
                      </span>
                      <ChevronDown className={`w-5 h-5 transition-transform ${serviceModeOpen ? "rotate-180" : ""}`} />
                    </button>
                    {serviceModeOpen && (
                      <div className="px-4 pb-4 md:px-5 md:pb-5 space-y-2">
                        {([
                          { id: "ltd-only", title: "I just need to register my UK Ltd", desc: "I've already completed Companies House ID verification through another company." },
                          { id: "both", title: "I want both services", desc: "ID Verification + Company Formation. We'll email you a secure live-selfie link." },
                        ] as const).map((opt) => {
                          const active = serviceMode === opt.id;
                          return (
                            <button
                              type="button"
                              key={opt.id}
                              onClick={() => { setServiceMode(opt.id); setServiceModeOpen(false); }}
                              className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                                active ? "border-primary bg-primary/10" : "border-border/40 hover:border-primary/40 bg-background/40"
                              }`}
                            >
                              <span className={`mt-0.5 w-4 h-4 rounded-full border-2 grid place-items-center flex-shrink-0 ${active ? "border-primary" : "border-border/60"}`}>
                                {active && <span className="w-2 h-2 rounded-full bg-primary" />}
                              </span>
                              <span className="flex-1 min-w-0">
                                <span className="block text-sm font-semibold">{opt.title}</span>
                                <span className="block text-xs opacity-75 mt-0.5">{opt.desc}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {showServiceMode && serviceMode === "ltd-only" && (
                  <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 md:p-5 space-y-3">
                    <div>
                      <div className="text-sm font-semibold text-amber-500">Companies House Personal Code</div>
                      <div className="text-xs opacity-80 mt-1">
                        Since your ID verification is already done elsewhere, please share your <strong>Companies House Personal Code</strong> (received after identity verification). We need this to incorporate your UK Ltd company.
                      </div>
                    </div>
                    <Field
                      label="Personal Code"
                      value={form.personal_code}
                      onChange={(v) => setForm({ ...form, personal_code: v.replace(/\s+/g, "").toUpperCase() })}
                      required
                      minLength={8}
                      placeholder="e.g. ABCD1234EFGH"
                    />
                  </div>
                )}

                {showCompanyName && (
                  <Field
                    label={
                      companyNameOptional
                        ? "Company name (optional — if you've already registered)"
                        : "Proposed company name (the company you want to register)"
                    }
                    value={form.company_name}
                    onChange={(v) => setForm({ ...form, company_name: v })}
                    required={!companyNameOptional}
                    minLength={companyNameOptional ? 0 : 2}
                    placeholder={
                      companyNameOptional
                        ? "e.g. Acme Trading Ltd"
                        : "e.g. Acme Trading Ltd — add alternatives in Notes below"
                    }
                  />
                )}
                {showRole && (() => {
                  const ROLES = ["Director", "PSC (Person with Significant Control)", "Shareholder", "Secretary"];
                  const selectedRoles = form.role ? form.role.split(", ").filter(Boolean) : [];
                  const toggleRole = (r: string) => {
                    const set = new Set(selectedRoles);
                    set.has(r) ? set.delete(r) : set.add(r);
                    setForm({ ...form, role: Array.from(set).join(", ") });
                  };
                  return (
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        Your role <span className="text-destructive">*</span>
                        <span className="opacity-60 font-normal ml-1">(select one or more)</span>
                      </label>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {ROLES.map((r) => {
                          const active = selectedRoles.includes(r);
                          return (
                            <button
                              type="button"
                              key={r}
                              onClick={() => toggleRole(r)}
                              className={`text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                                active ? "border-primary bg-primary/10 shadow-glow" : "border-border/40 hover:border-primary/40 bg-muted/20"
                              }`}
                            >
                              <span className={`mt-0.5 w-4 h-4 rounded-md border-2 grid place-items-center flex-shrink-0 ${active ? "bg-primary border-primary text-primary-foreground" : "border-border/60"}`}>
                                {active && <CheckCircle2 className="w-3 h-3" />}
                              </span>
                              <span className="text-sm font-medium">{r}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="First name" value={form.first_name} onChange={(v) => setForm({ ...form, first_name: v, full_name: `${v} ${form.last_name}`.trim() })} required minLength={2} />
                  <Field label="Last name" value={form.last_name} onChange={(v) => setForm({ ...form, last_name: v, full_name: `${form.first_name} ${v}`.trim() })} required minLength={2} />
                  <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
                  <Field label={whatsappLabel} value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} required minLength={5} placeholder={whatsappPlaceholder} />
                  {showDateOfBirth && (
                    <Field label="Date of birth" type="date" value={form.date_of_birth} onChange={(v) => setForm({ ...form, date_of_birth: v })} required />
                  )}
                  {showPassportNumber && (
                    <Field label="Passport number" value={form.passport_number} onChange={(v) => setForm({ ...form, passport_number: v.toUpperCase() })} required minLength={4} placeholder="e.g. AB1234567" />
                  )}
                  {showWebsite && (
                    <Field label="Website" type="url" value={form.website} onChange={(v) => setForm({ ...form, website: v })} required minLength={3} placeholder="https://yourbusiness.com" />
                  )}
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
                    label="Address line 2 (area, road)"
                    value={form.address_line2}
                    onChange={(v) => setForm({ ...form, address_line2: v })}
                    required
                    minLength={2}
                  />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required minLength={2} />
                    <Field label="State / Province (optional)" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
                  </div>
                  <Field label="Postal code" value={form.postal_code} onChange={(v) => setForm({ ...form, postal_code: v })} required minLength={3} />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        Country of residence <span className="text-destructive">*</span>
                      </label>
                      <select
                        value={form.country}
                        onChange={(e) => setForm({ ...form, country: e.target.value })}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/40 focus:border-primary outline-none text-sm"
                      >
                        <option value="">Select your country…</option>
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        Nationality <span className="text-destructive">*</span>
                      </label>
                      <select
                        value={form.nationality}
                        onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/40 focus:border-primary outline-none text-sm"
                      >
                        <option value="">Select your nationality…</option>
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
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
                {!hideBusinessActivity && (
                <div className="rounded-2xl border border-border/40 p-4 md:p-5 space-y-4">
                  <div>
                    <h3 className="font-semibold">Business activity</h3>
                    <p className="text-xs opacity-70 mt-1">Pick the category that best describes your business.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Business category <span className="text-destructive">*</span></label>
                    <select
                      value={form.business_category}
                      onChange={(e) => setForm({ ...form, business_category: e.target.value, business_subcategory: "", business_other: "" })}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/40 focus:border-primary outline-none text-sm"
                    >
                      <option value="">Select a category…</option>
                      {Object.keys(BUSINESS_CATEGORIES).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {form.business_category && form.business_category !== "Other" && (
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Sub-category <span className="text-destructive">*</span></label>
                      <select
                        value={form.business_subcategory}
                        onChange={(e) => setForm({ ...form, business_subcategory: e.target.value })}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/40 focus:border-primary outline-none text-sm"
                      >
                        <option value="">Select a sub-category…</option>
                        {BUSINESS_CATEGORIES[form.business_category].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {form.business_category === "Other" && (
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Describe your business <span className="text-destructive">*</span></label>
                      <textarea
                        value={form.business_other}
                        onChange={(e) => setForm({ ...form, business_other: e.target.value })}
                        minLength={10}
                        required
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/40 focus:border-primary outline-none text-sm"
                        placeholder="Briefly describe what your business does…"
                      />
                    </div>
                  )}
                  {form.business_category && (
                    <div className="pt-1">
                      {!showSicCodes ? (
                        <button
                          type="button"
                          onClick={() => setShowSicCodes(true)}
                          className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1.5"
                        >
                          + Add SIC codes <span className="opacity-60 font-normal">(optional)</span>
                        </button>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-sm font-medium">SIC codes <span className="opacity-60 font-normal">(optional)</span></label>
                            <button
                              type="button"
                              onClick={() => { setShowSicCodes(false); setForm({ ...form, sic_codes: "" }); }}
                              className="text-xs opacity-60 hover:opacity-100 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                          <textarea
                            value={form.sic_codes}
                            onChange={(e) => setForm({ ...form, sic_codes: e.target.value })}
                            rows={2}
                            maxLength={500}
                            className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/40 focus:border-primary outline-none text-sm"
                            placeholder="e.g. 62012, 62020, 70229, 73110"
                          />
                          <p className="text-xs opacity-70 mt-1">
                            <span className="font-semibold">Note:</span> You can add a maximum of 4 SIC codes only. Choose the ones that best match your business activity.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                )}

                {/* Required documents — manual submission via WhatsApp */}
                {idVerificationActive && (
                <div className="rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/5 via-background to-background p-4 md:p-5 space-y-4">
                  <div>
                    <h3 className="font-semibold text-base">Required documents</h3>
                    <p className="text-xs opacity-75 mt-1">
                      To keep your files safe, we collect documents manually over WhatsApp — not through this form.
                      Please send the items below to our team after placing the order.
                    </p>
                  </div>

                  <ul className="text-sm space-y-2 leading-relaxed">
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" /><span><strong>Passport</strong> — clear photo of the photo page.</span></li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" /><span><strong>National ID / Driving licence</strong> — front &amp; back (if no passport).</span></li>
                    {liveSelfieMode === "upload" && (
                      <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" /><span><strong>Holding selfie</strong> — you holding your ID next to your face, both fully visible.</span></li>
                    )}
                    {showProofOfAddress && (
                      <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" /><span><strong>Proof of address</strong> — utility bill or bank statement (last 3 months) showing your name &amp; home address.</span></li>
                    )}
                  </ul>

                  <a
                    href={`https://wa.me/923164467464?text=${encodeURIComponent(`Hello Digiformation, I'd like to submit my verification documents manually for my order.${form.first_name ? `\nName: ${form.first_name} ${form.last_name}` : ""}${form.email ? `\nEmail: ${form.email}` : ""}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-[#1ebe57] transition-all shadow-md"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.595 5.392l-.999 3.648 3.893-.739z"/>
                    </svg>
                    I'll Submit Manually by WhatsApp
                  </a>

                  <p className="text-xs opacity-70 text-center">
                    Our team will reply with a secure channel to receive your documents.
                  </p>
                </div>
                )}


                  {liveSelfieLink && (
                    <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/40 p-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground grid place-items-center flex-shrink-0">
                          <ScanFace className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-base">Live ID Verification Link <span className="text-destructive">*</span></h4>
                          <p className="text-xs opacity-75 mt-0.5">Required by Companies House — takes about 2 minutes.</p>
                        </div>
                      </div>

                      <div className="rounded-xl bg-background/60 border border-border/40 p-4 space-y-2.5">
                        <p className="text-xs font-semibold uppercase tracking-wider opacity-70">What you'll do on the link:</p>
                        <ol className="space-y-1.5 text-sm">
                          <li className="flex gap-2.5"><span className="font-bold text-primary">1.</span><span><strong>Live face scan</strong> — quick selfie scan from your phone camera</span></li>
                          <li className="flex gap-2.5"><span className="font-bold text-primary">2.</span><span><strong>Live passport / ID scan</strong> — scan your document with your camera</span></li>
                          <li className="flex gap-2.5"><span className="font-bold text-primary">3.</span><span><strong>Email verification</strong> — confirm your email address</span></li>
                        </ol>
                      </div>

                      {!verificationLinkRequested ? (
                        <>
                          <button
                            type="button"
                            disabled={!/\S+@\S+\.\S+/.test(form.email)}
                            onClick={() => {
                              if (!/\S+@\S+\.\S+/.test(form.email)) {
                                toast({ title: "Enter your email first", description: "We need your email to send the verification link.", variant: "destructive" });
                                return;
                              }
                              window.open(liveSelfieLink, "_blank", "noopener,noreferrer");
                              setVerificationLinkRequested(true);
                              toast({ title: "Verification link opened", description: `Also saved to your order — we'll email a copy to ${form.email}.` });
                            }}
                            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                          >
                            <Send className="w-4 h-4" /> Get Verification Link
                          </button>
                          <p className="text-xs text-center opacity-70">👆 Click here, then continue to the next step</p>
                        </>
                      ) : (
                        <div className="rounded-xl bg-primary/15 border border-primary/40 p-4 space-y-2">
                          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                            <CheckCircle2 className="w-5 h-5" /> Link sent to your email
                          </div>
                          <p className="text-xs opacity-85 leading-relaxed">
                            Open the link from <span className="font-semibold">{form.email}</span>, complete all 3 steps,
                            then send us a screenshot of the success page on <span className="font-semibold">WhatsApp</span> or reply to our email.
                            You can now continue to review your order.
                          </p>
                          <button
                            type="button"
                            onClick={() => window.open(liveSelfieLink, "_blank", "noopener,noreferrer")}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            Open verification link again →
                          </button>
                        </div>
                      )}
                    </div>
                  )}

              </div>
            )}

            {showReview && (
              <div className="glass rounded-3xl p-6 md:p-8 space-y-5">
                <h2 className="text-2xl font-bold">Review &amp; confirm</h2>
                <div className="rounded-2xl border border-border/40 p-4">
                  <h3 className="font-semibold mb-2">Customer</h3>
                  <dl className="grid sm:grid-cols-2 gap-2 text-sm">
                    <ReviewLine label="Name" value={`${form.first_name} ${form.last_name}`.trim()} />
                    <ReviewLine label="Email" value={form.email} />
                    <ReviewLine label="WhatsApp" value={form.whatsapp} />
                    <ReviewLine label="Country of residence" value={form.country} />
                    <ReviewLine label="Nationality" value={form.nationality} />
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
                  {form.business_category && (
                    <>
                      <div className="text-sm font-semibold mt-4 mb-1">Business activity</div>
                      <p className="text-sm opacity-85 whitespace-pre-wrap">
                        {form.business_category === "Other"
                          ? form.business_other
                          : `${form.business_category}${form.business_subcategory ? ` — ${form.business_subcategory}` : ""}`}
                      </p>
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
  onViewExample?: () => void;
}) => {
  const inputId = `upload-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2">
        <label htmlFor={inputId} className="block text-sm font-semibold">{label}</label>
        {onViewExample && (
          <button
            type="button"
            onClick={onViewExample}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <Eye className="w-3.5 h-3.5" /> View example
          </button>
        )}
      </div>
      <div className="flex items-stretch gap-2">
        <label
          htmlFor={inputId}
          className={`group flex-1 cursor-pointer flex items-center gap-3 px-4 py-4 rounded-xl border-2 border-dashed transition-all ${
            file
              ? "bg-primary/10 border-primary/60 hover:border-primary"
              : "bg-background/80 border-primary/30 hover:bg-primary/5 hover:border-primary/70"
          }`}
        >
          <div className={`w-10 h-10 rounded-full grid place-items-center flex-shrink-0 transition-colors ${
            file ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary group-hover:bg-primary/25"
          }`}>
            <Upload className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            {file ? (
              <>
                <div className="text-sm font-semibold text-primary truncate">{file.name}</div>
                <div className="text-[11px] opacity-70 mt-0.5">Click to replace · JPG / PNG / PDF</div>
              </>
            ) : (
              <>
                <div className="text-sm font-semibold">Click to upload</div>
                <div className="text-[11px] opacity-70 mt-0.5">JPG, PNG or PDF · max 10 MB</div>
              </>
            )}
          </div>
        </label>
        {file && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="px-3 rounded-xl border-2 border-border/40 hover:border-destructive/60 hover:bg-destructive/10 text-destructive transition-colors"
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
