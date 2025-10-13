-- Fix sync_goal_progress function to handle tasks table which doesn't have broker_id
CREATE OR REPLACE FUNCTION public.sync_goal_progress()
RETURNS TRIGGER AS $$
DECLARE
    goal_record RECORD;
    calculated_value DECIMAL(12, 2);
BEGIN
    -- Find all goals that might be affected by this change
    FOR goal_record IN 
        SELECT g.id, g.goal_type, g.broker_id, g.user_id, g.start_date, g.end_date
        FROM public.goals g
        WHERE g.status IN ('active', 'overdue')
        AND (
            -- Handle tables with broker_id (sales, listings, meetings)
            (TG_TABLE_NAME != 'tasks' AND (
                (TG_OP IN ('INSERT', 'UPDATE') AND g.broker_id = NEW.broker_id) OR
                (TG_OP = 'DELETE' AND g.broker_id = OLD.broker_id)
            )) OR
            -- Handle tasks table which doesn't have broker_id - sync all goals for the user
            (TG_TABLE_NAME = 'tasks' AND (
                (TG_OP IN ('INSERT', 'UPDATE') AND g.user_id = NEW.user_id) OR
                (TG_OP = 'DELETE' AND g.user_id = OLD.user_id)
            ))
        )
    LOOP
        calculated_value := 0;
        
        -- Calculate based on goal type
        CASE goal_record.goal_type
            WHEN 'listings' THEN
                -- Count active listings for this broker within the goal period
                SELECT COUNT(*)::DECIMAL INTO calculated_value
                FROM public.listings l
                WHERE l.broker_id = goal_record.broker_id
                AND l.user_id = goal_record.user_id
                AND l.status = 'Ativa'
                AND l.listing_date >= goal_record.start_date
                AND l.listing_date <= goal_record.end_date;
                
            WHEN 'sales_count' THEN
                -- Count sales for this broker within the goal period
                SELECT COUNT(*)::DECIMAL INTO calculated_value
                FROM public.sales s
                WHERE s.broker_id = goal_record.broker_id
                AND s.user_id = goal_record.user_id
                AND s.sale_date >= goal_record.start_date
                AND s.sale_date <= goal_record.end_date;
                
            WHEN 'sales_value' THEN
                -- Sum sales value for this broker within the goal period
                SELECT COALESCE(SUM(s.sale_value), 0) INTO calculated_value
                FROM public.sales s
                WHERE s.broker_id = goal_record.broker_id
                AND s.user_id = goal_record.user_id
                AND s.sale_date >= goal_record.start_date
                AND s.sale_date <= goal_record.end_date;
                
            WHEN 'meetings' THEN
                -- Count meetings for this broker within the goal period
                SELECT COUNT(*)::DECIMAL INTO calculated_value
                FROM public.meetings m
                WHERE m.broker_id = goal_record.broker_id
                AND m.user_id = goal_record.user_id
                AND m.meeting_date >= goal_record.start_date
                AND m.meeting_date <= goal_record.end_date;
                
            WHEN 'tasks' THEN
                -- Count completed tasks for this user within the goal period
                -- Since tasks don't have broker_id, we count all tasks for the user
                SELECT COUNT(*)::DECIMAL INTO calculated_value
                FROM public.tasks t
                WHERE t.user_id = goal_record.user_id
                AND t.status = 'Concluída'
                AND t.created_at::date >= goal_record.start_date
                AND t.created_at::date <= goal_record.end_date;
        END CASE;
        
        -- Update the goal with the calculated value
        UPDATE public.goals
        SET current_value = calculated_value,
            updated_at = NOW()
        WHERE id = goal_record.id;
    END LOOP;
    
    -- Return the appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;