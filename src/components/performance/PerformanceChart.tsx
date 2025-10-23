import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PerformanceMetrics, METRIC_COLORS } from '@/contexts/PerformanceContext';

interface PerformanceChartProps {
  data: PerformanceMetrics[];
  size?: 'sm' | 'md' | 'lg';
  showLegend?: boolean;
  showLabels?: boolean;
  animated?: boolean;
  onSegmentClick?: (metric: PerformanceMetrics) => void;
}

const getSize = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm': return 150;
    case 'md': return 250;
    case 'lg': return 350;
  }
};

const getOuterRadius = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm': return 60;
    case 'md': return 100;
    case 'lg': return 140;
  }
};

const getInnerRadius = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm': return 25;
    case 'md': return 40;
    case 'lg': return 60;
  }
};

// Tradução dos tipos de métrica
const METRIC_LABELS: Record<string, string> = {
  calls: 'Chamadas',
  personal_visits: 'Visitas Pessoais',
  office_visits: 'Visitas ao Escritório',
  listings: 'Captações',
  sales: 'Vendas',
  tasks: 'Tarefas'
};

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  size = 'md',
  showLegend = true,
  showLabels = true,
  animated = true,
  onSegmentClick
}) => {
  const chartSize = getSize(size);
  const outerRadius = getOuterRadius(size);
  const innerRadius = getInnerRadius(size);
  
  // Preparar dados para o gráfico
  const chartData = data.map(metric => {
    const percentage = metric.targetValue > 0 
      ? Math.min((metric.currentValue / metric.targetValue) * 100, 100) 
      : 0;
    
    return {
      id: metric.id,
      name: METRIC_LABELS[metric.type] || metric.type,
      value: metric.currentValue,
      target: metric.targetValue,
      percentage,
      color: metric.color,
      type: metric.type,
      completed: metric.currentValue >= metric.targetValue
    };
  }).filter(item => item.target > 0); // Não mostrar métricas com meta zero

  // Se não houver dados, mostrar mensagem
  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <p className="text-muted-foreground text-sm">Sem métricas para exibir</p>
      </div>
    );
  }

  // Renderizar label personalizado
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }: any) => {
    if (!showLabels || percent < 0.05) return null; // Não mostrar labels para fatias muito pequenas
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-md shadow-md p-3">
          <p className="font-medium text-sm">{data.name}</p>
          <p className="text-xs text-muted-foreground">
            Progresso: {data.value}/{data.target} ({data.percentage.toFixed(1)}%)
          </p>
          <div className="flex items-center gap-1 mt-1">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className={`text-xs font-medium ${
              data.completed ? 'text-green-600' : 'text-muted-foreground'
            }`}>
              {data.completed ? 'Concluído' : 'Em andamento'}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const renderCustomLegend = (props: any) => {
    const { payload } = props;
    
    return (
      <div className={`flex flex-wrap justify-center gap-3 mt-4 ${
        size === 'sm' ? 'text-xs' : 'text-sm'
      }`}>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  // Handle click on segment
  const handleSegmentClick = (data: any) => {
    if (onSegmentClick && data) {
      const metric = data.payload;
      const originalMetric = data.find((m: PerformanceMetrics) => m.id === metric.id);
      if (originalMetric) {
        onSegmentClick(originalMetric);
      }
    }
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={chartSize}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={animated ? 800 : 0}
            animationEasing="ease-out"
            onClick={handleSegmentClick}
            className="cursor-pointer"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                className="hover:opacity-80 transition-opacity"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend content={renderCustomLegend} />}
        </PieChart>
      </ResponsiveContainer>
      
      {/* Estatísticas adicionais */}
      {size !== 'sm' && (
        <div className="mt-4 grid grid-cols-2 gap-2 text-center">
          <div className="bg-muted/50 rounded-md p-2">
            <p className="text-xs text-muted-foreground">Total de Métricas</p>
            <p className="text-lg font-bold">{chartData.length}</p>
          </div>
          <div className="bg-muted/50 rounded-md p-2">
            <p className="text-xs text-muted-foreground">Concluídas</p>
            <p className="text-lg font-bold text-green-600">
              {chartData.filter(item => item.completed).length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};