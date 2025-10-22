import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './AuthContext';
import { useTasks } from './TasksContext';
import { useMeetings } from './MeetingsContext';
import { useSales } from './SalesContext';
import { useListings } from './ListingsContext';

// Tipos de dados
export type MetricType = 'calls' | 'personal_visits' | 'office_visits' | 'listings' | 'sales' | 'tasks';
export type ChallengeStatus = 'active' | 'completed' | 'expired' | 'cancelled';

export interface PerformanceChallenge {
  id: string;
  userId: string;
  brokerId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: ChallengeStatus;
  metrics: PerformanceMetrics[];
  createdAt: string;
  updatedAt: string;
  // Computed fields
  totalProgress?: number;
  daysRemaining?: number;
  isOverdue?: boolean;
}

export interface PerformanceMetrics {
  id: string;
  challengeId: string;
  type: MetricType;
  targetValue: number;
  currentValue: number;
  unit: string;
  color: string;
  // Computed fields
  progress?: number;
}

export interface ProgressData {
  totalProgress: number;
  metricsProgress: Record<string, number>;
  isCompleted: boolean;
  completedAt?: string;
}

export interface CreateChallengeData {
  brokerId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  metrics: Omit<PerformanceMetrics, 'id' | 'challengeId' | 'currentValue' | 'progress'>[];
}

export interface ChallengeFormData extends CreateChallengeData {
  id?: string;
}

interface PerformanceContextType {
  // Estado
  challenges: PerformanceChallenge[];
  metrics: PerformanceMetrics[];
  isLoading: boolean;
  error: string | null;
  
  // CRUD de Desafios
  createChallenge: (data: CreateChallengeData) => Promise<PerformanceChallenge>;
  updateChallenge: (id: string, data: Partial<PerformanceChallenge>) => Promise<PerformanceChallenge>;
  deleteChallenge: (id: string) => Promise<void>;
  getChallengeById: (id: string) => PerformanceChallenge | undefined;
  getChallengesByBrokerId: (brokerId: string) => PerformanceChallenge[];
  
  // Gestão de Métricas
  calculateProgress: (challengeId: string) => Promise<ProgressData>;
  updateMetrics: (challengeId: string) => Promise<void>;
  getMetricsByChallengeId: (challengeId: string) => PerformanceMetrics[];
  
  // Filtros e Consultas
  getActiveChallenges: () => PerformanceChallenge[];
  getCompletedChallenges: () => PerformanceChallenge[];
  getExpiredChallenges: () => PerformanceChallenge[];
  
  // Utilitários
  refreshChallenges: () => Promise<void>;
  exportChallengeReport: (challengeId: string) => Promise<Blob>;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export const usePerformance = () => {
  const ctx = useContext(PerformanceContext);
  if (!ctx) throw new Error('usePerformance must be used within PerformanceProvider');
  return ctx;
};

interface PerformanceProviderProps {
  children: ReactNode;
}

// Cores para métricas
const METRIC_COLORS: Record<MetricType, string> = {
  calls: '#3B82F6',
  personal_visits: '#10B981',
  office_visits: '#F59E0B',
  listings: '#8B5CF6',
  sales: '#EF4444',
  tasks: '#06B6D4'
};

// Unidades para métricas
const METRIC_UNITS: Record<MetricType, string> = {
  calls: 'chamadas',
  personal_visits: 'visitas',
  office_visits: 'visitas',
  listings: 'imóveis',
  sales: 'vendas',
  tasks: 'tarefas'
};

// Funções auxiliares
const mapDatabaseToChallenge = (dbChallenge: any): PerformanceChallenge => {
  const today = new Date();
  const endDate = new Date(dbChallenge.end_date);
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    id: dbChallenge.id,
    userId: dbChallenge.user_id,
    brokerId: dbChallenge.broker_id,
    title: dbChallenge.title,
    description: dbChallenge.description,
    startDate: dbChallenge.start_date,
    endDate: dbChallenge.end_date,
    status: dbChallenge.status,
    metrics: [], // Será preenchido depois
    createdAt: dbChallenge.created_at,
    updatedAt: dbChallenge.updated_at,
    daysRemaining,
    isOverdue: daysRemaining < 0 && dbChallenge.status !== 'completed'
  };
};

