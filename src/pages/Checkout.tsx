import { useSeo } from "@/lib/seo";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import CheckoutFlow, { CheckoutItem } from "@/components/checkout/CheckoutFlow";
import { complianceItemFormFields } from "@/data/compliance";

/**
 * Category-grouped catalog. Each group contains only services that belong
 * together so customers don't see unrelated items at checkout (e.g. a UK
 * Address customer should never be offered Web Development or PayPal
 * add-ons here).
 */
type CatalogGroup = {
  /** Identifier used in URL ?service= matching */
  key: string;
  /** Match the URL `service` param against any of these (case-insensitive) */
  matches: string[];
  categoryLabel: string;
  description?: string;
  items: CheckoutItem[];
};

const CATALOG_GROUPS: CatalogGroup[] = [
  {
    key: "uk-address",
    matches: ["uk address services", "address services", "registered office", "business service address", "director service address"],
    categoryLabel: "UK Address Services",
    description: "Pick the address packages you need. All addresses are valid for 12 months.",
    items: [
      { id: "roa", name: "Registered Office Address (1 yr)", description: "Official UK address for company registration & government mail.", price: 40 },
      { id: "bsa", name: "Business Service Address (1 yr)", description: "Professional UK address for marketing, correspondence & registration.", price: 60 },
      { id: "dsa", name: "Director Service Address (1 yr)", description: "Official UK address for individual directors.", price: 20 },
      { id: "aio", name: "Business Address — All in One (1 yr)", description: "Registered Office + Business Service + Director Service — all bundled into one address.", price: 80 },
    ],
  },
  {
    key: "uk-compliance",
    matches: ["compliance", "hmrc", "companies house", "utr", "vat", "confirmation statement", "annual accounts", "dormant", "company name change"],
    categoryLabel: "UK Compliance & Filings",
    description: "HMRC and Companies House filings for your UK Limited company.",
    items: [
      { id: "utr", name: "UTR Number Registration", description: "HMRC tax registration for individuals or companies.", price: 50 },
      { id: "vat", name: "VAT Registration", description: "Register your UK company for VAT with HMRC.", price: 70 },
      { id: "cs", name: "Confirmation Statement Filing", description: "Annual filing with Companies House.", price: 60 },
      { id: "aa", name: "Annual Accounts Filing", description: "Dormant or micro-entity accounts preparation & filing.", price: 120 },
      { id: "name", name: "Company Name Change", description: "File a NM01 to change your company's registered name.", price: 50 },
      { id: "dorm", name: "Dormant Company Filing", description: "Keep your company compliant while inactive.", price: 80 },
    ],
  },
  {
    key: "uk-idv",
    matches: ["id verification", "ltd id verification", "identity verification"],
    categoryLabel: "Companies House ID Verification",
    description: "Identity verification for directors, PSCs and shareholders.",
    items: [
      { id: "idv", name: "LTD ID Verification", description: "Companies House identity verification (IDV) for directors / PSCs.", price: 40 },
    ],
  },
];

/**
 * Optional URL params:
 *  ?items=roa,utr   pre-selects given items
 *  ?title=...       overrides title
 *  ?service=...     short label shown above summary, also used to pick the category
 */
const Checkout = () => {
  const [params] = useSearchParams();

  useSeo({
    title: "Checkout | Digiformation Ltd",
    description: "Secure checkout for Digiformation services — UK LTD, US LLC, banking, payments and compliance.",
    noindex: true,
  });

  const preselected = useMemo(() => {
    const raw = params.get("items") || "";
    return raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }, [params]);

  const title = params.get("title") || "Order our services";
  const contextLabel = params.get("service") || undefined;

  // Pick the right category group: match by service param first, then by
  // any pre-selected item id, otherwise default to UK Compliance.
  const activeGroup = useMemo(() => {
    const svc = (params.get("service") || "").toLowerCase();
    if (svc) {
      const byService = CATALOG_GROUPS.find((g) =>
        g.matches.some((m) => svc.includes(m.toLowerCase()))
      );
      if (byService) return byService;
    }
    if (preselected.length > 0) {
      const byItem = CATALOG_GROUPS.find((g) =>
        g.items.some((it) => preselected.includes(it.id))
      );
      if (byItem) return byItem;
    }
    return CATALOG_GROUPS[1]; // default to UK Compliance
  }, [params, preselected]);

  // For the UK Compliance group, wire per-item dynamic field sections so the
  // checkout collects exactly what each filing needs (CRN, auth code, etc.).
  const extraSections = useMemo(() => {
    if (activeGroup.key !== "uk-compliance") return undefined;
    return activeGroup.items
      .filter((it) => complianceItemFormFields[it.id])
      .map((it) => ({
        itemId: it.id,
        title: complianceItemFormFields[it.id].title,
        fields: complianceItemFormFields[it.id].fields,
      }));
  }, [activeGroup]);

  return (
    <Layout>
      <CheckoutFlow
        serviceTitle={title}
        serviceCode="ORD"
        currency="GBP"
        items={activeGroup.items}
        defaultSelectedIds={preselected}
        multiSelect
        contextLabel={contextLabel || activeGroup.categoryLabel}
        eyebrow={`${activeGroup.categoryLabel} · Secure checkout`}
        notesPlaceholder="Share company name, registration number, or any details we'll need..."
        extraSections={extraSections}
      />
    </Layout>
  );
};

export default Checkout;
