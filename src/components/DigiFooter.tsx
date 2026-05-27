import { Link, useLocation } from "react-router-dom";
import { Mail, Clock, MapPin, Facebook, Instagram, Youtube, Linkedin, Building2, Handshake, UserCircle2 } from "lucide-react";
import logo from "@/assets/digiformation-logo.png";


// WhatsApp icon — neutral monochrome to match other social icons
const WhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
  </svg>
);

const socials = [
  { name: "WhatsApp", href: "https://wa.me/923164467464", icon: WhatsAppIcon },
  { name: "Facebook", href: "https://www.facebook.com/share/1D676UBQw5/", icon: Facebook },
  { name: "Instagram", href: "https://www.instagram.com/digiformationltd?igsh=ejBoMmFsOXFpMmdw", icon: Instagram },
  { name: "YouTube", href: "https://www.youtube.com/@digiformationltd", icon: Youtube },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/muhammad-haroon-9a9945366", icon: Linkedin },
  { name: "X (Twitter)", href: "https://x.com/Digiformation00", icon: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  )},
  { name: "Pinterest", href: "https://pin.it/27w3dT5lp", icon: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z"/></svg>
  )},
  { name: "Companies House", href: "https://find-and-update.company-information.service.gov.uk/company/16994903", icon: Building2 },
];

const DigiFooter = () => {
  const year = new Date().getFullYear();
  const { pathname } = useLocation();
  const hideCtas = pathname !== "/";

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Digiformation Ltd",
    url: "https://digiformation.uk",
    logo: "https://digiformation.uk/logo.png",
    email: "Info@digiformation.uk",
    telephone: "+92 316 446 7464",
    priceRange: "££",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Lahore",
      addressRegion: "Punjab",
      addressCountry: "PK",
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
        telephone: "+92 316 446 7464",
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
      {!hideCtas && (
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
              href="https://wa.me/923164467464"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition"
            >
              <WhatsAppIcon className="w-4 h-4" /> WhatsApp Us
            </a>
          </div>
        </div>
      </div>
      )}


      {/* Main grid */}
      <div className="container mx-auto px-4 py-10 sm:py-14 grid gap-8 sm:gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 items-stretch">
        {/* Brand */}
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left sm:col-span-2 lg:col-span-1 h-full">
          <img src={logo} alt="Digiformation Ltd logo — trusted UK Limited Company & US LLC formation worldwide" className="h-24 w-auto object-contain mb-4" />
          <div className="mt-auto w-full">
            <div className="text-xs uppercase tracking-[0.18em] font-semibold mb-3 opacity-90">Connect With Us</div>
            <div className="grid grid-cols-4 gap-2 w-full max-w-[200px] sm:max-w-none">
              {socials.map((s) => {
                const IconComp = s.icon;
                return (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.name}
                    title={s.name}
                    className="w-9 h-9 rounded-lg glass grid place-items-center hover:bg-primary/20 hover:-translate-y-0.5 transition-all"
                  >
                    <IconComp className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Services */}
        <div>
          <div className="text-xs uppercase tracking-[0.18em] font-semibold mb-4 opacity-90">
            Quick Links
          </div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/uk-services" className="hover:text-primary transition">UK Services</Link></li>
            <li><Link to="/usa-services" className="hover:text-primary transition">USA Services</Link></li>
            <li><Link to="/banks-payment-solutions" className="hover:text-primary transition">Banks & Payment Solutions</Link></li>
            <li><Link to="/uk-compliance" className="hover:text-primary transition">UK Compliance</Link></li>
            <li><Link to="/web-development" className="hover:text-primary transition">Web Development</Link></li>
            <li><Link to="/#services" className="hover:text-primary transition">Packages</Link></li>
            <li><Link to="/#contact" className="hover:text-primary transition">Contact</Link></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <div className="text-xs uppercase tracking-[0.18em] font-semibold mb-4 opacity-90">
            Company
          </div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/#about" className="hover:text-primary transition">About Us</Link></li>
            <li><Link to="/blog" className="hover:text-primary transition">Blog</Link></li>
            <li><Link to="/faq" className="hover:text-primary transition">FAQ</Link></li>
            <li><Link to="/affiliate" className="hover:text-primary transition">Affiliate Program</Link></li>
            <li><Link to="/#contact" className="hover:text-primary transition">Contact</Link></li>
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
              <WhatsAppIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <a
                href="https://wa.me/923164467464"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition"
              >
                +92 316 446 7464
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
              <span>
                Bedian Road, Bhatta Chowk,<br />
                Lahore, Punjab, Pakistan
              </span>
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
