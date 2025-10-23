import React from 'react';
import { PerformanceCard } from './PerformanceCard';
import { PerformanceChart } from './PerformanceChart';
import { MetricsSummary } from './MetricsSummary';
import { ChallengeForm } from './ChallengeForm';
import { GoalToChallengeConverter } from './GoalToChallengeConverter';
import { usePerformance } from '@/contexts/PerformanceContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Target, TrendingUp, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Componente de integração do sistema de gamificação
 * Fornece uma interface unificada para acessar as funcionalidades de desempenho
 */
export const PerformanceIntegration: React.FC = () => {
  const { challenges, getChallengesByBrokerId, getActiveChallenges } = usePerformance();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Obter desafios do usuário atual
  const getUserChallenges = () => {
    if (!user) return [];
    
    return user.role === 'broker' 
      ? getChallengesByBrokerId(user.id)
      : getActiveChallenges();
  };

  const userChallenges = getUserChallenges();
  const activeChallenge = userChallenges.find(c => c.status === 'active');

  return (
    <div className="space-y-6">
      {/* Cabeçalho com informações gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Sistema de Gamificação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <Target className="h-4 w-4" />
                <span className="text-lg font-bold">{userChallenges.length}</span>
              </div>
              <p className="text-xs text-muted-foreground">Total de Desafios</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-lg font-bold">
                  {userChallenges.filter(c => c.status === 'active').length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Desafios Ativos</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-purple-600">
                <Trophy className="h-4 w-4" />
                <span className="text-lg font-bold">
                  {userChallenges.filter(c => c.status === 'completed').length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Desafios Concluídos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desafio Atual */}
      {activeChallenge && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Desafio Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceCard
              challenge={activeChallenge}
              showDetails={true}
              variant="compact"
            />
          </CardContent>
        </Card>
      )}

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => navigate(user?.role === 'broker' ? '/my-performance' : '/performance')}
            >
              <Trophy className="h-6 w-6" />
              <span>Ver Desempenho</span>
            </Button>
            
            {user?.role === 'manager' && (
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => navigate('/performance')}
              >
                <Plus className="h-6 w-6" />
                <span>Criar Desafio</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Métricas Resumidas */}
      {userChallenges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Resumo de Métricas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MetricsSummary
              metrics={userChallenges.flatMap(c => c.metrics)}
              totalTarget={userChallenges.flatMap(c => c.metrics).reduce((sum, m) => sum + m.targetValue, 0)}
              totalAchieved={userChallenges.flatMap(c => c.metrics).reduce((sum, m) => sum + m.currentValue, 0)}
              period="Todos os desafios"
              compact={true}
              showDetails={false}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/**
 * Hook personalizado para facilitar o uso do sistema de gamificação
 */
export const usePerformanceIntegration = () => {
  const { challenges, getChallengesByBrokerId, getActiveChallenges, createChallenge } = usePerformance();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Obter desafios do usuário atual
  const getUserChallenges = () => {
    if (!user) return [];
    
    return user.role === 'broker' 
      ? getChallengesByBrokerId(user.id)
      : challenges;
  };

  // Navegar para a página de desempenho apropriada
  const goToPerformancePage = () => {
    navigate(user?.role === 'broker' ? '/my-performance' : '/performance');
  };

  // Verificar se o usuário tem permissão para criar desafios
  const canCreateChallenges = user?.role === 'manager' || user?.role === 'admin';

  return {
    challenges,
    userChallenges: getUserChallenges(),
    activeChallenge: getUserChallenges().find(c => c.status === 'active'),
    completedChallenges: getUserChallenges().filter(c => c.status === 'completed'),
    canCreateChallenges,
    goToPerformancePage,
    createChallenge
  };
};

export default PerformanceIntegration;