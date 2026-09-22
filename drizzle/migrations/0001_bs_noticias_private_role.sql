REVOKE ALL ON FUNCTION public.handle_new_user_profile() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

ALTER POLICY "Admins view all articles" ON public.articles USING (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "Admins create articles" ON public.articles WITH CHECK (private.has_role(auth.uid(), 'admin') AND created_by = auth.uid());
ALTER POLICY "Admins update articles" ON public.articles USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "Admins delete articles" ON public.articles USING (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "Admins view all sponsors" ON public.sponsors USING (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "Admins create sponsors" ON public.sponsors WITH CHECK (private.has_role(auth.uid(), 'admin') AND created_by = auth.uid());
ALTER POLICY "Admins update sponsors" ON public.sponsors USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
ALTER POLICY "Admins delete sponsors" ON public.sponsors USING (private.has_role(auth.uid(), 'admin'));

DROP FUNCTION public.has_role(uuid, public.app_role);