import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, X, Shield, LogOut } from "lucide-react";
import { NAV } from "./nav";
import logo from "@/assets/digiformation-logo-official.png";
import { setNavDrawerOpen } from "@/lib/nav-drawer";
import { supabase } from "@/integrations/supabase/client";

/**
 * Admin mobile drawer.
 *
 * IMPORTANT: The drawer + overlay are rendered through a React portal to
 * `document.body`. They MUST NOT live inside the Topbar tree, because the
 * Topbar uses `backdrop-blur-xl` (a `filter`) which creates a containing
 * block for `position: fixed` descendants. Without the portal the fixed
 * drawer is clipped to the 64px tall header and only the first menu item
 * is visible — that was the original bug.
 */
export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    setNavDrawerOpen(open);
    return () => setNavDrawerOpen(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const drawer = (
    <div className="businessos md:hidden">
      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation"
        className={`fixed top-0 left-0 z-[1001] h-[100dvh] w-[82%] max-w-[320px] os-sidebar-bg border-r border-white/5 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
        }}
      >
        {/* Sticky header */}
        <div className="shrink-0 px-4 py-4 border-b border-white/5 flex items-center justify-between gap-3 bg-[hsl(222,38%,10%)]">
          <NavLink to="/admin" className="flex items-center gap-3 min-w-0">
            <img
              src={logo}
              alt="DigiFormation"
              className="h-11 w-11 object-contain shrink-0 rounded-xl bg-white/[0.03] p-1.5 drop-shadow-[0_0_18px_rgba(99,102,241,0.35)]"
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
            className="w-9 h-9 grid place-items-center rounded-lg bg-white/[0.04] border border-white/[0.08] shrink-0 hover:bg-white/[0.08] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable nav */}
        <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-3 px-3 space-y-1">
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
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
          <NavLink to="/admin/legacy" className="os-nav-item mt-2">
            <Shield className="w-4 h-4 shrink-0" />
            <span className="truncate">Legacy Admin</span>
          </NavLink>
        </nav>

        <div className="shrink-0 px-3 py-3 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="os-nav-item w-full text-left hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="truncate">Logout</span>
          </button>
        </div>
        <div className="shrink-0 px-5 py-4 border-t border-white/5 text-[11px] text-white/40">
          v1.0 · {new Date().getFullYear()}
        </div>
      </aside>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="md:hidden w-10 h-10 grid place-items-center rounded-xl os-glass shrink-0"
      >
        <Menu className="w-5 h-5" />
      </button>
      {mounted ? createPortal(drawer, document.body) : null}
    </>
  );
}
