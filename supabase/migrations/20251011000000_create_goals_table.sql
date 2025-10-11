-- Create goals table for tracking broker targets and performance
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    goal_type TEXT NOT NULL CHECK (goal_type IN ('sales_count', 'sales_value', 'listings', 'meetings', 'tasks')),
    target_value DECIMAL(12, 2) NOT NULL,
    current_value DECIMAL(12, 2) DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'overdue')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_goals_broker_id ON public.goals(broker_id);
CREATE INDEX idx_goals_status ON public.goals(status);
CREATE INDEX idx_goals_end_date ON public.goals(end_date);

-- Enable RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own goals"
    ON public.goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
    ON public.goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
    ON public.goals FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
    ON public.goals FOR DELETE
    USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at on goals table
CREATE TRIGGER set_goals_updated_at
    BEFORE UPDATE ON public.goals
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Function to automatically update goal status based on dates and values
CREATE OR REPLACE FUNCTION public.update_goal_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if goal is completed (current value >= target value)
    IF NEW.current_value >= NEW.target_value THEN
        NEW.status = 'completed';
    -- Check if goal is overdue (end date passed and not completed)
    ELSIF NEW.end_date < CURRENT_DATE AND NEW.current_value < NEW.target_value THEN
        NEW.status = 'overdue';
    -- Otherwise keep it active if not cancelled
    ELSIF NEW.status NOT IN ('completed', 'cancelled') THEN
        NEW.status = 'active';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update goal status
CREATE TRIGGER auto_update_goal_status
    BEFORE INSERT OR UPDATE ON public.goals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_goal_status();
