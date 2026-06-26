import { NavLink } from "react-router-dom";
import { Package, Settings as SettingsIcon, UsersRound, Mail } from "lucide-react";

const ITEMS = [
  { label: "Services",        to: "/admin/settings/services", icon: Package,     desc: "Manage the public service catalog, pricing and availability.", available: true },
  { label: "Team",            to: "/admin/settings/team",     icon: UsersRound,  desc: "Admins, roles and access (coming soon).",                       available: false },
  { label: "Email Settings",  to: "/admin/settings/email",    icon: Mail,        desc: "Sender identity, suppression and deliverability (coming soon).", available: false },
  { label: "General",         to: "/admin/settings/general",  icon: SettingsIcon, desc: "Workspace preferences (coming soon).",                          available: false },
];

export default function OsSettings() {
  return (
    <div className="space-y-6 os-fade-in">
      <div className="os-glass os-glow-blue p-6">
        <h2 className="text-xl font-bold">Settings</h2>
        <p className="text-sm text-white/50 mt-1">Workspace configuration and rarely-changed modules.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ITEMS.map((it) => {
          const Icon = it.icon;
          const card = (
            <div className="os-glass os-glow-blue p-5 h-full hover:translate-y-[-2px] transition">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl grid place-items-center bg-blue-500/10 text-blue-300">
                  <Icon className="w-4 h-4" />
                </div>
                {!it.available && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-md bg-white/5 text-white/40">
                    Coming soon
                  </span>
                )}
              </div>
              <div className="mt-3 font-semibold">{it.label}</div>
              <div className="text-xs text-white/50 mt-1">{it.desc}</div>
            </div>
          );
          return it.available
            ? <NavLink key={it.to} to={it.to}>{card}</NavLink>
            : <div key={it.to} className="opacity-70 cursor-default">{card}</div>;
        })}
      </div>
    </div>
  );
}
