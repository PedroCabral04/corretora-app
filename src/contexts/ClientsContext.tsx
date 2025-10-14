import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface Client {
  id: string;
  user_id: string;
  broker_id: string;
  client_name: string;
  interest: string;
  negotiation_status: string;
  is_active: boolean;
  status_color: string;
  last_updates?: string;
  created_at: string;
  updated_at: string;
}

interface ClientsContextType {
  clients: Client[];
  loading: boolean;
  addClient: (client: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  refreshClients: () => Promise<void>;
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

export const ClientsProvider = ({ children }: { children: ReactNode }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchClients = async () => {
    if (!user) {
      setClients([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [user]);

  const addClient = async (client: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase.from('clients').insert({
      ...client,
      user_id: user.id,
    });

    if (error) throw error;
    await fetchClients();
  };

  const updateClient = async (id: string, client: Partial<Client>) => {
    const { error } = await supabase
      .from('clients')
      .update(client)
      .eq('id', id);

    if (error) throw error;
    await fetchClients();
  };

  const deleteClient = async (id: string) => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
    await fetchClients();
  };

  return (
    <ClientsContext.Provider
      value={{
        clients,
        loading,
        addClient,
        updateClient,
        deleteClient,
        refreshClients: fetchClients,
      }}
    >
      {children}
    </ClientsContext.Provider>
  );
};

export const useClients = () => {
  const context = useContext(ClientsContext);
  if (!context) {
    throw new Error('useClients must be used within a ClientsProvider');
  }
  return context;
};
