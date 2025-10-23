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
import { VerticalProgressBar } from "@/components/VerticalProgressBar";
import { useEffect, useRef, useState } from "react";
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

  // slicesForPie uses target values to determine slice angles so the muted background
  // represents the full targets (e.g., sales = 5 will occupy proportionally that space)
  const slicesForPie = targets
    .filter((t) => t.targetValue > 0)
    .map((t, index) => {
      const currentInt = Math.round(t.currentValue);
      const targetInt = Math.round(t.targetValue);
      const percent = targetInt > 0 ? Math.min(Math.max(currentInt / targetInt, 0), 1) * 100 : 0;
      return {
        name: METRIC_LABELS[t.metricType] ?? t.metricType,
        target: Math.max(1, targetInt),
        percent,
        current: currentInt,
        color: COLOR_PALETTE[index % COLOR_PALETTE.length],
      } as any;
    });

  // animated labels (numbers) - animate from 0 to percent
  const [animatedData, setAnimatedData] = useState<ChartDatum[]>(
    chartData.map((d) => ({ ...d, value: 0 }))
  );

  useEffect(() => {
    const timeout = setTimeout(() => setAnimatedData(chartData.map((d) => ({ ...d }))), 120);
    return () => clearTimeout(timeout);
  }, [chartData]);

  // mount trigger for clip animations
  const [mounted, setMounted] = useState(false);
  const uniqueRef = useRef(`p-${Date.now()}-${Math.random().toString(36).slice(2,8)}`);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Calcular o progresso total médio de todos os indicadores
  const totalProgress = chartData.length > 0
    ? chartData.reduce((sum, item) => sum + item.percent, 0) / chartData.length
    : 0;

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
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-center">
            {/* Gráfico de Pizza */}
            <div className="flex-1 w-full h-[320px] min-w-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  {/* Background muted pie: slice angles are proportional to target amounts */}
                  <Pie
                    data={slicesForPie}
                    dataKey="target"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={3}
                    cornerRadius={6}
                    labelLine={false}
                    label={false}
                  >
                    {slicesForPie.map((entry: any) => (
                      <Cell
                        key={`bg-${entry.name}`}
                        fill={entry.color}
                        fillOpacity={0.08}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>

                  {/* Foreground manual overlay: compute slice arcs from slicesForPie and render clipped fill paths */}
                  <g className="chart-overlay" transform="translate(0,0)">
                    {/* We'll render SVG slices using the same radii as the Pie above */}
                    {(() => {
                      const outerRadius = 120;
                      const innerRadius = 60;
                      const cx = 150; // ResponsiveContainer will scale, but these are used only as relative positions inside viewBox; recharts centers at 50%/50%
                      const cy = 150;

                      const total = slicesForPie.reduce((s: number, it: any) => s + (it.target || 0), 0) || 1;
                      let angleCursor = 0;

                      return slicesForPie.map((entry: any, idx: number) => {
                        const angleStart = (angleCursor / total) * 360;
                        const angleEnd = ((angleCursor + entry.target) / total) * 360;
                        angleCursor += entry.target;

                        const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDeg: number) => {
                          const angleInRad = ((angleInDeg - 90) * Math.PI) / 180.0;
                          return {
                            x: centerX + radius * Math.cos(angleInRad),
                            y: centerY + radius * Math.sin(angleInRad),
                          };
                        };

                        const largeArc = angleEnd - angleStart <= 180 ? 0 : 1;
                        const outerStart = polarToCartesian(cx, cy, outerRadius, angleEnd);
                        const outerEnd = polarToCartesian(cx, cy, outerRadius, angleStart);
                        const innerStart = polarToCartesian(cx, cy, innerRadius, angleStart);
                        const innerEnd = polarToCartesian(cx, cy, innerRadius, angleEnd);

                        const path = `M ${outerStart.x} ${outerStart.y} A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y} L ${innerStart.x} ${innerStart.y} A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${innerEnd.x} ${innerEnd.y} Z`;

                        const pct = Math.min(Math.max((entry.percent ?? 0) / 100, 0), 1);
                        const boxSize = outerRadius * 2;
                        const rectHeight = mounted ? boxSize * pct : 0;
                        const rectY = cy + outerRadius - rectHeight;
                        const id = `${uniqueRef.current}-${idx}`;

                        return (
                          <g key={`overlay-${idx}`}>
                            <defs>
                              <clipPath id={`clip-${id}`}>
                                <rect x={cx - outerRadius} y={rectY} width={boxSize} height={rectHeight} style={{ transition: "all 700ms cubic-bezier(.2,.8,.2,1)" }} />
                              </clipPath>
                            </defs>

                            <g clipPath={`url(#clip-${id})`}>
                              <path d={path} fill={entry.color} opacity={0.95} stroke="rgba(255,255,255,0.6)" strokeWidth={1} />
                            </g>
                          </g>
                        );
                      });
                    })()}
                  </g>

                  <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: "none" }} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Barra de Progresso Vertical - Layout Responsivo */}
            <div className="lg:w-32 w-full lg:min-h-[320px] h-auto flex lg:flex-col flex-row items-center justify-center lg:justify-start lg:mt-0 mt-4">
              <VerticalProgressBar
                value={totalProgress}
                max={100}
                label="Progresso Total"
                color={COLOR_PALETTE[0]}
                showPercentage={true}
                animated={true}
                height="lg:h-64 h-16"
                width="lg:w-12 w-full"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
