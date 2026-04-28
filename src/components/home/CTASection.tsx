import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CTASection = () => (
  <section className="py-32 relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--gold)/0.12),transparent_60%)]" />
    <div className="container px-4 relative">
      <div className="glass-card max-w-5xl mx-auto p-14 md:p-20 text-center">
        <div className="eyebrow justify-center mb-6">Ready When You Are</div>
        <h2 className="font-display text-4xl md:text-6xl font-light leading-tight">
          Let's build your <em className="font-semibold gradient-text-gold not-italic">global business</em> together
        </h2>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Book a free 30-minute consultation. We'll map out the fastest, most cost-effective route to launch your UK or US company.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/contact" className="btn-gold group">
            Book Free Consultation
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link to="/pricing" className="btn-ghost-gold">View Pricing</Link>
        </div>
      </div>
    </div>
  </section>
);

export default CTASection;
