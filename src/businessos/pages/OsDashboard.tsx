import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  TrendingUp, ShoppingBag, Clock, Users, UserPlus, MailOpen, FileWarning, BadgePoundSterling,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

type Glow = "blue"|"purple"|"green"|"amber"|"red"|"cyan"|"pink"|"lime";
type Kpi = { label: string; value: string; sub?: string; icon: any; glow: Glow };

function KpiCard({ k }: { k: Kpi }) {
  const Icon = k.icon;
  return (
    <div className={`os-glass os-glow-${k.glow} p-5`}>
      <div className="flex items-start justify-between">
        <div className="text-xs uppercase tracking-wider text-white/50 font-semibold">{k.label}</div>
        <div className={`w-9 h-9 rounded-lg grid place-items-center bg-${k.glow}-500/10 text-${k.glow}-400`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-bold mono">{k.value}</div>
      {k.sub && <div className="text-xs text-white/40 mt-1">{k.sub}</div>}
    </div>
  );
}

const PIE_COLORS = ["#7a8aa3","#5b6b85","#6c8a7b","#a89770","#8a7d9b","#728da0"];

export default function OsDashboard() {
  const [kpi, setKpi] = useState<Kpi[]>([]);
  const [revenue, setRevenue] = useState<{m:string;v:number}[]>([]);
  const [sources, setSources] = useState<{name:string;value:number}[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [followups, setFollowups] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();

      const [orders, leads, invoices] = await Promise.all([
        supabase.from("client_orders").select("amount_gbp,status,created_at,service,order_ref,customer_name").order("created_at",{ascending:false}).limit(500),
        supabase.from("leads").select("source,stage,follow_up_date,name,whatsapp,service,created_at").order("created_at",{ascending:false}).limit(500),
        supabase.from("invoices").select("total_gbp,status,issue_date,created_at,bill_to_name,invoice_number").order("created_at",{ascending:false}).limit(500),
      ]);

      const o = orders.data || [];
      const l = leads.data || [];
      const inv = invoices.data || [];

      const monthRev = inv.filter(i => i.status === "Paid" && i.created_at >= monthStart)
        .reduce((s,i)=>s+Number(i.total_gbp||0),0);
      const yearRev = inv.filter(i => i.status === "Paid" && i.created_at >= yearStart)
        .reduce((s,i)=>s+Number(i.total_gbp||0),0);
      const completed = o.filter(x => x.status === "Completed").length;
      const pending = o.filter(x => ["Pending","In Progress","Processing"].includes(x.status)).length;
      const activeClients = new Set(o.map(x=>x.customer_name).filter(Boolean)).size;
      const newLeads = l.filter(x => x.created_at >= monthStart).length;
      const unpaid = inv.filter(i => i.status !== "Paid").length;

      setKpi([
        { label:"Monthly Revenue", value:`£${monthRev.toLocaleString()}`, icon:TrendingUp, glow:"blue", sub:"This month, paid invoices" },
        { label:"Completed Orders", value:String(completed), icon:ShoppingBag, glow:"green" },
        { label:"Pending Orders", value:String(pending), icon:Clock, glow:"amber" },
        { label:"Active Clients", value:String(activeClients), icon:Users, glow:"cyan" },
        { label:"New Leads", value:String(newLeads), icon:UserPlus, glow:"purple", sub:"This month" },
        { label:"Email Open Rate", value:"—", icon:MailOpen, glow:"pink", sub:"Connect campaigns" },
        { label:"Unpaid Invoices", value:String(unpaid), icon:FileWarning, glow:"red" },
        { label:"Annual Revenue", value:`£${yearRev.toLocaleString()}`, icon:BadgePoundSterling, glow:"lime" },
      ]);

      // revenue by month (last 8 months)
      const months: {m:string;v:number}[] = [];
      for (let i=7;i>=0;i--){
        const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
        const next = new Date(now.getFullYear(), now.getMonth()-i+1, 1);
        const v = inv.filter(x => x.status === "Paid" && x.created_at >= d.toISOString() && x.created_at < next.toISOString())
          .reduce((s,x)=>s+Number(x.total_gbp||0),0);
        months.push({ m: d.toLocaleString("en",{month:"short"}), v });
      }
      setRevenue(months);

      // lead sources pie
      const sourceMap: Record<string,number> = {};
      l.forEach(x => { const k = x.source || "Direct"; sourceMap[k] = (sourceMap[k]||0)+1; });
      setSources(Object.entries(sourceMap).map(([name,value])=>({name,value:value as number})));

      setPayments(inv.filter(i=>i.status==="Paid").slice(0,5));
      setFollowups(l.filter(x=>x.follow_up_date).slice(0,6));
      setActivity([
        ...o.slice(0,4).map(x=>({type:"order",text:`New order ${x.order_ref} — ${x.service}`,at:x.created_at})),
        ...l.slice(0,4).map(x=>({type:"lead",text:`Lead: ${x.name} interested in ${x.service||"a service"}`,at:x.created_at})),
      ].sort((a,b)=> (b.at||"").localeCompare(a.at||"")).slice(0,8));
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpi.map((k,i) => <KpiCard key={i} k={k} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="os-glass os-glow-blue p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Revenue · Last 8 months</h3>
            <span className="text-xs text-white/40">Paid invoices</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue}>
                <XAxis dataKey="m" stroke="rgba(255,255,255,.4)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,.4)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{background:"#0f172a",border:"1px solid rgba(255,255,255,.1)",borderRadius:12}} />
                <Bar dataKey="v" fill="url(#g1)" radius={[8,8,0,0]} />
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(215 22% 60%)" />
                    <stop offset="100%" stopColor="hsl(222 18% 38%)" />

                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="os-glass os-glow-purple p-5">
          <h3 className="font-semibold mb-4">Lead Sources</h3>
          <div className="h-64">
            {sources.length === 0 ? (
              <div className="h-full grid place-items-center text-white/40 text-sm">No leads yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sources} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                    {sources.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{background:"#0f172a",border:"1px solid rgba(255,255,255,.1)",borderRadius:12}} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="os-glass os-glow-green p-5">
          <h3 className="font-semibold mb-4">Recent Payments</h3>
          <div className="space-y-2.5">
            {payments.length === 0 && <div className="text-white/40 text-sm">No payments yet</div>}
            {payments.map((p,i)=>(
              <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-white/5 last:border-0">
                <div>
                  <div className="font-medium">{p.bill_to_name || "—"}</div>
                  <div className="text-xs text-white/40 mono">{p.invoice_number}</div>
                </div>
                <div className="mono font-semibold text-green-400">£{Number(p.total_gbp||0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="os-glass os-glow-cyan p-5">
          <h3 className="font-semibold mb-4">Activity</h3>
          <div className="space-y-3">
            {activity.length === 0 && <div className="text-white/40 text-sm">Nothing yet</div>}
            {activity.map((a,i)=>(
              <div key={i} className="flex gap-3 text-sm">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${a.type==="order"?"bg-green-400":"bg-purple-400"}`} />
                <div className="flex-1">
                  <div>{a.text}</div>
                  <div className="text-[11px] text-white/40">{a.at ? new Date(a.at).toLocaleString() : ""}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="os-glass os-glow-amber p-5">
          <h3 className="font-semibold mb-4">Follow-ups</h3>
          <div className="space-y-2">
            {followups.length === 0 && <div className="text-white/40 text-sm">No follow-ups scheduled</div>}
            {followups.map((f,i)=>(
              <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-white/5 last:border-0">
                <div>
                  <div className="font-medium">{f.name}</div>
                  <div className="text-xs text-white/40">{f.service || "—"}</div>
                </div>
                <div className="text-xs mono text-amber-400">{f.follow_up_date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
