import { useEffect, useState } from "react";
import { Navigate, useSearchParams, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import CheckoutFlow, { CheckoutItem } from "@/components/checkout/CheckoutFlow";

type StatePricing = {
  state_code: string;
  state_name: string;
  starter_price_usd: number;
  silver_price_usd: number;
  gold_price_usd: number;
};

const PACKAGES = ["Starter", "Silver", "Gold"] as const;
type PackageName = (typeof PACKAGES)[number];

const DESCRIPTIONS: Record<PackageName, string> = {
  Starter: "LLC formation + Articles of Organization",
  Silver: "Starter + Registered Agent (1 year) + EIN application",
  Gold: "Silver + Operating Agreement + ITIN assistance",
};

const UsaLlcCheckout = () => {
  const [params] = useSearchParams();
  const stateCode = (params.get("state") || "").toUpperCase();
  const pkgParam = params.get("package") as PackageName | null;
  const packageName: PackageName = PACKAGES.includes(pkgParam as PackageName) ? (pkgParam as PackageName) : "Silver";

  const [pricing, setPricing] = useState<StatePricing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Checkout — U.S. LLC Formation | Digiformation Ltd";
  }, []);

  useEffect(() => {
    if (!stateCode) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("us_llc_state_pricing")
        .select("state_code,state_name,starter_price_usd,silver_price_usd,gold_price_usd")
        .eq("state_code", stateCode)
        .maybeSingle();
      if (data) setPricing(data as StatePricing);
      setLoading(false);
    })();
  }, [stateCode]);

  if (!stateCode) return <Navigate to="/usa-services/us-llc-formation/choose-state" replace />;

  if (loading) {
    return (
      <Layout>
        <div className="py-24 grid place-items-center opacity-70">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </Layout>
    );
  }
  if (!pricing) {
    return (
      <Layout>
        <div className="text-center py-24">
          <p className="opacity-80 mb-4">We couldn't find pricing for state code "{stateCode}".</p>
          <Button asChild variant="hero" className="rounded-full">
            <Link to="/usa-services/us-llc-formation/choose-state">Choose a state</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const items: CheckoutItem[] = [
    { id: "Starter", name: "Starter Package", description: DESCRIPTIONS.Starter, price: Number(pricing.starter_price_usd) },
    { id: "Silver", name: "Silver Package", description: DESCRIPTIONS.Silver, price: Number(pricing.silver_price_usd) },
    { id: "Gold", name: "Gold Package", description: DESCRIPTIONS.Gold, price: Number(pricing.gold_price_usd) },
  ];

  return (
    <Layout>
      <CheckoutFlow
        serviceTitle="U.S. LLC Formation"
        serviceCode="LLC"
        currency="USD"
        items={items}
        defaultSelectedIds={[packageName]}
        multiSelect={false}
        contextLabel={`State: ${pricing.state_name} (${pricing.state_code})`}
        backHref="/usa-services/us-llc-formation/choose-state"
        backLabel="Back to states"
        eyebrow="U.S. LLC · Step 3 of 3"
        notesPlaceholder="Tell us your proposed company name, alternatives, and business activity..."
        fixedPackageName={packageName}
      />
    </Layout>
  );
};

export default UsaLlcCheckout;
