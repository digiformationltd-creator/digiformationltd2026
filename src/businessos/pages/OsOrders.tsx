import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TableSkeleton } from "../components/Skeletons";
import { generateInvoiceNumber, SERVICE_CODES } from "@/lib/invoice";
import {
  Search, RefreshCw, Loader2, ChevronRight, ShoppingBag,
  ExternalLink, Filter, CheckCircle2, Clock, Truck, RotateCcw, XCircle, Hourglass,
  FileText, Mail, User, PoundSterling, Play, Ban, Send, FilePlus,
} from "lucide-react";

interface OrderRow {
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
  invoice_number?: string | null;
  invoice_status?: string | null;
}

const STATUSES = [
  { key: "all",         label: "All",         icon: Filter,        color: "text-white/70" },
  { key: "Pending",     label: "Pending",     icon: Hourglass,     color: "text-amber-300" },
  { key: "In Progress", label: "In Progress", icon: Clock,         color: "text-blue-300" },
  { key: "Delivered",   label: "Delivered",   icon: Truck,         color: "text-cyan-300" },
  { key: "Completed",   label: "Completed",   icon: CheckCircle2,  color: "text-emerald-300" },
  { key: "Revision",    label: "Revision",    icon: RotateCcw,     color: "text-purple-300" },
  { key: "Cancelled",   label: "Cancelled",   icon: XCircle,       color: "text-rose-300" },
];

const statusChip = (s: string) => {
  const map: Record<string, string> = {
    "Pending":     "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30",
    "In Progress": "bg-blue-500/15 text-blue-200 ring-1 ring-blue-400/30",
    "Delivered":   "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/30",
    "Completed":   "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30",
    "Revision":    "bg-purple-500/15 text-purple-200 ring-1 ring-purple-400/30",
    "Cancelled":   "bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30",
  };
  return map[s] || "bg-white/[0.06] text-white/70 ring-1 ring-white/10";
};

const invoiceChip = (s?: string | null) => {
  if (!s) return "bg-white/[0.04] text-white/40 ring-1 ring-white/5";
  if (s.toLowerCase() === "paid")    return "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30";
  if (s.toLowerCase() === "overdue") return "bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30";
  return "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30";
};

const fmtDate = (s: string) => {
  try { return new Date(s).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return s; }
};
const fmtGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 }).format(n || 0);

const DATE_RANGES = [
  { key: "all",   label: "All time" },
  { key: "7d",    label: "Last 7 days" },
  { key: "30d",   label: "Last 30 days" },
  { key: "90d",   label: "Last 90 days" },
  { key: "month", label: "This month" },
];

