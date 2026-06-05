
-- 1. Service price resolver (fuzzy)
CREATE OR REPLACE FUNCTION public.resolve_service_price(_title text)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  match_price numeric;
  norm text;
BEGIN
  IF _title IS NULL OR length(trim(_title)) = 0 THEN
    RETURN NULL;
  END IF;
  -- normalize: lowercase, drop em-dash tails, collapse spaces
  norm := lower(_title);
  SELECT s.price_gbp
    INTO match_price
    FROM public.services s
   WHERE position(lower(s.name) IN norm) > 0
   ORDER BY length(s.name) DESC
   LIMIT 1;
  RETURN match_price;
END;
$$;

-- 2. Updated inquiry-to-order mirror: store resolved price (default 0 if unknown)
CREATE OR REPLACE FUNCTION public.mirror_inquiry_to_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  matched_user_id UUID;
  new_ref TEXT;
  resolved_price numeric;
BEGIN
  IF EXISTS (SELECT 1 FROM public.client_orders WHERE inquiry_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO matched_user_id
  FROM public.profiles
  WHERE NEW.email IS NOT NULL AND lower(email) = lower(NEW.email)
  LIMIT 1;

  new_ref := 'GBQ' || to_char(now(), 'DDMM') || lpad(public.next_order_number()::text, 6, '0');
  resolved_price := COALESCE(public.resolve_service_price(NEW.service), 0);

  INSERT INTO public.client_orders (
    user_id, order_ref, service, amount_gbp, status,
    customer_name, customer_email, customer_whatsapp, country_code,
    notes, source, payment_status, inquiry_id
  ) VALUES (
    matched_user_id,
    new_ref,
    COALESCE(NULLIF(trim(NEW.service), ''), 'General Inquiry'),
    resolved_price,
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
  RAISE WARNING 'mirror_inquiry_to_order failed for submission %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- 3. Hard guard: checkout orders must have a positive amount
CREATE OR REPLACE FUNCTION public.enforce_checkout_amount()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.source = 'checkout'
     AND (NEW.amount_gbp IS NULL OR NEW.amount_gbp <= 0) THEN
    RAISE EXCEPTION 'Checkout orders must have a positive amount (got %)', NEW.amount_gbp
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_checkout_amount_trg ON public.client_orders;
CREATE TRIGGER enforce_checkout_amount_trg
BEFORE INSERT OR UPDATE OF amount_gbp, source ON public.client_orders
FOR EACH ROW EXECUTE FUNCTION public.enforce_checkout_amount();

-- 4. Backfill historical inquiry orders that have a resolvable catalog price
UPDATE public.client_orders co
   SET amount_gbp = public.resolve_service_price(co.service)
 WHERE co.source = 'inquiry'
   AND (co.amount_gbp IS NULL OR co.amount_gbp = 0)
   AND public.resolve_service_price(co.service) IS NOT NULL
   AND public.resolve_service_price(co.service) > 0;
