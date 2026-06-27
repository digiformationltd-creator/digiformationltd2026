import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Save, Trash2, Loader2, CalendarClock, AlertTriangle, Sparkles } from "lucide-react";
import { analyzePending, commandCenterUrl } from "@/businessos/lib/pendingCompany";

type Status = "available" | "reserved" | "sold_out" | "unavailable";

export default function OsManagedCompanyDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [row, setRow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reminders, setReminders] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("managed_companies").select("*").eq("id", id).maybeSingle();
      setRow(data);
      const { data: rem } = await supabase
        .from("email_reminder_log")
        .select("*")
        .eq("target_type", "managed_company")
        .eq("target_id", id)
        .order("sent_at", { ascending: false });
      setReminders(rem || []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  if (!row) return <div className="p-12 text-center text-zinc-500">Not found</div>;

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("managed_companies").update({
      company_name: row.company_name,
      company_number: row.company_number || null,
      incorporation_date: row.incorporation_date || null,
      sic_code: row.sic_code || null,
      registered_address: row.registered_address || null,
      confirmation_due: row.confirmation_due || null,
      accounts_filing_due: row.accounts_filing_due || null,
      address_expire: row.address_expire || null,
      status: row.status,
      notes: row.notes || null,
    }).eq("id", id!);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  const del = async () => {
    if (!confirm("Delete this company permanently?")) return;
    const { error } = await supabase.from("managed_companies").delete().eq("id", id!);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); nav("/admin/managed-companies"); }
  };

  const isExcluded = row.status === "sold_out" || row.status === "unavailable";

  return (
    <div className="space-y-6 max-w-4xl">
      <Link to="/admin/managed-companies" className="text-sm text-zinc-400 hover:text-zinc-200 flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Back to companies
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{row.company_name}</h1>
          {row.company_number && <div className="text-sm text-zinc-500 font-mono">CRN {row.company_number}</div>}
        </div>
        <div className="flex gap-2">
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold flex items-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </button>
          <button onClick={del} className="px-3 py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-sm flex items-center gap-2 border border-rose-600/40">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {isExcluded && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> This company is excluded from automatic reminder monitoring.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-6">
        <Field label="Company Name" value={row.company_name} onChange={v => setRow({...row, company_name: v})} />
        <Field label="Company Number" value={row.company_number} onChange={v => setRow({...row, company_number: v})} />
        <Field label="Incorporation Date" type="date" value={row.incorporation_date} onChange={v => setRow({...row, incorporation_date: v})} />
        <Field label="SIC Code" value={row.sic_code} onChange={v => setRow({...row, sic_code: v})} />
        <Field label="Confirmation Statement Due" type="date" value={row.confirmation_due} onChange={v => setRow({...row, confirmation_due: v})} />
        <Field label="Annual Accounts Due" type="date" value={row.accounts_filing_due} onChange={v => setRow({...row, accounts_filing_due: v})} />
        <Field label="Registered Address Expiry" type="date" value={row.address_expire} onChange={v => setRow({...row, address_expire: v})} />
        <div>
          <label className="text-xs uppercase tracking-wider text-zinc-500">Status</label>
          <select value={row.status} onChange={e => setRow({...row, status: e.target.value as Status})}
            className="w-full mt-1 px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-sm">
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="sold_out">Sold Out</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <Field label="Registered Address" value={row.registered_address} onChange={v => setRow({...row, registered_address: v})} multiline />
        </div>
        <div className="md:col-span-2">
          <Field label="Notes" value={row.notes} onChange={v => setRow({...row, notes: v})} multiline />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-6">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><CalendarClock className="w-4 h-4 text-cyan-300" /> Reminder History</h2>
        {reminders.length === 0 ? (
          <div className="text-sm text-zinc-500">No reminders sent yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-zinc-500 uppercase">
              <tr><th className="text-left py-2">Type</th><th className="text-left py-2">Stage</th><th className="text-left py-2">Due</th><th className="text-left py-2">Sent</th><th className="text-left py-2">To</th></tr>
            </thead>
            <tbody>
              {reminders.map((r, i) => (
                <tr key={i} className="border-t border-zinc-900">
                  <td className="py-2">{r.reminder_type}</td>
                  <td className="py-2">Stage {r.stage}</td>
                  <td className="py-2">{r.due_date}</td>
                  <td className="py-2">{new Date(r.sent_at).toLocaleString()}</td>
                  <td className="py-2 text-xs text-zinc-400">{r.recipient_email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", multiline = false }: any) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-zinc-500">{label}</label>
      {multiline ? (
        <textarea value={value || ""} onChange={e => onChange(e.target.value)} rows={3}
          className="w-full mt-1 px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-sm" />
      ) : (
        <input type={type} value={value || ""} onChange={e => onChange(e.target.value)}
          className="w-full mt-1 px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-sm" />
      )}
    </div>
  );
}
