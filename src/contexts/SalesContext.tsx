import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { normalizeIsoDate } from "@/lib/utils";
import { useAuth } from './AuthContext';

export type SaleType = 'lancamento' | 'revenda';

export interface Sale {
  id: string;
  brokerId: string;
  propertyAddress: string;
  clientName: string;
  saleValue: number;
  commission: number;
  saleDate: string;
  saleType: SaleType;
}

interface SalesContextType {
  sales: Sale[];
  isLoading: boolean;
  createSale: (data: Omit<Sale, 'id'>) => Promise<Sale>;
  updateSale: (id: string, data: Partial<Sale>) => Promise<Sale>;
  deleteSale: (id: string) => Promise<void>;
  getSalesByBrokerId: (brokerId: string) => Sale[];
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const useSales = () => {
  const ctx = useContext(SalesContext);
  if (!ctx) throw new Error('useSales must be used within SalesProvider');
  return ctx;
};

interface SalesProviderProps {
  children: ReactNode;
}

export const SalesProvider = ({ children }: SalesProviderProps) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchSales = async () => {
    if (!user) {
      setSales([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', user.id)
        .order('sale_date', { ascending: false });

      if (error) throw error;

      const mappedSales: Sale[] = (data || []).map((sale: any) => ({
        id: sale.id,
        brokerId: sale.broker_id,
        propertyAddress: sale.property_address,
        clientName: sale.client_name,
        saleValue: Number(sale.sale_value),
        commission: Number(sale.commission),
        saleDate: normalizeIsoDate(sale.sale_date),
        saleType: (sale.sale_type as SaleType) || 'revenda'
      }));

      setSales(mappedSales);
    } catch (error) {
      console.error('Error fetching sales:', error);
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [user]);

  const createSale = async (data: Omit<Sale, 'id'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const saleDate = normalizeIsoDate(data.saleDate);
    if (!saleDate) {
      throw new Error('Data da venda inválida');
    }

    const saleData = {
      user_id: user.id,
      broker_id: data.brokerId,
      property_address: data.propertyAddress,
      client_name: data.clientName,
      sale_value: data.saleValue,
      commission: data.commission,
      sale_date: saleDate,
      sale_type: data.saleType || 'revenda'
    };

    const { data: newSale, error } = await supabase
      .from('sales')
      .insert([saleData])
      .select()
      .single();

    if (error) throw error;

    const typedNewSale = newSale as any;
    const mappedSale: Sale = {
      id: typedNewSale.id,
      brokerId: typedNewSale.broker_id,
      propertyAddress: typedNewSale.property_address,
      clientName: typedNewSale.client_name,
      saleValue: Number(typedNewSale.sale_value),
      commission: Number(typedNewSale.commission),
      saleDate: normalizeIsoDate(typedNewSale.sale_date),
      saleType: (typedNewSale.sale_type as SaleType) || 'revenda'
    };

    setSales(prev => [mappedSale, ...prev]);
    return mappedSale;
  };

  const updateSale = async (id: string, data: Partial<Sale>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const updateData: any = {};
    if (data.propertyAddress !== undefined) updateData.property_address = data.propertyAddress;
    if (data.clientName !== undefined) updateData.client_name = data.clientName;
    if (data.saleValue !== undefined) updateData.sale_value = data.saleValue;
    if (data.commission !== undefined) updateData.commission = data.commission;
    if (data.saleType !== undefined) updateData.sale_type = data.saleType;
    if (data.saleDate !== undefined) {
      const saleDate = normalizeIsoDate(data.saleDate);
      if (!saleDate) {
        throw new Error('Data da venda inválida');
      }
      updateData.sale_date = saleDate;
    }

    const { data: updatedSale, error } = await supabase
      .from('sales')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    const typedUpdatedSale = updatedSale as any;
    const mappedSale: Sale = {
      id: typedUpdatedSale.id,
      brokerId: typedUpdatedSale.broker_id,
      propertyAddress: typedUpdatedSale.property_address,
      clientName: typedUpdatedSale.client_name,
      saleValue: Number(typedUpdatedSale.sale_value),
      commission: Number(typedUpdatedSale.commission),
      saleDate: normalizeIsoDate(typedUpdatedSale.sale_date),
      saleType: (typedUpdatedSale.sale_type as SaleType) || 'revenda'
    };

    setSales(prev => prev.map(sale => sale.id === id ? mappedSale : sale));
    return mappedSale;
  };

  const deleteSale = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    // Guarda o estado anterior para reverter em caso de erro
    const previousSales = [...sales];

    // Update otimista: remove da lista imediatamente
    setSales(prev => prev.filter(sale => sale.id !== id));

    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        // Reverte o estado em caso de erro
        setSales(previousSales);
        throw error;
      }
    } catch (error) {
      // Garante que o estado seja revertido mesmo em erros inesperados
      setSales(previousSales);
      throw error;
    }
  };

  const getSalesByBrokerId = (brokerId: string) => sales.filter(s => s.brokerId === brokerId);

  const value: SalesContextType = {
    sales,
    isLoading,
    createSale,
    updateSale,
    deleteSale,
    getSalesByBrokerId
  };

  return (
    <SalesContext.Provider value={value}>
      {children}
    </SalesContext.Provider>
  );
};