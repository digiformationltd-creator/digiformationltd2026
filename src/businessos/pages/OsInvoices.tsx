import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TableSkeleton } from "../components/Skeletons";
import OsInvoiceDrawer from "../components/OsInvoiceDrawer";
import OsOrderDrawer from "../components/OsOrderDrawer";
import {
  Search, RefreshCw, Loader2, ChevronRight, ExternalLink, Filter,
  FileText, Download, Mail, CheckCircle2, RotateCcw, PoundSterling,
  AlertTriangle, Clock, Send, User,
} from "lucide-react";

interface InvoiceRow {
  id: string;
  invoice_number: string;
  service_description: string;
  service_code: string;
  status: string;                 // Unpaid | Paid | Sent | Overdue
  amount_gbp: number;
  vat_gbp: number;
  total_gbp: number;
  currency: string;
  bill_to_name: string | null;
  bill_to_email: string | null;
  user_id: string | null;
  order_id: string | null;
  issue_date: string;
  due_date: string | null;
  pdf_url: string | null;
  created_at: string;
  notes: string | null;
}

const STATUSES = [
  { key: "all",     label: "All",     icon: Filter,        color: "text-white/70" },
  { key: "Unpaid",  label: "Pending", icon: Clock,         color: "text-amber-300" },
  { key: "Sent",    label: "Sent",    icon: Send,          color: "text-blue-300" },
  { key: "Paid",    label: "Paid",    icon: CheckCircle2,  color: "text-emerald-300" },
  { key: "Overdue", label: "Overdue", icon: AlertTriangle, color: "text-rose-300" },
];

const statusChip = (s: string) => {
  const map: Record<string, string> = {
    "Paid":    "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30",
    "Sent":    "bg-blue-500/15 text-blue-200 ring-1 ring-blue-400/30",
    "Unpaid":  "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30",
    "Overdue": "bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30",
  };
  return map[s] || "bg-white/[0.06] text-white/70 ring-1 ring-white/10";
};

const fmtDate = (s?: string | null) => {
  if (!s) return "—";
  try { return new Date(s).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return s; }
};
const fmtMoney = (n: number, ccy = "GBP") =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: ccy || "GBP", maximumFractionDigits: 2 }).format(n || 0);

const isOverdue = (i: InvoiceRow) => {
  if (i.status === "Paid") return false;
  if (!i.due_date) return false;
  return new Date(i.due_date) < new Date();
};
const effectiveStatus = (i: InvoiceRow) => (isOverdue(i) && i.status !== "Paid" ? "Overdue" : i.status);

