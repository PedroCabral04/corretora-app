import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { MetricCard } from '@/components/MetricCard';
import { Users, TrendingUp } from 'lucide-react';

describe('MetricCard', () => {
  it('should render title and value correctly', () => {
    render(
      <MetricCard
        title="Total de Corretores"
        value={10}
        icon={Users}
        variant="default"
      />
    );

    expect(screen.getByText('Total de Corretores')).toBeDefined();
    expect(screen.getByText('10')).toBeDefined();
  });

  it('should render trend when provided', () => {
    render(
      <MetricCard
        title="Vendas"
        value={100}
        icon={TrendingUp}
        variant="success"
        trend="+15% em relação ao mês anterior"
      />
    );

    expect(screen.getByText('Vendas')).toBeDefined();
    expect(screen.getByText('100')).toBeDefined();
    expect(screen.getByText(/15%/)).toBeDefined();
  });

  it('should render without trend', () => {
    render(
      <MetricCard
        title="Test"
        value="123"
        icon={Users}
        variant="info"
      />
    );

    expect(screen.getByText('Test')).toBeDefined();
    expect(screen.getByText('123')).toBeDefined();
  });
});
