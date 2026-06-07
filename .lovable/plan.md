# WhatsApp CRM — Safe, Meta-Compliant Architecture

A lightweight, relationship-focused CRM built on the **official Meta WhatsApp Cloud API**. No spam engine. Five transactional automations + manual broadcasts only. Designed to keep your WhatsApp Business number safe for years.

---

## 1. Architecture (high level)

```text
   Checkout / Portal / Inquiry
            │  (E.164 phone already normalised by src/lib/phone.ts)
            ▼
   whatsapp_contacts  ◄──────── linked to ─────────►  profiles / client_orders /
   (single source of truth)                            invoices / client_company_details
            │
            ├── whatsapp_threads (1 per contact)
            │       └── whatsapp_messages (inbound + outbound history)
            │
            ├── whatsapp_templates (Meta-approved templates cache)
            │
            ├── whatsapp_send_queue (rate-limited outbox, pgmq)
            │
            ├── whatsapp_broadcasts (manual campaigns, audited)
            │
            └── whatsapp_consent (opt-in / opt-out / cooldown state)
```

We already have `whatsapp_clicks`, `whatsapp_message_log`, `whatsapp_threads` — we will **reuse and extend** instead of duplicating.

---

## 2. Database changes (new + extended)

**New tables**
- `whatsapp_contacts` — canonical contact (E.164 phone PK), `user_id` (nullable, links to `profiles`), `display_name`, `country`, `source` (checkout/inquiry/manual/portal), `first_seen_at`, `last_seen_at`, `opt_in_status` (`pending` / `opted_in` / `opted_out`), `last_message_at`, `last_broadcast_at`, `tags[]`.
- `whatsapp_consent_events` — append-only log of every opt-in / opt-out / template-acceptance for compliance audit.
- `whatsapp_templates` — local cache of Meta-approved templates (name, language, category `UTILITY|MARKETING|AUTHENTICATION`, status, variables, last sync).
- `whatsapp_broadcasts` — manual broadcast campaign (name, template, audience filter, scheduled_at, status, sent/failed counts, created_by).
- `whatsapp_broadcast_recipients` — per-contact delivery row (status, wa_message_id, error).

**Extend existing**
- `whatsapp_message_log` — add `contact_id`, `template_name`, `category`, `wa_message_id`, `direction` (`in`/`out`), `status` (`queued|sent|delivered|read|failed`).
- `client_orders`, `invoices`, `leads` — already carry phone; add helper view `v_whatsapp_linked_contacts` that joins everything by E.164.

All tables get strict RLS: only `admin` / `staff` roles read/write; clients never see the CRM.

---

## 3. The 5 (and only 5) automated messages

| # | Trigger | Template category | When |
|---|---|---|---|
| 1 | Order processing started | UTILITY | `client_orders.status` → `In Progress` |
| 2 | Order completed | UTILITY | `client_orders.status` → `Completed` |
| 3 | Confirmation statement reminder | UTILITY | 30 / 14 / 3 days before due |
| 4 | Annual accounts reminder | UTILITY | 60 / 30 / 7 days before due |
| 5 | Address renewal reminder | UTILITY | 30 / 7 days before expiry |

