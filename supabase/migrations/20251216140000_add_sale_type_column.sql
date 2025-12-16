-- Add sale_type column to sales table
-- This column allows categorizing sales as 'lancamento' (new development) or 'revenda' (resale)

ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS sale_type TEXT DEFAULT 'revenda' 
CHECK (sale_type IN ('lancamento', 'revenda'));

-- Add comment for documentation
COMMENT ON COLUMN public.sales.sale_type IS 'Tipo de venda: lancamento (lançamento) ou revenda';

-- Update existing records to have 'revenda' as default
UPDATE public.sales SET sale_type = 'revenda' WHERE sale_type IS NULL;

-- Make the column NOT NULL after updating existing records
ALTER TABLE public.sales ALTER COLUMN sale_type SET NOT NULL;
