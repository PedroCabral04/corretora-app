import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './AuthContext';

export type GoalType = 'sales_count' | 'sales_value' | 'listings' | 'meetings' | 'tasks';
export type GoalStatus = 'active' | 'completed' | 'cancelled' | 'overdue';
export type GoalPriority = 'low' | 'medium' | 'high';

export interface Goal {
  id: string;
  userId: string;
  brokerId: string;
  title: string;
  description?: string;
  goalType: GoalType;
  targetValue: number;
  currentValue: number;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  priority: GoalPriority;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  progress?: number;
  daysRemaining?: number;
  isOverdue?: boolean;
}

interface GoalsContextType {
  goals: Goal[];
  isLoading: boolean;
  createGoal: (data: Omit<Goal, 'id' | 'userId' | 'currentValue' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<Goal>;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<Goal>;
  deleteGoal: (id: string) => Promise<void>;
  updateGoalProgress: (id: string, currentValue: number) => Promise<Goal>;
  getGoalsByBrokerId: (brokerId: string) => Goal[];
  getActiveGoals: () => Goal[];
  getCompletedGoals: () => Goal[];
  getOverdueGoals: () => Goal[];
  refreshGoals: () => Promise<void>;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export const useGoals = () => {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error('useGoals must be used within GoalsProvider');
  return ctx;
};

interface GoalsProviderProps {
  children: ReactNode;
}

const mapDatabaseToGoal = (dbGoal: any): Goal => {
  const today = new Date();
  const endDate = new Date(dbGoal.end_date);
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const progress = dbGoal.target_value > 0 
    ? Math.min((dbGoal.current_value / dbGoal.target_value) * 100, 100) 
    : 0;

  return {
    id: dbGoal.id,
    userId: dbGoal.user_id,
    brokerId: dbGoal.broker_id,
    title: dbGoal.title,
    description: dbGoal.description,
    goalType: dbGoal.goal_type,
    targetValue: parseFloat(dbGoal.target_value),
    currentValue: parseFloat(dbGoal.current_value || 0),
    startDate: dbGoal.start_date,
    endDate: dbGoal.end_date,
    status: dbGoal.status,
    priority: dbGoal.priority,
    createdAt: dbGoal.created_at,
    updatedAt: dbGoal.updated_at,
    progress,
    daysRemaining,
    isOverdue: daysRemaining < 0 && dbGoal.status !== 'completed'
  };
};

export const GoalsProvider = ({ children }: GoalsProviderProps) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchGoals = async () => {
    if (!user) {
      setGoals([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('end_date', { ascending: true });

      if (error) throw error;

      const mappedGoals = (data || []).map(mapDatabaseToGoal);
      setGoals(mappedGoals);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('goals_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchGoals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const createGoal = async (data: Omit<Goal, 'id' | 'userId' | 'currentValue' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Goal> => {
    if (!user) throw new Error('User not authenticated');

    const { data: newGoal, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        broker_id: data.brokerId,
        title: data.title,
        description: data.description,
        goal_type: data.goalType,
        target_value: data.targetValue,
        current_value: 0,
        start_date: data.startDate,
        end_date: data.endDate,
        priority: data.priority || 'medium'
      })
      .select()
      .single();

    if (error) throw error;

    const mappedGoal = mapDatabaseToGoal(newGoal);
    setGoals(prev => [...prev, mappedGoal]);
    return mappedGoal;
  };

  const updateGoal = async (id: string, data: Partial<Goal>): Promise<Goal> => {
    const updateData: any = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.goalType !== undefined) updateData.goal_type = data.goalType;
    if (data.targetValue !== undefined) updateData.target_value = data.targetValue;
    if (data.currentValue !== undefined) updateData.current_value = data.currentValue;
    if (data.startDate !== undefined) updateData.start_date = data.startDate;
    if (data.endDate !== undefined) updateData.end_date = data.endDate;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;

    const { data: updatedGoal, error } = await supabase
      .from('goals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const mappedGoal = mapDatabaseToGoal(updatedGoal);
    setGoals(prev => prev.map(g => g.id === id ? mappedGoal : g));
    return mappedGoal;
  };

  const updateGoalProgress = async (id: string, currentValue: number): Promise<Goal> => {
    return updateGoal(id, { currentValue });
  };

  const deleteGoal = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const getGoalsByBrokerId = (brokerId: string): Goal[] => {
    return goals.filter(g => g.brokerId === brokerId);
  };

  const getActiveGoals = (): Goal[] => {
    return goals.filter(g => g.status === 'active');
  };

  const getCompletedGoals = (): Goal[] => {
    return goals.filter(g => g.status === 'completed');
  };

  const getOverdueGoals = (): Goal[] => {
    return goals.filter(g => g.status === 'overdue' || g.isOverdue);
  };

  const refreshGoals = async (): Promise<void> => {
    await fetchGoals();
  };

  return (
    <GoalsContext.Provider
      value={{
        goals,
        isLoading,
        createGoal,
        updateGoal,
        deleteGoal,
        updateGoalProgress,
        getGoalsByBrokerId,
        getActiveGoals,
        getCompletedGoals,
        getOverdueGoals,
        refreshGoals
      }}
    >
      {children}
    </GoalsContext.Provider>
  );
};
