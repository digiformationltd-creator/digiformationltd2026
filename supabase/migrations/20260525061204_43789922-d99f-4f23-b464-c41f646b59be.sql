-- Fix 1: affiliate_profiles self-insert privilege escalation
DROP POLICY IF EXISTS "Users insert own affiliate profile" ON public.affiliate_profiles;
CREATE POLICY "Users insert own affiliate profile"
ON public.affiliate_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
  AND commission_per_sale_gbp = 15
  AND approved_at IS NULL
  AND pending_commission_gbp = 0
  AND lifetime_commission_gbp = 0
  AND total_paid_orders = 0
  AND total_signups = 0
  AND total_clicks = 0
);

-- Fix 2: contact_submissions admin SELECT
CREATE POLICY "Admins view submissions"
ON public.contact_submissions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 3: newsletter_subscribers admin SELECT
CREATE POLICY "Admins view subscribers"
ON public.newsletter_subscribers
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix 4: whatsapp_clicks admin SELECT
CREATE POLICY "Admins view whatsapp clicks"
ON public.whatsapp_clicks
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));