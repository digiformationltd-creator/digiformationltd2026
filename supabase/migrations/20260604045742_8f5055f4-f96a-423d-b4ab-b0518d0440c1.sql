DROP POLICY IF EXISTS "Users view guest invoices matching their email" ON public.invoices;
CREATE POLICY "Users view guest invoices matching their email"
  ON public.invoices FOR SELECT
  USING (
    user_id IS NULL
    AND bill_to_email IS NOT NULL
    AND lower(bill_to_email) = lower((auth.jwt() ->> 'email'))
    AND COALESCE((auth.jwt() -> 'user_metadata' ->> 'email_verified')::boolean, false) = true
  );

DROP POLICY IF EXISTS "Users view guest orders matching their email" ON public.client_orders;
CREATE POLICY "Users view guest orders matching their email"
  ON public.client_orders FOR SELECT
  USING (
    user_id IS NULL
    AND customer_email IS NOT NULL
    AND lower(customer_email) = lower((auth.jwt() ->> 'email'))
    AND COALESCE((auth.jwt() -> 'user_metadata' ->> 'email_verified')::boolean, false) = true
  );