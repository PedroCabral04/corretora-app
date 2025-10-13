import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './AuthContext';

export interface Listing {
  id: string;
  brokerId: string;
  propertyType: 'Apartamento' | 'Casa' | 'Sobrado' | 'Lote' | 'Chácara';
  quantity: number;
  listingDate: string;
  status: 'Ativa' | 'Vendida' | 'Cancelada';
  // Campos antigos mantidos para compatibilidade (podem ser removidos futuramente)
  propertyAddress?: string;
  ownerName?: string;
  propertyValue?: number;
}

interface ListingsContextType {
  listings: Listing[];
  isLoading: boolean;
  createListing: (data: Omit<Listing, 'id'>) => Promise<Listing>;
  updateListing: (id: string, data: Partial<Listing>) => Promise<Listing>;
  deleteListing: (id: string) => Promise<void>;
  getListingsByBrokerId: (brokerId: string) => Listing[];
}

const ListingsContext = createContext<ListingsContextType | undefined>(undefined);

export const useListings = () => {
  const ctx = useContext(ListingsContext);
  if (!ctx) throw new Error('useListings must be used within ListingsProvider');
  return ctx;
};

interface ListingsProviderProps {
  children: ReactNode;
}

export const ListingsProvider = ({ children }: ListingsProviderProps) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchListings = async () => {
    if (!user) {
      setListings([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user.id)
        .order('listing_date', { ascending: false });

      if (error) throw error;

      const mappedListings: Listing[] = (data || []).map((listing: any) => ({
        id: listing.id,
        brokerId: listing.broker_id,
        // Use novos campos se existirem, senão use valores padrão
        propertyType: (listing.property_type || 'Apartamento') as 'Apartamento' | 'Casa' | 'Sobrado' | 'Lote' | 'Chácara',
        quantity: listing.quantity || 1,
        listingDate: listing.listing_date,
        status: listing.status as 'Ativa' | 'Vendida' | 'Cancelada',
        // Campos antigos para compatibilidade
        propertyAddress: listing.property_address,
        ownerName: listing.owner_name,
        propertyValue: listing.property_value ? Number(listing.property_value) : undefined
      }));

      setListings(mappedListings);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [user]);

  const createListing = async (data: Omit<Listing, 'id'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const listingData: any = {
      user_id: user.id,
      broker_id: data.brokerId,
      property_type: data.propertyType,
      quantity: data.quantity,
      listing_date: data.listingDate,
      status: data.status
    };

    const { data: newListing, error } = await supabase
      .from('listings')
      .insert([listingData])
      .select()
      .single();

    if (error) throw error;

    const newListingData: any = newListing;
    const mappedListing: Listing = {
      id: newListingData.id,
      brokerId: newListingData.broker_id,
      propertyType: newListingData.property_type as 'Apartamento' | 'Casa' | 'Sobrado' | 'Lote' | 'Chácara',
      quantity: newListingData.quantity || 1,
      listingDate: newListingData.listing_date,
      status: newListingData.status as 'Ativa' | 'Vendida' | 'Cancelada',
      propertyAddress: newListingData.property_address,
      ownerName: newListingData.owner_name,
      propertyValue: newListingData.property_value ? Number(newListingData.property_value) : undefined
    };

    setListings(prev => [mappedListing, ...prev]);
    return mappedListing;
  };

  const updateListing = async (id: string, data: Partial<Listing>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const updateData: any = {};
    if (data.propertyType !== undefined) updateData.property_type = data.propertyType;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.listingDate !== undefined) updateData.listing_date = data.listingDate;
    if (data.status !== undefined) updateData.status = data.status;

    const { data: updatedListing, error } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    const updatedData: any = updatedListing;
    const mappedListing: Listing = {
      id: updatedData.id,
      brokerId: updatedData.broker_id,
      propertyType: updatedData.property_type as 'Apartamento' | 'Casa' | 'Sobrado' | 'Lote' | 'Chácara',
      quantity: updatedData.quantity || 1,
      listingDate: updatedData.listing_date,
      status: updatedData.status as 'Ativa' | 'Vendida' | 'Cancelada',
      propertyAddress: updatedData.property_address,
      ownerName: updatedData.owner_name,
      propertyValue: updatedData.property_value ? Number(updatedData.property_value) : undefined
    };

    setListings(prev => prev.map(listing => listing.id === id ? mappedListing : listing));
    return mappedListing;
  };

  const deleteListing = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setListings(prev => prev.filter(listing => listing.id !== id));
  };

  const getListingsByBrokerId = (brokerId: string) => listings.filter(l => l.brokerId === brokerId);

  const value: ListingsContextType = {
    listings,
    isLoading,
    createListing,
    updateListing,
    deleteListing,
    getListingsByBrokerId
  };

  return (
    <ListingsContext.Provider value={value}>
      {children}
    </ListingsContext.Provider>
  );
};