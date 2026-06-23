
-- 1) client_company_details: block non-admin writes to sensitive credential columns
CREATE OR REPLACE FUNCTION public.protect_company_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.auth_code IS DISTINCT FROM OLD.auth_code
     OR NEW.activation_code IS DISTINCT FROM OLD.activation_code
     OR NEW.utr_number IS DISTINCT FROM OLD.utr_number
     OR NEW.companies_house_personal_code IS DISTINCT FROM OLD.companies_house_personal_code THEN
    RAISE EXCEPTION 'Sensitive credential fields are admin-managed and cannot be changed by clients'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS client_company_protect_sensitive ON public.client_company_details;
CREATE TRIGGER client_company_protect_sensitive
  BEFORE UPDATE ON public.client_company_details
  FOR EACH ROW EXECUTE FUNCTION public.protect_company_sensitive_columns();

-- 2) visitor_attribution: drop wide-open UPDATE, route writes through a definer fn
DROP POLICY IF EXISTS "Anyone update attribution" ON public.visitor_attribution;
REVOKE UPDATE ON public.visitor_attribution FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.upsert_visitor_attribution(payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_visitor uuid := NULLIF(payload->>'visitor_id','')::uuid;
BEGIN
  IF v_visitor IS NULL THEN RETURN; END IF;
  INSERT INTO public.visitor_attribution (
    visitor_id,
    first_source, first_category, first_campaign, first_referrer, first_landing_page, first_visit_at,
    last_source,  last_category,  last_campaign,  last_referrer,  last_landing_page,  last_visit_at,
    device_type, updated_at
  ) VALUES (
    v_visitor,
    payload->>'first_source', payload->>'first_category', payload->>'first_campaign',
    payload->>'first_referrer', payload->>'first_landing_page',
    COALESCE((payload->>'first_visit_at')::timestamptz, now()),
    payload->>'last_source', payload->>'last_category', payload->>'last_campaign',
    payload->>'last_referrer', payload->>'last_landing_page',
    COALESCE((payload->>'last_visit_at')::timestamptz, now()),
    payload->>'device_type', now()
  )
  ON CONFLICT (visitor_id) DO UPDATE SET
    last_source = EXCLUDED.last_source,
    last_category = EXCLUDED.last_category,
    last_campaign = EXCLUDED.last_campaign,
    last_referrer = EXCLUDED.last_referrer,
    last_landing_page = EXCLUDED.last_landing_page,
    last_visit_at = EXCLUDED.last_visit_at,
    device_type = COALESCE(EXCLUDED.device_type, public.visitor_attribution.device_type),
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_visitor_attribution(jsonb) TO anon, authenticated;
