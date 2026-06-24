import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const DigiCTA = () => (
  <section id="contact" className="py-10">
    <div className="container mx-auto px-4">
      <div className="relative overflow-hidden rounded-3xl glass glass-tint-gold p-12 md:p-20 text-center">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-accent opacity-15 blur-3xl pointer-events-none" />
        <div className="relative">
          <h2 data-reveal="rise" className="text-4xl md:text-6xl font-bold mb-6 max-w-3xl mx-auto leading-tight text-foreground">
            Ready to <em className="not-italic text-gradient">launch your business?</em>
          </h2>
          <p className="text-lg max-w-xl mx-auto mb-10 text-foreground/90">
            Book a free 30-minute consultation. Our formation experts will map the fastest, fully-compliant path to launch your UK LTD or US LLC — with the right banking and payment setup from day one.
          </p>
          <Button asChild variant="hero" size="lg" className="rounded-full">
            <Link to="/contact">
              Book Free Consultation <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
);

export default DigiCTA;
