import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Sparkles, ChevronRight, ChevronLeft } from "lucide-react";

const FLAG = "businessos.welcomeTour.v1.done";

const STEPS = [
  {
    title: "Welcome to Business OS",
    body: "This is the internal admin workspace for DigiFormation. It centralises every customer journey — from first inquiry to invoice — in one place.",
  },
  {
    title: "Sidebar navigation",
    body: "Use the left sidebar to jump between modules: Leads, Clients, Companies, Orders, Invoices, Support, Compliance, Documents and more.",
  },
  {
    title: "AI Command Center",
    body: "Open Automation → Command Center to run admin actions in plain English. Every action follows Preview → Approval → Execution → Undo.",
  },
  {
    title: "Automation Center",
    body: "Automation is the hub for the Command Center, Workflows, Scheduled Jobs and the Reminder Center. System-owned jobs (invoices, reminders, email) run automatically.",
  },
  {
    title: "Orders, Clients & Companies",
    body: "Orders track service fulfilment. Clients hold the full customer history. Companies (customer-owned) and Managed Companies (internal inventory) are separate on purpose.",
  },
  {
    title: "Documents, Support & Settings",
    body: "Documents stores uploaded and issued files. Support handles tickets. Settings is where you adjust services, pricing and team access.",
  },
  {
    title: "You're set",
    body: "Open Help from the top bar any time to revisit this tour, browse FAQs, see keyboard shortcuts and read the Safety guide.",
  },
];

export function shouldShowTourOnMount(): boolean {
  try { return localStorage.getItem(FLAG) !== "1"; } catch { return false; }
}

export function markTourDone() {
  try { localStorage.setItem(FLAG, "1"); } catch { /* ignore */ }
}

export function resetTour() {
  try { localStorage.removeItem(FLAG); } catch { /* ignore */ }
}

export default function WelcomeTour({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [i, setI] = useState(0);
  useEffect(() => { if (open) setI(0); }, [open]);

  const step = STEPS[i];
  const isLast = i === STEPS.length - 1;

  const close = (done: boolean) => {
    if (done) markTourDone();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close(false))}>
      <DialogContent className="businessos sm:max-w-lg bg-[hsl(222,36%,9%)] border-white/10 text-white">
        <DialogHeader>
          <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Welcome tour · Step {i + 1} of {STEPS.length}
          </div>
          <DialogTitle className="text-xl">{step.title}</DialogTitle>
          <DialogDescription className="text-white/70 leading-relaxed pt-1">
            {step.body}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-1.5 pt-2">
          {STEPS.map((_, k) => (
            <span key={k} className={`h-1 flex-1 rounded-full ${k <= i ? "bg-blue-400" : "bg-white/10"}`} />
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-2 pt-2 flex-row flex-wrap">
          <button
            onClick={() => close(true)}
            className="h-9 px-3 rounded-lg text-xs text-white/60 hover:text-white/90 mr-auto"
          >Skip tour</button>
          <button
            disabled={i === 0}
            onClick={() => setI((v) => Math.max(0, v - 1))}
            className="h-9 px-3 rounded-lg text-sm bg-white/5 hover:bg-white/10 disabled:opacity-30 inline-flex items-center gap-1"
          ><ChevronLeft className="w-4 h-4" /> Back</button>
          {!isLast ? (
            <button
              onClick={() => setI((v) => Math.min(STEPS.length - 1, v + 1))}
              className="h-9 px-4 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white inline-flex items-center gap-1"
            >Next <ChevronRight className="w-4 h-4" /></button>
          ) : (
            <Link
              to="/admin/automation/command-center"
              onClick={() => close(true)}
              className="h-9 px-4 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white inline-flex items-center gap-1"
            >Open Command Center</Link>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
