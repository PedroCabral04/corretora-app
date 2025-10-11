import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './AuthContext';

export interface Broker {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  creci?: string;
  totalSales: number;
  totalListings: number;
  monthlyExpenses: number;
  totalValue: number;
}

interface BrokersContextType {
  brokers: Broker[];
  isLoading: boolean;
  createBroker: (data: Partial<Broker>) => Promise<Broker>;
  updateBroker: (id: string, data: Partial<Broker>) => Promise<Broker>;
  deleteBroker: (id: string) => Promise<void>;
  getBrokerById: (id: string) => Broker | undefined;
}

const BrokersContext = createContext<BrokersContextType | undefined>(undefined);

export const useBrokers = () => {
  const ctx = useContext(BrokersContext);
  if (!ctx) throw new Error('useBrokers must be used within BrokersProvider');
  return ctx;
};

interface ProvidersProps { 
  children: ReactNode;
}

export const BrokersProvider = ({ children }: ProvidersProps) => {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchBrokers = async () => {
    if (!user) {
      setBrokers([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('brokers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedBrokers: Broker[] = (data || []).map(broker => ({
        id: broker.id,
        name: broker.name,
        email: broker.email || '',
        phone: broker.phone || '',
        creci: broker.creci || '',
        totalSales: broker.total_sales,
        totalListings: broker.total_listings,
        monthlyExpenses: Number(broker.monthly_expenses),
        totalValue: Number(broker.total_value)
      }));

      setBrokers(mappedBrokers);
    } catch (error) {
      console.error('Error fetching brokers:', error);
      setBrokers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrokers();
  }, [user]);

  const createBroker = async (data: Partial<Broker>) => {
    if (!user) throw new Error('Usuário não autenticado');
    if (!data.name) throw new Error('Nome é obrigatório');

    const brokerData = {
      user_id: user.id,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      creci: data.creci || null,
      total_sales: data.totalSales ?? 0,
      total_listings: data.totalListings ?? 0,
      monthly_expenses: data.monthlyExpenses ?? 0,
      total_value: data.totalValue ?? 0
    };

    const { data: newBroker, error } = await supabase
      .from('brokers')
      .insert([brokerData])
      .select()
      .single();

    if (error) throw error;

    const mappedBroker: Broker = {
      id: newBroker.id,
      name: newBroker.name,
      email: newBroker.email || '',
      phone: newBroker.phone || '',
      creci: newBroker.creci || '',
      totalSales: newBroker.total_sales,
      totalListings: newBroker.total_listings,
      monthlyExpenses: Number(newBroker.monthly_expenses),
      totalValue: Number(newBroker.total_value)
    };

    setBrokers(prev => [mappedBroker, ...prev]);
    return mappedBroker;
  };

  const updateBroker = async (id: string, data: Partial<Broker>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.creci !== undefined) updateData.creci = data.creci || null;
    if (data.totalSales !== undefined) updateData.total_sales = data.totalSales;
    if (data.totalListings !== undefined) updateData.total_listings = data.totalListings;
    if (data.monthlyExpenses !== undefined) updateData.monthly_expenses = data.monthlyExpenses;
    if (data.totalValue !== undefined) updateData.total_value = data.totalValue;

    const { data: updatedBroker, error } = await supabase
      .from('brokers')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    const mappedBroker: Broker = {
      id: updatedBroker.id,
      name: updatedBroker.name,
      email: updatedBroker.email || '',
      phone: updatedBroker.phone || '',
      creci: updatedBroker.creci || '',
      totalSales: updatedBroker.total_sales,
      totalListings: updatedBroker.total_listings,
      monthlyExpenses: Number(updatedBroker.monthly_expenses),
      totalValue: Number(updatedBroker.total_value)
    };

    setBrokers(prev => prev.map(broker => broker.id === id ? mappedBroker : broker));
    return mappedBroker;
  };

  const deleteBroker = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('brokers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setBrokers(prev => prev.filter(broker => broker.id !== id));
  };

  const getBrokerById = (id: string) => brokers.find(b => b.id === id);

  const value: BrokersContextType = {
    brokers,
    isLoading,
    createBroker,
    updateBroker,
    deleteBroker,
    getBrokerById
  };

  return (
    <BrokersContext.Provider value={value}>{children}</BrokersContext.Provider>
  );
};

export default BrokersContext;