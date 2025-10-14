-- Add status and summary columns to meetings table
ALTER TABLE public.meetings 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  ADD COLUMN IF NOT EXISTS summary TEXT;

-- Update existing meetings to have 'pending' status
UPDATE public.meetings SET status = 'pending' WHERE status IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_meetings_status ON public.meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_broker_status ON public.meetings(broker_id, status);

COMMENT ON COLUMN public.meetings.status IS 'Status da reunião: pending (pendente/em aberto) ou completed (finalizada)';
COMMENT ON COLUMN public.meetings.summary IS 'Resumo do que foi discutido na reunião após finalização';
