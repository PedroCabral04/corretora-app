import React, { ChangeEvent } from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/test/test-utils";
import "@testing-library/jest-dom/vitest";
import Brokers from "./Brokers";

const mockUseBrokers = vi.fn();
const mockUseAuth = vi.fn();
const mockToast = vi.fn();
const mockNavigate = vi.fn();

vi.mock("@/contexts/BrokersContext", () => ({
  useBrokers: () => mockUseBrokers(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

type ReactRouterDom = typeof import("react-router-dom");

vi.mock("react-router-dom", async () => {
  const actual = (await vi.importActual<ReactRouterDom>("react-router-dom"));
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/components/Navigation", () => ({
  Navigation: () => <nav data-testid="navigation">Navigation</nav>,
}));

interface MockBroker {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  creci?: string;
  totalSales: number;
  totalListings: number;
  monthlyExpenses: number;
  totalValue: number;
}

interface MockBrokerCardProps {
  broker: MockBroker;
  onViewDetails: (brokerId: string) => void;
  onEdit?: (brokerId: string) => void;
  onDelete?: (brokerId: string) => void;
}

vi.mock("@/components/BrokerCard", () => ({
  BrokerCard: ({ broker, onViewDetails, onEdit, onDelete }: MockBrokerCardProps) => (
    <div data-testid="broker-card">
      <p>{broker.name}</p>
      <button onClick={() => onViewDetails(broker.id)}>Ver Detalhes</button>
      {onEdit && <button onClick={() => onEdit(broker.id)}>Editar</button>}
      {onDelete && <button onClick={() => onDelete(broker.id)}>Excluir</button>}
    </div>
  ),
}));

vi.mock("@/components/FilterBar", () => ({
  FilterBar: ({
    searchPlaceholder,
    searchValue,
    onSearchChange,
    onClearFilters,
  }: {
    searchPlaceholder: string;
    searchValue: string;
    onSearchChange: (value: string) => void;
    onClearFilters?: () => void;
  }) => (
    <div>
      <input
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
      />
      {onClearFilters && (
        <button type="button" onClick={onClearFilters}>
          Limpar
        </button>
      )}
    </div>
  ),
}));

vi.mock("@/components/Pagination", () => ({
  Pagination: ({ currentPage, totalPages }: { currentPage: number; totalPages: number }) => (
    <div data-testid="pagination">
      Página {currentPage} de {totalPages}
    </div>
  ),
}));

interface MockConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

vi.mock("@/components/ConfirmDialog", () => ({
  ConfirmDialog: ({ open, title, description, onConfirm, onOpenChange }: MockConfirmDialogProps) =>
    open ? (
      <div role="dialog">
        <p>{title}</p>
        <p>{description}</p>
        <button onClick={onConfirm}>Confirmar</button>
        <button onClick={() => onOpenChange(false)}>Cancelar</button>
      </div>
    ) : null,
}));

vi.mock("@/components/ui/dialog", () => {
  const Dialog = ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="dialog">{children}</div> : null;
  const DialogTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  const DialogContent = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  const DialogHeader = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  const DialogTitle = ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>;

  return {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
  };
});

vi.mock("@/components/ui/skeleton", () => ({
  BrokerCardSkeleton: () => <div data-testid="broker-card-skeleton">loading</div>,
}));

describe("Brokers page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useAuth to return a user object
    mockUseAuth.mockReturnValue({
      user: {
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        role: "manager",
      },
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      isLoading: false,
    });
  });

  it("renders loading skeletons when data is loading", () => {
    mockUseBrokers.mockReturnValue({
      brokers: [],
      isLoading: true,
      createBroker: vi.fn(),
      updateBroker: vi.fn(),
      deleteBroker: vi.fn(),
    });

    render(<Brokers />);

    expect(screen.getAllByTestId("broker-card-skeleton")).toHaveLength(6);
  });

  it("renders broker cards and navigates to details", async () => {
    const user = userEvent.setup();
    const broker = {
      id: "broker-1",
      name: "Maria Silva",
      email: "maria@example.com",
      phone: "(11) 99999-9999",
      creci: "12345-F",
      totalSales: 12,
      totalListings: 7,
      monthlyExpenses: 1000,
      totalValue: 500000,
    };

    mockUseBrokers.mockReturnValue({
      brokers: [broker],
      isLoading: false,
      createBroker: vi.fn(),
      updateBroker: vi.fn(),
      deleteBroker: vi.fn(),
    });

    render(<Brokers />);

    expect(screen.getByText("Maria Silva")).toBeInTheDocument();

    await user.click(screen.getByText("Ver Detalhes"));

    expect(mockNavigate).toHaveBeenCalledWith("/broker/broker-1");
  });

  it("shows empty state when there are no brokers", () => {
    mockUseBrokers.mockReturnValue({
      brokers: [],
      isLoading: false,
      createBroker: vi.fn(),
      updateBroker: vi.fn(),
      deleteBroker: vi.fn(),
    });

    render(<Brokers />);

    expect(screen.getByText("Nenhum corretor cadastrado")).toBeInTheDocument();
  });

  it("shows filtered empty state when search has no matches", async () => {
    const user = userEvent.setup();

    mockUseBrokers.mockReturnValue({
      brokers: [
        {
          id: "broker-1",
          name: "Maria Silva",
          email: "maria@example.com",
          phone: "(11) 99999-9999",
          totalSales: 12,
          totalListings: 7,
          monthlyExpenses: 1000,
          totalValue: 500000,
        },
      ],
      isLoading: false,
      createBroker: vi.fn(),
      updateBroker: vi.fn(),
      deleteBroker: vi.fn(),
    });

    render(<Brokers />);

    const searchInput = screen.getByPlaceholderText(
      "Buscar corretor por nome, email ou CRECI...",
    );

    await user.clear(searchInput);
    await user.type(searchInput, "Outro Corretor");

    expect(screen.getByText("Nenhum corretor encontrado")).toBeInTheDocument();
  });
});
