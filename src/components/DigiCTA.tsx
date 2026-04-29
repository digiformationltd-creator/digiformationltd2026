import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const DigiCTA = () => (
  <section id="contact" className="py-20">
    <div className="container mx-auto px-4">
      <div className="relative overflow-hidden rounded-3xl glass p-12 md:p-20 text-center">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-accent opacity-20 blur-3xl pointer-events-none" />
        <div className="relative">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 max-w-3xl mx-auto leading-tight">
            Ready to <em className="not-italic text-gradient">launch your business?</em>
          </h2>
          <p className="text-lg max-w-xl mx-auto mb-10 opacity-90">
            Book a 30-minute strategy call. We'll map the highest-leverage moves for your roadmap.
          </p>
          <Button asChild variant="hero" size="lg" className="rounded-full">
            <Link to="/contact">
              Book a strategy call <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
);

export default DigiCTA;
