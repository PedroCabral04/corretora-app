import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './AuthContext';

export interface Listing {
  id: string;
  brokerId: string;
  propertyAddress: string;
  ownerName: string;
  propertyValue: number;
  listingDate: string;
  status: 'Ativa' | 'Vendida' | 'Cancelada';
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

      const mappedListings: Listing[] = (data || []).map(listing => ({
        id: listing.id,
        brokerId: listing.broker_id,
        propertyAddress: listing.property_address,
        ownerName: listing.owner_name,
        propertyValue: Number(listing.property_value),
        listingDate: listing.listing_date,
        status: listing.status as 'Ativa' | 'Vendida' | 'Cancelada'
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

    const listingData = {
      user_id: user.id,
      broker_id: data.brokerId,
      property_address: data.propertyAddress,
      owner_name: data.ownerName,
      property_value: data.propertyValue,
      listing_date: data.listingDate,
      status: data.status
    };

    const { data: newListing, error } = await supabase
      .from('listings')
      .insert([listingData])
      .select()
      .single();

    if (error) throw error;

    const mappedListing: Listing = {
      id: newListing.id,
      brokerId: newListing.broker_id,
      propertyAddress: newListing.property_address,
      ownerName: newListing.owner_name,
      propertyValue: Number(newListing.property_value),
      listingDate: newListing.listing_date,
      status: newListing.status as 'Ativa' | 'Vendida' | 'Cancelada'
    };

    setListings(prev => [mappedListing, ...prev]);
    return mappedListing;
  };

  const updateListing = async (id: string, data: Partial<Listing>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const updateData: any = {};
    if (data.propertyAddress !== undefined) updateData.property_address = data.propertyAddress;
    if (data.ownerName !== undefined) updateData.owner_name = data.ownerName;
    if (data.propertyValue !== undefined) updateData.property_value = data.propertyValue;
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

    const mappedListing: Listing = {
      id: updatedListing.id,
      brokerId: updatedListing.broker_id,
      propertyAddress: updatedListing.property_address,
      ownerName: updatedListing.owner_name,
      propertyValue: Number(updatedListing.property_value),
      listingDate: updatedListing.listing_date,
      status: updatedListing.status as 'Ativa' | 'Vendida' | 'Cancelada'
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