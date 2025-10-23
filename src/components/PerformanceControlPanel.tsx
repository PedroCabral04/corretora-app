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
  const [localValue, setLocalValue] = useState(target.currentValue);
  const [inputValue, setInputValue] = useState(target.currentValue.toString());
  
  useEffect(() => {
    setLocalValue(target.currentValue);
    setInputValue(target.currentValue.toString());
  }, [target.currentValue]);

  const handleIncrement = useCallback(() => {
    const step = target.targetValue < 10 ? 0.1 : target.targetValue < 100 ? 1 : 5;
    const newValue = Math.min(localValue + step, target.targetValue);
    setLocalValue(newValue);
    setInputValue(newValue.toString());
    onChange(newValue);
  }, [localValue, target.targetValue, onChange]);

  const handleDecrement = useCallback(() => {
    const step = target.targetValue < 10 ? 0.1 : target.targetValue < 100 ? 1 : 5;
    const newValue = Math.max(localValue - step, 0);
    setLocalValue(newValue);
    setInputValue(newValue.toString());
    onChange(newValue);
  }, [localValue, onChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleInputBlur = useCallback(() => {
    const newValue = parseFloat(inputValue);
    if (!isNaN(newValue)) {
      const clampedValue = Math.max(0, Math.min(newValue, target.targetValue));
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

  const progressPercentage = target.targetValue > 0
    ? Math.min(Math.max((localValue / target.targetValue) * 100, 0), 100)
    : 0;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50">
      <div className="flex items-center gap-3">
        <div
          className="h-4 w-4 rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: color }}
        />
        <div>
          <div className="text-sm font-medium">{METRIC_LABELS[target.metricType]}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Meta: {target.targetValue.toFixed(1)}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className="text-xs font-semibold"
          style={{ borderColor: color, color }}
        >
          {progressPercentage.toFixed(0)}%
        </Badge>
        
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
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
            max={target.targetValue}
            step={target.targetValue < 10 ? 0.1 : target.targetValue < 100 ? 1 : 5}
            className="w-16 h-7 text-center text-xs"
          />
          
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={handleIncrement}
            disabled={localValue >= target.targetValue}
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
    <Card className={className}>
      <CardContent className="pt-4">
        <div className="mb-3 text-center">
          <p className="text-xs text-muted-foreground">
            Use os botões + e - para ajustar os valores e visualize o impacto em tempo real no gráfico
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