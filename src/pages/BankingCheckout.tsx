import { useParams, Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import CheckoutFlow, { CheckoutItem } from "@/components/checkout/CheckoutFlow";
import { bankingProviders } from "@/data/banking";
import { useSeo } from "@/lib/seo";

const deriveRegion = (requirements: string[]): "uk" | "usa" | "both" => {
  const line = requirements.find((r) => /Number$/.test(r)) || "";
  if (/UK \/ USA/.test(line)) return "both";
  if (/USA/.test(line)) return "usa";
  return "uk";
};

const phoneLabelFor = (region: "uk" | "usa" | "both") =>
  region === "usa" ? "USA Number (for bank OTP)" : region === "both" ? "UK / USA Number (for bank OTP)" : "UK Number (for bank OTP)";

const BankingCheckout = () => {
  const { slug } = useParams();
  const provider = bankingProviders.find((p) => p.slug === slug);

  useSeo(
    {
      title: provider ? `Checkout — ${provider.name} | Digiformation Ltd` : "Checkout | Digiformation Ltd",
      description: provider
        ? `Complete your ${provider.name} account setup with Digiformation. Secure checkout for business banking and payment gateway services.`
        : "Secure checkout for banking and payment gateway services.",
      noindex: true,
    },
    [slug],
  );

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
        showSeparateWhatsapp
        whatsappContactLabel="WhatsApp contact number"
        whatsappContactPlaceholder="+44 ... or +1 ..."
      />
    </Layout>
  );
};

export default BankingCheckout;
