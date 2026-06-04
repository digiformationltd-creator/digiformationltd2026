
## Goal

Every service-related submission on the website must appear as an **Order** in the Orders dashboard and (when the customer has an account) in the Client Portal. The only exception is direct WhatsApp chat clicks, which stay in Leads/Enquiries only.

## Root cause (today)

- The **Checkout flow** (`/checkout`, `/banking-checkout`) already creates `client_orders` + `invoices` via the `generate-invoice` edge function. ✅
- The **Contact form** (`/contact` and any service-page inquiry form that posts to it) only inserts into `contact_submissions`. It never creates an order row. ❌ This is why Zion's 4 "Confirmation Statement Filing" inquiries are invisible in both portal and dashboard.

## Solution (two layers — defence in depth)

### Layer 1 — Database trigger (guarantees no submission is ever missed, now or in the future)

Add an `AFTER INSERT` trigger on `public.contact_submissions` that automatically creates a matching row in `public.client_orders`:

- `source = 'inquiry'` (new column)
- `status = 'Inquiry'`
- `customer_name`, `customer_email`, `customer_whatsapp`, `country`, `service`, `notes` copied from the submission
- `order_ref` generated via the existing `next_order_number()` sequence with a `GBQ` prefix (Q = inquiry, distinct from `GBLTD`/`GBBNK`/`GBCS` etc.)
- `user_id` auto-linked if a profile already exists for that email (mirrors `handle_new_user` logic)
- `amount_gbp = 0` (no payment yet)

Because the trigger sits at the database layer, **every** current form, every future form, every new service page, and every edge function that writes to `contact_submissions` will automatically produce an order — impossible to bypass by accident.

### Layer 2 — Schema additions on `client_orders`

- Add `source TEXT NOT NULL DEFAULT 'checkout'` — values: `checkout`, `inquiry`, `manual`, `whatsapp` (reserved, never auto-populated).
- Add `payment_status TEXT NOT NULL DEFAULT 'unpaid'` — values: `unpaid`, `paid`, `refunded`, `n/a`.
- Add `inquiry_id UUID REFERENCES contact_submissions(id) ON DELETE SET NULL` — links the order back to its originating inquiry so admins can see the full history.
- Update existing `generate-invoice` edge function to set `source = 'checkout'`, `payment_status = 'unpaid'` (no behavioural change, just labelling).

### Layer 3 — Backfill historical inquiries

One-time data migration: for every `contact_submissions` row that does **not** already have a matching `client_orders` row (matched by email + close timestamp), create the missing order with `source = 'inquiry'`. This recovers Zion's 4 missing orders and any others from earlier customers.

### Layer 4 — Frontend audit and admin UI

1. **Admin Orders dashboard** — add `Source` and `Payment Status` columns + filters so the team can separate paid orders from inquiries at a glance, while still working from a single pipeline.
2. **Client Portal Orders page** — show all the user's orders regardless of source (inquiry rows appear with a clear "Inquiry — Awaiting Quote" badge).
3. **Service page audit** — verify every service page across Company Formation, Business Bank Account, UK Compliance, UK Services, USA Services, Web Development, Digital Services, and all packages has either a direct "Order Now" → `/checkout` CTA or routes through the contact form (which now auto-creates an order). Document any page that still only links to WhatsApp.
4. **WhatsApp exception preserved** — `WhatsAppFloat`, direct `wa.me` links, and `whatsapp_clicks` table stay untouched. No order created.

### Layer 5 — Future-proofing rule

Add a short developer note at the top of `contact_submissions` usages and a SQL comment on the table:

> Every insert into `contact_submissions` is mirrored into `client_orders` by a trigger. Any new service form may insert here freely; the order pipeline will follow automatically. Do NOT add new submission tables without applying the same mirror trigger.

## Technical details

**New migration** (one file):

