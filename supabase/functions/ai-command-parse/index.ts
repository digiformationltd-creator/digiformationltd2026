// ai-command-parse
// ----------------------------------------------------------------------------
// AI Command Center — Language Intelligence & Company Data Extraction.
// Read-only NLU layer. Does NOT write to DB, does NOT execute anything.
//
// Modes:
//   { mode: "parse_intent", text, paste?, activeCompany?, activeCustomer? }
//     → { intent, payload, plan: { goal, required, missing, steps, risk }, message }
//
//   { mode: "extract_company", text }
//     → { fields: { company_name?, company_number?, registered_address?,
//                   incorporation_date?, director?, status?, notes? },
//         missing: string[], confidence: "high"|"medium"|"low" }
//
// Language: English, Urdu, Roman Urdu, mixed — handled by Gemini.
// Intents emitted MUST match those supported by os-command-execute.
// If unsure, return intent="clarify" with a helpful message — no fabrication.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPPORTED_INTENTS = [
  "create_task", "create_reminder", "create_followup", "assign_task",
  "send_email_template", "send_email", "draft_email",
  "update_company", "update_company_field", "update_company_address",
  "update_company_status", "add_note",
  "fill_company_dashboard",
  "create_order", "update_order_status",
  "update_invoice_status", "update_invoice_meta",
  "lookup_company", "lookup_customer", "show_client_history",
  "show_pending_compliance", "show_reminders", "show_jobs",
  "show_recent_activity", "summarize_company",
  "clarify",
];

const SYSTEM_PROMPT = `You are the Business Agent NLU for DigiFormation's AI Command Center.
You translate natural-language admin instructions into a strict JSON action plan.

LANGUAGES: English, Urdu, Roman Urdu, mixed. Tolerate any spelling
("detailes", "krdo", "kar do", "complete krdo", "address change kr do", etc.).

DOMAIN: UK company formation, Companies House, Confirmation Statement,
Annual Accounts, Registered Address, Directors, PSC, Shareholders, Compliance,
Orders, Invoices, Documents, Email Marketing, CRM, Leads, Tasks, Automation.

RULES — STRICT:
1. Output ONE JSON object only. No prose, no markdown, no code fences.
2. "intent" MUST be one of: ${SUPPORTED_INTENTS.join(", ")}.
3. NEVER invent company data (names, numbers, addresses, directors, emails).
   If a required field is unknown, leave it empty AND list it in plan.missing.
4. Use ACTIVE CONTEXT (active company / customer) when the user uses pronouns
   like "isko", "this", "uska", "us company ka". Set the relevant id from
   context. Do NOT guess ids.
5. Risk tiers:
   - "safe"        → reads, lookups, drafts, add_note, create_task, create_reminder, create_followup, draft_email, show_*
   - "sensitive"   → update_company*, update_invoice_*, update_order_status, send_email*, assign_task
   - "destructive" → create_order (spends money), bulk updates, delete (none currently supported)
6. plan.goal       — one short sentence describing intent in business terms.
   plan.required   — required field names for this intent.
   plan.missing    — required fields not yet supplied (will block execution).
   plan.steps      — short ordered list of what the system will do.
   plan.modules    — affected Business OS modules (e.g. "Companies", "Invoices", "Email", "CRM", "Reminders").
7. "message" — friendly 1-2 line confirmation in the user's language. If
   plan.missing is non-empty, message must politely request the missing info.
8. If the instruction is unclear or off-domain, set intent="clarify" with a
   message asking exactly ONE specific clarifying question.

INTENT FIELD CONTRACTS:
- create_task / create_reminder / create_followup: { title, priority?, due_date?, description? }
- assign_task: { task_id, assigned_to }
- draft_email: { subject, body, recipient_email }
- send_email_template: { template, recipient_email, data? }
- update_company / update_company_field: { company_id, field, value }   // field ∈ notes,status,director,registered_address,company_name,company_number,incorporation_date
- update_company_address: { company_id, registered_address }
- update_company_status:  { company_id, status }
- add_note: { company_id, note }
- fill_company_dashboard: {
    company_name,                       // mandatory — used to resolve the client
    fields: {                           // any subset; omit unknown fields
      company_number?, director_name?, sic_code?, utr_number?, auth_code?,
      activation_code?, companies_house_personal_code?, registered_address?,
      correspondence_address?, incorporation_date?, address_start?,
      address_expire?, confirmation_due?, accounts_filing_due?
    },
    confidence?: { [field]: "high"|"medium"|"low" }   // per-field confidence
  }
  // Use when the user says "fill / complete / update <Company> details/dashboard",
  // "X ki tafseelat bhar do", "X ki details complete kar do", or pastes a CH
  // record and asks for it to be saved. Risk: "sensitive". Required: ["company_name"].
- create_order: { service, customer_email, amount_gbp }
- update_order_status: { order_id, status }
- update_invoice_status: { invoice_id, status }   // draft|issued|paid|void|refunded
- update_invoice_meta:   { invoice_id, due_date?, notes? }
- lookup_company / lookup_customer: { query }
- show_client_history: { customer_email }
- summarize_company:   { company_id }

OUTPUT SHAPE (parse_intent):
{
  "intent": "<one of supported>",
  "payload": { ... contract above ... },
  "plan": {
    "goal": "...",
    "required": ["..."],
    "missing":  ["..."],
    "steps":    ["..."],
    "modules":  ["..."],
    "risk":     "safe" | "sensitive" | "destructive"
  },
  "message": "..."
}`;

