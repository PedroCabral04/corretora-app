-- Add broker association to tasks so managers can assign activities per broker
ALTER TABLE public.tasks
ADD COLUMN broker_id UUID REFERENCES public.brokers(id) ON DELETE CASCADE;

CREATE INDEX tasks_broker_id_idx ON public.tasks(broker_id);
CREATE INDEX tasks_user_broker_idx ON public.tasks(user_id, broker_id);

-- Update RLS policies to ensure broker ownership on insert and update
DROP POLICY IF EXISTS "Users can create their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;

CREATE POLICY "Users can create their own tasks" ON public.tasks
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    broker_id IS NULL
    OR broker_id IN (
      SELECT id FROM public.brokers WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update their own tasks" ON public.tasks
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (
    broker_id IS NULL
    OR broker_id IN (
      SELECT id FROM public.brokers WHERE user_id = auth.uid()
    )
  )
);