```sql
-- Schema additions
ALTER TABLE public.client_orders
  ADD COLUMN source TEXT NOT NULL DEFAULT 'checkout',
  ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid',
  ADD COLUMN inquiry_id UUID REFERENCES public.contact_submissions(id) ON DELETE SET NULL;

CREATE INDEX idx_client_orders_source ON public.client_orders(source);
CREATE INDEX idx_client_orders_inquiry_id ON public.client_orders(inquiry_id);

-- Trigger function: mirror every inquiry into an order
CREATE OR REPLACE FUNCTION public.mirror_inquiry_to_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matched_user_id UUID;
  new_ref TEXT;
BEGIN
  SELECT user_id INTO matched_user_id
  FROM public.profiles
  WHERE lower(email) = lower(NEW.email)
  LIMIT 1;

  new_ref := 'GBQ' || to_char(now(), 'DDMM') || lpad(public.next_order_number()::text, 6, '0');

  INSERT INTO public.client_orders (
    user_id, order_ref, service, amount_gbp, status,
    customer_name, customer_email, customer_whatsapp, country_code,
    notes, source, payment_status, inquiry_id
  ) VALUES (
    matched_user_id, new_ref, COALESCE(NEW.service, 'General Inquiry'), 0, 'Inquiry',
    NEW.full_name, NEW.email, NEW.whatsapp, NEW.country,
    NEW.message, 'inquiry', 'n/a', NEW.id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mirror_inquiry_to_order
AFTER INSERT ON public.contact_submissions
FOR EACH ROW EXECUTE FUNCTION public.mirror_inquiry_to_order();

-- Backfill historical inquiries that have no matching order
INSERT INTO public.client_orders (
  user_id, order_ref, service, amount_gbp, status,
  customer_name, customer_email, customer_whatsapp, country_code,
  notes, source, payment_status, inquiry_id, created_at
)
SELECT
  (SELECT user_id FROM public.profiles WHERE lower(email) = lower(cs.email) LIMIT 1),
  'GBQ' || to_char(cs.created_at, 'DDMM') || lpad(public.next_order_number()::text, 6, '0'),
  COALESCE(cs.service, 'General Inquiry'), 0, 'Inquiry',
  cs.full_name, cs.email, cs.whatsapp, cs.country,
  cs.message, 'inquiry', 'n/a', cs.id, cs.created_at
FROM public.contact_submissions cs
WHERE NOT EXISTS (
  SELECT 1 FROM public.client_orders co
  WHERE co.inquiry_id = cs.id
     OR (lower(co.customer_email) = lower(cs.email)
         AND abs(extract(epoch from (co.created_at - cs.created_at))) < 300)
);

COMMENT ON TABLE public.contact_submissions IS
  'Every insert here is mirrored into client_orders by trg_mirror_inquiry_to_order. Any new submission form may insert freely; the order pipeline follows automatically.';
```

**Frontend changes**:

- `src/businessos/pages/OsClientOrders.tsx` (admin Orders dashboard) — add Source + Payment Status columns and filter chips.
- Client portal Orders page — render an "Inquiry — Awaiting Quote" badge when `source = 'inquiry'`.
- `generate-invoice` edge function — explicitly write `source: 'checkout'`, `payment_status: 'unpaid'`.

**Code audit** (read-only, no behaviour change unless something is broken):

- Walk every service page (`UKLtdFormation`, `RegisteredOfficeAddress`, `UtrCodes`, `BankingCheckout`, `ServicePage` template, USA service pages, Web Dev pages, Digital service pages, Compliance pages) and confirm each has a CTA that ends in either `/checkout?...` (real order) or the contact form (auto-creates inquiry order).
- Report anything that only links to WhatsApp or has no CTA, so you can decide whether to add a Checkout CTA.

## What this delivers

- Zion's 4 missing inquiries appear in both Orders dashboard and Client Portal immediately after backfill runs.
- Every future inquiry from anywhere on the site automatically becomes an order — no code change required for new forms.
- Real paid checkout orders and unpaid inquiries live in the same pipeline but are clearly distinguishable via `source` and `payment_status` filters.
- WhatsApp-only conversations remain leads/enquiries, never orders.
- A SQL-level guarantee that no future developer (or AI) can accidentally add a service form that bypasses the Orders pipeline.
