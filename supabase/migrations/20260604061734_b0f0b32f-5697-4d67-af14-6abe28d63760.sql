-- 1. Schema additions on client_orders
ALTER TABLE public.client_orders
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'checkout',
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS inquiry_id UUID REFERENCES public.contact_submissions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_client_orders_source ON public.client_orders(source);
CREATE INDEX IF NOT EXISTS idx_client_orders_inquiry_id ON public.client_orders(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_client_orders_payment_status ON public.client_orders(payment_status);

-- 2. Trigger function: mirror every inquiry into an order
CREATE OR REPLACE FUNCTION public.mirror_inquiry_to_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  matched_user_id UUID;
  new_ref TEXT;
BEGIN
  -- Skip if an order already exists for this inquiry id (defensive)
  IF EXISTS (SELECT 1 FROM public.client_orders WHERE inquiry_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO matched_user_id
  FROM public.profiles
  WHERE NEW.email IS NOT NULL AND lower(email) = lower(NEW.email)
  LIMIT 1;

  new_ref := 'GBQ' || to_char(now(), 'DDMM') || lpad(public.next_order_number()::text, 6, '0');

  INSERT INTO public.client_orders (
    user_id, order_ref, service, amount_gbp, status,
    customer_name, customer_email, customer_whatsapp, country_code,
    notes, source, payment_status, inquiry_id
  ) VALUES (
    matched_user_id,
    new_ref,
    COALESCE(NULLIF(trim(NEW.service), ''), 'General Inquiry'),
    0,
    'Inquiry',
    NEW.full_name,
    NEW.email,
    NEW.whatsapp,
    NEW.country,
    NEW.message,
    'inquiry',
    'n/a',
    NEW.id
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block contact_submissions insert if the mirror fails
  RAISE WARNING 'mirror_inquiry_to_order failed for submission %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mirror_inquiry_to_order ON public.contact_submissions;
CREATE TRIGGER trg_mirror_inquiry_to_order
AFTER INSERT ON public.contact_submissions
FOR EACH ROW EXECUTE FUNCTION public.mirror_inquiry_to_order();

-- 3. Backfill historical inquiries that have no matching order
INSERT INTO public.client_orders (
  user_id, order_ref, service, amount_gbp, status,
  customer_name, customer_email, customer_whatsapp, country_code,
  notes, source, payment_status, inquiry_id, created_at
)
SELECT
  (SELECT user_id FROM public.profiles WHERE cs.email IS NOT NULL AND lower(email) = lower(cs.email) LIMIT 1),
  'GBQ' || to_char(cs.created_at, 'DDMM') || lpad(public.next_order_number()::text, 6, '0'),
  COALESCE(NULLIF(trim(cs.service), ''), 'General Inquiry'),
  0,
  'Inquiry',
  cs.full_name,
  cs.email,
  cs.whatsapp,
  cs.country,
  cs.message,
  'inquiry',
  'n/a',
  cs.id,
  cs.created_at
FROM public.contact_submissions cs
WHERE NOT EXISTS (
  SELECT 1 FROM public.client_orders co
  WHERE co.inquiry_id = cs.id
     OR (cs.email IS NOT NULL
         AND co.customer_email IS NOT NULL
         AND lower(co.customer_email) = lower(cs.email)
         AND abs(extract(epoch from (co.created_at - cs.created_at))) < 300)
);

-- 4. Future-proofing comment
COMMENT ON TABLE public.contact_submissions IS
  'Every insert here is mirrored into client_orders by trg_mirror_inquiry_to_order. Any new submission form may insert freely; the order pipeline follows automatically. Do NOT add new submission tables without applying the same mirror trigger.';

COMMENT ON COLUMN public.client_orders.source IS
  'Origin of the order. Values: checkout (paid checkout flow), inquiry (auto-created from contact_submissions), manual (admin-created), whatsapp (reserved).';

COMMENT ON COLUMN public.client_orders.payment_status IS
  'Payment state. Values: unpaid, paid, refunded, n/a (for free inquiries).';