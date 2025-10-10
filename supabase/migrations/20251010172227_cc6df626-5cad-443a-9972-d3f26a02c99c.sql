-- Add status_color column to clients table
ALTER TABLE public.clients
ADD COLUMN status_color text NOT NULL DEFAULT 'green';