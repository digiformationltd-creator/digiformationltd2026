
-- Grant admin role to digiformationltd@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('69b1fd8e-f7f7-4e75-a9de-9a765f818341', 'admin')
ON CONFLICT DO NOTHING;

-- Allow admins to view all profiles
CREATE POLICY "Admins view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any profile
CREATE POLICY "Admins update all profiles"
ON public.profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all user_roles
CREATE POLICY "Admins view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to manage roles
CREATE POLICY "Admins insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete roles"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));
