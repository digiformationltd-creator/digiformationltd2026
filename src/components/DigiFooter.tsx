import { Link } from "react-router-dom";
import logo from "@/assets/digiformation-logo.png";

const DigiFooter = () => (
  <footer className="border-t border-border py-12 bg-secondary/20">
    <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 text-sm">
      <div className="flex items-center gap-3">
        <img src={logo} alt="Digiformation" className="h-16 md:h-20 w-auto object-contain" />
        <span>© {new Date().getFullYear()} Digiformation Ltd. All rights reserved.</span>
      </div>
      <div className="flex gap-6 opacity-90">
        <Link to="/privacy-policy" className="hover:opacity-70">Privacy</Link>
        <Link to="/terms" className="hover:opacity-70">Terms</Link>
        <Link to="/about" className="hover:opacity-70">Careers</Link>
      </div>
    </div>
  </footer>
);

export default DigiFooter;
