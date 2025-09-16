import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './AuthContext';

export interface Sale {
  id: string;
  brokerId: string;
  propertyAddress: string;
  clientName: string;
  saleValue: number;
  commission: number;
  saleDate: string;
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

      const mappedSales: Sale[] = (data || []).map(sale => ({
        id: sale.id,
        brokerId: sale.broker_id,
        propertyAddress: sale.property_address,
        clientName: sale.client_name,
        saleValue: Number(sale.sale_value),
        commission: Number(sale.commission),
        saleDate: sale.sale_date
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

    const saleData = {
      user_id: user.id,
      broker_id: data.brokerId,
      property_address: data.propertyAddress,
      client_name: data.clientName,
      sale_value: data.saleValue,
      commission: data.commission,
      sale_date: data.saleDate
    };

    const { data: newSale, error } = await supabase
      .from('sales')
      .insert([saleData])
      .select()
      .single();

    if (error) throw error;

    const mappedSale: Sale = {
      id: newSale.id,
      brokerId: newSale.broker_id,
      propertyAddress: newSale.property_address,
      clientName: newSale.client_name,
      saleValue: Number(newSale.sale_value),
      commission: Number(newSale.commission),
      saleDate: newSale.sale_date
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
    if (data.saleDate !== undefined) updateData.sale_date = data.saleDate;

    const { data: updatedSale, error } = await supabase
      .from('sales')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    const mappedSale: Sale = {
      id: updatedSale.id,
      brokerId: updatedSale.broker_id,
      propertyAddress: updatedSale.property_address,
      clientName: updatedSale.client_name,
      saleValue: Number(updatedSale.sale_value),
      commission: Number(updatedSale.commission),
      saleDate: updatedSale.sale_date
    };

    setSales(prev => prev.map(sale => sale.id === id ? mappedSale : sale));
    return mappedSale;
  };

  const deleteSale = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setSales(prev => prev.filter(sale => sale.id !== id));
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