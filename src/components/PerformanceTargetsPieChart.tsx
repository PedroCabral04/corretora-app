import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  TooltipProps,
} from "recharts";
import type {
  PerformanceTarget,
  PerformanceMetricType,
} from "@/contexts/PerformanceChallengesContext";

interface PerformanceTargetsPieChartProps {
  targets: PerformanceTarget[];
  title?: string;
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

interface ChartDatum {
  name: string;
  value: number;
  percent: number;
  current: number;
  target: number;
  color: string;
}

const mapTargetsToChartData = (targets: PerformanceTarget[]): ChartDatum[] =>
  targets
    .filter((target) => target.targetValue > 0)
    .map((target, index) => {
      const currentInt = Math.round(target.currentValue);
      const targetInt = Math.round(target.targetValue);
      const percent = targetInt > 0 ? Math.min(Math.max(currentInt / targetInt, 0), 1) * 100 : 0;
      return {
        name: METRIC_LABELS[target.metricType] ?? target.metricType,
        value: percent,
        percent,
        current: currentInt,
        target: targetInt,
        color: COLOR_PALETTE[index % COLOR_PALETTE.length],
      };
    });

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const entry = payload[0].payload as ChartDatum;

  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-card/95 p-3 text-xs shadow-lg backdrop-blur">
      <div className="font-semibold text-foreground">{entry.name}</div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md bg-muted/60 px-2 py-1 text-[11px]">
          <span className="block font-medium text-foreground">Planejado</span>
          <span className="text-muted-foreground">{Math.round(entry.target)}</span>
        </div>
        <div className="rounded-md bg-muted/60 px-2 py-1 text-[11px]">
          <span className="block font-medium text-foreground">Atual</span>
          <span className="text-muted-foreground">{Math.round(entry.current)}</span>
        </div>
      </div>
      <div className="text-[11px] text-muted-foreground">Progresso: {Math.round(entry.percent)}%</div>
    </div>
  );
};

export const PerformanceTargetsPieChart = ({
  targets,
  title = "Progresso dos indicadores",
  className,
}: PerformanceTargetsPieChartProps) => {
  const chartData = mapTargetsToChartData(targets);

  return (
    <Card className={className}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">Compare os valores planejados com o desempenho atual de cada indicador.</p>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            Nenhum indicador cadastrado para este desafio.
          </div>
        ) : (
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={3}
                  cornerRadius={6}
                  labelLine={false}
                  label={({ name, value }) => `${name} (${Math.round(value)})`}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.color}
                      fillOpacity={0.55 + entry.value / 250}
                      stroke="rgba(255,255,255,0.6)"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: "none" }} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
