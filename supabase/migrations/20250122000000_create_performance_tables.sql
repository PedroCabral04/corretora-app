-- Migration para criar tabelas de desempenho com gamificação

-- Tabela de desafios de desempenho
CREATE TABLE IF NOT EXISTS public.performance_challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de métricas de desempenho
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    challenge_id UUID NOT NULL REFERENCES public.performance_challenges(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('calls', 'personal_visits', 'office_visits', 'listings', 'sales', 'tasks')),
    target_value INTEGER NOT NULL DEFAULT 0,
    current_value INTEGER NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'unidade',
    color TEXT NOT NULL DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para performance_challenges
CREATE INDEX idx_performance_challenges_user_id ON public.performance_challenges(user_id);
CREATE INDEX idx_performance_challenges_broker_id ON public.performance_challenges(broker_id);
CREATE INDEX idx_performance_challenges_status ON public.performance_challenges(status);
CREATE INDEX idx_performance_challenges_dates ON public.performance_challenges(start_date, end_date);

-- Índices para performance_metrics
CREATE INDEX idx_performance_metrics_challenge_id ON public.performance_metrics(challenge_id);
CREATE INDEX idx_performance_metrics_type ON public.performance_metrics(metric_type);

-- Índice composto para consultas frequentes
CREATE INDEX idx_performance_challenges_user_broker_status 
    ON public.performance_challenges(user_id, broker_id, status);

-- Trigger para atualizar updated_at
CREATE TRIGGER set_performance_challenges_updated_at
    BEFORE UPDATE ON public.performance_challenges
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_performance_metrics_updated_at
    BEFORE UPDATE ON public.performance_metrics
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para atualizar status automaticamente
CREATE OR REPLACE FUNCTION public.update_challenge_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se todas as métricas foram alcançadas
    DECLARE
        all_completed BOOLEAN;
    BEGIN
        SELECT BOOL_AND(current_value >= target_value)
        INTO all_completed
        FROM public.performance_metrics
        WHERE challenge_id = NEW.id;
        
        -- Se todas completas e não expirou
        IF all_completed AND NEW.end_date >= CURRENT_DATE THEN
            NEW.status = 'completed';
        -- Se expirou e não completou
        ELSIF NEW.end_date < CURRENT_DATE AND NEW.status != 'completed' THEN
            NEW.status = 'expired';
        -- Se estava expirado mas foi completado
        ELSIF NEW.status = 'expired' AND all_completed THEN
            NEW.status = 'completed';
        END IF;
        
        RETURN NEW;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_update_challenge_status
    BEFORE UPDATE ON public.performance_challenges
    FOR EACH ROW
    EXECUTE FUNCTION public.update_challenge_status();

-- Função para calcular métricas de tarefas
CREATE OR REPLACE FUNCTION public.calculate_task_metrics(
    p_broker_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS INTEGER AS $$
DECLARE
    task_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO task_count
    FROM public.tasks
    WHERE broker_id = p_broker_id
        AND status = 'Concluída'
        AND due_date >= p_start_date
        AND due_date <= p_end_date;
    
    RETURN COALESCE(task_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para calcular métricas de reuniões
CREATE OR REPLACE FUNCTION public.calculate_meeting_metrics(
    p_broker_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_meeting_type TEXT
)
RETURNS INTEGER AS $$
DECLARE
    meeting_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO meeting_count
    FROM public.meetings
    WHERE broker_id = p_broker_id
        AND meeting_type = p_meeting_type
        AND status = 'completed'
        AND meeting_date >= p_start_date
        AND meeting_date <= p_end_date;
    
    RETURN COALESCE(meeting_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para calcular métricas de captações
CREATE OR REPLACE FUNCTION public.calculate_listing_metrics(
    p_broker_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS INTEGER AS $$
DECLARE
    listing_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO listing_count
    FROM public.listings
    WHERE broker_id = p_broker_id
        AND listing_date >= p_start_date
        AND listing_date <= p_end_date;
    
    RETURN COALESCE(listing_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para calcular métricas de vendas
CREATE OR REPLACE FUNCTION public.calculate_sales_metrics(
    p_broker_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS INTEGER AS $$
DECLARE
    sales_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO sales_count
    FROM public.sales
    WHERE broker_id = p_broker_id
        AND sale_date >= p_start_date
        AND sale_date <= p_end_date;
    
    RETURN COALESCE(sales_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar todas as métricas de um desafio
CREATE OR REPLACE FUNCTION public.update_challenge_metrics(p_challenge_id UUID)
RETURNS VOID AS $$
DECLARE
    challenge RECORD;
    task_value INTEGER;
    personal_visits_value INTEGER;
    office_visits_value INTEGER;
    listings_value INTEGER;
    sales_value INTEGER;
    calls_value INTEGER := 0; -- Implementar quando houver tabela de chamadas
BEGIN
    -- Buscar dados do desafio
    SELECT * INTO challenge
    FROM public.performance_challenges
    WHERE id = p_challenge_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Calcular valores para cada tipo de métrica
    task_value := public.calculate_task_metrics(challenge.broker_id, challenge.start_date, challenge.end_date);
    personal_visits_value := public.calculate_meeting_metrics(challenge.broker_id, challenge.start_date, challenge.end_date, 'personal_visits');
    office_visits_value := public.calculate_meeting_metrics(challenge.broker_id, challenge.start_date, challenge.end_date, 'office_visits');
    listings_value := public.calculate_listing_metrics(challenge.broker_id, challenge.start_date, challenge.end_date);
    sales_value := public.calculate_sales_metrics(challenge.broker_id, challenge.start_date, challenge.end_date);
    
    -- Atualizar métricas
    UPDATE public.performance_metrics
    SET current_value = 
        CASE metric_type
            WHEN 'tasks' THEN task_value
            WHEN 'personal_visits' THEN personal_visits_value
            WHEN 'office_visits' THEN office_visits_value
            WHEN 'listings' THEN listings_value
            WHEN 'sales' THEN sales_value
            WHEN 'calls' THEN calls_value
            ELSE current_value
        END,
        updated_at = timezone('utc'::text, now())
    WHERE challenge_id = p_challenge_id;
    
    -- Atualizar status do desafio
    UPDATE public.performance_challenges
    SET updated_at = timezone('utc'::text, now())
    WHERE id = p_challenge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.performance_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para performance_challenges
CREATE POLICY "Users can view their own performance challenges" ON public.performance_challenges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own performance challenges" ON public.performance_challenges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own performance challenges" ON public.performance_challenges
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own performance challenges" ON public.performance_challenges
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas de segurança para performance_metrics
CREATE POLICY "Users can view metrics for their challenges" ON public.performance_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.performance_challenges 
            WHERE id = challenge_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert metrics for their challenges" ON public.performance_metrics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.performance_challenges 
            WHERE id = challenge_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update metrics for their challenges" ON public.performance_metrics
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.performance_challenges 
            WHERE id = challenge_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete metrics for their challenges" ON public.performance_metrics
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.performance_challenges 
            WHERE id = challenge_id AND user_id = auth.uid()
        )
    );