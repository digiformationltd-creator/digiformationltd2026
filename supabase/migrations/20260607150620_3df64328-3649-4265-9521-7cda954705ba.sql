REVOKE ALL ON FUNCTION public.run_temporary_cleanup(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_temporary_cleanup(integer) TO service_role;