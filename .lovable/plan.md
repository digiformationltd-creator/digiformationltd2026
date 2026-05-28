# Phase D — UI Action Wiring Roadmap

**Principle:** Business OS becomes the *control surface*. Legacy Admin remains the *engine*. Supabase stays the single source of truth. **No automation, edge function, RLS, or email template is modified in Phase D — only UI wiring.**

---

## 1. Full Action Inventory

Every action listed exists today in Legacy Admin and is already backed by a working mutation (Supabase table write or edge function). Phase D only re-exposes them inside Business OS.

| # | Action | Domain | Current execution source | Backend touchpoint |
|---|---|---|---|---|
| A1 | **Start Order** (Pending → In Progress) | Orders | Legacy admin order row button | `UPDATE client_orders.status` → triggers `order-in-progress` email |
| A2 | **Complete Order** (In Progress → Completed) | Orders | Legacy admin order row button | `UPDATE client_orders.status` → triggers `order-completed` email |
| A3 | **Generate Invoice** | Orders → Invoices | Legacy admin "Invoice" button | `generate-invoice` edge function (creates row in `invoices`, PDF to `invoices` bucket) |
| A4 | **Send Invoice Email** | Invoices | Legacy admin invoice row | `send-transactional-email` (`invoice-issued`) |
| A5 | **Mark Invoice Paid** | Invoices | Legacy admin status toggle | `UPDATE invoices.status='Paid'` → triggers `invoice-paid` email |
| A6 | **Reply to Ticket** | Support | Legacy admin reply form | `UPDATE client_tickets` + `send-transactional-email` |
| A7 | **Close Ticket** | Support | Legacy admin status button | `UPDATE client_tickets.status='Closed'` |
| A8 | **Upload Document** | Documents | Legacy admin upload | Storage `client-docs` + `INSERT client_documents` → `document-uploaded` email |
| A9 | **Sync Companies House data** | Companies | Legacy admin "Sync" | `UPDATE client_company_details` (manual fields) |
| A10 | **AD01 — Change Registered Office** | Addresses | Legacy admin address form | `UPDATE client_addresses` (start/expire/status) |
| A11 | **Mark Address Renewed** | Addresses | Legacy admin "Renew" | `UPDATE client_addresses.expire_date` |
| A12 | **Mark Lead Sold / Convert** | Leads → Clients/Orders | Legacy admin convert flow | `INSERT client_orders` + `UPDATE leads.stage='won'` + activity row |
| A13 | **Move Lead Stage** | Leads | Legacy admin Kanban | `UPDATE leads.stage, position` |
| A14 | **Auth: invite/reset/role change** | Users | Legacy admin user panel | `admin-clients` edge function + `user_roles` writes |
| A15 | **Trigger Compliance Reminder manually** | Compliance | Legacy admin button | `send-scheduled-reminders` edge function (single-target mode) |
| A16 | **Run Email System Check** | System | Legacy admin diagnostics | `send-transactional-email` (`email-system-check`) |
| A17 | **Suppress / Unsuppress Email** | System | Legacy admin email tools | `INSERT/DELETE suppressed_emails` (service role only) |
| A18 | **Cancel Order / Refund note** | Orders | Legacy admin status | `UPDATE client_orders.status='Cancelled'` + wallet txn |

---

## 2. Per-Action Wiring Spec

The spec below is identical in shape for every action. The roadmap (§5) selects which ones to wire in each wave.

For each action we will define:

- **Current execution source** — the Legacy Admin button that exists today (untouched).
- **Current API/function** — the Supabase write or edge function it already calls.
- **Business OS UI location** — where the new button/menu/drawer appears (`OsOrders`, `OsInvoices`, `OsSupport`, `OsCompanies`, `OsDocuments`, `OsLeads`).
- **Data dependencies** — rows that must be loaded before the action is enabled (e.g. Generate Invoice requires `client_orders` + linked profile).
- **Mutation flow** — exact client call (`supabase.from(...).update(...)` or `supabase.functions.invoke(...)`). **No new edge functions.**
- **Optimistic update** — update the React Query cache for that row immediately; reconcile from server response or realtime event.
- **Loading/error state** — per-row spinner on the action button, disable while pending, toast on error with retry, never blanket-block the page.
- **Permission/security** — every mutation already enforced by RLS (`has_role(auth.uid(),'admin')`). UI hides the button when `useIsAdmin()` is false. Edge-function admin gating already in place.
- **Rollback/failure** — on error, revert optimistic cache, surface the Supabase error message, leave Legacy Admin as fallback path so the user is never stuck.

