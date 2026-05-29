import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV } from "./nav";
import logo from "@/assets/digiformation-logo-official.png";
import { setNavDrawerOpen } from "@/lib/nav-drawer";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Track drawer state globally (hides floating buttons)
  useEffect(() => {
    setNavDrawerOpen(open);
    return () => setNavDrawerOpen(false);
  }, [open]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="md:hidden w-10 h-10 grid place-items-center rounded-xl os-glass shrink-0"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        className={`md:hidden fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />

      {/* Drawer */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-[61] w-[78%] max-w-[300px] os-sidebar-bg border-r border-white/5 flex flex-col transition-transform duration-300 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-4 py-4 border-b border-white/5 flex items-center justify-between gap-3">
          <NavLink to="/" className="flex items-center gap-3 min-w-0">
            <img
              src={logo}
              alt="DigiFormation"
              className="h-12 w-12 object-contain shrink-0 rounded-xl bg-white/[0.03] p-1.5 drop-shadow-[0_0_18px_rgba(99,102,241,0.35)]"
            />
            <div className="min-w-0">
              <div className="text-[10px] text-white/50 uppercase tracking-[0.2em]">Business OS</div>
              <div className="text-xs font-semibold text-white/80 truncate">Admin Console</div>
            </div>
          </NavLink>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="w-9 h-9 grid place-items-center rounded-lg os-glass shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {NAV.map((item) => {
            const isActive = item.to === "/admin"
              ? pathname === "/admin" || pathname === "/admin/"
              : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/admin"}
                className={`os-nav-item ${isActive ? "active" : ""}`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
          <NavLink to="/admin/legacy" className="os-nav-item">
            <span className="w-4 h-4 inline-block" />
            <span>Legacy Admin</span>
          </NavLink>
        </nav>
        <div className="px-5 py-4 border-t border-white/5 text-[11px] text-white/40">
          v1.0 · {new Date().getFullYear()}
        </div>
      </aside>
    </>
  );
}
