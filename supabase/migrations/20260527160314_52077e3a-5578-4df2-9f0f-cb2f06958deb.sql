
DROP TRIGGER IF EXISTS trg_create_affiliate_commission_on_order ON public.client_orders;
DROP TRIGGER IF EXISTS create_affiliate_commission_on_order ON public.client_orders;

DROP FUNCTION IF EXISTS public.create_affiliate_commission_on_order() CASCADE;
DROP FUNCTION IF EXISTS public.sync_affiliate_commission_totals() CASCADE;
DROP FUNCTION IF EXISTS public.bump_affiliate_signups() CASCADE;
DROP FUNCTION IF EXISTS public.generate_affiliate_ref_code(text) CASCADE;

DROP TABLE IF EXISTS public.affiliate_commissions CASCADE;
DROP TABLE IF EXISTS public.affiliate_referrals CASCADE;
DROP TABLE IF EXISTS public.affiliate_clicks CASCADE;
DROP TABLE IF EXISTS public.affiliate_applications CASCADE;
DROP TABLE IF EXISTS public.affiliate_profiles CASCADE;