### Worked example — A3 Generate Invoice

- Source: Legacy `/admin/legacy` order row → "Invoice" button.
- Function: `supabase.functions.invoke('generate-invoice', { body: { order_id } })`.
- New location: `OsOrders` row action menu + Order Drawer "Billing" tab.
- Dependencies: order row, profile (`bill_to_name/email/address`).
- Mutation: invoke edge fn; on success it returns `{ invoice_id, pdf_url }`.
- Optimistic: insert a placeholder invoice into the `invoices` query cache with status `Unpaid` and `pending=true`.
- Loading: spinner inside button; row marked "Generating…".
- Error: toast with edge-function error string; rollback placeholder; button re-enabled.
- Permission: button hidden unless admin; edge fn re-checks `admin` role server-side.
- Fallback: Legacy button still works.

The same template applies 1:1 to A1, A2, A4, A5, A6, A7, A8, A11, A12, A13, A15, A18.

---

## 3. Migration Order (safest → highest risk)

```text
Wave 1 — Read-only parity (no risk)
  - Order/Invoice/Ticket/Lead detail drawers in Business OS
  - Status badges, audit trails, linked entities
  - No mutations yet; pure visualization

Wave 2 — Idempotent single-row writes (low risk)
  A1  Start Order
  A2  Complete Order
  A7  Close Ticket
  A13 Move Lead Stage
  A11 Mark Address Renewed
  → all are single UPDATE statements already covered by RLS

Wave 3 — Email-triggering writes (medium risk; relies on existing queue)
  A5  Mark Invoice Paid          (fires invoice-paid)
  A6  Reply to Ticket            (fires ticket reply email if template exists)
  A18 Cancel Order

Wave 4 — Edge-function-backed actions (higher risk; needs robust error UI)
  A3  Generate Invoice
  A4  Send Invoice Email
  A8  Upload Document
  A15 Trigger Compliance Reminder
  A16 Email System Check

Wave 5 — Cross-entity / state-machine actions (highest risk)
  A12 Mark Lead Sold → creates client_orders row, updates lead, logs activity
  A10 AD01 Change Registered Office
  A9  Sync Companies House details

Wave 6 — Auth & sensitive ops (last, behind explicit confirm dialogs)
  A14 Invite / reset / role change
  A17 Email suppression management
```

Rule: a wave does not start until the previous wave is verified in production with Legacy fallback still enabled.

---

## 4. UI Architecture Recommendations

- **Inline row actions** — one primary action per row (`Start`, `Complete`, `Invoice`, `Reply`). Anything destructive or multi-field goes into a drawer.
- **Action drawers** — right-side `Sheet` per entity (`OrderDrawer`, `InvoiceDrawer`, `TicketDrawer`, `LeadDrawer`). Holds detail tabs + a sticky action bar at the bottom.
- **Batch actions** — checkbox column on Orders / Invoices / Leads. Bulk bar appears when ≥1 row selected: Bulk Start, Bulk Complete, Bulk Mark Paid, Bulk Move Stage. Backed by sequential calls with a single toast summary; no new RPC.
- **Sticky workflow controls** — drawer footer pinned with primary CTA always visible on mobile.
- **Keyboard efficiency** — `j/k` row navigation, `enter` opens drawer, `s` start, `c` complete, `i` invoice, `r` reply, `esc` close drawer. Implement via a shared `useHotkeys` in BusinessOSLayout.
- **Mobile behavior** — row swipe → action menu; drawer becomes full-screen sheet; bulk-select disabled below `md`. Logo and topbar already responsive.

---

## 5. State Architecture

