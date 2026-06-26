// Email Marketing — Phase 1 UI scaffold (mock data only).
// Central Lead Generation & Email Campaign Center.
// No backend, no AI, no email sending, no third-party integrations.

import { useState } from "react";
import {
  Mail, Users, Send, Inbox, CheckCircle2, Clock, Search, Filter,
  Sparkles, FileText, Activity, BarChart3, Compass, ListChecks,
  Megaphone, ShieldCheck, ChevronRight, Eye, Check, X, Globe,
  TrendingUp, TrendingDown, Minus, Cpu, Zap,
} from "lucide-react";

type Tab =
  | "overview" | "discovery" | "review" | "campaigns"
  | "templates" | "queue" | "logs" | "analytics";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "overview",   label: "Overview",   icon: BarChart3 },
  { id: "discovery",  label: "Lead Discovery", icon: Compass },
  { id: "review",     label: "Lead Review",    icon: ListChecks },
  { id: "campaigns",  label: "Campaigns",  icon: Megaphone },
  { id: "templates",  label: "Templates",  icon: FileText },
  { id: "queue",      label: "Queue",      icon: Clock },
  { id: "logs",       label: "Logs",       icon: Activity },
  { id: "analytics",  label: "Analytics",  icon: TrendingUp },
];

export default function OsEmailMarketing() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="space-y-6 os-fade-in">
      {/* Header */}
      <div className="os-glass p-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-12 h-12 rounded-2xl grid place-items-center bg-pink-500/10 text-pink-300">
            <Mail className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-[240px]">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold">Email Marketing</h2>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-200 border border-pink-400/20">
                Lead Generation Center
              </span>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10">
                Phase 1 · UI
              </span>
            </div>
            <p className="text-sm text-white/50 mt-1 max-w-2xl">
              Central lead generation and outbound campaign system. Discover prospects, review quality, queue campaigns, and track every send across Business OS. Backend wiring lands in later phases.
            </p>
          </div>
        </div>

        {/* Tab strip */}
        <div className="mt-5 flex gap-1.5 flex-wrap">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition border ${
                  active
                    ? "bg-pink-500/15 border-pink-400/30 text-pink-100"
                    : "bg-white/5 border-white/10 text-white/60 hover:text-white/90 hover:bg-white/10"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "overview"   && <Overview />}
      {tab === "discovery"  && <Discovery />}
      {tab === "review"     && <Review />}
      {tab === "campaigns"  && <Campaigns />}
      {tab === "templates"  && <Templates />}
      {tab === "queue"      && <Queue />}
      {tab === "logs"       && <Logs />}
      {tab === "analytics"  && <Analytics />}

      <FutureReady />
    </div>
  );
}

/* ------------------------------ 1. OVERVIEW ----------------------------- */

const KPIS = [
  { label: "Total Leads",      value: "12,486", delta: "+438",  trend: "up",   tint: "cyan",    icon: Users },
  { label: "New Leads",        value: "327",    delta: "+62",   trend: "up",   tint: "emerald", icon: Sparkles },
  { label: "Active Campaigns", value: "5",      delta: "+1",    trend: "up",   tint: "pink",    icon: Megaphone },
  { label: "Emails Sent",      value: "8,914",  delta: "+1,204",trend: "up",   tint: "indigo",  icon: Send },
  { label: "Replies Received", value: "412",    delta: "+27",   trend: "up",   tint: "gold",    icon: Inbox },
  { label: "Pending Approval", value: "89",     delta: "-12",   trend: "down", tint: "purple",  icon: ShieldCheck },
];

const TINT: Record<string, string> = {
  cyan:    "bg-cyan-500/10 text-cyan-300",
  emerald: "bg-emerald-500/10 text-emerald-300",
  pink:    "bg-pink-500/10 text-pink-300",
  indigo:  "bg-indigo-500/10 text-indigo-300",
  gold:    "bg-amber-500/10 text-amber-300",
  purple:  "bg-purple-500/10 text-purple-300",
  mustard: "bg-yellow-500/10 text-yellow-300",
};

