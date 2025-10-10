import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, Mail, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type AppRole = 'admin' | 'manager' | 'broker' | 'viewer';

interface UserWithRole {
  id: string;
  email: string;
  name: string;
  role: AppRole | null;
  created_at: string;
}

const roleLabels = {
  admin: { label: 'Admin', variant: 'destructive' as const },
  manager: { label: 'Gerente', variant: 'default' as const },
  broker: { label: 'Corretor', variant: 'secondary' as const },
  viewer: { label: 'Visualizador', variant: 'outline' as const },
};

export default function Users() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Buscar todos os perfis
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Buscar roles de todos os usuários
      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roleData } = await supabase.rpc('get_user_role', {
            _user_id: profile.user_id
          });

          return {
            id: profile.user_id,
            email: profile.email,
            name: profile.name,
            role: roleData as AppRole | null,
            created_at: profile.created_at,
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Erro ao carregar usuários',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    try {
      // Remover role existente
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Adicionar nova role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Role atualizada com sucesso',
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: 'Erro ao atualizar role',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveRole = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Role removida com sucesso',
      });

      fetchUsers();
    } catch (error: any) {
      console.error('Error removing role:', error);
      toast({
        title: 'Erro ao remover role',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Gerenciamento de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground">Carregando...</p>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <Card key={user.id} className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{user.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        {user.role ? (
                          <Badge variant={roleLabels[user.role].variant}>
                            {roleLabels[user.role].label}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Sem role</Badge>
                        )}

                        <Select
                          value={user.role || ''}
                          onValueChange={(value) => handleRoleChange(user.id, value as AppRole)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Atribuir role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Gerente</SelectItem>
                            <SelectItem value="broker">Corretor</SelectItem>
                            <SelectItem value="viewer">Visualizador</SelectItem>
                          </SelectContent>
                        </Select>

                        {user.role && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveRole(user.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
