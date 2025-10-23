import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Using a custom SVG implementation instead of Recharts for full control of animation and layout
import { VerticalProgressBar } from "@/components/VerticalProgressBar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

interface SliceDatum {
  name: string;
  percent: number;
  percentNormalized: number;
  current: number;
  target: number;
  color: string;
  startAngle: number;
  endAngle: number;
}

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDeg: number) => {
  const angleInRad = ((angleInDeg - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRad),
    y: centerY + radius * Math.sin(angleInRad),
  };
};

const createDonutSegmentPath = (
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
) => {
  const outerStart = polarToCartesian(cx, cy, outerRadius, endAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

  return `M ${outerStart.x} ${outerStart.y} A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y} L ${innerStart.x} ${innerStart.y} A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${innerEnd.x} ${innerEnd.y} Z`;
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

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
  const sliceData = useMemo<SliceDatum[]>(() => {
    const validTargets = targets.filter((target) => target.targetValue > 0);
    const totalForAngles =
      validTargets.reduce((sum, target) => sum + Math.max(1, Math.round(target.targetValue)), 0) || 1;

    let cursor = 0;
    return validTargets.map((target, index) => {
      const currentInt = Math.round(target.currentValue);
      const targetInt = Math.round(target.targetValue);
      const percentNormalized = targetInt > 0 ? Math.min(Math.max(currentInt / targetInt, 0), 1) : 0;
      const valueForAngles = Math.max(1, targetInt);
      const startAngle = (cursor / totalForAngles) * 360;
      const endAngle = ((cursor + valueForAngles) / totalForAngles) * 360;
      cursor += valueForAngles;

      return {
        name: METRIC_LABELS[target.metricType] ?? target.metricType,
        percent: percentNormalized * 100,
        percentNormalized,
        current: currentInt,
        target: targetInt,
        color: COLOR_PALETTE[index % COLOR_PALETTE.length],
        startAngle,
        endAngle,
      };
    });
  }, [targets]);

  const [animatedPercents, setAnimatedPercents] = useState<number[]>([]);
  const animatedPercentsRef = useRef<number[]>([]);

  const updateAnimatedPercents = useCallback((values: number[]) => {
    animatedPercentsRef.current = values;
    setAnimatedPercents(values);
  }, []);

  useEffect(() => {
    if (!sliceData.length) {
      updateAnimatedPercents([]);
      return;
    }

    const targetPercents = sliceData.map((slice) => slice.percentNormalized);
    const startPercents = sliceData.map((_, idx) => animatedPercentsRef.current[idx] ?? 0);
    const startTime = performance.now();
    const duration = 900;
    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = easeOutCubic(progress);
      const next = startPercents.map((from, idx) => from + (targetPercents[idx] - from) * eased);
      updateAnimatedPercents(next);
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [sliceData, updateAnimatedPercents]);

  // container measurement for responsive SVG
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 300, h: 300 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth || 300, h: el.clientHeight || 300 });
    update();
    const globalWindow = window as Window & { ResizeObserver?: typeof ResizeObserver };
    let observer: ResizeObserver | null = null;
    if (globalWindow.ResizeObserver) {
      observer = new globalWindow.ResizeObserver(() => update());
      observer.observe(el);
    } else {
      globalWindow.addEventListener("resize", update);
    }
    return () => {
      if (observer) {
        observer.disconnect();
      } else {
        globalWindow.removeEventListener("resize", update);
      }
    };
  }, [sliceData.length]);

  // determine if layout is column (matches Tailwind's lg breakpoint used above)
  const isColumnLayout = size.w < 1024;

  // hover / tooltip state
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ visible: boolean; left: number; top: number; entry?: SliceDatum; entryIndex?: number }>({
    visible: false,
    left: 0,
    top: 0,
  });

  // Calcular o progresso total médio de todos os indicadores
  const totalProgress = sliceData.length > 0
    ? sliceData.reduce((sum, _item, idx) => sum + ((animatedPercents[idx] ?? 0) * 100), 0) / sliceData.length
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
        {sliceData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            Nenhum indicador cadastrado para este desafio.
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
            {/* Left vertical legend (vertical on the left side) */}
            <div className="flex flex-col gap-3 w-52 pr-4 justify-center">
              {sliceData.map((s, idx) => {
                const animatedPercent = Math.min(Math.max(animatedPercents[idx] ?? 0, 0), 1);
                const percentDisplay = Math.round(animatedPercent * 100);
                const isActive = hoveredIndex === idx;

                return (
                  <button
                    key={`legend-left-${idx}`}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`w-full flex items-center gap-3 text-sm px-3 py-2 rounded-lg transition-all duration-200 hover:scale-[1.02] focus:outline-none ${
                      isActive
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
                        boxShadow: isActive ? `0 0 12px ${s.color}40` : 'none'
                      }}
                      className="inline-block flex-shrink-0 transition-all duration-200"
                    />
                    <div className="flex flex-col text-left flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{s.name}</span>
                        {isActive && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full text-white font-semibold"
                            style={{ backgroundColor: s.color }}
                          >
                            {percentDisplay}%
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{s.current} de {s.target}</span>
                    </div>
                  </button>
                );
              })}
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

                  return (
                    <g>
                      {/* Background slices (muted) */}
                      {sliceData.map((entry, idx) => {
                        const isHovered = hoveredIndex === idx;
                        const animatedPercent = Math.min(Math.max(animatedPercents[idx] ?? 0, 0), 1);
                        const backgroundPath = createDonutSegmentPath(
                          cx,
                          cy,
                          innerRadius,
                          outerRadius,
                          entry.startAngle,
                          entry.endAngle
                        );

                        const progressAngle = entry.startAngle + (entry.endAngle - entry.startAngle) * animatedPercent;
                        const hasProgress = animatedPercent > 0;
                        const progressPath = hasProgress
                          ? createDonutSegmentPath(
                              cx,
                              cy,
                              innerRadius,
                              outerRadius,
                              entry.startAngle,
                              progressAngle
                            )
                          : null;

                        return (
                          <g
                            key={`slice-${idx}`}
                            onMouseEnter={(event) => {
                              setHoveredIndex(idx);
                              const rect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
                              if (rect) {
                                setTooltip({
                                  visible: true,
                                  left: event.clientX - rect.left + 8,
                                  top: event.clientY - rect.top + 8,
                                  entry,
                                  entryIndex: idx,
                                });
                              }
                            }}
                            onMouseMove={(event) => {
                              const rect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
                              if (rect) {
                                setTooltip({
                                  visible: true,
                                  left: event.clientX - rect.left + 8,
                                  top: event.clientY - rect.top + 8,
                                  entry,
                                  entryIndex: idx,
                                });
                              }
                            }}
                            onMouseLeave={() => {
                              setHoveredIndex(null);
                              setTooltip({ visible: false, left: 0, top: 0, entry: undefined, entryIndex: undefined });
                            }}
                          >
                            <path d={backgroundPath} fill={entry.color} opacity={isHovered ? 0.14 : 0.08} />
                            {progressPath && (
                              <path
                                d={progressPath}
                                fill={entry.color}
                                opacity={isHovered ? 1 : 0.95}
                                stroke={isHovered ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.6)"}
                                strokeWidth={isHovered ? 2 : 1}
                                style={{
                                  filter: isHovered ? "drop-shadow(0 6px 18px rgba(0,0,0,0.12))" : undefined,
                                  transition: "opacity 180ms ease, stroke 180ms ease, filter 180ms ease",
                                }}
                              />
                            )}
                          </g>
                        );
                      })}

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
                  <CustomTooltip
                    name={tooltip.entry.name}
                    target={tooltip.entry.target}
                    current={tooltip.entry.current}
                    percent={
                      tooltip.entryIndex !== undefined
                        ? (animatedPercents[tooltip.entryIndex] ?? 0) * 100
                        : tooltip.entry.percent
                    }
                  />
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
