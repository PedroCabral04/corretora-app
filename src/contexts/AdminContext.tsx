import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isOwnerEmail } from '@/config/adminConfig';

export type AppRole = 'admin' | 'manager' | 'broker' | 'viewer';

export interface AdminManagedUser {
  id: string;
  email: string;
  name: string;
  role: AppRole | null;
  createdAt: string;
}

export interface AdminFeatureFlag {
  id: string;
  key: string;
  description?: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string | null;
}

interface AdminContextType {
  isOwner: boolean;
  users: AdminManagedUser[];
  featureFlags: AdminFeatureFlag[];
  isLoadingUsers: boolean;
  isLoadingFeatureFlags: boolean;
  refreshUsers: () => Promise<void>;
  refreshFeatureFlags: () => Promise<void>;
  upsertUserRole: (userId: string, role: AppRole) => Promise<{ error?: string }>;
  removeUserRole: (userId: string) => Promise<{ error?: string }>;
  createFeatureFlag: (input: { flagKey: string; description?: string }) => Promise<{ error?: string }>;
  toggleFeatureFlag: (flagId: string, enable: boolean) => Promise<{ error?: string }>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAdmin = (): AdminContextType => {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return ctx;
};

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider = ({ children }: AdminProviderProps) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminManagedUser[]>([]);
  const [featureFlags, setFeatureFlags] = useState<AdminFeatureFlag[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingFeatureFlags, setIsLoadingFeatureFlags] = useState(true);

  const isOwner = useMemo(() => isOwnerEmail(user?.email), [user?.email]);

  const mapRole = (role: string | null | undefined): AppRole | null => {
    if (!role) return null;
    if (role === 'admin' || role === 'manager' || role === 'broker' || role === 'viewer') {
      return role;
    }
    return null;
  };

  const fetchUsers = useCallback(async () => {
    if (!user || !isOwner) {
      setUsers([]);
      setIsLoadingUsers(false);
      return;
    }

    setIsLoadingUsers(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const mappedUsers: AdminManagedUser[] = await Promise.all(
        (profiles ?? []).map(async profile => {
          const { data: roleData, error: roleError } = await supabase.rpc('get_user_role', {
            _user_id: profile.user_id,
          });

          if (roleError) {
            console.warn('Erro ao obter role do usuário', profile.user_id, roleError.message);
          }

          return {
            id: profile.user_id,
            email: profile.email,
            name: profile.name,
            role: mapRole(roleData ?? null) ?? null,
            createdAt: profile.created_at,
          };
        })
      );

      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [user, isOwner]);

  const fetchFeatureFlags = useCallback(async () => {
    if (!user || !isOwner) {
      setFeatureFlags([]);
      setIsLoadingFeatureFlags(false);
      return;
    }

    setIsLoadingFeatureFlags(true);
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('id, flag_key, description, is_enabled, created_at, updated_at, updated_by')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedFlags: AdminFeatureFlag[] = (data ?? []).map(flag => ({
        id: flag.id,
        key: flag.flag_key,
        description: flag.description ?? undefined,
        isEnabled: flag.is_enabled,
        createdAt: flag.created_at,
        updatedAt: flag.updated_at,
        updatedBy: flag.updated_by ?? undefined,
      }));

      setFeatureFlags(mappedFlags);
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      setFeatureFlags([]);
    } finally {
      setIsLoadingFeatureFlags(false);
    }
  }, [user, isOwner]);

  useEffect(() => {
    if (!user) {
      setUsers([]);
      setFeatureFlags([]);
      setIsLoadingUsers(false);
      setIsLoadingFeatureFlags(false);
      return;
    }

    if (!isOwner) {
      setUsers([]);
      setFeatureFlags([]);
      setIsLoadingUsers(false);
      setIsLoadingFeatureFlags(false);
      return;
    }

    fetchUsers();
    fetchFeatureFlags();
  }, [user, isOwner, fetchUsers, fetchFeatureFlags]);

  const upsertUserRole = useCallback(async (userId: string, role: AppRole) => {
    if (!user || !isOwner) {
      return { error: 'Acesso não autorizado' };
    }

    const { error } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error updating user role:', error);
      return { error: error.message };
    }

    await fetchUsers();
    return {};
  }, [user, isOwner, fetchUsers]);

  const removeUserRole = useCallback(async (userId: string) => {
    if (!user || !isOwner) {
      return { error: 'Acesso não autorizado' };
    }

    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing user role:', error);
      return { error: error.message };
    }

    await fetchUsers();
    return {};
  }, [user, isOwner, fetchUsers]);

  const createFeatureFlag = useCallback(async ({ flagKey, description }: { flagKey: string; description?: string }) => {
    if (!user || !isOwner) {
      return { error: 'Acesso não autorizado' };
    }

    const payload = {
      flag_key: flagKey,
      description: description ?? null,
      updated_by: user.id,
    };

    const { data, error } = await supabase
      .from('feature_flags')
      .insert(payload)
      .select('id, flag_key, description, is_enabled, created_at, updated_at, updated_by')
      .single();

    if (error) {
      console.error('Error creating feature flag:', error);
      return { error: error.message };
    }

    setFeatureFlags(prev => ([
      {
        id: data.id,
        key: data.flag_key,
        description: data.description ?? undefined,
        isEnabled: data.is_enabled,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        updatedBy: data.updated_by ?? undefined,
      },
      ...prev,
    ]));

    return {};
  }, [user, isOwner]);

  const toggleFeatureFlag = useCallback(async (flagId: string, enable: boolean) => {
    if (!user || !isOwner) {
      return { error: 'Acesso não autorizado' };
    }

    const { data, error } = await supabase
      .from('feature_flags')
      .update({
        is_enabled: enable,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', flagId)
      .select('id, flag_key, description, is_enabled, created_at, updated_at, updated_by')
      .single();

    if (error) {
      console.error('Error updating feature flag:', error);
      return { error: error.message };
    }

    setFeatureFlags(prev => prev.map(flag => {
      if (flag.id !== flagId) return flag;
      return {
        id: data.id,
        key: data.flag_key,
        description: data.description ?? undefined,
        isEnabled: data.is_enabled,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        updatedBy: data.updated_by ?? undefined,
      };
    }));

    return {};
  }, [user, isOwner]);

  const value: AdminContextType = {
    isOwner,
    users,
    featureFlags,
    isLoadingUsers,
    isLoadingFeatureFlags,
    refreshUsers: fetchUsers,
    refreshFeatureFlags: fetchFeatureFlags,
    upsertUserRole,
    removeUserRole,
    createFeatureFlag,
    toggleFeatureFlag,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
