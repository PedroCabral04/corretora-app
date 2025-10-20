-- Ensure admins can list all profiles for user management screens
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT
USING (
    has_role(auth.uid(), 'admin'::public.app_role)
);
