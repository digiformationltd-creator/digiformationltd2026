import { Link, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, ChevronDown, UserCircle2, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navGroups } from "@/data/navigation";
import logo from "@/assets/digiformation-logo.png";

const topLinks = [
  { name: "Home", path: "/" },
];

const moreLinks = [
  { name: "Web Dev", path: "/web-development" },
  { name: "About", path: "/#about" },
  { name: "Blog", path: "/blog" },
  { name: "FAQ", path: "/faq" },
  { name: "Affiliate Program", path: "/affiliate" },
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
      <div className="container mx-auto mt-1 sm:mt-2 xl:mt-4 px-3 sm:px-4">
        <nav className="flex items-center justify-between gap-2 pl-1 sm:pl-2 pr-2 sm:pr-3 py-1.5 sm:py-2 xl:py-2.5">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0" aria-label="Digiformation home">
            <img src={logo} alt="Digiformation" className="h-16 sm:h-24 md:h-28 xl:h-32 w-auto object-contain" />
          </Link>

          {/* Desktop links */}
          <div className="hidden xl:flex items-center gap-6">
            <NavLink to="/" className="text-sm hover:opacity-80 transition">Home</NavLink>
            <NavLink to="/pricing" className="text-sm hover:opacity-80 transition">Packages</NavLink>
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

            {/* More dropdown for the rest */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-sm hover:opacity-80 transition">
                More
                <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute top-full right-0 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="min-w-[200px] glass rounded-xl p-2">
                  {[
                    { name: "About", path: "/#about" },
                    { name: "Blog", path: "/blog" },
                    { name: "FAQ", path: "/faq" },
                    { name: "Affiliate Program", path: "/affiliate" },
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
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button asChild variant="outline" size="sm" className="rounded-full hidden sm:inline-flex">
              <Link to="/affiliate" aria-label="Join the affiliate program">
                <Handshake className="w-4 h-4" />
                <span>Join Us</span>
              </Link>
            </Button>
            <Button asChild variant="hero" size="sm" className="rounded-full">
              <Link to="/auth" aria-label="Sign in to client dashboard">
                <UserCircle2 className="w-4 h-4" />
                <span className="hidden sm:inline">Client Dashboard</span>
                <span className="sm:hidden text-xs">Client Dashboard</span>
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
        <div className="xl:hidden container mx-auto mt-2 px-3 sm:px-4">
          <div className="glass rounded-2xl p-3 sm:p-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <Link to="/" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm rounded-lg hover:bg-primary/10">
              Home
            </Link>
            <Link to="/pricing" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm rounded-lg hover:bg-primary/10">
              Packages
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
            <Button asChild variant="outline" className="w-full mt-3 rounded-full">
              <Link to="/affiliate" onClick={() => setOpen(false)}>
                <Handshake className="w-4 h-4" />
                Join Us
              </Link>
            </Button>
            <Button asChild variant="hero" className="w-full mt-2 rounded-full">
              <Link to="/auth" onClick={() => setOpen(false)}>
                <UserCircle2 className="w-4 h-4" />
                Client Dashboard
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default DigiNav;
