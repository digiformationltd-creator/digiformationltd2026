// Native Business OS order drawer — keyed by order.id, works for guest
// (user_id NULL) and authenticated orders. Replaces the Legacy Admin
// redirect so day-to-day order operations stop depending on Legacy.
//
// Reuses existing production tables + edge functions:
//   - client_orders  (status, notes, customer details)
//   - invoices       (linked invoice list + PDF URL)
//   - send-transactional-email  (order-in-progress / order-completed)
//
// No schema changes, no new edge functions, no automation changes.
import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2, Mail, User, PoundSterling, Calendar, FileText, Download,
  Play, CheckCircle2, Ban, Save, RefreshCw, Hash, Phone, Building2,
  Clock, Truck, RotateCcw,
} from "lucide-react";

type Order = {
  id: string;
  order_ref: string;
  service: string;
  status: string;
  amount_gbp: number;
  customer_name: string | null;
  customer_email: string | null;
  customer_whatsapp: string | null;
  user_id: string | null;
  order_date: string;
  created_at: string;
  notes: string | null;
};

type Invoice = {
  id: string;
  invoice_number: string;
  status: string;
  total_gbp: number;
  currency: string;
  pdf_url: string | null;
  created_at: string;
};

const STATUS_OPTIONS = [
  { value: "Pending",     icon: Clock,         tone: "amber" },
  { value: "In Progress", icon: Play,          tone: "blue" },
  { value: "Delivered",   icon: Truck,         tone: "cyan" },
  { value: "Completed",   icon: CheckCircle2,  tone: "emerald" },
  { value: "Revision",    icon: RotateCcw,     tone: "purple" },
  { value: "Cancelled",   icon: Ban,           tone: "rose" },
] as const;

const toneClass = (tone: string, active: boolean) => {
  const map: Record<string, string> = {
    amber: active ? "bg-amber-500/25 ring-amber-400/50 text-amber-100" : "bg-amber-500/10 ring-amber-400/20 text-amber-300 hover:bg-amber-500/20",
    blue: active ? "bg-blue-500/25 ring-blue-400/50 text-blue-100" : "bg-blue-500/10 ring-blue-400/20 text-blue-300 hover:bg-blue-500/20",
    cyan: active ? "bg-cyan-500/25 ring-cyan-400/50 text-cyan-100" : "bg-cyan-500/10 ring-cyan-400/20 text-cyan-300 hover:bg-cyan-500/20",
    emerald: active ? "bg-emerald-500/25 ring-emerald-400/50 text-emerald-100" : "bg-emerald-500/10 ring-emerald-400/20 text-emerald-300 hover:bg-emerald-500/20",
    purple: active ? "bg-purple-500/25 ring-purple-400/50 text-purple-100" : "bg-purple-500/10 ring-purple-400/20 text-purple-300 hover:bg-purple-500/20",
    rose: active ? "bg-rose-500/25 ring-rose-400/50 text-rose-100" : "bg-rose-500/10 ring-rose-400/20 text-rose-300 hover:bg-rose-500/20",
  };
  return map[tone] || "";
};

const fmtGBP = (n: number, ccy = "GBP") =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: ccy || "GBP" }).format(n || 0);
const fmtDateTime = (s: string) => {
  try { return new Date(s).toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return s; }
};

