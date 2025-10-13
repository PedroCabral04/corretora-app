-- Aumenta a precisão dos campos monetários de DECIMAL(10,2) para DECIMAL(15,2)
-- Isso permite valores até 9.999.999.999.999,99 (aproximadamente 10 trilhões)
-- Necessário para suportar valores imobiliários de alto valor

-- Tabela brokers
ALTER TABLE public.brokers 
  ALTER COLUMN monthly_expenses TYPE DECIMAL(15,2),
  ALTER COLUMN total_value TYPE DECIMAL(15,2);

-- Tabela sales
ALTER TABLE public.sales 
  ALTER COLUMN sale_value TYPE DECIMAL(15,2),
  ALTER COLUMN commission TYPE DECIMAL(15,2);

-- Tabela listings
ALTER TABLE public.listings 
  ALTER COLUMN property_value TYPE DECIMAL(15,2);

-- Tabela expenses
ALTER TABLE public.expenses 
  ALTER COLUMN amount TYPE DECIMAL(15,2);

-- Comentários para documentação
COMMENT ON COLUMN public.brokers.monthly_expenses IS 'Gastos mensais do corretor (DECIMAL 15,2 - até ~10 trilhões)';
COMMENT ON COLUMN public.brokers.total_value IS 'Valor total de vendas do corretor (DECIMAL 15,2 - até ~10 trilhões)';
COMMENT ON COLUMN public.sales.sale_value IS 'Valor da venda (DECIMAL 15,2 - até ~10 trilhões)';
COMMENT ON COLUMN public.sales.commission IS 'Comissão da venda (DECIMAL 15,2 - até ~10 trilhões)';
COMMENT ON COLUMN public.listings.property_value IS 'Valor do imóvel (DECIMAL 15,2 - até ~10 trilhões)';
COMMENT ON COLUMN public.expenses.amount IS 'Valor da despesa (DECIMAL 15,2 - até ~10 trilhões)';
