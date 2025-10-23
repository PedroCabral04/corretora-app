-- Create performance challenges table to manage custom broker goals
CREATE TABLE IF NOT EXISTS public.performance_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'overdue')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT performance_challenges_start_before_end CHECK (start_date <= end_date)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_performance_challenges_user_id ON public.performance_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_challenges_broker_id ON public.performance_challenges(broker_id);
CREATE INDEX IF NOT EXISTS idx_performance_challenges_status ON public.performance_challenges(status);
CREATE INDEX IF NOT EXISTS idx_performance_challenges_end_date ON public.performance_challenges(end_date);

-- Create performance targets table that stores the granular indicators for each challenge
CREATE TABLE IF NOT EXISTS public.performance_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES public.performance_challenges(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL CHECK (
        metric_type IN (
            'sales',
            'sales_value',
            'listings',
            'meetings',
            'tasks',
            'calls',
            'visits',
            'in_person_visits'
        )
    ),
    target_value NUMERIC(12, 2) NOT NULL,
    current_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_performance_targets_challenge_id ON public.performance_targets(challenge_id);
CREATE INDEX IF NOT EXISTS idx_performance_targets_metric_type ON public.performance_targets(metric_type);

-- Enable Row-Level Security
ALTER TABLE public.performance_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_targets ENABLE ROW LEVEL SECURITY;

-- RLS policies for performance_challenges
CREATE POLICY "Users can view their performance challenges"
    ON public.performance_challenges FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their performance challenges"
    ON public.performance_challenges FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their performance challenges"
    ON public.performance_challenges FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their performance challenges"
    ON public.performance_challenges FOR DELETE
    USING (auth.uid() = user_id);

-- RLS policies for performance_targets
CREATE POLICY "Users can view targets of their performance challenges"
    ON public.performance_targets FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.performance_challenges pc
            WHERE pc.id = performance_targets.challenge_id
              AND pc.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert targets for their performance challenges"
    ON public.performance_targets FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.performance_challenges pc
            WHERE pc.id = performance_targets.challenge_id
              AND pc.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update targets of their performance challenges"
    ON public.performance_targets FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.performance_challenges pc
            WHERE pc.id = performance_targets.challenge_id
              AND pc.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete targets of their performance challenges"
    ON public.performance_targets FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM public.performance_challenges pc
            WHERE pc.id = performance_targets.challenge_id
              AND pc.user_id = auth.uid()
        )
    );

-- Reuse the shared updated_at trigger helper if available
-- (The public.handle_updated_at() function already exists from previous migrations.)
CREATE TRIGGER set_performance_challenges_updated_at
    BEFORE UPDATE ON public.performance_challenges
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_performance_targets_updated_at
    BEFORE UPDATE ON public.performance_targets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
