import Layout from "@/components/layout/Layout";
import CheckoutFlow, { CheckoutItem } from "@/components/checkout/CheckoutFlow";
import { useSeo } from "@/lib/seo";

const LtdIdVerificationCheckout = () => {
  useSeo({
    title: "Checkout — LTD ID Verification | Digiformation Ltd",
    description: "Complete your Companies House LTD identity verification checkout.",
    noindex: true,
  });

  const items: CheckoutItem[] = [
    {
      id: "ltd-id-verification",
      name: "LTD ID Verification",
      description: "Companies House identity verification for directors, PSCs, secretaries and shareholders.",
      price: 20,
      fixed: true,
    },
  ];

  return (
    <Layout>
      <CheckoutFlow
        serviceTitle="LTD ID Verification"
        serviceCode="IDV"
        currency="GBP"
        items={items}
        defaultSelectedIds={["ltd-id-verification"]}
        lockSelection
        contextLabel="Service: Companies House ID Verification"
        backHref="/uk-services/ltd-id-verification"
        backLabel="Back to ID Verification"
        eyebrow="UK · Compliance"
        fixedPackageName="LTD ID Verification"
        liveSelfieMode="upload"
        liveSelfieLink="https://verify.didit.me/u/dzhdYtifRt-jeb3kZsSptg"
        showCompanyName
        companyNameOptional
        showRole
        hideBusinessActivity
        showProofOfAddress
        showDateOfBirth
        showPassportNumber
      />
    </Layout>
  );
};

export default LtdIdVerificationCheckout;
