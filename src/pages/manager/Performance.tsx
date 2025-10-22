import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerformanceCard } from "@/components/performance/PerformanceCard";
import { MetricsSummary } from "@/components/performance/MetricsSummary";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { usePerformance } from "@/contexts/PerformanceContext";
import { useBrokers } from "@/contexts/BrokersContext";
import { useAuth } from "@/contexts/AuthContext";
import { PerformanceChallenge, ChallengeStatus } from "@/contexts/PerformanceContext";
import { ChallengeForm } from "@/components/performance/ChallengeForm";
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  TrendingUp,
  Users,
  Target,
  Award,
  Calendar
} from "lucide-react";
import { toast } from "sonner";

export default function Performance() {
  const { 
    challenges, 
    isLoading, 
    createChallenge, 
    updateChallenge, 
    deleteChallenge,
    exportChallengeReport,
    refreshChallenges 
  } = usePerformance();
  
  const { brokers, getBrokerById } = useBrokers();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ChallengeStatus | 'all'>('all');
  const [brokerFilter, setBrokerFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created' | 'endDate' | 'progress'>('created');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<PerformanceChallenge | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Estatísticas
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    expired: 0
  });

  // Calcular estatísticas
  useEffect(() => {
    setStats({
      total: challenges.length,
      active: challenges.filter(c => c.status === 'active').length,
      completed: challenges.filter(c => c.status === 'completed').length,
      expired: challenges.filter(c => c.status === 'expired').length
    });
  }, [challenges]);

  // Filtrar desafios
  const filteredChallenges = challenges
    .filter(challenge => {
      // Filtro de busca
      const matchesSearch = searchTerm === '' || 
        challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challenge.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro de status
      const matchesStatus = statusFilter === 'all' || challenge.status === statusFilter;
      
      // Filtro de corretor
      const matchesBroker = brokerFilter === 'all' || challenge.brokerId === brokerFilter;
      
      return matchesSearch && matchesStatus && matchesBroker;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'endDate':
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        case 'progress':
          return (b.totalProgress || 0) - (a.totalProgress || 0);
        default:
          return 0;
      }
    });

  // Criar desafio
  const handleCreateChallenge = async (data: any) => {
    try {
      await createChallenge(data);
      setIsCreateDialogOpen(false);
      toast.success('Desafio criado com sucesso!');
      refreshChallenges();
    } catch (error) {
      toast.error('Erro ao criar desafio');
      console.error(error);
    }
  };

  // Editar desafio
  const handleEditChallenge = async (data: any) => {
    if (!editingChallenge) return;
    
    try {
      await updateChallenge(editingChallenge.id, data);
      setIsDialogOpen(false);
      setEditingChallenge(null);
      toast.success('Desafio atualizado com sucesso!');
      refreshChallenges();
    } catch (error) {
      toast.error('Erro ao atualizar desafio');
      console.error(error);
    }
  };

  // Excluir desafio
  const handleDeleteChallenge = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este desafio?')) return;
    
    try {
      await deleteChallenge(id);
      toast.success('Desafio excluído com sucesso!');
      refreshChallenges();
    } catch (error) {
      toast.error('Erro ao excluir desafio');
      console.error(error);
    }
  };

  // Exportar relatório
  const handleExportReport = async (challengeId: string) => {
    try {
      const blob = await exportChallengeReport(challengeId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-desafio-${challengeId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar relatório');
      console.error(error);
    }
  };

  // Obter nome do corretor
  const getBrokerName = (brokerId: string) => {
    const broker = getBrokerById(brokerId);
    return broker?.name || 'Corretor não encontrado';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando desafios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Desempenho da Equipe</h1>
          <p className="text-muted-foreground">
            Acompanhe e gerencie os desafios de desempenho dos corretores
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Desafio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <ChallengeForm
              brokers={brokers}
              onSubmit={handleCreateChallenge}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Concluídos</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <Award className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expirados</p>
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              </div>
              <Calendar className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar desafios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
                <SelectItem value="expired">Expirados</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={brokerFilter} onValueChange={setBrokerFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Corretor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {brokers.map(broker => (
                  <SelectItem key={broker.id} value={broker.id}>
                    {broker.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Data de criação</SelectItem>
                <SelectItem value="endDate">Data de término</SelectItem>
                <SelectItem value="progress">Progresso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de desafios */}
      <Tabs defaultValue="grid" className="w-full">
        <TabsList>
          <TabsTrigger value="grid">Grade</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grid">
          {filteredChallenges.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum desafio encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' || brokerFilter !== 'all'
                    ? 'Tente ajustar os filtros para encontrar desafios.'
                    : 'Comece criando um novo desafio para sua equipe.'}
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Desafio
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredChallenges.map(challenge => (
                <PerformanceCard
                  key={challenge.id}
                  challenge={challenge}
                  brokerName={getBrokerName(challenge.brokerId)}
                  showDetails={true}
                  onViewDetails={() => handleExportReport(challenge.id)}
                  onEdit={() => {
                    setEditingChallenge(challenge);
                    setIsDialogOpen(true);
                  }}
                  onDelete={() => handleDeleteChallenge(challenge.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="list">
          {filteredChallenges.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum desafio encontrado</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' || brokerFilter !== 'all'
                    ? 'Tente ajustar os filtros para encontrar desafios.'
                    : 'Comece criando um novo desafio para sua equipe.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredChallenges.map(challenge => (
                <PerformanceCard
                  key={challenge.id}
                  challenge={challenge}
                  brokerName={getBrokerName(challenge.brokerId)}
                  variant="compact"
                  onViewDetails={() => handleExportReport(challenge.id)}
                  onEdit={() => {
                    setEditingChallenge(challenge);
                    setIsDialogOpen(true);
                  }}
                  onDelete={() => handleDeleteChallenge(challenge.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Desafio</DialogTitle>
          </DialogHeader>
          {editingChallenge && (
            <ChallengeForm
              challenge={{
                id: editingChallenge.id,
                brokerId: editingChallenge.brokerId,
                title: editingChallenge.title,
                description: editingChallenge.description,
                startDate: editingChallenge.startDate,
                endDate: editingChallenge.endDate,
                metrics: editingChallenge.metrics
              }}
              brokers={brokers}
              onSubmit={handleEditChallenge}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingChallenge(null);
              }}
              isLoading={isLoading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}