export default function OsOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);

  /**
   * Inline status mutation. Mirrors Legacy Admin: update client_orders.status,
   * then fire the matching transactional email (order-in-progress / order-completed)
   * via the existing send-transactional-email edge function. Optimistic UI,
   * rollback on error, no new infrastructure.
   */
  const updateStatus = async (o: OrderRow, status: string, label: string) => {
    if (o.status === status) return;
    setPendingId(o.id);
    const prev = orders;
    setOrders((rows) => rows.map((r) => (r.id === o.id ? { ...r, status } : r)));
    const { error } = await supabase
      .from("client_orders")
      .update({ status })
      .eq("id", o.id);
    setPendingId(null);
    if (error) {
      setOrders(prev);
      toast.error(error.message || "Update failed");
      return;
    }

    // Fire client notification email (fire-and-forget, matches Legacy behaviour)
    const email = o.customer_email;
    if (email) {
      let templateName: string | null = null;
      let idemKey = "";
      if (/progress/i.test(status))  { templateName = "order-in-progress"; idemKey = `order-in-progress-${o.id}`; }
      else if (/complete/i.test(status)) { templateName = "order-completed";  idemKey = `order-completed-${o.id}`; }
      if (templateName) {
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName,
            recipientEmail: email,
            idempotencyKey: idemKey,
            templateData: {
              customerName: o.customer_name || "",
              orderRef: o.order_ref,
              service: o.service,
            },
          },
        }).catch(console.error);
      }
    }
    toast.success(`${o.order_ref} → ${label}${email ? " · client notified" : ""}`);
  };

  /**
   * Generate an invoice row for an order if none exists, then optionally
   * email it. Mirrors Legacy Admin's addOrder→invoice insert pattern using
   * the same invoice numbering helper. No PDF generation here (that's the
   * checkout/edge-function flow); the row is created as Unpaid so the
   * client can see it in their portal and Legacy Admin can attach a PDF.
   */
  const generateInvoiceForOrder = async (o: OrderRow, alsoSend: boolean) => {
    setPendingId(o.id);
    try {
      // Idempotency: re-use existing invoice if one is already linked
      let { data: existing } = await supabase
        .from("invoices")
        .select("id, invoice_number, bill_to_email, bill_to_name, total_gbp, service_description, status, currency")
        .eq("order_id", o.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let invoice = existing;
      if (!invoice) {
        const code = "O";
        const number = await generateInvoiceNumber(code);
        const amount = Number(o.amount_gbp) || 0;
        const { data: inserted, error: insErr } = await supabase
          .from("invoices")
          .insert({
            user_id: o.user_id,
            order_id: o.id,
            invoice_number: number,
            service_code: code,
            service_description: o.service || SERVICE_CODES[code] || "Service",
            bill_to_name: o.customer_name || null,
            bill_to_email: o.customer_email || null,
            amount_gbp: amount,
            vat_rate: 0,
            vat_gbp: 0,
            total_gbp: amount,
            status: "Unpaid",
          })
          .select("id, invoice_number, bill_to_email, bill_to_name, total_gbp, service_description, status, currency")
          .single();
        if (insErr) throw insErr;
        invoice = inserted;
        toast.success(`Invoice ${invoice!.invoice_number} created`);
      }

      if (alsoSend) {
        const to = invoice!.bill_to_email || o.customer_email;
        if (!to) {
          toast.error("Invoice created but no client email on file");
        } else {
          const { error } = await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "invoice-issued",
              recipientEmail: to,
              idempotencyKey: `invoice-issued-${invoice!.invoice_number}`,
              templateData: {
                customerName: invoice!.bill_to_name || o.customer_name || "",
                invoiceNumber: invoice!.invoice_number,
                amount: fmtGBP(Number(invoice!.total_gbp)),
                service: invoice!.service_description,
              },
            },
          });
          if (error) throw error;
          if (invoice!.status === "Unpaid") {
            await supabase.from("invoices").update({ status: "Sent" }).eq("id", invoice!.id);
          }
          toast.success(`Invoice ${invoice!.invoice_number} emailed to ${to}`);
        }
      }
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Invoice action failed");
    } finally {
      setPendingId(null);
    }
  };



  const load = async () => {
    setLoading(true);
    // Pull orders + linked invoice headers using existing production tables.
    const { data: ordersData, error } = await supabase
      .from("client_orders")
      .select("*")
      .order("order_date", { ascending: false })
      .limit(500);
    if (error) {
      setLoading(false);
      toast.error(error.message || "Unable to load orders");
      return;
    }
    const ids = (ordersData || []).map((o: any) => o.id);
    let invMap = new Map<string, { invoice_number: string; status: string }>();
    if (ids.length) {
      const { data: invs } = await supabase
        .from("invoices")
        .select("order_id, invoice_number, status, created_at")
        .in("order_id", ids)
        .order("created_at", { ascending: false });
      // most recent per order
      for (const inv of invs || []) {
        if (inv.order_id && !invMap.has(inv.order_id)) {
          invMap.set(inv.order_id, { invoice_number: inv.invoice_number, status: inv.status });
        }
      }
    }
    const merged: OrderRow[] = (ordersData || []).map((o: any) => ({
      ...o,
      invoice_number: invMap.get(o.id)?.invoice_number ?? null,
      invoice_status: invMap.get(o.id)?.status ?? null,
    }));
    setOrders(merged);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const now = new Date();
    const cutoff = (() => {
      if (dateRange === "7d")  return new Date(Date.now() - 7  * 86400000);
      if (dateRange === "30d") return new Date(Date.now() - 30 * 86400000);
      if (dateRange === "90d") return new Date(Date.now() - 90 * 86400000);
      if (dateRange === "month")
        return new Date(now.getFullYear(), now.getMonth(), 1);
      return null;
    })();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (cutoff) {
        const d = new Date(o.order_date || o.created_at);
        if (d < cutoff) return false;
      }
      if (!q) return true;
      return (
        (o.order_ref || "").toLowerCase().includes(q) ||
        (o.service || "").toLowerCase().includes(q) ||
        (o.customer_name || "").toLowerCase().includes(q) ||
        (o.customer_email || "").toLowerCase().includes(q) ||
        (o.invoice_number || "").toLowerCase().includes(q)
      );
    });
  }, [orders, search, statusFilter, dateRange]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const s of STATUSES) if (s.key !== "all") c[s.key] = 0;
    for (const o of orders) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [orders]);

  const totalRevenue = useMemo(
    () => filtered.reduce((acc, o) => acc + (Number(o.amount_gbp) || 0), 0),
    [filtered]
  );
  const pendingValue = useMemo(
    () => orders.filter(o => o.status === "Pending" || o.status === "In Progress")
                .reduce((acc, o) => acc + (Number(o.amount_gbp) || 0), 0),
    [orders]
  );

  const openOrderInLegacy = (o: OrderRow) => {
    if (o.user_id) navigate(`/admin/legacy?client=${o.user_id}&tab=orders`);
    else toast.info("Guest order — open Full Admin for advanced actions");
  };
  const openInvoiceInLegacy = (o: OrderRow) => {
    if (o.user_id) navigate(`/admin/legacy?client=${o.user_id}&tab=invoices`);
    else toast.info("Guest order — open Full Admin for advanced actions");
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Orders"   value={String(orders.length)}              icon={ShoppingBag} glow="blue" />
        <StatCard label="Pending Value"  value={fmtGBP(pendingValue)}               icon={Hourglass}   glow="purple" />
        <StatCard label="Filtered Rev."  value={fmtGBP(totalRevenue)}               icon={PoundSterling} glow="green" />
        <StatCard label="Completed"      value={String(counts["Completed"] || 0)}   icon={CheckCircle2} glow="cyan" />
      </div>

      {/* Toolbar */}
      <div className="os-glass p-3 sm:p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order ref, client, service, invoice #…"
              className="w-full h-11 rounded-xl pl-10 pr-3 text-sm"
            />
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="h-11 px-3 rounded-xl text-sm os-glass bg-transparent"
          >
            {DATE_RANGES.map(d => <option key={d.key} value={d.key} className="bg-slate-900">{d.label}</option>)}
          </select>
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
        Showing <span className="text-white/80 font-semibold">{filtered.length}</span> of {orders.length} orders
      </div>

      {/* Loading */}
      {loading && orders.length === 0 && (
        <div className="os-fade-in">
          <TableSkeleton columns={7} rows={8} />
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="os-glass p-12 text-center">
          <ShoppingBag className="w-10 h-10 text-white/30 mx-auto mb-2" />
          <div className="text-sm text-white/60">
            {orders.length === 0 ? "No orders yet." : "No orders match your filters."}
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
                  <th className="py-3 px-4 font-semibold">Order</th>
                  <th className="py-3 px-4 font-semibold">Client</th>
                  <th className="py-3 px-4 font-semibold">Service</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Invoice</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => openOrderInLegacy(o)}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs text-white/80">{o.order_ref}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold truncate max-w-[180px]">{o.customer_name || "(guest)"}</div>
                      {o.customer_email && <div className="text-[11px] text-white/40 truncate max-w-[180px]">{o.customer_email}</div>}
                    </td>
                    <td className="py-3 px-4 text-white/70 truncate max-w-[200px]">{o.service}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusChip(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {o.invoice_number ? (
                        <div className="space-y-0.5">
                          <div className="font-mono text-[11px] text-white/70">{o.invoice_number}</div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${invoiceChip(o.invoice_status)}`}>
                            {o.invoice_status}
                          </span>
                        </div>
                      ) : (
                        <span className="text-white/30 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold whitespace-nowrap">{fmtGBP(Number(o.amount_gbp))}</td>
                    <td className="py-3 px-4 text-white/50 text-xs whitespace-nowrap">{fmtDate(o.order_date)}</td>
                    <td className="py-3 px-4 text-right">
                      <div
                        className="inline-flex items-center gap-1 flex-wrap justify-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {o.status === "Pending" && (
                          <button
                            disabled={pendingId === o.id}
                            onClick={() => updateStatus(o, "In Progress", "In Progress")}
                            className="px-2 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-[11px] text-blue-200 ring-1 ring-blue-400/30 inline-flex items-center gap-1 disabled:opacity-50"
                            title="Mark as In Progress (sends client email)"
                          >
                            {pendingId === o.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                            Start
                          </button>
                        )}
                        {(o.status === "In Progress" || o.status === "Delivered" || o.status === "Revision") && (
                          <button
                            disabled={pendingId === o.id}
                            onClick={() => updateStatus(o, "Completed", "Completed")}
                            className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-[11px] text-emerald-200 ring-1 ring-emerald-400/30 inline-flex items-center gap-1 disabled:opacity-50"
                            title="Mark as Completed (sends client email)"
                          >
                            {pendingId === o.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                            Complete
                          </button>
                        )}
                        {o.status !== "Completed" && o.status !== "Cancelled" && (
                          <button
                            disabled={pendingId === o.id}
                            onClick={() => {
                              if (confirm(`Cancel order ${o.order_ref}?`)) updateStatus(o, "Cancelled", "Cancelled");
                            }}
                            className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-rose-500/15 hover:text-rose-200 text-[11px] text-white/60 inline-flex items-center gap-1 disabled:opacity-50"
                            title="Cancel order"
                          >
                            <Ban className="w-3 h-3" />
                          </button>
                        )}
                        {!o.invoice_number ? (
                          <button
                            disabled={pendingId === o.id}
                            onClick={() => generateInvoiceForOrder(o, true)}
                            className="px-2 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-[11px] text-purple-200 ring-1 ring-purple-400/30 inline-flex items-center gap-1 disabled:opacity-50"
                            title="Generate invoice + email client"
                          >
                            {pendingId === o.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <FilePlus className="w-3 h-3" />} Generate
                          </button>
                        ) : (
                          <button
                            disabled={pendingId === o.id}
                            onClick={() => generateInvoiceForOrder(o, true)}
                            className="px-2 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-[11px] text-purple-200 ring-1 ring-purple-400/30 inline-flex items-center gap-1 disabled:opacity-50"
                            title="Resend invoice to client"
                          >
                            {pendingId === o.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Send
                          </button>
                        )}
                        <button
                          onClick={() => openInvoiceInLegacy(o)}
                          className="px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] text-white/70 inline-flex items-center gap-1"
                          title="Open invoices tab"
                        >
                          <FileText className="w-3 h-3" /> {o.invoice_number || "Invoice"}
                        </button>
                        <ChevronRight className="w-3.5 h-3.5 text-white/40" />
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile cards */}
      {filtered.length > 0 && (
        <div className="md:hidden space-y-3">
          {filtered.map((o) => (
            <div
              key={o.id}
              onClick={() => openOrderInLegacy(o)}
              role="button"
              tabIndex={0}
              className="os-glass p-4 w-full text-left active:scale-[0.99] transition cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[11px] text-white/60">{o.order_ref}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusChip(o.status)}`}>
                      {o.status}
                    </span>
                  </div>
                  <div className="font-semibold truncate">{o.service}</div>
                  <div className="flex items-center gap-1.5 text-xs text-white/60 mt-1 truncate">
                    <User className="w-3 h-3 shrink-0" />
                    <span className="truncate">{o.customer_name || "(guest)"}</span>
                  </div>
                  {o.customer_email && (
                    <div className="flex items-center gap-1.5 text-[11px] text-white/50 mt-0.5 truncate">
                      <Mail className="w-3 h-3 shrink-0" /><span className="truncate">{o.customer_email}</span>
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-base">{fmtGBP(Number(o.amount_gbp))}</div>
                  <div className="text-[10px] text-white/40 mt-0.5">{fmtDate(o.order_date)}</div>
                </div>
              </div>
              <div
                className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5"
                onClick={(e) => e.stopPropagation()}
              >
                {o.status === "Pending" && (
                  <button
                    disabled={pendingId === o.id}
                    onClick={() => updateStatus(o, "In Progress", "In Progress")}
                    className="flex-1 min-w-[110px] text-[11px] font-semibold rounded-lg py-2 text-center bg-blue-500/15 ring-1 ring-blue-400/30 text-blue-200 inline-flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {pendingId === o.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} Start
                  </button>
                )}
                {(o.status === "In Progress" || o.status === "Delivered" || o.status === "Revision") && (
                  <button
                    disabled={pendingId === o.id}
                    onClick={() => updateStatus(o, "Completed", "Completed")}
                    className="flex-1 min-w-[110px] text-[11px] font-semibold rounded-lg py-2 text-center bg-emerald-500/15 ring-1 ring-emerald-400/30 text-emerald-200 inline-flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {pendingId === o.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Complete
                  </button>
                )}
                <button
                  disabled={pendingId === o.id}
                  onClick={() => generateInvoiceForOrder(o, true)}
                  className="flex-1 min-w-[110px] text-[11px] font-semibold rounded-lg py-2 text-center bg-purple-500/15 ring-1 ring-purple-400/30 text-purple-200 inline-flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  {pendingId === o.id ? <Loader2 className="w-3 h-3 animate-spin" /> : (o.invoice_number ? <Send className="w-3 h-3" /> : <FilePlus className="w-3 h-3" />)}
                  {o.invoice_number ? `Send ${o.invoice_number}` : "Generate Invoice"}
                </button>
                <button
                  onClick={() => openOrderInLegacy(o)}
                  className="flex-1 min-w-[110px] text-[11px] font-medium rounded-lg py-2 text-center bg-white/[0.04] hover:bg-white/[0.08] text-white/70 inline-flex items-center justify-center gap-1"
                >
                  <ShoppingBag className="w-3 h-3" /> Manage
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
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
