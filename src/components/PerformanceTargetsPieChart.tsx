import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Using a custom SVG implementation instead of Recharts for full control of animation and layout
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

// Simple hover tooltip (we'll render it manually on mouse events)
const CustomTooltip = ({ name, target, current, percent }: { name: string; target: number; current: number; percent: number }) => (
  <div className="flex flex-col gap-1 rounded-lg border bg-card/95 p-3 text-xs shadow-lg backdrop-blur">
    <div className="font-semibold text-foreground">{name}</div>
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded-md bg-muted/60 px-2 py-1 text-[11px]">
        <span className="block font-medium text-foreground">Planejado</span>
        <span className="text-muted-foreground">{Math.round(target)}</span>
      </div>
      <div className="rounded-md bg-muted/60 px-2 py-1 text-[11px]">
        <span className="block font-medium text-foreground">Atual</span>
        <span className="text-muted-foreground">{Math.round(current)}</span>
      </div>
    </div>
    <div className="text-[11px] text-muted-foreground">Progresso: {Math.round(percent)}%</div>
  </div>
);

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

  // container measurement for responsive SVG
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 300, h: 300 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth || 300, h: el.clientHeight || 300 });
    update();
    const RO = (window as any).ResizeObserver ?? null;
    let observer: any = null;
    if (RO) {
      observer = new RO(() => update());
      observer.observe(el);
    } else {
      window.addEventListener("resize", update);
    }
    return () => {
      if (observer) observer.disconnect();
      else window.removeEventListener("resize", update);
    };
  }, [containerRef.current]);

  // determine if layout is column (matches Tailwind's lg breakpoint used above)
  const isColumnLayout = size.w < 1024;

  // hover / tooltip state
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ visible: boolean; left: number; top: number; entry?: any }>({ visible: false, left: 0, top: 0 });

  // Calcular o progresso total médio de todos os indicadores
  const totalProgress = chartData.length > 0
    ? chartData.reduce((sum, item) => sum + item.percent, 0) / chartData.length
    : 0;

  return (
    <Card className={`${className} border-0 shadow-lg bg-gradient-to-br from-card to-card/80`}>
      <CardHeader className="space-y-2 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs text-muted-foreground">Tempo real</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Acompanhe o progresso dos indicadores de forma visual e interativa.</p>
      </CardHeader>
      <CardContent className="pt-0">
        {chartData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            Nenhum indicador cadastrado para este desafio.
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
            {/* Left vertical legend (vertical on the left side) */}
            <div className="flex flex-col gap-3 w-52 pr-4 justify-center">
              {slicesForPie.map((s: any, idx: number) => (
                <button
                  key={`legend-left-${idx}`}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`w-full flex items-center gap-3 text-sm px-3 py-2 rounded-lg transition-all duration-200 hover:scale-[1.02] focus:outline-none ${
                    hoveredIndex === idx
                      ? 'bg-gradient-to-r from-muted/30 to-muted/20 shadow-md border border-border/50'
                      : 'hover:bg-muted/10'
                  }`}
                  type="button"
                >
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      background: `linear-gradient(135deg, ${s.color}, ${s.color}dd)`,
                      borderRadius: 999,
                      boxShadow: hoveredIndex === idx ? `0 0 12px ${s.color}40` : 'none'
                    }}
                    className="inline-block flex-shrink-0 transition-all duration-200"
                  />
                  <div className="flex flex-col text-left flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{s.name}</span>
                      {hoveredIndex === idx && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full text-white font-semibold"
                          style={{ backgroundColor: s.color }}
                        >
                          {Math.round(s.percent)}%
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{s.current} de {s.target}</span>
                  </div>
                </button>
              ))}
            </div>
            {/* Gráfico de Pizza */}
            <div ref={containerRef} className="relative flex-1 w-full h-[340px] min-w-[300px]">
              {/* Custom SVG donut chart */}
              <svg width="100%" height="100%" viewBox={`0 0 ${Math.max(300, size.w)} ${Math.max(300, size.h)}`} preserveAspectRatio="xMidYMid meet">
                {(() => {
                  const outerRadius = Math.min(size.w, size.h) / 2 * 0.9;
                  const innerRadius = outerRadius * 0.5;
                  const cx = Math.max(size.w, 300) / 2;
                  const cy = Math.max(size.h, 300) / 2;

                  const total = slicesForPie.reduce((s: number, it: any) => s + (it.target || 0), 0) || 1;
                  let angleCursor = 0;

                  return (
                    <g>
                      {/* Background slices (muted) */}
                      {slicesForPie.map((entry: any, idx: number) => {
                        const a0 = (angleCursor / total) * 360;
                        const a1 = ((angleCursor + entry.target) / total) * 360;
                        angleCursor += entry.target;

                        const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDeg: number) => {
                          const angleInRad = ((angleInDeg - 90) * Math.PI) / 180.0;
                          return {
                            x: centerX + radius * Math.cos(angleInRad),
                            y: centerY + radius * Math.sin(angleInRad),
                          };
                        };

                        const largeArc = a1 - a0 <= 180 ? 0 : 1;
                        const outerStart = polarToCartesian(cx, cy, outerRadius, a1);
                        const outerEnd = polarToCartesian(cx, cy, outerRadius, a0);
                        const innerStart = polarToCartesian(cx, cy, innerRadius, a0);
                        const innerEnd = polarToCartesian(cx, cy, innerRadius, a1);

                        const d = `M ${outerStart.x} ${outerStart.y} A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y} L ${innerStart.x} ${innerStart.y} A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${innerEnd.x} ${innerEnd.y} Z`;

                        return <path key={`bg-${idx}`} d={d} fill={entry.color} opacity={0.08} stroke="transparent" />;
                      })}

                      {/* Foreground fills (clipped vertically per-slice) */}
                      {(() => {
                        const elements: any[] = [];
                        let cursor = 0;
                        const tot = slicesForPie.reduce((s: number, it: any) => s + (it.target || 0), 0) || 1;
                        for (let i = 0; i < slicesForPie.length; i++) {
                          const entry = slicesForPie[i];
                          const a0 = (cursor / tot) * 360;
                          const a1 = ((cursor + entry.target) / tot) * 360;
                          cursor += entry.target;

                          const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDeg: number) => {
                            const angleInRad = ((angleInDeg - 90) * Math.PI) / 180.0;
                            return {
                              x: centerX + radius * Math.cos(angleInRad),
                              y: centerY + radius * Math.sin(angleInRad),
                            };
                          };

                          const largeArc = a1 - a0 <= 180 ? 0 : 1;
                          const outerStart = polarToCartesian(cx, cy, outerRadius, a1);
                          const outerEnd = polarToCartesian(cx, cy, outerRadius, a0);
                          const innerStart = polarToCartesian(cx, cy, innerRadius, a0);
                          const innerEnd = polarToCartesian(cx, cy, innerRadius, a1);

                          const d = `M ${outerStart.x} ${outerStart.y} A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y} L ${innerStart.x} ${innerStart.y} A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${innerEnd.x} ${innerEnd.y} Z`;

                          const pct = Math.min(Math.max((entry.percent ?? 0) / 100, 0), 1);
                          const boxSize = outerRadius * 2;
                          const rectHeight = mounted ? boxSize * pct : 0;
                          const rectY = cy + outerRadius - rectHeight;
                          const id = `${uniqueRef.current}-svg-${i}`;

                          const isHovered = hoveredIndex === i;

                          elements.push(
                            <g key={`fg-${i}`}
                              onMouseEnter={(e) => {
                                setHoveredIndex(i);
                                const rect = (e.target as SVGElement).closest('svg')?.getBoundingClientRect();
                                if (rect) {
                                  setTooltip({ visible: true, left: e.clientX - rect.left + 8, top: e.clientY - rect.top + 8, entry });
                                }
                              }}
                              onMouseMove={(e) => {
                                const rect = (e.target as SVGElement).closest('svg')?.getBoundingClientRect();
                                if (rect) setTooltip({ visible: true, left: e.clientX - rect.left + 8, top: e.clientY - rect.top + 8, entry });
                              }}
                              onMouseLeave={() => { setHoveredIndex(null); setTooltip({ visible: false, left: 0, top: 0 }); }}
                            >
                              <defs>
                                <clipPath id={`clip-${id}`}>
                                  <rect x={cx - outerRadius} y={rectY} width={boxSize} height={rectHeight} style={{ transition: "all 700ms cubic-bezier(.2,.8,.2,1)" }} />
                                </clipPath>
                              </defs>
                              <g clipPath={`url(#clip-${id})`}>
                                <path d={d} fill={entry.color} opacity={isHovered ? 1 : 0.95} stroke={isHovered ? 'rgba(0,0,0,0.08)' : "rgba(255,255,255,0.6)"} strokeWidth={isHovered ? 2 : 1} style={{ filter: isHovered ? 'drop-shadow(0 6px 18px rgba(0,0,0,0.12))' : undefined, transition: 'all 180ms ease' }} />
                              </g>
                            </g>
                          );
                        }

                        return elements;
                      })()}

                      {/* Center hole / label */}
                      <circle cx={Math.max(size.w, 300) / 2} cy={Math.max(size.h, 300) / 2} r={innerRadius - 6} fill="var(--card)" />
                      <foreignObject x={cx - innerRadius + 6} y={cy - 22} width={(innerRadius - 6) * 2} height={44}>
                        <div className="flex items-center justify-center text-center">
                          <div>
                            <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{Math.round(totalProgress)}%</div>
                            <div className="text-xs text-muted-foreground">Progresso Total</div>
                          </div>
                        </div>
                      </foreignObject>
                    </g>
                  );
                })()}
              </svg>

              {/* Small-screen legend removed in favor of vertical left legend */}

              {/* Tooltip absolute inside svg container */}
              {tooltip.visible && tooltip.entry && (
                <div style={{ position: 'absolute', left: tooltip.left, top: tooltip.top, pointerEvents: 'none' }}>
                  <CustomTooltip name={tooltip.entry.name} target={tooltip.entry.target} current={tooltip.entry.current} percent={tooltip.entry.percent} />
                </div>
              )}
            </div>
            
            {/* Barra de Progresso Vertical - escondida quando o layout vira coluna */}
            {!isColumnLayout && (
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
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
