import { Bell, Plus, Search, ChevronLeft, HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NAV } from "./nav";
import MobileNav from "./MobileNav";
import WelcomeTour, { shouldShowTourOnMount } from "./components/WelcomeTour";

export default function Topbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  function findTitle(items: typeof NAV): string | undefined {
    for (const n of items) {
      if (n.to === "/admin" ? pathname === "/admin" : pathname.startsWith(n.to)) {
        if (n.children) {
          const exact = n.children.find((c) => pathname === c.to);
          if (exact) return exact.label;
        }
        return n.label;
      }
      if (n.children) {
        const child = n.children.find((c) => pathname === c.to || pathname.startsWith(c.to + "/"));
        if (child) return child.label;
      }
    }
    return undefined;
  }
  const title = findTitle(NAV) || "Dashboard";
  const isRoot = pathname === "/admin" || pathname === "/admin/";

  const [tourOpen, setTourOpen] = useState(false);

  // Auto-show welcome tour on first visit (per browser).
  useEffect(() => {
    if (shouldShowTourOnMount()) {
      const t = setTimeout(() => setTourOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  // Global "?" → open Help.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement | null)?.isContentEditable) return;
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        navigate("/admin/help");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  return (
    <header className="h-16 sticky top-0 z-30 border-b border-white/5 bg-[hsl(222,36%,7%)]/85 backdrop-blur-xl flex items-center justify-between px-3 sm:px-6 gap-2 sm:gap-4">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <MobileNav />
        {!isRoot && (
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="md:hidden w-10 h-10 grid place-items-center rounded-xl os-glass shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-base sm:text-xl font-bold tracking-tight truncate">{title}</h1>
      </div>
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input placeholder="Search anything…" className="w-full h-10 rounded-xl pl-10 pr-3 text-sm" />
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => navigate("/admin/legacy")}
          title="Open legacy admin (stable fallback)"
          className="hidden sm:inline-flex h-10 px-3 rounded-xl os-glass text-xs font-semibold items-center">
          Legacy Admin
        </button>
        <button
          onClick={() => navigate("/admin/help")}
          title="Help (?)"
          aria-label="Help"
          className="grid w-10 h-10 place-items-center rounded-xl os-glass">
          <HelpCircle className="w-4 h-4" />
        </button>
        <button className="hidden sm:grid w-10 h-10 place-items-center rounded-xl os-glass os-glow-blue">
          <Bell className="w-4 h-4" />
        </button>
        <button
          onClick={() => navigate("/admin/leads?new=1")}
          className="h-10 w-10 sm:w-auto sm:px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:opacity-90"
          title="New Lead">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Lead</span>
        </button>
      </div>

      <WelcomeTour open={tourOpen} onOpenChange={setTourOpen} />
    </header>
  );
}
