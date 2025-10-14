import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ClientsProvider, useClients, Client } from './ClientsContext';
import { supabase } from '@/integrations/supabase/client';
import { ReactNode } from 'react';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn(),
    },
  },
}));

// Mock AuthContext
vi.mock('./AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin',
    },
  }),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

describe('ClientsContext - Last Updates Feature', () => {
  const mockClients: Client[] = [
    {
      id: '1',
      user_id: 'test-user-id',
      broker_id: 'broker-1',
      client_name: 'João Silva',
      interest: 'Apartamento 3 quartos',
      negotiation_status: 'Em Negociação',
      is_active: true,
      status_color: 'green',
      last_updates: 'Cliente ligou dia 10/10 solicitando mais informações',
      created_at: '2025-10-01T00:00:00Z',
      updated_at: '2025-10-14T00:00:00Z',
    },
    {
      id: '2',
      user_id: 'test-user-id',
      broker_id: 'broker-1',
      client_name: 'Maria Santos',
      interest: 'Casa em condomínio',
      negotiation_status: 'Primeiro Contato',
      is_active: true,
      status_color: 'yellow',
      last_updates: undefined,
      created_at: '2025-10-05T00:00:00Z',
      updated_at: '2025-10-05T00:00:00Z',
    },
    {
      id: '3',
      user_id: 'test-user-id',
      broker_id: 'broker-2',
      client_name: 'Pedro Costa',
      interest: 'Lote comercial',
      negotiation_status: 'Proposta Enviada',
      is_active: true,
      status_color: 'blue',
      last_updates: 'Aguardando retorno sobre proposta enviada dia 12/10',
      created_at: '2025-10-03T00:00:00Z',
      updated_at: '2025-10-13T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful fetch
    const mockSelect = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockResolvedValue({
      data: mockClients,
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    mockSelect.mockReturnValue({
      order: mockOrder,
    });
  });

  describe('Fetching Clients with Last Updates', () => {
    it('should fetch clients including last_updates field', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ClientsProvider>{children}</ClientsProvider>
      );

      const { result } = renderHook(() => useClients(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.clients).toHaveLength(3);
      expect(result.current.clients[0].last_updates).toBe(
        'Cliente ligou dia 10/10 solicitando mais informações'
      );
    });

    it('should handle clients without last_updates field', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ClientsProvider>{children}</ClientsProvider>
      );

      const { result } = renderHook(() => useClients(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const clientWithoutUpdates = result.current.clients.find(
        (c) => c.id === '2'
      );
      expect(clientWithoutUpdates?.last_updates).toBeUndefined();
    });

    it('should fetch clients with populated last_updates', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <ClientsProvider>{children}</ClientsProvider>
      );

      const { result } = renderHook(() => useClients(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const clientsWithUpdates = result.current.clients.filter(
        (c) => c.last_updates
      );
      expect(clientsWithUpdates).toHaveLength(2);
    });
  });

  describe('Adding Client with Last Updates', () => {
    it('should add a new client with last_updates field', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      const mockFrom = vi.fn().mockReturnValue({
        insert: mockInsert,
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockClients,
          error: null,
        }),
      });

      (supabase.from as any).mockImplementation(mockFrom);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <ClientsProvider>{children}</ClientsProvider>
      );

      const { result } = renderHook(() => useClients(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newClient = {
        broker_id: 'broker-1',
        client_name: 'Ana Paula',
        interest: 'Apartamento 2 quartos',
        negotiation_status: 'Primeiro Contato',
        is_active: true,
        status_color: 'green',
        last_updates: 'Primeiro contato realizado em 14/10',
      };

      await result.current.addClient(newClient);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newClient,
          user_id: 'test-user-id',
        })
      );
    });

    it('should add a client without last_updates field', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      const mockFrom = vi.fn().mockReturnValue({
        insert: mockInsert,
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockClients,
          error: null,
        }),
      });

      (supabase.from as any).mockImplementation(mockFrom);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <ClientsProvider>{children}</ClientsProvider>
      );

      const { result } = renderHook(() => useClients(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newClient = {
        broker_id: 'broker-2',
        client_name: 'Carlos Oliveira',
        interest: 'Sobrado',
        negotiation_status: 'Em Negociação',
        is_active: true,
        status_color: 'blue',
      };

      await result.current.addClient(newClient);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newClient,
          user_id: 'test-user-id',
        })
      );
    });
  });

  describe('Updating Client Last Updates', () => {
    it('should update client with new last_updates', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({
        update: mockUpdate,
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockClients,
          error: null,
        }),
      });

      (supabase.from as any).mockImplementation(mockFrom);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <ClientsProvider>{children}</ClientsProvider>
      );

      const { result } = renderHook(() => useClients(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updatedData = {
        last_updates: 'Cliente confirmou interesse em visita para 15/10',
      };

      await result.current.updateClient('1', updatedData);

      expect(mockUpdate).toHaveBeenCalledWith(updatedData);
      expect(mockEq).toHaveBeenCalledWith('id', '1');
    });

    it('should update client clearing last_updates', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({
        update: mockUpdate,
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockClients,
          error: null,
        }),
      });

      (supabase.from as any).mockImplementation(mockFrom);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <ClientsProvider>{children}</ClientsProvider>
      );

      const { result } = renderHook(() => useClients(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.updateClient('1', { last_updates: '' });

      expect(mockUpdate).toHaveBeenCalledWith({ last_updates: '' });
    });

    it('should update multiple fields including last_updates', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({
        update: mockUpdate,
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockClients,
          error: null,
        }),
      });

      (supabase.from as any).mockImplementation(mockFrom);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <ClientsProvider>{children}</ClientsProvider>
      );

      const { result } = renderHook(() => useClients(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updatedData = {
        negotiation_status: 'Fechamento',
        status_color: 'green',
        last_updates: 'Cliente assinou contrato em 14/10/2025',
      };

      await result.current.updateClient('1', updatedData);

      expect(mockUpdate).toHaveBeenCalledWith(updatedData);
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch error gracefully', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: mockOrder,
        }),
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <ClientsProvider>{children}</ClientsProvider>
      );

      const { result } = renderHook(() => useClients(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.clients).toEqual([]);
    });

    it('should handle update error', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        error: { message: 'Update failed' },
      });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({
        update: mockUpdate,
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockClients,
          error: null,
        }),
      });

      (supabase.from as any).mockImplementation(mockFrom);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <ClientsProvider>{children}</ClientsProvider>
      );

      const { result } = renderHook(() => useClients(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.updateClient('1', {
          last_updates: 'New update',
        })
      ).rejects.toThrow();
    });
  });

  describe('Data Validation', () => {
    it('should accept empty string for last_updates', async () => {
      const clientWithEmptyUpdates = {
        ...mockClients[0],
        last_updates: '',
      };

      const mockOrder = vi.fn().mockResolvedValue({
        data: [clientWithEmptyUpdates],
        error: null,
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: mockOrder,
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <ClientsProvider>{children}</ClientsProvider>
      );

      const { result } = renderHook(() => useClients(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.clients[0].last_updates).toBe('');
    });

    it('should handle long text in last_updates', async () => {
      const longText = 'A'.repeat(5000);
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      
      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockClients,
          error: null,
        }),
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <ClientsProvider>{children}</ClientsProvider>
      );

      const { result } = renderHook(() => useClients(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newClient = {
        broker_id: 'broker-1',
        client_name: 'Test Client',
        interest: 'Test',
        negotiation_status: 'Test',
        is_active: true,
        status_color: 'green',
        last_updates: longText,
      };

      await result.current.addClient(newClient);

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          last_updates: longText,
        })
      );
    });
  });
});
