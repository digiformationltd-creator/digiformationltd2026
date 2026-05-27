import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

type Service = {
  id: string; name: string; slug: string|null; category: string|null;
  description: string|null; price_gbp: number; is_active: boolean; display_order: number;
};

export default function OsServices() {
  const [items, setItems] = useState<Service[]>([]);
  const [editing, setEditing] = useState<Partial<Service>|null>(null);

  const load = async () => {
    const { data, error } = await supabase.from("services").select("*").order("display_order");
    if (error) toast.error(error.message);
    setItems((data || []) as Service[]);
  };
  useEffect(()=>{ load(); },[]);

  const save = async () => {
    if (!editing) return;
    const payload: any = { ...editing, price_gbp: Number(editing.price_gbp||0), display_order: Number(editing.display_order||0) };
    let res;
    if (editing.id) res = await supabase.from("services").update(payload).eq("id", editing.id);
    else res = await supabase.from("services").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(editing.id ? "Updated" : "Created");
    setEditing(null); load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };
  const toggle = async (s: Service) => {
    await supabase.from("services").update({ is_active: !s.is_active }).eq("id", s.id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/50">{items.length} services in catalog</p>
        <button onClick={()=>setEditing({ name:"", category:"", price_gbp:0, is_active:true, display_order: items.length+1 })}
          className="h-10 px-4 rounded-xl text-sm font-semibold flex items-center gap-2 bg-gradient-to-r from-amber-500 to-pink-500 text-white">
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(s => (
          <div key={s.id} className="os-glass os-glow-amber p-5 flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold">{s.name}</div>
                {s.category && <div className="text-[11px] uppercase tracking-wider text-white/40 mt-0.5">{s.category}</div>}
              </div>
              <div className="mono text-lg font-bold text-amber-400">£{Number(s.price_gbp).toLocaleString()}</div>
            </div>
            {s.description && <p className="text-xs text-white/60 mt-2 line-clamp-2">{s.description}</p>}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
              <button onClick={()=>toggle(s)}
                className={`text-[11px] px-2 py-1 rounded-full ${s.is_active?"bg-green-500/15 text-green-400":"bg-white/5 text-white/40"}`}>
                {s.is_active ? "Active" : "Inactive"}
              </button>
              <div className="flex gap-1">
                <button onClick={()=>setEditing(s)} className="w-8 h-8 rounded-lg hover:bg-white/5 grid place-items-center"><Pencil className="w-3.5 h-3.5"/></button>
                <button onClick={()=>remove(s.id)} className="w-8 h-8 rounded-lg hover:bg-red-500/10 hover:text-red-400 grid place-items-center"><Trash2 className="w-3.5 h-3.5"/></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
          <div className="os-glass-strong w-full max-w-lg p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">{editing.id ? "Edit Service" : "New Service"}</h3>
              <button onClick={()=>setEditing(null)} className="w-8 h-8 rounded-lg hover:bg-white/5 grid place-items-center"><X className="w-4 h-4"/></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="col-span-2"><span className="text-xs text-white/50 mb-1.5 block">Name</span>
                <input value={editing.name||""} onChange={e=>setEditing({...editing,name:e.target.value})} className="w-full h-10 rounded-lg px-3"/></label>
              <label><span className="text-xs text-white/50 mb-1.5 block">Category</span>
                <input value={editing.category||""} onChange={e=>setEditing({...editing,category:e.target.value})} className="w-full h-10 rounded-lg px-3"/></label>
              <label><span className="text-xs text-white/50 mb-1.5 block">Price £</span>
                <input type="number" value={editing.price_gbp||0} onChange={e=>setEditing({...editing,price_gbp:Number(e.target.value)})} className="w-full h-10 rounded-lg px-3 mono"/></label>
              <label className="col-span-2"><span className="text-xs text-white/50 mb-1.5 block">Slug</span>
                <input value={editing.slug||""} onChange={e=>setEditing({...editing,slug:e.target.value})} className="w-full h-10 rounded-lg px-3 mono"/></label>
              <label className="col-span-2"><span className="text-xs text-white/50 mb-1.5 block">Description</span>
                <textarea rows={3} value={editing.description||""} onChange={e=>setEditing({...editing,description:e.target.value})} className="w-full rounded-lg p-3"/></label>
              <label><span className="text-xs text-white/50 mb-1.5 block">Display order</span>
                <input type="number" value={editing.display_order||0} onChange={e=>setEditing({...editing,display_order:Number(e.target.value)})} className="w-full h-10 rounded-lg px-3 mono"/></label>
              <label className="flex items-end gap-2 pb-2">
                <input type="checkbox" checked={!!editing.is_active} onChange={e=>setEditing({...editing,is_active:e.target.checked})}/>
                <span className="text-sm">Active</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={()=>setEditing(null)} className="h-10 px-4 rounded-xl text-sm border border-white/10 hover:bg-white/5">Cancel</button>
              <button onClick={save} className="h-10 px-5 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-500 to-pink-500 text-white">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
