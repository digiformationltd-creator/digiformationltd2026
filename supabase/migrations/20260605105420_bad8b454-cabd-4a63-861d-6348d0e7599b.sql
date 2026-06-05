-- Fix function search_path (security warning)
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pg_temp;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pg_temp;

-- Lock down Realtime broadcast/presence/subscription to admins only.
-- The app only uses postgres_changes from the admin Business OS UI, and RLS on
-- the underlying public tables (client_orders, invoices, leads,
-- whatsapp_message_log) already restricts which rows admins receive. This
-- adds an explicit policy on realtime.messages so non-admin authenticated
-- users cannot subscribe to channels and observe broadcast traffic.
DROP POLICY IF EXISTS "Admins can read realtime messages" ON realtime.messages;
CREATE POLICY "Admins can read realtime messages"
ON realtime.messages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can send realtime messages" ON realtime.messages;
CREATE POLICY "Admins can send realtime messages"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));