import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, within, waitFor } from "@/test/test-utils";
import "@testing-library/jest-dom/vitest";
import Dashboard from "./Dashboard";

const mockUseBrokers = vi.fn();
const mockUseSales = vi.fn();
const mockUseListings = vi.fn();
const mockUseExpenses = vi.fn();
const mockUseTasks = vi.fn();

vi.mock("@/contexts/BrokersContext", () => ({
  useBrokers: () => mockUseBrokers(),
}));

vi.mock("@/contexts/SalesContext", () => ({
  useSales: () => mockUseSales(),
}));

vi.mock("@/contexts/ListingsContext", () => ({
  useListings: () => mockUseListings(),
}));

vi.mock("@/contexts/ExpensesContext", () => ({
  useExpenses: () => mockUseExpenses(),
}));

vi.mock("@/contexts/TasksContext", () => ({
  useTasks: () => mockUseTasks(),
}));

vi.mock("@/components/Navigation", () => ({
  Navigation: () => <nav data-testid="navigation">Navigation</nav>,
}));

vi.mock("@/components/MetricCard", () => ({
  MetricCard: ({ title, value }: { title: string; value: number | string }) => (
    <div data-testid="metric-card">
      <p>{title}</p>
      <span data-testid="metric-value">{value}</span>
    </div>
  ),
}));

vi.mock("@/components/ChartCard", () => ({
  ChartCard: ({ title }: { title: string }) => (
    <div data-testid="chart-card">{title}</div>
  ),
}));

vi.mock("@/components/GoalsSummary", () => ({
  GoalsSummary: () => <div data-testid="goals-summary">Goals</div>,
}));

vi.mock("@/components/NotificationsSummary", () => ({
  NotificationsSummary: () => <div data-testid="notifications-summary">Notifications</div>,
}));

vi.mock("@/components/ui/skeleton", () => ({
  MetricCardSkeleton: () => <div data-testid="metric-card-skeleton">loading</div>,
}));

vi.mock("@/components/ui/select", () => {
  const SelectTrigger = ({ id, children }: { id?: string; children: React.ReactNode }) => (
    <div data-select-trigger-id={id}>{children}</div>
  );
  SelectTrigger.displayName = "SelectTriggerMock";

  const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  SelectContent.displayName = "SelectContentMock";

  const SelectValue = ({ placeholder }: { placeholder?: string }) => (
    <>{placeholder ? <span data-placeholder>{placeholder}</span> : null}</>
  );
  SelectValue.displayName = "SelectValueMock";

  const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  );
  SelectItem.displayName = "SelectItemMock";

  const Select = ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (newValue: string) => void;
    children: React.ReactNode;
  }) => {
    const options: React.ReactNode[] = [];
    let selectId: string | undefined;
    let placeholderLabel: string | undefined;

    React.Children.forEach(children, child => {
      if (!React.isValidElement(child)) return;

      if (child.type === SelectTrigger) {
        selectId = child.props.id as string | undefined;
        React.Children.forEach(child.props.children, nested => {
          if (
            React.isValidElement<{ placeholder?: string }>(nested) &&
            nested.type === SelectValue
          ) {
            placeholderLabel = nested.props.placeholder;
          }
        });
      } else if (child.type === SelectContent) {
        React.Children.forEach(child.props.children, nested => {
          if (React.isValidElement(nested)) {
            options.push(nested);
          }
        });
      }
    });

    const renderedOptions = [] as React.ReactNode[];
    if (placeholderLabel) {
      renderedOptions.push(
        <option key="placeholder" value="" disabled hidden>
          {placeholderLabel}
        </option>,
      );
    }

    renderedOptions.push(...options);

    const effectiveValue = value ?? "";

    return (
      <select
        id={selectId}
        value={effectiveValue}
        onChange={event => onValueChange(event.target.value)}
      >
        {renderedOptions}
      </select>
    );
  };

  return {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
  };
});

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
});

const defaultContext = {
  createBroker: vi.fn(),
  updateBroker: vi.fn(),
  deleteBroker: vi.fn(),
};

