# Unified Checkout, Pricing & Invoice System

## Goal

Every service on the website routes through the same priced checkout flow that powers LTD ID Verification today. Orders are created with the correct amount, an unpaid invoice is generated and emailed automatically, and the customer can download it from their portal. No service may create a £0 order while it has a defined price.

## What's wrong today

- `DynamicServicePage` (the template behind dozens of UK Services, UK Compliance, USA Services and Banking pages) routes its only CTA to `/contact`. That hits the inquiry-mirror trigger and produces a `client_orders` row with `amount_gbp = 0` and `status = 'Inquiry'`.
- `ServicePage` (UTR, Registered Office Address, etc.) and `SimplePage` also CTA into `/contact`.
- `UsaServicePage` already links to `/checkout` but only passes `title` + `service` — the checkout has no catalog entry, so the amount falls back to 0.
- The compliance catalog inside `Checkout.tsx` is hard-coded and out of sync with `src/data/compliance.ts` (the real published prices).
- Web Development / packages CTAs in `CorePages.tsx` go to `/contact`.

## Solution overview

One central service price catalog → every service page CTAs into `/checkout?service=<slug>` (or its dedicated checkout for LTD / LLC / Banking / IDV) → `CheckoutFlow` collects details and creates the order with the real price → `generate-invoice` runs as it already does for IDV → invoice email + portal download.

## Implementation

### 1. Central service catalog (single source of truth)

Create `src/data/serviceCatalog.ts` exporting one `SERVICE_CATALOG` keyed by slug. Each entry: `slug`, `name`, `price` (GBP), `currency`, `category`, `description`, optional `fields` (extra checkout sections — e.g. CRN, company name).

Seed from existing data:
- UK Services: register LTD (uses dedicated jurisdiction flow), ID Verification (existing flow), Registered Office (£40), Confirmation Statement Filing (£60), UTR (£50), Auth Code, Activation Code, UK VAT (£70), etc.
- UK Compliance: all 9 entries from `src/data/compliance.ts` with their real prices.
- USA Services: EIN, ITIN, Annual Tax, BOI from `src/data/usaServices.ts` (price already numeric).
- Banking: per-provider setup prices from `src/data/navigation.ts`.
- Web Development / Packages: every pricing tier on `/web-development` and `/pricing` becomes a catalog entry.

`Checkout.tsx` is rewritten to look up `?service=<slug>` in `SERVICE_CATALOG` and feed the matched item into `CheckoutFlow` with `lockSelection` + `fixed: true` — exactly like the IDV checkout. Multi-add-on groups (UK Address bundle, multi-pick UK Compliance) keep their existing multi-select catalog but read prices from the catalog.

### 2. Service page CTAs

- `ServicePage` template: replace the `/contact` CTA with `/checkout?service=<slug>&title=...`. Pull `slug` + `price` from the catalog; render the real price on the button ("Order now — £50"). Fallback "Talk to us" link kept as a secondary ghost button only when the service has no price (rare).
- `DynamicServicePage`: same — resolve the slug from its `path`, look up the catalog entry, render priced CTA. If a slug has no catalog entry it falls back to inquiry (so nothing breaks), but every shipped service will have an entry.
- `UsaServicePage`: pass `?service=<slug>` so checkout finds the price (no more 0).
- `CompliancePage`: already builds `/checkout?items=...` — switch the catalog inside `Checkout.tsx` to read from the central catalog so prices match the marketing page.
- `CorePages.tsx` (web dev, packages, custom services): replace `/contact` CTAs with `/checkout?service=<package-slug>`.
- `RegisteredOfficeAddress`, `UtrCodes`, `BlogPost`, `InsightPage`, `SimplePage`, `NotFound`, `DigiCTA`: secondary "Talk to us" links can stay, but every primary "Get started/Order" CTA becomes a checkout link. WhatsApp float untouched.

### 3. Checkout + order creation (no functional change, just labelling)

`CheckoutFlow` already creates the order via `generate-invoice` with the selected items' prices. Confirm:
- `source = 'checkout'`, `payment_status = 'unpaid'` (already set in last migration).
- `amount_gbp` = sum of selected items (already correct when prices are real).
- `status = 'New'` (not `Inquiry`).

### 4. Invoice generation

Already implemented inside `generate-invoice` edge function (PDF stored in `invoices` bucket, row in `invoices`, email sent via `send-transactional-email` → `invoice-issued` template). No code change needed beyond confirming it fires for every checkout. The client portal Orders page already exposes invoice download — verify it shows the new orders.

### 5. Contact form stays as a last-resort inquiry channel

`/contact` keeps creating inquiry orders via the existing trigger (so no submission is ever lost), but it is no longer the primary CTA for any priced service. Inquiry orders now only appear for genuine "talk to us" submissions, custom quotes, and WhatsApp escalations.

### 6. Backfill / cleanup (data only, optional)

Existing £0 `Inquiry` orders for Zion and others remain in the system (as agreed last turn). No retroactive re-pricing — they were genuinely inquiries. Going forward, every new submission carries the right price.

### 7. Guardrail

Add a brief comment at the top of `serviceCatalog.ts`:

> Every new service must be added here with its price. Service pages must CTA to `/checkout?service=<slug>`. Do not add new `/contact` CTAs for priced services.

## Files touched

- **new** `src/data/serviceCatalog.ts` — central price catalog
- `src/pages/Checkout.tsx` — read catalog by slug, lock single-service checkout, keep multi-select groups
- `src/components/ServicePage.tsx` — priced CTA from catalog
- `src/pages/DynamicServicePage.tsx` — pass slug + price into ServicePage
- `src/pages/UsaServicePage.tsx` — checkout link carries `?service=<slug>`
- `src/pages/CompliancePage.tsx` — verify slug mapping matches catalog
- `src/pages/RegisteredOfficeAddress.tsx`, `src/pages/UtrCodes.tsx`, `src/pages/CorePages.tsx` (web dev + packages), `src/components/SimplePage.tsx`, `src/components/DigiCTA.tsx` — primary CTA → checkout
- No database migrations required — schema already supports this.
- No edge function changes — `generate-invoice` already creates priced orders + invoices.

## Out of scope

- Payment collection (Stripe/Paddle). Orders stay `unpaid` until you wire a provider — separate request.
- WhatsApp float / `wa.me` links — remain inquiry-only as agreed.
- Past £0 inquiry orders — left untouched.
