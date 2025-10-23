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

  // keep local state in sync when parent updates the target
  useEffect(() => {
    const rounded = Math.round(target.currentValue);
    setLocalValue(rounded);
    setInputValue(String(rounded));
  }, [target.currentValue]);

  // debounce commit for input typing
  useEffect(() => {
    const handler = setTimeout(() => {
      const parsed = parseInt(inputValue, 10);
      if (!isNaN(parsed)) {
        const clamped = Math.max(0, Math.min(parsed, Math.round(target.targetValue)));
        if (clamped !== localValue) {
          setLocalValue(clamped);
          onChange(clamped);
        }
      }
    }, 700);

    return () => clearTimeout(handler);
    // purposely exclude localValue and onChange from deps to avoid resetting debounce unnecessarily
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, target.targetValue]);

  const commitInputImmediately = useCallback(() => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed)) {
      const clamped = Math.max(0, Math.min(parsed, Math.round(target.targetValue)));
      setLocalValue(clamped);
      setInputValue(String(clamped));
      onChange(clamped);
    } else {
      // restore previous valid value
      setInputValue(String(localValue));
    }
  }, [inputValue, localValue, target.targetValue, onChange]);

  const handleIncrement = useCallback(() => {
    setLocalValue((prev) => {
      const next = Math.min(prev + 1, Math.round(target.targetValue));
      setInputValue(String(next));
      onChange(next);
      return next;
    });
  }, [target.targetValue, onChange]);

  const handleDecrement = useCallback(() => {
    setLocalValue((prev) => {
      const next = Math.max(prev - 1, 0);
      setInputValue(String(next));
      onChange(next);
      return next;
    });
  }, [onChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleInputBlur = useCallback(() => {
    commitInputImmediately();
  }, [commitInputImmediately]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commitInputImmediately();
    }
  }, [commitInputImmediately]);

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
            aria-label={`Diminuir ${METRIC_LABELS[target.metricType]}`}
          >
            <Minus className="h-3 w-3" />
          </Button>
          
          <Input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            min={0}
            max={Math.round(target.targetValue)}
            step={1}
            className="w-16 h-7 text-center text-xs border-0 border-x border-border/50 rounded-none focus:ring-0"
            aria-label={`Valor atual de ${METRIC_LABELS[target.metricType]}`}
          />
          
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 rounded-r-md rounded-l-none hover:bg-muted/50"
            onClick={handleIncrement}
            disabled={localValue >= Math.round(target.targetValue)}
            aria-label={`Aumentar ${METRIC_LABELS[target.metricType]}`}
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