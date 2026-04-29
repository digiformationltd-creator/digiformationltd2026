import { Link } from "react-router-dom";
import { Mail, MessageCircle, Clock, MapPin, ArrowRight } from "lucide-react";
import logo from "@/assets/digiformation-logo.png";

const DigiFooter = () => {
  const year = new Date().getFullYear();

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Digiformation Ltd",
    url: "https://digiformation.uk",
    logo: "https://digiformation.uk/logo.png",
    email: "Info@digiformation.uk",
    telephone: "+92 164 467 464",
    priceRange: "££",
    address: {
      "@type": "PostalAddress",
      addressCountry: "GB",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "10:00",
        closes: "23:00",
      },
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "Info@digiformation.uk",
        telephone: "+92 164 467 464",
        availableLanguage: ["English", "Urdu"],
      },
    ],
  };

  return (
    <footer className="border-t border-border bg-secondary/20 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      {/* Top CTA strip */}
      <div className="border-b border-border/60">
        <div className="container mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight">
              Start your UK company today with Digiformation Ltd
            </h3>
            <p className="opacity-80 mt-1 text-sm md:text-base">
              Message us on WhatsApp or email for a free consultation.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://wa.me/921644674644"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp Us
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-border font-semibold hover:bg-secondary/40 transition"
            >
              Get Free Consultation <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="container mx-auto px-4 py-10 sm:py-14 grid gap-8 sm:gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left sm:-mt-4 sm:col-span-2 lg:col-span-1">
          <img src={logo} alt="Digiformation Ltd" className="h-24 sm:h-32 w-auto max-w-full object-contain mb-4 sm:-ml-2" />
          <p className="text-sm text-white/80 leading-relaxed max-w-md">
            Digiformation Ltd helps you start, manage and grow your business in the UK and USA —
            company formation, address services, compliance and more.
          </p>
        </div>

        {/* Services */}
        <div>
          <div className="text-xs uppercase tracking-[0.18em] font-semibold mb-4 opacity-90">
            Services
          </div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/uk-ltd-formation" className="hover:text-primary transition">UK LTD Formation</Link></li>
            <li><Link to="/llc-formation-services/usa-llc-formation" className="hover:text-primary transition">USA LLC Formation</Link></li>
            <li><Link to="/registered-office-address" className="hover:text-primary transition">Address Services</Link></li>
            <li><Link to="/ltd-id-verification" className="hover:text-primary transition">ID Verification</Link></li>
            <li><Link to="/compliance" className="hover:text-primary transition">Annual Filing</Link></li>
            <li><Link to="/services/web-design" className="hover:text-primary transition">Web Development</Link></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <div className="text-xs uppercase tracking-[0.18em] font-semibold mb-4 opacity-90">
            Company
          </div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-primary transition">About Us</Link></li>
            <li><Link to="/pricing" className="hover:text-primary transition">Pricing</Link></li>
            <li><Link to="/blog" className="hover:text-primary transition">Blog</Link></li>
            <li><Link to="/faq" className="hover:text-primary transition">FAQ</Link></li>
            <li><Link to="/contact" className="hover:text-primary transition">Contact</Link></li>
            <li><Link to="/privacy-policy" className="hover:text-primary transition">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-primary transition">Terms & Conditions</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <div className="text-xs uppercase tracking-[0.18em] font-semibold mb-4 opacity-90">
            Get in Touch
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <a href="mailto:Info@digiformation.uk" className="hover:text-primary transition break-all">
                Info@digiformation.uk
              </a>
            </li>
            <li className="flex items-start gap-3">
              <MessageCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <a
                href="https://wa.me/921644674644"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition"
              >
                +92 164 467 464 (WhatsApp)
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span>
                Mon – Sat: 10:00 AM – 11:00 PM<br />
                Sunday: Closed
              </span>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span>United Kingdom</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border/60">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs opacity-80">
          <span>© {year} Digiformation Ltd. All rights reserved.</span>
          <span>Trusted by international clients · Fast UK & USA company registration</span>
        </div>
      </div>
    </footer>
  );
};

export default DigiFooter;
