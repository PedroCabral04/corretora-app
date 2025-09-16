import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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
  getBrokerById: (id: string) => Broker | undefined;
}

const BrokersContext = createContext<BrokersContextType | undefined>(undefined);

export const useBrokers = () => {
  const ctx = useContext(BrokersContext);
  if (!ctx) throw new Error('useBrokers must be used within BrokersProvider');
  return ctx;
};

interface ProvidersProps { children: ReactNode }

const STORAGE_KEY = 'brokers';

export const BrokersProvider = ({ children }: ProvidersProps) => {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Broker[];
        // Remove known sample/demo brokers (from older seeds) so app starts clean
        const isSample = (b: Broker) => {
          const sampleNames = ['Ana Silva', 'Carlos Santos', 'Maria Oliveira'];
          if (b.email && b.email.includes('exemplo.com')) return true;
          if (sampleNames.includes(b.name)) return true;
          return false;
        };

        const filtered = parsed.filter(b => !isSample(b));
        setBrokers(filtered);
        // persist filtered list in case we removed samples
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      } catch (e) {
        // If parsing fails, start with empty list
        setBrokers([]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      }
    } else {
      // start with empty list
      setBrokers([]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    }
    setIsLoading(false);
  }, []);

  const persist = (items: Broker[]) => {
    setBrokers(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  const createBroker = async (data: Partial<Broker>) => {
    // Minimal validation
    if (!data.name) throw new Error('Nome é obrigatório');

    const broker: Broker = {
      id: data.id || Math.random().toString(36).slice(2, 9),
      name: data.name,
      email: data.email || '',
      phone: data.phone || '',
      creci: data.creci || '',
      totalSales: data.totalSales ?? 0,
      totalListings: data.totalListings ?? 0,
      monthlyExpenses: data.monthlyExpenses ?? 0,
      totalValue: data.totalValue ?? 0,
    };

    const updated = [...brokers, broker];
    persist(updated);
    return broker;
  };

  const getBrokerById = (id: string) => brokers.find(b => b.id === id);

  const value: BrokersContextType = {
    brokers,
    isLoading,
    createBroker,
    getBrokerById
  };

  return (
    <BrokersContext.Provider value={value}>{children}</BrokersContext.Provider>
  );
};

export default BrokersContext;
