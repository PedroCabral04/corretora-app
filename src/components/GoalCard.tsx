import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Goal, GoalType, GoalStatus, GoalPriority } from "@/contexts/GoalsContext";
import { Target, TrendingUp, CalendarDays, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GoalCardProps {
  goal: Goal;
  brokerName?: string;
  onEdit?: (goal: Goal) => void;
  onDelete?: (id: string) => void;
  onUpdateProgress?: (id: string, value: number) => void;
}

const goalTypeLabels: Record<GoalType, string> = {
  sales_count: 'Número de Vendas',
  sales_value: 'Valor de Vendas',
  listings: 'Captações',
  meetings: 'Reuniões',
  tasks: 'Tarefas'
};

const goalTypeIcons: Record<GoalType, React.ReactNode> = {
  sales_count: <TrendingUp className="w-4 h-4" />,
  sales_value: <TrendingUp className="w-4 h-4" />,
  listings: <Target className="w-4 h-4" />,
  meetings: <CalendarDays className="w-4 h-4" />,
  tasks: <CheckCircle2 className="w-4 h-4" />
};

const statusColors: Record<GoalStatus, string> = {
  active: 'bg-blue-500',
  completed: 'bg-green-500',
  cancelled: 'bg-gray-500',
  overdue: 'bg-red-500'
};

const statusLabels: Record<GoalStatus, string> = {
  active: 'Em Andamento',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  overdue: 'Atrasada'
};

const priorityColors: Record<GoalPriority, string> = {
  low: 'bg-gray-200 text-gray-800',
  medium: 'bg-yellow-200 text-yellow-800',
  high: 'bg-red-200 text-red-800'
};

const priorityLabels: Record<GoalPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta'
};

export const GoalCard: React.FC<GoalCardProps> = ({ goal, brokerName, onEdit, onDelete, onUpdateProgress }) => {
  const formatValue = (value: number, type: GoalType): string => {
    if (type === 'sales_value') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    }
    return Math.round(value).toString();
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {goalTypeIcons[goal.goalType]}
              <CardTitle className="text-lg">{goal.title}</CardTitle>
            </div>
            {brokerName && (
              <p className="text-sm text-muted-foreground">Corretor: {brokerName}</p>
            )}
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge className={statusColors[goal.status]}>
              {statusLabels[goal.status]}
            </Badge>
            <Badge variant="outline" className={priorityColors[goal.priority]}>
              {priorityLabels[goal.priority]}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {goal.description && (
          <p className="text-sm text-muted-foreground">{goal.description}</p>
        )}

        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">{goalTypeLabels[goal.goalType]}</span>
            <span className="font-semibold">
              {formatValue(goal.currentValue, goal.goalType)} / {formatValue(goal.targetValue, goal.goalType)}
            </span>
          </div>
          <Progress 
            value={goal.progress || 0} 
            className="h-2"
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>{Math.round(goal.progress || 0)}% concluído</span>
            {goal.status === 'active' && goal.progress && goal.progress < 100 && (
              <span>
                {goal.progress >= 100 
                  ? 'Meta atingida! 🎉' 
                  : `Faltam ${formatValue(goal.targetValue - goal.currentValue, goal.goalType)}`
                }
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <CalendarDays className="w-4 h-4" />
            <span>{formatDate(goal.startDate)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span className={goal.isOverdue ? 'text-red-600 font-semibold' : 'text-muted-foreground'}>
              {formatDate(goal.endDate)}
            </span>
          </div>
        </div>

        {goal.daysRemaining !== undefined && goal.status === 'active' && (
          <div className="flex items-center gap-2 text-sm">
            {goal.daysRemaining < 0 ? (
              <div className="flex items-center gap-1 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="font-semibold">Atrasado há {Math.abs(goal.daysRemaining)} dias</span>
              </div>
            ) : goal.daysRemaining === 0 ? (
              <div className="flex items-center gap-1 text-orange-600">
                <AlertCircle className="w-4 h-4" />
                <span className="font-semibold">Último dia!</span>
              </div>
            ) : goal.daysRemaining <= 7 ? (
              <div className="flex items-center gap-1 text-orange-600">
                <Clock className="w-4 h-4" />
                <span>Faltam {goal.daysRemaining} dias</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Faltam {goal.daysRemaining} dias</span>
              </div>
            )}
          </div>
        )}

        {(onEdit || onDelete) && (
          <div className="flex gap-2 pt-2 border-t">
            {onEdit && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEdit(goal)}
                className="flex-1"
              >
                Editar
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onDelete(goal.id)}
                className="flex-1 text-red-600 hover:text-red-700"
              >
                Excluir
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
