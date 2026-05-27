import { NavLink, useLocation } from "react-router-dom";
import { NAV } from "./nav";
import logo from "@/assets/digiformation-logo-official.png";

export default function Sidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="os-sidebar-bg w-[260px] shrink-0 border-r border-white/5 h-screen sticky top-0 flex flex-col">
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
