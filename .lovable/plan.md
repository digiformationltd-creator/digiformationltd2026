## Goal

Make every order on the website (banking, contact-form, USA LLC, UK address, compliance, etc.) behave like UK LTD / ID Verification:

1. On submission → auto-create invoice + send order confirmation email to client + notification to admin
2. In admin panel → show **per-order action buttons** for every order:
   - 💰 **Payment Received** (sends `invoice-paid` email)
   - ⏳ **Payment Pending** (sends invoice/reminder email)
   - 🚀 **Order Started / In Progress** (sends `order-in-progress`)
   - ✅ **Order Completed** (sends `order-completed`)
3. Extend UK Compliance forms to collect the exact requirements listed on each page (e.g. Company Name Change → Director's Companies House Personal Code, Company Number, Authentication Code).

---

## Plan

### Step 1 — Unified order intake on every form
- Update all checkout/contact flows that currently only insert into `contact_submissions` to also insert a row into `client_orders` (when user is logged in) and trigger `generate-invoice` + `order-confirmation` email — same pattern as UK LTD checkout.
- Affected flows: `BankingCheckout`, `UsaLlcCheckout`, `CheckoutFlow` (UK address + compliance), contact form on `CompliancePage`/`BankingProviderPage`.
- Guests: still send confirmation email + create draft invoice tied to email (no user_id).

### Step 2 — Admin per-order action buttons
- In `src/pages/Admin.tsx`, refactor the orders table so **every row** (not just LTD/IDV) shows 4 inline status buttons:
  - Payment Received → set order `status='Paid'`, mark invoice paid, send `invoice-paid`
  - Payment Pending → set `status='Pending'`, send invoice + reminder
  - In Progress → set `status='In Progress'`, send `order-in-progress`
  - Completed → set `status='Completed'`, send `order-completed`
- Buttons are status-aware (disabled / highlighted based on current status) and work for any `service` value.

### Step 3 — UK Compliance forms gather real requirements
- Add a `formFields` array to each compliance page in `src/data/compliance.ts` declaring extra fields needed (e.g. for "Company Name Change": `company_number`, `director_personal_code`, `auth_code`, `new_company_name`).
- Update `CheckoutFlow` (used by compliance checkout) to render these dynamic fields under the existing notes section and persist them into order `notes` / a new JSON column.
- For now keep it simple: store as JSON inside `client_orders.notes` (no schema change needed) and show them to admin in the order detail drawer.

### Step 4 — Email templates
- Reuse existing templates: `order-confirmation`, `order-notification`, `order-in-progress`, `order-completed`, `invoice-issued`, `invoice-paid`.
- No new templates needed.

---

## Scope confirmation

Before I build, two quick clarifications because this touches ~10 files and the database:

1. **Guest orders (not logged in):** when someone submits a banking/contact form without an account, should the invoice still be auto-generated and emailed, or only after they create an account? (Currently UK LTD requires login.)
2. **Compliance form fields:** Should I add fields for **all** compliance services in one go (name change, confirmation statement, annual accounts, dormant, VAT, UTR), or start with just **Company Name Change** as a template and you review before I do the rest?

Once you answer these, I'll implement everything in one pass.