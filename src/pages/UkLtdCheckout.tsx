import { useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import CheckoutFlow, { CheckoutItem } from "@/components/checkout/CheckoutFlow";

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

const PACKAGE_DESCRIPTIONS: Record<PackageName, string> = {
  Starter: "Company incorporation + digital documents",
  Silver: "Starter + Registered Office Address (1 year)",
  Gold: "Silver + Business Service Address + UTR registration",
  Platinum: "Gold + VAT registration + ongoing compliance support",
};

const UkLtdCheckout = () => {
  const [params] = useSearchParams();
  const jurCode = (params.get("jurisdiction") || "").toUpperCase();
  const pkgParam = params.get("package") as PackageName | null;
  const packageName: PackageName = PACKAGES.includes(pkgParam as PackageName) ? (pkgParam as PackageName) : "Silver";

  useEffect(() => {
    document.title = "Checkout — UK LTD Formation | Digiformation Ltd";
  }, []);

  const jurName = JURISDICTIONS[jurCode];
  if (!jurCode || !jurName) return <Navigate to="/uk-services/uk-ltd-formation/choose-jurisdiction" replace />;

  const items: CheckoutItem[] = PACKAGES.map((p) => ({
    id: p,
    name: `${p} Package`,
    description: PACKAGE_DESCRIPTIONS[p],
    price: PACKAGE_PRICES[p],
  }));

  return (
    <Layout>
      <CheckoutFlow
        serviceTitle="UK LTD Formation"
        serviceCode="LTD"
        currency="GBP"
        items={items}
        defaultSelectedIds={[packageName]}
        multiSelect={false}
        contextLabel={`Jurisdiction: ${jurName}`}
        backHref="/uk-services/uk-ltd-formation/choose-jurisdiction"
        backLabel="Back to jurisdictions"
        eyebrow="UK LTD · Step 3 of 3"
        notesPlaceholder="Tell us your proposed company name, alternatives, and business activity..."
        fixedPackageName={packageName}
        liveSelfieMode="link"
        liveSelfieLink="https://verify.didit.me/u/dzhdYtifRt-jeb3kZsSptg"
        showCompanyName
      />
    </Layout>
  );
};

export default UkLtdCheckout;
