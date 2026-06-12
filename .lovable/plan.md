
# Phase V+ — Lead Attribution & AI Source Tracking

A complete attribution engine answering: where does every lead, order, and pound come from — including which AI platform recommended us.

## 1. Database (one migration)

New tables (admin-only RLS, service_role full, authenticated insert where noted):

- `visitor_sessions` — anon-friendly session log
  - `session_id` (uuid), `visitor_id` (uuid, cookie-persisted), `user_id` (nullable)
  - `first_seen_at`, `last_seen_at`, `pages_viewed`, `referrer`, `landing_page`
  - `utm_source/medium/campaign/content/term`
  - `device_type`, `browser`, `country`, `ip_hash`
  - `detected_source` (e.g. `chatgpt`, `gemini`, `google`, `facebook`, …)
  - `detected_category` (`ai` | `search` | `social` | `direct` | `referral`)
  - INSERT allowed for `anon` (telemetry); SELECT admin/staff only.

- `visitor_attribution` — one row per `visitor_id`
  - `first_*` snapshot (source, category, campaign, referrer, landing, date)
  - `last_*` snapshot (refreshed every session)
  - `session_count`, `total_pages`

- `lead_attribution` — locks attribution onto a conversion event
  - `entity_type` (`order` | `inquiry` | `lead` | `ticket` | `whatsapp_contact`)
  - `entity_id` (uuid/text), `user_id` (nullable)
  - `declared_source` (from the "How did you hear about us?" picker)
  - `declared_source_label`, `declared_category`
  - first_/last_ snapshot, utm_*, referrer, landing_page, device, country
  - `converted_at`
  - Unique on (`entity_type`, `entity_id`).

Extensions to existing tables (no destructive change):
- `client_orders`: add `declared_source`, `attribution_id` (FK), `utm_source`, `utm_campaign`.
- `contact_submissions`: add `declared_source`, `attribution_id`.
- `leads`: add `declared_source`, `attribution_id`.

DB function `record_lead_attribution(...)` (SECURITY DEFINER) used by the client/edge to upsert in one call.

Materialised view-style SQL functions (called from the dashboard):
- `attribution_totals_by_source(range)` → leads/orders/revenue/conv%/AOV
- `attribution_ai_breakdown(range)` → per-AI platform metrics
- `attribution_insights(range)` → auto-generated text insights (top channel, top AI, highest AOV, etc.)

## 2. Client-side tracker (`src/lib/attribution.ts`)

Runs on every page load (mounted in `App.tsx`):

1. Read/create `df_visitor_id` cookie (180 days) + localStorage mirror.
2. Parse `window.location.search` for utm_* + `ref=` / `src=`.
3. Detect AI/search/social source from `document.referrer` (chat.openai.com, chatgpt.com, gemini.google.com, claude.ai, perplexity.ai, grok.com/x.ai, deepseek.com, copilot.microsoft.com, bing.com, duckduckgo.com, facebook.com, instagram.com, tiktok.com, youtube.com, linkedin.com, twitter.com/x.com).
4. First visit → write `attribution_first_*` to localStorage + cookie + insert into `visitor_attribution`.
5. Every visit → update `last_*` + insert `visitor_sessions` row (best-effort, never blocks UI).
6. Expose `getAttributionSnapshot()` consumed by checkout/contact/lead forms.

## 3. "How did you hear about us?" picker

New component `src/components/attribution/SourceHeardPicker.tsx`:

- Grid of branded cards with official icons (lucide + small inline SVGs for AI brands).
- Categories collapsed on mobile, expanded on desktop: AI / Search / Social / Direct.
- Required field — submit blocked with inline error until chosen.
- Returns `{ id, label, category }`.

Wired into:
- `CheckoutFlow.tsx` (mandatory before "Pay / Submit").
- Contact/Inquiry forms.
- Lead capture forms.

On submit the form calls `record_lead_attribution` with the picker value + the visitor snapshot, then stores returned `attribution_id` on the order/inquiry/lead row.

## 4. Admin Dashboard — `/admin/attribution`

New nav entry **Lead Attribution** (between Analytics and Tasks).

Pages:

- **Overview**
  - KPI cards: Total Leads, Total Orders, Revenue, Top Channel, Top AI Platform, Top Revenue Source, Best Conversion Rate, Highest AOV.
  - Date range selector (7d / 30d / 90d / YTD / all).
- **By Source** — sortable table: source, category, leads, orders, revenue, conv%, AOV.
- **AI Platforms** — dedicated cards per AI (ChatGPT, Gemini, Claude, Perplexity, Grok, DeepSeek, Copilot, Other AI) with leads/orders/revenue/conv%.
- **Campaigns** — UTM source/medium/campaign breakdown.
- **Auto Insights** — bullet list generated from `attribution_insights` (e.g. "ChatGPT delivers your highest-quality leads — 31% conversion").
- **Exports** — CSV (native), Excel (`xlsx` lib, already used), PDF (`jspdf`).

## 5. CRM surfacing

- `OsClientDetail` / `OsOrders` row drawer: show "Source", "First Touch", "Last Touch", "Campaign".
- `OsWhatsAppContactDetail`: show declared source if captured.

## 6. Safety & compliance

- No PII in trackers; IP hashed (sha256 + salt) in edge, never stored raw.
- All write endpoints rate-limited via existing `whatsapp_clicks` pattern.
- Tracker fails silently — never blocks navigation or checkout.
- RLS: telemetry tables admin-read-only; only `record_lead_attribution` accepts writes from authenticated/anon contexts.

## Build order

1. Migration (tables, columns, function, grants, RLS).
2. `src/lib/attribution.ts` + mount in `App.tsx`.
3. `SourceHeardPicker` + wire into `CheckoutFlow`, contact form, lead form.
4. Admin `/admin/attribution` pages + nav entry + exports.
5. Add "Source" columns to existing Orders/Clients/WhatsApp drawers.

## Out of scope (for now)

- Multi-touch (linear/time-decay) modelling — we store data needed for it, just don't compute yet.
- Paid-ad cost ingestion (Google/Meta APIs) — future phase.
- Server-side click ID resolution (gclid/fbclid lookups) — stored only.
