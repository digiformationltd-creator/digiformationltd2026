-- 1) Audit log table
CREATE TABLE IF NOT EXISTS public.cleanup_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at timestamptz NOT NULL DEFAULT now(),
  category text NOT NULL,
  removed_count integer NOT NULL DEFAULT 0,
  details jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.cleanup_audit_log TO authenticated;
GRANT ALL ON public.cleanup_audit_log TO service_role;

ALTER TABLE public.cleanup_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view cleanup audit log"
  ON public.cleanup_audit_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_cleanup_audit_log_run_at
  ON public.cleanup_audit_log (run_at DESC);

-- 2) Cleanup function — SAFE, only touches temporary/ephemeral data
CREATE OR REPLACE FUNCTION public.run_temporary_cleanup(retention_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  cutoff timestamptz := now() - make_interval(days => retention_days);
  removed int;
  summary jsonb := '{}'::jsonb;
  archive_table text;
BEGIN
  -- 2a) Purge PGMQ archive tables (already-processed messages)
  FOR archive_table IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'pgmq' AND tablename LIKE 'a\_%'
  LOOP
    BEGIN
      EXECUTE format(
        'WITH del AS (DELETE FROM pgmq.%I WHERE archived_at < $1 RETURNING 1) SELECT count(*) FROM del',
        archive_table
      ) INTO removed USING cutoff;

      INSERT INTO public.cleanup_audit_log (category, removed_count, details)
      VALUES ('pgmq_archive', removed, jsonb_build_object('table', archive_table, 'cutoff', cutoff));

      summary := summary || jsonb_build_object('pgmq_' || archive_table, removed);
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.cleanup_audit_log (category, removed_count, error, details)
      VALUES ('pgmq_archive', 0, SQLERRM, jsonb_build_object('table', archive_table));
    END;
  END LOOP;

  -- 2b) WhatsApp click analytics (ephemeral marketing telemetry)
  BEGIN
    WITH del AS (
      DELETE FROM public.whatsapp_clicks WHERE created_at < cutoff RETURNING 1
    ) SELECT count(*) INTO removed FROM del;
    INSERT INTO public.cleanup_audit_log (category, removed_count, details)
    VALUES ('whatsapp_clicks', removed, jsonb_build_object('cutoff', cutoff));
    summary := summary || jsonb_build_object('whatsapp_clicks', removed);
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.cleanup_audit_log (category, removed_count, error)
    VALUES ('whatsapp_clicks', 0, SQLERRM);
  END;

  -- 2c) Used / expired unsubscribe tokens (one-time use, no business value after use)
  BEGIN
    WITH del AS (
      DELETE FROM public.email_unsubscribe_tokens
      WHERE created_at < cutoff
        AND (used_at IS NOT NULL OR created_at < now() - interval '90 days')
      RETURNING 1
    ) SELECT count(*) INTO removed FROM del;
    INSERT INTO public.cleanup_audit_log (category, removed_count, details)
    VALUES ('email_unsubscribe_tokens', removed, jsonb_build_object('cutoff', cutoff));
    summary := summary || jsonb_build_object('email_unsubscribe_tokens', removed);
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.cleanup_audit_log (category, removed_count, error)
    VALUES ('email_unsubscribe_tokens', 0, SQLERRM);
  END;

  -- 2d) Email send log: ONLY purge ephemeral failure rows (failed / rate_limited / dlq).
  --     Successful sends ('sent') are kept forever as compliance/audit history.
  BEGIN
    WITH del AS (
      DELETE FROM public.email_send_log
      WHERE created_at < cutoff
        AND status IN ('failed', 'rate_limited', 'dlq')
      RETURNING 1
    ) SELECT count(*) INTO removed FROM del;
    INSERT INTO public.cleanup_audit_log (category, removed_count, details)
    VALUES ('email_send_log_transient', removed,
            jsonb_build_object('cutoff', cutoff, 'statuses', ARRAY['failed','rate_limited','dlq']));
    summary := summary || jsonb_build_object('email_send_log_transient', removed);
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.cleanup_audit_log (category, removed_count, error)
    VALUES ('email_send_log_transient', 0, SQLERRM);
  END;

  RETURN summary;
END;
$$;

REVOKE ALL ON FUNCTION public.run_temporary_cleanup(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_temporary_cleanup(integer) TO service_role;