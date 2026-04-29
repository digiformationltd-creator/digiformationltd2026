import Layout from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type SimplePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
};

const splitTitle = (t: string) => {
  const parts = t.split(" ");
  if (parts.length < 2) return { lead: "", accent: t };
  return { lead: parts.slice(0, -1).join(" "), accent: parts.slice(-1).join(" ") };
};

const SimplePage = ({ eyebrow, title, description, children }: SimplePageProps) => {
  const { lead, accent } = splitTitle(title);
  return (
    <Layout>
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="h-px w-7 bg-primary" />
              <span className="text-xs uppercase tracking-[0.18em] font-semibold">{eyebrow}</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.02]">
              {lead && <>{lead} </>}
              <em className="not-italic text-gradient">{accent}</em>
            </h1>
            <p className="mt-8 text-lg md:text-xl leading-relaxed max-w-2xl opacity-90">{description}</p>
            {!children && (
              <Button asChild variant="hero" size="lg" className="rounded-full mt-10">
                <Link to="/contact">Get In Touch <ArrowRight className="w-4 h-4" /></Link>
              </Button>
            )}
          </div>
        </div>
      </section>
      {children && <section className="pb-32"><div className="container mx-auto px-4">{children}</div></section>}
    </Layout>
  );
};

export default SimplePage;
