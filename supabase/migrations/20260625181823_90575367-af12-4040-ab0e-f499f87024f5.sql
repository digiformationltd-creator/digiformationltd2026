
ALTER TABLE public.client_orders ADD COLUMN IF NOT EXISTS client_ip text;
CREATE INDEX IF NOT EXISTS idx_client_orders_client_ip_created ON public.client_orders (client_ip, created_at DESC) WHERE client_ip IS NOT NULL;

-- Restrict aggregated attribution analytics to admins only
REVOKE EXECUTE ON FUNCTION public.attribution_totals_by_source(timestamptz) FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.attribution_ai_breakdown(timestamptz) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.attribution_totals_by_source(timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.attribution_ai_breakdown(timestamptz) TO service_role;

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
  WITH base AS (
    SELECT la.declared_source AS source, la.declared_category AS category, la.entity_type, la.entity_id
    FROM public.lead_attribution la WHERE la.converted_at >= _since
  ),
  rev AS (
    SELECT b.source, SUM(COALESCE(co.amount_gbp,0)) AS rev,
           COUNT(*) FILTER (WHERE b.entity_type='order') AS order_count
    FROM base b LEFT JOIN public.client_orders co ON b.entity_type='order' AND co.id::text = b.entity_id
    GROUP BY b.source
  ),
  l AS (SELECT base.source, MAX(base.category) AS category, COUNT(*) AS lead_count FROM base GROUP BY base.source)
  SELECT COALESCE(l.source,'unknown'), COALESCE(l.category,'unknown'),
    l.lead_count, COALESCE(r.order_count,0), COALESCE(r.rev,0),
    CASE WHEN l.lead_count>0 THEN ROUND(100.0*COALESCE(r.order_count,0)::numeric/l.lead_count,2) ELSE 0 END,
    CASE WHEN COALESCE(r.order_count,0)>0 THEN ROUND(COALESCE(r.rev,0)/r.order_count,2) ELSE 0 END
  FROM l LEFT JOIN rev r ON r.source=l.source
  ORDER BY 5 DESC, 3 DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.attribution_ai_breakdown(_since timestamp with time zone DEFAULT (now() - '90 days'::interval))
 RETURNS TABLE(source text, leads bigint, orders bigint, revenue numeric, conv_rate numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin privileges required' USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN QUERY
  SELECT t.source, t.leads, t.orders, t.revenue, t.conv_rate
  FROM public.attribution_totals_by_source(_since) t
  WHERE t.source IN ('chatgpt','gemini','claude','perplexity','grok','deepseek','copilot','other_ai');
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.attribution_totals_by_source(timestamptz) FROM PUBLIC, authenticated;
REVOKE EXECUTE ON FUNCTION public.attribution_ai_breakdown(timestamptz) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.attribution_totals_by_source(timestamptz) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.attribution_ai_breakdown(timestamptz) TO authenticated, service_role;
