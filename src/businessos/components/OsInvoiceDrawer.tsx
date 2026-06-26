// Native Business OS invoice drawer — keyed by invoice.id, guest-safe.
// Reuses production tables (invoices, client_orders) and the
// send-transactional-email edge function for invoice-issued / invoice-paid.
// No schema changes, no new edge functions.
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import OsEmailHistoryPanel from "./OsEmailHistoryPanel";
import {
  Loader2, Mail, User, FileText, Download, CheckCircle2, RotateCcw,
  Save, Hash, Calendar, PoundSterling, Send, AlertTriangle, Clock,
} from "lucide-react";

type Invoice = {
  id: string;
  invoice_number: string;
  service_description: string;
  status: string;
  amount_gbp: number;
  vat_gbp: number;
  total_gbp: number;
  currency: string;
  bill_to_name: string | null;
  bill_to_email: string | null;
  bill_to_address: string | null;
  user_id: string | null;
  order_id: string | null;
  issue_date: string;
  due_date: string | null;
  pdf_url: string | null;
  notes: string | null;
  created_at: string;
};

type LinkedOrder = {
  id: string;
  order_ref: string;
  status: string;
  service: string;
};

const STATUS_OPTIONS = ["Unpaid", "Sent", "Paid", "Overdue"];

const statusChip = (s: string) => {
  const m: Record<string, string> = {
    Paid:    "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30",
    Sent:    "bg-blue-500/15 text-blue-200 ring-1 ring-blue-400/30",
    Unpaid:  "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30",
    Overdue: "bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30",
  };
  return m[s] || "bg-white/[0.06] text-white/70 ring-1 ring-white/10";
};

const fmtMoney = (n: number, ccy = "GBP") =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: ccy || "GBP" }).format(n || 0);
const fmtDateTime = (s: string) => {
  try { return new Date(s).toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return s; }
};

