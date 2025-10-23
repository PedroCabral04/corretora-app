import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Broker } from "@/contexts/BrokersContext";
import { ChallengeFormData, MetricType, PerformanceMetrics, METRIC_COLORS, METRIC_UNITS } from "@/contexts/PerformanceContext";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "react-router-dom";

interface ChallengeFormProps {
  challenge?: ChallengeFormData;
  brokers?: Broker[];
  onSubmit: (data: ChallengeFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  autoBrokerId?: string; // ID do corretor para preenchimento automático
}

// Tipos de métricas disponíveis
const AVAILABLE_METRICS: { type: MetricType; label: string; description: string }[] = [
  { type: 'calls', label: 'Chamadas', description: 'Número de ligações realizadas' },
  { type: 'personal_visits', label: 'Visitas Pessoais', description: 'Visitas a clientes em locais externos' },
  { type: 'office_visits', label: 'Visitas ao Escritório', description: 'Visitas de clientes ao escritório' },
  { type: 'listings', label: 'Captações', description: 'Novos imóveis captados' },
  { type: 'sales', label: 'Vendas', description: 'Imóveis vendidos' },
  { type: 'tasks', label: 'Tarefas', description: 'Tarefas concluídas' }
];

export const ChallengeForm: React.FC<ChallengeFormProps> = ({
  challenge,
  brokers = [],
  onSubmit,
  onCancel,
  isLoading = false,
  autoBrokerId
}) => {
  const { user } = useAuth();
  const { brokerId } = useParams();
  
  // Determinar o ID do corretor automaticamente
  const getAutoBrokerId = () => {
    if (autoBrokerId) return autoBrokerId;
    if (brokerId) return brokerId;
    if (user?.role === 'broker') return user.id;
    return challenge?.brokerId || '';
  };

  // Data atual formatada para input
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState<ChallengeFormData>({
    brokerId: getAutoBrokerId(),
    title: challenge?.title || '',
    description: challenge?.description || '',
    startDate: challenge?.startDate || getCurrentDate(),
    endDate: challenge?.endDate || '',
    metrics: challenge?.metrics || []
  });
  
  const [selectedMetrics, setSelectedMetrics] = useState<MetricType[]>(
    challenge?.metrics.map(m => m.type) || []
  );
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para os calendários
  const [startDateCalendarOpen, setStartDateCalendarOpen] = useState(false);
  const [endDateCalendarOpen, setEndDateCalendarOpen] = useState(false);

  // Função memoizada para comparar arrays de métricas
  const areMetricsEqual = useCallback((metrics1: any[], metrics2: any[]) => {
    if (metrics1.length !== metrics2.length) return false;
    return metrics1.every((m1, index) => {
      const m2 = metrics2[index];
      return m1.type === m2.type &&
             m1.targetValue === m2.targetValue &&
             m1.unit === m2.unit &&
             m1.color === m2.color;
    });
  }, []);

  // Memoizar as métricas atualizadas para evitar re-renderizações desnecessárias
  const updatedMetrics = useMemo(() => {
    return selectedMetrics.map(type => {
      const existingMetric = formData.metrics.find(m => m.type === type);
      return existingMetric || {
        type,
        targetValue: 0,
        unit: METRIC_UNITS[type],
        color: METRIC_COLORS[type]
      };
    });
  }, [selectedMetrics, formData.metrics]);

  // Atualizar métricas quando tipos selecionados mudam - CORRIGIDO para evitar loop infinito
  useEffect(() => {
    // Verificar se as métricas realmente mudaram antes de atualizar
    if (!areMetricsEqual(updatedMetrics, formData.metrics)) {
      setFormData(prev => ({
        ...prev,
        metrics: updatedMetrics
      }));
    }
  }, [updatedMetrics, areMetricsEqual]); // Usando métricas memoizadas

  // Atualizar brokerId se autoBrokerId mudar
  useEffect(() => {
    const newBrokerId = getAutoBrokerId();
    if (newBrokerId && newBrokerId !== formData.brokerId) {
      setFormData(prev => ({
        ...prev,
        brokerId: newBrokerId
      }));
    }
  }, [autoBrokerId, brokerId, user?.id]);

  // Validação do formulário
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Só validar brokerId se não for automático
    if (!autoBrokerId && !brokerId && !(user?.role === 'broker') && !formData.brokerId) {
      newErrors.brokerId = 'Selecione um corretor';
    }
    
    if (!formData.title.trim()) {
      newErrors.title = 'O título é obrigatório';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'A data de início é obrigatória';
    }
    
    if (!formData.endDate) {
      newErrors.endDate = 'A data de término é obrigatória';
    }
    
    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      newErrors.endDate = 'A data de término deve ser posterior à data de início';
    }
    
    if (selectedMetrics.length === 0) {
      newErrors.metrics = 'Selecione pelo menos uma métrica';
    }
    
