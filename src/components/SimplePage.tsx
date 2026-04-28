import Layout from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

type SimplePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
};

const SimplePage = ({ eyebrow, title, description, children }: SimplePageProps) => (
  <Layout>
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="glow-orb -top-40 -right-40 opacity-50" />
      <div className="container px-4 py-24 md:py-32 relative">
        <div className="max-w-4xl">
          <div className="eyebrow eyebrow-left mb-6">{eyebrow}</div>
          <h1 className="font-display text-5xl md:text-7xl font-light leading-[1.02]">
            {title.split(" ").slice(0, -1).join(" ")} <em className="gradient-text-gold not-italic font-semibold">{title.split(" ").slice(-1)}</em>
          </h1>
          <p className="mt-8 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">{description}</p>
          {!children && (
            <Link to="/contact" className="btn-gold mt-10 group">
              Get In Touch <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </Link>
          )}
        </div>
      </div>
    </section>
    {children && <section className="pb-32"><div className="container px-4">{children}</div></section>}
  </Layout>
);

export default SimplePage;
