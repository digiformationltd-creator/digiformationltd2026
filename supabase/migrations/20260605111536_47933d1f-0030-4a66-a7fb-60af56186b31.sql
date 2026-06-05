
REVOKE EXECUTE ON FUNCTION public.resolve_service_price(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_service_price(text) TO service_role;
