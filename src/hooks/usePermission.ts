import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'admin' | 'manager' | 'broker' | 'viewer';

type Permission = 
  // Permissões globais (admin/manager)
  | 'view_all_brokers'
  | 'edit_all_brokers'
  | 'delete_brokers'
  | 'view_all_clients'
  | 'edit_all_clients'
  | 'delete_clients'
  | 'view_all_sales'
  | 'edit_all_sales'
  | 'delete_sales'
  | 'manage_users'
  // Permissões pessoais (broker)
  | 'view_own_clients'
  | 'create_own_clients'
  | 'edit_own_clients'
  | 'delete_own_clients'
  | 'view_own_sales'
  | 'create_own_sales'
  | 'edit_own_sales'
  | 'delete_own_sales'
  | 'view_own_listings'
  | 'create_own_listings'
  | 'edit_own_listings'
  | 'delete_own_listings'
  | 'view_own_tasks'
  | 'create_own_tasks'
  | 'edit_own_tasks'
  | 'delete_own_tasks'
  | 'view_own_meetings'
  | 'create_own_meetings'
  | 'edit_own_meetings'
  | 'delete_own_meetings'
  | 'view_own_goals'
  | 'create_own_goals'
  | 'edit_own_goals'
  | 'delete_own_goals'
  | 'view_own_expenses'
  | 'create_own_expenses'
  | 'edit_own_expenses'
  | 'delete_own_expenses';

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
  broker: [
    // Clientes
    'view_own_clients',
    'create_own_clients',
    'edit_own_clients',
    'delete_own_clients',
    // Vendas
    'view_own_sales',
    'create_own_sales',
    'edit_own_sales',
    'delete_own_sales',
    // Listagens/Imóveis
    'view_own_listings',
    'create_own_listings',
    'edit_own_listings',
    'delete_own_listings',
    // Tarefas
    'view_own_tasks',
    'create_own_tasks',
    'edit_own_tasks',
    'delete_own_tasks',
    // Reuniões
    'view_own_meetings',
    'create_own_meetings',
    'edit_own_meetings',
    'delete_own_meetings',
    // Metas
    'view_own_goals',
    'create_own_goals',
    'edit_own_goals',
    'delete_own_goals',
    // Despesas
    'view_own_expenses',
    'create_own_expenses',
    'edit_own_expenses',
    'delete_own_expenses',
  ],
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
