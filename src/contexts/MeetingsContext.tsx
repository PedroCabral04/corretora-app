import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './AuthContext';

export interface Meeting {
  id: string;
  brokerId: string;
  clientName: string;
  meetingType: string;
  meetingDate: string;
  notes?: string;
}

interface MeetingsContextType {
  meetings: Meeting[];
  isLoading: boolean;
  createMeeting: (data: Omit<Meeting, 'id'>) => Promise<Meeting>;
  updateMeeting: (id: string, data: Partial<Meeting>) => Promise<Meeting>;
  deleteMeeting: (id: string) => Promise<void>;
  getMeetingsByBrokerId: (brokerId: string) => Meeting[];
}

const MeetingsContext = createContext<MeetingsContextType | undefined>(undefined);

export const useMeetings = () => {
  const ctx = useContext(MeetingsContext);
  if (!ctx) throw new Error('useMeetings must be used within MeetingsProvider');
  return ctx;
};

interface MeetingsProviderProps {
  children: ReactNode;
}

export const MeetingsProvider = ({ children }: MeetingsProviderProps) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchMeetings = async () => {
    if (!user) {
      setMeetings([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('user_id', user.id)
        .order('meeting_date', { ascending: false });

      if (error) throw error;

      const mappedMeetings: Meeting[] = (data || []).map(meeting => ({
        id: meeting.id,
        brokerId: meeting.broker_id,
        clientName: meeting.client_name,
        meetingType: meeting.meeting_type,
        meetingDate: meeting.meeting_date,
        notes: meeting.notes || undefined
      }));

      setMeetings(mappedMeetings);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setMeetings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [user]);

  const createMeeting = async (data: Omit<Meeting, 'id'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const meetingData = {
      user_id: user.id,
      broker_id: data.brokerId,
      client_name: data.clientName,
      meeting_type: data.meetingType,
      meeting_date: data.meetingDate,
      notes: data.notes || null
    };

    const { data: newMeeting, error } = await supabase
      .from('meetings')
      .insert([meetingData])
      .select()
      .single();

    if (error) throw error;

    const mappedMeeting: Meeting = {
      id: newMeeting.id,
      brokerId: newMeeting.broker_id,
      clientName: newMeeting.client_name,
      meetingType: newMeeting.meeting_type,
      meetingDate: newMeeting.meeting_date,
      notes: newMeeting.notes || undefined
    };

    setMeetings(prev => [mappedMeeting, ...prev]);
    return mappedMeeting;
  };

  const updateMeeting = async (id: string, data: Partial<Meeting>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const updateData: any = {};
    if (data.clientName !== undefined) updateData.client_name = data.clientName;
    if (data.meetingType !== undefined) updateData.meeting_type = data.meetingType;
    if (data.meetingDate !== undefined) updateData.meeting_date = data.meetingDate;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    const { data: updatedMeeting, error } = await supabase
      .from('meetings')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    const mappedMeeting: Meeting = {
      id: updatedMeeting.id,
      brokerId: updatedMeeting.broker_id,
      clientName: updatedMeeting.client_name,
      meetingType: updatedMeeting.meeting_type,
      meetingDate: updatedMeeting.meeting_date,
      notes: updatedMeeting.notes || undefined
    };

    setMeetings(prev => prev.map(meeting => meeting.id === id ? mappedMeeting : meeting));
    return mappedMeeting;
  };

  const deleteMeeting = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setMeetings(prev => prev.filter(meeting => meeting.id !== id));
  };

  const getMeetingsByBrokerId = (brokerId: string) => meetings.filter(m => m.brokerId === brokerId);

  const value: MeetingsContextType = {
    meetings,
    isLoading,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    getMeetingsByBrokerId
  };

  return (
    <MeetingsContext.Provider value={value}>
      {children}
    </MeetingsContext.Provider>
  );
};