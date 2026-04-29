import { Link, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, ChevronDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navGroups } from "@/data/navigation";
import logo from "@/assets/digiformation-logo.png";

const topLinks = [
  { name: "Home", path: "/" },
];

const moreLinks = [
  { name: "Web Dev", path: "/web-development" },
  { name: "Pricing", path: "/pricing" },
  { name: "About", path: "/about" },
  { name: "Blog", path: "/blog" },
  { name: "FAQ", path: "/faq" },
  { name: "Client Area", path: "/client-area" },
  { name: "Contact", path: "/contact" },
];

const DigiNav = () => {
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="container mx-auto mt-4 px-4">
        <nav className="glass rounded-full flex items-center justify-between pl-6 pr-3 py-2.5">
          {/* Logo */}
          <Link to="/" className="flex items-center" aria-label="Digiformation home">
            <img src={logo} alt="Digiformation" className="h-28 md:h-32 w-auto object-contain" />
          </Link>

          {/* Desktop links */}
          <div className="hidden xl:flex items-center gap-6">
            <NavLink to="/" className="text-sm hover:opacity-80 transition">Home</NavLink>
            {navGroups.map((g) => (
              <div key={g.label} className="relative group">
                <button className="flex items-center gap-1 text-sm hover:opacity-80 transition">
                  {g.label}
                  <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
                </button>
                <div className="absolute top-full left-0 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="min-w-[280px] glass rounded-xl p-2 max-h-[70vh] overflow-y-auto">
                    {g.basePath && (
                      <Link to={g.basePath} className="block px-4 py-2 text-sm font-semibold rounded-md hover:bg-primary/10 transition border-b border-border/40 mb-1">
                        All {g.label} →
                      </Link>
                    )}
                    {g.items.map((it) => (
                      <Link key={it.path} to={it.path} className="block px-4 py-2 text-sm rounded-md hover:bg-primary/10 transition">
                        {it.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <NavLink to="/web-development" className="text-sm hover:opacity-80 transition">Web Dev</NavLink>
            <NavLink to="/pricing" className="text-sm hover:opacity-80 transition">Pricing</NavLink>

            {/* More dropdown for the rest */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-sm hover:opacity-80 transition">
                More
                <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full right-0 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="min-w-[200px] glass rounded-xl p-2">
                  {[
                    { name: "About", path: "/about" },
                    { name: "Blog", path: "/blog" },
                    { name: "FAQ", path: "/faq" },
                    { name: "Client Area", path: "/client-area" },
                    { name: "Contact", path: "/contact" },
                  ].map((l) => (
                    <Link key={l.path} to={l.path} className="block px-4 py-2 text-sm rounded-md hover:bg-primary/10 transition">
                      {l.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-2">
            <Button asChild variant="hero" size="sm" className="rounded-full hidden sm:inline-flex">
              <Link to="/contact">
                Free Consultation <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
            <button
              aria-label="Toggle menu"
              onClick={() => setOpen(!open)}
              className="xl:hidden w-10 h-10 rounded-full grid place-items-center hover:bg-primary/10 transition"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="xl:hidden container mx-auto mt-3 px-4">
          <div className="glass rounded-2xl p-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <Link to="/" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm rounded-lg hover:bg-primary/10">
              Home
            </Link>
            {navGroups.map((g) => (
              <div key={g.label} className="border-t border-border/40 mt-1 pt-1">
                <button
                  onClick={() => setOpenGroup(openGroup === g.label ? null : g.label)}
                  className="flex items-center justify-between w-full px-4 py-2.5 text-sm rounded-lg hover:bg-primary/10"
                >
                  {g.label}
                  <ChevronDown className={`w-4 h-4 transition-transform ${openGroup === g.label ? "rotate-180" : ""}`} />
                </button>
                {openGroup === g.label && (
                  <div className="pl-4">
                    {g.basePath && (
                      <Link to={g.basePath} onClick={() => setOpen(false)} className="block px-4 py-2 text-sm rounded-md hover:bg-primary/10 font-semibold">
                        All {g.label} →
                      </Link>
                    )}
                    {g.items.map((it) => (
                      <Link key={it.path} to={it.path} onClick={() => setOpen(false)} className="block px-4 py-2 text-sm rounded-md hover:bg-primary/10 opacity-80">
                        {it.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="border-t border-border/40 mt-1 pt-1">
              {moreLinks.map((l) => (
                <Link key={l.path} to={l.path} onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm rounded-lg hover:bg-primary/10">
                  {l.name}
                </Link>
              ))}
            </div>
            <Button asChild variant="hero" className="w-full mt-3 rounded-full">
              <Link to="/contact" onClick={() => setOpen(false)}>Free Consultation</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default DigiNav;
