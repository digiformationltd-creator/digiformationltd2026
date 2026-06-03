CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, avatar_initials)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 2))
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client');

  UPDATE public.client_orders
  SET user_id = NEW.id
  WHERE user_id IS NULL
    AND customer_email IS NOT NULL
    AND NEW.email IS NOT NULL
    AND lower(customer_email) = lower(NEW.email);

  RETURN NEW;
END;
$function$;