const EXTRACT_PROMPT = `You extract UK company information from messy pasted text
(Companies House records, emails, PDFs, spreadsheets, tax letters, plain notes).

OUTPUT ONE JSON OBJECT ONLY (no prose, no fences):
{
  "fields": {
    "company_name":        "...",
    "company_number":      "...",      // 8-char UK CH number if present
    "registered_address":  "...",
    "incorporation_date":  "YYYY-MM-DD",
    "director":            "...",
    "status":              "active|dissolved|...",
    "notes":               "short summary of anything else useful"
  },
  "missing":     ["fields that could not be found"],
  "confidence":  "high" | "medium" | "low"
}

RULES:
- NEVER invent values. Omit any field you cannot find in the text.
- Dates: normalise to YYYY-MM-DD when unambiguous; otherwise omit and add to missing.
- company_number: keep leading zeros, strip whitespace.
- registered_address: single line, comma-separated.
- If text is empty / irrelevant, return { fields:{}, missing:["all"], confidence:"low" }.`;

async function callGemini(prompt: string, userPayload: unknown) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });
  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`Gateway ${resp.status}: ${errText.slice(0, 200)}`);
  }
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content ?? "{}";
  try { return JSON.parse(content); }
  catch { throw new Error("AI returned non-JSON: " + String(content).slice(0, 200)); }
}

function sanitizeIntent(out: any) {
  if (!out || typeof out !== "object") return null;
  const intent = SUPPORTED_INTENTS.includes(out.intent) ? out.intent : "clarify";
  const payload = (out.payload && typeof out.payload === "object") ? out.payload : {};
  const plan = (out.plan && typeof out.plan === "object") ? {
    goal:     String(out.plan.goal ?? ""),
    required: Array.isArray(out.plan.required) ? out.plan.required.map(String) : [],
    missing:  Array.isArray(out.plan.missing)  ? out.plan.missing.map(String)  : [],
    steps:    Array.isArray(out.plan.steps)    ? out.plan.steps.map(String)    : [],
    modules:  Array.isArray(out.plan.modules)  ? out.plan.modules.map(String)  : [],
    risk:     ["safe","sensitive","destructive"].includes(out.plan.risk) ? out.plan.risk : "safe",
  } : { goal:"", required:[], missing:[], steps:[], modules:[], risk:"safe" };
  const message = typeof out.message === "string" ? out.message : "";
  return { intent, payload, plan, message };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  let body: any;
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: "Bad JSON" }), {
    status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
  }); }

  try {
    const mode = body?.mode ?? "parse_intent";

    if (mode === "extract_company") {
      const text = String(body.text ?? "").slice(0, 12000);
      if (!text.trim()) {
        return new Response(JSON.stringify({
          ok: true, fields: {}, missing: ["all"], confidence: "low",
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" }});
      }
      const out = await callGemini(EXTRACT_PROMPT, { text });
      return new Response(JSON.stringify({ ok: true, ...out }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // parse_intent (default)
    const text = String(body.text ?? "").slice(0, 4000);
    const paste = String(body.paste ?? "").slice(0, 8000);
    const activeCompany = body.activeCompany ?? null;   // { id, company_name, company_number? }
    const activeCustomer = body.activeCustomer ?? null; // { email, full_name? }
    if (!text.trim()) {
      return new Response(JSON.stringify({ ok: false, error: "text required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const raw = await callGemini(SYSTEM_PROMPT, {
      instruction: text,
      paste: paste || null,
      activeCompany, activeCustomer,
    });
    const out = sanitizeIntent(raw);
    if (!out) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid AI response" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true, ...out }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
