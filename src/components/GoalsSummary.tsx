import React from 'react';
import { useGoals } from "@/contexts/GoalsContext";
import { useBrokers } from "@/contexts/BrokersContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const GoalsSummary: React.FC = () => {
  const { goals, getActiveGoals, getOverdueGoals, getCompletedGoals, isLoading } = useGoals();
  const { brokers } = useBrokers();
  const navigate = useNavigate();

  if (isLoading) {
    return null;
  }

  const activeGoals = getActiveGoals();
  const overdueGoals = getOverdueGoals();
  const completedGoals = getCompletedGoals();
  const totalGoals = goals.length;

  // Calculate overall progress
  const totalProgress = goals.reduce((acc, goal) => acc + (goal.progress || 0), 0);
  const averageProgress = totalGoals > 0 ? totalProgress / totalGoals : 0;

  // Get top performing broker (by completed goals)
  const brokerGoalsCount = brokers.map(broker => ({
    broker,
    completedCount: completedGoals.filter(g => g.brokerId === broker.id).length,
    activeCount: activeGoals.filter(g => g.brokerId === broker.id).length
  }));

  const topPerformer = brokerGoalsCount.sort((a, b) => b.completedCount - a.completedCount)[0];

  // Get urgent goals (ending in 7 days or less)
  const urgentGoals = activeGoals.filter(g => g.daysRemaining !== undefined && g.daysRemaining <= 7 && g.daysRemaining >= 0);

  if (totalGoals === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Metas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-4">
            Nenhuma meta cadastrada ainda. Comece a definir metas para acompanhar o desempenho da equipe.
          </p>
          <Button onClick={() => navigate('/goals')} variant="outline" size="sm">
            Criar primeira meta
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Resumo de Metas
            </CardTitle>
            <Button onClick={() => navigate('/goals')} variant="outline" size="sm">
              Ver todas
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{totalGoals}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Ativas</p>
              <p className="text-2xl font-bold text-blue-600">{activeGoals.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Concluídas</p>
              <p className="text-2xl font-bold text-green-600">{completedGoals.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Atrasadas</p>
              <p className="text-2xl font-bold text-red-600">{overdueGoals.length}</p>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Progresso Geral</span>
              <span className="font-semibold">{averageProgress.toFixed(1)}%</span>
            </div>
            <Progress value={averageProgress} className="h-2" />
          </div>

          {/* Top Performer */}
          {topPerformer && topPerformer.completedCount > 0 && (
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Melhor Desempenho</p>
                <p className="font-semibold">{topPerformer.broker.name}</p>
                <p className="text-xs text-muted-foreground">
                  {topPerformer.completedCount} metas concluídas
                </p>
              </div>
            </div>
          )}

          {/* Urgent Goals Alert */}
          {urgentGoals.length > 0 && (
            <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-orange-900">
                  {urgentGoals.length} meta{urgentGoals.length > 1 ? 's' : ''} próxima{urgentGoals.length > 1 ? 's' : ''} do prazo
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  Requer atenção imediata nos próximos 7 dias
                </p>
              </div>
            </div>
          )}

          {/* Overdue Goals Alert */}
          {overdueGoals.length > 0 && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-red-900">
                  {overdueGoals.length} meta{overdueGoals.length > 1 ? 's atrasadas' : ' atrasada'}
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Ajuste os prazos ou revise as estratégias
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
