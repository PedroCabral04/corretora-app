-- Create allowlist table to maintain which emails can access the admin panel
CREATE TABLE public.admin_allowlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_allowlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow owner to view own allowlist entry" ON public.admin_allowlist
FOR SELECT
USING (lower(email) = lower(auth.email()));

CREATE POLICY "Allow owner to manage own allowlist entry" ON public.admin_allowlist
FOR ALL
USING (lower(email) = lower(auth.email()))
WITH CHECK (lower(email) = lower(auth.email()));

-- Create feature flags table with audit columns
CREATE TABLE public.feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_key TEXT NOT NULL UNIQUE,
    description TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX feature_flags_key_idx ON public.feature_flags(flag_key);
CREATE INDEX feature_flags_is_enabled_idx ON public.feature_flags(is_enabled);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Any authenticated user can read feature flags" ON public.feature_flags
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Owner can manage feature flags" ON public.feature_flags
FOR ALL
USING (
    has_role('admin', auth.uid())
    AND lower(auth.email()) IN (
        SELECT lower(email) FROM public.admin_allowlist
    )
)
WITH CHECK (
    has_role('admin', auth.uid())
    AND lower(auth.email()) IN (
        SELECT lower(email) FROM public.admin_allowlist
    )
);
