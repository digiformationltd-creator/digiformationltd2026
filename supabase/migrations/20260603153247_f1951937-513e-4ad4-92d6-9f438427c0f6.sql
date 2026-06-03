-- Convert has_role from SECURITY DEFINER to SECURITY INVOKER.
-- Rationale: RLS on user_roles already restricts each user to their own rows,
-- and every call site passes auth.uid(), so invoker semantics are equivalent
-- but eliminate the elevated-privilege surface the linter flags.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Make sure authenticated users can read their own user_roles row (RLS will
-- still scope it to auth.uid()).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_roles'
      AND policyname='Users read own roles'
  ) THEN
    CREATE POLICY "Users read own roles"
      ON public.user_roles
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- next_order_number is only called by the generate-invoice edge function
-- (service_role context). Lock it down.
REVOKE EXECUTE ON FUNCTION public.next_order_number() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.next_order_number() TO service_role;