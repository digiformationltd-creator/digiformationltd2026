import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowRight, Home, MessageCircle, Mail, Search } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useSeo } from "@/lib/seo";

const popularLinks = [
  { label: "UK LTD Formation", href: "/uk-services/uk-ltd-formation" },
  { label: "USA LLC Formation", href: "/usa-services/us-llc-formation" },
  { label: "Banks & Payment Solutions", href: "/banks-payment-solutions" },
  { label: "Pricing & Packages", href: "/pricing" },
  { label: "Contact Us", href: "/contact" },
  { label: "Read Our Blog", href: "/blog" },
];

const NotFound = () => {
  const location = useLocation();

  useSeo({
    title: "Page Not Found (404) — Digiformation Ltd",
    description: "The page you're looking for doesn't exist. Browse our UK LTD, US LLC, banking, and compliance services instead.",
    noindex: true,
  });

  useEffect(() => {
    console.error("404 — User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <section className="relative overflow-hidden bg-gradient-hero min-h-[80vh] flex items-center">
        <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />

        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 mb-6 justify-center">
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">Error 404</span>
            </div>

            <h1 className="text-7xl md:text-9xl font-bold leading-none tracking-tight text-gradient mb-6">
              404
            </h1>
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              This page took the wrong company route
            </h2>
            <p className="text-base md:text-lg opacity-80 max-w-xl mx-auto mb-10">
              The page you're looking for doesn't exist or has been moved. Don't worry —
              our UK & USA formation services are still here, ready to help you launch.
            </p>

            <div className="flex flex-wrap gap-3 justify-center mb-12">
              <Button asChild variant="hero" size="lg" className="rounded-full">
                <Link to="/">
                  <Home className="w-4 h-4" /> Back to Home
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full">
                <Link to="/contact">
                  <MessageCircle className="w-4 h-4" /> Contact Support
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full">
                <a href="mailto:Info@digiformation.uk">
                  <Mail className="w-4 h-4" /> Email Us
                </a>
              </Button>
            </div>

            <div className="glass rounded-2xl p-6 md:p-8 text-left">
              <div className="flex items-center gap-2 mb-4 justify-center">
                <Search className="w-4 h-4 text-primary" />
                <span className="text-xs uppercase tracking-[0.18em] font-semibold">Popular Pages</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {popularLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="flex items-center justify-between gap-2 p-3 rounded-lg bg-background/40 hover:bg-primary/15 transition-colors group"
                  >
                    <span className="text-sm font-medium">{link.label}</span>
                    <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            </div>

            <p className="text-xs opacity-60 mt-8">
              Tried path: <code className="px-2 py-0.5 rounded bg-background/40">{location.pathname}</code>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default NotFound;
