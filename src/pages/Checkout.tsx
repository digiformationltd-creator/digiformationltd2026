import { useSeo } from "@/lib/seo";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import CheckoutFlow, { CheckoutItem } from "@/components/checkout/CheckoutFlow";
import { complianceItemFormFields } from "@/data/compliance";
import { findServiceBySlug } from "@/data/serviceCatalog";

/**
 * Category-grouped catalog for multi-add-on flows (UK Address bundle,
 * full UK Compliance picker, ID Verification single-item). Individual
 * per-service checkouts are resolved via the central serviceCatalog when
 * the URL carries `?service=<slug>`.
 */
type CatalogGroup = {
  key: string;
  matches: string[];
  categoryLabel: string;
  description?: string;
  items: CheckoutItem[];
};

const CATALOG_GROUPS: CatalogGroup[] = [
  {
    key: "uk-address",
    matches: ["uk address services", "address services"],
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
    matches: ["compliance", "hmrc", "companies house multi", "uk filings bundle"],
    categoryLabel: "UK Compliance & Filings",
    description: "HMRC and Companies House filings for your UK Limited company.",
    items: [
      { id: "utr", name: "UTR Number Registration", description: "HMRC tax registration for individuals or companies.", price: 50 },
      { id: "vat", name: "VAT Registration", description: "Register your UK company for VAT with HMRC.", price: 70 },
      { id: "cs", name: "Confirmation Statement Filing", description: "Annual filing with Companies House.", price: 65 },
      { id: "aa", name: "Annual Accounts Filing", description: "Dormant or micro-entity accounts preparation & filing.", price: 120 },
      { id: "name", name: "Company Name Change", description: "File a NM01 to change your company's registered name.", price: 30 },
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

const Checkout = () => {
  const [params] = useSearchParams();

  useSeo({
    title: "Checkout | Digiformation Ltd",
    description: "Secure checkout for Digiformation services — UK LTD, US LLC, banking, payments and compliance.",
    noindex: true,
  });

  const preselected = useMemo(() => {
    const raw = params.get("items") || "";
    return raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  }, [params]);

  const serviceParam = params.get("service") || "";
  const titleParam = params.get("title");

  // 1) Priority: single-service slug from the central catalog.
  //    This is the standard, priced, locked checkout (same flow as IDV).
  const catalogEntry = useMemo(() => findServiceBySlug(serviceParam), [serviceParam]);

  if (catalogEntry) {
    const item: CheckoutItem = {
      id: catalogEntry.slug,
      name: catalogEntry.name,
      description: catalogEntry.description,
      price: catalogEntry.price,
      fixed: true,
    };
    const extraSection = catalogEntry.complianceItemId && complianceItemFormFields[catalogEntry.complianceItemId]
      ? [{
          itemId: catalogEntry.slug,
          title: complianceItemFormFields[catalogEntry.complianceItemId].title,
          fields: complianceItemFormFields[catalogEntry.complianceItemId].fields,
        }]
      : undefined;

    const isConfirmationStatement =
      catalogEntry.complianceItemId === "cs" ||
      catalogEntry.slug === "confirmation-statement";

    return (
      <Layout>
        <CheckoutFlow
          serviceTitle={titleParam || catalogEntry.name}
          serviceCode="ORD"
          currency={catalogEntry.currency}
          items={[item]}
          defaultSelectedIds={[item.id]}
          lockSelection
          contextLabel={`${catalogEntry.category} · ${catalogEntry.name}`}
          eyebrow={`${catalogEntry.category} · Secure checkout`}
          notesPlaceholder="Share any details we'll need to fulfil your order..."
          fixedPackageName={catalogEntry.name}
          extraSections={extraSection}
          showDateOfBirth={!isConfirmationStatement}
          hideBusinessActivity={isConfirmationStatement}
          hideAddress={isConfirmationStatement}
        />
      </Layout>
    );
  }

  // 2) Fallback: multi-select category groups (Address bundle, Compliance picker, IDV).
  const activeGroup = useMemo(() => {
    const svc = serviceParam.toLowerCase();
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
    return CATALOG_GROUPS[1]; // default to UK Compliance picker
  }, [serviceParam, preselected]);

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
        serviceTitle={titleParam || "Order our services"}
        serviceCode="ORD"
        currency="GBP"
        items={activeGroup.items}
        defaultSelectedIds={preselected}
        multiSelect
        contextLabel={serviceParam || activeGroup.categoryLabel}
        eyebrow={`${activeGroup.categoryLabel} · Secure checkout`}
        notesPlaceholder="Share company name, registration number, or any details we'll need..."
        extraSections={extraSections}
      />
    </Layout>
  );
};

export default Checkout;
