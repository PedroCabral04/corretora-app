import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermission } from './usePermission';
import type { AuthUser } from '@/contexts/AuthContext';

// Mock do useAuth hook
const mockUseAuth = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('usePermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hasPermission', () => {
    describe('admin role', () => {
      beforeEach(() => {
        const mockUser: AuthUser = {
          id: '1',
          email: 'admin@test.com',
          name: 'Admin User',
          role: 'admin',
        };
        mockUseAuth.mockReturnValue({ user: mockUser });
      });

      it('should have all view permissions', () => {
        const { result } = renderHook(() => usePermission());

        expect(result.current.hasPermission('view_all_brokers')).toBe(true);
        expect(result.current.hasPermission('view_all_clients')).toBe(true);
        expect(result.current.hasPermission('view_all_sales')).toBe(true);
      });

      it('should have all edit permissions', () => {
        const { result } = renderHook(() => usePermission());

        expect(result.current.hasPermission('edit_all_brokers')).toBe(true);
        expect(result.current.hasPermission('edit_all_clients')).toBe(true);
        expect(result.current.hasPermission('edit_all_sales')).toBe(true);
      });

      it('should have all delete permissions', () => {
        const { result } = renderHook(() => usePermission());

        expect(result.current.hasPermission('delete_brokers')).toBe(true);
        expect(result.current.hasPermission('delete_clients')).toBe(true);
        expect(result.current.hasPermission('delete_sales')).toBe(true);
      });

      it('should have manage_users permission', () => {
        const { result } = renderHook(() => usePermission());

        expect(result.current.hasPermission('manage_users')).toBe(true);
      });
    });

    describe('manager role', () => {
      beforeEach(() => {
        const mockUser: AuthUser = {
          id: '2',
          email: 'manager@test.com',
          name: 'Manager User',
          role: 'manager',
        };
        mockUseAuth.mockReturnValue({ user: mockUser });
      });

      it('should have limited view permissions', () => {
        const { result } = renderHook(() => usePermission());

        expect(result.current.hasPermission('view_all_brokers')).toBe(true);
        expect(result.current.hasPermission('view_all_clients')).toBe(true);
        expect(result.current.hasPermission('view_all_sales')).toBe(true);
      });

      it('should have limited edit permissions', () => {
        const { result } = renderHook(() => usePermission());

        expect(result.current.hasPermission('edit_all_clients')).toBe(true);
        expect(result.current.hasPermission('edit_all_brokers')).toBe(false);
        expect(result.current.hasPermission('edit_all_sales')).toBe(false);
      });

      it('should have limited delete permissions', () => {
        const { result } = renderHook(() => usePermission());

        expect(result.current.hasPermission('delete_clients')).toBe(true);
        expect(result.current.hasPermission('delete_brokers')).toBe(false);
        expect(result.current.hasPermission('delete_sales')).toBe(false);
      });

      it('should not have manage_users permission', () => {
        const { result } = renderHook(() => usePermission());

        expect(result.current.hasPermission('manage_users')).toBe(false);
      });
    });

    describe('broker role', () => {
      beforeEach(() => {
        const mockUser: AuthUser = {
          id: '3',
          email: 'broker@test.com',
          name: 'Broker User',
          role: 'broker',
        };
        mockUseAuth.mockReturnValue({ user: mockUser });
      });

      it('should not have any special permissions', () => {
        const { result } = renderHook(() => usePermission());

        expect(result.current.hasPermission('view_all_brokers')).toBe(false);
        expect(result.current.hasPermission('edit_all_brokers')).toBe(false);
        expect(result.current.hasPermission('delete_brokers')).toBe(false);
        expect(result.current.hasPermission('view_all_clients')).toBe(false);
        expect(result.current.hasPermission('edit_all_clients')).toBe(false);
        expect(result.current.hasPermission('delete_clients')).toBe(false);
        expect(result.current.hasPermission('view_all_sales')).toBe(false);
        expect(result.current.hasPermission('edit_all_sales')).toBe(false);
        expect(result.current.hasPermission('delete_sales')).toBe(false);
        expect(result.current.hasPermission('manage_users')).toBe(false);
      });
    });

    describe('viewer role', () => {
      beforeEach(() => {
        const mockUser: AuthUser = {
          id: '4',
          email: 'viewer@test.com',
          name: 'Viewer User',
          role: 'viewer',
        };
        mockUseAuth.mockReturnValue({ user: mockUser });
      });

      it('should not have any special permissions', () => {
        const { result } = renderHook(() => usePermission());

        expect(result.current.hasPermission('view_all_brokers')).toBe(false);
        expect(result.current.hasPermission('edit_all_brokers')).toBe(false);
        expect(result.current.hasPermission('delete_brokers')).toBe(false);
        expect(result.current.hasPermission('view_all_clients')).toBe(false);
        expect(result.current.hasPermission('edit_all_clients')).toBe(false);
        expect(result.current.hasPermission('delete_clients')).toBe(false);
        expect(result.current.hasPermission('view_all_sales')).toBe(false);
        expect(result.current.hasPermission('edit_all_sales')).toBe(false);
        expect(result.current.hasPermission('delete_sales')).toBe(false);
        expect(result.current.hasPermission('manage_users')).toBe(false);
      });
    });

    describe('no user authenticated', () => {
      it('should deny all permissions when user is null', () => {
        mockUseAuth.mockReturnValue({ user: null });
        const { result } = renderHook(() => usePermission());

        expect(result.current.hasPermission('view_all_brokers')).toBe(false);
        expect(result.current.hasPermission('edit_all_brokers')).toBe(false);
        expect(result.current.hasPermission('delete_brokers')).toBe(false);
        expect(result.current.hasPermission('manage_users')).toBe(false);
      });

      it('should deny all permissions when user has no role', () => {
        const mockUser: AuthUser = {
          id: '5',
          email: 'norole@test.com',
          name: 'No Role User',
          role: null,
        };
        mockUseAuth.mockReturnValue({ user: mockUser });
        const { result } = renderHook(() => usePermission());

        expect(result.current.hasPermission('view_all_brokers')).toBe(false);
        expect(result.current.hasPermission('manage_users')).toBe(false);
      });
    });
  });

  describe('hasRole', () => {
    it('should return true when user has the specified admin role', () => {
      const mockUser: AuthUser = {
        id: '1',
        email: 'admin@test.com',
        name: 'Admin User',
        role: 'admin',
      };
      mockUseAuth.mockReturnValue({ user: mockUser });
      const { result } = renderHook(() => usePermission());

      expect(result.current.hasRole('admin')).toBe(true);
      expect(result.current.hasRole('manager')).toBe(false);
      expect(result.current.hasRole('broker')).toBe(false);
      expect(result.current.hasRole('viewer')).toBe(false);
    });

    it('should return true when user has the specified manager role', () => {
      const mockUser: AuthUser = {
        id: '2',
        email: 'manager@test.com',
        name: 'Manager User',
        role: 'manager',
      };
      mockUseAuth.mockReturnValue({ user: mockUser });
      const { result } = renderHook(() => usePermission());

      expect(result.current.hasRole('admin')).toBe(false);
      expect(result.current.hasRole('manager')).toBe(true);
      expect(result.current.hasRole('broker')).toBe(false);
      expect(result.current.hasRole('viewer')).toBe(false);
    });

    it('should return false when user is null', () => {
      mockUseAuth.mockReturnValue({ user: null });
      const { result } = renderHook(() => usePermission());

      expect(result.current.hasRole('admin')).toBe(false);
      expect(result.current.hasRole('manager')).toBe(false);
      expect(result.current.hasRole('broker')).toBe(false);
      expect(result.current.hasRole('viewer')).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true when user has one of the specified roles (admin)', () => {
      const mockUser: AuthUser = {
        id: '1',
        email: 'admin@test.com',
        name: 'Admin User',
        role: 'admin',
      };
      mockUseAuth.mockReturnValue({ user: mockUser });
      const { result } = renderHook(() => usePermission());

      expect(result.current.hasAnyRole(['admin', 'manager'])).toBe(true);
      expect(result.current.hasAnyRole(['admin'])).toBe(true);
      expect(result.current.hasAnyRole(['broker', 'viewer'])).toBe(false);
    });

    it('should return false when user is null', () => {
      mockUseAuth.mockReturnValue({ user: null });
      const { result } = renderHook(() => usePermission());

      expect(result.current.hasAnyRole(['admin', 'manager'])).toBe(false);
    });

    it('should return false when empty roles array is provided', () => {
      const mockUser: AuthUser = {
        id: '1',
        email: 'admin@test.com',
        name: 'Admin User',
        role: 'admin',
      };
      mockUseAuth.mockReturnValue({ user: mockUser });
      const { result } = renderHook(() => usePermission());

      expect(result.current.hasAnyRole([])).toBe(false);
    });
  });

  describe('role property', () => {
    it('should return the current user role', () => {
      const mockUser: AuthUser = {
        id: '1',
        email: 'admin@test.com',
        name: 'Admin User',
        role: 'admin',
      };
      mockUseAuth.mockReturnValue({ user: mockUser });
      const { result } = renderHook(() => usePermission());

      expect(result.current.role).toBe('admin');
    });

    it('should return undefined when user is null', () => {
      mockUseAuth.mockReturnValue({ user: null });
      const { result } = renderHook(() => usePermission());

      expect(result.current.role).toBeUndefined();
    });
  });
});
