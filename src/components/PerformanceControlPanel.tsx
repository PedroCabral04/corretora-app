import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus } from "lucide-react";
import type {
  PerformanceTarget,
  PerformanceMetricType,
} from "@/contexts/PerformanceChallengesContext";

interface PerformanceControlPanelProps {
  targets: PerformanceTarget[];
  onTargetChange: (targetId: string, newValue: number) => void;
  className?: string;
}

const METRIC_LABELS: Record<PerformanceMetricType, string> = {
  sales: "Vendas",
  sales_value: "Valor Vendido",
  listings: "Captações",
  meetings: "Reuniões",
  tasks: "Tarefas",
  calls: "Ligações",
  visits: "Visitas Externas",
  in_person_visits: "Visitas na Imobiliária",
};

const COLOR_PALETTE = [
  "#8b5cf6",
  "#ec4899",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#14b8a6",
  "#6366f1",
];

interface MetricControlProps {
  target: PerformanceTarget;
  color: string;
  index: number;
  onChange: (value: number) => void;
}

const MetricControl = ({ target, color, onChange }: MetricControlProps) => {
  const [localValue, setLocalValue] = useState(Math.round(target.currentValue));
  const [inputValue, setInputValue] = useState(Math.round(target.currentValue).toString());
  
  useEffect(() => {
    const roundedValue = Math.round(target.currentValue);
    setLocalValue(roundedValue);
    setInputValue(roundedValue.toString());
  }, [target.currentValue]);

  const handleIncrement = useCallback(() => {
    const newValue = Math.min(localValue + 1, Math.round(target.targetValue));
    setLocalValue(newValue);
    setInputValue(newValue.toString());
    onChange(newValue);
  }, [localValue, target.targetValue, onChange]);

  const handleDecrement = useCallback(() => {
    const newValue = Math.max(localValue - 1, 0);
    setLocalValue(newValue);
    setInputValue(newValue.toString());
    onChange(newValue);
  }, [localValue, onChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleInputBlur = useCallback(() => {
    const newValue = parseInt(inputValue);
    if (!isNaN(newValue)) {
      const clampedValue = Math.max(0, Math.min(newValue, Math.round(target.targetValue)));
      setLocalValue(clampedValue);
      setInputValue(clampedValue.toString());
      onChange(clampedValue);
    } else {
      setInputValue(localValue.toString());
    }
  }, [inputValue, localValue, target.targetValue, onChange]);

  const handleInputKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  }, [handleInputBlur]);

  const progressPercentage = Math.round(target.targetValue) > 0
    ? Math.min(Math.max((localValue / Math.round(target.targetValue)) * 100, 0), 100)
    : 0;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border/30 bg-card hover:bg-muted/30 transition-colors duration-200">
      <div className="flex items-center gap-3">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <div>
          <div className="text-sm font-medium text-foreground">{METRIC_LABELS[target.metricType]}</div>
          <div className="text-xs text-muted-foreground">
            {localValue} / {Math.round(target.targetValue)}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground w-8 text-right">
          {Math.round(progressPercentage)}%
        </span>
        
        <div className="flex items-center gap-0 rounded-md border border-border/50">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 rounded-l-md rounded-r-none hover:bg-muted/50 border-r border-border/50"
            onClick={handleDecrement}
            disabled={localValue <= 0}
          >
            <Minus className="h-3 w-3" />
          </Button>
          
          <Input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyPress={handleInputKeyPress}
            min={0}
            max={Math.round(target.targetValue)}
            step={1}
            className="w-16 h-7 text-center text-xs border-0 border-x border-border/50 rounded-none focus:ring-0"
          />
          
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 rounded-r-md rounded-l-none hover:bg-muted/50"
            onClick={handleIncrement}
            disabled={localValue >= Math.round(target.targetValue)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export const PerformanceControlPanel = ({
  targets,
  onTargetChange,
  className,
}: PerformanceControlPanelProps) => {
  const validTargets = targets.filter((target) => target.targetValue > 0);

  if (validTargets.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex h-20 items-center justify-center text-sm text-muted-foreground">
          Nenhum indicador disponível para controle
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} border-0 shadow-lg bg-gradient-to-br from-card to-card/80`}>
      <CardContent className="pt-6">
        <div className="mb-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Painel de Controle</h3>
          <p className="text-xs text-muted-foreground">
            Ajuste os valores e visualize o impacto em tempo real no gráfico
          </p>
        </div>
        <div className="space-y-3">
          {validTargets.map((target, index) => (
            <MetricControl
              key={target.id}
              target={target}
              color={COLOR_PALETTE[index % COLOR_PALETTE.length]}
              index={index}
              onChange={(value) => onTargetChange(target.id, value)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};