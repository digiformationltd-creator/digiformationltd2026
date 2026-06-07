
REVOKE EXECUTE ON FUNCTION public.upsert_whatsapp_contact(TEXT, TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_capture_whatsapp_contact_from_order() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_capture_whatsapp_contact_from_inquiry() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_whatsapp_contact(TEXT, TEXT, TEXT, TEXT, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.auto_capture_whatsapp_contact_from_order() TO service_role;
GRANT EXECUTE ON FUNCTION public.auto_capture_whatsapp_contact_from_inquiry() TO service_role;
