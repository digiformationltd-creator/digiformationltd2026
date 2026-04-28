import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { navGroups, ukServices, ukCompliance, usaServices, banking } from "@/data/navigation";

const simpleNav = [
  { name: "Home", path: "/" },
  { name: "Web Development", path: "/web-development" },
  { name: "Client Area", path: "/client-area" },
  { name: "Pricing", path: "/pricing" },
  { name: "Blog", path: "/blog" },
  { name: "FAQ", path: "/faq" },
  { name: "About", path: "/about" },
  { name: "Contact", path: "/contact" },
];

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/85 backdrop-blur-xl border-b border-gold/15"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between h-20 px-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-sm bg-gradient-to-br from-gold to-gold-light flex items-center justify-center text-background font-display font-bold text-lg">
            D
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-semibold tracking-tight">
              Digi<span className="text-gold">formation</span>
            </div>
            <div className="font-utility text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
              UK · USA · Global
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden xl:flex items-center gap-1">
          <NavLink to="/" className={({isActive}) => `nav-link px-3 py-2 text-[13px] font-utility uppercase tracking-wider transition-colors ${isActive ? "text-gold" : "text-foreground/80 hover:text-gold"}`}>
            Home
          </NavLink>

          {navGroups.map((group) => (
            <div key={group.label} className="relative group">
              <button className="flex items-center gap-1 px-3 py-2 text-[13px] font-utility uppercase tracking-wider text-foreground/80 hover:text-gold transition-colors">
                {group.label}
                <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="min-w-[280px] glass-card !bg-surface/95 backdrop-blur-xl p-2">
                  {group.items.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="block px-4 py-2.5 text-sm rounded-sm hover:bg-gold/10 hover:text-gold transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <NavLink to="/web-development" className={({isActive}) => `px-3 py-2 text-[13px] font-utility uppercase tracking-wider transition-colors ${isActive ? "text-gold" : "text-foreground/80 hover:text-gold"}`}>
            Web Dev
          </NavLink>
          <NavLink to="/blog" className={({isActive}) => `px-3 py-2 text-[13px] font-utility uppercase tracking-wider transition-colors ${isActive ? "text-gold" : "text-foreground/80 hover:text-gold"}`}>
            Blog
          </NavLink>
          <NavLink to="/about" className={({isActive}) => `px-3 py-2 text-[13px] font-utility uppercase tracking-wider transition-colors ${isActive ? "text-gold" : "text-foreground/80 hover:text-gold"}`}>
            About
          </NavLink>
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link to="/client-area" className="text-[13px] font-utility uppercase tracking-wider text-foreground/80 hover:text-gold transition">
            Client Area
          </Link>
          <Link to="/contact" className="btn-gold text-xs px-5 py-3">
            Free Consultation
          </Link>
        </div>

        <button
          className="xl:hidden text-foreground p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="xl:hidden bg-background/98 backdrop-blur-xl border-t border-gold/15 max-h-[calc(100vh-5rem)] overflow-y-auto">
          <div className="container px-4 py-6 space-y-1">
            {simpleNav.slice(0, 2).map(l => (
              <Link key={l.path} to={l.path} className="block px-3 py-2.5 font-utility uppercase text-sm tracking-wider hover:text-gold">
                {l.name}
              </Link>
            ))}
            {navGroups.map((group) => (
              <div key={group.label} className="border-t border-border/40 pt-1 mt-1">
                <button
                  onClick={() => setOpenMobileGroup(openMobileGroup === group.label ? null : group.label)}
                  className="flex items-center justify-between w-full px-3 py-2.5 font-utility uppercase text-sm tracking-wider"
                >
                  {group.label}
                  <ChevronDown className={`w-4 h-4 transition-transform ${openMobileGroup === group.label ? "rotate-180" : ""}`} />
                </button>
                {openMobileGroup === group.label && (
                  <div className="pl-4 pb-2">
                    {group.items.map(item => (
                      <Link key={item.path} to={item.path} className="block px-3 py-2 text-sm text-muted-foreground hover:text-gold">
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {simpleNav.slice(2).map(l => (
              <Link key={l.path} to={l.path} className="block px-3 py-2.5 font-utility uppercase text-sm tracking-wider hover:text-gold border-t border-border/40">
                {l.name}
              </Link>
            ))}
            <Link to="/contact" className="btn-gold w-full mt-4 text-xs">Free Consultation</Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
