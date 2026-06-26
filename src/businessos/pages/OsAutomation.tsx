import { NavLink } from "react-router-dom";
import { Mail, Zap, Clock, Bot, Workflow } from "lucide-react";

type Item = {
  label: string;
  to: string;
  icon: any;
  status: "available" | "coming";
  desc: string;
};

const ITEMS: Item[] = [
  { label: "Email Marketing",          to: "/admin/automation/email-marketing", icon: Mail,     status: "coming", desc: "Campaign builder powered by the existing email engine." },
  { label: "Email Automation History", to: "/admin/automation/history",         icon: Clock,    status: "coming", desc: "Logs of every automated email sent across Business OS." },
  { label: "Scheduled Jobs",           to: "/admin/automation/jobs",            icon: Workflow, status: "coming", desc: "Cron and scheduled internal workflows." },
  { label: "AI Agents",                to: "/admin/automation/agents",          icon: Bot,      status: "coming", desc: "Future internal AI agents and assistants." },
  { label: "Business Automations",     to: "/admin/automation/workflows",       icon: Zap,      status: "coming", desc: "Follow-ups, reminders, lead qualification and more." },
];

export default function OsAutomation() {
  return (
    <div className="space-y-6 os-fade-in">
      <div className="os-glass os-glow-lime p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl grid place-items-center bg-lime-500/10 text-lime-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Automation</h2>
            <p className="text-sm text-white/50 mt-1 max-w-2xl">
              Central hub for every automated workflow inside Business OS. Email Marketing ships first; additional internal automations are added here over time.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ITEMS.map((it) => {
          const Icon = it.icon;
          const card = (
            <div className="os-glass os-glow-lime p-5 h-full hover:translate-y-[-2px] transition">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl grid place-items-center bg-lime-500/10 text-lime-400">
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md ${
                  it.status === "available"
                    ? "bg-green-500/10 text-green-300"
                    : "bg-white/5 text-white/40"
                }`}>
                  {it.status === "available" ? "Available" : "Coming soon"}
                </span>
              </div>
              <div className="mt-3 font-semibold">{it.label}</div>
              <div className="text-xs text-white/50 mt-1">{it.desc}</div>
            </div>
          );
          return it.status === "available"
            ? <NavLink key={it.to} to={it.to}>{card}</NavLink>
            : <div key={it.to} className="opacity-70 cursor-default">{card}</div>;
        })}
      </div>
    </div>
  );
}
