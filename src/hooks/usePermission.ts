import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'admin' | 'manager' | 'broker' | 'viewer';

type Permission = 
  | 'view_all_brokers'
  | 'edit_all_brokers'
  | 'delete_brokers'
  | 'view_all_clients'
  | 'edit_all_clients'
  | 'delete_clients'
  | 'view_all_sales'
  | 'edit_all_sales'
  | 'delete_sales'
  | 'manage_users';

const rolePermissions: Record<AppRole, Permission[]> = {
  admin: [
    'view_all_brokers',
    'edit_all_brokers',
    'delete_brokers',
    'view_all_clients',
    'edit_all_clients',
    'delete_clients',
    'view_all_sales',
    'edit_all_sales',
    'delete_sales',
    'manage_users',
  ],
  manager: [
    'view_all_brokers',
    'view_all_clients',
    'edit_all_clients',
    'delete_clients',
    'view_all_sales',
  ],
  broker: [],
  viewer: [],
};

export const usePermission = () => {
  const { user } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!user?.role) return false;
    return rolePermissions[user.role].includes(permission);
  };

  const hasRole = (role: AppRole): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: AppRole[]): boolean => {
    if (!user?.role) return false;
    return roles.includes(user.role);
  };

  return {
    hasPermission,
    hasRole,
    hasAnyRole,
    role: user?.role,
  };
};
