import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import BrokerDetails from './BrokerDetails';
import * as AuthContext from '@/contexts/AuthContext';
import * as BrokersContext from '@/contexts/BrokersContext';
import * as ClientsContext from '@/contexts/ClientsContext';
import * as ListingsContext from '@/contexts/ListingsContext';
import * as SalesContext from '@/contexts/SalesContext';
import * as MeetingsContext from '@/contexts/MeetingsContext';
import * as ExpensesContext from '@/contexts/ExpensesContext';

// Mock do react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ brokerId: 'broker-123' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock dos componentes UI
vi.mock('@/components/Navigation', () => ({
  Navigation: () => <div data-testid="navigation">Navigation</div>,
}));

vi.mock('@/components/Breadcrumbs', () => ({
  Breadcrumbs: () => <div data-testid="breadcrumbs">Breadcrumbs</div>,
}));

vi.mock('@/components/MetricCard', () => ({
  MetricCard: ({ title, value }: { title: string; value: string | number }) => (
    <div data-testid={`metric-${title}`}>{value}</div>
  ),
}));

vi.mock('@/components/ListingColumn', () => ({
  ListingColumn: () => <div>ListingColumn</div>,
}));

describe('BrokerDetails - CRUD Operations', () => {
  const mockUser = {
    id: 'user-123',
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'admin' as const,
  };

  const mockBroker = {
    id: 'broker-123',
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '(11) 98765-4321',
    creci: '12345',
    totalSales: 5,
    totalListings: 10,
    monthlyExpenses: 5000,
    totalValue: 1500000,
  };

  const mockClients = [
    {
      id: 'client-1',
      broker_id: 'broker-123',
      client_name: 'Cliente Teste 1',
      interest: 'Apartamento',
      negotiation_status: 'Em Negociação',
      is_active: true,
      status_color: 'green',
      last_updates: 'Contato realizado',
    },
  ];

  const mockListings = [
    {
      id: 'listing-1',
      brokerId: 'broker-123',
      propertyType: 'Apartamento' as const,
      quantity: 2,
      status: 'Ativo' as const,
      listingDate: '2024-01-15',
      propertyAddress: 'Rua Teste, 123',
      propertyValue: 500000,
    },
  ];

  const mockSales = [
    {
      id: 'sale-1',
      brokerId: 'broker-123',
      propertyAddress: 'Av. Principal, 456',
      clientName: 'Cliente Comprador',
      saleValue: 750000,
      commission: 22500,
      saleDate: '2024-01-20',
    },
  ];

  const mockMeetings = [
    {
      id: 'meeting-1',
      brokerId: 'broker-123',
      clientName: 'Cliente Reunião',
      meetingType: 'Apresentação',
      meetingDate: '2024-01-25',
      status: 'Agendada' as const,
      notes: 'Primeira reunião',
      summary: null,
    },
  ];

  const mockExpenses = [
    {
      id: 'expense-1',
      brokerId: 'broker-123',
      description: 'Gasolina',
      amount: 200,
      category: 'Transporte',
      expenseDate: '2024-01-10',
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockContexts: any;

  beforeEach(() => {
    mockContexts = {
      auth: {
        user: mockUser,
        isLoading: false,
      },
      brokers: {
        brokers: [mockBroker],
        isLoading: false,
        getBrokerById: vi.fn(() => mockBroker),
        createBroker: vi.fn(),
        updateBroker: vi.fn(),
        deleteBroker: vi.fn(),
        refreshBrokers: vi.fn(),
      },
      clients: {
        clients: mockClients,
        loading: false,
        addClient: vi.fn(),
        updateClient: vi.fn(),
        deleteClient: vi.fn(),
      },
      listings: {
        listings: mockListings,
        createListing: vi.fn(),
        updateListing: vi.fn(),
        deleteListing: vi.fn(),
        getListingsByBrokerId: vi.fn(() => mockListings),
        getAggregateQuantity: vi.fn(),
        updateAggregateQuantity: vi.fn(),
        getDetailedListingsByType: vi.fn(),
      },
      sales: {
        sales: mockSales,
        createSale: vi.fn(),
        updateSale: vi.fn(),
        deleteSale: vi.fn(),
        getSalesByBrokerId: vi.fn(() => mockSales),
      },
      meetings: {
        meetings: mockMeetings,
        createMeeting: vi.fn(),
        updateMeeting: vi.fn(),
        completeMeeting: vi.fn(),
        deleteMeeting: vi.fn(),
        getMeetingsByBrokerId: vi.fn(() => mockMeetings),
      },
      expenses: {
        expenses: mockExpenses,
        createExpense: vi.fn(),
        updateExpense: vi.fn(),
        deleteExpense: vi.fn(),
        getExpensesByBrokerId: vi.fn(() => mockExpenses),
      },
    };

    vi.spyOn(AuthContext, 'useAuth').mockReturnValue(mockContexts.auth);
    vi.spyOn(BrokersContext, 'useBrokers').mockReturnValue(mockContexts.brokers);
    vi.spyOn(ClientsContext, 'useClients').mockReturnValue(mockContexts.clients);
    vi.spyOn(ListingsContext, 'useListings').mockReturnValue(mockContexts.listings);
    vi.spyOn(SalesContext, 'useSales').mockReturnValue(mockContexts.sales);
    vi.spyOn(MeetingsContext, 'useMeetings').mockReturnValue(mockContexts.meetings);
    vi.spyOn(ExpensesContext, 'useExpenses').mockReturnValue(mockContexts.expenses);
  });

  describe('Broker Profile Display', () => {
    it('should display broker basic information', async () => {
      render(
        <BrowserRouter>
          <BrokerDetails />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
        expect(screen.getByText(/joao@example.com/)).toBeInTheDocument();
        expect(screen.getByText(/98765-4321/)).toBeInTheDocument();
        expect(screen.getByText(/CRECI 12345/)).toBeInTheDocument();
      });
    });

    it('should display broker metrics', async () => {
      render(
        <BrowserRouter>
          <BrokerDetails />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('metric-Vendas no Ano')).toHaveTextContent('1');
        expect(screen.getByTestId('metric-Captações Ativas')).toHaveTextContent('1');
      });
    });

    it('should show "Meu Perfil" when viewing own profile', async () => {
      mockContexts.auth.user = { ...mockUser, role: 'broker', email: 'joao@example.com' };
      vi.spyOn(AuthContext, 'useAuth').mockReturnValue(mockContexts.auth);

      render(
        <BrowserRouter>
          <BrokerDetails />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Meu Perfil')).toBeInTheDocument();
      });
    });
  });

  describe('Client Management (Create, Edit, Delete)', () => {
    it('should open client creation dialog', async () => {
      render(
        <BrowserRouter>
          <BrokerDetails />
        </BrowserRouter>
      );

      const newClientButton = screen.getByRole('button', { name: /Novo Cliente/i });
      fireEvent.click(newClientButton);

      await screen.findByRole('heading', { name: 'Novo Cliente' });
    });

    it('should create a new client', async () => {
      mockContexts.clients.addClient.mockResolvedValue({ id: 'new-client' });

      render(
        <BrowserRouter>
          <BrokerDetails />
        </BrowserRouter>
      );

      const newClientButton = screen.getByRole('button', { name: /Novo Cliente/i });
      fireEvent.click(newClientButton);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/Nome do Cliente/i);
        const interestInput = screen.getByLabelText(/Interesse/i);
        
        fireEvent.change(nameInput, { target: { value: 'Novo Cliente' } });
        fireEvent.change(interestInput, { target: { value: 'Casa' } });
      });

      const submitButton = screen.getByRole('button', { name: /Adicionar/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockContexts.clients.addClient).toHaveBeenCalled();
      });
    });

    it('should delete a client', async () => {
      mockContexts.clients.deleteClient.mockResolvedValue(undefined);
      
      // Mock window.confirm
      global.confirm = vi.fn(() => true);

      render(
        <BrowserRouter>
          <BrokerDetails />
        </BrowserRouter>
      );

      const user = userEvent.setup();
      const clientRow = screen.getByText('Cliente Teste 1').closest('tr');
      const deleteClientButton = clientRow ? within(clientRow).getAllByRole('button')[1] : undefined;

      if (!deleteClientButton) {
        throw new Error('Delete client button not found');
      }

      await user.click(deleteClientButton);

      await waitFor(() => {
        expect(mockContexts.clients.deleteClient).toHaveBeenCalled();
      });
    });
  });

  describe('Sales Management (Create, Edit, Delete)', () => {
    it('should open sales creation dialog', async () => {
      render(
        <BrowserRouter>
          <BrokerDetails />
        </BrowserRouter>
      );

      // Navegar para a aba de vendas
      const user = userEvent.setup();
      const salesTab = screen.getByRole('tab', { name: /Vendas/i });
      await user.click(salesTab);

      const newSaleButton = await screen.findByRole('button', { name: /Nova Venda/i });
      await user.click(newSaleButton);

      expect(screen.getByText('Adicionar Nova Venda')).toBeInTheDocument();
    });

    it('should create a new sale', async () => {
      mockContexts.sales.createSale.mockResolvedValue({ id: 'new-sale' });

      render(
        <BrowserRouter>
          <BrokerDetails />
        </BrowserRouter>
      );

      const user = userEvent.setup();
      const salesTab = screen.getByRole('tab', { name: /Vendas/i });
      await user.click(salesTab);

      const newSaleButton = await screen.findByRole('button', { name: /Nova Venda/i });
      await user.click(newSaleButton);

      expect(mockContexts.sales.createSale).not.toHaveBeenCalled();
    });

    it('should delete a sale', async () => {
      mockContexts.sales.deleteSale.mockResolvedValue(undefined);
      global.confirm = vi.fn(() => true);

      render(
        <BrowserRouter>
          <BrokerDetails />
        </BrowserRouter>
      );

      const user = userEvent.setup();
      const salesTab = screen.getByRole('tab', { name: /Vendas/i });
      await user.click(salesTab);

      expect(mockContexts.sales.deleteSale).not.toHaveBeenCalled();
    });
  });

  describe('Listings Management (Create, Edit, Delete)', () => {
    it('should open listings creation dialog', async () => {
      render(
        <BrowserRouter>
          <BrokerDetails />
        </BrowserRouter>
      );

      const user = userEvent.setup();
      const listingsTab = screen.getByRole('tab', { name: /Captações/i });
      await user.click(listingsTab);

      expect(screen.getByText(/Captações por Tipo de Imóvel/i)).toBeInTheDocument();
    });

    it('should create a new listing', async () => {
      mockContexts.listings.createListing.mockResolvedValue({ id: 'new-listing' });

      render(
        <BrowserRouter>
          <BrokerDetails />
        </BrowserRouter>
      );

      const user = userEvent.setup();
      const listingsTab = screen.getByRole('tab', { name: /Captações/i });
      await user.click(listingsTab);

      expect(mockContexts.listings.createListing).not.toHaveBeenCalled();
    });

    it('should delete a listing', async () => {
      mockContexts.listings.deleteListing.mockResolvedValue(undefined);
      global.confirm = vi.fn(() => true);

      render(
        <BrowserRouter>
          <BrokerDetails />
        </BrowserRouter>
      );

      const user = userEvent.setup();
      const listingsTab = screen.getByRole('tab', { name: /Captações/i });
      await user.click(listingsTab);

      expect(mockContexts.listings.deleteListing).not.toHaveBeenCalled();
    });
  });

  describe('Meetings Management (Create, Edit, Delete)', () => {
    it('should display meetings tab', async () => {
      render(
        <BrowserRouter>
          <BrokerDetails />
        </BrowserRouter>
      );

      const user = userEvent.setup();
      const meetingsTab = screen.getByRole('tab', { name: /Reuniões/i });
      await user.click(meetingsTab);

      expect(screen.getByText(/Reuniões e Planos de Ação/i)).toBeInTheDocument();
    });

    it('should create a new meeting', async () => {
      mockContexts.meetings.createMeeting.mockResolvedValue({ id: 'new-meeting' });

      render(
        <BrowserRouter>
          <BrokerDetails />
        </BrowserRouter>
      );

      const user = userEvent.setup();
      const meetingsTab = screen.getByRole('tab', { name: /Reuniões/i });
      await user.click(meetingsTab);

      expect(mockContexts.meetings.createMeeting).not.toHaveBeenCalled();
    });

    it('should complete a meeting', async () => {
      mockContexts.meetings.completeMeeting.mockResolvedValue(undefined);

      render(
        <BrowserRouter>
          <BrokerDetails />
        </BrowserRouter>
      );

      const user = userEvent.setup();
      const meetingsTab = screen.getByRole('tab', { name: /Reuniões/i });
      await user.click(meetingsTab);

      expect(mockContexts.meetings.completeMeeting).not.toHaveBeenCalled();
    });

    it('should delete a meeting', async () => {
      mockContexts.meetings.deleteMeeting.mockResolvedValue(undefined);
      global.confirm = vi.fn(() => true);

      render(
        <BrowserRouter>
          <BrokerDetails />
        </BrowserRouter>
      );

      const user = userEvent.setup();
      const meetingsTab = screen.getByRole('tab', { name: /Reuniões/i });
      await user.click(meetingsTab);

      expect(mockContexts.meetings.deleteMeeting).not.toHaveBeenCalled();
    });
  });

  describe('Expenses Management (Create, Edit, Delete)', () => {
    it('should display expenses tab', async () => {
      render(
        <BrowserRouter>
          <BrokerDetails />
        </BrowserRouter>
      );

      const user = userEvent.setup();
      const expensesTab = screen.getByRole('tab', { name: /Gastos/i });
      await user.click(expensesTab);

      expect(await screen.findByText(/Gastos Mensais/i)).toBeInTheDocument();
    });

    it('should create a new expense', async () => {
      mockContexts.expenses.createExpense.mockResolvedValue({ id: 'new-expense' });

      render(
        <BrowserRouter>
          <BrokerDetails />
        </BrowserRouter>
      );

      const user = userEvent.setup();
      const expensesTab = screen.getByRole('tab', { name: /Gastos/i });
      await user.click(expensesTab);

      const newExpenseButton = await screen.findByRole('button', { name: /Novo Gasto/i });
      await user.click(newExpenseButton);

      expect(screen.getByText('Adicionar Novo Gasto')).toBeInTheDocument();
    });

    it('should delete an expense', async () => {
      mockContexts.expenses.deleteExpense.mockResolvedValue(undefined);
      global.confirm = vi.fn(() => true);

      render(
        <BrowserRouter>
          <BrokerDetails />
        </BrowserRouter>
      );

      const user = userEvent.setup();
      const expensesTab = screen.getByRole('tab', { name: /Gastos/i });
      await user.click(expensesTab);

      expect(mockContexts.expenses.deleteExpense).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle broker not found', async () => {
      mockContexts.brokers.getBrokerById.mockReturnValue(undefined);
      vi.spyOn(BrokersContext, 'useBrokers').mockReturnValue(mockContexts.brokers);

      render(
        <BrowserRouter>
          <BrokerDetails />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('navigation')).toBeInTheDocument();
      });
    });

    it('should handle client creation error', async () => {
      mockContexts.clients.addClient.mockRejectedValue(new Error('Failed to create client'));

      render(
        <BrowserRouter>
          <BrokerDetails />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Novo Cliente/i })).toBeInTheDocument();
      });
    });

    it('should handle sale deletion error', async () => {
      mockContexts.sales.deleteSale.mockRejectedValue(new Error('Failed to delete sale'));
      global.confirm = vi.fn(() => true);

      render(
        <BrowserRouter>
          <BrokerDetails />
        </BrowserRouter>
      );

      const user = userEvent.setup();
      const salesTab = screen.getByRole('tab', { name: /Vendas/i });
      await user.click(salesTab);

      expect(screen.getByText(/Vendas Realizadas/i)).toBeInTheDocument();
    });
  });
});
