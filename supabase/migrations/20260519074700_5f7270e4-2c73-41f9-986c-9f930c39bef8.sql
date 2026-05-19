
-- ============ AFFILIATE PROGRAM SCHEMA ============

-- 1) Profiles
CREATE TABLE public.affiliate_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  ref_code text NOT NULL UNIQUE,
  name_slug text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | suspended
  commission_per_sale_gbp numeric NOT NULL DEFAULT 15,
  payout_method text,
  payout_details text,
  total_clicks integer NOT NULL DEFAULT 0,
  total_signups integer NOT NULL DEFAULT 0,
  total_paid_orders integer NOT NULL DEFAULT 0,
  lifetime_commission_gbp numeric NOT NULL DEFAULT 0,
  pending_commission_gbp numeric NOT NULL DEFAULT 0,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_affiliate_profiles_user ON public.affiliate_profiles(user_id);
CREATE INDEX idx_affiliate_profiles_ref ON public.affiliate_profiles(ref_code);

ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own affiliate profile" ON public.affiliate_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own affiliate profile" ON public.affiliate_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update payout details on own profile" ON public.affiliate_profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage affiliate profiles" ON public.affiliate_profiles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER affiliate_profiles_updated
  BEFORE UPDATE ON public.affiliate_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Clicks
CREATE TABLE public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code text NOT NULL,
  page_path text,
  referrer text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_affiliate_clicks_ref ON public.affiliate_clicks(ref_code);
CREATE INDEX idx_affiliate_clicks_date ON public.affiliate_clicks(created_at DESC);

ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a click" ON public.affiliate_clicks
  FOR INSERT WITH CHECK (
    char_length(ref_code) BETWEEN 3 AND 60
    AND (page_path IS NULL OR char_length(page_path) <= 500)
    AND (referrer IS NULL OR char_length(referrer) <= 1000)
    AND (user_agent IS NULL OR char_length(user_agent) <= 500)
  );
CREATE POLICY "Affiliate views own clicks" ON public.affiliate_clicks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.affiliate_profiles ap WHERE ap.ref_code = affiliate_clicks.ref_code AND ap.user_id = auth.uid())
  );
CREATE POLICY "Admins manage clicks" ON public.affiliate_clicks
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3) Referrals (one per customer)
CREATE TABLE public.affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code text NOT NULL,
  affiliate_user_id uuid NOT NULL,
  customer_user_id uuid NOT NULL UNIQUE,
  attributed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_affiliate_referrals_aff ON public.affiliate_referrals(affiliate_user_id);
CREATE INDEX idx_affiliate_referrals_customer ON public.affiliate_referrals(customer_user_id);

ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliate views own referrals" ON public.affiliate_referrals
  FOR SELECT USING (auth.uid() = affiliate_user_id);
CREATE POLICY "Authenticated user can attribute self once" ON public.affiliate_referrals
  FOR INSERT WITH CHECK (auth.uid() = customer_user_id);
CREATE POLICY "Admins manage referrals" ON public.affiliate_referrals
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 4) Commissions
CREATE TABLE public.affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id uuid NOT NULL,
  customer_user_id uuid NOT NULL,
  order_id uuid,
  order_ref text,
  service text,
  retail_amount_gbp numeric NOT NULL DEFAULT 0,
  commission_gbp numeric NOT NULL DEFAULT 15,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | paid | cancelled
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  paid_at timestamptz,
  notes text
);
CREATE INDEX idx_affiliate_commissions_aff ON public.affiliate_commissions(affiliate_user_id);
CREATE INDEX idx_affiliate_commissions_order ON public.affiliate_commissions(order_id);

ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliate views own commissions" ON public.affiliate_commissions
  FOR SELECT USING (auth.uid() = affiliate_user_id);
CREATE POLICY "Admins manage commissions" ON public.affiliate_commissions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 5) Helper: generate a unique ref code from a display name
CREATE OR REPLACE FUNCTION public.generate_affiliate_ref_code(_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base text;
  candidate text;
  attempt int := 0;
BEGIN
  base := regexp_replace(lower(coalesce(split_part(trim(_name), ' ', 1), '')), '[^a-z0-9]', '', 'g');
  IF base = '' OR base IS NULL THEN base := 'partner'; END IF;
  IF length(base) > 16 THEN base := substring(base from 1 for 16); END IF;

  LOOP
    candidate := base || '-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 4));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.affiliate_profiles WHERE ref_code = candidate);
    attempt := attempt + 1;
    IF attempt > 10 THEN
      candidate := base || '-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
      EXIT;
    END IF;
  END LOOP;
  RETURN candidate;
END;
$$;

-- 6) Trigger on client_orders → create commission if customer was referred
CREATE OR REPLACE FUNCTION public.create_affiliate_commission_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref record;
  comm_amt numeric;
BEGIN
  SELECT r.affiliate_user_id, r.ref_code, ap.commission_per_sale_gbp, ap.status
    INTO ref
  FROM public.affiliate_referrals r
  JOIN public.affiliate_profiles ap ON ap.user_id = r.affiliate_user_id
  WHERE r.customer_user_id = NEW.user_id;

  IF ref.affiliate_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF ref.status <> 'approved' THEN
    RETURN NEW;
  END IF;

  comm_amt := COALESCE(ref.commission_per_sale_gbp, 15);

  INSERT INTO public.affiliate_commissions(
    affiliate_user_id, customer_user_id, order_id, order_ref, service,
    retail_amount_gbp, commission_gbp, status
  ) VALUES (
    ref.affiliate_user_id, NEW.user_id, NEW.id, NEW.order_ref, NEW.service,
    NEW.amount_gbp, comm_amt, 'pending'
  );

  UPDATE public.affiliate_profiles
     SET pending_commission_gbp = pending_commission_gbp + comm_amt,
         total_paid_orders = total_paid_orders + 1
   WHERE user_id = ref.affiliate_user_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_client_orders_affiliate_commission
  AFTER INSERT ON public.client_orders
  FOR EACH ROW EXECUTE FUNCTION public.create_affiliate_commission_on_order();

-- 7) Trigger on referrals → bump signup counter
CREATE OR REPLACE FUNCTION public.bump_affiliate_signups()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.affiliate_profiles
     SET total_signups = total_signups + 1
   WHERE user_id = NEW.affiliate_user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_affiliate_referrals_bump
  AFTER INSERT ON public.affiliate_referrals
  FOR EACH ROW EXECUTE FUNCTION public.bump_affiliate_signups();

-- 8) Trigger on commission status change → keep aggregates correct
CREATE OR REPLACE FUNCTION public.sync_affiliate_commission_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- moving to paid: subtract from pending, add to lifetime
    IF NEW.status = 'paid' AND OLD.status <> 'paid' THEN
      UPDATE public.affiliate_profiles
         SET pending_commission_gbp = GREATEST(pending_commission_gbp - NEW.commission_gbp, 0),
             lifetime_commission_gbp = lifetime_commission_gbp + NEW.commission_gbp
       WHERE user_id = NEW.affiliate_user_id;
    ELSIF NEW.status = 'cancelled' AND OLD.status = 'pending' THEN
      UPDATE public.affiliate_profiles
         SET pending_commission_gbp = GREATEST(pending_commission_gbp - NEW.commission_gbp, 0)
       WHERE user_id = NEW.affiliate_user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_affiliate_commissions_sync
  AFTER UPDATE ON public.affiliate_commissions
  FOR EACH ROW EXECUTE FUNCTION public.sync_affiliate_commission_totals();
