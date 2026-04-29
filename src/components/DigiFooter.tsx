import { Link } from "react-router-dom";
import { Mail, MessageCircle, Clock, MapPin, ArrowRight, Facebook, Instagram, Youtube, Linkedin, Globe, Building2 } from "lucide-react";
import logo from "@/assets/digiformation-logo.png";
import NewsletterForm from "./NewsletterForm";

const socials = [
  { name: "WhatsApp", href: "https://wa.me/923164467464", icon: MessageCircle },
  { name: "Facebook", href: "https://www.facebook.com/share/1D676UBQw5/", icon: Facebook },
  { name: "Instagram", href: "https://www.instagram.com/digiformationltd?igsh=ejBoMmFsOXFpMmdw", icon: Instagram },
  { name: "YouTube", href: "https://www.youtube.com/@digiformationltd", icon: Youtube },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/muhammad-haroon-9a9945366", icon: Linkedin },
  { name: "Threads", href: "https://www.threads.com/@digiformationltd", icon: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.043.213.087.318.131 1.477.692 2.56 1.738 3.134 3.025.797 1.802.871 4.741-1.512 7.057-1.823 1.776-4.038 2.578-7.295 2.6Zm1.003-11.69c-.327 0-.66.01-.99.03-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.787 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-1.967-.23Z"/></svg>
  )},
  { name: "X (Twitter)", href: "https://x.com/Digiformation00", icon: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  )},
  { name: "Pinterest", href: "https://pin.it/27w3dT5lp", icon: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z"/></svg>
  )},
  { name: "Personal Site", href: "https://www.digiformation.uk/", icon: Globe },
  { name: "Companies House", href: "https://find-and-update.company-information.service.gov.uk/company/16994903", icon: Building2 },
];

const DigiFooter = () => {
  const year = new Date().getFullYear();

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
              <MessageCircle className="w-4 h-4" /> WhatsApp Us
            </a>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="container mx-auto px-4 py-10 sm:py-14 grid gap-8 sm:gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {/* Brand */}
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left sm:-mt-4 sm:col-span-2 lg:col-span-1">
          <img src={logo} alt="Digiformation Ltd" className="h-24 sm:h-32 w-auto max-w-full object-contain mb-4 sm:-ml-2" />
          <p className="text-xs opacity-75 mb-4 leading-relaxed">
            Founded by Muhammad Haroon — UK & US company formation, banking & compliance.
          </p>
          <div className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-3 opacity-90">Connect With Us</div>
          <div className="grid grid-cols-5 gap-2 w-full max-w-[240px] sm:max-w-none">
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

        {/* Services */}
        <div>
          <div className="text-xs uppercase tracking-[0.18em] font-semibold mb-4 opacity-90">
            Quick Links
          </div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/uk-services" className="hover:text-primary transition">UK Services</Link></li>
            <li><Link to="/usa-services" className="hover:text-primary transition">USA Services</Link></li>
            <li><Link to="/banking" className="hover:text-primary transition">Banks & Payment Solutions</Link></li>
            <li><Link to="/pricing" className="hover:text-primary transition">Packages</Link></li>
            <li><Link to="/contact" className="hover:text-primary transition">Contact</Link></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <div className="text-xs uppercase tracking-[0.18em] font-semibold mb-4 opacity-90">
            Company
          </div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-primary transition">About Us</Link></li>
            <li><Link to="/pricing" className="hover:text-primary transition">Packages</Link></li>
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
                href="https://wa.me/923164467464"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition"
              >
                +92 316 446 7464 (WhatsApp)
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

        {/* Newsletter */}
        <div className="sm:col-span-2 lg:col-span-1">
          <NewsletterForm />
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
