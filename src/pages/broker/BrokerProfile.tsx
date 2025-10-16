import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { MetricCard } from "@/components/MetricCard";
import { ListingColumn } from "@/components/ListingColumn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { useBrokers } from '@/contexts/BrokersContext';
import { useClients } from '@/contexts/ClientsContext';
import { useListings, DetailedListingStatus } from '@/contexts/ListingsContext';
import { useSales } from '@/contexts/SalesContext';
import { useMeetings } from '@/contexts/MeetingsContext';
import { useExpenses } from '@/contexts/ExpensesContext';
import {
  TrendingUp,
  Home,
  DollarSign,
  Plus,
  Trash2,
  Edit
} from "lucide-react";

const BrokerProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const { brokers, isLoading: brokersLoading, createBroker, refreshBrokers } = useBrokers();
  const { clients, addClient, updateClient, deleteClient, loading: clientsLoading } = useClients();
  const { 
    listings, 
    createListing, 
    updateListing, 
    deleteListing, 
    getListingsByBrokerId,
    getAggregateQuantity,
    updateAggregateQuantity,
    getDetailedListingsByType,
    getStatusAggregateQuantity,
    updateStatusAggregateQuantity
  } = useListings();
  const { sales, createSale, updateSale, deleteSale, getSalesByBrokerId } = useSales();
  const { meetings, createMeeting, updateMeeting, completeMeeting, deleteMeeting, getMeetingsByBrokerId } = useMeetings();
  const { expenses, createExpense, updateExpense, deleteExpense, getExpensesByBrokerId } = useExpenses();

  // Encontrar o registro de broker correspondente ao usuário logado
  const userBroker = brokers.find(broker => 
    broker.email?.toLowerCase() === user?.email.toLowerCase()
  );

  const brokerId = userBroker?.id;

  const [brokerData, setBrokerData] = useState(() => ({
    id: brokerId,
    name: user?.name ?? "",
    creci: userBroker?.creci ?? "",
    email: user?.email ?? "",
    phone: userBroker?.phone ?? "",
    totalSales: userBroker?.totalSales ?? 0,
    totalListings: userBroker?.totalListings ?? 0,
    monthlyExpenses: userBroker?.monthlyExpenses ?? 0,
    totalValue: userBroker?.totalValue ?? 0,
    sales: [],
    listings: [],
    meetings: [],
    expenses: []
  }));

  // Filter clients for this broker
  const brokerClients = clients.filter(client => client.broker_id === brokerId);

  // Carrega os dados dos contextos quando o brokerId ou os dados mudam
  useEffect(() => {
    if (!brokerId) return;

    const brokerListings = getListingsByBrokerId(brokerId);
    const brokerSales = getSalesByBrokerId(brokerId);
    const brokerMeetings = getMeetingsByBrokerId(brokerId);
    const brokerExpenses = getExpensesByBrokerId(brokerId);

    // Atualiza o estado com os dados reais do banco
    setBrokerData(prev => ({
      ...prev,
      listings: brokerListings.map(l => ({
        id: l.id,
        propertyType: l.propertyType,
        quantity: l.quantity,
        status: l.status,
        date: l.listingDate,
        address: l.propertyAddress
      })),
      sales: brokerSales.map(s => ({
        id: s.id,
        description: s.propertyAddress,
        value: s.saleValue,
        date: s.saleDate
      })),
      meetings: brokerMeetings.map(m => ({
        id: m.id,
        title: m.meetingType,
        content: m.notes || '',
        date: m.meetingDate,
        status: m.status,
        summary: m.summary,
        clientName: m.clientName
      })),
      expenses: brokerExpenses.map(e => ({
        id: e.id,
        description: e.description,
        cost: e.amount,
        date: e.expenseDate
      })),
      totalSales: brokerSales.length,
      totalListings: brokerListings.filter(l => l.status === 'Ativo').length,
      totalValue: brokerSales.reduce((sum, s) => sum + s.saleValue, 0),
      monthlyExpenses: brokerExpenses.reduce((sum, e) => sum + e.amount, 0)
    }));
  }, [brokerId, listings, sales, meetings, expenses, getListingsByBrokerId, getSalesByBrokerId, getMeetingsByBrokerId, getExpensesByBrokerId]);

  // Criar broker automaticamente se não existir
  useEffect(() => {
    const createBrokerProfile = async () => {
      if (!brokersLoading && !userBroker && user && user.role === 'broker') {
        try {
          console.log('🔄 Criando perfil de corretor para:', user.email);
          
          // Criar o registro de broker automaticamente
          await createBroker({
            name: user.name,
            email: user.email,
            phone: '',
            creci: ''
          });

          console.log('✅ Perfil criado, atualizando lista...');

          // Forçar refresh dos brokers
          await refreshBrokers();

          toast({
            title: 'Perfil criado',
            description: 'Seu perfil de corretor foi criado com sucesso!',
          });
        } catch (error) {
          console.error('❌ Erro ao criar perfil de corretor:', error);
          toast({
            title: 'Erro',
            description: 'Não foi possível criar seu perfil. Entre em contato com o administrador.',
            variant: 'destructive'
          });
          navigate('/', { replace: true });
        }
      }
    };

    createBrokerProfile();
  }, [brokersLoading, userBroker, user, createBroker, refreshBrokers, navigate, toast]);

  // Modal states
  const [salesModalOpen, setSalesModalOpen] = useState(false);
  const [listingsModalOpen, setListingsModalOpen] = useState(false);
  const [meetingsModalOpen, setMeetingsModalOpen] = useState(false);
  const [completeMeetingModalOpen, setCompleteMeetingModalOpen] = useState(false);
  const [expensesModalOpen, setExpensesModalOpen] = useState(false);
  const [clientsModalOpen, setClientsModalOpen] = useState(false);
  const [selectedPropertyType, setSelectedPropertyType] = useState<'Apartamento' | 'Casa' | 'Sobrado' | 'Lote' | 'Chácara' | null>(null);

  // Form states
  const [newSale, setNewSale] = useState({ propertyAddress: "", clientName: "", saleValue: "", commission: "", date: "" });
  const [newListing, setNewListing] = useState({ 
    propertyType: "Apartamento", 
    quantity: "1", 
    status: "Ativo", 
    date: new Date().toISOString().split('T')[0], 
    propertyAddress: "", 
    propertyValue: "" 
  });
  const [newMeeting, setNewMeeting] = useState({ clientName: "", meetingType: "", notes: "", date: "" });
  const [meetingSummary, setMeetingSummary] = useState("");
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [newExpense, setNewExpense] = useState({ description: "", amount: "", category: "", date: "" });
  const [clientForm, setClientForm] = useState({
    client_name: "",
    interest: "",
    negotiation_status: "",
    is_active: true,
    status_color: "green",
    last_updates: "",
  });
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  const addSale = async () => {
    if (!newSale.propertyAddress || !newSale.clientName || !newSale.saleValue || !newSale.commission || !newSale.date) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    if (!brokerId) {
      toast({ title: "Erro", description: "ID do corretor não encontrado", variant: "destructive" });
      return;
    }

    try {
      if (editingSaleId) {
        await updateSale(editingSaleId, {
          propertyAddress: newSale.propertyAddress,
          clientName: newSale.clientName,
          saleValue: parseFloat(newSale.saleValue),
          commission: parseFloat(newSale.commission),
          saleDate: newSale.date
        });
        toast({ title: "Sucesso", description: "Venda atualizada com sucesso!" });
      } else {
        await createSale({
          brokerId: brokerId,
          propertyAddress: newSale.propertyAddress,
          clientName: newSale.clientName,
          saleValue: parseFloat(newSale.saleValue),
          commission: parseFloat(newSale.commission),
          saleDate: newSale.date
        });
        toast({ title: "Sucesso", description: "Venda adicionada com sucesso!" });
      }

      setNewSale({ propertyAddress: "", clientName: "", saleValue: "", commission: "", date: "" });
      setEditingSaleId(null);
      setSalesModalOpen(false);
    } catch (error) {
      console.error('Error adding/updating sale:', error);
      toast({ title: "Erro", description: "Erro ao salvar venda", variant: "destructive" });
    }
  };

  const handleEditSale = (sale: any) => {
    setEditingSaleId(sale.id);
    setNewSale({
      propertyAddress: sale.description,
      clientName: sale.clientName || "",
      saleValue: sale.value.toString(),
      commission: sale.commission?.toString() || "",
      date: sale.date
    });
    setSalesModalOpen(true);
  };

  const handleDeleteSale = async (saleId: string) => {
    try {
      await deleteSale(saleId);
      toast({ title: "Sucesso", description: "Venda removida com sucesso!" });
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast({ title: "Erro", description: "Erro ao remover venda", variant: "destructive" });
    }
  };

  if (brokersLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Carregando seu perfil...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!userBroker) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Criando seu perfil de corretor...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
            <p className="text-muted-foreground">{brokerData.email} • {brokerData.phone} • CRECI {brokerData.creci}</p>
          </div>
        </div>

        {/* Métricas do Corretor */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Vendas no Ano"
            value={brokerData.totalSales}
            icon={TrendingUp}
            variant="success"
          />
          <MetricCard
            title="Captações Ativas"
            value={brokerData.totalListings}
            icon={Home}
            variant="info"
          />
          <MetricCard
            title="Valor Total de Vendas"
            value={new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0
            }).format(brokerData.totalValue)}
            icon={DollarSign}
            variant="success"
          />
          <MetricCard
            title="Despesas Mensais"
            value={new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(brokerData.monthlyExpenses)}
            icon={DollarSign}
            variant="warning"
          />
        </div>

        {/* Tabs de Conteúdo */}
        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="listings">Captações</TabsTrigger>
            <TabsTrigger value="sales">Vendas</TabsTrigger>
            <TabsTrigger value="clients">Clientes</TabsTrigger>
            <TabsTrigger value="meetings">Reuniões</TabsTrigger>
            <TabsTrigger value="expenses">Despesas</TabsTrigger>
          </TabsList>

          {/* Tab: Captações */}
          <TabsContent value="listings">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Minhas Captações</CardTitle>
                <Dialog open={listingsModalOpen} onOpenChange={setListingsModalOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-pink-700 hover:bg-pink-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Captação
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Captação</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="propertyType">Tipo de Imóvel</Label>
                        <Select value={newListing.propertyType} onValueChange={(value) => setNewListing({...newListing, propertyType: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Apartamento">Apartamento</SelectItem>
                            <SelectItem value="Casa">Casa</SelectItem>
                            <SelectItem value="Sobrado">Sobrado</SelectItem>
                            <SelectItem value="Lote">Lote</SelectItem>
                            <SelectItem value="Chácara">Chácara</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="quantity">Quantidade</Label>
                        <Input id="quantity" type="number" value={newListing.quantity} onChange={(e) => setNewListing({...newListing, quantity: e.target.value})} />
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select value={newListing.status} onValueChange={(value) => setNewListing({...newListing, status: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ativo">Ativo</SelectItem>
                            <SelectItem value="Vendido">Vendido</SelectItem>
                            <SelectItem value="Cancelado">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="date">Data</Label>
                        <Input id="date" type="date" value={newListing.date} onChange={(e) => setNewListing({...newListing, date: e.target.value})} />
                      </div>
                      <Button onClick={async () => {
                        if (!brokerId) return;
                        try {
                          const status = newListing.status as 'Ativo' | 'Desativado' | 'Vendido' | 'Moderação' | 'Agregado';
                          await createListing({
                            brokerId,
                            propertyType: newListing.propertyType as 'Apartamento' | 'Casa' | 'Sobrado' | 'Lote' | 'Chácara',
                            quantity: parseInt(newListing.quantity),
                            status,
                            listingDate: newListing.date,
                            propertyAddress: '',
                            propertyValue: 0
                          });
                          await refreshBrokers();
                          setNewListing({ propertyType: "Apartamento", quantity: "1", status: "Ativo", date: new Date().toISOString().split('T')[0], propertyAddress: "", propertyValue: "" });
                          setListingsModalOpen(false);
                          toast({ title: "Sucesso", description: "Captação adicionada!" });
                        } catch (error) {
                          toast({ title: "Erro", description: "Erro ao adicionar captação", variant: "destructive" });
                        }
                      }} className="w-full bg-pink-700 hover:bg-pink-600">
                        Salvar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {brokerId && (['Apartamento', 'Casa', 'Sobrado', 'Lote', 'Chácara'] as const).map((propertyType) => (
                    <ListingColumn
                      key={propertyType}
                      propertyType={propertyType}
                      brokerId={brokerId}
                      listings={getDetailedListingsByType(brokerId, propertyType)}
                      aggregateQuantity={getAggregateQuantity(brokerId, propertyType)}
                      onQuantityChange={async (quantity) => {
                        try {
                          await updateAggregateQuantity(brokerId, propertyType, quantity);
                          await refreshBrokers();
                          toast({ 
                            title: "Sucesso", 
                            description: `Quantidade de ${propertyType} atualizada para ${quantity}` 
                          });
                        } catch (error) {
                          console.error('Erro ao atualizar quantidade:', error);
                          toast({ 
                            title: "Erro", 
                            description: "Não foi possível atualizar a quantidade", 
                            variant: "destructive" 
                          });
                        }
                      }}
                      statusQuantities={{
                        Ativo: getStatusAggregateQuantity(brokerId, propertyType, 'Ativo'),
                        Moderação: getStatusAggregateQuantity(brokerId, propertyType, 'Moderação'),
                        Vendido: getStatusAggregateQuantity(brokerId, propertyType, 'Vendido'),
                        Desativado: getStatusAggregateQuantity(brokerId, propertyType, 'Desativado')
                      }}
                      onStatusQuantityChange={async (status: DetailedListingStatus, quantity) => {
                        try {
                          await updateStatusAggregateQuantity(brokerId, propertyType, status, quantity);
                          await refreshBrokers();
                          const statusLabels: Record<DetailedListingStatus, string> = {
                            Ativo: 'ativas',
                            Moderação: 'em moderação',
                            Vendido: 'vendidas',
                            Desativado: 'desativadas'
                          };
                          toast({
                            title: 'Sucesso',
                            description: `Quantidade de captações ${statusLabels[status]} atualizada para ${quantity}`
                          });
                        } catch (error) {
                          console.error('Erro ao atualizar quantidade por status:', error);
                          toast({
                            title: 'Erro',
                            description: 'Não foi possível atualizar a quantidade por status',
                            variant: 'destructive'
                          });
                        }
                      }}
                      onAddDetailed={() => {
                        setSelectedPropertyType(propertyType);
                        setListingsModalOpen(true);
                      }}
                      onEdit={(listing) => {
                        setEditingListingId(listing.id);
                        setNewListing({
                          propertyType: listing.propertyType,
                          quantity: listing.quantity.toString(),
                          status: listing.status,
                          date: listing.listingDate,
                          propertyAddress: listing.propertyAddress || '',
                          propertyValue: listing.propertyValue?.toString() || ''
                        });
                        setListingsModalOpen(true);
                      }}
                      onDelete={async (id) => {
                        try {
                          await deleteListing(id);
                          await refreshBrokers();
                          toast({ title: "Sucesso", description: "Captação removida!" });
                        } catch (error) {
                          toast({ title: "Erro", description: "Erro ao remover captação", variant: "destructive" });
                        }
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Vendas */}
          <TabsContent value="sales">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Minhas Vendas</CardTitle>
                <Dialog open={salesModalOpen} onOpenChange={setSalesModalOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-pink-700 hover:bg-pink-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Venda
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingSaleId ? 'Editar Venda' : 'Adicionar Venda'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="propertyAddress">Endereço do Imóvel</Label>
                        <Input id="propertyAddress" value={newSale.propertyAddress} onChange={(e) => setNewSale({...newSale, propertyAddress: e.target.value})} />
                      </div>
                      <div>
                        <Label htmlFor="clientName">Nome do Cliente</Label>
                        <Input id="clientName" value={newSale.clientName} onChange={(e) => setNewSale({...newSale, clientName: e.target.value})} />
                      </div>
                      <div>
                        <Label htmlFor="saleValue">Valor da Venda</Label>
                        <Input id="saleValue" type="number" value={newSale.saleValue} onChange={(e) => setNewSale({...newSale, saleValue: e.target.value})} />
                      </div>
                      <div>
                        <Label htmlFor="commission">Comissão</Label>
                        <Input id="commission" type="number" value={newSale.commission} onChange={(e) => setNewSale({...newSale, commission: e.target.value})} />
                      </div>
                      <div>
                        <Label htmlFor="saleDate">Data da Venda</Label>
                        <Input id="saleDate" type="date" value={newSale.date} onChange={(e) => setNewSale({...newSale, date: e.target.value})} />
                      </div>
                      <Button onClick={addSale} className="w-full bg-pink-700 hover:bg-pink-600">
                        {editingSaleId ? 'Atualizar' : 'Salvar'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Imóvel</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brokerData.sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{sale.description}</TableCell>
                        <TableCell>R$ {sale.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>{new Date(sale.date).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditSale(sale)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteSale(sale.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Clientes */}
          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle>Meus Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Total de clientes: {brokerClients.length}</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Reuniões */}
          <TabsContent value="meetings">
            <Card>
              <CardHeader>
                <CardTitle>Minhas Reuniões</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Total de reuniões: {brokerData.meetings.length}</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Despesas */}
          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <CardTitle>Minhas Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Total de despesas: R$ {brokerData.monthlyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default BrokerProfile;
