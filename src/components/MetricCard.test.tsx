import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { MetricCard } from '@/components/MetricCard';
import { Users, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';

describe('MetricCard', () => {
  describe('Basic Rendering', () => {
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

    it('should render with string value', () => {
      render(
        <MetricCard
          title="Status"
          value="Ativo"
          icon={Users}
          variant="default"
        />
      );

      expect(screen.getByText('Status')).toBeDefined();
      expect(screen.getByText('Ativo')).toBeDefined();
    });

    it('should render with numeric value', () => {
      render(
        <MetricCard
          title="Total"
          value={1234567}
          icon={DollarSign}
          variant="default"
        />
      );

      expect(screen.getByText('Total')).toBeDefined();
      expect(screen.getByText('1234567')).toBeDefined();
    });

    it('should render with zero value', () => {
      render(
        <MetricCard
          title="Pendentes"
          value={0}
          icon={AlertCircle}
          variant="warning"
        />
      );

      expect(screen.getByText('Pendentes')).toBeDefined();
      expect(screen.getByText('0')).toBeDefined();
    });
  });

  describe('Trend Display', () => {
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
      expect(screen.queryByText(/em relação/)).toBeNull();
    });

    it('should render negative trend', () => {
      render(
        <MetricCard
          title="Perdas"
          value={50}
          icon={TrendingUp}
          variant="warning"
          trend="-10% em relação ao mês anterior"
        />
      );

      expect(screen.getByText(/-10%/)).toBeDefined();
    });

    it('should render empty string trend', () => {
      render(
        <MetricCard
          title="Estável"
          value={100}
          icon={Users}
          variant="info"
          trend=""
        />
      );

      expect(screen.getByText('Estável')).toBeDefined();
      expect(screen.getByText('100')).toBeDefined();
    });
  });

  describe('Variants', () => {
    it('should render with default variant', () => {
      const { container } = render(
        <MetricCard
          title="Default"
          value={10}
          icon={Users}
          variant="default"
        />
      );

      const card = container.querySelector('.border-primary-200');
      expect(card).toBeDefined();
    });

    it('should render with success variant', () => {
      const { container } = render(
        <MetricCard
          title="Success"
          value={100}
          icon={TrendingUp}
          variant="success"
        />
      );

      const card = container.querySelector('.border-primary-200');
      expect(card).toBeDefined();
    });

    it('should render with warning variant', () => {
      const { container } = render(
        <MetricCard
          title="Warning"
          value={50}
          icon={AlertCircle}
          variant="warning"
        />
      );

      const card = container.querySelector('.border-primary-200');
      expect(card).toBeDefined();
    });

    it('should render with info variant', () => {
      const { container } = render(
        <MetricCard
          title="Info"
          value={25}
          icon={Users}
          variant="info"
        />
      );

      const card = container.querySelector('.border-primary-200');
      expect(card).toBeDefined();
    });

    it('should use default variant when not specified', () => {
      const { container } = render(
        <MetricCard
          title="No Variant"
          value={75}
          icon={DollarSign}
        />
      );

      const card = container.querySelector('.border-primary-200');
      expect(card).toBeDefined();
    });
  });

  describe('Icon Rendering', () => {
    it('should render Users icon', () => {
      const { container } = render(
        <MetricCard
          title="Users"
          value={10}
          icon={Users}
          variant="default"
        />
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeDefined();
    });

    it('should render TrendingUp icon', () => {
      const { container } = render(
        <MetricCard
          title="Trending"
          value={100}
          icon={TrendingUp}
          variant="success"
        />
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeDefined();
    });

    it('should apply correct icon color classes', () => {
      const { container } = render(
        <MetricCard
          title="Test"
          value={50}
          icon={AlertCircle}
          variant="warning"
        />
      );

      const icon = container.querySelector('.text-warning');
      expect(icon).toBeDefined();
    });
  });

  describe('Hover Effects', () => {
    it('should have hover shadow transition classes', () => {
      const { container } = render(
        <MetricCard
          title="Hover Test"
          value={100}
          icon={Users}
          variant="default"
        />
      );

      const card = container.querySelector('.hover\\:shadow-md');
      expect(card).toBeDefined();
    });

    it('should have transition duration classes', () => {
      const { container } = render(
        <MetricCard
          title="Transition Test"
          value={100}
          icon={Users}
          variant="default"
        />
      );

      const card = container.querySelector('.duration-200');
      expect(card).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long titles', () => {
      const longTitle = 'Este é um título muito longo que pode quebrar o layout se não tratado corretamente';
      render(
        <MetricCard
          title={longTitle}
          value={100}
          icon={Users}
          variant="default"
        />
      );

      expect(screen.getByText(longTitle)).toBeDefined();
    });

    it('should handle very large numbers', () => {
      render(
        <MetricCard
          title="Grande Número"
          value={999999999}
          icon={DollarSign}
          variant="success"
        />
      );

      expect(screen.getByText('999999999')).toBeDefined();
    });

    it('should handle special characters in title', () => {
      render(
        <MetricCard
          title="R$ Vendas & Lucros"
          value={100}
          icon={DollarSign}
          variant="success"
        />
      );

      expect(screen.getByText('R$ Vendas & Lucros')).toBeDefined();
    });

    it('should handle empty string value', () => {
      render(
        <MetricCard
          title="Empty"
          value=""
          icon={Users}
          variant="default"
        />
      );

      expect(screen.getByText('Empty')).toBeDefined();
    });

    it('should handle very long trend text', () => {
      const longTrend = 'Este é um texto de tendência muito longo que descreve detalhadamente as mudanças em relação ao período anterior';
      render(
        <MetricCard
          title="Trend Test"
          value={100}
          icon={TrendingUp}
          variant="success"
          trend={longTrend}
        />
      );

      expect(screen.getByText(longTrend)).toBeDefined();
    });
  });

  describe('Interactive Behaviour', () => {
    it('should display interactive cues and handle clicks', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <MetricCard
          title="Vendas"
          value={42}
          icon={TrendingUp}
          variant="success"
          isInteractive
          onClick={handleClick}
        />
      );

      const interactiveCard = screen.getByRole('button', { name: /vendas - ver detalhes/i });
      expect(interactiveCard).toBeDefined();
      expect(screen.getByText('Ver detalhes')).toBeDefined();

      await user.click(interactiveCard);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
