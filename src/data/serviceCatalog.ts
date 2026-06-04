/**
 * CENTRAL SERVICE PRICE CATALOG — single source of truth.
 *
 * Every priced service the customer can order on the website MUST be listed
 * here with its slug and price. The /checkout page reads this catalog by
 * `?service=<slug>` and produces a locked, priced order + invoice (the same
 * flow that powers ID Verification today).
 *
 * RULES:
 * - Add every new service here before linking it from any service page.
 * - Service pages must CTA to `/checkout?service=<slug>` (or one of the
 *   dedicated jurisdiction / state / banking checkouts) — never to /contact
 *   for a priced service.
 * - Never create an order with £0 when the service has a defined price.
 * - The /contact form is reserved for genuine "talk to us" enquiries only.
 */
import { compliancePages, type ComplianceFormField } from "./compliance";
import { usaServicePages } from "./usaServices";
import { banking } from "./navigation";

export type CatalogEntry = {
  slug: string;
  name: string;
  description: string;
  price: number;
  currency: "GBP" | "USD";
  /** Internal grouping for analytics / breadcrumbs */
  category:
    | "UK Services"
    | "UK Compliance"
    | "UK Address"
    | "USA Services"
    | "Banking"
    | "Web Development"
    | "Digital Services"
    | "Packages";
  /** Optional bespoke checkout path (overrides default /checkout?service=slug). */
  checkoutPath?: string;
  /** Optional UK Compliance item id reused inside the uk-compliance multi-select
    *  group so existing dynamic field sections continue to fire. */
  complianceItemId?: string;
  /** Per-service required-information fields rendered on the checkout. When
   *  present, the checkout hides default DOB / address / business activity
   *  sections and only asks for these specific fields. */
  formFields?: ComplianceFormField[];
};

// Strip leading currency symbol & whitespace, return numeric price.
const num = (raw: string): number => {
  const n = Number(String(raw).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const COMPLIANCE_ENTRIES: CatalogEntry[] = compliancePages.map((p) => ({
  slug: p.slug,
  name: p.title,
  description: p.description,
  price: num(p.price),
  currency: "GBP",
  category: "UK Compliance",
}));

const USA_ENTRIES: CatalogEntry[] = usaServicePages.map((p) => ({
  slug: p.slug,
  name: p.title,
  description: p.description,
  price: p.price,
  currency: "USD",
  category: "USA Services",
}));

const BANKING_ENTRIES: CatalogEntry[] = banking.map((b) => {
  const slug = b.path.split("/").pop()!;
  return {
    slug,
    name: `${b.name} — Business Account Setup`,
    description: `Account opening assistance for ${b.name}.`,
    price: num(b.price || "£20"),
    currency: "GBP" as const,
    category: "Banking",
    checkoutPath: `/banks-payment-solutions/${slug}/checkout`,
  };
});

const UK_SERVICE_ENTRIES: CatalogEntry[] = [
  {
    slug: "registered-office-address",
    name: "Registered Office Address",
    description: "Official UK registered office address for your limited company (12 months).",
    price: 40,
    currency: "GBP",
    category: "UK Address",
  },
  {
    slug: "business-service-address",
    name: "Business Service Address",
    description: "Professional UK address for marketing and correspondence (12 months).",
    price: 60,
    currency: "GBP",
    category: "UK Address",
  },
  {
    slug: "director-service-address",
    name: "Director Service Address",
    description: "Official UK service address for an individual director (12 months).",
    price: 20,
    currency: "GBP",
    category: "UK Address",
  },
  {
    slug: "address-all-in-one",
    name: "Business Address — All in One",
    description: "Registered Office + Business Service + Director Service address bundle.",
    price: 80,
    currency: "GBP",
    category: "UK Address",
  },
  {
    slug: "utr-number",
    name: "UTR Number Registration",
    description: "HMRC UTR (Unique Taxpayer Reference) registration for individuals or companies.",
    price: 50,
    currency: "GBP",
    category: "UK Services",
    complianceItemId: "utr",
  },
  {
    slug: "uk-vat-registration",
    name: "UK VAT Registration & Submission",
    description: "Register your UK company for VAT with HMRC.",
    price: 70,
    currency: "GBP",
    category: "UK Services",
    complianceItemId: "vat",
  },
  {
    slug: "company-annual-filing",
    name: "Confirmation Statement Filing",
    description: "Annual Confirmation Statement filing with Companies House.",
    price: 65,
    currency: "GBP",
    category: "UK Services",
    complianceItemId: "cs",
  },
  {
    slug: "auth-code",
    name: "Companies House Authentication Code",
    description: "Request or recover your Companies House authentication code.",
    price: 30,
    currency: "GBP",
    category: "UK Services",
  },
  {
    slug: "activation-code",
    name: "HMRC Activation Code Service",
    description: "Request or recover your HMRC online services activation code.",
    price: 30,
    currency: "GBP",
    category: "UK Services",
  },
];

const WEB_DEV_ENTRIES: CatalogEntry[] = [
  {
    slug: "web-ecommerce-shopify",
    name: "E-commerce Store (Shopify)",
    description: "Full Shopify storefront setup with theme, products and payments.",
    price: 30,
    currency: "GBP",
    category: "Web Development",
  },
  {
    slug: "web-react-basic",
    name: "React Basic Website",
    description: "4-page React website with logo and basic SEO.",
    price: 40,
    currency: "GBP",
    category: "Web Development",
  },
  {
    slug: "web-react-standard",
    name: "React Standard Website",
    description: "6-page React website with animations, SEO and analytics.",
    price: 60,
    currency: "GBP",
    category: "Web Development",
  },
  {
    slug: "web-react-premium",
    name: "React Premium Website",
    description: "10-page React website with CMS, blog, integrations and advanced SEO.",
    price: 150,
    currency: "GBP",
    category: "Web Development",
  },
  {
    slug: "web-react-ecommerce-basic",
    name: "Basic E-Commerce React",
    description: "React storefront with catalog, search and brand-aligned theme.",
    price: 90,
    currency: "GBP",
    category: "Web Development",
  },
];

export const SERVICE_CATALOG: CatalogEntry[] = [
  ...UK_SERVICE_ENTRIES,
  ...COMPLIANCE_ENTRIES,
  ...USA_ENTRIES,
  ...BANKING_ENTRIES,
  ...WEB_DEV_ENTRIES,
];

const BY_SLUG: Record<string, CatalogEntry> = Object.fromEntries(
  SERVICE_CATALOG.map((e) => [e.slug, e])
);

export const findServiceBySlug = (slug?: string | null): CatalogEntry | undefined =>
  slug ? BY_SLUG[slug] : undefined;

/** Resolve the slug for a given service page route (e.g. /uk-services/utr-number). */
export const slugFromPath = (path: string): string => {
  const cleaned = path.replace(/\/+$/, "");
  return cleaned.split("/").pop() || "";
};

/** Build the checkout link for a catalog entry (or for any slug we recognise). */
export const checkoutLinkForSlug = (slug: string, fallback: string = "/contact"): string => {
  const entry = BY_SLUG[slug];
  if (!entry) return fallback;
  if (entry.checkoutPath) return entry.checkoutPath;
  return `/checkout?service=${encodeURIComponent(slug)}`;
};
