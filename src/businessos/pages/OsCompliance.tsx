import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarClock, AlertCircle, CheckCircle2, Mail } from "lucide-react";

type Row = {
  kind: "address_expire" | "confirmation_due" | "accounts_filing_due";
  user_id: string;
  client_name: string;
  client_email: string | null;
  label: string;
  due_date: string;
  target_id: string;
  reminders_sent: number;
  last_sent_at: string | null;
};

// reminderType values must match send-scheduled-reminders so manual + cron rows
// in email_reminder_log share the same (target_id, reminder_type) and counts
// reconcile.
const KIND_META: Record<Row["kind"], { label: string; color: string; template: string; reminderType: "confirmation_statement" | "annual_accounts" | "address_expiry" }> = {
  address_expire:     { label: "Address renewal",        color: "bg-blue-500/15 text-blue-300 border-blue-500/30",       template: "address-renewal-reminder",         reminderType: "address_expiry" },
  confirmation_due:   { label: "Confirmation statement", color: "bg-amber-500/15 text-amber-300 border-amber-500/30",    template: "confirmation-statement-reminder",  reminderType: "confirmation_statement" },
  accounts_filing_due:{ label: "Annual accounts",        color: "bg-purple-500/15 text-purple-300 border-purple-500/30", template: "annual-accounts-reminder",         reminderType: "annual_accounts" },
};

function daysUntil(date: string): number {
  const due = new Date(date).getTime();
  const now = Date.now();
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
}

function urgencyClass(days: number): string {
  if (days < 0)  return "bg-red-500/20 text-red-300 border-red-500/40";
  if (days <= 7) return "bg-red-500/15 text-red-300 border-red-500/30";
  if (days <= 30) return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  if (days <= 60) return "bg-yellow-500/10 text-yellow-300 border-yellow-500/20";
  return "bg-white/5 text-white/60 border-white/10";
}

