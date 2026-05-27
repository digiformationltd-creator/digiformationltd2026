import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Search, RefreshCw, Loader2, ExternalLink, Filter, Upload, Download,
  Trash2, FileText, FileImage, FileArchive, File as FileIcon, User, Calendar,
} from "lucide-react";

interface DocRow {
  id: string;
  user_id: string;
  name: string;
  doc_date: string;
  file_type: string | null;
  file_size: string | null;
  file_url: string | null;
  created_at: string;
}
interface ProfileLite { user_id: string; full_name: string | null; email: string | null; company_name: string | null; }

const TYPE_FILTERS = [
  { key: "all", label: "All" },
  { key: "PDF", label: "PDF" },
  { key: "IMG", label: "Image" },
  { key: "DOC", label: "Document" },
  { key: "OTHER", label: "Other" },
];

const DATE_FILTERS = [
  { key: "all", label: "All time" },
  { key: "7", label: "Last 7 days" },
  { key: "30", label: "Last 30 days" },
  { key: "90", label: "Last 90 days" },
];

function typeBucket(t: string | null | undefined) {
  const v = (t || "").toUpperCase();
  if (v.includes("PDF")) return "PDF";
  if (v.includes("PNG") || v.includes("JPG") || v.includes("JPEG") || v.includes("WEBP") || v.includes("IMAGE")) return "IMG";
  if (v.includes("DOC") || v.includes("WORD") || v.includes("TXT")) return "DOC";
  return "OTHER";
}

