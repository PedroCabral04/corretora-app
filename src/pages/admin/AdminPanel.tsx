import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Shield, Mail, Flame } from "lucide-react";
import { useAdmin, AppRole } from "@/contexts/AdminContext";
import { useToast } from "@/hooks/use-toast";
import { OWNER_EMAILS } from "@/config/adminConfig";

const roleLabels: Record<AppRole, { label: string; variant: "destructive" | "default" | "secondary" | "outline" }> = {
  admin: { label: "Admin", variant: "destructive" },
  manager: { label: "Gerente", variant: "default" },
  broker: { label: "Corretor", variant: "secondary" },
  viewer: { label: "Visualizador", variant: "outline" },
};

const normalizeFlagKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

const AdminPanel = () => {
  const {
    isOwner,
    users,
    featureFlags,
    isLoadingUsers,
    isLoadingFeatureFlags,
    upsertUserRole,
    removeUserRole,
    createFeatureFlag,
    toggleFeatureFlag,
  } = useAdmin();
  const { toast } = useToast();

  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingFlagId, setPendingFlagId] = useState<string | null>(null);
  const [flagKey, setFlagKey] = useState("");
  const [flagDescription, setFlagDescription] = useState("");
  const [creatingFlag, setCreatingFlag] = useState(false);

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração Necessária</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Nenhum email autorizado para o painel administrativo foi configurado.
              </p>
              <p className="text-sm text-muted-foreground">
                Configure a variável de ambiente <code className="text-xs">VITE_OWNER_EMAIL</code> ou
                <code className="text-xs">VITE_OWNER_EMAILS</code> com o email que deve ter acesso. Também
                garanta que este email seja adicionado na tabela <code className="text-xs">admin_allowlist</code>
                no Supabase para liberar a manipulação das feature flags.
              </p>
              <Separator />
              <p className="text-xs text-muted-foreground">
                Emails atuais configurados no front-end: {OWNER_EMAILS.length > 0 ? OWNER_EMAILS.join(", ") : "nenhum"}.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleRoleChange = async (userId: string, role: AppRole) => {
    setPendingUserId(userId);
    const result = await upsertUserRole(userId, role);
    if (result.error) {
      toast({
        title: "Erro ao atualizar role",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Role atualizada",
        description: "Permissões do usuário atualizadas com sucesso.",
      });
    }
    setPendingUserId(null);
  };

  const handleRoleRemoval = async (userId: string) => {
    setPendingUserId(userId);
    const result = await removeUserRole(userId);
    if (result.error) {
      toast({
        title: "Erro ao remover role",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Role removida",
        description: "O usuário agora está sem permissões associadas.",
      });
    }
    setPendingUserId(null);
  };

  const handleToggleFlag = async (flagId: string, current: boolean) => {
    setPendingFlagId(flagId);
    const result = await toggleFeatureFlag(flagId, !current);
    if (result.error) {
      toast({
        title: "Erro ao atualizar flag",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: !current ? "Flag habilitada" : "Flag desativada",
        description: "O status desta feature foi atualizado.",
      });
    }
    setPendingFlagId(null);
  };

  const handleCreateFlag = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const preparedKey = normalizeFlagKey(flagKey);
    if (!preparedKey) {
      toast({
        title: "Chave inválida",
        description: "Informe uma chave com letras e números.",
        variant: "destructive",
      });
      return;
    }

    if (featureFlags.some((flag) => flag.key === preparedKey)) {
      toast({
        title: "Flag já existe",
        description: "Escolha uma chave única para a nova feature flag.",
        variant: "destructive",
      });
      return;
    }

    setCreatingFlag(true);
    const result = await createFeatureFlag({ flagKey: preparedKey, description: flagDescription.trim() || undefined });
    if (result.error) {
      toast({
        title: "Erro ao criar flag",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Flag criada",
        description: "A nova feature flag está ativa por padrão.",
      });
      setFlagKey("");
      setFlagDescription("");
    }
    setCreatingFlag(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Painel Administrativo</h1>
            <p className="text-muted-foreground">
              Gerencie usuários autorizados e controle o status das feature flags da plataforma.
            </p>
          </div>

          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid grid-cols-2 sm:w-[400px]">
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="feature-flags">Feature Flags</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Gerenciamento de Usuários
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingUsers ? (
                    <p className="text-muted-foreground text-sm">Carregando usuários...</p>
                  ) : users.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Nenhum usuário encontrado.</p>
                  ) : (
                    <div className="space-y-4">
                      {users.map((user) => (
                        <Card key={user.id} className="p-4">
                          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{user.name}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                              <p className="text-xs text-muted-foreground">
                                Criado em {new Date(user.createdAt).toLocaleDateString()}
                              </p>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                              {user.role ? (
                                <Badge variant={roleLabels[user.role].variant}>{roleLabels[user.role].label}</Badge>
                              ) : (
                                <Badge variant="outline">Sem role</Badge>
                              )}

                              <Select
                                value={user.role ?? ""}
                                onValueChange={(value) => handleRoleChange(user.id, value as AppRole)}
                                disabled={pendingUserId === user.id}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Definir role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="manager">Gerente</SelectItem>
                                  <SelectItem value="broker">Corretor</SelectItem>
                                  <SelectItem value="viewer">Visualizador</SelectItem>
                                </SelectContent>
                              </Select>

                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={!user.role || pendingUserId === user.id}
                                onClick={() => handleRoleRemoval(user.id)}
                              >
                                Remover role
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="feature-flags" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="w-5 h-5" />
                    Feature Flags
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleCreateFlag} className="grid gap-4 md:grid-cols-[2fr,3fr,auto] md:items-end">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="flagKey">Chave</Label>
                      <Input
                        id="flagKey"
                        placeholder="ex: beta-dashboard"
                        value={flagKey}
                        onChange={(event) => setFlagKey(event.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2 md:col-span-1">
                      <Label htmlFor="flagDescription">Descrição</Label>
                      <Textarea
                        id="flagDescription"
                        placeholder="Contexto do recurso controlado por esta flag"
                        value={flagDescription}
                        onChange={(event) => setFlagDescription(event.target.value)}
                        rows={2}
                      />
                    </div>
                    <Button type="submit" disabled={creatingFlag}>
                      {creatingFlag ? "Criando..." : "Criar flag"}
                    </Button>
                  </form>

                  <Separator />

                  {isLoadingFeatureFlags ? (
                    <p className="text-muted-foreground text-sm">Carregando feature flags...</p>
                  ) : featureFlags.length === 0 ? (
                    <p className="text-muted-foreground text-sm">Nenhuma feature flag cadastrada ainda.</p>
                  ) : (
                    <div className="space-y-4">
                      {featureFlags.map((flag) => (
                        <Card key={flag.id} className="p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-1">
                              <h3 className="font-semibold">{flag.key}</h3>
                              {flag.description && (
                                <p className="text-sm text-muted-foreground">{flag.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Atualizado em {new Date(flag.updatedAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <Switch
                                checked={flag.isEnabled}
                                onCheckedChange={() => handleToggleFlag(flag.id, flag.isEnabled)}
                                disabled={pendingFlagId === flag.id}
                              />
                              <span className="text-sm font-medium">
                                {flag.isEnabled ? "Ativa" : "Desativada"}
                              </span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