export default function OsCompliance() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "overdue" | "soon" | "later">("all");
  const [sending, setSending] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [addrRes, compRes, profRes, remRes] = await Promise.all([
      supabase.from("client_addresses").select("id,user_id,label,expire_date,service_type").not("expire_date", "is", null),
      supabase.from("client_company_details").select("id,user_id,company_name,confirmation_due,accounts_filing_due"),
      supabase.from("profiles").select("user_id,full_name,email,company_name"),
      supabase.from("email_reminder_log").select("target_id,reminder_type,sent_at"),
    ]);

    if (addrRes.error) toast.error(addrRes.error.message);
    if (compRes.error) toast.error(compRes.error.message);

    const profById = new Map<string, any>();
    (profRes.data || []).forEach((p: any) => profById.set(p.user_id, p));

    const remByTarget = new Map<string, { count: number; last: string | null }>();
    (remRes.data || []).forEach((r: any) => {
      const cur = remByTarget.get(r.target_id) || { count: 0, last: null };
      cur.count++;
      if (!cur.last || new Date(r.sent_at) > new Date(cur.last)) cur.last = r.sent_at;
      remByTarget.set(r.target_id, cur);
    });

    const out: Row[] = [];

    (addrRes.data || []).forEach((a: any) => {
      if (!a.expire_date) return;
      const prof = profById.get(a.user_id);
      const rem = remByTarget.get(a.id) || { count: 0, last: null };
      out.push({
        kind: "address_expire",
        user_id: a.user_id,
        client_name: prof?.full_name || prof?.company_name || prof?.email || "Unknown",
        client_email: prof?.email || null,
        label: `${a.label || a.service_type || "Address"}`,
        due_date: a.expire_date,
        target_id: a.id,
        reminders_sent: rem.count,
        last_sent_at: rem.last,
      });
    });

    (compRes.data || []).forEach((c: any) => {
      const prof = profById.get(c.user_id);
      if (c.confirmation_due) {
        const rem = remByTarget.get(`${c.id}:cs`) || { count: 0, last: null };
        out.push({
          kind: "confirmation_due",
          user_id: c.user_id,
          client_name: prof?.full_name || prof?.company_name || c.company_name || "Unknown",
          client_email: prof?.email || null,
          label: c.company_name || "Company",
          due_date: c.confirmation_due,
          target_id: c.id,
          reminders_sent: rem.count,
          last_sent_at: rem.last,
        });
      }
      if (c.accounts_filing_due) {
        const rem = remByTarget.get(`${c.id}:af`) || { count: 0, last: null };
        out.push({
          kind: "accounts_filing_due",
          user_id: c.user_id,
          client_name: prof?.full_name || prof?.company_name || c.company_name || "Unknown",
          client_email: prof?.email || null,
          label: c.company_name || "Company",
          due_date: c.accounts_filing_due,
          target_id: c.id,
          reminders_sent: rem.count,
          last_sent_at: rem.last,
        });
      }
    });

    out.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    setRows(out);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const ch = supabase
      .channel("compliance-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "client_addresses" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "client_company_details" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "email_reminder_log" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      const days = daysUntil(r.due_date);
      if (filter === "overdue") return days < 0;
      if (filter === "soon") return days >= 0 && days <= 30;
      if (filter === "later") return days > 30;
      return true;
    });
  }, [rows, filter]);

  const counts = useMemo(() => {
    const c = { all: rows.length, overdue: 0, soon: 0, later: 0 };
    rows.forEach(r => {
      const d = daysUntil(r.due_date);
      if (d < 0) c.overdue++;
      else if (d <= 30) c.soon++;
      else c.later++;
    });
    return c;
  }, [rows]);

  const sendReminder = async (r: Row) => {
    if (!r.client_email) { toast.error("Client has no email"); return; }
    const key = `${r.kind}-${r.target_id}`;
    setSending(key);
    try {
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          template: KIND_META[r.kind].template,
          to: r.client_email,
          data: {
            client_name: r.client_name,
            label: r.label,
            due_date: r.due_date,
            days_remaining: daysUntil(r.due_date),
          },
          idempotency_key: `manual-${r.kind}-${r.target_id}-${Date.now()}`,
          purpose: "transactional",
        },
      });
      if (error) throw error;
      await supabase.from("email_reminder_log").insert({
        target_id: r.kind === "address_expire" ? r.target_id : `${r.target_id}:${r.kind === "confirmation_due" ? "cs" : "af"}`,
        target_type: r.kind,
        reminder_type: KIND_META[r.kind].template,
        user_id: r.user_id,
        stage: r.reminders_sent + 1,
        due_date: r.due_date,
        recipient_email: r.client_email,
      });
      toast.success("Reminder queued");
      load();
    } catch (e: any) {
      toast.error(e.message || "Send failed");
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2"><CalendarClock className="w-5 h-5" /> Compliance & Reminders</h2>
        <p className="text-sm text-white/50">Address renewals, confirmation statements, annual accounts deadlines</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card label="Total" value={counts.all} tone="blue" active={filter === "all"} onClick={() => setFilter("all")} />
        <Card label="Overdue" value={counts.overdue} tone="red" active={filter === "overdue"} onClick={() => setFilter("overdue")} icon={<AlertCircle className="w-4 h-4" />} />
        <Card label="Due ≤ 30d" value={counts.soon} tone="amber" active={filter === "soon"} onClick={() => setFilter("soon")} />
        <Card label="Later" value={counts.later} tone="green" active={filter === "later"} onClick={() => setFilter("later")} icon={<CheckCircle2 className="w-4 h-4" />} />
      </div>

      {/* Desktop table */}
      <div className="os-glass overflow-hidden hidden md:block">
        <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-white/50 bg-white/[0.02] sticky top-0">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Client</th>
                <th className="text-left px-4 py-2 font-medium">Type</th>
                <th className="text-left px-4 py-2 font-medium">Detail</th>
                <th className="text-left px-4 py-2 font-medium">Due</th>
                <th className="text-left px-4 py-2 font-medium">In</th>
                <th className="text-left px-4 py-2 font-medium">Reminders</th>
                <th className="text-right px-4 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="text-center py-8 text-white/40 text-xs">Loading…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-white/40 text-xs">No items</td></tr>
              )}
              {filtered.map(r => {
                const days = daysUntil(r.due_date);
                const key = `${r.kind}-${r.target_id}`;
                return (
                  <tr key={key} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-2 text-xs">
                      <Link to={`/admin/clients/${r.user_id}`} className="hover:text-blue-300 font-medium">
                        {r.client_name}
                      </Link>
                      {r.client_email && <div className="text-[10px] text-white/40">{r.client_email}</div>}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${KIND_META[r.kind].color}`}>
                        {KIND_META[r.kind].label}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-white/70">{r.label}</td>
                    <td className="px-4 py-2 text-xs mono">{r.due_date}</td>
                    <td className="px-4 py-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border mono ${urgencyClass(days)}`}>
                        {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-white/50 mono">
                      {r.reminders_sent} {r.last_sent_at && <span className="text-white/30">· {new Date(r.last_sent_at).toLocaleDateString()}</span>}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button disabled={sending === key || !r.client_email}
                        onClick={() => sendReminder(r)}
                        className="h-7 px-2.5 rounded-md text-[11px] border border-white/10 hover:bg-white/5 disabled:opacity-40 inline-flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {sending === key ? "…" : "Send reminder"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading && <div className="os-glass p-6 text-center text-white/40 text-xs">Loading…</div>}
        {!loading && filtered.length === 0 && <div className="os-glass p-6 text-center text-white/40 text-xs">No items</div>}
        {filtered.map(r => {
          const days = daysUntil(r.due_date);
          const key = `${r.kind}-${r.target_id}`;
          return (
            <div key={key} className="os-glass p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link to={`/admin/clients/${r.user_id}`} className="font-semibold text-sm hover:text-blue-300 truncate block">
                    {r.client_name}
                  </Link>
                  {r.client_email && <div className="text-[10px] text-white/40 truncate">{r.client_email}</div>}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${KIND_META[r.kind].color}`}>
                  {KIND_META[r.kind].label}
                </span>
              </div>
              <div className="text-xs text-white/70">{r.label}</div>
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="mono text-white/60">Due {r.due_date}</span>
                <span className={`px-2 py-0.5 rounded-full border mono ${urgencyClass(days)}`}>
                  {days < 0 ? `${Math.abs(days)}d overdue` : `in ${days}d`}
                </span>
                <span className="text-white/40 mono">· {r.reminders_sent} sent</span>
              </div>
              <button disabled={sending === key || !r.client_email}
                onClick={() => sendReminder(r)}
                className="w-full h-9 px-3 rounded-lg text-xs border border-white/10 hover:bg-white/5 disabled:opacity-40 inline-flex items-center justify-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {sending === key ? "Sending…" : "Send reminder"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Card({ label, value, tone, active, onClick, icon }: { label: string; value: number; tone: string; active: boolean; onClick: () => void; icon?: React.ReactNode }) {
  const tones: Record<string, string> = {
    blue:  "from-blue-500/10 border-blue-500/20 text-blue-300",
    red:   "from-red-500/10 border-red-500/20 text-red-300",
    amber: "from-amber-500/10 border-amber-500/20 text-amber-300",
    green: "from-green-500/10 border-green-500/20 text-green-300",
  };
  return (
    <button onClick={onClick}
      className={`os-glass p-4 bg-gradient-to-br ${tones[tone]} border text-left transition ${active ? "ring-2 ring-white/30" : "hover:bg-white/[0.03]"}`}>
      <div className="flex items-center gap-2 text-xs opacity-80">{icon}{label}</div>
      <div className="text-2xl font-bold mono mt-1">{value}</div>
    </button>
  );
}
