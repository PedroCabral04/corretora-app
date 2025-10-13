-- Function to sync goals with actual data from listings, sales, meetings, and tasks
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
            -- For INSERT/UPDATE, check if the broker matches
            (TG_OP IN ('INSERT', 'UPDATE') AND g.broker_id = NEW.broker_id) OR
            -- For DELETE, check if the broker matches
            (TG_OP = 'DELETE' AND g.broker_id = OLD.broker_id)
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
                -- Count completed tasks for this broker within the goal period
                SELECT COUNT(*)::DECIMAL INTO calculated_value
                FROM public.tasks t
                WHERE t.broker_id = goal_record.broker_id
                AND t.user_id = goal_record.user_id
                AND t.status = 'Concluída'
                AND t.due_date >= goal_record.start_date
                AND t.due_date <= goal_record.end_date;
        END CASE;
        
        -- Update the goal's current_value
        UPDATE public.goals
        SET current_value = calculated_value
        WHERE id = goal_record.id;
    END LOOP;
    
    -- Return the appropriate record based on operation
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on listings table
DROP TRIGGER IF EXISTS sync_goals_on_listings ON public.listings;
CREATE TRIGGER sync_goals_on_listings
    AFTER INSERT OR UPDATE OR DELETE ON public.listings
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_goal_progress();

-- Trigger on sales table
DROP TRIGGER IF EXISTS sync_goals_on_sales ON public.sales;
CREATE TRIGGER sync_goals_on_sales
    AFTER INSERT OR UPDATE OR DELETE ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_goal_progress();

-- Trigger on meetings table
DROP TRIGGER IF EXISTS sync_goals_on_meetings ON public.meetings;
CREATE TRIGGER sync_goals_on_meetings
    AFTER INSERT OR UPDATE OR DELETE ON public.meetings
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_goal_progress();

-- Trigger on tasks table
DROP TRIGGER IF EXISTS sync_goals_on_tasks ON public.tasks;
CREATE TRIGGER sync_goals_on_tasks
    AFTER INSERT OR UPDATE OR DELETE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_goal_progress();

-- Function to recalculate all goals (useful for initial sync or manual refresh)
CREATE OR REPLACE FUNCTION public.recalculate_all_goals()
RETURNS void AS $$
DECLARE
    goal_record RECORD;
    calculated_value DECIMAL(12, 2);
BEGIN
    FOR goal_record IN 
        SELECT id, goal_type, broker_id, user_id, start_date, end_date
        FROM public.goals
        WHERE status IN ('active', 'overdue')
    LOOP
        calculated_value := 0;
        
        CASE goal_record.goal_type
            WHEN 'listings' THEN
                SELECT COUNT(*)::DECIMAL INTO calculated_value
                FROM public.listings l
                WHERE l.broker_id = goal_record.broker_id
                AND l.user_id = goal_record.user_id
                AND l.status = 'Ativa'
                AND l.listing_date >= goal_record.start_date
                AND l.listing_date <= goal_record.end_date;
                
            WHEN 'sales_count' THEN
                SELECT COUNT(*)::DECIMAL INTO calculated_value
                FROM public.sales s
                WHERE s.broker_id = goal_record.broker_id
                AND s.user_id = goal_record.user_id
                AND s.sale_date >= goal_record.start_date
                AND s.sale_date <= goal_record.end_date;
                
            WHEN 'sales_value' THEN
                SELECT COALESCE(SUM(s.sale_value), 0) INTO calculated_value
                FROM public.sales s
                WHERE s.broker_id = goal_record.broker_id
                AND s.user_id = goal_record.user_id
                AND s.sale_date >= goal_record.start_date
                AND s.sale_date <= goal_record.end_date;
                
            WHEN 'meetings' THEN
                SELECT COUNT(*)::DECIMAL INTO calculated_value
                FROM public.meetings m
                WHERE m.broker_id = goal_record.broker_id
                AND m.user_id = goal_record.user_id
                AND m.meeting_date >= goal_record.start_date
                AND m.meeting_date <= goal_record.end_date;
                
            WHEN 'tasks' THEN
                SELECT COUNT(*)::DECIMAL INTO calculated_value
                FROM public.tasks t
                WHERE t.broker_id = goal_record.broker_id
                AND t.user_id = goal_record.user_id
                AND t.status = 'Concluída'
                AND t.due_date >= goal_record.start_date
                AND t.due_date <= goal_record.end_date;
        END CASE;
        
        UPDATE public.goals
        SET current_value = calculated_value
        WHERE id = goal_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute initial sync for existing goals
SELECT public.recalculate_all_goals();
