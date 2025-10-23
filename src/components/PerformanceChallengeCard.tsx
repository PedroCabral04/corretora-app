import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  PerformanceChallenge,
  PerformanceMetricType,
} from "@/contexts/PerformanceChallengesContext";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Trash2,
  Edit,
  Target,
  Plus,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PerformanceChallengeCardProps {
  challenge: PerformanceChallenge;
  onEdit?: (challenge: PerformanceChallenge) => void;
  onDelete?: (id: string) => void;
  onSelect?: (challenge: PerformanceChallenge) => void;
  isSelected?: boolean;
  onAdjustTarget?: (challengeId: string, targetId: string, delta: number) => void;
}

const STATUS_LABELS: Record<PerformanceChallenge["status"], string> = {
  active: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
  overdue: "Atrasado",
};

const STATUS_VARIANTS: Record<PerformanceChallenge["status"], string> = {
  active: "bg-blue-500",
  completed: "bg-green-500",
  cancelled: "bg-gray-500",
  overdue: "bg-red-500",
};

const PRIORITY_LABELS: Record<PerformanceChallenge["priority"], string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

const PRIORITY_VARIANTS: Record<PerformanceChallenge["priority"], string> = {
  low: "bg-gray-200 text-gray-800",
  medium: "bg-amber-200 text-amber-900",
  high: "bg-red-200 text-red-900",
};

const METRIC_ICONS: Record<PerformanceMetricType, ReactNode> = {
  sales: <CheckCircle2 className="h-4 w-4" />,
  sales_value: <Target className="h-4 w-4" />,
  listings: <Target className="h-4 w-4" />,
  meetings: <CalendarDays className="h-4 w-4" />,
  tasks: <CheckCircle2 className="h-4 w-4" />,
  calls: <Clock className="h-4 w-4" />,
  visits: <Target className="h-4 w-4" />,
  in_person_visits: <Target className="h-4 w-4" />,
};

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

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatNumber = (value: number) =>
  Number.isInteger(value) ? value.toString() : value.toFixed(1);

export const PerformanceChallengeCard = ({
  challenge,
  onEdit,
  onDelete,
  onSelect,
  isSelected,
  onAdjustTarget,
}: PerformanceChallengeCardProps) => (
  <Card
    className={cn(
      "transition-shadow hover:shadow-md",
      isSelected && "border-primary shadow-lg",
    )}
    role="button"
    tabIndex={0}
    onClick={() => onSelect?.(challenge)}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect?.(challenge);
      }
    }}
  >
    <CardHeader className="flex flex-row items-start justify-between space-y-0">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">{challenge.title}</CardTitle>
          <Badge className={STATUS_VARIANTS[challenge.status]}>{STATUS_LABELS[challenge.status]}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {challenge.description || "Sem descrição"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={PRIORITY_VARIANTS[challenge.priority]}>
          {PRIORITY_LABELS[challenge.priority]}
        </Badge>
        {onEdit && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(event) => {
              event.stopPropagation();
              onEdit?.(challenge);
            }}
            aria-label={`Editar desafio ${challenge.title}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(event) => {
              event.stopPropagation();
              onDelete?.(challenge.id);
            }}
            aria-label={`Excluir desafio ${challenge.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-1 gap-3 text-sm text-muted-foreground md:grid-cols-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          <span>Início: {formatDate(challenge.startDate)}</span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          <span>Término: {formatDate(challenge.endDate)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progresso geral</span>
          <span className="font-semibold">{Math.round(challenge.overallProgress)}%</span>
        </div>
        <Progress value={challenge.overallProgress} className="h-2" />
        {challenge.isOverdue && challenge.status !== "completed" && (
          <p className="text-xs font-medium text-destructive">Prazo encerrado e desafio não concluído</p>
        )}
      </div>

      <div className="space-y-3">
        {challenge.targets.map((target) => {
          const handleDelta = (delta: number) => {
            if (!onAdjustTarget) return;
            onAdjustTarget(challenge.id, target.id, delta);
          };

          return (
            <div
              key={target.id}
              className="flex items-start justify-between gap-4 rounded-lg border bg-muted/20 p-4 transition-colors hover:bg-muted/30"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {METRIC_ICONS[target.metricType]}
                  </span>
                  <span>{METRIC_LABELS[target.metricType]}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[13px] text-muted-foreground">
                  <div className="rounded-md border border-border/60 bg-background px-3 py-1.5">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">Planejado</p>
                    <p className="font-semibold text-foreground">{formatNumber(target.targetValue)}</p>
                  </div>
                  <div className="rounded-md border border-border/60 bg-background px-3 py-1.5">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">Atual</p>
                    <p className="font-semibold text-foreground">{formatNumber(target.currentValue)}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="min-w-[180px] space-y-2">
                  <Progress value={target.progress} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{Math.round(target.progress)}%</span>
                    <span>Meta {formatNumber(target.targetValue)}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    disabled={!onAdjustTarget}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelta(1);
                    }}
                    aria-label={`Incrementar ${METRIC_LABELS[target.metricType]}`}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    disabled={!onAdjustTarget}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelta(-1);
                    }}
                    aria-label={`Reduzir ${METRIC_LABELS[target.metricType]}`}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </CardContent>
  </Card>
);
