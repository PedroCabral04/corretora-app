-- Add is_aggregate field to listings table to support aggregate (counter-only) listings
-- This allows users to either just track quantities or detail each listing

-- First, drop the existing check constraint on status if it exists
ALTER TABLE public.listings
DROP CONSTRAINT IF EXISTS listings_status_check;

-- Update existing records to new status values
UPDATE public.listings
SET status = 'Ativo'
WHERE status = 'Ativa';

UPDATE public.listings
SET status = 'Vendido'
WHERE status = 'Vendida';

UPDATE public.listings
SET status = 'Desativado'
WHERE status = 'Cancelada';

-- Add the new check constraint with updated statuses
ALTER TABLE public.listings
ADD CONSTRAINT listings_status_check 
CHECK (status IN ('Ativo', 'Desativado', 'Vendido', 'Moderação', 'Agregado'));

-- Add is_aggregate column
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS is_aggregate BOOLEAN DEFAULT false;

-- Update existing records to set is_aggregate based on status
UPDATE public.listings
SET is_aggregate = true
WHERE status = 'Agregado';

-- Set default to false for all null values
UPDATE public.listings
SET is_aggregate = false
WHERE is_aggregate IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE public.listings
ALTER COLUMN is_aggregate SET NOT NULL;

-- Add comment to explain the field
COMMENT ON COLUMN public.listings.is_aggregate IS 'Indicates if this is an aggregate/counter-only listing (true) or a detailed listing (false)';
