import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import { ukServices, usaServices, banking } from "@/data/navigation";

const Footer = () => {
  return (
    <footer className="relative border-t border-gold/15 mt-32 bg-surface/40">
      <div className="container px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-sm bg-gradient-to-br from-gold to-gold-light flex items-center justify-center text-background font-display font-bold text-lg">D</div>
              <div className="font-display text-xl font-semibold">Digi<span className="text-gold">formation</span></div>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mb-6">
              Your trusted partner for UK & US company formation, banking, payment gateways, compliance and web development — built for global entrepreneurs.
            </p>
            <div className="space-y-2.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2.5"><Mail className="w-4 h-4 text-gold" /> hello@digiformation.co.uk</div>
              <div className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-gold" /> +44 (0) 20 0000 0000</div>
              <div className="flex items-center gap-2.5"><MapPin className="w-4 h-4 text-gold" /> London, United Kingdom</div>
            </div>
            <div className="mt-6 text-xs text-muted-foreground/70 font-utility tracking-wider">
              Company No. 16994903
            </div>
          </div>

          <FooterCol title="UK Services" links={ukServices.slice(0, 6)} />
          <FooterCol title="USA Services" links={usaServices} />
          <FooterCol title="Banking" links={banking.slice(0, 7)} />
        </div>

        <div className="mt-16 pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-utility tracking-wider uppercase">
          <div>© {new Date().getFullYear()} Digiformation Ltd. All rights reserved.</div>
          <div className="flex gap-6">
            <Link to="/privacy-policy" className="hover:text-gold">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-gold">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

const FooterCol = ({ title, links }: { title: string; links: { name: string; path: string }[] }) => (
  <div>
    <h4 className="eyebrow eyebrow-left mb-5">{title}</h4>
    <ul className="space-y-2.5">
      {links.map(l => (
        <li key={l.path}>
          <Link to={l.path} className="text-sm text-muted-foreground hover:text-gold transition-colors">{l.name}</Link>
        </li>
      ))}
    </ul>
  </div>
);

export default Footer;
