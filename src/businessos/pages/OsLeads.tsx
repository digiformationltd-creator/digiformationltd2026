import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, type DragEndEvent, type DragStartEvent, useDroppable,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { PipelineSkeleton } from "../components/Skeletons";

type Stage = "new"|"contacted"|"interested"|"followup"|"converted"|"closed"|"rejected";
type Lead = {
  id: string; name: string; email?: string|null; whatsapp?: string|null;
  country?: string|null; source?: string|null; service?: string|null;
  value_gbp: number; stage: Stage; follow_up_date?: string|null; notes?: string|null;
};

const STAGES: { id: Stage; label: string; color: string }[] = [
  { id:"new",         label:"New",        color:"bg-blue-500" },
  { id:"contacted",   label:"Contacted",  color:"bg-cyan-500" },
  { id:"interested",  label:"Interested", color:"bg-purple-500" },
  { id:"followup",    label:"Follow-up",  color:"bg-amber-500" },
  { id:"converted",   label:"Converted",  color:"bg-green-500" },
  { id:"closed",      label:"Closed",     color:"bg-lime-500" },
  { id:"rejected",    label:"Rejected",   color:"bg-red-500" },
];

function LeadCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}
      className={`os-glass p-3.5 cursor-grab active:cursor-grabbing ${isDragging?"opacity-30":""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold text-sm">{lead.name}</div>
        {lead.value_gbp > 0 && <div className="mono text-xs text-green-400 font-semibold">£{lead.value_gbp}</div>}
      </div>
      {lead.service && <div className="text-xs text-white/60 mt-1">{lead.service}</div>}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {lead.country && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/60">{lead.country}</span>}
        {lead.source && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300">{lead.source}</span>}
        {lead.follow_up_date && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 mono">{lead.follow_up_date}</span>}
      </div>
    </div>
  );
}

function Column({ stage, leads }: { stage: typeof STAGES[number]; leads: Lead[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const total = leads.reduce((s,l)=>s+Number(l.value_gbp||0),0);
  return (
    <div ref={setNodeRef}
      className={`os-glass p-3 w-[280px] shrink-0 flex flex-col ${isOver?"ring-2 ring-blue-400/40":""}`}>
      <div className="flex items-center justify-between px-1 mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${stage.color}`} />
          <div className="font-semibold text-sm">{stage.label}</div>
          <span className="text-xs text-white/40 mono">{leads.length}</span>
        </div>
        {total > 0 && <div className="text-[11px] mono text-white/50">£{total.toLocaleString()}</div>}
      </div>
      <div className="space-y-2 flex-1 min-h-[100px]">
        {leads.map(l => <LeadCard key={l.id} lead={l} />)}
        {leads.length===0 && <div className="text-xs text-white/30 text-center py-6">Drop leads here</div>}
      </div>
    </div>
  );
}

