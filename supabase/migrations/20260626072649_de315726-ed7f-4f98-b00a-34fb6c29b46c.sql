
-- ============================================================
-- Phase 1: Growth Intelligence Foundation
-- ============================================================

-- 1. Performance indexes (additive)
CREATE INDEX IF NOT EXISTS lead_attribution_converted_source_idx
  ON public.lead_attribution (converted_at DESC, declared_source, declared_category);

CREATE INDEX IF NOT EXISTS lead_attribution_entity_lookup_idx
  ON public.lead_attribution (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS visitor_attribution_last_visit_idx
  ON public.visitor_attribution (last_visit_at DESC);

CREATE INDEX IF NOT EXISTS visitor_attribution_first_source_idx
  ON public.visitor_attribution (first_source);

CREATE INDEX IF NOT EXISTS visitor_sessions_visitor_created_idx
  ON public.visitor_sessions (visitor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS client_orders_declared_source_idx
  ON public.client_orders (declared_source) WHERE declared_source IS NOT NULL;

CREATE INDEX IF NOT EXISTS leads_declared_source_idx
  ON public.leads (declared_source) WHERE declared_source IS NOT NULL;

-- 2. Backfill client_orders from lead_attribution (only fills NULLs)
UPDATE public.client_orders co
SET attribution_id        = la.id,
    declared_source       = COALESCE(co.declared_source, la.declared_source),
    declared_source_label = COALESCE(co.declared_source_label, la.declared_source_label),
    utm_source            = COALESCE(co.utm_source, la.utm_source),
    utm_campaign          = COALESCE(co.utm_campaign, la.utm_campaign)
FROM public.lead_attribution la
WHERE la.entity_type = 'order'
  AND la.entity_id = co.id::text
  AND co.attribution_id IS NULL;

-- 3. Backfill leads from lead_attribution
UPDATE public.leads l
SET attribution_id        = la.id,
    declared_source       = COALESCE(l.declared_source, la.declared_source),
    declared_source_label = COALESCE(l.declared_source_label, la.declared_source_label)
FROM public.lead_attribution la
WHERE la.entity_type IN ('lead','inquiry')
  AND la.entity_id = l.id::text
  AND l.attribution_id IS NULL;

-- 4. Popup dismissals table
CREATE TABLE IF NOT EXISTS public.popup_dismissals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id   UUID NOT NULL,
  popup_key    TEXT NOT NULL DEFAULT 'attribution',
  action       TEXT NOT NULL CHECK (action IN ('dismissed','answered','snoozed')),
  declared_source TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.popup_dismissals TO anon, authenticated;
GRANT ALL ON public.popup_dismissals TO service_role;

ALTER TABLE public.popup_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert popup dismissals"
  ON public.popup_dismissals FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view popup dismissals"
  ON public.popup_dismissals FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX popup_dismissals_visitor_idx
  ON public.popup_dismissals (visitor_id, popup_key, created_at DESC);

-- 5. GDPR: delete all data for a visitor (admin only)
CREATE OR REPLACE FUNCTION public.delete_visitor_data(_visitor_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sessions int := 0;
  v_attr     int := 0;
  v_popups   int := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin privileges required' USING ERRCODE='insufficient_privilege';
  END IF;

  WITH d AS (DELETE FROM public.visitor_sessions   WHERE visitor_id = _visitor_id RETURNING 1)
    SELECT count(*) INTO v_sessions FROM d;
  WITH d AS (DELETE FROM public.popup_dismissals   WHERE visitor_id = _visitor_id RETURNING 1)
    SELECT count(*) INTO v_popups FROM d;
  WITH d AS (DELETE FROM public.visitor_attribution WHERE visitor_id = _visitor_id RETURNING 1)
    SELECT count(*) INTO v_attr FROM d;

  RETURN jsonb_build_object(
    'visitor_id', _visitor_id,
    'sessions_removed', v_sessions,
    'attribution_removed', v_attr,
    'popups_removed', v_popups
  );
END $$;

REVOKE ALL ON FUNCTION public.delete_visitor_data(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_visitor_data(uuid) TO authenticated;

-- 6. Popup answer RPC: enum allowlist + 1/day throttle, public callable
CREATE OR REPLACE FUNCTION public.upsert_visitor_declared_source(
  _visitor_id uuid,
  _source     text,
  _source_label text DEFAULT NULL,
  _category   text  DEFAULT NULL,
  _action     text  DEFAULT 'answered'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_allowed text[] := ARRAY[
    'google','bing','duckduckgo','yahoo',
    'chatgpt','gemini','claude','perplexity','grok','deepseek','copilot','other_ai',
    'facebook','instagram','tiktok','youtube','linkedin','twitter','pinterest',
    'whatsapp','referral','existing_client','direct','ads','other'
  ];
  v_recent_writes int;
BEGIN
  IF _visitor_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'visitor_id required');
  END IF;

  IF _action NOT IN ('answered','dismissed','snoozed') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid action');
  END IF;

  IF _action = 'answered' AND (_source IS NULL OR NOT (_source = ANY(v_allowed))) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid source');
  END IF;

  -- Throttle: max 3 popup writes per visitor per 24h
  SELECT count(*) INTO v_recent_writes
  FROM public.popup_dismissals
  WHERE visitor_id = _visitor_id
    AND created_at > now() - interval '24 hours';

  IF v_recent_writes >= 3 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'throttled');
  END IF;

  INSERT INTO public.popup_dismissals (visitor_id, popup_key, action, declared_source)
  VALUES (_visitor_id, 'attribution', _action, CASE WHEN _action='answered' THEN _source END);

  IF _action = 'answered' THEN
    INSERT INTO public.visitor_attribution (
      visitor_id, first_source, first_category, first_visit_at,
      last_source, last_category, last_visit_at, updated_at
    ) VALUES (
      _visitor_id, _source, _category, now(), _source, _category, now(), now()
    )
    ON CONFLICT (visitor_id) DO UPDATE SET
      last_source   = EXCLUDED.last_source,
      last_category = COALESCE(EXCLUDED.last_category, public.visitor_attribution.last_category),
      last_visit_at = now(),
      updated_at    = now();
  END IF;

  RETURN jsonb_build_object('ok', true);
END $$;

REVOKE ALL ON FUNCTION public.upsert_visitor_declared_source(uuid,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_visitor_declared_source(uuid,text,text,text,text) TO anon, authenticated;
