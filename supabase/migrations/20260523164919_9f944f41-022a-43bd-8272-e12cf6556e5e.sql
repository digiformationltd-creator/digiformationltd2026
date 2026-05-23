
-- 1) Storage: make affiliate-applications bucket private and drop public read
UPDATE storage.buckets SET public = false WHERE id = 'affiliate-applications';
DROP POLICY IF EXISTS "Public can read affiliate application pdfs" ON storage.objects;

-- 2) Drop unsafe UPDATE policy on affiliate_applications (pdf_url is now set at INSERT time)
DROP POLICY IF EXISTS "Anyone can attach pdf url to own row by application_id" ON public.affiliate_applications;

-- 3) Lock down affiliate_profiles UPDATE to payout columns only
DROP POLICY IF EXISTS "Users update payout details on own profile" ON public.affiliate_profiles;
REVOKE UPDATE ON public.affiliate_profiles FROM anon, authenticated;
GRANT UPDATE (payout_method, payout_details) ON public.affiliate_profiles TO authenticated;

CREATE POLICY "Users update payout details on own profile"
ON public.affiliate_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4) Revoke EXECUTE on SECURITY DEFINER helpers that should not be client-callable.
-- (has_role is intentionally left callable because RLS policies reference it.)
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.next_order_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_affiliate_commission_totals() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_affiliate_signups() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_affiliate_ref_code(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_affiliate_commission_on_order() FROM PUBLIC, anon, authenticated;

-- 5) Fix mutable search_path on set_updated_at (re-create with SET search_path)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
