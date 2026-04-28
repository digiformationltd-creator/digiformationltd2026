import { Link, useParams } from "react-router-dom";
import ServicePage from "@/components/ServicePage";
import { ukServices, ukCompliance, usaServices, banking } from "@/data/navigation";
import Layout from "@/components/layout/Layout";

const allServices = [
  ...ukServices.map(s => ({ ...s, group: "UK Services", base: "/uk-services" })),
  ...ukCompliance.map(s => ({ ...s, group: "UK Compliance", base: "/uk-compliance" })),
  ...usaServices.map(s => ({ ...s, group: "USA Services", base: "/usa-services" })),
  ...banking.map(s => ({ ...s, group: "Banking & Payments", base: "/banks-payment-solutions" })),
];

export const DynamicServicePage = () => {
  const params = useParams();
  const slug = params["*"] || Object.values(params).filter(Boolean).pop() || "";
  const path = `/${window.location.pathname.replace(/^\/+/, "")}`;
  const match = allServices.find(s => s.path === path);

  if (!match) {
    return (
      <Layout>
        <div className="container px-4 py-32 text-center">
          <div className="eyebrow justify-center mb-5">Service</div>
          <h1 className="font-display text-5xl">Page coming soon</h1>
          <Link to="/" className="btn-gold mt-8">Back to Home</Link>
        </div>
      </Layout>
    );
  }

  return (
    <ServicePage
      eyebrow={match.group}
      title={match.name}
      description={`Professional ${match.name.toLowerCase()} delivered with speed, transparency and full compliance. Trusted by 500+ entrepreneurs across the UK, USA and beyond.`}
    />
  );
};
