import { useEffect } from "react";
import DigiNav from "@/components/DigiNav";
import DigiHero from "@/components/DigiHero";
import DigiTrustBar from "@/components/DigiTrustBar";
import DigiServicesSlider from "@/components/DigiServicesSlider";
import DigiStats from "@/components/DigiStats";
import DigiServices from "@/components/DigiServices";
import DigiWhyChoose from "@/components/DigiWhyChoose";
import DigiCaseStudies from "@/components/DigiCaseStudies";
import DigiTestimonials from "@/components/DigiTestimonials";
import DigiCTA from "@/components/DigiCTA";
import DigiFooter from "@/components/DigiFooter";

const Index = () => {
  useEffect(() => {
    document.title =
      "Digiformation Ltd | UK & US Company Formation, Shelf Companies & Banking Solutions";

    const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const description =
      "Digiformation Ltd provides fast, transparent and fully compliant UK & US company formation, ready-made UK shelf companies, banking solutions, payment gateways and web development for entrepreneurs worldwide.";

    setMeta("description", description);
    setMeta("keywords", "UK LTD formation, US LLC formation, UK shelf companies for sale, business banking solutions, payment gateway setup, web development for entrepreneurs");
    setMeta("og:title", "Digiformation Ltd | UK & US Company Formation, Shelf Companies & Banking Solutions", "property");
    setMeta("og:description", description, "property");
    setMeta("og:type", "website", "property");
    setMeta("twitter:title", "Digiformation Ltd | UK & US Company Formation, Shelf Companies & Banking Solutions");
    setMeta("twitter:description", description);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.origin + "/";

    // JSON-LD schema
    const schemas = [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Digiformation Ltd",
        url: window.location.origin,
        description,
        sameAs: [],
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Digiformation Ltd",
        url: window.location.origin,
        potentialAction: {
          "@type": "SearchAction",
          target: `${window.location.origin}/?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: "Digiformation Ltd",
        url: window.location.origin,
        priceRange: "$$",
        areaServed: ["United Kingdom", "United States", "Worldwide"],
      },
      {
        "@context": "https://schema.org",
        "@type": "Service",
        serviceType: "Company Formation",
        provider: { "@type": "Organization", name: "Digiformation Ltd" },
        areaServed: ["United Kingdom", "United States"],
      },
    ];

    let scriptEl = document.getElementById("home-jsonld") as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.id = "home-jsonld";
      scriptEl.type = "application/ld+json";
      document.head.appendChild(scriptEl);
    }
    scriptEl.text = JSON.stringify(schemas);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <DigiNav />
      <main>
        <h1 className="sr-only">
          Digiformation Ltd — UK &amp; US Company Formation, Shelf Companies &amp; Banking Solutions
        </h1>
        <DigiHero />
        <DigiTrustBar />
        <DigiStats />
        <DigiServicesSlider />
        <DigiServices />
        <DigiWhyChoose />
        <DigiCaseStudies />
        <DigiTestimonials />
        <DigiCTA />
      </main>
      <DigiFooter />
    </div>
  );
};

export default Index;