const mapDatabaseToMetric = (dbMetric: any): PerformanceMetrics => {
  const progress = dbMetric.target_value > 0 
    ? Math.min((dbMetric.current_value / dbMetric.target_value) * 100, 100) 
    : 0;

  return {
    id: dbMetric.id,
    challengeId: dbMetric.challenge_id,
    type: dbMetric.metric_type,
    targetValue: dbMetric.target_value,
    currentValue: dbMetric.current_value,
    unit: dbMetric.unit,
    color: dbMetric.color,
    progress
  };
};

const calculateTotalProgress = (metrics: PerformanceMetrics[]): number => {
  if (metrics.length === 0) return 0;
  const totalProgress = metrics.reduce((sum, metric) => {
    const progress = (metric.currentValue / metric.targetValue) * 100;
    return sum + Math.min(progress, 100);
  }, 0);
  return totalProgress / metrics.length;
};

const getStatusColor = (status: ChallengeStatus): string => {
  switch (status) {
    case 'active': return 'bg-blue-500';
    case 'completed': return 'bg-green-500';
    case 'expired': return 'bg-red-500';
    case 'cancelled': return 'bg-gray-500';
    default: return 'bg-gray-500';
  }
};

export const PerformanceProvider: React.FC<PerformanceProviderProps> = ({ children }) => {
  const [challenges, setChallenges] = useState<PerformanceChallenge[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { tasks } = useTasks();
  const { meetings } = useMeetings();
  const { sales } = useSales();
  const { listings } = useListings();

  // Buscar desafios
  const fetchChallenges = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('performance_challenges' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedChallenges: PerformanceChallenge[] = (data || []).map(mapDatabaseToChallenge);
      setChallenges(mappedChallenges);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar desafios');
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar métricas
  const fetchMetrics = async () => {
    if (!user || challenges.length === 0) return;
    
    try {
      const { data, error } = await supabase
        .from('performance_metrics' as any)
        .select('*')
        .in('challenge_id', challenges.map(c => c.id));

      if (error) throw error;

      const mappedMetrics: PerformanceMetrics[] = (data || []).map(mapDatabaseToMetric);
      setMetrics(mappedMetrics);

      // Atualizar desafios com métricas e progresso
      const updatedChallenges = challenges.map(challenge => {
        const challengeMetrics = mappedMetrics.filter(m => m.challengeId === challenge.id);
        const totalProgress = calculateTotalProgress(challengeMetrics);
        return {
          ...challenge,
          metrics: challengeMetrics,
          totalProgress
        };
      });
      
      setChallenges(updatedChallenges);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar métricas');
    }
  };

  // Criar desafio
  const createChallenge = async (data: CreateChallengeData): Promise<PerformanceChallenge> => {
    if (!user) throw new Error('Usuário não autenticado');

    // Inserir desafio
    const { data: newChallenge, error } = await supabase
      .from('performance_challenges' as any)
      .insert({
        user_id: user.id,
        broker_id: data.brokerId,
        title: data.title,
        description: data.description,
        start_date: data.startDate,
        end_date: data.endDate
      })
      .select()
      .single();

    if (error) throw error;
    if (!newChallenge) throw new Error('Erro ao criar desafio');
    
    const challengeData = newChallenge as any;

    // Inserir métricas com cores e unidades padrão
    const metricsToInsert = data.metrics.map(metric => ({
      challenge_id: challengeData.id,
      metric_type: metric.type,
      target_value: metric.targetValue,
      unit: METRIC_UNITS[metric.type],
      color: METRIC_COLORS[metric.type]
    }));

    const { data: newMetrics, error: metricsError } = await supabase
      .from('performance_metrics' as any)
      .insert(metricsToInsert)
      .select();

    if (metricsError) throw metricsError;

    // Atualizar estado local
    const mappedChallenge = mapDatabaseToChallenge(challengeData);
    const mappedMetrics = (newMetrics || []).map(mapDatabaseToMetric);
    
    const challengeWithMetrics = {
      ...mappedChallenge,
      metrics: mappedMetrics,
      totalProgress: calculateTotalProgress(mappedMetrics)
    };
    
    setChallenges(prev => [challengeWithMetrics, ...prev]);
    setMetrics(prev => [...prev, ...mappedMetrics]);

    return challengeWithMetrics;
  };

  // Atualizar desafio
  const updateChallenge = async (id: string, data: Partial<PerformanceChallenge>): Promise<PerformanceChallenge> => {
    if (!user) throw new Error('Usuário não autenticado');

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.startDate !== undefined) updateData.start_date = data.startDate;
    if (data.endDate !== undefined) updateData.end_date = data.endDate;
    if (data.status !== undefined) updateData.status = data.status;

    const { data: updatedChallenge, error } = await supabase
      .from('performance_challenges' as any)
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    const mappedChallenge = mapDatabaseToChallenge(updatedChallenge);
    const challengeMetrics = metrics.filter(m => m.challengeId === id);
    
    const challengeWithMetrics = {
      ...mappedChallenge,
      metrics: challengeMetrics,
      totalProgress: calculateTotalProgress(challengeMetrics)
    };
    
    setChallenges(prev => prev.map(c => c.id === id ? challengeWithMetrics : c));
    return challengeWithMetrics;
  };

  // Excluir desafio
  const deleteChallenge = async (id: string): Promise<void> => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('performance_challenges' as any)
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setChallenges(prev => prev.filter(c => c.id !== id));
    setMetrics(prev => prev.filter(m => m.challengeId !== id));
  };

  // Calcular progresso
  const calculateProgress = async (challengeId: string): Promise<ProgressData> => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) throw new Error('Desafio não encontrado');

    const challengeMetrics = metrics.filter(m => m.challengeId === challengeId);
    const metricsProgress: Record<string, number> = {};

    // Para cada métrica, calcular valor atual baseado nas atividades
    for (const metric of challengeMetrics) {
      const currentValue = await calculateMetricValue(
        metric.type,
        challenge.brokerId,
        challenge.startDate,
        challenge.endDate
      );
      
      metricsProgress[metric.type] = (currentValue / metric.targetValue) * 100;
      
      // Atualizar métrica no banco se necessário
      if (currentValue !== metric.currentValue) {
        await supabase
          .from('performance_metrics' as any)
          .update({ current_value: currentValue })
          .eq('id', metric.id);
      }
    }

    // Calcular progresso total (média simples)
    const totalProgress = Object.values(metricsProgress).reduce((sum, progress) => sum + progress, 0) / Object.keys(metricsProgress).length;
    const isCompleted = Object.values(metricsProgress).every(progress => progress >= 100);

    return {
      totalProgress,
      metricsProgress,
      isCompleted,
      completedAt: isCompleted ? new Date().toISOString() : undefined
    };
  };

  // Calcular valor da métrica baseado nas atividades
  const calculateMetricValue = async (
    type: MetricType,
    brokerId: string,
    startDate: string,
    endDate: string
  ): Promise<number> => {
    switch (type) {
      case 'tasks':
        return tasks.filter(task => 
          task.brokerId === brokerId &&
          task.status === 'Concluída' &&
          task.dueDate >= startDate &&
          task.dueDate <= endDate
        ).length;
      
      case 'personal_visits':
        return meetings.filter(meeting => 
          meeting.brokerId === brokerId &&
          meeting.meetingType === 'personal_visits' &&
          meeting.status === 'completed' &&
          meeting.meetingDate >= startDate &&
          meeting.meetingDate <= endDate
        ).length;
      
      case 'office_visits':
        return meetings.filter(meeting => 
          meeting.brokerId === brokerId &&
          meeting.meetingType === 'office_visits' &&
          meeting.status === 'completed' &&
          meeting.meetingDate >= startDate &&
          meeting.meetingDate <= endDate
        ).length;
      
      case 'listings':
        return listings.filter(listing => 
          listing.brokerId === brokerId &&
          listing.listingDate >= startDate &&
          listing.listingDate <= endDate
        ).length;
      
      case 'sales':
        return sales.filter(sale => 
          sale.brokerId === brokerId &&
          sale.saleDate >= startDate &&
          sale.saleDate <= endDate
        ).length;
      
      case 'calls':
        // Implementar lógica para chamadas (pode ser em meetings ou nova tabela)
        return 0;
      
      default:
        return 0;
    }
  };

  // Atualizar métricas de um desafio
  const updateMetrics = async (challengeId: string): Promise<void> => {
    await calculateProgress(challengeId);
    await fetchMetrics(); // Refresh metrics after recalculation
  };

  // Funções de consulta
  const getChallengeById = (id: string): PerformanceChallenge | undefined => {
    return challenges.find(c => c.id === id);
  };

  const getChallengesByBrokerId = (brokerId: string): PerformanceChallenge[] => {
    return challenges.filter(c => c.brokerId === brokerId);
  };

  const getMetricsByChallengeId = (challengeId: string): PerformanceMetrics[] => {
    return metrics.filter(m => m.challengeId === challengeId);
  };

  const getActiveChallenges = (): PerformanceChallenge[] => {
    return challenges.filter(c => c.status === 'active');
  };

  const getCompletedChallenges = (): PerformanceChallenge[] => {
    return challenges.filter(c => c.status === 'completed');
  };

  const getExpiredChallenges = (): PerformanceChallenge[] => {
    return challenges.filter(c => c.status === 'expired');
  };

  const refreshChallenges = async (): Promise<void> => {
    await fetchChallenges();
  };

  const exportChallengeReport = async (challengeId: string): Promise<Blob> => {
    // Implementar exportação de relatório
    const challenge = getChallengeById(challengeId);
    if (!challenge) throw new Error('Desafio não encontrado');
    
    // Criar CSV simples
    const csvContent = [
      ['Desafio', challenge.title],
      ['Corretor', challenge.brokerId],
      ['Período', `${challenge.startDate} a ${challenge.endDate}`],
      ['Status', challenge.status],
      ['Progresso Total', `${challenge.totalProgress?.toFixed(2)}%`],
      [],
      ['Métrica', 'Meta', 'Atual', 'Progresso'],
      ...challenge.metrics.map(metric => [
        metric.type,
        metric.targetValue.toString(),
        metric.currentValue.toString(),
        `${metric.progress?.toFixed(2)}%`
      ])
    ].map(row => row.join(',')).join('\n');
    
    return new Blob([csvContent], { type: 'text/csv' });
  };

  // Efeitos
  useEffect(() => {
    fetchChallenges();
  }, [user]);

  useEffect(() => {
    if (challenges.length > 0) {
      fetchMetrics();
    }
  }, [challenges]);

  // Recalcular métricas quando atividades mudam
  useEffect(() => {
    const recalculateAllMetrics = async () => {
      for (const challenge of challenges) {
        await calculateProgress(challenge.id);
      }
      await fetchMetrics(); // Refresh metrics after recalculation
    };

    if (tasks.length > 0 || meetings.length > 0 || sales.length > 0 || listings.length > 0) {
      recalculateAllMetrics();
    }
  }, [tasks, meetings, sales, listings]);

  const value: PerformanceContextType = {
    challenges,
    metrics,
    isLoading,
    error,
    createChallenge,
    updateChallenge,
    deleteChallenge,
    getChallengeById,
    getChallengesByBrokerId,
    calculateProgress,
    updateMetrics,
    getMetricsByChallengeId,
    getActiveChallenges,
    getCompletedChallenges,
    getExpiredChallenges,
    refreshChallenges,
    exportChallengeReport
  };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
};

export { METRIC_COLORS, METRIC_UNITS, getStatusColor };