CREATE POLICY "Users view guest orders matching their email"
ON public.client_orders
FOR SELECT
TO authenticated
USING (
  user_id IS NULL
  AND customer_email IS NOT NULL
  AND lower(customer_email) = lower(auth.jwt() ->> 'email')
);