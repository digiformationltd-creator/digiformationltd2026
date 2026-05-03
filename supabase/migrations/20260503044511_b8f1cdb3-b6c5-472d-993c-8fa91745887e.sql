CREATE OR REPLACE FUNCTION public.sync_missing_client_profiles()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  WITH inserted AS (
    INSERT INTO public.profiles (user_id, full_name, email, avatar_initials)
    SELECT
      u.id,
      COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1), ''),
      u.email,
      UPPER(LEFT(COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', u.email, 'CL'), 2))
    FROM auth.users u
    WHERE u.email IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
      )
    RETURNING 1
  )
  SELECT count(*) INTO inserted_count FROM inserted;

  INSERT INTO public.user_roles (user_id, role)
  SELECT u.id, 'client'::public.app_role
  FROM auth.users u
  WHERE u.email IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = u.id
        AND ur.role = 'client'::public.app_role
    )
  ON CONFLICT DO NOTHING;

  RETURN inserted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_missing_client_profiles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_missing_client_profiles() TO authenticated;