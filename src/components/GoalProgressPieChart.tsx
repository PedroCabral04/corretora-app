import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  TooltipProps,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Goal, GoalType } from "@/contexts/GoalsContext";
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";

type GoalProgressFilterMode = 'current-week' | 'all' | 'active';

interface GoalProgressPieChartProps {
  goals: Goal[];
  title?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  filterMode?: GoalProgressFilterMode;
}

interface ChartGoalData {
  name: string;
  type: string;
  target: number;
  current: number;
  value: number;
  percent: number;
  color: string;
}

const GOAL_LABELS: Record<string, string> = {
  sales_count: "Vendas",
  sales_value: "Valor de Vendas",
  listings: "Captações",
  meetings: "Reuniões",
  tasks: "Tarefas",
  calls: "Ligações",
  visits: "Visitas Externas",
  in_person_visits: "Visitas na Imobiliária",
};

const GOAL_COLORS: Record<string, string> = {
  sales_count: "#8b5cf6",
  sales_value: "#ec4899",
  listings: "#3b82f6",
  meetings: "#10b981",
  tasks: "#f59e0b",
  calls: "#f97316",
  visits: "#6366f1",
  in_person_visits: "#22d3ee",
};

const DEFAULT_COLOR_PALETTE = [
  "#8b5cf6",
  "#ec4899",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
];

const clampProgress = (value: number, target: number) => {
  if (target <= 0) return 0;
  return Math.min(Math.max(value / target, 0), 1);
};

const findColor = (type: string, index: number) => {
  return GOAL_COLORS[type] || DEFAULT_COLOR_PALETTE[index % DEFAULT_COLOR_PALETTE.length];
};

const getLabel = (type: string) => {
  return GOAL_LABELS[type] || type;
};

const parseGoalDate = (value: string) => {
  const parsed = parseISO(value);
  if (Number.isNaN(parsed.getTime())) {
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  return parsed;
};

const filterGoalsForCurrentWeek = (
  goals: Goal[],
  weekStartsOn: GoalProgressPieChartProps["weekStartsOn"],
) => {
  const start = startOfWeek(new Date(), { weekStartsOn });
  const end = endOfWeek(new Date(), { weekStartsOn });

  return goals.filter((goal) => {
    const goalStart = parseGoalDate(goal.startDate);
    const goalEnd = parseGoalDate(goal.endDate);

    if (!goalStart || !goalEnd) {
      return false;
    }

    const overlapsWeek =
      isWithinInterval(goalStart, { start, end }) ||
      isWithinInterval(goalEnd, { start, end }) ||
      (goalStart <= start && goalEnd >= end);

    return overlapsWeek;
  });
};

const filterGoals = (
  goals: Goal[],
  mode: GoalProgressFilterMode,
  weekStartsOn: GoalProgressPieChartProps["weekStartsOn"],
) => {
  if (mode === 'all') {
    return goals;
  }

  if (mode === 'active') {
    return goals.filter((goal) => goal.status === 'active');
  }

  return filterGoalsForCurrentWeek(goals, weekStartsOn);
};

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload as ChartGoalData;

  return (
    <div className="rounded-md border bg-card p-3 text-xs shadow">
      <div className="font-medium">{data.name}</div>
      <div>Meta: {data.target}</div>
      <div>Atual: {data.current}</div>
      <div>Progresso: {data.percent.toFixed(0)}%</div>
    </div>
  );
};

export const GoalProgressPieChart = ({
  goals,
  title = "Progresso das Metas Semanais",
  weekStartsOn = 1,
  filterMode = 'current-week',
}: GoalProgressPieChartProps) => {
  const chartData = useMemo(() => {
    const filteredGoals = filterGoals(goals, filterMode, weekStartsOn);

    const aggregated = filteredGoals.reduce<Record<string, ChartGoalData>>((acc, goal, index) => {
      const type = goal.goalType as GoalType;
      const key = type || "outros";
      const item = acc[key] || {
        name: getLabel(key),
        type: key,
        target: 0,
        current: 0,
        value: 0,
        percent: 0,
        color: findColor(key, index),
      };

      item.target += goal.targetValue;
      item.current += Math.min(goal.currentValue, goal.targetValue);

      const progress = clampProgress(item.current, item.target);
      item.percent = progress * 100;
      item.value = item.percent;
      if (!item.color) {
        item.color = findColor(key, index);
      }

      acc[key] = item;
      return acc;
    }, {});

    return Object.values(aggregated).filter((item) => item.target > 0);
  }, [filterMode, goals, weekStartsOn]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            Nenhuma meta semanal ativa para exibir.
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
                  outerRadius={110}
                  label={({ name, payload }) =>
                    `${name}: ${Math.round((payload as ChartGoalData).percent)}%`
                  }
                  paddingAngle={2}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={`cell-${entry.type}`}
                      fill={entry.color}
                      fillOpacity={0.4 + (entry.value / 100) * 0.6}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
