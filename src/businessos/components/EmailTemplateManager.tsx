// Email Template Manager — manages template metadata only.
// Sending is NOT implemented here. Test send routes through the existing
// `send-transactional-email` Edge Function so it lands in `email_send_log`
// and respects the queue, suppression list, retries, and DLQ.

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  FileText, Plus, Save, History, Send, X, Eye, Code2,
  AlertTriangle, CheckCircle2, RefreshCw, RotateCcw, Tag, Trash2,
} from "lucide-react";

type Template = {
  id: string;
  name: string;
  category: string;
  subject: string;
  html_body: string;
  plain_body: string;
  variables: string[];
  linked_template: string | null;
  is_active: boolean;
  current_version: number;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
};

type Version = {
  id: string;
  template_id: string;
  version: number;
  subject: string;
  html_body: string;
  plain_body: string;
  variables: string[];
  change_note: string | null;
  modified_by: string | null;
  created_at: string;
};

const CATEGORIES = [
  "welcome","inquiry_received","client_created","order_confirmation",
  "order_in_progress","order_completed","invoice","reminder",
  "compliance_reminder","support_reply","marketing_campaign",
  "internal_notification","custom",
] as const;

const SUPPORTED_VARS = [
  "company_name","client_name","order_number","invoice_number",
  "director_name","confirmation_due","accounts_due","website",
  "email","phone","current_date",
];

const REGISTERED_TEMPLATES = [
  "order-confirmation","order-notification","welcome","order-completed",
  "order-in-progress","document-uploaded","ticket-received",
  "address-renewal-reminder","confirmation-statement-reminder",
  "annual-accounts-reminder","internal-company-reminder",
  "contact-confirmation","ticket-status-update",
];

function extractVars(text: string): string[] {
  const found = new Set<string>();
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  let m;
  while ((m = re.exec(text)) !== null) found.add(m[1]);
  return [...found];
}

function validate(t: Pick<Template, "subject" | "html_body" | "plain_body" | "variables">) {
  const warnings: string[] = [];
  const errors: string[] = [];
  const allVars = extractVars(`${t.subject}\n${t.html_body}\n${t.plain_body}`);
  const unsupported = allVars.filter((v) => !SUPPORTED_VARS.includes(v) && !t.variables.includes(v));
  if (unsupported.length) warnings.push(`Unknown placeholders: ${unsupported.map((v) => `{{${v}}}`).join(", ")}`);
  const dup = t.variables.filter((v, i) => t.variables.indexOf(v) !== i);
  if (dup.length) errors.push(`Duplicate variable names: ${[...new Set(dup)].join(", ")}`);
  // very light HTML balance check
  const opens = (t.html_body.match(/<[a-zA-Z][^/>]*>/g) || []).length;
  const closes = (t.html_body.match(/<\/[a-zA-Z][^>]*>/g) || []).length;
  const selfClose = (t.html_body.match(/<[a-zA-Z][^>]*\/>/g) || []).length;
  if (opens - selfClose !== closes && t.html_body.trim().length > 0) {
    warnings.push("HTML tags may be unbalanced — verify your markup.");
  }
  if (!t.subject.trim()) errors.push("Subject is required.");
  return { warnings, errors, allVars };
}

function mergePreview(html: string, sample: Record<string, string>) {
  return html.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => sample[key] ?? `{{${key}}}`);
}

const SAMPLE: Record<string, string> = {
  company_name: "Acme Holdings Ltd",
  client_name: "Jane Smith",
  order_number: "GBQ0617000123",
  invoice_number: "INV-2026-0042",
  director_name: "Jane Smith",
  confirmation_due: "2026-09-15",
  accounts_due: "2026-12-31",
  website: "https://digiformation.uk",
  email: "client@example.com",
  phone: "+44 20 1234 5678",
  current_date: new Date().toISOString().slice(0, 10),
};