function typeIcon(t: string | null) {
  const b = typeBucket(t);
  if (b === "PDF") return <FileText className="w-4 h-4 text-rose-300" />;
  if (b === "IMG") return <FileImage className="w-4 h-4 text-violet-300" />;
  if (b === "DOC") return <FileText className="w-4 h-4 text-blue-300" />;
  return <FileArchive className="w-4 h-4 text-white/60" />;
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function OsDocuments() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<string>("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: docData, error } = await supabase
      .from("client_documents")
      .select("*")
      .order("doc_date", { ascending: false })
      .limit(1000);
    if (error) { toast.error(error.message); setLoading(false); return; }
    const rows = (docData || []) as DocRow[];
    setDocs(rows);
    const ids = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, company_name")
        .in("user_id", ids);
      const map: Record<string, ProfileLite> = {};
      (profs || []).forEach((p: any) => { map[p.user_id] = p; });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const clientOptions = useMemo(() => {
    const set = new Map<string, string>();
    docs.forEach(d => {
      const p = profiles[d.user_id];
      set.set(d.user_id, p?.full_name || p?.email || d.user_id.slice(0, 8));
    });
    return Array.from(set.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [docs, profiles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = Date.now();
    return docs.filter(d => {
      if (typeFilter !== "all" && typeBucket(d.file_type) !== typeFilter) return false;
      if (clientFilter !== "all" && d.user_id !== clientFilter) return false;
      if (dateFilter !== "all") {
        const days = parseInt(dateFilter, 10);
        const t = new Date(d.doc_date).getTime();
        if (now - t > days * 86400000) return false;
      }
      if (!q) return true;
      const p = profiles[d.user_id];
      return (
        d.name?.toLowerCase().includes(q) ||
        d.file_type?.toLowerCase().includes(q) ||
        p?.full_name?.toLowerCase().includes(q) ||
        p?.email?.toLowerCase().includes(q) ||
        p?.company_name?.toLowerCase().includes(q)
      );
    });
  }, [docs, search, typeFilter, dateFilter, clientFilter, profiles]);

  const stats = useMemo(() => {
    const total = docs.length;
    const pdf = docs.filter(d => typeBucket(d.file_type) === "PDF").length;
    const img = docs.filter(d => typeBucket(d.file_type) === "IMG").length;
    const last30 = docs.filter(d => (Date.now() - new Date(d.doc_date).getTime()) < 30 * 86400000).length;
    return { total, pdf, img, last30 };
  }, [docs]);

  const handleDownload = async (d: DocRow) => {
    if (!d.file_url) { toast.error("No file attached"); return; }
    const { data, error } = await supabase.storage.from("client-docs").createSignedUrl(d.file_url, 60, { download: d.name || true });
    if (error) { toast.error(error.message); return; }
    window.open(data.signedUrl, "_blank");
  };

  const handlePreview = async (d: DocRow) => {
    if (!d.file_url) { toast.error("No file attached"); return; }
    const { data, error } = await supabase.storage.from("client-docs").createSignedUrl(d.file_url, 60);
    if (error) { toast.error(error.message); return; }
    window.open(data.signedUrl, "_blank");
  };

  const handleDelete = async (d: DocRow) => {
    if (!confirm(`Delete "${d.name}"? This cannot be undone.`)) return;
    if (d.file_url) await supabase.storage.from("client-docs").remove([d.file_url]);
    const { error } = await supabase.from("client_documents").delete().eq("id", d.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Document deleted");
    load();
  };

  const handleUploadFiles = async (files: FileList | File[]) => {
    if (!uploadTarget) { toast.error("Select a client first"); return; }
    const arr = Array.from(files);
    if (!arr.length) return;
    setUploading(true);
    try {
      for (const file of arr) {
        const path = `${uploadTarget}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("client-docs").upload(path, file, { upsert: false, contentType: file.type });
        if (upErr) { toast.error(`${file.name}: ${upErr.message}`); continue; }
        const { error: insErr } = await supabase.from("client_documents").insert({
          user_id: uploadTarget,
          name: file.name,
          file_url: path,
          file_type: (file.type.split("/")[1] || "file").toUpperCase(),
          file_size: fmtSize(file.size),
          doc_date: new Date().toISOString().slice(0, 10),
        });
        if (insErr) toast.error(`${file.name}: ${insErr.message}`);
      }
      toast.success("Upload complete");
      load();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const openInLegacy = (userId: string) => navigate(`/admin/legacy?client=${userId}&tab=documents`);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-sm text-white/50 mt-0.5">Connected to production <code className="text-white/70">client_documents</code> · bucket <code className="text-white/70">client-docs</code></p>
        </div>
        <button onClick={load} className="os-glass px-3 py-2 rounded-xl text-sm inline-flex items-center gap-2 hover:bg-white/10">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Documents", value: stats.total, glow: "from-blue-500/20 to-indigo-500/10" },
          { label: "PDF Files", value: stats.pdf, glow: "from-rose-500/20 to-orange-500/10" },
          { label: "Images", value: stats.img, glow: "from-violet-500/20 to-purple-500/10" },
          { label: "Last 30 days", value: stats.last30, glow: "from-emerald-500/20 to-teal-500/10" },
        ].map(s => (
          <div key={s.label} className={`os-glass p-4 bg-gradient-to-br ${s.glow}`}>
            <div className="text-xs text-white/60">{s.label}</div>
            <div className="text-2xl font-bold mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUploadFiles(e.dataTransfer.files); }}
        className={`os-glass p-4 sm:p-5 border-2 border-dashed transition ${dragOver ? "border-blue-400/60 bg-blue-500/10" : "border-white/10"}`}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/20 grid place-items-center shrink-0">
              <Upload className="w-5 h-5 text-blue-200" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold">Upload to client</div>
              <div className="text-xs text-white/50 truncate">Drag & drop or pick files · stored in <code className="text-white/70">client-docs</code></div>
            </div>
          </div>
          <select
            value={uploadTarget}
            onChange={(e) => setUploadTarget(e.target.value)}
            className="os-glass bg-transparent text-sm rounded-xl px-3 py-2 min-w-[180px] [&>option]:bg-slate-900"
          >
            <option value="">Select client…</option>
            {clientOptions.map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={!uploadTarget || uploading}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-500 hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-2"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Choose files
          </button>
          <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && handleUploadFiles(e.target.files)} />
        </div>
      </div>

      {/* Filters */}
      <div className="os-glass p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-white/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, client, type…"
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-white/40"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-white/40" />
          {TYPE_FILTERS.map(t => (
            <button
              key={t.key}
              onClick={() => setTypeFilter(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${typeFilter === t.key ? "bg-white/15 text-white" : "bg-white/5 text-white/60 hover:bg-white/10"}`}
            >{t.label}</button>
          ))}
        </div>
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="os-glass bg-transparent text-xs rounded-lg px-2 py-2 [&>option]:bg-slate-900">
          {DATE_FILTERS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
        </select>
        <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="os-glass bg-transparent text-xs rounded-lg px-2 py-2 max-w-[180px] [&>option]:bg-slate-900">
          <option value="all">All clients</option>
          {clientOptions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="os-glass p-12 grid place-items-center">
          <Loader2 className="w-6 h-6 animate-spin text-white/60" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="os-glass p-12 text-center text-white/50">
          <FileIcon className="w-8 h-8 mx-auto mb-3 opacity-50" />
          No documents match your filters.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block os-glass overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-white/60 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3">Document</th>
                  <th className="text-left px-4 py-3">Client</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Size</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(d => {
                  const p = profiles[d.user_id];
                  return (
                    <tr key={d.id} className="hover:bg-white/5 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {typeIcon(d.file_type)}
                          <span className="truncate font-medium">{d.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => openInLegacy(d.user_id)} className="text-left hover:text-blue-300 transition truncate max-w-[200px] inline-block">
                          {p?.full_name || p?.email || d.user_id.slice(0, 8)}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-white/70">{d.file_type || "—"}</td>
                      <td className="px-4 py-3 text-white/60">{d.file_size || "—"}</td>
                      <td className="px-4 py-3 text-white/60">{new Date(d.doc_date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handlePreview(d)} title="Preview" className="p-2 rounded-lg hover:bg-white/10"><ExternalLink className="w-4 h-4" /></button>
                          <button onClick={() => handleDownload(d)} title="Download" className="p-2 rounded-lg hover:bg-white/10"><Download className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(d)} title="Delete" className="p-2 rounded-lg hover:bg-rose-500/20 text-rose-300"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(d => {
              const p = profiles[d.user_id];
              return (
                <div key={d.id} className="os-glass p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 grid place-items-center shrink-0">
                      {typeIcon(d.file_type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{d.name}</div>
                      <div className="text-xs text-white/50 mt-0.5 flex items-center gap-2">
                        <span>{d.file_type || "file"}</span>
                        <span>·</span>
                        <span>{d.file_size || "—"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-white/60">
                    <User className="w-3.5 h-3.5" />
                    <button onClick={() => openInLegacy(d.user_id)} className="truncate hover:text-blue-300">
                      {p?.full_name || p?.email || d.user_id.slice(0, 8)}
                    </button>
                    <span className="ml-auto inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(d.doc_date).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button onClick={() => handlePreview(d)} className="py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs inline-flex items-center justify-center gap-1"><ExternalLink className="w-3.5 h-3.5" />Open</button>
                    <button onClick={() => handleDownload(d)} className="py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs inline-flex items-center justify-center gap-1"><Download className="w-3.5 h-3.5" />Save</button>
                    <button onClick={() => handleDelete(d)} className="py-2 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs inline-flex items-center justify-center gap-1"><Trash2 className="w-3.5 h-3.5" />Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
