CREATE SEQUENCE IF NOT EXISTS public.order_ref_seq START 1;

CREATE OR REPLACE FUNCTION public.next_order_number()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nextval('public.order_ref_seq');
$$;

GRANT EXECUTE ON FUNCTION public.next_order_number() TO anon, authenticated;