export default function EmailTemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Template | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [viewMode, setViewMode] = useState<"html" | "plain" | "preview">("html");
  const [testEmail, setTestEmail] = useState("");
  const [testBase, setTestBase] = useState("contact-confirmation");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    else setTemplates((data || []) as Template[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const selected = useMemo(
    () => templates.find((t) => t.id === selectedId) || null,
    [templates, selectedId]
  );

  useEffect(() => {
    setDraft(selected ? { ...selected } : null);
    if (selected) loadVersions(selected.id);
    else setVersions([]);
  }, [selectedId]); // eslint-disable-line

  const loadVersions = async (id: string) => {
    const { data } = await supabase
      .from("email_template_versions")
      .select("*")
      .eq("template_id", id)
      .order("version", { ascending: false });
    setVersions((data || []) as Version[]);
  };

  const validation = draft ? validate(draft) : { warnings: [], errors: [], allVars: [] };

  const createTemplate = async () => {
    const name = prompt("Template name (unique, lowercase, hyphens)")?.trim();
    if (!name) return;
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("email_templates")
      .insert({
        name,
        category: "custom",
        subject: "",
        html_body: "<p>Hello {{client_name}},</p>",
        plain_body: "Hello {{client_name}},",
        variables: [],
        created_by: u.user?.id,
        updated_by: u.user?.id,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    await supabase.from("email_template_versions").insert({
      template_id: data.id,
      version: 1,
      subject: data.subject,
      html_body: data.html_body,
      plain_body: data.plain_body,
      variables: data.variables,
      change_note: "Created",
      modified_by: u.user?.id,
    });
    toast.success("Template created");
    await load();
    setSelectedId(data.id);
  };

  const save = async () => {
    if (!draft) return;
    if (validation.errors.length) {
      toast.error(validation.errors[0]);
      return;
    }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const nextVersion = (draft.current_version || 1) + 1;
    const { error } = await supabase
      .from("email_templates")
      .update({
        category: draft.category,
        subject: draft.subject,
        html_body: draft.html_body,
        plain_body: draft.plain_body,
        variables: draft.variables,
        linked_template: draft.linked_template,
        is_active: draft.is_active,
        current_version: nextVersion,
        updated_by: u.user?.id,
      })
      .eq("id", draft.id);
    if (error) { setSaving(false); return toast.error(error.message); }

    await supabase.from("email_template_versions").insert({
      template_id: draft.id,
      version: nextVersion,
      subject: draft.subject,
      html_body: draft.html_body,
      plain_body: draft.plain_body,
      variables: draft.variables,
      change_note: `v${nextVersion}`,
      modified_by: u.user?.id,
    });
    setSaving(false);
    toast.success(`Saved v${nextVersion}`);
    await load();
    if (selected) await loadVersions(selected.id);
  };

  const restoreVersion = async (v: Version) => {
    if (!draft) return;
    if (!confirm(`Restore v${v.version}? This creates a new version with these contents.`)) return;
    setDraft({
      ...draft,
      subject: v.subject,
      html_body: v.html_body,
      plain_body: v.plain_body,
      variables: v.variables,
    });
    toast.message("Loaded into editor — click Save to commit as a new version.");
    setShowVersions(false);
  };

  const removeTemplate = async () => {
    if (!draft) return;
    if (!confirm(`Delete template "${draft.name}"? Versions are removed too.`)) return;
    const { error } = await supabase.from("email_templates").delete().eq("id", draft.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    setSelectedId(null);
    load();
  };

  const sendTest = async () => {
    if (!testEmail.trim()) return toast.error("Enter a test recipient");
    if (!draft) return;
    setSending(true);
    try {
      // Reuse existing transactional email pipeline. We send a registered base
      // template so the request is queued, logged in email_send_log, and
      // respects suppression. The DB-stored HTML body is metadata for future
      // campaign use — we DO NOT bypass the registered template system.
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          template: testBase,
          to: testEmail.trim(),
          data: { ...SAMPLE, _template_under_test: draft.name },
          idempotency_key: `tpl-test-${draft.id}-${Date.now()}`,
          purpose: "transactional",
          metadata: { test_for_template: draft.name, template_id: draft.id },
        },
      });
      if (error) throw error;
      toast.success(`Test queued via "${testBase}" — check email_send_log.`);
    } catch (e: any) {
      toast.error(e.message || "Test send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
      {/* Sidebar */}
      <aside className="os-glass p-3 space-y-2 h-fit">
        <div className="flex items-center justify-between px-1">
          <div className="text-xs uppercase tracking-wider text-white/50">Templates</div>
          <div className="flex gap-1">
            <button onClick={load} className="p-1.5 rounded hover:bg-white/5" title="Refresh">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={createTemplate} className="p-1.5 rounded hover:bg-white/5" title="New">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {!loading && templates.length === 0 && (
            <div className="text-xs text-white/40 p-3 text-center">
              No templates yet. Click + to create one.
            </div>
          )}
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${
                selectedId === t.id ? "bg-pink-500/15 text-pink-100" : "hover:bg-white/5 text-white/70"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium truncate">{t.name}</span>
                {!t.is_active && <span className="text-[9px] text-white/40">inactive</span>}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-white/40">
                <Tag className="w-2.5 h-2.5" /> {t.category} · v{t.current_version}
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Editor */}
      <section className="space-y-4">
        {!draft ? (
          <div className="os-glass p-10 text-center">
            <FileText className="w-8 h-8 text-white/30 mx-auto mb-3" />
            <div className="font-semibold">Select or create a template</div>
            <div className="text-sm text-white/50 mt-1">
              Template editing only. Sending continues through the existing email automation.
            </div>
          </div>
        ) : (
          <>
            <div className="os-glass p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-white/50">Name</label>
                  <input
                    value={draft.name}
                    disabled
                    className="w-full mt-1 h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-sm opacity-60"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-white/50">Category</label>
                  <select
                    value={draft.category}
                    onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                    className="w-full mt-1 h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-sm"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-white/50">Status</label>
                  <div className="flex items-center gap-2 mt-1 h-9">
                    <input
                      type="checkbox"
                      checked={draft.is_active}
                      onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
                    />
                    <span className="text-sm">{draft.is_active ? "Active" : "Inactive"}</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-white/50">Subject</label>
                <input
                  value={draft.subject}
                  onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                  className="w-full mt-1 h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-sm"
                  placeholder="e.g. Welcome to {{company_name}}"
                />
              </div>
            </div>

            <div className="os-glass">
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                <div className="flex gap-1">
                  {(["html","plain","preview"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setViewMode(m)}
                      className={`px-3 py-1.5 rounded-lg text-xs ${
                        viewMode === m ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
                      }`}
                    >
                      {m === "html" && <Code2 className="w-3 h-3 inline mr-1" />}
                      {m === "preview" && <Eye className="w-3 h-3 inline mr-1" />}
                      {m === "html" ? "HTML" : m === "plain" ? "Plain Text" : "Preview"}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-white/40">
                  v{draft.current_version} · updated {new Date(draft.updated_at).toLocaleString()}
                </div>
              </div>
              <div className="p-3">
                {viewMode === "html" && (
                  <textarea
                    value={draft.html_body}
                    onChange={(e) => setDraft({ ...draft, html_body: e.target.value })}
                    rows={16}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-xs font-mono"
                  />
                )}
                {viewMode === "plain" && (
                  <textarea
                    value={draft.plain_body}
                    onChange={(e) => setDraft({ ...draft, plain_body: e.target.value })}
                    rows={16}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-xs font-mono"
                  />
                )}
                {viewMode === "preview" && (
                  <div className="bg-white text-black rounded-lg p-4 max-h-[480px] overflow-y-auto text-sm">
                    <div className="text-xs text-zinc-500 mb-2 border-b pb-2">
                      Subject: {mergePreview(draft.subject, SAMPLE) || <em>(empty)</em>}
                    </div>
                    <div dangerouslySetInnerHTML={{ __html: mergePreview(draft.html_body, SAMPLE) }} />
                  </div>
                )}
              </div>
            </div>

            {/* Variables helper */}
            <div className="os-glass p-4">
              <div className="text-xs uppercase tracking-wider text-white/50 mb-2">Variables</div>
              <div className="flex flex-wrap gap-1.5">
                {SUPPORTED_VARS.map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      navigator.clipboard?.writeText(`{{${v}}}`);
                      toast.message(`Copied {{${v}}}`);
                    }}
                    className="text-[11px] px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 font-mono"
                  >
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
              <div className="mt-3 text-[11px] text-white/50">
                Used in this template: {validation.allVars.length
                  ? validation.allVars.map((v) => <code key={v} className="mx-0.5 text-white/80">{`{{${v}}}`}</code>)
                  : <span className="text-white/30">none</span>}
              </div>
            </div>

            {/* Validation */}
            {(validation.errors.length > 0 || validation.warnings.length > 0) && (
              <div className="os-glass p-4 space-y-1.5">
                {validation.errors.map((e, i) => (
                  <div key={`e${i}`} className="flex items-start gap-2 text-xs text-red-300">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {e}
                  </div>
                ))}
                {validation.warnings.map((w, i) => (
                  <div key={`w${i}`} className="flex items-start gap-2 text-xs text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {w}
                  </div>
                ))}
              </div>
            )}

            {/* Test send */}
            <div className="os-glass p-4">
              <div className="text-xs uppercase tracking-wider text-white/50 mb-2">Test Email</div>
              <p className="text-[11px] text-white/50 mb-3">
                Routes through the production <code className="text-white/70">send-transactional-email</code> pipeline
                using a registered base template. Logged in <code className="text-white/70">email_send_log</code>.
              </p>
              <div className="flex flex-wrap gap-2">
                <select
                  value={testBase}
                  onChange={(e) => setTestBase(e.target.value)}
                  className="h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-xs"
                >
                  {REGISTERED_TEMPLATES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  className="h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-xs flex-1 min-w-[200px]"
                />
                <button
                  onClick={sendTest}
                  disabled={sending}
                  className="h-9 px-3 rounded-lg text-xs border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> {sending ? "Sending…" : "Send Test"}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                <button
                  onClick={save}
                  disabled={saving || validation.errors.length > 0}
                  className="h-9 px-4 rounded-lg text-xs border border-pink-500/30 bg-pink-500/15 text-pink-100 hover:bg-pink-500/25 disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> {saving ? "Saving…" : "Save (new version)"}
                </button>
                <button
                  onClick={() => setShowVersions((s) => !s)}
                  className="h-9 px-3 rounded-lg text-xs border border-white/10 hover:bg-white/5 flex items-center gap-1.5"
                >
                  <History className="w-3.5 h-3.5" /> History ({versions.length})
                </button>
              </div>
              <button
                onClick={removeTemplate}
                className="h-9 px-3 rounded-lg text-xs border border-red-500/20 text-red-300/80 hover:bg-red-500/10 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>

            {/* Versions drawer */}
            {showVersions && (
              <div className="os-glass overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <History className="w-4 h-4" /> Version history
                  </div>
                  <button onClick={() => setShowVersions(false)} className="p-1 rounded hover:bg-white/5">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-[360px] overflow-y-auto divide-y divide-white/5">
                  {versions.map((v) => (
                    <div key={v.id} className="p-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold">v{v.version}</div>
                        <div className="text-[11px] text-white/50 truncate">{v.subject || <em>(no subject)</em>}</div>
                        <div className="text-[10px] text-white/40 mono">{new Date(v.created_at).toLocaleString()}</div>
                      </div>
                      <button
                        onClick={() => restoreVersion(v)}
                        className="h-7 px-2 rounded-md text-[11px] border border-white/10 hover:bg-white/5 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Restore
                      </button>
                    </div>
                  ))}
                  {versions.length === 0 && (
                    <div className="p-6 text-center text-xs text-white/40">No history yet</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex items-center gap-2 text-[11px] text-white/40">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/70" />
          No sending logic here. Existing automation, queue, scheduler, and Edge Functions are unchanged.
        </div>
      </section>
    </div>
  );
}