export default function OsInvoiceDrawer({
  invoiceId, open, onClose, onChanged,
}: {
  invoiceId: string | null;
  open: boolean;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [order, setOrder] = useState<LinkedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState<string>("");

  const load = async () => {
    if (!invoiceId) return;
    setLoading(true);
    const { data: inv, error } = await supabase.from("invoices").select("*").eq("id", invoiceId).maybeSingle();
    if (error) { setLoading(false); toast.error(error.message); return; }
    setInvoice(inv as Invoice | null);
    setNotes((inv as Invoice | null)?.notes || "");
    setDueDate((inv as Invoice | null)?.due_date || "");
    if (inv?.order_id) {
      const { data: o } = await supabase.from("client_orders")
        .select("id, order_ref, status, service").eq("id", inv.order_id).maybeSingle();
      setOrder(o as LinkedOrder | null);
    } else {
      setOrder(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open && invoiceId) {
      load();
      const ch = supabase
        .channel(`os-invoice-drawer-${invoiceId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "invoices", filter: `id=eq.${invoiceId}` }, () => load())
        .subscribe();
      return () => { supabase.removeChannel(ch); };
    }
    if (!open) {
      setInvoice(null);
      setOrder(null);
      setNotes("");
      setDueDate("");
    }
  }, [open, invoiceId]);

  const downloadPdf = async () => {
    if (!invoice?.pdf_url) { toast.error("No PDF stored for this invoice"); return; }
    if (invoice.pdf_url.startsWith("http")) {
      window.open(invoice.pdf_url, "_blank", "noopener,noreferrer");
      return;
    }
    const { data, error } = await supabase.storage.from("invoices").createSignedUrl(invoice.pdf_url, 60 * 60);
    if (error || !data) { toast.error(error?.message || "Could not sign URL"); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const resendIssued = async () => {
    if (!invoice?.bill_to_email) { toast.error("No recipient email on invoice"); return; }
    setBusy("issued");
    // include a fresh signed URL if a PDF is stored
    let signedUrl: string | undefined;
    if (invoice.pdf_url && !invoice.pdf_url.startsWith("http")) {
      const { data } = await supabase.storage.from("invoices").createSignedUrl(invoice.pdf_url, 60 * 60 * 24 * 7);
      signedUrl = data?.signedUrl;
    } else if (invoice.pdf_url) {
      signedUrl = invoice.pdf_url;
    }
    const { error } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "invoice-issued",
        recipientEmail: invoice.bill_to_email,
        idempotencyKey: `invoice-issued:${invoice.invoice_number}-resend-${Date.now()}`,
        invoiceId: invoice.id,
        orderId: invoice.order_id ?? undefined,
        clientUserId: invoice.user_id ?? undefined,
        triggerSource: "admin",
        templateData: {
          customerName: invoice.bill_to_name || "",
          invoiceNumber: invoice.invoice_number,
          orderRef: order?.order_ref || "",
          service: invoice.service_description,
          amount: fmtMoney(Number(invoice.total_gbp), invoice.currency),
          invoiceUrl: signedUrl,
        },
      },
    });
    setBusy(null);
    if (error) toast.error(error.message);
    else {
      if (invoice.status === "Unpaid") await supabase.from("invoices").update({ status: "Sent" }).eq("id", invoice.id);
      toast.success(`Invoice ${invoice.invoice_number} resent`);
      load();
      onChanged?.();
    }
  };

  const togglePaid = async () => {
    if (!invoice) return;
    setBusy("paid");
    const goingPaid = invoice.status !== "Paid";
    const newStatus = goingPaid ? "Paid" : "Unpaid";
    const { error } = await supabase.from("invoices").update({ status: newStatus }).eq("id", invoice.id);
    if (error) { setBusy(null); toast.error(error.message); return; }
    if (goingPaid && invoice.bill_to_email) {
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "invoice-paid",
          recipientEmail: invoice.bill_to_email,
          idempotencyKey: `invoice-paid-${invoice.id}`,
          invoiceId: invoice.id,
          orderId: invoice.order_id ?? undefined,
          clientUserId: invoice.user_id ?? undefined,
          triggerSource: "admin",
          templateData: {
            customerName: invoice.bill_to_name || "",
            invoiceNumber: invoice.invoice_number,
            amount: fmtMoney(Number(invoice.total_gbp), invoice.currency),
            service: invoice.service_description,
          },
        },
      }).catch(console.error);
    }
    setBusy(null);
    toast.success(`Marked ${newStatus}`);
    load();
    onChanged?.();
  };

  const setStatus = async (s: string) => {
    if (!invoice || s === invoice.status) return;
    if (s === "Paid" || invoice.status === "Paid") { togglePaid(); return; }
    setBusy("status");
    const { error } = await supabase.from("invoices").update({ status: s }).eq("id", invoice.id);
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`Status → ${s}`);
    load();
    onChanged?.();
  };

  const saveMeta = async () => {
    if (!invoice) return;
    setBusy("meta");
    const { error } = await supabase.from("invoices").update({
      notes,
      due_date: dueDate || null,
    }).eq("id", invoice.id);
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Invoice updated");
    load();
    onChanged?.();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto bg-slate-950/95 border-l border-white/10 text-white">
        <SheetHeader>
          <SheetTitle className="text-white flex items-center gap-2 text-base">
            <FileText className="w-4 h-4" />
            Invoice Detail
          </SheetTitle>
        </SheetHeader>

        {!invoice && loading && (
          <div className="py-20 grid place-items-center text-white/50"><Loader2 className="w-5 h-5 animate-spin" /></div>
        )}

        {invoice && (
          <div className="space-y-5 mt-4 pb-12">
            {/* Summary */}
            <div className="os-glass p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-sm text-white/90">{invoice.invoice_number}</div>
                  <div className="text-[11px] text-white/40 mt-0.5">Issued {invoice.issue_date}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">{fmtMoney(Number(invoice.total_gbp), invoice.currency)}</div>
                  <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusChip(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </div>
              </div>
              <div className="text-sm font-semibold text-white/90 truncate">{invoice.service_description}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/70">
                <Row icon={User}     label={invoice.bill_to_name || "(no name)"} />
                <Row icon={Mail}     label={invoice.bill_to_email || "(no email)"} />
                <Row icon={Calendar} label={`Due · ${invoice.due_date || "—"}`} />
                <Row icon={PoundSterling} label={`Net ${fmtMoney(Number(invoice.amount_gbp), invoice.currency)} · VAT ${fmtMoney(Number(invoice.vat_gbp), invoice.currency)}`} />
              </div>
              {order && (
                <div className="text-[11px] text-white/50 flex items-center gap-1.5 pt-2 border-t border-white/5">
                  <Hash className="w-3 h-3" />
                  Linked order <span className="font-mono text-white/80">{order.order_ref}</span> · {order.status}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="os-glass p-4 space-y-3">
              <div className="text-[11px] uppercase tracking-widest text-white/50 font-semibold">Actions</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  disabled={!invoice.pdf_url}
                  onClick={downloadPdf}
                  className="px-3 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-xs font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40"
                  title={invoice.pdf_url ? "Download invoice PDF" : "No PDF stored"}
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
                <button
                  disabled={!invoice.bill_to_email || busy !== null}
                  onClick={resendIssued}
                  className="px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 ring-1 ring-blue-400/30 text-xs font-semibold text-blue-200 inline-flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {busy === "issued" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Resend invoice
                </button>
                <button
                  disabled={busy !== null}
                  onClick={togglePaid}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40 ring-1 ${
                    invoice.status === "Paid"
                      ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 ring-amber-400/30"
                      : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 ring-emerald-400/30"
                  }`}
                >
                  {busy === "paid" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                    invoice.status === "Paid" ? <RotateCcw className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {invoice.status === "Paid" ? "Mark unpaid" : "Mark paid"}
                </button>
              </div>
              <div className="text-[11px] text-white/40">
                Marking paid automatically emails the client the <span className="text-white/70">invoice-paid</span> receipt.
              </div>
            </div>

            {/* Status pills */}
            <div className="os-glass p-4 space-y-3">
              <div className="text-[11px] uppercase tracking-widest text-white/50 font-semibold">Status</div>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    disabled={busy !== null}
                    onClick={() => setStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ring-1 transition disabled:opacity-50 ${
                      s === invoice.status ? statusChip(s) : "bg-white/[0.04] ring-white/10 text-white/60 hover:bg-white/[0.08]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Editable meta */}
            <div className="os-glass p-4 space-y-3">
              <div className="text-[11px] uppercase tracking-widest text-white/50 font-semibold">Invoice metadata</div>
              <label className="block text-xs text-white/60">
                Due date
                <input
                  type="date"
                  value={dueDate || ""}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                />
              </label>
              <label className="block text-xs text-white/60">
                Notes
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30"
                  placeholder="Internal invoice notes…"
                />
              </label>
              <button
                disabled={busy !== null || (notes === (invoice.notes || "") && (dueDate || "") === (invoice.due_date || ""))}
                onClick={saveMeta}
                className="px-3 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-xs font-semibold inline-flex items-center gap-2 disabled:opacity-40"
              >
                {busy === "meta" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save
              </button>
            </div>

            {!invoice.user_id && (
              <div className="rounded-xl border border-amber-400/30 bg-amber-500/[0.06] p-3 text-[11px] text-amber-100 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  Guest invoice — no portal account attached. All operational actions still work via this drawer.
                </div>
              </div>
            )}

            {/* Email history for this invoice */}
            <div className="os-glass p-4">
              <OsEmailHistoryPanel scope={{ invoiceId: invoice.id }} />
            </div>
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
