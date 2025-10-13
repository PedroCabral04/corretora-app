-- Fix timezone issue for events.datetime column
-- Change from TIMESTAMP WITH TIME ZONE to TIMESTAMP WITHOUT TIME ZONE
-- This prevents automatic UTC conversion and stores the local time as entered

-- Drop any dependent objects if needed (none expected, but good practice)
-- Alter the datetime column to remove timezone
ALTER TABLE public.events 
  ALTER COLUMN datetime TYPE TIMESTAMP WITHOUT TIME ZONE;

-- Add a comment to document the change
COMMENT ON COLUMN public.events.datetime IS 'Event date and time in local timezone (stored without timezone conversion)';