export default function OsLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string|null>(null);
  const [params, setParams] = useSearchParams();
  const [showNew, setShowNew] = useState(params.get("new") === "1");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = async () => {
    const { data, error } = await supabase.from("leads").select("*").order("created_at",{ascending:false});
    if (error) { toast.error(error.message); setLoading(false); return; }
    setLeads((data || []) as Lead[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const byStage = useMemo(() => {
    const map: Record<Stage, Lead[]> = { new:[], contacted:[], interested:[], followup:[], converted:[], closed:[], rejected:[] };
    leads.forEach(l => map[l.stage].push(l));
    return map;
  }, [leads]);

  const active = leads.find(l => l.id === activeId);

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const id = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;
    const lead = leads.find(l => l.id === id);
    if (!lead || lead.stage === overId) return;
    const prev = leads;
    setLeads(ls => ls.map(l => l.id === id ? { ...l, stage: overId as Stage } : l));
    const { error } = await supabase.from("leads").update({ stage: overId as Stage }).eq("id", id);
    if (error) { setLeads(prev); toast.error(error.message); return; }
    toast.success(`Moved ${lead.name} → ${STAGES.find(s=>s.id===overId)?.label}`);
    await supabase.from("lead_activities").insert({
      lead_id: id, activity_type: "stage_change",
      description: `${lead.stage} → ${overId}`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/50">Pipeline · {leads.length} leads · drag cards across stages</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="h-10 px-4 rounded-xl text-sm font-semibold flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <Plus className="w-4 h-4" /> Add Lead
        </button>
      </div>

      {loading && leads.length === 0 ? (
        <div className="os-fade-in"><PipelineSkeleton columns={STAGES.length} /></div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners}
          onDragStart={(e: DragStartEvent)=>setActiveId(String(e.active.id))}
          onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 os-fade-in">
            {STAGES.map(s => <Column key={s.id} stage={s} leads={byStage[s.id]} />)}
          </div>
          <DragOverlay>{active ? <div className="w-[256px]"><LeadCard lead={active} /></div> : null}</DragOverlay>
        </DndContext>
      )}

      {showNew && <NewLeadModal onClose={() => { setShowNew(false); params.delete("new"); setParams(params); }} onCreated={load} />}
    </div>
  );
}

function NewLeadModal({ onClose, onCreated }: { onClose: ()=>void; onCreated: ()=>void }) {
  const [f, setF] = useState({ name:"", email:"", whatsapp:"", country:"", source:"", service:"", value_gbp:"", follow_up_date:"", notes:"" });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!f.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    const payload: any = { ...f, value_gbp: Number(f.value_gbp||0) };
    if (!payload.follow_up_date) delete payload.follow_up_date;
    Object.keys(payload).forEach(k => { if (payload[k] === "") payload[k] = null; });
    const { error } = await supabase.from("leads").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Lead added");
    onCreated(); onClose();
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
      <div className="os-glass-strong w-full max-w-lg p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">New Lead</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/5 grid place-items-center"><X className="w-4 h-4"/></button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Name *"><input value={f.name} onChange={e=>setF({...f,name:e.target.value})} className="w-full h-10 rounded-lg px-3"/></Field>
          <Field label="Email"><input value={f.email} onChange={e=>setF({...f,email:e.target.value})} className="w-full h-10 rounded-lg px-3"/></Field>
          <Field label="WhatsApp"><input value={f.whatsapp} onChange={e=>setF({...f,whatsapp:e.target.value})} className="w-full h-10 rounded-lg px-3"/></Field>
          <Field label="Country"><input value={f.country} onChange={e=>setF({...f,country:e.target.value})} className="w-full h-10 rounded-lg px-3"/></Field>
          <Field label="Source"><input placeholder="Google, Referral…" value={f.source} onChange={e=>setF({...f,source:e.target.value})} className="w-full h-10 rounded-lg px-3"/></Field>
          <Field label="Service"><input value={f.service} onChange={e=>setF({...f,service:e.target.value})} className="w-full h-10 rounded-lg px-3"/></Field>
          <Field label="Value (£)"><input type="number" value={f.value_gbp} onChange={e=>setF({...f,value_gbp:e.target.value})} className="w-full h-10 rounded-lg px-3 mono"/></Field>
          <Field label="Follow-up date"><input type="date" value={f.follow_up_date} onChange={e=>setF({...f,follow_up_date:e.target.value})} className="w-full h-10 rounded-lg px-3"/></Field>
          <div className="col-span-2">
            <Field label="Notes"><textarea rows={3} value={f.notes} onChange={e=>setF({...f,notes:e.target.value})} className="w-full rounded-lg p-3"/></Field>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="h-10 px-4 rounded-xl text-sm border border-white/10 hover:bg-white/5">Cancel</button>
          <button disabled={saving} onClick={submit} className="h-10 px-5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white disabled:opacity-50">
            {saving ? "Saving…" : "Create Lead"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block">
    <span className="text-xs text-white/50 mb-1.5 block">{label}</span>
    {children}
  </label>;
}
