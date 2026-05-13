import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import CheckoutFlow, { CheckoutItem } from "@/components/checkout/CheckoutFlow";

/**
 * Generic catalog of à-la-carte services. Keep prices in sync with the
 * dedicated service pages.
 */
const CATALOG: CheckoutItem[] = [
  { id: "roa", name: "Registered Office Address (1 yr)", description: "Official UK address for company registration & government mail.", price: 40 },
  { id: "bsa", name: "Business Service Address (1 yr)", description: "Professional UK address for marketing, correspondence & registration.", price: 60 },
  { id: "dsa", name: "Director Service Address (1 yr)", description: "Official UK address for individual directors.", price: 20 },
  { id: "utr", name: "UTR Number Registration", description: "HMRC tax registration for individuals or companies.", price: 50 },
  { id: "vat", name: "VAT Registration", description: "Register your UK company for VAT with HMRC.", price: 70 },
  { id: "cs", name: "Confirmation Statement Filing", description: "Annual filing with Companies House.", price: 60 },
  { id: "aa", name: "Annual Accounts Filing", description: "Dormant or micro-entity accounts preparation & filing.", price: 120 },
  { id: "idv", name: "LTD ID Verification", description: "Companies House identity verification (IDV) for directors / PSCs.", price: 40 },
  { id: "name", name: "Company Name Change", description: "File a NM01 to change your company's registered name.", price: 50 },
  { id: "dorm", name: "Dormant Company Filing", description: "Keep your company compliant while inactive.", price: 80 },
];

/**
 * Optional URL params:
 *  ?items=roa,utr   pre-selects given items
 *  ?title=...       overrides title
 *  ?service=...     short label shown above summary
 */
const Checkout = () => {
  const [params] = useSearchParams();

  useEffect(() => {
    document.title = "Checkout | Digiformation Ltd";
  }, []);

  const preselected = useMemo(() => {
    const raw = params.get("items") || "";
    return raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }, [params]);

  const title = params.get("title") || "Order our services";
  const contextLabel = params.get("service") || undefined;

  return (
    <Layout>
      <CheckoutFlow
        serviceTitle={title}
        serviceCode="ORD"
        currency="GBP"
        items={CATALOG}
        defaultSelectedIds={preselected}
        multiSelect
        contextLabel={contextLabel}
        eyebrow="Secure checkout · 3 steps"
        notesPlaceholder="Share company name, registration number, or any details we'll need..."
      />
    </Layout>
  );
};

export default Checkout;