All five are **UTILITY** templates (Meta's safest category, no opt-in required for service messages, lowest policy risk). Reuses the same scheduler that already runs email reminders — one extra channel, same dedupe logic.

---

## 4. Safety guardrails (hard-coded, not optional)

1. **Channel:** Official Meta Cloud API only. No third-party gateway, no scraping, no unofficial libs.
2. **Templates only for outbound-initiated:** Cannot send free-form unless the contact messaged us in the last 24h (Meta's customer service window).
3. **Cooldown:** No more than **1 automated message per contact per 24h**, **1 broadcast per contact per 14 days**. Enforced in DB via `last_message_at` / `last_broadcast_at` check before enqueue.
4. **Duplicate prevention:** `(contact_id, template_name, related_id)` unique key on the send queue for 7 days.
5. **Rate limit:** Outbound queue drains at **max 1 msg / 2 seconds** globally, 500/day soft cap (well under Meta's tier limits). Configurable.
6. **Opt-out honoured instantly:** Any inbound "STOP" / "UNSUBSCRIBE" flips `opt_in_status` → `opted_out` and blocks all future sends except auth/OTP.
7. **Marketing audience filter:** Broadcasts only target `opt_in_status = 'opted_in'` **AND** existing customers (have at least 1 paid order). Never cold contacts.
8. **Quiet hours:** No sends 22:00–08:00 contact-local time (use stored `country`).
9. **Audit log:** Every send, every consent change, every broadcast — immutable row.

---

## 5. Meta Cloud API setup (one-time)

1. Create Meta Business Account → WhatsApp Business Account (WABA).
2. Add the DigiFormation phone number, complete business verification.
3. Generate **permanent System User access token** (not the 24h temp token).
4. Configure webhook → new edge function `whatsapp-webhook` (verify token + signature check). Subscribe to `messages`, `message_template_status_update`, `message_status`.
5. Submit the 5 utility templates for approval (EN + UR variants).
6. Store as secrets: `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET`.

---

## 6. Edge functions

- `whatsapp-webhook` (public, signature-verified) — receives inbound messages + status callbacks, updates `whatsapp_message_log`, auto-captures unknown senders into `whatsapp_contacts`, handles STOP/START.
- `whatsapp-send` (admin-only) — single send: validates cooldown, opt-in, quiet hours, template variables, then calls Cloud API. Logs to `whatsapp_message_log`.
- `whatsapp-broadcast-dispatch` (admin-only, cron-friendly) — drains `whatsapp_broadcasts` recipients respecting global rate limit.
- `whatsapp-template-sync` (admin-only) — pulls approved templates from Meta nightly.
- Extend `send-scheduled-reminders` — after email send, enqueue matching WhatsApp utility message if contact opted-in.

---

## 7. Business OS UI (new section `/admin/whatsapp`)

- **Contacts** — searchable list, filter by source/tag/opt-in, click → drawer with linked customer, orders, invoices, message history.
- **Inbox** — unified thread view (Meta 24h window indicator), reply free-form inside window, template picker outside window.
- **Templates** — read-only list of approved Meta templates with preview.
- **Broadcasts** — create campaign: pick template → pick audience (existing-customers filter is mandatory) → schedule → preview cooldown-blocked count → confirm.
- **Reminders** — view scheduled compliance reminders before they fire.
- **Logs** — sends, deliveries, failures, opt-outs.

---

## 8. Long-term safety & scaling strategy

- **Stay in UTILITY category** for 90%+ of volume — lowest ban risk.
- **Quality rating monitoring** — daily check of WABA quality rating via Cloud API; auto-pause marketing if rating drops to `MEDIUM`.
- **Tier progression** — start at 250 unique/24h tier, naturally grow as quality stays GREEN. Don't push.
- **One number, one purpose** — keep the business number for CRM only; never paste it in mass-marketing posts.
- **Cost** — Meta charges per conversation (~$0.005–$0.04 depending on country/category). At low frequency this stays under £20/month for years.
- **At 10k contacts:** partition `whatsapp_message_log` monthly, move webhook processing to background worker, no architectural rewrite.

---

## 9. Implementation phases

1. **DB schema + RLS + types** (migration).
2. **Webhook + inbound capture** (edge function + Meta setup checklist for you).
3. **Outbound send + cooldown/opt-in enforcement**.
4. **Auto-capture from existing checkout / inquiry flows** (no UI changes needed — server-side hook on insert).
5. **5 utility automations wired into existing reminder scheduler**.
6. **Admin UI: contacts + inbox + logs**.
7. **Manual broadcast UI + dispatcher**.
8. **Template sync + quality monitor**.

---

## 10. What I need from you to start

1. Confirm you have (or will create) a **Meta Business Account + WABA** with a dedicated phone number. I cannot do this — Meta requires you personally.
2. Confirm the **5 automations list above** is the complete set (no additions).
3. Approve the schema in section 2.
4. Approve safety rules in section 4 (especially the 1-broadcast-per-14-days cap — this is intentionally conservative).

Once you approve, I'll start with phase 1 (database) and phase 2 (webhook + Meta setup checklist).
