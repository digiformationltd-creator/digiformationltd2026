import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Inbox } from "lucide-react";

type Action = { label: string; to?: string; onClick?: () => void };

/**
 * Reusable Business OS empty-state.
 * Tells the user: what this module is, why it's empty, how to get started.
 */
export default function EmptyState({
  icon,
  title,
  what,
  why,
  howTo,
  actions,
}: {
  icon?: ReactNode;
  title: string;
  what: string;
  why?: string;
  howTo?: string;
  actions?: Action[];
}) {
  return (
    <div className="os-glass rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-white/5 grid place-items-center mx-auto mb-5 text-white/70">
        {icon ?? <Inbox className="w-7 h-7" />}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-sm text-white/70 mb-4">{what}</p>
      {(why || howTo) && (
        <dl className="text-left text-sm text-white/60 space-y-2 max-w-md mx-auto mb-6">
          {why && (
            <div><dt className="font-medium text-white/80 inline">Why empty: </dt><dd className="inline">{why}</dd></div>
          )}
          {howTo && (
            <div><dt className="font-medium text-white/80 inline">Get started: </dt><dd className="inline">{howTo}</dd></div>
          )}
        </dl>
      )}
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {actions.map((a, i) => {
            const cls = "inline-flex items-center h-10 px-4 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/15 transition-colors";
            if (a.to) return <Link key={i} to={a.to} className={cls}>{a.label}</Link>;
            return <button key={i} onClick={a.onClick} className={cls}>{a.label}</button>;
          })}
        </div>
      )}
    </div>
  );
}
