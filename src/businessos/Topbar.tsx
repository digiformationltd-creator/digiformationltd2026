import { Bell, Plus, Search } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { NAV } from "./nav";
import logo from "@/assets/digiformation-logo-official.png";

export default function Topbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const current = NAV.find((n) => n.to === "/admin"
    ? pathname === "/admin"
    : pathname.startsWith(n.to)
  );
  const title = current?.label || "Dashboard";

  return (
    <header className="h-16 sticky top-0 z-20 border-b border-white/5 bg-[hsl(222,36%,7%)]/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 gap-3 sm:gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <img
          src={logo}
          alt="DigiFormation"
          className="md:hidden h-10 w-10 object-contain rounded-lg bg-white/[0.03] p-1 shrink-0"
        />
        <h1 className="text-base sm:text-xl font-bold tracking-tight truncate">{title}</h1>
      </div>
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input placeholder="Search anything…" className="w-full h-10 rounded-xl pl-10 pr-3 text-sm" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate("/admin/legacy")}
          title="Open legacy admin (stable fallback)"
          className="hidden sm:inline-flex h-10 px-3 rounded-xl os-glass text-xs font-semibold items-center">
          Legacy Admin
        </button>
        <button className="w-10 h-10 grid place-items-center rounded-xl os-glass os-glow-blue">
          <Bell className="w-4 h-4" />
        </button>
        <button
          onClick={() => navigate("/admin/leads?new=1")}
          className="h-10 px-4 rounded-xl text-sm font-semibold flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:opacity-90">
          <Plus className="w-4 h-4" /> New Lead
        </button>
      </div>
    </header>
  );
}