function TrendBadge({ trend, delta }: { trend: string; delta: string }) {
  const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const tone = trend === "up" ? "text-emerald-300" : trend === "down" ? "text-red-300" : "text-white/40";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] ${tone}`}>
      <Icon className="w-3 h-3" /> {delta}
    </span>
  );
}

function Overview() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {KPIS.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="os-glass p-4">
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl grid place-items-center ${TINT[k.tint]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <TrendBadge trend={k.trend} delta={k.delta} />
              </div>
              <div className="mt-3 text-2xl font-bold">{k.value}</div>
              <div className="text-xs text-white/50">{k.label}</div>
            </div>
          );
        })}
      </div>

      {/* Snapshot strip */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="os-glass p-5">
          <div className="text-xs uppercase tracking-wider text-white/40">Approval Queue</div>
          <div className="text-2xl font-bold mt-1">89 leads</div>
          <p className="text-xs text-white/50 mt-1">Awaiting human review before next campaign batch.</p>
        </div>
        <div className="os-glass p-5">
          <div className="text-xs uppercase tracking-wider text-white/40">Next Scheduled Campaign</div>
          <div className="text-2xl font-bold mt-1">UK Formation · Wave 3</div>
          <p className="text-xs text-white/50 mt-1">Mon 09:00 UTC · 240 recipients · template v1.4</p>
        </div>
        <div className="os-glass p-5">
          <div className="text-xs uppercase tracking-wider text-white/40">Best Performer (30d)</div>
          <div className="text-2xl font-bold mt-1">Website Proposal</div>
          <p className="text-xs text-white/50 mt-1">38% open · 12% reply across 1,840 sends.</p>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- 2. LEAD DISCOVERY -------------------------- */

const DIGITAL = [
  { name: "Digital Marketing Agencies", est: 1240, last: "2h ago",  status: "ready" },
  { name: "SEO Agencies",               est: 860,  last: "2h ago",  status: "ready" },
  { name: "Google Ads Agencies",        est: 540,  last: "Today",   status: "ready" },
  { name: "Web Design Companies",       est: 1880, last: "5h ago",  status: "ready" },
  { name: "Software Companies",         est: 2310, last: "Yesterday", status: "scanning" },
  { name: "Freelancers",                est: 4120, last: "3 days ago", status: "idle" },
];

const PHYSICAL = [
  { name: "Restaurants",   est: 3210, last: "Today",      status: "ready" },
  { name: "Dental Clinics",est: 980,  last: "Today",      status: "ready" },
  { name: "Medical Clinics",est: 1140,last: "Yesterday",  status: "ready" },
  { name: "Law Firms",     est: 720,  last: "2 days ago", status: "idle" },
  { name: "Accountants",   est: 1430, last: "Today",      status: "ready" },
  { name: "Architects",    est: 410,  last: "3 days ago", status: "idle" },
  { name: "Gyms",          est: 690,  last: "Today",      status: "ready" },
  { name: "Salons",        est: 1520, last: "Yesterday",  status: "ready" },
  { name: "Hotels",        est: 880,  last: "Today",      status: "scanning" },
  { name: "Real Estate",   est: 2110, last: "Today",      status: "ready" },
  { name: "Car Dealers",   est: 760,  last: "2 days ago", status: "idle" },
];

const SCAN_TINT: Record<string, string> = {
  ready:    "bg-emerald-500/10 text-emerald-300 border-emerald-400/20",
  scanning: "bg-cyan-500/10 text-cyan-300 border-cyan-400/20",
  idle:     "bg-white/5 text-white/50 border-white/10",
};

function CategoryGrid({ title, items }: { title: string; items: typeof DIGITAL }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/80">{title}</h3>
        <span className="text-xs text-white/40">{items.length} categories</span>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((c) => (
          <div key={c.name} className="os-glass p-4 hover:bg-white/5 transition">
            <div className="flex items-start justify-between gap-2">
              <div className="font-medium text-sm">{c.name}</div>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${SCAN_TINT[c.status]}`}>
                {c.status}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-white/40">Estimated Leads</div>
                <div className="font-semibold text-white/90">{c.est.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-white/40">Last Scan</div>
                <div className="font-semibold text-white/90">{c.last}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Discovery() {
  return (
    <div className="space-y-6">
      <div className="os-glass p-5 flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl grid place-items-center ${TINT.cyan}`}>
          <Compass className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="font-semibold">Lead Discovery</div>
          <p className="text-xs text-white/50 mt-0.5">
            Categories the discovery engine will scan once connected. Scan runs are queued by an admin operator and reviewed before any outreach.
          </p>
        </div>
        <button disabled className="px-3 py-1.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white/40 cursor-not-allowed">
          Run Scan · Soon
        </button>
      </div>
      <CategoryGrid title="Digital Businesses" items={DIGITAL} />
      <CategoryGrid title="Physical Businesses" items={PHYSICAL} />
    </div>
  );
}

/* ----------------------------- 3. LEAD REVIEW --------------------------- */

const LEADS = [
  { company: "Aurora Web Studio",   web: "aurorawebstudio.co.uk",  email: "hello@aurorawebstudio.co.uk", category: "Web Design",      score: 92, status: "pending" },
  { company: "Northwind Dental",    web: "northwinddental.co.uk",  email: "info@northwinddental.co.uk",  category: "Dental Clinics",  score: 88, status: "pending" },
  { company: "Pixel & Pine SEO",    web: "pixelandpine.io",        email: "team@pixelandpine.io",        category: "SEO Agencies",    score: 81, status: "pending" },
  { company: "Bramley Law",         web: "bramleylaw.uk",          email: "contact@bramleylaw.uk",       category: "Law Firms",       score: 76, status: "approved" },
  { company: "Quokka Kitchen",      web: "quokka-kitchen.com",     email: "manager@quokka-kitchen.com",  category: "Restaurants",     score: 64, status: "pending" },
  { company: "Vertex Software",     web: "vertexsoftware.dev",     email: "sales@vertexsoftware.dev",    category: "Software",        score: 95, status: "approved" },
  { company: "Highland Salon Co",   web: "highlandsalon.co.uk",    email: "bookings@highlandsalon.co.uk",category: "Salons",          score: 58, status: "rejected" },
  { company: "Cobalt Marketing",    web: "cobaltmarketing.io",     email: "hi@cobaltmarketing.io",       category: "Digital Marketing", score: 89, status: "pending" },
];

const LEAD_STATUS: Record<string, string> = {
  pending:  "bg-amber-500/10 text-amber-300",
  approved: "bg-emerald-500/10 text-emerald-300",
  rejected: "bg-red-500/10 text-red-300",
};

function Review() {
  return (
    <div className="space-y-4">
      <div className="os-glass p-3 flex gap-2 flex-wrap items-center">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-white/40" />
          <input
            placeholder="Search company, email, category…"
            className="bg-transparent text-sm outline-none flex-1 placeholder:text-white/30"
          />
        </div>
        <button className="px-3 py-1.5 rounded-lg text-sm bg-white/5 border border-white/10 inline-flex items-center gap-2">
          <Filter className="w-3.5 h-3.5" /> Filters
        </button>
        <span className="text-xs text-white/40 px-2">{LEADS.length} results</span>
      </div>

      <div className="os-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-white/50 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Company</th>
                <th className="text-left px-4 py-3">Website</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Quality</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {LEADS.map((l) => (
                <tr key={l.email} className="border-t border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-medium">{l.company}</td>
                  <td className="px-4 py-3 text-white/60">
                    <span className="inline-flex items-center gap-1"><Globe className="w-3 h-3" />{l.web}</span>
                  </td>
                  <td className="px-4 py-3 text-white/60">{l.email}</td>
                  <td className="px-4 py-3 text-white/60">{l.category}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${l.score >= 85 ? "text-emerald-300" : l.score >= 70 ? "text-cyan-300" : "text-amber-300"}`}>
                      {l.score}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${LEAD_STATUS[l.status]}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <button className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 grid place-items-center" title="Approve">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button className="w-7 h-7 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20 grid place-items-center" title="Reject">
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <button className="w-7 h-7 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 grid place-items-center" title="View">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- 4. CAMPAIGNS ------------------------------- */

const CAMPAIGNS = [
  { name: "Website Development Push", service: "Website Development",   audience: "Restaurants · 320",   status: "running",   date: "Mon 09:00 UTC", progress: 64 },
  { name: "UK Formation Wave 3",      service: "UK Company Formation",  audience: "Freelancers · 240",   status: "scheduled", date: "Wed 09:00 UTC", progress: 0  },
  { name: "Banking Outreach",         service: "Business Bank Accounts",audience: "Software Cos · 180",  status: "draft",     date: "—",             progress: 0  },
  { name: "SEO Cold Wave",            service: "SEO Services",          audience: "Dental Clinics · 410",status: "running",   date: "Daily · 11:00", progress: 38 },
  { name: "Digital Marketing Intro",  service: "Digital Marketing",     audience: "Hotels · 150",        status: "paused",    date: "—",             progress: 22 },
];

const CAMP_STATUS: Record<string, string> = {
  running:   "bg-emerald-500/10 text-emerald-300",
  scheduled: "bg-cyan-500/10 text-cyan-300",
  draft:     "bg-white/5 text-white/60",
  paused:    "bg-amber-500/10 text-amber-300",
};

function Campaigns() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-white/60">{CAMPAIGNS.length} campaigns</div>
        <button disabled className="px-3 py-1.5 rounded-lg text-sm bg-white/5 border border-white/10 text-white/40 cursor-not-allowed">
          New Campaign · Soon
        </button>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {CAMPAIGNS.map((c) => (
          <div key={c.name} className="os-glass p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs text-white/50 mt-0.5">{c.service}</div>
              </div>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${CAMP_STATUS[c.status]}`}>
                {c.status}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-white/40">Audience</div>
                <div className="text-white/90">{c.audience}</div>
              </div>
              <div>
                <div className="text-white/40">Scheduled</div>
                <div className="text-white/90">{c.date}</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-white/40">Progress</span>
                <span className="text-white/70">{c.progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-pink-400/70" style={{ width: `${c.progress}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------- 5. EMAIL TEMPLATES ------------------------ */

const TEMPLATES = [
  { name: "Website Proposal · Long Form", category: "Website Proposal",    updated: "2d ago", version: "v1.4", status: "active" },
  { name: "Website Proposal · Short",     category: "Website Proposal",    updated: "1w ago", version: "v1.1", status: "active" },
  { name: "UK LTD Formation Intro",       category: "Company Formation",   updated: "3d ago", version: "v2.0", status: "active" },
  { name: "US LLC Formation Intro",       category: "Company Formation",   updated: "5d ago", version: "v1.2", status: "draft"  },
  { name: "Stripe / Wise Setup Offer",    category: "Bank Account",        updated: "1w ago", version: "v1.0", status: "active" },
  { name: "SEO Audit Pitch",              category: "SEO",                 updated: "4d ago", version: "v1.3", status: "active" },
  { name: "Follow-up · No Reply (3d)",    category: "Follow-up",           updated: "2d ago", version: "v1.5", status: "active" },
  { name: "Follow-up · Soft Close",       category: "Follow-up",           updated: "1w ago", version: "v1.1", status: "draft"  },
  { name: "General Introduction",         category: "General Introduction",updated: "2w ago", version: "v1.0", status: "active" },
];

const TPL_STATUS: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-300",
  draft:  "bg-amber-500/10 text-amber-300",
};

function Templates() {
  const cats = Array.from(new Set(TEMPLATES.map(t => t.category)));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["All", ...cats].map((c, i) => (
          <button key={c} className={`px-3 py-1 rounded-full text-xs border ${i === 0 ? "bg-pink-500/15 border-pink-400/30 text-pink-100" : "bg-white/5 border-white/10 text-white/60 hover:text-white"}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((t) => (
          <div key={t.name} className="os-glass p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="font-medium text-sm">{t.name}</div>
                <div className="text-[11px] text-white/40 mt-0.5">{t.category}</div>
              </div>
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${TPL_STATUS[t.status]}`}>
                {t.status}
              </span>
            </div>
            <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-white/50 line-clamp-3">
              Hi {"{{first_name}}"}, I came across {"{{company}}"} and noticed a few quick wins we could ship for your team. Open to a 10-min intro this week?
            </div>
            <div className="mt-4 flex items-center justify-between text-[11px] text-white/40">
              <span>Updated {t.updated}</span>
              <span>{t.version}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ 6. QUEUE -------------------------------- */

const QUEUE_KPI = [
  { label: "Waiting", value: 312, tint: "cyan",    icon: Clock },
  { label: "Sending", value: 24,  tint: "indigo",  icon: Zap },
  { label: "Sent",    value: 8914,tint: "emerald", icon: CheckCircle2 },
  { label: "Failed",  value: 41,  tint: "gold",    icon: X },
];

const QUEUE_ROWS = [
  { recipient: "hello@aurorawebstudio.co.uk", campaign: "Website Development Push", status: "waiting", at: "In 14 min" },
  { recipient: "info@northwinddental.co.uk",  campaign: "SEO Cold Wave",            status: "sending", at: "Now" },
  { recipient: "sales@vertexsoftware.dev",    campaign: "UK Formation Wave 3",      status: "waiting", at: "Wed 09:00" },
  { recipient: "team@pixelandpine.io",        campaign: "Website Development Push", status: "sent",    at: "5m ago" },
  { recipient: "manager@quokka-kitchen.com",  campaign: "SEO Cold Wave",            status: "failed",  at: "12m ago" },
  { recipient: "hi@cobaltmarketing.io",       campaign: "Banking Outreach",         status: "waiting", at: "Tomorrow" },
];

const Q_STATUS: Record<string, string> = {
  waiting: "bg-cyan-500/10 text-cyan-300",
  sending: "bg-indigo-500/10 text-indigo-300",
  sent:    "bg-emerald-500/10 text-emerald-300",
  failed:  "bg-red-500/10 text-red-300",
};

function Queue() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {QUEUE_KPI.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="os-glass p-4">
              <div className={`w-9 h-9 rounded-xl grid place-items-center ${TINT[k.tint]}`}><Icon className="w-4 h-4" /></div>
              <div className="mt-3 text-2xl font-bold">{k.value.toLocaleString()}</div>
              <div className="text-xs text-white/50">{k.label}</div>
            </div>
          );
        })}
      </div>

      <div className="os-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-white/50 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Recipient</th>
                <th className="text-left px-4 py-3">Campaign</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Scheduled Time</th>
              </tr>
            </thead>
            <tbody>
              {QUEUE_ROWS.map((r, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/80">{r.recipient}</td>
                  <td className="px-4 py-3 text-white/60">{r.campaign}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${Q_STATUS[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-white/60">{r.at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ 7. LOGS --------------------------------- */

const LOGS_ROWS = [
  { company: "Aurora Web Studio", campaign: "Website Development Push", delivered: true,  opened: true,  clicked: true,  replied: false, failed: false },
  { company: "Vertex Software",   campaign: "UK Formation Wave 3",      delivered: true,  opened: true,  clicked: false, replied: true,  failed: false },
  { company: "Bramley Law",       campaign: "SEO Cold Wave",            delivered: true,  opened: false, clicked: false, replied: false, failed: false },
  { company: "Pixel & Pine SEO",  campaign: "Website Development Push", delivered: true,  opened: true,  clicked: true,  replied: false, failed: false },
  { company: "Quokka Kitchen",    campaign: "SEO Cold Wave",            delivered: false, opened: false, clicked: false, replied: false, failed: true  },
  { company: "Cobalt Marketing",  campaign: "Banking Outreach",         delivered: true,  opened: true,  clicked: false, replied: true,  failed: false },
];

function Dot({ on, tone = "emerald" }: { on: boolean; tone?: string }) {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-400", cyan: "bg-cyan-400", pink: "bg-pink-400", gold: "bg-amber-400", red: "bg-red-400",
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${on ? tones[tone] : "bg-white/15"}`} />;
}

function Logs() {
  return (
    <div className="space-y-4">
      <div className="os-glass p-3 flex gap-2 flex-wrap items-center">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-white/40" />
          <input placeholder="Search company or campaign…" className="bg-transparent text-sm outline-none flex-1 placeholder:text-white/30" />
        </div>
        <button className="px-3 py-1.5 rounded-lg text-sm bg-white/5 border border-white/10 inline-flex items-center gap-2">
          <Filter className="w-3.5 h-3.5" /> Filters
        </button>
      </div>

      <div className="os-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-white/50 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Company</th>
                <th className="text-left px-4 py-3">Campaign</th>
                <th className="text-center px-3 py-3">Delivered</th>
                <th className="text-center px-3 py-3">Opened</th>
                <th className="text-center px-3 py-3">Clicked</th>
                <th className="text-center px-3 py-3">Replied</th>
                <th className="text-center px-3 py-3">Failed</th>
              </tr>
            </thead>
            <tbody>
              {LOGS_ROWS.map((r, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="px-4 py-3 font-medium">{r.company}</td>
                  <td className="px-4 py-3 text-white/60">{r.campaign}</td>
                  <td className="px-3 py-3 text-center"><Dot on={r.delivered} tone="emerald" /></td>
                  <td className="px-3 py-3 text-center"><Dot on={r.opened} tone="cyan" /></td>
                  <td className="px-3 py-3 text-center"><Dot on={r.clicked} tone="pink" /></td>
                  <td className="px-3 py-3 text-center"><Dot on={r.replied} tone="gold" /></td>
                  <td className="px-3 py-3 text-center"><Dot on={r.failed} tone="red" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- 8. ANALYTICS ----------------------------- */

const RATES = [
  { label: "Delivery Rate", value: 96.8, tint: "emerald" },
  { label: "Open Rate",     value: 34.2, tint: "cyan" },
  { label: "Click Rate",    value: 11.7, tint: "pink" },
  { label: "Reply Rate",    value: 4.6,  tint: "gold" },
];

const CAMPAIGN_PERF = [
  { name: "Website Development Push", open: 38, reply: 12 },
  { name: "UK Formation Wave 3",      open: 31, reply: 7  },
  { name: "Banking Outreach",         open: 22, reply: 3  },
  { name: "SEO Cold Wave",            open: 28, reply: 6  },
  { name: "Digital Marketing Intro",  open: 19, reply: 2  },
];

function Analytics() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {RATES.map((r) => (
          <div key={r.label} className="os-glass p-5">
            <div className="text-xs text-white/50">{r.label}</div>
            <div className="text-3xl font-bold mt-2">{r.value}%</div>
            <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className={`h-full ${
                r.tint === "emerald" ? "bg-emerald-400/70" :
                r.tint === "cyan"    ? "bg-cyan-400/70"    :
                r.tint === "pink"    ? "bg-pink-400/70"    : "bg-amber-400/70"
              }`} style={{ width: `${Math.min(100, r.value * 2)}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="os-glass p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-semibold">Campaign Performance</div>
            <div className="text-xs text-white/50">Open vs reply rate across the last 30 days.</div>
          </div>
          <span className="text-[11px] text-white/40">Mock data</span>
        </div>
        <div className="space-y-3">
          {CAMPAIGN_PERF.map((c) => (
            <div key={c.name}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-white/80">{c.name}</span>
                <span className="text-white/40">{c.open}% open · {c.reply}% reply</span>
              </div>
              <div className="flex gap-1">
                <div className="h-2 rounded-full bg-cyan-400/60" style={{ width: `${c.open * 1.5}%` }} />
                <div className="h-2 rounded-full bg-pink-400/70" style={{ width: `${c.reply * 1.5}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --------------------------- FUTURE READY ------------------------------- */

const FUTURE = [
  { label: "Google Lead Discovery",     icon: Compass,  tint: "cyan"    },
  { label: "AI Lead Qualification",     icon: Sparkles, tint: "purple"  },
  { label: "Automatic Email Sequences", icon: Send,     tint: "pink"    },
  { label: "CRM Integration",           icon: Users,    tint: "emerald" },
  { label: "Reminder Agent",            icon: Clock,    tint: "gold"    },
  { label: "AI Personalisation",        icon: Cpu,      tint: "indigo"  },
  { label: "Follow-up Automation",      icon: ChevronRight, tint: "cyan" },
];

function FutureReady() {
  return (
    <div className="os-glass p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl grid place-items-center ${TINT.purple}`}>
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <div className="font-semibold">Future Ready</div>
          <div className="text-xs text-white/50">Modules that plug into this page without a redesign.</div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {FUTURE.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg grid place-items-center ${TINT[f.tint]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{f.label}</div>
                <div className="text-[10px] uppercase tracking-wider text-white/40 mt-0.5">Coming Soon</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
