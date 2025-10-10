import { useState, useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { BrokerCard } from "@/components/BrokerCard";
import { MetricCard } from "@/components/MetricCard";
import { ChartCard } from "@/components/ChartCard";
import { FilterBar } from "@/components/FilterBar";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, TrendingUp, Home, DollarSign, Search, UserPlus, LayoutGrid, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBrokers } from '@/contexts/BrokersContext';
import { useSales } from '@/contexts/SalesContext';
import { useTasks } from '@/contexts/TasksContext';
import { BrokerCardSkeleton, MetricCardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useFilterAndSort, usePagination } from "@/hooks/useFilterAndSort";
import { maskPhone, maskCRECI, validateEmail, validatePhone, validateRequired, getErrorMessage } from "@/lib/masks";
const Index = () => {
  const navigate = useNavigate();
  const { brokers, isLoading, createBroker, updateBroker, deleteBroker } = useBrokers();
  const { sales } = useSales();
  const { tasks } = useTasks();
  const { toast } = useToast();
  
  // Filter and Sort
  const {
    filteredData: filteredBrokers,
    searchValue,
    setSearchValue,
    sortBy,
    setSortBy,
    clearFilters,
  } = useFilterAndSort({
    data: brokers,
    searchFields: ['name', 'email', 'creci'],
  });
  
  // Pagination
  const {
    paginatedData,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
  } = usePagination(filteredBrokers, 9);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBroker, setNewBroker] = useState({
    name: '',
    email: '',
    phone: '',
    creci: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editingBroker, setEditingBroker] = useState<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    creci?: string;
  } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [brokerToDelete, setBrokerToDelete] = useState<{ id: string; name: string } | null>(null);
  
  // Metrics
  const totalBrokers = brokers.length;
  const totalSales = brokers.reduce((sum, broker) => sum + broker.totalSales, 0);
  const totalListings = brokers.reduce((sum, broker) => sum + broker.totalListings, 0);
  const totalValue = brokers.reduce((sum, broker) => sum + broker.totalValue, 0);
  
  // Chart Data
  const salesByMonthData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthSales = sales.filter(sale => {
        const saleDate = new Date(sale.saleDate);
        return saleDate.getMonth() === index && saleDate.getFullYear() === currentYear;
      });
      
      return {
        name: month,
        value: monthSales.length,
        total: monthSales.reduce((sum, sale) => sum + (sale.saleValue || 0), 0),
      };
    });
  }, [sales]);
  
  const tasksByStatusData = useMemo(() => {
    const statusMap = {
      'TODO': 'A Fazer',
      'IN_PROGRESS': 'Em Andamento',
      'DONE': 'Concluídas',
    };
    
    return Object.entries(statusMap).map(([key, label]) => ({
      name: label,
      value: tasks.filter(task => task.status === key).length,
    }));
  }, [tasks]);
  
  const topBrokersData = useMemo(() => {
    return [...brokers]
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5)
      .map(broker => ({
        name: broker.name,
        value: broker.totalSales,
      }));
  }, [brokers]);
  const handleViewBrokerDetails = (brokerId: string) => {
    navigate(`/broker/${brokerId}`);
  };

  const validateBrokerForm = (broker: typeof newBroker): boolean => {
    const errors: Record<string, string> = {};

    if (!validateRequired(broker.name)) {
      errors.name = getErrorMessage('Nome', 'required');
    }

    if (broker.email && !validateEmail(broker.email)) {
      errors.email = getErrorMessage('Email', 'email');
    }

    if (broker.phone && !validatePhone(broker.phone)) {
      errors.phone = getErrorMessage('Telefone', 'phone');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskPhone(e.target.value);
    setNewBroker({ ...newBroker, phone: masked });
    if (formErrors.phone) {
      setFormErrors({ ...formErrors, phone: '' });
    }
  };

  const handleCreciChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCRECI(e.target.value);
    setNewBroker({ ...newBroker, creci: masked });
  };

  return <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie sua equipe de corretores
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2 bg-primary-600 text-primary-foreground hover:bg-primary-700 bg-pink-700 hover:bg-pink-600">
                  <Plus className="h-4 w-4" />
                  <span>Novo Corretor</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Corretor</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="b-name">Nome *</Label>
                    <Input 
                      id="b-name" 
                      value={newBroker.name} 
                      onChange={e => {
                        setNewBroker({ ...newBroker, name: e.target.value });
                        if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                      }}
                      className={formErrors.name ? 'border-destructive' : ''}
                    />
                    {formErrors.name && <p className="text-sm text-destructive mt-1">{formErrors.name}</p>}
                  </div>
                <div>
                  <Label htmlFor="b-email">Email</Label>
                  <Input 
                    id="b-email" 
                    type="email"
                    value={newBroker.email} 
                    onChange={e => {
                      setNewBroker({ ...newBroker, email: e.target.value });
                      if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                    }}
                    onBlur={e => {
                      if (e.target.value && !validateEmail(e.target.value)) {
                        setFormErrors({ ...formErrors, email: getErrorMessage('Email', 'email') });
                      }
                    }}
                    className={formErrors.email ? 'border-destructive' : ''}
                    placeholder="exemplo@email.com"
                  />
                  {formErrors.email && <p className="text-sm text-destructive mt-1">{formErrors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="b-phone">Telefone</Label>
                  <Input 
                    id="b-phone" 
                    value={newBroker.phone} 
                    onChange={handlePhoneChange}
                    className={formErrors.phone ? 'border-destructive' : ''}
                    placeholder="(99) 99999-9999"
                    maxLength={15}
                  />
                  {formErrors.phone && <p className="text-sm text-destructive mt-1">{formErrors.phone}</p>}
                </div>
                <div>
                  <Label htmlFor="b-creci">CRECI</Label>
                  <Input 
                    id="b-creci" 
                    value={newBroker.creci} 
                    onChange={handleCreciChange}
                    placeholder="12345-F"
                    maxLength={7}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={async () => {
                    if (!validateBrokerForm(newBroker)) {
                      toast({
                        title: 'Erro de validação',
                        description: 'Por favor, corrija os erros no formulário',
                        variant: 'destructive'
                      });
                      return;
                    }
                    try {
                      await createBroker(newBroker);
                      toast({
                        title: 'Sucesso',
                        description: 'Corretor criado com sucesso'
                      });
                      setNewBroker({
                        name: '',
                        email: '',
                        phone: '',
                        creci: ''
                      });
                      setFormErrors({});
                      setIsDialogOpen(false);
                    } catch (err) {
                      toast({
                        title: 'Erro',
                        description: err instanceof Error ? err.message : 'Erro ao criar corretor',
                        variant: 'destructive'
                      });
                    }
                  }} className="w-full">Criar Corretor</Button>
                  <Button variant="ghost" onClick={() => {
                    setIsDialogOpen(false);
                    setNewBroker({ name: '', email: '', phone: '', creci: '' });
                    setFormErrors({});
                  }} className="w-full">Cancelar</Button>
                </div>
                </div>
              </DialogContent>
            </Dialog>
            {/* Botão de Registrar - visível no cabeçalho */}
            
          </div>
          {/* Edit Broker Dialog */}
          <Dialog open={!!editingBroker} onOpenChange={open => {
          if (!open) setEditingBroker(null);
        }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Corretor</DialogTitle>
              </DialogHeader>
              {editingBroker && <div className="space-y-4">
                  <div>
                    <Label htmlFor="e-name">Nome</Label>
                    <Input id="e-name" value={editingBroker.name} onChange={e => setEditingBroker({
                  ...editingBroker,
                  name: e.target.value
                })} />
                  </div>
                  <div>
                    <Label htmlFor="e-email">Email</Label>
                    <Input id="e-email" value={editingBroker.email} onChange={e => setEditingBroker({
                  ...editingBroker,
                  email: e.target.value
                })} />
                  </div>
                  <div>
                    <Label htmlFor="e-phone">Telefone</Label>
                    <Input id="e-phone" value={editingBroker.phone} onChange={e => setEditingBroker({
                  ...editingBroker,
                  phone: e.target.value
                })} />
                  </div>
                  <div>
                    <Label htmlFor="e-creci">CRECI</Label>
                    <Input id="e-creci" value={editingBroker.creci} onChange={e => setEditingBroker({
                  ...editingBroker,
                  creci: e.target.value
                })} />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={async () => {
                  if (!editingBroker) return;
                  try {
                    await updateBroker(editingBroker.id, {
                      name: editingBroker.name,
                      email: editingBroker.email,
                      phone: editingBroker.phone,
                      creci: editingBroker.creci
                    });
                    toast({
                      title: 'Sucesso',
                      description: 'Corretor atualizado'
                    });
                    setEditingBroker(null);
                  } catch (err) {
                    toast({
                      title: 'Erro',
                      description: err instanceof Error ? err.message : 'Erro ao atualizar',
                      variant: 'destructive'
                    });
                  }
                }} className="w-full">Salvar</Button>
                    <Button variant="ghost" onClick={() => setEditingBroker(null)} className="w-full">Cancelar</Button>
                  </div>
                </div>}
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation */}
          <ConfirmDialog
            open={brokerToDelete !== null}
            onOpenChange={(open) => !open && setBrokerToDelete(null)}
            title="Excluir Corretor"
            description={`Tem certeza que deseja excluir ${brokerToDelete?.name}? Esta ação não pode ser desfeita.`}
            confirmLabel="Excluir"
            cancelLabel="Cancelar"
            onConfirm={async () => {
              if (!brokerToDelete) return;
              try {
                await deleteBroker(brokerToDelete.id);
                toast({
                  title: 'Corretor excluído com sucesso',
                  description: `${brokerToDelete.name} foi removido do sistema`
                });
                setBrokerToDelete(null);
              } catch (err) {
                toast({
                  title: 'Erro ao excluir',
                  description: 'Não foi possível excluir o corretor',
                  variant: 'destructive'
                });
              }
            }}
          />
        </div>

        {/* Métricas Gerais */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard title="Total de Corretores" value={totalBrokers} icon={Users} variant="info" />
          <MetricCard title="Vendas no Ano" value={totalSales} icon={TrendingUp} variant="success" />
          <MetricCard title="Captações Ativas" value={totalListings} icon={Home} variant="info" />
          <MetricCard title="Valor Total Vendido" value={new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 0
        }).format(totalValue)} icon={DollarSign} variant="success" />
        </div>
        )}

        {/* Tabs - Dashboard e Corretores */}
        <Tabs defaultValue="brokers" className="mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="brokers" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Corretores
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="brokers" className="space-y-6 mt-6">
            {/* Filtros */}
            <FilterBar
              searchPlaceholder="Buscar corretor por nome, email ou CRECI..."
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              sortOptions={[
                { label: 'Nome (A-Z)', value: 'name-asc' },
                { label: 'Nome (Z-A)', value: 'name-desc' },
                { label: 'Mais vendas', value: 'totalSales-desc' },
                { label: 'Menos vendas', value: 'totalSales-asc' },
              ]}
              selectedSort={sortBy}
              onSortChange={setSortBy}
              onClearFilters={clearFilters}
            />

            {/* Lista de Corretores */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <BrokerCardSkeleton />
                <BrokerCardSkeleton />
                <BrokerCardSkeleton />
                <BrokerCardSkeleton />
                <BrokerCardSkeleton />
                <BrokerCardSkeleton />
              </div>
            ) : filteredBrokers.length === 0 ? (
              brokers.length === 0 ? (
                <EmptyState
                  icon={UserPlus}
                  title="Nenhum corretor cadastrado"
                  description="Comece adicionando seu primeiro corretor ao sistema para gerenciar sua equipe e acompanhar suas vendas."
                  actionLabel="Adicionar Primeiro Corretor"
                  onAction={() => setIsDialogOpen(true)}
                />
              ) : (
                <EmptyState
                  icon={Search}
                  title="Nenhum corretor encontrado"
                  description={`Não encontramos corretores com os filtros aplicados. Tente ajustar sua busca.`}
                />
              )
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedData.map(broker => (
                    <BrokerCard 
                      key={broker.id} 
                      broker={broker} 
                      onViewDetails={handleViewBrokerDetails} 
                      onEdit={id => {
                        const b = brokers.find(x => x.id === id);
                        if (!b) return;
                        setEditingBroker({
                          id: b.id,
                          name: b.name,
                          email: b.email,
                          phone: b.phone,
                          creci: b.creci
                        });
                      }} 
                      onDelete={id => {
                        const broker = brokers.find(b => b.id === id);
                        if (broker) {
                          setBrokerToDelete({ id: broker.id, name: broker.name });
                        }
                      }} 
                    />
                  ))}
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                  />
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6 mt-6">
            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Vendas por Mês"
                type="line"
                data={salesByMonthData}
                dataKey="value"
                xAxisKey="name"
              />
              
              <ChartCard
                title="Top 5 Corretores"
                type="bar"
                data={topBrokersData}
                dataKey="value"
                xAxisKey="name"
              />
              
              <ChartCard
                title="Tarefas por Status"
                type="pie"
                data={tasksByStatusData}
                dataKey="value"
                colors={['#8b5cf6', '#3b82f6', '#10b981']}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Lista de Corretores */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <BrokerCardSkeleton />
            <BrokerCardSkeleton />
            <BrokerCardSkeleton />
            <BrokerCardSkeleton />
            <BrokerCardSkeleton />
            <BrokerCardSkeleton />
          </div>
        ) : filteredBrokers.length === 0 ? (
          brokers.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="Nenhum corretor cadastrado"
              description="Comece adicionando seu primeiro corretor ao sistema para gerenciar sua equipe e acompanhar suas vendas."
              actionLabel="Adicionar Primeiro Corretor"
              onAction={() => setIsDialogOpen(true)}
            />
          ) : null
        ) : null}
      </main>
    </div>;
};
export default Index;