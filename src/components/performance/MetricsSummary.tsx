import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PerformanceMetrics } from "@/contexts/PerformanceContext";
import { 
  Target, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Award
} from "lucide-react";

interface MetricsSummaryProps {
  metrics: PerformanceMetrics[];
  totalTarget: number;
  totalAchieved: number;
  period: string;
  compact?: boolean;
  showDetails?: boolean;
}

export const MetricsSummary: React.FC<MetricsSummaryProps> = ({ 
  metrics, 
  totalTarget, 
  totalAchieved, 
  period,
  compact = false,
  showDetails = true
}) => {
  // Calcular estatísticas
  const totalProgress = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;
  const completedMetrics = metrics.filter(m => m.currentValue >= m.targetValue).length;
  const inProgressMetrics = metrics.filter(m => m.currentValue > 0 && m.currentValue < m.targetValue).length;
  const notStartedMetrics = metrics.filter(m => m.currentValue === 0).length;
  
  // Tradução dos tipos de métrica
  const METRIC_LABELS: Record<string, string> = {
    calls: 'Chamadas',
    personal_visits: 'Visitas Pessoais',
    office_visits: 'Visitas ao Escritório',
    listings: 'Captações',
    sales: 'Vendas',
    tasks: 'Tarefas'
  };

  // Obter cor baseada no progresso
  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Obter status baseado no progresso
  const getProgressStatus = (progress: number) => {
    if (progress >= 100) return { text: 'Concluído', color: 'text-green-600', icon: CheckCircle };
    if (progress >= 75) return { text: 'Quase lá', color: 'text-blue-600', icon: TrendingUp };
    if (progress >= 50) return { text: 'Bom progresso', color: 'text-yellow-600', icon: TrendingUp };
    if (progress >= 25) return { text: 'Começando', color: 'text-orange-600', icon: Clock };
    return { text: 'Precisa atenção', color: 'text-red-600', icon: AlertCircle };
  };

  const status = getProgressStatus(totalProgress);
  const StatusIcon = status.icon;

  // Renderização compacta
  if (compact) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Resumo de Metas</span>
            </div>
            <Badge className={status.color} variant="outline">
              {status.text}
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Progresso Total</span>
                <span className="font-medium">{totalProgress.toFixed(1)}%</span>
              </div>
              <Progress 
                value={totalProgress} 
                className="h-2"
              />
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Período</span>
              <span className="font-medium">{period}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Métricas</span>
              <span className="font-medium">{metrics.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderização completa
  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Resumo de Desempenho
          </CardTitle>
          <div className="flex items-center gap-2">
            {totalProgress >= 100 && (
              <Award className="h-5 w-5 text-yellow-500" />
            )}
            <Badge className={status.color} variant="outline">
              {status.text}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progresso geral */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-4 w-4 ${status.color}`} />
              <span className="font-medium">Progresso Total</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold">{totalProgress.toFixed(1)}%</span>
              <p className="text-xs text-muted-foreground">
                {totalAchieved} de {totalTarget} metas
              </p>
            </div>
          </div>
          <Progress 
            value={totalProgress} 
            className={`h-3 ${getProgressColor(totalProgress)}`}
          />
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-lg font-bold">{completedMetrics}</span>
            </div>
            <p className="text-xs text-muted-foreground">Concluídas</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-blue-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-lg font-bold">{inProgressMetrics}</span>
            </div>
            <p className="text-xs text-muted-foreground">Em andamento</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-600">
              <Clock className="h-4 w-4" />
              <span className="text-lg font-bold">{notStartedMetrics}</span>
            </div>
            <p className="text-xs text-muted-foreground">Não iniciadas</p>
          </div>
        </div>

        {/* Período */}
        <div className="bg-muted/50 rounded-md p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Período de avaliação</span>
            <span className="text-sm font-medium">{period}</span>
          </div>
        </div>

        {/* Métricas detalhadas */}
        {showDetails && metrics.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Detalhes por Métrica</h4>
            <div className="space-y-3">
              {metrics.map(metric => {
                const progress = metric.targetValue > 0 
                  ? (metric.currentValue / metric.targetValue) * 100 
                  : 0;
                const isCompleted = metric.currentValue >= metric.targetValue;
                
                return (
                  <div key={metric.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: metric.color }}
                        />
                        <span className="text-sm font-medium capitalize">
                          {METRIC_LABELS[metric.type] || metric.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {metric.currentValue}/{metric.targetValue}
                        </span>
                        {isCompleted && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </div>
                    <Progress 
                      value={progress} 
                      className="h-2"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};