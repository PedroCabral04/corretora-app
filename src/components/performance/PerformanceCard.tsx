import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PerformanceChart } from "./PerformanceChart";
import { PerformanceChallenge, ChallengeStatus } from "@/contexts/PerformanceContext";
import { getStatusColor } from "@/contexts/PerformanceContext";
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  Eye, 
  Edit, 
  Trash2,
  Target,
  Award
} from "lucide-react";

interface PerformanceCardProps {
  challenge: PerformanceChallenge;
  brokerName?: string;
  showDetails?: boolean;
  onViewDetails?: (challenge: PerformanceChallenge) => void;
  onEdit?: (challenge: PerformanceChallenge) => void;
  onDelete?: (id: string) => void;
  variant?: 'default' | 'compact' | 'detailed';
}

export const PerformanceCard: React.FC<PerformanceCardProps> = ({ 
  challenge, 
  brokerName,
  showDetails = false,
  onViewDetails,
  onEdit,
  onDelete,
  variant = 'default'
}) => {
  const statusColor = getStatusColor(challenge.status);
  const isCompleted = challenge.status === 'completed';
  const isActive = challenge.status === 'active';
  const isExpired = challenge.status === 'expired';
  
  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Calcular dias restantes
  const getDaysRemainingText = () => {
    if (isCompleted) return 'Concluído';
    if (isExpired) return 'Expirado';
    if (challenge.daysRemaining === undefined) return '';
    
    if (challenge.daysRemaining === 0) return 'Último dia';
    if (challenge.daysRemaining === 1) return '1 dia restante';
    if (challenge.daysRemaining < 0) return `${Math.abs(challenge.daysRemaining)} dias de atraso`;
    return `${challenge.daysRemaining} dias restantes`;
  };

  // Renderização compacta
  if (variant === 'compact') {
    return (
      <Card className={`hover:shadow-md transition-all cursor-pointer ${
        isCompleted ? 'border-green-200 bg-green-50/50' : 
        isExpired ? 'border-red-200 bg-red-50/50' : 
        'border-blue-200 bg-blue-50/50'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-sm truncate">{challenge.title}</h3>
              {brokerName && (
                <p className="text-xs text-muted-foreground">{brokerName}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Progress value={challenge.totalProgress || 0} className="h-1.5 flex-1" />
                <span className="text-xs font-medium">
                  {Math.round(challenge.totalProgress || 0)}%
                </span>
              </div>
            </div>
            <Badge className={`ml-2 ${statusColor}`}>
              {challenge.status}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderização padrão
  return (
    <Card className={`hover:shadow-lg transition-all cursor-pointer ${
      isCompleted ? 'border-green-200 bg-green-50/30' : 
      isExpired ? 'border-red-200 bg-red-50/30' : 
      'border-blue-200 bg-blue-50/30'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {isCompleted && <Award className="h-5 w-5 text-green-600" />}
              {challenge.title}
            </CardTitle>
            {brokerName && (
              <p className="text-sm text-muted-foreground">{brokerName}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}
              </span>
            </div>
          </div>
          <Badge className={`${statusColor} ml-2`}>
            {challenge.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progresso total */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Progresso Total</span>
            </div>
            <span className="text-sm font-bold">
              {Math.round(challenge.totalProgress || 0)}%
            </span>
          </div>
          <Progress 
            value={challenge.totalProgress || 0} 
            className={`h-3 ${
              isCompleted ? 'bg-green-100' : 
              isExpired ? 'bg-red-100' : 
              'bg-blue-100'
            }`}
          />
        </div>

        {/* Tempo restante */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Tempo</span>
          </div>
          <span className={`font-medium ${
            isCompleted ? 'text-green-600' : 
            isExpired ? 'text-red-600' : 
            challenge.daysRemaining !== undefined && challenge.daysRemaining <= 3 ? 'text-orange-600' : 
            'text-muted-foreground'
          }`}>
            {getDaysRemainingText()}
          </span>
        </div>

        {/* Gráfico de pizza */}
        {showDetails && challenge.metrics.length > 0 && (
          <div className="flex items-center justify-center py-2">
            <div className="w-32 h-32">
              <PerformanceChart 
                data={challenge.metrics}
                size="sm"
                showLabels={false}
                showLegend={false}
              />
            </div>
          </div>
        )}

        {/* Métricas detalhadas */}
        {showDetails && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Métricas</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {challenge.metrics.map(metric => (
                <div key={metric.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: metric.color }}
                    />
                    <span className="text-muted-foreground capitalize">
                      {metric.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {metric.currentValue}/{metric.targetValue}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({Math.round(metric.progress || 0)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center gap-2 pt-2 border-t">
          {onViewDetails && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(challenge);
              }}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver Detalhes
            </Button>
          )}
          {onEdit && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(challenge);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(challenge.id);
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};