
CREATE OR REPLACE FUNCTION public.growth_overview(
  _since timestamptz DEFAULT now() - interval '30 days',
  _until timestamptz DEFAULT now()
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_visitors bigint := 0;
  v_leads    bigint := 0;
  v_orders   bigint := 0;
  v_revenue  numeric := 0;
  v_by_source   jsonb := '[]'::jsonb;
  v_by_category jsonb := '[]'::jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin privileges required' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT count(DISTINCT visitor_id) INTO v_visitors
  FROM public.visitor_sessions
  WHERE session_started_at >= _since AND session_started_at < _until;

  CREATE TEMP TABLE IF NOT EXISTS _go_jo (
    journey_key text, source text, category text,
    rev numeric, order_count bigint
  ) ON COMMIT DROP;
  TRUNCATE _go_jo;

  INSERT INTO _go_jo
  WITH raw AS (
    SELECT
      la.entity_type, la.entity_id,
      la.declared_source AS source,
      la.declared_category AS category,
      la.converted_at,
      CASE
        WHEN la.entity_type = 'order' THEN
          COALESCE(
            (SELECT 'inq:' || co.inquiry_id::text
               FROM public.client_orders co
              WHERE co.id::text = la.entity_id
                AND co.inquiry_id IS NOT NULL
              LIMIT 1),
            'ord:' || la.entity_id)
        WHEN la.entity_type = 'inquiry' THEN 'inq:' || la.entity_id
        ELSE la.entity_type || ':' || la.entity_id
      END AS journey_key
    FROM public.lead_attribution la
    WHERE la.converted_at >= _since AND la.converted_at < _until
  ),
  journeys AS (
    SELECT DISTINCT ON (journey_key) journey_key, source, category
    FROM raw
    ORDER BY journey_key,
      CASE entity_type WHEN 'inquiry' THEN 0 WHEN 'order' THEN 1 ELSE 2 END,
      converted_at ASC
  )
  SELECT j.journey_key, j.source, j.category,
         COALESCE(SUM(co.amount_gbp), 0)::numeric AS rev,
         COUNT(co.id)::bigint AS order_count
    FROM journeys j
    LEFT JOIN public.client_orders co ON (
      (j.journey_key LIKE 'inq:%' AND co.inquiry_id::text = substring(j.journey_key from 5))
      OR
      (j.journey_key LIKE 'ord:%' AND co.id::text = substring(j.journey_key from 5))
    )
      AND COALESCE(co.amount_gbp, 0) > 0
      AND COALESCE(co.status, '') NOT IN ('Inquiry','Cancelled')
   GROUP BY j.journey_key, j.source, j.category;

  SELECT COUNT(*)::bigint, COALESCE(SUM(order_count),0)::bigint, COALESCE(SUM(rev),0)::numeric
    INTO v_leads, v_orders, v_revenue
    FROM _go_jo;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'source', source, 'category', category,
           'leads', leads, 'orders', orders, 'revenue', revenue,
           'conv_rate', CASE WHEN leads>0 THEN round(100.0*orders::numeric/leads,2) ELSE 0 END,
           'aov',       CASE WHEN orders>0 THEN round(revenue/orders,2) ELSE 0 END
         ) ORDER BY revenue DESC, leads DESC), '[]'::jsonb)
    INTO v_by_source
    FROM (
      SELECT COALESCE(source,'unknown') AS source,
             max(COALESCE(category,'unknown')) AS category,
             COUNT(*)::bigint AS leads,
             SUM(order_count)::bigint AS orders,
             SUM(rev)::numeric AS revenue
        FROM _go_jo
       GROUP BY COALESCE(source,'unknown')
    ) s;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'category', category, 'leads', leads, 'orders', orders, 'revenue', revenue
         ) ORDER BY leads DESC), '[]'::jsonb)
    INTO v_by_category
    FROM (
      SELECT COALESCE(category,'unknown') AS category,
             COUNT(*)::bigint AS leads,
             SUM(order_count)::bigint AS orders,
             SUM(rev)::numeric AS revenue
        FROM _go_jo
       GROUP BY COALESCE(category,'unknown')
    ) c;

  RETURN jsonb_build_object(
    'visitors',    v_visitors,
    'leads',       v_leads,
    'orders',      v_orders,
    'revenue',     v_revenue,
    'conv_rate',   CASE WHEN v_leads>0 THEN round(100.0*v_orders::numeric/v_leads,2) ELSE 0 END,
    'by_source',   v_by_source,
    'by_category', v_by_category,
    'since',       _since,
    'until',       _until
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.growth_overview(timestamptz, timestamptz) TO authenticated, service_role;


CREATE OR REPLACE FUNCTION public.growth_records_by_source(
  _since timestamptz,
  _until timestamptz,
  _source text DEFAULT NULL,
  _category text DEFAULT NULL
) RETURNS TABLE(
  entity_type text, entity_id text,
  name text, email text, service text,
  amount_gbp numeric, status text,
  converted_at timestamptz,
  source text, category text,
  order_id uuid, inquiry_id uuid
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin privileges required' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN QUERY
  WITH raw AS (
    SELECT
      la.entity_type, la.entity_id,
      la.declared_source AS src,
      la.declared_category AS cat,
      la.converted_at,
      CASE
        WHEN la.entity_type = 'order' THEN
          COALESCE(
            (SELECT 'inq:' || co.inquiry_id::text
               FROM public.client_orders co
              WHERE co.id::text = la.entity_id
                AND co.inquiry_id IS NOT NULL
              LIMIT 1),
            'ord:' || la.entity_id)
        WHEN la.entity_type = 'inquiry' THEN 'inq:' || la.entity_id
        ELSE la.entity_type || ':' || la.entity_id
      END AS journey_key
    FROM public.lead_attribution la
    WHERE la.converted_at >= _since AND la.converted_at < _until
      AND (_source   IS NULL OR la.declared_source   = _source)
      AND (_category IS NULL OR la.declared_category = _category)
  ),
  journeys AS (
    SELECT DISTINCT ON (journey_key)
      journey_key, entity_type, entity_id, src, cat, converted_at
    FROM raw
    ORDER BY journey_key,
      CASE entity_type WHEN 'inquiry' THEN 0 WHEN 'order' THEN 1 ELSE 2 END,
      converted_at ASC
  )
  SELECT
    j.entity_type,
    j.entity_id,
    COALESCE(co.customer_name, cs.full_name)         AS name,
    COALESCE(co.customer_email, cs.email)            AS email,
    COALESCE(co.service, cs.service)                 AS service,
    COALESCE(co.amount_gbp, 0)::numeric              AS amount_gbp,
    COALESCE(co.status, 'Inquiry')                   AS status,
    j.converted_at,
    j.src                                            AS source,
    j.cat                                            AS category,
    co.id                                            AS order_id,
    cs.id                                            AS inquiry_id
  FROM journeys j
  LEFT JOIN public.client_orders co ON (
    (j.journey_key LIKE 'ord:%' AND co.id::text = substring(j.journey_key from 5))
    OR
    (j.journey_key LIKE 'inq:%' AND co.inquiry_id::text = substring(j.journey_key from 5))
  )
  LEFT JOIN public.contact_submissions cs ON (
    j.journey_key LIKE 'inq:%' AND cs.id::text = substring(j.journey_key from 5)
  )
  ORDER BY j.converted_at DESC
  LIMIT 500;
END;
$$;

GRANT EXECUTE ON FUNCTION public.growth_records_by_source(timestamptz, timestamptz, text, text) TO authenticated, service_role;