export default function OsInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("issue_date", { ascending: false })
      .limit(500);
    setLoading(false);
    if (error) { toast.error(error.message || "Unable to load invoices"); return; }
    setInvoices((data || []) as InvoiceRow[]);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("os-invoices-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, () => { load(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "client_orders" }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Need related order_ref for search; pull once
  const [orderRefs, setOrderRefs] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    const ids = invoices.map(i => i.order_id).filter(Boolean) as string[];
    if (!ids.length) return;
    supabase.from("client_orders").select("id, order_ref").in("id", ids).then(({ data }) => {
      const m = new Map<string, string>();
      for (const o of data || []) m.set(o.id, o.order_ref);
      setOrderRefs(m);
    });
  }, [invoices]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return invoices.filter((i) => {
      const eff = effectiveStatus(i);
      if (statusFilter !== "all" && eff !== statusFilter) return false;
      if (!q) return true;
      const orderRef = i.order_id ? (orderRefs.get(i.order_id) || "") : "";
      return (
        (i.invoice_number || "").toLowerCase().includes(q) ||
        (i.service_description || "").toLowerCase().includes(q) ||
        (i.bill_to_name || "").toLowerCase().includes(q) ||
        (i.bill_to_email || "").toLowerCase().includes(q) ||
        orderRef.toLowerCase().includes(q)
      );
    });
  }, [invoices, search, statusFilter, orderRefs]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: invoices.length };
    for (const s of STATUSES) if (s.key !== "all") c[s.key] = 0;
    for (const i of invoices) {
      const eff = effectiveStatus(i);
      c[eff] = (c[eff] || 0) + 1;
    }
    return c;
  }, [invoices]);

  const paidTotal = useMemo(
    () => invoices.filter(i => i.status === "Paid").reduce((a, i) => a + (Number(i.total_gbp) || 0), 0), [invoices]
  );
  const outstandingTotal = useMemo(
    () => invoices.filter(i => i.status !== "Paid").reduce((a, i) => a + (Number(i.total_gbp) || 0), 0), [invoices]
  );
  const overdueTotal = useMemo(
    () => invoices.filter(i => isOverdue(i)).reduce((a, i) => a + (Number(i.total_gbp) || 0), 0), [invoices]
  );

  const openInLegacy = (i: InvoiceRow) => {
    if (i.user_id) navigate(`/admin/legacy?client=${i.user_id}&tab=invoices`);
    else toast.info("No linked client — use Full Admin");
  };
  const openOrderInLegacy = (i: InvoiceRow) => {
    if (i.user_id) navigate(`/admin/legacy?client=${i.user_id}&tab=orders`);
    else toast.info("No linked client — use Full Admin");
  };

  // QUICK ACTIONS — reuse existing production flows
  const downloadPdf = (i: InvoiceRow) => {
    if (i.pdf_url) {
      window.open(i.pdf_url, "_blank", "noopener,noreferrer");
    } else {
      toast.info("No PDF stored yet — open Full Admin to generate one.");
      openInLegacy(i);
    }
  };

  const sendInvoiceEmail = async (i: InvoiceRow) => {
    if (!i.bill_to_email) { toast.error("Invoice has no recipient email."); return; }
    setBusyId(i.id);
    try {
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "invoice-issued",
          recipientEmail: i.bill_to_email,
          idempotencyKey: `invoice-issued-${i.invoice_number}`,
          templateData: {
            customerName: i.bill_to_name || "",
            invoiceNumber: i.invoice_number,
            amount: fmtMoney(Number(i.total_gbp), i.currency),
            service: i.service_description,
            pdfUrl: i.pdf_url || undefined,
          },
        },
      });
      if (error) throw error;
      // Move to Sent if it was Unpaid
      if (i.status === "Unpaid") {
        await supabase.from("invoices").update({ status: "Sent" }).eq("id", i.id);
      }
      toast.success(`Invoice ${i.invoice_number} emailed to ${i.bill_to_email}`);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to send invoice email");
    } finally {
      setBusyId(null);
    }
  };

  const togglePaid = async (i: InvoiceRow) => {
    setBusyId(i.id);
    try {
      const goingPaid = i.status !== "Paid";
      const newStatus = goingPaid ? "Paid" : "Unpaid";
      const { error } = await supabase.from("invoices").update({ status: newStatus }).eq("id", i.id);
      if (error) throw error;
      if (goingPaid && i.bill_to_email) {
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "invoice-paid",
            recipientEmail: i.bill_to_email,
            idempotencyKey: `invoice-paid-${i.id}`,
            templateData: {
              customerName: i.bill_to_name || "",
              invoiceNumber: i.invoice_number,
              amount: fmtMoney(Number(i.total_gbp), i.currency),
              service: i.service_description,
            },
          },
        }).catch(console.error);
      }
      toast.success(`Marked ${i.invoice_number} as ${newStatus}`);
      load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update invoice");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Invoices"  value={String(invoices.length)}   icon={FileText}      glow="blue" />
        <StatCard label="Paid"            value={fmtMoney(paidTotal)}       icon={CheckCircle2}  glow="green" />
        <StatCard label="Outstanding"     value={fmtMoney(outstandingTotal)} icon={Clock}        glow="purple" />
        <StatCard label="Overdue"         value={fmtMoney(overdueTotal)}    icon={AlertTriangle} glow="cyan" />
      </div>

      {/* Toolbar */}
      <div className="os-glass p-3 sm:p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice #, client, order #, service…"
              className="w-full h-11 rounded-xl pl-10 pr-3 text-sm"
            />
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="h-11 px-4 rounded-xl os-glass text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
          <button
            onClick={() => navigate("/admin/legacy")}
            className="h-11 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:opacity-90"
            title="Open full legacy admin"
          >
            <ExternalLink className="w-4 h-4" /> Full Admin
          </button>
        </div>

        {/* Status pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {STATUSES.map((s) => {
            const Icon = s.icon;
            const active = statusFilter === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key)}
                className={`shrink-0 h-9 px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition ring-1 ${
                  active
                    ? "bg-white/[0.10] ring-white/20 text-white"
                    : "bg-white/[0.03] ring-white/5 text-white/60 hover:bg-white/[0.06]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-white" : s.color}`} />
                {s.label}
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${active ? "bg-white/10" : "bg-white/[0.05]"}`}>
                  {counts[s.key] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-white/50 px-1">
        Showing <span className="text-white/80 font-semibold">{filtered.length}</span> of {invoices.length} invoices
      </div>

      {/* Loading */}
      {loading && invoices.length === 0 && (
        <div className="os-fade-in">
          <TableSkeleton columns={8} rows={8} />
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="os-glass p-12 text-center">
          <FileText className="w-10 h-10 text-white/30 mx-auto mb-2" />
          <div className="text-sm text-white/60">
            {invoices.length === 0 ? "No invoices yet." : "No invoices match your filters."}
          </div>
        </div>
      )}

      {/* Desktop table */}
      {filtered.length > 0 && (
        <div className="os-glass overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-widest text-white/40 border-b border-white/5">
                  <th className="py-3 px-4 font-semibold">Invoice #</th>
                  <th className="py-3 px-4 font-semibold">Client</th>
                  <th className="py-3 px-4 font-semibold">Service</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Total</th>
                  <th className="py-3 px-4 font-semibold">Issued</th>
                  <th className="py-3 px-4 font-semibold">Due</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => {
                  const eff = effectiveStatus(i);
                  const busy = busyId === i.id;
                  return (
                    <tr
                      key={i.id}
                      onClick={() => openInLegacy(i)}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs text-white/80">{i.invoice_number}</div>
                        {i.order_id && orderRefs.get(i.order_id) && (
                          <div className="font-mono text-[10px] text-white/40 mt-0.5">{orderRefs.get(i.order_id)}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold truncate max-w-[180px]">{i.bill_to_name || "(unknown)"}</div>
                        {i.bill_to_email && <div className="text-[11px] text-white/40 truncate max-w-[180px]">{i.bill_to_email}</div>}
                      </td>
                      <td className="py-3 px-4 text-white/70 truncate max-w-[200px]">{i.service_description}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusChip(eff)}`}>
                          {eff}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold whitespace-nowrap">{fmtMoney(Number(i.total_gbp), i.currency)}</td>
                      <td className="py-3 px-4 text-white/50 text-xs whitespace-nowrap">{fmtDate(i.issue_date)}</td>
                      <td className={`py-3 px-4 text-xs whitespace-nowrap ${isOverdue(i) ? "text-rose-300 font-semibold" : "text-white/50"}`}>
                        {fmtDate(i.due_date)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <IconBtn title="Download PDF" disabled={busy} onClick={() => downloadPdf(i)}>
                            <Download className="w-3.5 h-3.5" />
                          </IconBtn>
                          <IconBtn title="Send invoice email" disabled={busy || !i.bill_to_email} onClick={() => sendInvoiceEmail(i)}>
                            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                          </IconBtn>
                          <IconBtn
                            title={i.status === "Paid" ? "Mark unpaid" : "Mark paid"}
                            disabled={busy}
                            onClick={() => togglePaid(i)}
                            tone={i.status === "Paid" ? "warn" : "good"}
                          >
                            {i.status === "Paid" ? <RotateCcw className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          </IconBtn>
                          <IconBtn title="Open client invoices" onClick={() => openInLegacy(i)}>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </IconBtn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile cards */}
      {filtered.length > 0 && (
        <div className="md:hidden space-y-3">
          {filtered.map((i) => {
            const eff = effectiveStatus(i);
            const busy = busyId === i.id;
            return (
              <div key={i.id} className="os-glass p-4">
                <div className="flex items-start justify-between gap-3" onClick={() => openInLegacy(i)}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] text-white/70">{i.invoice_number}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusChip(eff)}`}>
                        {eff}
                      </span>
                    </div>
                    <div className="font-semibold truncate">{i.service_description}</div>
                    <div className="flex items-center gap-1.5 text-xs text-white/60 mt-1 truncate">
                      <User className="w-3 h-3 shrink-0" />
                      <span className="truncate">{i.bill_to_name || "(unknown)"}</span>
                    </div>
                    {i.bill_to_email && (
                      <div className="flex items-center gap-1.5 text-[11px] text-white/50 mt-0.5 truncate">
                        <Mail className="w-3 h-3 shrink-0" /><span className="truncate">{i.bill_to_email}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-base">{fmtMoney(Number(i.total_gbp), i.currency)}</div>
                    <div className="text-[10px] text-white/40 mt-0.5">{fmtDate(i.issue_date)}</div>
                    {i.due_date && (
                      <div className={`text-[10px] mt-0.5 ${isOverdue(i) ? "text-rose-300 font-semibold" : "text-white/40"}`}>
                        Due {fmtDate(i.due_date)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-white/5">
                  <MobileAction icon={Download} label="PDF"   disabled={busy}                            onClick={() => downloadPdf(i)} />
                  <MobileAction icon={Mail}     label="Email" disabled={busy || !i.bill_to_email}        onClick={() => sendInvoiceEmail(i)} loading={busy} />
                  <MobileAction
                    icon={i.status === "Paid" ? RotateCcw : CheckCircle2}
                    label={i.status === "Paid" ? "Unpaid" : "Paid"}
                    disabled={busy}
                    onClick={() => togglePaid(i)}
                    tone={i.status === "Paid" ? "warn" : "good"}
                  />
                  <MobileAction icon={ExternalLink} label="Open" onClick={() => openInLegacy(i)} />
                </div>
                {i.order_id && orderRefs.get(i.order_id) && (
                  <button
                    onClick={() => openOrderInLegacy(i)}
                    className="mt-2 text-[11px] text-blue-300 hover:text-blue-200 inline-flex items-center gap-1"
                  >
                    <PoundSterling className="w-3 h-3" /> Linked order {orderRefs.get(i.order_id)}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IconBtn({
  children, onClick, title, disabled, tone,
}: { children: any; onClick: () => void; title: string; disabled?: boolean; tone?: "good" | "warn" }) {
  const base = "h-7 w-7 rounded-lg grid place-items-center text-white/70 hover:text-white disabled:opacity-40 transition";
  const bg =
    tone === "good" ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200" :
    tone === "warn" ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-200" :
    "bg-white/[0.05] hover:bg-white/[0.10]";
  return (
    <button onClick={onClick} title={title} disabled={disabled} className={`${base} ${bg}`}>
      {children}
    </button>
  );
}

function MobileAction({
  icon: Icon, label, onClick, disabled, loading, tone,
}: { icon: any; label: string; onClick: () => void; disabled?: boolean; loading?: boolean; tone?: "good" | "warn" }) {
  const toneCls =
    tone === "good" ? "bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20" :
    tone === "warn" ? "bg-amber-500/10 text-amber-200 hover:bg-amber-500/20" :
    "bg-white/[0.04] text-white/70 hover:bg-white/[0.08]";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-[11px] font-medium rounded-lg py-2 inline-flex flex-col items-center justify-center gap-0.5 disabled:opacity-40 ${toneCls}`}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon: Icon, glow }: { label: string; value: string; icon: any; glow: string }) {
  return (
    <div className={`os-glass os-glow-${glow} p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] uppercase tracking-widest text-white/50">{label}</div>
        <Icon className="w-4 h-4 text-white/40" />
      </div>
      <div className="text-xl sm:text-2xl font-bold truncate">{value}</div>
    </div>
  );
}
