import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'broker' | 'viewer' | null;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (name: string, email: string, password: string, role?: 'manager' | 'broker') => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // central handler to populate user from session
    const handleSession = async (session: Session | null) => {
      setSession(session);
      if (session?.user) {
        setTimeout(async () => {
          try {
            const [profileResult, roleResult] = await Promise.all([
              supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single(),
              supabase.rpc('get_user_role', { _user_id: session.user.id })
            ]);

            const profile = profileResult.data;
            const error = profileResult.error;

            if (error) {
              console.warn('Error fetching profile', error.message);
              setUser({ 
                id: session.user.id, 
                email: session.user.email ?? '', 
                name: '', 
                role: roleResult.data || null 
              });
            } else if (profile) {
              setUser({ 
                id: profile.user_id, 
                email: profile.email, 
                name: profile.name, 
                role: roleResult.data || null 
              });
            }
          } catch (err) {
            console.warn('Error in handleSession', err);
            setUser({ 
              id: session.user.id, 
              email: session.user.email ?? '', 
              name: '', 
              role: null 
            });
          }
        }, 0);
      } else {
        setUser(null);
      }

      setIsLoading(false);
    };

    // Set up auth state listener
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      handleSession(session ?? null);
    });

    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleSession(session);
      } else {
        setIsLoading(false);
      }
    });

    return () => data?.subscription?.unsubscribe?.();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return { error: error.message };
      }

      // Make sure we have the active session from the auth client
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (session) {
        setSession(session);
        // fetch profile and role and set user (fallback to session user if no profile)
        const [profileResult, roleResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single(),
          supabase.rpc('get_user_role', { _user_id: session.user.id })
        ]);

        const profile = profileResult.data;

        if (profile) {
          setUser({ 
            id: profile.user_id, 
            email: profile.email, 
            name: profile.name, 
            role: roleResult.data || null 
          });
        } else {
          setUser({ 
            id: session.user.id, 
            email: session.user.email ?? '', 
            name: (session.user.user_metadata as any)?.name ?? '', 
            role: roleResult.data || null 
          });
        }
      }

      return {};
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: 'manager' | 'broker' = 'broker') => {
    setIsLoading(true);
    try {
      // Create auth user - the database trigger will automatically create the profile
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { name }
        }
      });

      if (signUpError) {
        return { error: signUpError.message };
      }

      if (!data.user) {
        return { error: 'Erro ao criar usuário' };
      }

      // Inserir role na tabela user_roles
      // Removemos o .select() pois pode causar erro de RLS
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: data.user.id,
          role: role
        });

      if (roleError) {
        console.error('❌ Erro ao definir role:', roleError);
        console.error('❌ Detalhes completos:', JSON.stringify(roleError, null, 2));
        console.error('❌ Tentando inserir:', { user_id: data.user.id, role: role });
        
        // Retornar erro informativo para o usuário
        return { 
          error: `Usuário criado mas falhou ao definir função: ${roleError.message}. 
                  Isso pode ser um problema de permissão no banco de dados. 
                  Entre em contato com o administrador.` 
        };
      }
      
      console.log('✅ Role definida com sucesso!', { user_id: data.user.id, role: role });

      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Try to get the active session now (signUp may not return session immediately)
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (session) {
        setSession(session);
        const [profileResult, roleResult] = await Promise.all([
          supabase.from('profiles').select('*').eq('user_id', session.user.id).single(),
          supabase.rpc('get_user_role', { _user_id: session.user.id })
        ]);

        const profile = profileResult.data;
        const userRole = roleResult.data || role;

        if (profile) {
          setUser({ 
            id: profile.user_id, 
            email: profile.email, 
            name: profile.name, 
            role: userRole
          });
        } else {
          setUser({ 
            id: session.user.id, 
            email: session.user.email ?? '', 
            name: session.user.user_metadata?.name as string ?? '', 
            role: userRole
          });
        }
      }

      return {};
    } catch (err) {
      const error = err as Error;
      return { error: error?.message ?? 'Erro desconhecido ao registrar' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};