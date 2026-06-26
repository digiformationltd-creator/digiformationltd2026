// Scheduled Jobs — Phase 1 UI scaffold (mock data only).

import { Workflow, Clock } from "lucide-react";

type Job = {
  id: string;
  name: string;
  frequency: string;
  status: "active" | "paused" | "error";
  lastRun: string;
  nextRun: string;
};

const JOBS: Job[] = [
  { id: "j1", name: "send-scheduled-reminders",      frequency: "Daily · 08:00 UTC",  status: "active", lastRun: "Today 08:00", nextRun: "Tomorrow 08:00" },
  { id: "j2", name: "process-email-queue",           frequency: "Every 5 min",        status: "active", lastRun: "2m ago",      nextRun: "In 3 min" },
  { id: "j3", name: "cleanup-temporary-artifacts",   frequency: "Daily · 03:00 UTC",  status: "active", lastRun: "Today 03:00", nextRun: "Tomorrow 03:00" },
  { id: "j4", name: "confirmation-statement-scan",   frequency: "Daily · 08:00 UTC",  status: "active", lastRun: "Today 08:00", nextRun: "Tomorrow 08:00" },
  { id: "j5", name: "annual-accounts-scan",          frequency: "Daily · 08:00 UTC",  status: "active", lastRun: "Today 08:00", nextRun: "Tomorrow 08:00" },
  { id: "j6", name: "address-renewal-scan",          frequency: "Daily · 08:00 UTC",  status: "active", lastRun: "Today 08:00", nextRun: "Tomorrow 08:00" },
  { id: "j7", name: "growth-intelligence-refresh",   frequency: "Hourly",             status: "active", lastRun: "26m ago",     nextRun: "In 34 min" },
  { id: "j8", name: "stalled-order-detector",        frequency: "Every 4 hours",      status: "paused", lastRun: "Yesterday",   nextRun: "—" },
  { id: "j9", name: "attribution-rollup",            frequency: "Daily · 02:00 UTC",  status: "active", lastRun: "Today 02:00", nextRun: "Tomorrow 02:00" },
];

const STATUS_TINT: Record<Job["status"], string> = {
  active: "bg-green-500/10 text-green-300",
  paused: "bg-amber-500/10 text-amber-300",
  error:  "bg-red-500/10 text-red-300",
};

export default function OsAutomationJobs() {
  return (
    <div className="space-y-6 os-fade-in">
      <div className="os-glass p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl grid place-items-center bg-cyan-500/10 text-cyan-300">
            <Workflow className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Scheduled Jobs</h2>
            <p className="text-sm text-white/50 mt-1 max-w-2xl">
              Every cron and scheduled internal workflow running inside Business OS. Phase 1 surfaces the catalogue; execution metadata streams in live from the scheduler in a later phase.
            </p>
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="os-glass overflow-hidden hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-white/5 text-[11px] uppercase tracking-wider text-white/40">
              <th className="py-3 px-4">Job</th>
              <th className="py-3 px-4">Frequency</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Last run</th>
              <th className="py-3 px-4">Next run</th>
            </tr>
          </thead>
          <tbody>
            {JOBS.map((j) => (
              <tr key={j.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <td className="py-3 px-4 font-medium">{j.name}</td>
                <td className="py-3 px-4 text-white/60">{j.frequency}</td>
                <td className="py-3 px-4">
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md ${STATUS_TINT[j.status]}`}>
                    {j.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-white/60">{j.lastRun}</td>
                <td className="py-3 px-4 text-white/60 inline-flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-white/30" /> {j.nextRun}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {JOBS.map((j) => (
          <div key={j.id} className="os-glass p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium truncate">{j.name}</span>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md ${STATUS_TINT[j.status]}`}>
                {j.status}
              </span>
            </div>
            <div className="text-[11px] text-white/50">{j.frequency}</div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-white/5">
              <div><div className="text-white/40">Last run</div><div>{j.lastRun}</div></div>
              <div><div className="text-white/40">Next run</div><div>{j.nextRun}</div></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
