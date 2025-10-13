-- Simplify listings table to only have quantity and property type
-- Remove old fields and add new ones

-- Add new columns
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS property_type TEXT CHECK (property_type IN ('Apartamento', 'Casa', 'Sobrado', 'Lote', 'Chácara')),
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

-- Make old fields nullable for backward compatibility (can drop them later if needed)
ALTER TABLE public.listings
ALTER COLUMN property_address DROP NOT NULL,
ALTER COLUMN owner_name DROP NOT NULL,
ALTER COLUMN property_value DROP NOT NULL;

-- Set default values for property_type where null
UPDATE public.listings
SET property_type = 'Apartamento'
WHERE property_type IS NULL;

-- Set quantity to 1 where null
UPDATE public.listings
SET quantity = 1
WHERE quantity IS NULL;

-- Now make the new fields required
ALTER TABLE public.listings
ALTER COLUMN property_type SET NOT NULL,
ALTER COLUMN quantity SET NOT NULL;
