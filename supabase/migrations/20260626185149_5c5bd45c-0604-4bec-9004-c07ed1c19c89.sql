
REVOKE EXECUTE ON FUNCTION public.ops_dashboard_summary() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.command_insights(timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.automation_health() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.command_performance_metrics(timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.audit_search(timestamptz, timestamptz, uuid, text, text, text, text, text, int, int) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.ops_dashboard_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.command_insights(timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.automation_health() TO authenticated;
GRANT EXECUTE ON FUNCTION public.command_performance_metrics(timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.audit_search(timestamptz, timestamptz, uuid, text, text, text, text, text, int, int) TO authenticated;
