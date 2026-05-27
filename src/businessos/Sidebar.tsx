import { NavLink, useLocation } from "react-router-dom";
import { NAV } from "./nav";

export default function Sidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="os-sidebar-bg w-[260px] shrink-0 border-r border-white/5 h-screen sticky top-0 flex flex-col">
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 grid place-items-center text-white font-bold">D</div>
          <div>
            <div className="text-sm font-bold tracking-tight">DigiFormation</div>
            <div className="text-[10px] text-white/50 uppercase tracking-widest">Business OS</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {NAV.map((item) => {
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
      <div className="px-5 py-4 border-t border-white/5 text-[11px] text-white/40">
        v1.0 · {new Date().getFullYear()}
      </div>
    </aside>
  );
}
