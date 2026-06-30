import { useState, useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LogOut, ChevronRight } from "lucide-react";
import { NAV } from "./nav";
import logo from "@/assets/digiformation-logo-official.png";
import { supabase } from "@/integrations/supabase/client";

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  const defaultOpen = useMemo(() => {
    const set = new Set<string>();
    for (const item of NAV) {
      if (item.children?.some((c) => pathname === c.to || pathname.startsWith(c.to + "/"))) {
        set.add(item.to);
      }
    }
    return set;
  }, [pathname]);

  const [openGroups, setOpenGroups] = useState<Set<string>>(defaultOpen);

  const toggleGroup = (to: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(to)) next.delete(to); else next.add(to);
      return next;
    });
  };

  const isGroupActive = (item: typeof NAV[0]) =>
    item.children?.some((c) => pathname === c.to || pathname.startsWith(c.to + "/")) ?? false;

  return (
    <aside className="os-sidebar-bg hidden md:flex w-[260px] shrink-0 border-r border-white/5 h-dvh sticky top-0 flex-col">
      <div className="px-4 py-4 border-b border-white/5">
        <NavLink to="/" className="flex items-center gap-3 group min-w-0" title="DigiFormation home">
          <img
            src={logo}
            alt="DigiFormation"
            className="h-14 w-14 object-contain shrink-0 rounded-xl bg-white/[0.03] p-1.5 drop-shadow-[0_0_18px_rgba(99,102,241,0.35)]"
          />
          <div className="min-w-0">
            <div className="text-[10px] text-white/50 uppercase tracking-[0.2em]">Business OS</div>
            <div className="text-xs font-semibold text-white/80 truncate">Admin Console</div>
          </div>
        </NavLink>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {NAV.map((item) => {
          if (item.children && item.children.length > 0) {
            const groupActive = isGroupActive(item);
            const expanded = openGroups.has(item.to);
            const Icon = item.icon;
            return (
              <div key={item.to}>
                <button
                  onClick={() => toggleGroup(item.to)}
                  className={`os-nav-item w-full justify-between ${groupActive ? "active" : ""}`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
                  />
                </button>
                {expanded && (
                  <div className="ml-5 mt-1 space-y-0.5 border-l border-white/5 pl-3">
                    {item.children.map((child) => {
                      const childActive = pathname === child.to || pathname.startsWith(child.to + "/");
                      return (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          end={child.to === "/admin"}
                          className={`os-nav-item text-[13px] py-1.5 ${childActive ? "active" : ""}`}
                        >
                          <span>{child.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = item.to === "/admin"
            ? pathname === "/admin" || pathname === "/admin/"
            : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} end={item.to === "/admin"}
              className={`os-nav-item ${isActive ? "active" : ""}`}>
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="px-3 py-3 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="os-nav-item w-full text-left hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
      <div className="px-5 py-4 border-t border-white/5 text-[11px] text-white/40">
        v1.0 · {new Date().getFullYear()}
      </div>
    </aside>
  );
}
