import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './AuthContext';

export interface EventItem {
  id: string;
  title: string;
  description?: string;
  datetime: string; // ISO date-time string
  priority?: "Baixa" | "Média" | "Alta";
  durationMinutes?: number;
}

interface EventsContextType {
  events: EventItem[];
  isLoading: boolean;
  createEvent: (data: Omit<EventItem, 'id'>) => Promise<EventItem>;
  updateEvent: (id: string, data: Partial<EventItem>) => Promise<EventItem>;
  deleteEvent: (id: string) => Promise<void>;
  getEventById: (id: string) => EventItem | undefined;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export const useEvents = () => {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error('useEvents must be used within EventsProvider');
  return ctx;
};

interface EventsProviderProps {
  children: ReactNode;
}

export const EventsProvider = ({ children }: EventsProviderProps) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchEvents = async () => {
    if (!user) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('datetime', { ascending: true });

      if (error) throw error;

      const mappedEvents: EventItem[] = (data || []).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description || undefined,
        datetime: event.datetime,
        priority: event.priority as "Baixa" | "Média" | "Alta" || 'Média',
        durationMinutes: event.duration_minutes || 60
      }));

      setEvents(mappedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const createEvent = async (data: Omit<EventItem, 'id'>) => {
    if (!user) throw new Error('Usuário não autenticado');
    if (!data.title) throw new Error('Título é obrigatório');

    const eventData = {
      user_id: user.id,
      title: data.title,
      description: data.description || null,
      datetime: data.datetime,
      priority: data.priority || 'Média',
      duration_minutes: data.durationMinutes || 60
    };

    const { data: newEvent, error } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();

    if (error) throw error;

    const mappedEvent: EventItem = {
      id: newEvent.id,
      title: newEvent.title,
      description: newEvent.description || undefined,
      datetime: newEvent.datetime,
      priority: newEvent.priority as "Baixa" | "Média" | "Alta",
      durationMinutes: newEvent.duration_minutes
    };

    setEvents(prev => [...prev, mappedEvent].sort((a, b) => a.datetime.localeCompare(b.datetime)));
    return mappedEvent;
  };

  const updateEvent = async (id: string, data: Partial<EventItem>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.datetime !== undefined) updateData.datetime = data.datetime;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.durationMinutes !== undefined) updateData.duration_minutes = data.durationMinutes;

    const { data: updatedEvent, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    const mappedEvent: EventItem = {
      id: updatedEvent.id,
      title: updatedEvent.title,
      description: updatedEvent.description || undefined,
      datetime: updatedEvent.datetime,
      priority: updatedEvent.priority as "Baixa" | "Média" | "Alta",
      durationMinutes: updatedEvent.duration_minutes
    };

    setEvents(prev => prev.map(event => event.id === id ? mappedEvent : event));
    return mappedEvent;
  };

  const deleteEvent = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setEvents(prev => prev.filter(event => event.id !== id));
  };

  const getEventById = (id: string) => events.find(e => e.id === id);

  const value: EventsContextType = {
    events,
    isLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventById
  };

  return (
    <EventsContext.Provider value={value}>
      {children}
    </EventsContext.Provider>
  );
};