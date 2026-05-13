import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, ChevronDown, UserCircle2, Handshake, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navGroups } from "@/data/navigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/digiformation-logo.png";

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out");
    navigate("/");
  };

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      {/* Top utility bar — separates main site from client portal entry */}
      <div className="bg-primary/15 border-b border-border/40 backdrop-blur-md px-3 sm:px-4 py-1.5 flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="opacity-70 hidden xs:inline">Need to manage your services?</span>
          <span className="opacity-70 xs:hidden">Welcome</span>
        </div>
        {user ? (
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-primary/30 hover:bg-primary/40 transition font-semibold shrink-0"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Client Dashboard</span>
          </Link>
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
            <img src={logo} alt="Digiformation Ltd logo — UK & US company formation, banking and payment gateway specialists" className="h-20 sm:h-24 md:h-28 xl:h-32 w-auto object-contain" />
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
            <Button asChild variant="outline" className="rounded-full hidden sm:inline-flex h-9 sm:h-10 px-3 text-xs sm:text-sm">
              <Link to="/affiliate" aria-label="Join the affiliate program">
                <Handshake className="w-4 h-4" />
                <span>Join Us</span>
              </Link>
            </Button>
            {user ? (
              <Button onClick={handleLogout} variant="hero" className="rounded-full h-9 sm:h-10 px-3 text-xs sm:text-sm" aria-label="Log out">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            ) : (
              <Button asChild variant="hero" className="rounded-full h-9 sm:h-10 px-3 text-xs sm:text-sm">
                <Link to="/auth" aria-label="Sign in to client dashboard">
                  <UserCircle2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Client Dashboard</span>
                  <span className="sm:hidden">Login</span>
                </Link>
              </Button>
            )}
            <button
              aria-label="Toggle menu"
              onClick={() => setOpen(!open)}
              className="xl:hidden w-12 h-12 sm:w-14 sm:h-14 rounded-full grid place-items-center hover:bg-primary/10 transition"
            >
              {open ? <X className="w-7 h-7 sm:w-8 sm:h-8" /> : <Menu className="w-7 h-7 sm:w-8 sm:h-8" />}
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
            <Button asChild variant="outline" className="w-full mt-3 rounded-full">
              <Link to="/affiliate" onClick={() => setOpen(false)}>
                <Handshake className="w-4 h-4" />
                Join Us
              </Link>
            </Button>
            {user ? (
              <>
                <Button asChild variant="hero" className="w-full mt-2 rounded-full">
                  <Link to="/dashboard" onClick={() => setOpen(false)}>
                    <LayoutDashboard className="w-4 h-4" />
                    Client Dashboard
                  </Link>
                </Button>
                <Button onClick={() => { setOpen(false); handleLogout(); }} variant="outline" className="w-full mt-2 rounded-full">
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Button asChild variant="hero" className="w-full mt-2 rounded-full">
                <Link to="/auth" onClick={() => setOpen(false)}>
                  <UserCircle2 className="w-4 h-4" />
                  Client Dashboard
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default DigiNav;