- **React Query** is the single client cache. Each entity gets one query key: `['orders']`, `['invoices']`, `['tickets']`, `['leads']`, `['addresses']`.
- **Mutation pattern**: `useMutation` with `onMutate` (optimistic patch), `onError` (rollback + toast), `onSettled` (invalidate the entity key only — never the world).
- **Realtime** (already enabled in project) subscribes per page to `postgres_changes` for the relevant table and calls `queryClient.setQueryData` to merge — keeps multi-admin sessions consistent without polling.
- **Cache ownership**: a row is owned by exactly one query key. Drawers read from the same cache (no parallel fetch).
- **Derived DB fields** (e.g. `invoices.total_gbp`, `replies_count`, `unread_count`) are never computed client-side after a mutation; the UI re-reads the row from realtime or the mutation's `returning` payload. This avoids drift.

---

## 6. Technical Debt Risks & Mitigations

| Risk | Where it appears | Mitigation |
|---|---|---|
| **Legacy coupling** — same button exists in both UIs | Waves 2-5 | Keep Legacy as fallback during wave; remove only after 1 week of clean telemetry |
| **Duplicated mutations** drifting apart | A3, A5, A12 | Both UIs MUST call the same edge function / same UPDATE. No business logic in Business OS components — only call sites |
| **Race conditions** (two admins acting on same row) | A1, A2, A5, A13 | Rely on realtime to refresh; mutations are idempotent (`status='Completed'` twice is a no-op) |
| **Stale UI** after edge function side-effects (email queue, PDF) | A3, A4, A8 | Use realtime on `invoices` + `email_send_log` to update row badges (`Generating…`, `Sent`, `Failed`) |
| **Optimistic rollback gaps** on edge-fn errors | Wave 4 | Always wrap invoke in try/catch and revert cache in `onError`; never assume success |
| **Permission drift** (button visible to non-admin) | All waves | Single `useIsAdmin()` hook gates every action; server-side RLS is the real guard |

---

## 7. Final Target Architecture

**Fully migrates into Business OS** (Legacy buttons eventually retired):
- All order lifecycle actions (A1, A2, A18)
- All invoice actions (A3, A4, A5)
- Support reply/close (A6, A7)
- Document upload (A8)
- Lead pipeline + conversion (A12, A13)
- Address renewal & AD01 (A10, A11)
- Manual compliance reminder trigger (A15)

**Stays available in Legacy Admin as fallback / power-user tools** (not removed):
- Email system check (A16)
- Suppression management (A17)
- Bulk data corrections / raw table edits
- Anything not yet covered by a Business OS screen

**Must NEVER move out of the existing backend layer**:
- The edge functions themselves (`send-transactional-email`, `generate-invoice`, `process-email-queue`, `send-scheduled-reminders`, `admin-clients`, `auth-email-hook`)
- React Email templates and the `TEMPLATES` registry
- pgmq queues, `enqueue_email` / `read_email_batch` / `move_to_dlq` RPCs
- RLS policies and `has_role()` security definer
- The cron schedule for `process-email-queue` and reminders
- Supabase auth configuration and the single client instance

---

## 8. Execution Roadmap (step-by-step)

1. **Scaffold shared primitives** — `useEntityMutation`, `useIsAdmin`, `RowActionMenu`, `EntityDrawer`, `BulkActionBar`, `useHotkeys`. No backend changes.
2. **Wave 1**: build read-only drawers for Orders, Invoices, Tickets, Leads. Ship.
3. **Wave 2**: wire A1, A2, A7, A11, A13 using the shared primitives. Keep Legacy buttons. Ship and observe for 3-7 days.
4. **Wave 3**: wire A5, A6, A18. Verify email queue still drains cleanly via `email_send_log`. Ship.
5. **Wave 4**: wire A3, A4, A8, A15, A16. Add realtime subscription on `invoices` and `email_send_log` for live status. Ship.
6. **Wave 5**: wire A9, A10, A12 inside dedicated drawers with confirm dialogs and activity logging.
7. **Wave 6**: wire A14, A17 behind a `Settings → Admin Tools` area with double-confirm.
8. **Retire Legacy buttons one wave at a time** only after the corresponding Business OS path has shown zero error-rate increase for one week.
9. **Final state**: Legacy Admin remains mounted at `/admin/legacy` as an always-available escape hatch; Business OS is the daily driver.

**No automation engine, no edge function, no RLS policy, no email template, and no Supabase config is modified at any step of this roadmap.**
