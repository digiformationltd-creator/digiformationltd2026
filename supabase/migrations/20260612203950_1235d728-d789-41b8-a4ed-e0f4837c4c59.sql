
CREATE TABLE public.visitor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID NOT NULL,
  user_id UUID,
  session_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  landing_page TEXT,
  referrer TEXT,
  utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, utm_content TEXT, utm_term TEXT,
  detected_source TEXT,
  detected_category TEXT,
  device_type TEXT,
  browser TEXT,
  country TEXT,
  pages_viewed INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX visitor_sessions_visitor_idx ON public.visitor_sessions(visitor_id);
CREATE INDEX visitor_sessions_created_idx ON public.visitor_sessions(created_at DESC);
CREATE INDEX visitor_sessions_source_idx ON public.visitor_sessions(detected_source);
GRANT SELECT ON public.visitor_sessions TO authenticated;
GRANT INSERT ON public.visitor_sessions TO anon, authenticated;
GRANT ALL ON public.visitor_sessions TO service_role;
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert sessions" ON public.visitor_sessions
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read sessions" ON public.visitor_sessions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.visitor_attribution (
  visitor_id UUID PRIMARY KEY,
  user_id UUID,
  first_source TEXT, first_category TEXT, first_campaign TEXT,
  first_referrer TEXT, first_landing_page TEXT, first_visit_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_source TEXT, last_category TEXT, last_campaign TEXT,
  last_referrer TEXT, last_landing_page TEXT, last_visit_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_count INT NOT NULL DEFAULT 1,
  total_pages INT NOT NULL DEFAULT 1,
  country TEXT,
  device_type TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.visitor_attribution TO authenticated;
GRANT INSERT, UPDATE ON public.visitor_attribution TO anon, authenticated;
GRANT ALL ON public.visitor_attribution TO service_role;
ALTER TABLE public.visitor_attribution ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone upsert attribution" ON public.visitor_attribution
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone update attribution" ON public.visitor_attribution
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins read attribution" ON public.visitor_attribution
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.lead_attribution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  user_id UUID,
  visitor_id UUID,
  declared_source TEXT,
  declared_source_label TEXT,
  declared_category TEXT,
  first_source TEXT, first_category TEXT, first_campaign TEXT, first_referrer TEXT, first_landing_page TEXT,
  last_source TEXT, last_category TEXT, last_campaign TEXT, last_referrer TEXT, last_landing_page TEXT,
  utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, utm_content TEXT, utm_term TEXT,
  device_type TEXT, browser TEXT, country TEXT,
  converted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);
CREATE INDEX lead_attribution_declared_idx ON public.lead_attribution(declared_source);
CREATE INDEX lead_attribution_first_idx ON public.lead_attribution(first_source);
CREATE INDEX lead_attribution_converted_idx ON public.lead_attribution(converted_at DESC);
GRANT SELECT ON public.lead_attribution TO authenticated;
GRANT INSERT ON public.lead_attribution TO anon, authenticated;
GRANT ALL ON public.lead_attribution TO service_role;
ALTER TABLE public.lead_attribution ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone insert lead attribution" ON public.lead_attribution
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read lead attribution" ON public.lead_attribution
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

ALTER TABLE public.client_orders
  ADD COLUMN IF NOT EXISTS declared_source TEXT,
  ADD COLUMN IF NOT EXISTS declared_source_label TEXT,
  ADD COLUMN IF NOT EXISTS attribution_id UUID REFERENCES public.lead_attribution(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

ALTER TABLE public.contact_submissions
  ADD COLUMN IF NOT EXISTS declared_source TEXT,
  ADD COLUMN IF NOT EXISTS declared_source_label TEXT,
  ADD COLUMN IF NOT EXISTS attribution_id UUID REFERENCES public.lead_attribution(id) ON DELETE SET NULL;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS declared_source TEXT,
  ADD COLUMN IF NOT EXISTS declared_source_label TEXT,
  ADD COLUMN IF NOT EXISTS attribution_id UUID REFERENCES public.lead_attribution(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.record_lead_attribution(payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.lead_attribution (
    entity_type, entity_id, user_id, visitor_id,
    declared_source, declared_source_label, declared_category,
    first_source, first_category, first_campaign, first_referrer, first_landing_page,
    last_source, last_category, last_campaign, last_referrer, last_landing_page,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    device_type, browser, country, converted_at
  ) VALUES (
    payload->>'entity_type', payload->>'entity_id',
    NULLIF(payload->>'user_id','')::uuid, NULLIF(payload->>'visitor_id','')::uuid,
    payload->>'declared_source', payload->>'declared_source_label', payload->>'declared_category',
    payload->>'first_source', payload->>'first_category', payload->>'first_campaign', payload->>'first_referrer', payload->>'first_landing_page',
    payload->>'last_source', payload->>'last_category', payload->>'last_campaign', payload->>'last_referrer', payload->>'last_landing_page',
    payload->>'utm_source', payload->>'utm_medium', payload->>'utm_campaign', payload->>'utm_content', payload->>'utm_term',
    payload->>'device_type', payload->>'browser', payload->>'country',
    COALESCE((payload->>'converted_at')::timestamptz, now())
  )
  ON CONFLICT (entity_type, entity_id) DO UPDATE SET
    declared_source = COALESCE(EXCLUDED.declared_source, lead_attribution.declared_source),
    declared_source_label = COALESCE(EXCLUDED.declared_source_label, lead_attribution.declared_source_label),
    declared_category = COALESCE(EXCLUDED.declared_category, lead_attribution.declared_category),
    last_source = COALESCE(EXCLUDED.last_source, lead_attribution.last_source),
    last_campaign = COALESCE(EXCLUDED.last_campaign, lead_attribution.last_campaign),
    converted_at = EXCLUDED.converted_at
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.record_lead_attribution(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_lead_attribution(jsonb) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.attribution_totals_by_source(_since timestamptz DEFAULT (now() - interval '90 days'))
RETURNS TABLE(source TEXT, category TEXT, leads BIGINT, orders BIGINT, revenue NUMERIC, conv_rate NUMERIC, aov NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
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
  l AS (SELECT source, MAX(category) AS category, COUNT(*) AS lead_count FROM base GROUP BY source)
  SELECT COALESCE(l.source,'unknown'), COALESCE(l.category,'unknown'),
    l.lead_count, COALESCE(r.order_count,0), COALESCE(r.rev,0),
    CASE WHEN l.lead_count>0 THEN ROUND(100.0*COALESCE(r.order_count,0)::numeric/l.lead_count,2) ELSE 0 END,
    CASE WHEN COALESCE(r.order_count,0)>0 THEN ROUND(COALESCE(r.rev,0)/r.order_count,2) ELSE 0 END
  FROM l LEFT JOIN rev r ON r.source=l.source
  ORDER BY 5 DESC, 3 DESC;
$$;
GRANT EXECUTE ON FUNCTION public.attribution_totals_by_source(timestamptz) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.attribution_ai_breakdown(_since timestamptz DEFAULT (now() - interval '90 days'))
RETURNS TABLE(source TEXT, leads BIGINT, orders BIGINT, revenue NUMERIC, conv_rate NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT source, leads, orders, revenue, conv_rate
  FROM public.attribution_totals_by_source(_since)
  WHERE source IN ('chatgpt','gemini','claude','perplexity','grok','deepseek','copilot','other_ai');
$$;
GRANT EXECUTE ON FUNCTION public.attribution_ai_breakdown(timestamptz) TO authenticated, service_role;
