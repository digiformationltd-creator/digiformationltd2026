import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, ChevronDown, UserCircle2, Handshake, LogOut, LayoutDashboard, Facebook, Instagram, Youtube, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navGroups } from "@/data/navigation";
import { supabase } from "@/integrations/supabase/client";
import { recoverSession } from "@/lib/auth/session";
import { toast } from "sonner";
import { setNavDrawerOpen } from "@/lib/nav-drawer";
import logo from "@/assets/digiformation-logo-official.png";

const topLinks = [
  { name: "Home", path: "/" },
];

const moreLinks = [
  { name: "Web Dev", path: "/web-development" },
  { name: "About", path: "/#about" },
  { name: "Blog", path: "/blog" },
  { name: "FAQ", path: "/faq" },
];

const DigiNav = () => {
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        return;
      }
      if (event === "SIGNED_OUT") setUser(null);
    });
    recoverSession().then(({ session }) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out");
    navigate("/");
  };

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setNavDrawerOpen(true);
    } else {
      document.body.style.overflow = "";
      setNavDrawerOpen(false);
    }
    return () => {
      document.body.style.overflow = "";
      setNavDrawerOpen(false);
    };
  }, [open]);

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      {/* Top utility bar — separates main site from client portal entry */}
      <div className="bg-primary/15 border-b border-border/40 px-3 sm:px-4 py-1.5 flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="opacity-70 hidden sm:inline">Follow us:</span>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <a href="https://www.facebook.com/share/1D676UBQw5/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="opacity-80 hover:opacity-100 transition">
              <Facebook className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </a>
            <a href="https://www.instagram.com/digiformationltd?igsh=ejBoMmFsOXFpMmdw" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="opacity-80 hover:opacity-100 transition">
              <Instagram className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </a>
            <a href="https://www.youtube.com/@digiformationltd" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="opacity-80 hover:opacity-100 transition">
              <Youtube className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </a>
            <a href="https://www.linkedin.com/in/muhammad-haroon-9a9945366" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="opacity-80 hover:opacity-100 transition">
              <Linkedin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </a>
            <a href="https://x.com/Digiformation00" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="opacity-80 hover:opacity-100 transition">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
        </div>
        {user ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-primary/30 hover:bg-primary/40 transition font-semibold"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Client Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </Link>
            <button
              onClick={handleLogout}
              aria-label="Sign out"
              title="Sign out"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-destructive/20 hover:bg-destructive/30 transition font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-primary/30 hover:bg-primary/40 transition font-semibold shrink-0"
          >
            <UserCircle2 className="w-3.5 h-3.5" />
            <span>Client Login</span>
          </Link>
        )}
      </div>
      <div className="container mx-auto mt-1 sm:mt-2 xl:mt-4 px-3 sm:px-4">
        <nav className="flex items-center justify-between gap-2 pl-1 sm:pl-2 pr-2 sm:pr-3 py-1.5 sm:py-2 xl:py-2.5">
          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0" aria-label="Digiformation home">
            <img src={logo} alt="Digiformation Ltd logo — UK & US company formation, banking and payment gateway specialists" className="h-11 sm:h-12 xl:h-14 w-auto object-contain" />
          </Link>

          {/* Desktop links */}
          <div className="hidden xl:flex items-center gap-6">
            <NavLink to="/" className="text-sm hover:opacity-80 transition">Home</NavLink>
            <NavLink to="/pricing" className="text-sm hover:opacity-80 transition">Pricing</NavLink>
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
            <NavLink to="/blog" className="text-sm hover:opacity-80 transition">Blog</NavLink>

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
                    { name: "FAQ", path: "/faq" },
                  ].map((l) => (
                    <Link key={l.path} to={l.path} className="block px-4 py-2 text-sm rounded-md hover:bg-primary/10 transition">
                      {l.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Packages quick-access pill */}
            <div className="relative group">
              <Link
                to="/pricing"
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-black transition"
              >
                Packages
                <ChevronDown className="w-3 h-3 transition-transform group-hover:rotate-180" />
              </Link>
              <div className="absolute top-full right-0 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="min-w-[260px] glass rounded-xl p-2">
                  <Link to="/pricing" className="block px-4 py-2 text-sm font-semibold rounded-md hover:bg-primary/10 transition border-b border-border/40 mb-1">
                    All Packages →
                  </Link>
                  {[
                    { name: "UK Company Formation", hash: "uk-formation" },
                    { name: "UK Address Services", hash: "uk-address" },
                    { name: "USA LLC Formation", hash: "usa-formation" },
                    { name: "USA Add-on Services", hash: "usa-services" },
                    { name: "UK Compliance Services", hash: "uk-compliance" },
                    { name: "Banking & Payments", hash: "banking-payments" },
                  ].map((l) => (
                    <Link key={l.hash} to={`/pricing#${l.hash}`} className="block px-4 py-2 text-sm rounded-md hover:bg-primary/10 transition">
                      {l.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              aria-label="Toggle menu"
              onClick={() => setOpen(!open)}
              className="xl:hidden h-11 w-11 sm:h-12 sm:w-12 xl:h-14 xl:w-14 rounded-lg grid place-items-center hover:bg-primary/10 transition shrink-0"
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
              Pricing
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
              <Link to="/web-development" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm rounded-lg hover:bg-primary/10">
                Web Dev
              </Link>
              <button
                onClick={() => setOpenGroup(openGroup === "__more" ? null : "__more")}
                className="flex items-center justify-between w-full px-4 py-2.5 text-sm rounded-lg hover:bg-primary/10"
              >
                More
                <ChevronDown className={`w-4 h-4 transition-transform ${openGroup === "__more" ? "rotate-180" : ""}`} />
              </button>
              {openGroup === "__more" && (
                <div className="pl-4">
                  {[
                    { name: "About", path: "/#about" },
                    { name: "Blog", path: "/blog" },
                    { name: "FAQ", path: "/faq" },
                  ].map((l) => (
                    <Link key={l.path} to={l.path} onClick={() => setOpen(false)} className="block px-4 py-2 text-sm rounded-md hover:bg-primary/10 opacity-80">
                      {l.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default DigiNav;
