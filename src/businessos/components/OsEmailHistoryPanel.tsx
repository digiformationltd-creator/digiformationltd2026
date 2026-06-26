import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";

type EmailRow = {
  id: string;
  template_name: string;
  recipient_email: string;
  status: string | null;
  created_at: string;
  trigger_source: string | null;
  message_id: string | null;
  error_message: string | null;
  metadata: Record<string, any> | null;
};

type Scope =
  | { orderId: string }
  | { invoiceId: string }
  | { ticketId: string }
  | { clientUserId: string; clientEmail?: string | null };

interface Props {
  scope: Scope;
  title?: string;
  /** Visual density: 'compact' for drawers, 'full' for detail pages */
  density?: "compact" | "full";
}

function statusPill(s: string | null) {
  const v = (s || "queued").toLowerCase();
  if (v === "sent" || v === "delivered")
    return { cls: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30", Icon: CheckCircle2, label: v };
  if (v === "failed" || v === "bounced")
    return { cls: "bg-rose-500/15 text-rose-300 border-rose-400/30", Icon: XCircle, label: v };
  return { cls: "bg-white/10 text-white/70 border-white/20", Icon: Clock, label: v };
}

function sourcePill(s: string | null) {
  const v = (s || "system").toLowerCase();
  const map: Record<string, string> = {
    cron: "bg-indigo-500/15 text-indigo-300 border-indigo-400/30",
    admin: "bg-amber-500/15 text-amber-300 border-amber-400/30",
    automation: "bg-purple-500/15 text-purple-300 border-purple-400/30",
    agent: "bg-cyan-500/15 text-cyan-300 border-cyan-400/30",
    system: "bg-white/10 text-white/70 border-white/20",
  };
  return map[v] || map.system;
}

export default function OsEmailHistoryPanel({ scope, title = "Email History", density = "compact" }: Props) {
  const [rows, setRows] = useState<EmailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const cols = "id, template_name, recipient_email, status, created_at, trigger_source, message_id, error_message, metadata";
    let q = supabase.from("email_send_log").select(cols).order("created_at", { ascending: false }).limit(50);

    if ("orderId" in scope) q = q.eq("order_id", scope.orderId);
    else if ("invoiceId" in scope) q = q.eq("invoice_id", scope.invoiceId);
    else if ("ticketId" in scope) q = q.eq("ticket_id", scope.ticketId);
    else {
      // Client scope: prefer client_user_id, but fall back to recipient_email for legacy rows
      const ors: string[] = [`client_user_id.eq.${scope.clientUserId}`];
      if (scope.clientEmail) ors.push(`recipient_email.eq.${scope.clientEmail}`);
      q = q.or(ors.join(","));
    }

    const { data, error } = await q;
    if (!error && data) setRows(data as EmailRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [JSON.stringify(scope)]);

  return (
    <div className={density === "compact" ? "rounded-xl border border-white/10 bg-white/[0.02] p-3" : "rounded-2xl border border-white/10 bg-white/[0.02] p-4"}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-white/80">
          <Mail className="w-4 h-4 text-white/60" />
          {title}
          <span className="text-white/40">· {rows.length}</span>
        </div>
        <button
          onClick={load}
          className="text-xs px-2 py-1 rounded-md border border-white/10 hover:bg-white/5 text-white/70 inline-flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-white/50 py-4 justify-center">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="text-xs text-white/40 py-4 text-center">No emails recorded for this record yet.</div>
      ) : (
        <ul className="divide-y divide-white/5">
          {rows.map((r) => {
            const sp = statusPill(r.status);
            const ts = r.sent_at || r.created_at;
            const isOpen = expanded === r.id;
            return (
              <li key={r.id} className="py-2">
                <button
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                  className="w-full text-left grid grid-cols-12 gap-2 items-center hover:bg-white/[0.03] rounded-md px-2 py-1.5"
                >
                  <div className="col-span-4 min-w-0">
                    <div className="text-[13px] text-white/90 truncate">{r.subject || r.template_name}</div>
                    <div className="text-[11px] text-white/40 truncate">{r.template_name}</div>
                  </div>
                  <div className="col-span-4 text-[12px] text-white/60 truncate">{r.recipient_email}</div>
                  <div className="col-span-2 text-[11px] text-white/50">
                    {new Date(ts).toLocaleString()}
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${sourcePill(r.trigger_source)}`}>
                      {(r.trigger_source || "system").toUpperCase()}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${sp.cls}`}>
                      <sp.Icon className="w-2.5 h-2.5" /> {sp.label}
                    </span>
                  </div>
                </button>
                {isOpen && (
                  <div className="mt-1 mx-2 rounded-md border border-white/10 bg-black/30 p-2 text-[11px] text-white/60 space-y-1">
                    <div><span className="text-white/40">Message ID:</span> {r.message_id || "—"}</div>
                    <div><span className="text-white/40">Created:</span> {new Date(r.created_at).toLocaleString()}</div>
                    <div><span className="text-white/40">Sent:</span> {r.sent_at ? new Date(r.sent_at).toLocaleString() : "—"}</div>
                    {r.error_message && (
                      <div className="text-rose-300"><span className="text-white/40">Error:</span> {r.error_message}</div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