describe("Dashboard page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeletons when brokers are loading", () => {
    mockUseBrokers.mockReturnValue({
      brokers: [],
      isLoading: true,
      ...defaultContext,
    });
    mockUseSales.mockReturnValue({ sales: [] });
    mockUseListings.mockReturnValue({ listings: [] });
    mockUseExpenses.mockReturnValue({ expenses: [] });
    mockUseTasks.mockReturnValue({ tasks: [] });

    render(<Dashboard />);

    expect(screen.getAllByTestId("metric-card-skeleton")).toHaveLength(4);
  });

  it("calculates and displays aggregated metrics", () => {
    const currentYear = new Date().getFullYear();

    mockUseBrokers.mockReturnValue({
      brokers: [
        {
          id: "broker-1",
          name: "Alice",
          email: "alice@example.com",
          phone: "",
          creci: "",
          totalSales: 0,
          totalListings: 0,
          monthlyExpenses: 0,
          totalValue: 0,
        },
      ],
      isLoading: false,
      ...defaultContext,
    });

    mockUseSales.mockReturnValue({
      sales: [
        {
          id: "sale-1",
          brokerId: "broker-1",
          propertyAddress: "Rua A",
          clientName: "Cliente A",
          saleValue: 100000,
          commission: 5000,
          saleDate: `${currentYear}-05-10`,
        },
        {
          id: "sale-2",
          brokerId: "broker-1",
          propertyAddress: "Rua B",
          clientName: "Cliente B",
          saleValue: 200000,
          commission: 8000,
          saleDate: `${currentYear}-06-15`,
        },
      ],
    });

    mockUseListings.mockReturnValue({
      listings: [
        {
          id: "listing-1",
          brokerId: "broker-1",
          propertyType: "Casa",
          quantity: 1,
          listingDate: `${currentYear}-04-01`,
          status: "Ativa",
        },
        {
          id: "listing-2",
          brokerId: "broker-1",
          propertyType: "Casa",
          quantity: 1,
          listingDate: `${currentYear}-03-01`,
          status: "Vendida",
        },
      ],
    });

    mockUseExpenses.mockReturnValue({
      expenses: [
        {
          id: "expense-1",
          brokerId: "broker-1",
          description: "Marketing",
          amount: 50000,
          category: "Marketing",
          expenseDate: `${currentYear}-04-20`,
        },
      ],
    });

    mockUseTasks.mockReturnValue({
      tasks: [
        {
          id: "task-1",
          title: "Preparar proposta",
          description: "",
          dueDate: `${currentYear}-04-25`,
          status: "TODO",
          createdAt: `${currentYear}-04-01`,
          priority: "Alta",
        },
      ],
    });

    render(<Dashboard />);

    const getMetricValue = (title: string) => {
      const titleElement = screen.getByText(title);
      const card = titleElement.closest('[data-testid="metric-card"]');
      if (!(card instanceof HTMLElement)) {
        throw new Error("Card not found");
      }
      return within(card).getByTestId("metric-value").textContent ?? "";
    };

    expect(getMetricValue("Vendas no Período")).toBe("2");
    expect(getMetricValue("Captações Ativas")).toBe("1");
    expect(getMetricValue("Valor Total Vendido")).toBe(currencyFormatter.format(300000));
    expect(getMetricValue("Total de Gastos")).toBe(currencyFormatter.format(50000));
    expect(getMetricValue("Lucro Líquido")).toBe(currencyFormatter.format(250000));
    expect(getMetricValue("Total de Corretores")).toBe("1");
  });

  it("filters metrics by selected broker", async () => {
    const user = userEvent.setup();
    const currentYear = new Date().getFullYear();

    mockUseBrokers.mockReturnValue({
      brokers: [
        {
          id: "broker-1",
          name: "Alice",
          email: "alice@example.com",
          phone: "",
          creci: "",
          totalSales: 0,
          totalListings: 0,
          monthlyExpenses: 0,
          totalValue: 0,
        },
        {
          id: "broker-2",
          name: "Bruno",
          email: "bruno@example.com",
          phone: "",
          creci: "",
          totalSales: 0,
          totalListings: 0,
          monthlyExpenses: 0,
          totalValue: 0,
        },
      ],
      isLoading: false,
      ...defaultContext,
    });

    mockUseSales.mockReturnValue({
      sales: [
        {
          id: "sale-1",
          brokerId: "broker-1",
          propertyAddress: "Rua A",
          clientName: "Cliente A",
          saleValue: 100000,
          commission: 5000,
          saleDate: `${currentYear}-02-10`,
        },
        {
          id: "sale-2",
          brokerId: "broker-2",
          propertyAddress: "Rua B",
          clientName: "Cliente B",
          saleValue: 250000,
          commission: 9000,
          saleDate: `${currentYear}-03-12`,
        },
      ],
    });

    mockUseListings.mockReturnValue({
      listings: [
        {
          id: "listing-1",
          brokerId: "broker-1",
          propertyType: "Casa",
          quantity: 1,
          listingDate: `${currentYear}-01-05`,
          status: "Ativa",
        },
        {
          id: "listing-2",
          brokerId: "broker-2",
          propertyType: "Casa",
          quantity: 1,
          listingDate: `${currentYear}-01-10`,
          status: "Ativa",
        },
      ],
    });

    mockUseExpenses.mockReturnValue({
      expenses: [
        {
          id: "expense-1",
          brokerId: "broker-1",
          description: "Marketing",
          amount: 40000,
          category: "Marketing",
          expenseDate: `${currentYear}-02-15`,
        },
        {
          id: "expense-2",
          brokerId: "broker-2",
          description: "Eventos",
          amount: 70000,
          category: "Eventos",
          expenseDate: `${currentYear}-02-20`,
        },
      ],
    });

    mockUseTasks.mockReturnValue({ tasks: [] });

    render(<Dashboard />);

    const getMetricValue = (title: string) => {
      const titleElement = screen.getByText(title);
      const card = titleElement.closest('[data-testid="metric-card"]');
      if (!(card instanceof HTMLElement)) {
        throw new Error("Card not found");
      }
      return within(card).getByTestId("metric-value").textContent ?? "";
    };

    expect(getMetricValue("Vendas no Período")).toBe("2");
    expect(getMetricValue("Valor Total Vendido")).toBe(currencyFormatter.format(350000));

    const brokerSelect = screen.getByLabelText("Corretor");
    await user.selectOptions(brokerSelect, "broker-2");

    await waitFor(() => {
      expect(getMetricValue("Vendas no Período")).toBe("1");
      expect(getMetricValue("Valor Total Vendido")).toBe(currencyFormatter.format(250000));
      expect(getMetricValue("Total de Gastos")).toBe(currencyFormatter.format(70000));
    });
  });
});
