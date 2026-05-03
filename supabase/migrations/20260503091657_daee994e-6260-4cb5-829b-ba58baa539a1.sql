-- Grant admin role to info@digiformation.uk if the user exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE lower(email) = 'info@digiformation.uk'
ON CONFLICT (user_id, role) DO NOTHING;