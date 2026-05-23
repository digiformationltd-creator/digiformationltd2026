import { useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import CheckoutFlow, { CheckoutItem } from "@/components/checkout/CheckoutFlow";
import { bankingProviders } from "@/data/banking";

const deriveRegion = (requirements: string[]): "uk" | "usa" | "both" => {
  const line = requirements.find((r) => /Number$/.test(r)) || "";
  if (/UK \/ USA/.test(line)) return "both";
  if (/USA/.test(line)) return "usa";
  return "uk";
};

const phoneLabelFor = (region: "uk" | "usa" | "both") =>
  region === "usa" ? "USA Number (WhatsApp)" : region === "both" ? "UK / USA Number (WhatsApp)" : "UK Number (WhatsApp)";

const BankingCheckout = () => {
  const { slug } = useParams();
  const provider = bankingProviders.find((p) => p.slug === slug);

  useEffect(() => {
    if (provider) document.title = `Checkout — ${provider.name} | Digiformation Ltd`;
  }, [provider]);

  if (!provider) return <Navigate to="/banks-payment-solutions" replace />;

  const priceNum = Number(provider.setupPrice.replace(/[^0-9.]/g, "")) || 0;
  const region = deriveRegion(provider.requirements);

  const items: CheckoutItem[] = [
    {
      id: `bank-${provider.slug}`,
      name: `${provider.name} Account Setup`,
      description: provider.tagline,
      price: priceNum,
      fixed: true,
    },
  ];

  return (
    <Layout>
      <CheckoutFlow
        serviceTitle={`${provider.name} Account Setup`}
        serviceCode="BNK"
        currency="GBP"
        items={items}
        defaultSelectedIds={[`bank-${provider.slug}`]}
        lockSelection
        contextLabel={`Service: ${provider.name} Account Setup`}
        backHref={`/banks-payment-solutions/${provider.slug}`}
        backLabel={`Back to ${provider.name}`}
        eyebrow="Banks & Payment Solutions"
        fixedPackageName={`${provider.name} Account Setup`}
        liveSelfieMode="none"
        showCompanyName
        companyNameOptional
        hideBusinessActivity
        showProofOfAddress
        showWebsite
        whatsappLabel={phoneLabelFor(region)}
        whatsappPlaceholder={
          region === "usa" ? "+1 ..." : region === "both" ? "+44 ... or +1 ..." : "+44 ..."
        }
      />
    </Layout>
  );
};

export default BankingCheckout;