    // Validar valores das métricas
    selectedMetrics.forEach(type => {
      const metric = formData.metrics.find(m => m.type === type);
      if (metric && metric.targetValue <= 0) {
        newErrors[`metric_${type}`] = 'O valor deve ser maior que zero';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Erro ao salvar desafio:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle de métrica - memoizado para evitar re-renderizações desnecessárias
  const toggleMetric = useCallback((type: MetricType) => {
    setSelectedMetrics(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }, []);

  // Atualizar valor da métrica - memoizado para evitar re-renderizações desnecessárias
  const updateMetricValue = useCallback((type: MetricType, value: number) => {
    setFormData(prev => ({
      ...prev,
      metrics: prev.metrics.map(metric =>
        metric.type === type ? { ...metric, targetValue: value } : metric
      )
    }));
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {challenge?.id ? 'Editar Desafio' : 'Criar Novo Desafio'}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Seletor de corretor só aparece se não for automático */}
            {!autoBrokerId && !brokerId && !(user?.role === 'broker') && (
              <div className="space-y-2">
                <Label htmlFor="brokerId">Corretor *</Label>
                <Select
                  value={formData.brokerId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, brokerId: value }))}
                  disabled={!!challenge?.id}
                >
                  <SelectTrigger className={errors.brokerId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione um corretor" />
                  </SelectTrigger>
                  <SelectContent>
                    {brokers.map(broker => (
                      <SelectItem key={broker.id} value={broker.id}>
                        {broker.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.brokerId && (
                  <p className="text-sm text-red-500">{errors.brokerId}</p>
                )}
              </div>
            )}
            
            <div className={`space-y-2 ${!autoBrokerId && !brokerId && !(user?.role === 'broker') ? '' : 'md:col-span-2'}`}>
              <Label htmlFor="title">Título do Desafio *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Meta de Janeiro 2024"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva os detalhes e objetivos deste desafio..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início *</Label>
              <Popover open={startDateCalendarOpen} onOpenChange={setStartDateCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground",
                      errors.startDate && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? (
                      format(new Date(formData.startDate), "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate ? new Date(formData.startDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const formattedDate = date.toISOString().split('T')[0];
                        setFormData(prev => ({ ...prev, startDate: formattedDate }));
                        setStartDateCalendarOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.startDate && (
                <p className="text-sm text-red-500">{errors.startDate}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Data de Término *</Label>
              <Popover open={endDateCalendarOpen} onOpenChange={setEndDateCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.endDate && "text-muted-foreground",
                      errors.endDate && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? (
                      format(new Date(formData.endDate), "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.endDate ? new Date(formData.endDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const formattedDate = date.toISOString().split('T')[0];
                        setFormData(prev => ({ ...prev, endDate: formattedDate }));
                        setEndDateCalendarOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.endDate && (
                <p className="text-sm text-red-500">{errors.endDate}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Seleção de métricas */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Métricas do Desafio *</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Selecione as métricas que serão acompanhadas neste desafio
              </p>
            </div>
            
            {errors.metrics && (
              <p className="text-sm text-red-500">{errors.metrics}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AVAILABLE_METRICS.map(({ type, label, description }) => {
                const isSelected = selectedMetrics.includes(type);
                const metric = formData.metrics.find(m => m.type === type);
                
                return (
                  <Card
                    key={type}
                    className={`cursor-pointer transition-all ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => toggleMetric(type)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            // Prevenir o evento de propagação para evitar dupla chamada
                            toggleMetric(type);
                          }}
                          onClick={(e) => e.stopPropagation()} // Prevenir propagação do evento
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="font-medium cursor-pointer">{label}</Label>
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: METRIC_COLORS[type] }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">{description}</p>
                          
                          {isSelected && (
                            <div className="mt-2">
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="number"
                                  min="1"
                                  value={metric?.targetValue || 0}
                                  onChange={(e) => updateMetricValue(type, parseInt(e.target.value) || 0)}
                                  placeholder="Meta"
                                  className={`w-24 h-8 ${
                                    errors[`metric_${type}`] ? 'border-red-500' : ''
                                  }`}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span className="text-sm text-muted-foreground">
                                  {METRIC_UNITS[type]}
                                </span>
                              </div>
                              {errors[`metric_${type}`] && (
                                <p className="text-xs text-red-500 mt-1">
                                  {errors[`metric_${type}`]}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Preview das métricas selecionadas */}
          {selectedMetrics.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Resumo do Desafio</Label>
              <div className="flex flex-wrap gap-2">
                {selectedMetrics.map(type => {
                  const metric = formData.metrics.find(m => m.type === type);
                  const availableMetric = AVAILABLE_METRICS.find(m => m.type === type);
                  
                  return (
                    <Badge key={type} variant="outline" className="flex items-center gap-1">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: METRIC_COLORS[type] }}
                      />
                      {availableMetric?.label}: {metric?.targetValue || 0}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? 'Salvando...' : challenge?.id ? 'Atualizar' : 'Criar'} Desafio
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};