DROP POLICY IF EXISTS "Owner can manage feature flags" ON public.feature_flags;

CREATE POLICY "Owner can manage feature flags" ON public.feature_flags
FOR ALL
USING (
    has_role(auth.uid(), 'admin'::public.app_role)
    AND lower(auth.email()) IN (
        SELECT lower(email) FROM public.admin_allowlist
    )
)
WITH CHECK (
    has_role(auth.uid(), 'admin'::public.app_role)
    AND lower(auth.email()) IN (
        SELECT lower(email) FROM public.admin_allowlist
    )
);
