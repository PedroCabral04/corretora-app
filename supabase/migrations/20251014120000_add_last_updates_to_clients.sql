-- Add last_updates column to clients table for tracking client updates
ALTER TABLE public.clients
ADD COLUMN last_updates TEXT;

COMMENT ON COLUMN public.clients.last_updates IS 'Field for annotating the latest updates about the client';