export default function OsOrderDrawer({
  orderId, open, onClose, onChanged,
}: {
  orderId: string | null;
  open: boolean;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const [order, setOrder] = useState<Order | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const load = async () => {
    if (!orderId) return;
    setLoading(true);
    const [{ data: o, error: oErr }, { data: invs }] = await Promise.all([
      supabase.from("client_orders").select("*").eq("id", orderId).maybeSingle(),
      supabase.from("invoices").select("id, invoice_number, status, total_gbp, currency, pdf_url, created_at")
        .eq("order_id", orderId).order("created_at", { ascending: false }),
    ]);
    setLoading(false);
    if (oErr) { toast.error(oErr.message); return; }
    setOrder(o as Order | null);
    setNotes((o as Order | null)?.notes || "");
    setInvoices((invs || []) as Invoice[]);
  };

  useEffect(() => {
    if (open && orderId) {
      load();
      const ch = supabase
        .channel(`os-order-drawer-${orderId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "client_orders", filter: `id=eq.${orderId}` }, () => load())
        .on("postgres_changes", { event: "*", schema: "public", table: "invoices", filter: `order_id=eq.${orderId}` }, () => load())
        .subscribe();
      return () => { supabase.removeChannel(ch); };
    }
    if (!open) {
      setOrder(null);
      setInvoices([]);
      setNotes("");
    }
  }, [open, orderId]);

  const isGuest = useMemo(() => !!order && !order.user_id, [order]);

  const updateStatus = async (newStatus: string) => {
    if (!order || order.status === newStatus) return;
    setStatusBusy(true);
    const { error } = await supabase.from("client_orders").update({ status: newStatus }).eq("id", order.id);
    setStatusBusy(false);
    if (error) { toast.error(error.message); return; }
    setOrder({ ...order, status: newStatus });
    onChanged?.();

    // Auto-fire the matching transactional email (mirrors Legacy behaviour)
    const email = order.customer_email;
    if (email) {
      let template: string | null = null;
      if (/progress/i.test(newStatus))  template = "order-in-progress";
      else if (/complete/i.test(newStatus)) template = "order-completed";
      if (template) {
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: template,
            recipientEmail: email,
            idempotencyKey: `${template}-${order.id}`,
            orderId: order.id,
            clientUserId: order.user_id ?? undefined,
            triggerSource: "admin",
            templateData: {
              customerName: order.customer_name || "",
              orderRef: order.order_ref,
              service: order.service,
            },
          },
        }).catch(console.error);
        toast.success(`Status → ${newStatus} · client notified`);
        return;
      }
    }
    toast.success(`Status → ${newStatus}`);
  };

  const saveNotes = async () => {
    if (!order) return;
    setSavingNotes(true);
    const { error } = await supabase.from("client_orders").update({ notes }).eq("id", order.id);
    setSavingNotes(false);
    if (error) { toast.error(error.message); return; }
    setOrder({ ...order, notes });
    onChanged?.();
    toast.success("Notes saved");
  };

  const resendEmail = async (template: "order-in-progress" | "order-completed") => {
    if (!order?.customer_email) { toast.error("No customer email on file"); return; }
    setEmailBusy(template);
    const { error } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: template,
        recipientEmail: order.customer_email,
        idempotencyKey: `${template}-${order.id}-${Date.now()}`,
        orderId: order.id,
        clientUserId: order.user_id ?? undefined,
        triggerSource: "admin",
        templateData: {
          customerName: order.customer_name || "",
          orderRef: order.order_ref,
          service: order.service,
        },
      },
    });
    setEmailBusy(null);
    if (error) toast.error(error.message);
    else toast.success(`Sent ${template} to ${order.customer_email}`);
  };

  const downloadInvoice = async (inv: Invoice) => {
    if (!inv.pdf_url) { toast.error("No PDF stored for this invoice"); return; }
    // pdf_url is a storage path (folder/file.pdf) — create signed URL
    if (inv.pdf_url.startsWith("http")) {
      window.open(inv.pdf_url, "_blank", "noopener,noreferrer");
      return;
    }
    const { data, error } = await supabase.storage.from("invoices").createSignedUrl(inv.pdf_url, 60 * 60);
    if (error || !data) { toast.error(error?.message || "Could not sign URL"); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto bg-slate-950/95 border-l border-white/10 text-white">
        <SheetHeader>
          <SheetTitle className="text-white flex items-center gap-2 text-base">
            <Hash className="w-4 h-4" />
            Order Detail
          </SheetTitle>
        </SheetHeader>

        {!order && loading && (
          <div className="py-20 grid place-items-center text-white/50"><Loader2 className="w-5 h-5 animate-spin" /></div>
        )}

        {order && (
          <div className="space-y-5 mt-4 pb-12">
            {/* Header */}
            <div className="os-glass p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-mono text-sm text-white/90">{order.order_ref}</div>
                  <div className="text-[11px] text-white/40 mt-0.5">Created {fmtDateTime(order.created_at)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">{fmtGBP(Number(order.amount_gbp))}</div>
                  {isGuest && (
                    <div className="text-[10px] uppercase tracking-widest text-amber-300 mt-1">Guest order</div>
                  )}
                </div>
              </div>
              <div className="text-sm font-semibold text-white/90 truncate">{order.service}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/70">
                <Row icon={User}     label={order.customer_name || "(no name)"} />
                <Row icon={Mail}     label={order.customer_email || "(no email)"} />
                <Row icon={Phone}    label={order.customer_whatsapp || "(no whatsapp)"} />
                <Row icon={Calendar} label={`Order date · ${order.order_date}`} />
              </div>
            </div>

            {/* Status */}
            <div className="os-glass p-4 space-y-3">
              <div className="text-[11px] uppercase tracking-widest text-white/50 font-semibold flex items-center gap-2">
                Status {statusBusy && <Loader2 className="w-3 h-3 animate-spin" />}
              </div>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((s) => {
                  const Icon = s.icon;
                  const active = order.status === s.value;
                  return (
                    <button
                      key={s.value}
                      disabled={statusBusy}
                      onClick={() => updateStatus(s.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ring-1 transition disabled:opacity-50 ${toneClass(s.tone, active)}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {s.value}
                    </button>
                  );
                })}
              </div>
              <div className="text-[11px] text-white/40">
                Setting status to <span className="text-white/70">In Progress</span> or <span className="text-white/70">Completed</span> automatically emails the client.
              </div>
            </div>

            {/* Internal notes */}
            <div className="os-glass p-4 space-y-3">
              <div className="text-[11px] uppercase tracking-widest text-white/50 font-semibold">Internal notes</div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes visible to the team only…"
                rows={4}
                className="w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30"
              />
              <button
                disabled={savingNotes || notes === (order.notes || "")}
                onClick={saveNotes}
                className="px-3 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-xs font-semibold inline-flex items-center gap-2 disabled:opacity-40"
              >
                {savingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save notes
              </button>
            </div>

            {/* Manual transactional emails */}
            <div className="os-glass p-4 space-y-3">
              <div className="text-[11px] uppercase tracking-widest text-white/50 font-semibold">Send email to client</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  disabled={!order.customer_email || emailBusy !== null}
                  onClick={() => resendEmail("order-in-progress")}
                  className="px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 ring-1 ring-blue-400/30 text-xs font-semibold text-blue-200 inline-flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {emailBusy === "order-in-progress" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  Resend "In progress"
                </button>
                <button
                  disabled={!order.customer_email || emailBusy !== null}
                  onClick={() => resendEmail("order-completed")}
                  className="px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 ring-1 ring-emerald-400/30 text-xs font-semibold text-emerald-200 inline-flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {emailBusy === "order-completed" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Resend "Completed"
                </button>
              </div>
              {!order.customer_email && (
                <div className="text-[11px] text-amber-300">Customer email missing — cannot send.</div>
              )}
            </div>

            {/* Linked invoices */}
            <div className="os-glass p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-widest text-white/50 font-semibold">Linked invoices</div>
                <button onClick={load} className="text-white/40 hover:text-white/80" title="Refresh">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              {invoices.length === 0 && (
                <div className="text-xs text-white/50">No invoice attached to this order yet.</div>
              )}
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between bg-white/[0.03] rounded-lg p-2.5">
                  <div className="min-w-0">
                    <div className="font-mono text-xs text-white/90 truncate">{inv.invoice_number}</div>
                    <div className="text-[10px] text-white/40 mt-0.5">{fmtDateTime(inv.created_at)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{fmtGBP(Number(inv.total_gbp), inv.currency)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${inv.status === "Paid" ? "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30" : "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30"}`}>
                      {inv.status}
                    </span>
                    <button
                      onClick={() => downloadInvoice(inv)}
                      disabled={!inv.pdf_url}
                      className="h-7 w-7 rounded-lg grid place-items-center bg-white/[0.05] hover:bg-white/[0.10] disabled:opacity-30"
                      title={inv.pdf_url ? "Download PDF" : "No PDF stored"}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {isGuest && (
              <div className="rounded-xl border border-amber-400/30 bg-amber-500/[0.06] p-3 text-[11px] text-amber-100 flex items-start gap-2">
                <Building2 className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  This is a <strong>guest checkout</strong>. The customer has not registered a portal account.
                  All operational actions above still work. When the customer later signs up with{" "}
                  <span className="font-mono">{order.customer_email}</span>, the upcoming Wave 4
                  reconciliation will link this order to their profile automatically.
                </div>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Icon className="w-3.5 h-3.5 text-white/40 shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  );
}
