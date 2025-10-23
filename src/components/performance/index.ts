// Exportar todos os componentes de desempenho
export { PerformanceCard } from './PerformanceCard';
export { PerformanceChart } from './PerformanceChart';
export { MetricsSummary } from './MetricsSummary';
export { ChallengeForm } from './ChallengeForm';
export { GoalToChallengeConverter } from './GoalToChallengeConverter';
export { PerformanceIntegration, usePerformanceIntegration } from './PerformanceIntegration';

// Exportar tipos e utilitários do contexto
export {
  usePerformance,
  PerformanceProvider,
  METRIC_COLORS,
  METRIC_UNITS,
  getStatusColor
} from '@/contexts/PerformanceContext';

// Exportar tipos
export type {
  PerformanceChallenge,
  PerformanceMetrics,
  ProgressData,
  CreateChallengeData,
  ChallengeFormData,
  MetricType,
  ChallengeStatus
} from '@/contexts/PerformanceContext';