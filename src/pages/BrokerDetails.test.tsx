import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import BrokerDetails from './BrokerDetails';
import * as ClientsContext from '@/contexts/ClientsContext';
import * as BrokersContext from '@/contexts/BrokersContext';
import * as AuthContext from '@/contexts/AuthContext';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ brokerId: 'broker-123' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock contexts
vi.mock('@/contexts/ListingsContext', () => ({
  useListings: () => ({
    listings: [],
    loading: false,
    getListingsByBrokerId: vi.fn(() => []),
    getDetailedListingsByType: vi.fn(() => []),
    getAggregateQuantity: vi.fn(() => 0),
    createListing: vi.fn(),
    updateListing: vi.fn(),
    deleteListing: vi.fn(),
  }),
  ListingsProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/contexts/SalesContext', () => ({
  useSales: () => ({
    sales: [],
    loading: false,
    getSalesByBrokerId: vi.fn(() => []),
    createSale: vi.fn(),
    updateSale: vi.fn(),
    deleteSale: vi.fn(),
  }),
  SalesProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/contexts/MeetingsContext', () => ({
  useMeetings: () => ({
    meetings: [],
    loading: false,
    getMeetingsByBrokerId: vi.fn(() => []),
    addMeeting: vi.fn(),
    updateMeeting: vi.fn(),
    deleteMeeting: vi.fn(),
  }),
  MeetingsProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/contexts/ExpensesContext', () => ({
  useExpenses: () => ({
    expenses: [],
    loading: false,
    getExpensesByBrokerId: vi.fn(() => []),
    addExpense: vi.fn(),
    updateExpense: vi.fn(),
    deleteExpense: vi.fn(),
  }),
  ExpensesProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('BrokerDetails - Client Last Updates Feature', () => {
  const mockBroker = {
    id: 'broker-123',
    name: 'João Corretor',
    email: 'joao@example.com',
    phone: '(11) 98888-7777',
    creci: '12345',
    totalSales: 10,
    totalListings: 5,
    monthlyExpenses: 5000,
    totalValue: 50000,
  };

  const mockClients = [
    {
      id: 'client-1',
      user_id: 'user-123',
      broker_id: 'broker-123',
      client_name: 'Ana Silva',
      interest: 'Apartamento 3 quartos',
      negotiation_status: 'Em Negociação',
      is_active: true,
      status_color: 'green',
      last_updates: 'Cliente solicitou mais fotos do imóvel',
      created_at: '2025-10-01T00:00:00Z',
      updated_at: '2025-10-14T00:00:00Z',
    },
    {
      id: 'client-2',
      user_id: 'user-123',
      broker_id: 'broker-123',
      client_name: 'Carlos Santos',
      interest: 'Casa em condomínio',
      negotiation_status: 'Primeiro Contato',
      is_active: true,
      status_color: 'yellow',
      last_updates: undefined,
      created_at: '2025-10-05T00:00:00Z',
      updated_at: '2025-10-05T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock AuthContext
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
      },
      session: null,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      isAuthenticated: true,
    });

    // Mock BrokersContext with getBrokerById
    vi.spyOn(BrokersContext, 'useBrokers').mockReturnValue({
      brokers: [mockBroker],
      isLoading: false,
      createBroker: vi.fn(),
      updateBroker: vi.fn(),
      deleteBroker: vi.fn(),
      getBrokerById: vi.fn((id: string) => 
        id === 'broker-123' ? mockBroker : undefined
      ),
    });

    // Mock ClientsContext
    vi.spyOn(ClientsContext, 'useClients').mockReturnValue({
      clients: mockClients,
      loading: false,
      addClient: vi.fn(),
      updateClient: vi.fn(),
      deleteClient: vi.fn(),
      refreshClients: vi.fn(),
    });
  });

  describe('Display Last Updates Field', () => {
    it('should render last_updates column in clients table', async () => {
      render(<BrokerDetails />);

      await waitFor(() => {
        expect(screen.getByText('Últimas Atualizações')).toBeDefined();
      });
    });

    it('should display last_updates content for client', async () => {
      render(<BrokerDetails />);

      await waitFor(() => {
        expect(
          screen.getByText('Cliente solicitou mais fotos do imóvel')
        ).toBeDefined();
      });
    });

    it('should display dash for client without last_updates', async () => {
      render(<BrokerDetails />);

      await waitFor(() => {
        const cells = screen.getAllByText('-');
        expect(cells.length).toBeGreaterThan(0);
      });
    });

    it('should truncate long last_updates text', async () => {
      const longUpdateText = 'A'.repeat(200);
      const clientWithLongUpdate = {
        ...mockClients[0],
        last_updates: longUpdateText,
      };

      vi.spyOn(ClientsContext, 'useClients').mockReturnValue({
        clients: [clientWithLongUpdate],
        loading: false,
        addClient: vi.fn(),
        updateClient: vi.fn(),
        deleteClient: vi.fn(),
        refreshClients: vi.fn(),
      });

      render(<BrokerDetails />);

      await waitFor(() => {
        const cell = screen.getByTitle(longUpdateText);
        expect(cell).toBeDefined();
        expect(cell.classList.contains('truncate')).toBe(true);
      });
    });
  });

  describe('Create Client with Last Updates', () => {
    it('should render last_updates textarea in create client form', async () => {
      const user = userEvent.setup();
      render(<BrokerDetails />);

      // Click on "Novo Cliente" button
      const newClientButton = screen.getByText('Novo Cliente');
      await user.click(newClientButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Últimas Atualizações')).toBeDefined();
      });
    });

    it('should have placeholder text in last_updates textarea', async () => {
      const user = userEvent.setup();
      render(<BrokerDetails />);

      const newClientButton = screen.getByText('Novo Cliente');
      await user.click(newClientButton);

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(
          'Anote aqui as últimas atualizações sobre o cliente...'
        );
        expect(textarea).toBeDefined();
      });
    });

    it('should allow typing in last_updates field', async () => {
      const user = userEvent.setup();
      render(<BrokerDetails />);

      const newClientButton = screen.getByText('Novo Cliente');
      await user.click(newClientButton);

      await waitFor(async () => {
        const textarea = screen.getByLabelText('Últimas Atualizações');
        await user.type(textarea, 'Teste de atualização');
        expect(textarea).toHaveValue('Teste de atualização');
      });
    });

    it('should submit client with last_updates', async () => {
      const mockAddClient = vi.fn().mockResolvedValue(undefined);
      vi.spyOn(ClientsContext, 'useClients').mockReturnValue({
        clients: mockClients,
        loading: false,
        addClient: mockAddClient,
        updateClient: vi.fn(),
        deleteClient: vi.fn(),
        refreshClients: vi.fn(),
      });

      const user = userEvent.setup();
      render(<BrokerDetails />);

      // Open modal
      const newClientButton = screen.getByText('Novo Cliente');
      await user.click(newClientButton);

      // Fill form
      await waitFor(async () => {
        const nameInput = screen.getByLabelText('Nome do Cliente');
        await user.type(nameInput, 'Novo Cliente Teste');

        const interestInput = screen.getByLabelText('Interesse');
        await user.type(interestInput, 'Apartamento');

        const lastUpdatesTextarea = screen.getByLabelText('Últimas Atualizações');
        await user.type(lastUpdatesTextarea, 'Primeiro contato realizado');
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /adicionar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAddClient).toHaveBeenCalledWith(
          expect.objectContaining({
            client_name: 'Novo Cliente Teste',
            interest: 'Apartamento',
            last_updates: 'Primeiro contato realizado',
          })
        );
      });
    });

    it('should submit client without last_updates', async () => {
      const mockAddClient = vi.fn().mockResolvedValue(undefined);
      vi.spyOn(ClientsContext, 'useClients').mockReturnValue({
        clients: mockClients,
        loading: false,
        addClient: mockAddClient,
        updateClient: vi.fn(),
        deleteClient: vi.fn(),
        refreshClients: vi.fn(),
      });

      const user = userEvent.setup();
      render(<BrokerDetails />);

      const newClientButton = screen.getByText('Novo Cliente');
      await user.click(newClientButton);

      await waitFor(async () => {
        const nameInput = screen.getByLabelText('Nome do Cliente');
        await user.type(nameInput, 'Cliente Sem Updates');

        const interestInput = screen.getByLabelText('Interesse');
        await user.type(interestInput, 'Casa');
      });

      const submitButton = screen.getByRole('button', { name: /adicionar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAddClient).toHaveBeenCalledWith(
          expect.objectContaining({
            client_name: 'Cliente Sem Updates',
            interest: 'Casa',
            last_updates: '',
          })
        );
      });
    });
  });

  describe('Edit Client Last Updates', () => {
    it('should populate last_updates field when editing client', async () => {
      const user = userEvent.setup();
      render(<BrokerDetails />);

      // Click edit button for first client
      await waitFor(async () => {
        const editButtons = screen.getAllByRole('button');
        const editButton = editButtons.find(
          (btn) => btn.querySelector('svg') !== null
        );
        if (editButton) {
          await user.click(editButton);
        }
      });

      await waitFor(() => {
        const textarea = screen.getByLabelText('Últimas Atualizações');
        expect(textarea).toHaveValue('Cliente solicitou mais fotos do imóvel');
      });
    });

    it('should update client with modified last_updates', async () => {
      const mockUpdateClient = vi.fn().mockResolvedValue(undefined);
      vi.spyOn(ClientsContext, 'useClients').mockReturnValue({
        clients: mockClients,
        loading: false,
        addClient: vi.fn(),
        updateClient: mockUpdateClient,
        deleteClient: vi.fn(),
        refreshClients: vi.fn(),
      });

      const user = userEvent.setup();
      render(<BrokerDetails />);

      await waitFor(async () => {
        const editButtons = screen.getAllByRole('button');
        const editButton = editButtons.find(
          (btn) => btn.querySelector('svg') !== null
        );
        if (editButton) {
          await user.click(editButton);
        }
      });

      await waitFor(async () => {
        const textarea = screen.getByLabelText('Últimas Atualizações');
        await user.clear(textarea);
        await user.type(textarea, 'Atualização modificada');
      });

      const updateButton = screen.getByRole('button', { name: /atualizar/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(mockUpdateClient).toHaveBeenCalledWith(
          'client-1',
          expect.objectContaining({
            last_updates: 'Atualização modificada',
          })
        );
      });
    });

    it('should clear last_updates when editing', async () => {
      const mockUpdateClient = vi.fn().mockResolvedValue(undefined);
      vi.spyOn(ClientsContext, 'useClients').mockReturnValue({
        clients: mockClients,
        loading: false,
        addClient: vi.fn(),
        updateClient: mockUpdateClient,
        deleteClient: vi.fn(),
        refreshClients: vi.fn(),
      });

      const user = userEvent.setup();
      render(<BrokerDetails />);

      await waitFor(async () => {
        const editButtons = screen.getAllByRole('button');
        const editButton = editButtons.find(
          (btn) => btn.querySelector('svg') !== null
        );
        if (editButton) {
          await user.click(editButton);
        }
      });

      await waitFor(async () => {
        const textarea = screen.getByLabelText('Últimas Atualizações');
        await user.clear(textarea);
      });

      const updateButton = screen.getByRole('button', { name: /atualizar/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(mockUpdateClient).toHaveBeenCalledWith(
          'client-1',
          expect.objectContaining({
            last_updates: '',
          })
        );
      });
    });
  });

  describe('Form Reset', () => {
    it('should reset last_updates field when closing modal', async () => {
      const user = userEvent.setup();
      render(<BrokerDetails />);

      const newClientButton = screen.getByText('Novo Cliente');
      await user.click(newClientButton);

      await waitFor(async () => {
        const textarea = screen.getByLabelText('Últimas Atualizações');
        await user.type(textarea, 'Texto de teste');
        expect(textarea).toHaveValue('Texto de teste');
      });

      // Close modal (ESC key or clicking outside)
      fireEvent.keyDown(document, { key: 'Escape' });

      // Reopen modal
      await user.click(newClientButton);

      await waitFor(() => {
        const textarea = screen.getByLabelText('Últimas Atualizações');
        expect(textarea).toHaveValue('');
      });
    });

    it('should reset last_updates field after successful submission', async () => {
      const mockAddClient = vi.fn().mockResolvedValue(undefined);
      vi.spyOn(ClientsContext, 'useClients').mockReturnValue({
        clients: mockClients,
        loading: false,
        addClient: mockAddClient,
        updateClient: vi.fn(),
        deleteClient: vi.fn(),
        refreshClients: vi.fn(),
      });

      const user = userEvent.setup();
      render(<BrokerDetails />);

      const newClientButton = screen.getByText('Novo Cliente');
      await user.click(newClientButton);

      await waitFor(async () => {
        const nameInput = screen.getByLabelText('Nome do Cliente');
        await user.type(nameInput, 'Cliente Teste');

        const interestInput = screen.getByLabelText('Interesse');
        await user.type(interestInput, 'Teste');

        const textarea = screen.getByLabelText('Últimas Atualizações');
        await user.type(textarea, 'Update teste');
      });

      const submitButton = screen.getByRole('button', { name: /adicionar/i });
      await user.click(submitButton);

      // Reopen modal
      await waitFor(async () => {
        await user.click(newClientButton);
      });

      await waitFor(() => {
        const textarea = screen.getByLabelText('Últimas Atualizações');
        expect(textarea).toHaveValue('');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper label for last_updates textarea', async () => {
      const user = userEvent.setup();
      render(<BrokerDetails />);

      const newClientButton = screen.getByText('Novo Cliente');
      await user.click(newClientButton);

      await waitFor(() => {
        const label = screen.getByText('Últimas Atualizações');
        const textarea = screen.getByLabelText('Últimas Atualizações');
        expect(label).toBeDefined();
        expect(textarea).toBeDefined();
      });
    });

    it('should have textarea with proper attributes', async () => {
      const user = userEvent.setup();
      render(<BrokerDetails />);

      const newClientButton = screen.getByText('Novo Cliente');
      await user.click(newClientButton);

      await waitFor(() => {
        const textarea = screen.getByLabelText(
          'Últimas Atualizações'
        ) as HTMLTextAreaElement;
        expect(textarea.rows).toBe(4);
        expect(textarea.classList.contains('resize-none')).toBe(true);
      });
    });
  });
});
