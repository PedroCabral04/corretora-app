import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Goal } from "@/contexts/GoalsContext";
import { usePerformance } from "@/contexts/PerformanceContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";

interface GoalToChallengeConverterProps {
  goal: Goal;
  onSuccess?: () => void;
}

// Mapeamento de tipos de meta para métricas de desempenho
const GOAL_TO_METRIC_MAP: Record<string, { type: string; label: string }> = {
  'sales_count': { type: 'sales', label: 'Vendas' },
  'sales_value': { type: 'sales', label: 'Vendas' },
  'listings': { type: 'listings', label: 'Captações' },
  'meetings': { type: 'personal_visits', label: 'Visitas Pessoais' },
  'tasks': { type: 'tasks', label: 'Tarefas' }
};

export const GoalToChallengeConverter: React.FC<GoalToChallengeConverterProps> = ({ 
  goal, 
  onSuccess 
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const { createChallenge } = usePerformance();
  const { createNotification } = useNotifications();

  // Verificar se a meta pode ser convertida
  const canConvert = () => {
    if (goal.status === 'completed' || goal.status === 'cancelled') return false;
    if (!GOAL_TO_METRIC_MAP[goal.goalType]) return false;
    return true;
  };

  // Obter informações da métrica correspondente
  const getMetricInfo = () => {
    return GOAL_TO_METRIC_MAP[goal.goalType] || null;
  };

  // Converter meta em desafio
  const handleConvertToChallenge = async () => {
    if (!canConvert()) return;

    setIsConverting(true);
    try {
      const metricInfo = getMetricInfo();
      if (!metricInfo) {
        toast.error('Tipo de meta não suportado para conversão');
        return;
      }

      // Criar desafio de desempenho baseado na meta
      await createChallenge({
        brokerId: goal.brokerId,
        title: `Desafio: ${goal.title}`,
        description: goal.description || `Desafio de desempenho baseado na meta: ${goal.title}`,
        startDate: goal.startDate,
        endDate: goal.endDate,
        metrics: [{
          type: metricInfo.type as any,
          targetValue: goal.targetValue,
          unit: '', // Será definido automaticamente no PerformanceContext
          color: '' // Será definido automaticamente no PerformanceContext
        }]
      });

      // Criar notificação sobre a conversão
      await createNotification({
        title: 'Meta Convertida em Desafio',
        message: `A meta "${goal.title}" foi convertida em um desafio de desempenho com sucesso!`,
        type: 'performance',
        relatedId: goal.id,
        priority: 'medium'
      });

      toast.success('Meta convertida em desafio com sucesso!');
      setIsDialogOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao converter meta em desafio:', error);
      toast.error('Erro ao converter meta em desafio');
    } finally {
      setIsConverting(false);
    }
  };

  const metricInfo = getMetricInfo();
  const canConvertGoal = canConvert();

  if (!metricInfo) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Este tipo de meta não pode ser convertido em desafio de desempenho.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-dashed border-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Converter em Desafio
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Transforme esta meta em um desafio de desempenho gamificado
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">
                {metricInfo.label}
              </Badge>
              <Badge variant="outline">
                Meta: {goal.targetValue}
              </Badge>
            </div>
          </div>
          
          {canConvertGoal ? (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Converter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Converter Meta em Desafio</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Resumo da Conversão</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Meta original:</span>
                        <span className="font-medium">{goal.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tipo:</span>
                        <span className="font-medium">{metricInfo.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valor alvo:</span>
                        <span className="font-medium">{goal.targetValue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Período:</span>
                        <span className="font-medium">
                          {new Date(goal.startDate).toLocaleDateString('pt-BR')} - {new Date(goal.endDate).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Alert>
                    <Target className="h-4 w-4" />
                    <AlertDescription>
                      O desafio criado acompanhará automaticamente o progresso com base nas atividades realizadas
                      ({metricInfo.label.toLowerCase()}) e exibirá rankings, conquistas e notificações.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex justify-end gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isConverting}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleConvertToChallenge}
                      disabled={isConverting}
                    >
                      {isConverting ? 'Convertendo...' : 'Confirmar Conversão'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Badge variant="secondary" className="text-xs">
              {goal.status === 'completed' ? 'Meta concluída' : 
               goal.status === 'cancelled' ? 'Meta cancelada' : 
               'Não disponível'}
            </Badge>
          )}
        </div>
        
        {goal.status === 'active' && canConvertGoal && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Meta ativa e pronta para conversão</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};