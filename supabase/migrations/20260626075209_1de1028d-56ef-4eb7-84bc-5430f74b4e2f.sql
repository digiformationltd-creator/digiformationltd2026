
-- 1) Suppress ZERO_AMOUNT warning for inquiries (they are unpriced by design).
CREATE OR REPLACE FUNCTION public.warn_zero_amount_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  catalog_price numeric;
BEGIN
  -- Inquiries are quotes awaiting pricing; do not warn on £0.
  IF COALESCE(NEW.source,'') = 'inquiry' THEN
    RETURN NEW;
  END IF;
  IF NEW.amount_gbp IS NULL OR NEW.amount_gbp = 0 THEN
    catalog_price := public.resolve_service_price(NEW.service);
    RAISE WARNING 'ORDER_ANOMALY_ZERO_AMOUNT order_ref=% source=% service=% resolved_catalog_price=%',
      NEW.order_ref, NEW.source, NEW.service, COALESCE(catalog_price, 0);
  END IF;
  RETURN NEW;
END;
$function$;

-- 2) Journey-aware attribution rollup.
--    A "journey" = unique customer path. An inquiry that later becomes an order
--    (via client_orders.inquiry_id) collapses to ONE journey, never two.
--    Revenue & order counts only include real, priced orders (amount > 0, not Inquiry/Cancelled).
CREATE OR REPLACE FUNCTION public.attribution_totals_by_source(_since timestamp with time zone DEFAULT (now() - '90 days'::interval))
 RETURNS TABLE(source text, category text, leads bigint, orders bigint, revenue numeric, conv_rate numeric, aov numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin privileges required' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN QUERY
  WITH raw AS (
    SELECT
      la.entity_type,
      la.entity_id,
      la.declared_source AS source,
      la.declared_category AS category,
      la.converted_at,
      -- Resolve every attribution row to a stable journey key so an
      -- "inquiry" attribution and its mirrored "order" attribution collapse to one.
      CASE
        WHEN la.entity_type = 'order' THEN
          COALESCE(
            (SELECT 'inq:' || co.inquiry_id::text
               FROM public.client_orders co
              WHERE co.id::text = la.entity_id
                AND co.inquiry_id IS NOT NULL
              LIMIT 1),
            'ord:' || la.entity_id
          )
        WHEN la.entity_type = 'inquiry' THEN 'inq:' || la.entity_id
        ELSE la.entity_type || ':' || la.entity_id
      END AS journey_key
    FROM public.lead_attribution la
    WHERE la.converted_at >= _since
  ),
  -- One row per journey: prefer the inquiry attribution (earliest touch) over
  -- a later mirrored order's attribution, then earliest converted_at.
  journeys AS (
    SELECT DISTINCT ON (journey_key)
      journey_key, source, category
    FROM raw
    ORDER BY journey_key,
      CASE entity_type WHEN 'inquiry' THEN 0 WHEN 'order' THEN 1 ELSE 2 END,
      converted_at ASC
  ),
  -- Real priced orders linked to each journey (via inquiry_id OR direct order id).
  journey_orders AS (
    SELECT
      j.journey_key, j.source,
      COALESCE(SUM(co.amount_gbp), 0)::numeric AS rev,
      COUNT(co.id)::bigint AS order_count
    FROM journeys j
    LEFT JOIN public.client_orders co ON (
      (j.journey_key LIKE 'inq:%' AND co.inquiry_id::text = substring(j.journey_key from 5))
      OR
      (j.journey_key LIKE 'ord:%' AND co.id::text = substring(j.journey_key from 5))
    )
      AND COALESCE(co.amount_gbp, 0) > 0
      AND COALESCE(co.status, '') NOT IN ('Inquiry', 'Cancelled')
    GROUP BY j.journey_key, j.source
  ),
  per_source AS (
    SELECT
      jo.source,
      MAX(j.category)               AS category,
      COUNT(*)::bigint              AS leads,
      SUM(jo.order_count)::bigint   AS orders,
      SUM(jo.rev)::numeric          AS revenue
    FROM journey_orders jo
    JOIN journeys j USING (journey_key)
    GROUP BY jo.source
  )
  SELECT
    COALESCE(p.source, 'unknown') AS source,
    COALESCE(p.category, 'unknown') AS category,
    p.leads,
    p.orders,
    p.revenue,
    CASE WHEN p.leads > 0
      THEN ROUND(100.0 * p.orders::numeric / p.leads, 2)
      ELSE 0 END AS conv_rate,
    CASE WHEN p.orders > 0
      THEN ROUND(p.revenue / p.orders, 2)
      ELSE 0 END AS aov
  FROM per_source p
  ORDER BY 5 DESC, 3 DESC;
END;
$function$;
