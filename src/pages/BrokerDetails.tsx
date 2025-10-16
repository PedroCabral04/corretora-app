import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
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
  ArrowLeft,
  TrendingUp,
  Home,
  DollarSign,
  Plus,
  Trash2,
  Edit
} from "lucide-react";

const BrokerDetails = () => {
  const { brokerId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const { getBrokerById, refreshBrokers } = useBrokers();
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

  const brokerFromStore = brokerId ? getBrokerById(brokerId) : undefined;

  // Verificar se o usuário logado é o próprio corretor visualizando sua página
  const isOwnProfile = user?.role === 'broker' && brokerFromStore?.email?.toLowerCase() === user?.email.toLowerCase();

  const [brokerData, setBrokerData] = useState(() => ({
    id: brokerId,
    name: brokerFromStore?.name ?? "",
    creci: brokerFromStore?.creci ?? "",
    email: brokerFromStore?.email ?? "",
    phone: brokerFromStore?.phone ?? "",
    totalSales: brokerFromStore?.totalSales ?? 0,
    totalListings: brokerFromStore?.totalListings ?? 0,
    monthlyExpenses: brokerFromStore?.monthlyExpenses ?? 0,
    totalValue: brokerFromStore?.totalValue ?? 0,
    sales: brokerFromStore && (brokerFromStore as any).sales ? (brokerFromStore as any).sales : [],
    listings: brokerFromStore && (brokerFromStore as any).listings ? (brokerFromStore as any).listings : [],
    meetings: brokerFromStore && (brokerFromStore as any).meetings ? (brokerFromStore as any).meetings : [],
    expenses: brokerFromStore && (brokerFromStore as any).expenses ? (brokerFromStore as any).expenses : []
  }));

  // Filter clients for this broker
  const brokerClients = clients.filter(client => client.broker_id === brokerId);
  const brokerListings = brokerId ? getListingsByBrokerId(brokerId) : [];
  // Total de TODAS as captações (manuais dos 4 status + detalhadas)
  // Ignora registros antigos com status 'Agregado' (sistema antigo)
  const totalListingsCount = brokerListings
    .filter(listing => listing.status !== 'Agregado')
    .reduce((acc, listing) => {
      const parsed = Number(listing.quantity);
      const quantity = Number.isFinite(parsed) ? parsed : 1;
      const safeQuantity = quantity >= 0 ? quantity : 0;
      return acc + safeQuantity;
    }, 0);
    
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
        // Campos antigos para exibição de compatibilidade
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
      totalListings: brokerListings
        .filter(listing => listing.status !== 'Agregado')
        .reduce((acc, listing) => {
          const parsed = Number(listing.quantity);
          const quantity = Number.isFinite(parsed) ? parsed : 1;
          const safeQuantity = quantity >= 0 ? quantity : 0;
          // Somar TODAS as captações (manuais dos 4 status + detalhadas)
          return acc + safeQuantity;
        }, 0),
      totalValue: brokerSales.reduce((sum, s) => sum + s.saleValue, 0),
      monthlyExpenses: brokerExpenses.reduce((sum, e) => sum + e.amount, 0)
    }));
  }, [brokerId, listings, sales, meetings, expenses, getListingsByBrokerId, getSalesByBrokerId, getMeetingsByBrokerId, getExpensesByBrokerId]);

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
      
      // O useEffect vai recarregar automaticamente os dados
    } catch (error) {
      console.error("Erro ao salvar venda:", error);
      toast({ 
        title: "Erro", 
        description: error instanceof Error ? error.message : "Erro ao salvar venda", 
        variant: "destructive" 
      });
    }
  };

  const handleEditSale = (sale: any) => {
    setNewSale({
      propertyAddress: sale.description,
      clientName: "",
      saleValue: sale.value.toString(),
      commission: "",
      date: sale.date
    });
    setEditingSaleId(sale.id);
    setSalesModalOpen(true);
  };

  const handleDeleteSale = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta venda?")) {
      try {
        await deleteSale(id);
        toast({ title: "Sucesso", description: "Venda excluída com sucesso!" });
      } catch (error) {
        toast({
          title: "Erro ao excluir venda",
          variant: "destructive",
        });
      }
    }
  };

  const addListing = async () => {
    if (!newListing.propertyType || !newListing.quantity || !newListing.date) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    if (!brokerId) {
      toast({ title: "Erro", description: "ID do corretor não encontrado", variant: "destructive" });
      return;
    }

    try {
      if (editingListingId) {
        await updateListing(editingListingId, {
          propertyType: newListing.propertyType as 'Apartamento' | 'Casa' | 'Sobrado' | 'Lote' | 'Chácara',
          quantity: parseInt(newListing.quantity),
          listingDate: newListing.date,
          status: newListing.status as 'Ativo' | 'Desativado' | 'Vendido' | 'Moderação',
          propertyAddress: newListing.propertyAddress || undefined,
          propertyValue: newListing.propertyValue ? parseFloat(newListing.propertyValue) : undefined
        });
        await refreshBrokers();
        toast({ title: "Sucesso", description: "Captação atualizada com sucesso!" });
      } else {
        await createListing({
          brokerId: brokerId,
          propertyType: newListing.propertyType as 'Apartamento' | 'Casa' | 'Sobrado' | 'Lote' | 'Chácara',
          quantity: parseInt(newListing.quantity),
          listingDate: newListing.date,
          status: newListing.status as 'Ativo' | 'Desativado' | 'Vendido' | 'Moderação',
          propertyAddress: newListing.propertyAddress || undefined,
          propertyValue: newListing.propertyValue ? parseFloat(newListing.propertyValue) : undefined
        });
        await refreshBrokers();
        toast({ title: "Sucesso", description: "Captação adicionada com sucesso!" });
      }

      setNewListing({ 
        propertyType: "Apartamento", 
        quantity: "1", 
        status: "Ativo", 
        date: new Date().toISOString().split('T')[0], 
        propertyAddress: "", 
        propertyValue: "" 
      });
      setEditingListingId(null);
      setListingsModalOpen(false);
      
      // O useEffect vai recarregar automaticamente os dados
    } catch (error) {
      console.error("Erro ao salvar captação:", error);
      toast({ 
        title: "Erro", 
        description: error instanceof Error ? error.message : "Erro ao salvar captação", 
        variant: "destructive" 
      });
    }
  };

  const handleEditListing = (listing: any) => {
    setNewListing({
      propertyType: listing.propertyType || "",
      quantity: listing.quantity?.toString() || "1",
      status: listing.status,
      date: listing.listingDate || listing.date,
      propertyAddress: listing.propertyAddress || "",
      propertyValue: listing.propertyValue?.toString() || ""
    });
    setEditingListingId(listing.id);
    setListingsModalOpen(true);
  };

  const handleDeleteListing = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta captação?")) {
      try {
        await deleteListing(id);
        await refreshBrokers();
        toast({ title: "Sucesso", description: "Captação excluída com sucesso!" });
      } catch (error) {
        toast({
          title: "Erro ao excluir captação",
          variant: "destructive",
        });
      }
    }
  };

  const addMeeting = async () => {
    if (!newMeeting.clientName || !newMeeting.meetingType || !newMeeting.date) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    if (!brokerId) {
      toast({ title: "Erro", description: "ID do corretor não encontrado", variant: "destructive" });
      return;
    }

    try {
      if (editingMeetingId) {
        await updateMeeting(editingMeetingId, {
          clientName: newMeeting.clientName,
          meetingType: newMeeting.meetingType,
          meetingDate: newMeeting.date,
          notes: newMeeting.notes || undefined
        });
        toast({ title: "Sucesso", description: "Reunião atualizada com sucesso!" });
      } else {
        await createMeeting({
          brokerId: brokerId,
          clientName: newMeeting.clientName,
          meetingType: newMeeting.meetingType,
          meetingDate: newMeeting.date,
          notes: newMeeting.notes || undefined
        });
        toast({ title: "Sucesso", description: "Reunião adicionada com sucesso!" });
      }

      setNewMeeting({ clientName: "", meetingType: "", notes: "", date: "" });
      setEditingMeetingId(null);
      setMeetingsModalOpen(false);
      
      // O useEffect vai recarregar automaticamente os dados
    } catch (error) {
      console.error("Erro ao salvar reunião:", error);
      toast({ 
        title: "Erro", 
        description: error instanceof Error ? error.message : "Erro ao salvar reunião", 
        variant: "destructive" 
      });
    }
  };

  const handleEditMeeting = (meeting: any) => {
    setNewMeeting({
      clientName: "",
      meetingType: meeting.title,
      notes: meeting.content,
      date: meeting.date
    });
    setEditingMeetingId(meeting.id);
    setMeetingsModalOpen(true);
  };

  const handleDeleteMeeting = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta reunião?")) {
      try {
        await deleteMeeting(id);
        toast({ title: "Sucesso", description: "Reunião excluída com sucesso!" });
      } catch (error) {
        toast({
          title: "Erro ao excluir reunião",
          variant: "destructive",
        });
      }
    }
  };

  const handleOpenCompleteMeetingModal = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
    setMeetingSummary("");
    setCompleteMeetingModalOpen(true);
  };

  const handleCompleteMeeting = async () => {
    if (!meetingSummary.trim()) {
      toast({ title: "Erro", description: "Por favor, descreva o que foi discutido na reunião", variant: "destructive" });
      return;
    }

    if (!selectedMeetingId) {
      toast({ title: "Erro", description: "Reunião não encontrada", variant: "destructive" });
      return;
    }

    try {
      await completeMeeting(selectedMeetingId, meetingSummary);
      toast({ title: "Sucesso", description: "Reunião finalizada com sucesso!" });
      setCompleteMeetingModalOpen(false);
      setMeetingSummary("");
      setSelectedMeetingId(null);
    } catch (error) {
      console.error("Erro ao finalizar reunião:", error);
      toast({
        title: "Erro ao finalizar reunião",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const addExpense = async () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.category || !newExpense.date) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    if (!brokerId) {
      toast({ title: "Erro", description: "ID do corretor não encontrado", variant: "destructive" });
      return;
    }

    try {
      if (editingExpenseId) {
        await updateExpense(editingExpenseId, {
          description: newExpense.description,
          amount: parseFloat(newExpense.amount),
          category: newExpense.category,
          expenseDate: newExpense.date
        });
        toast({ title: "Sucesso", description: "Gasto atualizado com sucesso!" });
      } else {
        await createExpense({
          brokerId: brokerId,
          description: newExpense.description,
          amount: parseFloat(newExpense.amount),
          category: newExpense.category,
          expenseDate: newExpense.date
        });
        toast({ title: "Sucesso", description: "Gasto adicionado com sucesso!" });
      }

      setNewExpense({ description: "", amount: "", category: "", date: "" });
      setEditingExpenseId(null);
      setExpensesModalOpen(false);
      
      // O useEffect vai recarregar automaticamente os dados
    } catch (error) {
      console.error("Erro ao salvar gasto:", error);
      toast({ 
        title: "Erro", 
        description: error instanceof Error ? error.message : "Erro ao salvar gasto", 
        variant: "destructive" 
      });
    }
  };

  const handleEditExpense = (expense: any) => {
    setNewExpense({
      description: expense.description,
      amount: expense.cost.toString(),
      category: "",
      date: expense.date
    });
    setEditingExpenseId(expense.id);
    setExpensesModalOpen(true);
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este gasto?")) {
      try {
        await deleteExpense(id);
        toast({ title: "Sucesso", description: "Gasto excluído com sucesso!" });
      } catch (error) {
        toast({
          title: "Erro ao excluir gasto",
          variant: "destructive",
        });
      }
    }
  };

  // Reset functions
  const resetClientForm = () => {
    setClientForm({
      client_name: "",
      interest: "",
      negotiation_status: "",
      is_active: true,
      status_color: "green",
      last_updates: "",
    });
    setEditingClientId(null);
  };

  const resetSaleForm = () => {
    setNewSale({ propertyAddress: "", clientName: "", saleValue: "", commission: "", date: "" });
    setEditingSaleId(null);
  };

  const resetListingForm = () => {
    setNewListing({ 
      propertyType: "Apartamento", 
      quantity: "1", 
      status: "Ativo", 
      date: new Date().toISOString().split('T')[0], 
      propertyAddress: "", 
      propertyValue: "" 
    });
    setEditingListingId(null);
  };

  const resetMeetingForm = () => {
    setNewMeeting({ clientName: "", meetingType: "", notes: "", date: "" });
    setEditingMeetingId(null);
  };

  const resetExpenseForm = () => {
    setNewExpense({ description: "", amount: "", category: "", date: "" });
    setEditingExpenseId(null);
  };

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brokerId) return;

    try {
      if (editingClientId) {
        await updateClient(editingClientId, clientForm);
        toast({ title: "Cliente atualizado com sucesso!" });
      } else {
        await addClient({ ...clientForm, broker_id: brokerId });
        toast({ title: "Cliente adicionado com sucesso!" });
      }
      setClientsModalOpen(false);
      resetClientForm();
    } catch (error) {
      toast({
        title: "Erro ao salvar cliente",
        variant: "destructive",
      });
    }
  };

  const handleEditClient = (client: any) => {
    setClientForm({
      client_name: client.client_name,
      interest: client.interest,
      negotiation_status: client.negotiation_status,
      is_active: client.is_active,
      status_color: client.status_color || "green",
      last_updates: client.last_updates || "",
    });
    setEditingClientId(client.id);
    setClientsModalOpen(true);
  };

  const handleDeleteClient = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      try {
        await deleteClient(id);
        toast({ title: "Cliente excluído com sucesso!" });
      } catch (error) {
        toast({
          title: "Erro ao excluir cliente",
          variant: "destructive",
        });
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      "Ativa": "default",
      "Vendida": "secondary",
      "Cancelada": "destructive"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        {!isOwnProfile && (
          <Breadcrumbs 
            items={[
              { label: "Corretores", href: "/brokers" },
              { label: brokerData.name || "Detalhes" }
            ]} 
            className="mb-6"
          />
        )}
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            {!isOwnProfile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/brokers")}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {isOwnProfile ? 'Meu Perfil' : brokerData.name}
              </h1>
              <p className="text-muted-foreground">{brokerData.email} • {brokerData.phone} • CRECI {brokerData.creci}</p>
            </div>
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
            title="Captações"
            value={brokerData.totalListings}
            icon={Home}
            variant="info"
          />
          <MetricCard
            title="Valor Total Vendido"
            value={new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0
            }).format(brokerData.totalValue)}
            icon={DollarSign}
            variant="success"
          />
          <MetricCard
            title="Gastos no Mês"
            value={new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(brokerData.monthlyExpenses)}
            icon={DollarSign}
            variant="warning"
          />
        </div>

        {/* Tabs com Detalhes */}
        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="clients">Clientes</TabsTrigger>
            <TabsTrigger value="sales">Vendas</TabsTrigger>
            <TabsTrigger value="listings">Captações</TabsTrigger>
            <TabsTrigger value="meetings">Reuniões</TabsTrigger>
            <TabsTrigger value="expenses">Gastos</TabsTrigger>
          </TabsList>

          <TabsContent value="clients">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Clientes do Corretor</CardTitle>
                <Dialog open={clientsModalOpen} onOpenChange={(o) => { setClientsModalOpen(o); if (!o) resetClientForm(); }}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Cliente
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingClientId ? "Editar Cliente" : "Novo Cliente"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleClientSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="client_name">Nome do Cliente</Label>
                        <Input
                          id="client_name"
                          value={clientForm.client_name}
                          onChange={(e) =>
                            setClientForm({ ...clientForm, client_name: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="interest">Interesse</Label>
                        <Input
                          id="interest"
                          value={clientForm.interest}
                          onChange={(e) =>
                            setClientForm({ ...clientForm, interest: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="negotiation_status">Status da Negociação</Label>
                        <Select
                          value={clientForm.negotiation_status}
                          onValueChange={(value) =>
                            setClientForm({ ...clientForm, negotiation_status: value })
                          }
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Primeiro Contato">Primeiro Contato</SelectItem>
                            <SelectItem value="Em Negociação">Em Negociação</SelectItem>
                            <SelectItem value="Proposta Enviada">Proposta Enviada</SelectItem>
                            <SelectItem value="Aguardando Documentação">Aguardando Documentação</SelectItem>
                            <SelectItem value="Fechamento">Fechamento</SelectItem>
                            <SelectItem value="Perdido">Perdido</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="is_active"
                          checked={clientForm.is_active}
                          onChange={(e) =>
                            setClientForm({ ...clientForm, is_active: e.target.checked })
                          }
                          className="h-4 w-4"
                        />
                        <Label htmlFor="is_active">Cliente Ativo</Label>
                      </div>

                      <div>
                        <Label htmlFor="status_color">Cor do Indicador</Label>
                        <Select
                          value={clientForm.status_color}
                          onValueChange={(value) =>
                            setClientForm({ ...clientForm, status_color: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="green">
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-green-500" />
                                Verde
                              </div>
                            </SelectItem>
                            <SelectItem value="red">
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-red-500" />
                                Vermelho
                              </div>
                            </SelectItem>
                            <SelectItem value="yellow">
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                                Amarelo
                              </div>
                            </SelectItem>
                            <SelectItem value="blue">
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-blue-500" />
                                Azul
                              </div>
                            </SelectItem>
                            <SelectItem value="purple">
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-purple-500" />
                                Roxo
                              </div>
                            </SelectItem>
                            <SelectItem value="orange">
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-orange-500" />
                                Laranja
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="last_updates">Últimas Atualizações</Label>
                        <Textarea
                          id="last_updates"
                          value={clientForm.last_updates}
                          onChange={(e) =>
                            setClientForm({ ...clientForm, last_updates: e.target.value })
                          }
                          placeholder="Anote aqui as últimas atualizações sobre o cliente..."
                          rows={4}
                          className="resize-none"
                        />
                      </div>

                      <Button type="submit" className="w-full">
                        {editingClientId ? "Atualizar" : "Adicionar"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table containerClassName="max-h-[600px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Interesse</TableHead>
                      <TableHead>Negociação</TableHead>
                      <TableHead>Últimas Atualizações</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : brokerClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          Nenhum cliente cadastrado para este corretor
                        </TableCell>
                      </TableRow>
                    ) : (
                      brokerClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell>
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{
                                backgroundColor: 
                                  client.status_color === 'green' ? '#22c55e' :
                                  client.status_color === 'red' ? '#ef4444' :
                                  client.status_color === 'yellow' ? '#eab308' :
                                  client.status_color === 'blue' ? '#3b82f6' :
                                  client.status_color === 'purple' ? '#a855f7' :
                                  client.status_color === 'orange' ? '#f97316' :
                                  '#22c55e'
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {client.client_name}
                          </TableCell>
                          <TableCell>{client.interest}</TableCell>
                          <TableCell>{client.negotiation_status}</TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={client.last_updates || ''}>
                              {client.last_updates || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClient(client)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClient(client.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Vendas Realizadas</CardTitle>
                <Dialog open={salesModalOpen} onOpenChange={(open) => { setSalesModalOpen(open); if (!open) resetSaleForm(); }}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Venda
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingSaleId ? "Editar Venda" : "Adicionar Nova Venda"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="sale-property">Endereço do Imóvel *</Label>
                        <Input
                          id="sale-property"
                          placeholder="Ex: Apartamento Vila Olímpia"
                          value={newSale.propertyAddress}
                          onChange={(e) => setNewSale({...newSale, propertyAddress: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sale-client">Nome do Cliente *</Label>
                        <Input
                          id="sale-client"
                          placeholder="Ex: Maria Silva"
                          value={newSale.clientName}
                          onChange={(e) => setNewSale({...newSale, clientName: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sale-value">Valor da Venda *</Label>
                        <Input
                          id="sale-value"
                          type="number"
                          placeholder="450000"
                          value={newSale.saleValue}
                          onChange={(e) => setNewSale({...newSale, saleValue: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sale-commission">Comissão *</Label>
                        <Input
                          id="sale-commission"
                          type="number"
                          placeholder="13500"
                          value={newSale.commission}
                          onChange={(e) => setNewSale({...newSale, commission: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sale-date">Data *</Label>
                        <Input
                          id="sale-date"
                          type="date"
                          value={newSale.date}
                          onChange={(e) => setNewSale({...newSale, date: e.target.value})}
                        />
                      </div>
                      <Button onClick={addSale} className="w-full">{editingSaleId ? "Atualizar" : "Adicionar"}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {brokerData.sales.map(sale => (
                    <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{sale.description}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(sale.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-success">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(sale.value)}
                        </p>
                        <Button variant="ghost" size="icon" onClick={() => handleEditSale(sale)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteSale(sale.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listings">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Captações por Tipo de Imóvel</h3>
              
              {/* Grid de Colunas Responsivo */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {(['Apartamento', 'Casa', 'Sobrado', 'Lote', 'Chácara'] as const).map((propertyType) => (
                  <ListingColumn
                    key={propertyType}
                    propertyType={propertyType}
                    brokerId={brokerId!}
                    listings={getDetailedListingsByType(brokerId!, propertyType)}
                    aggregateQuantity={getAggregateQuantity(brokerId!, propertyType)}
                    onQuantityChange={async (quantity) => {
                      try {
                        await updateAggregateQuantity(brokerId!, propertyType, quantity);
                        await refreshBrokers();
                        toast({ 
                          title: "Sucesso", 
                          description: `Quantidade de ${propertyType} atualizada para ${quantity}` 
                        });
                      } catch (error) {
                        toast({ 
                          title: "Erro", 
                          description: "Erro ao atualizar quantidade", 
                          variant: "destructive" 
                        });
                      }
                    }}
                    statusQuantities={{
                      Ativo: getStatusAggregateQuantity(brokerId!, propertyType, 'Ativo'),
                      Moderação: getStatusAggregateQuantity(brokerId!, propertyType, 'Moderação'),
                      Vendido: getStatusAggregateQuantity(brokerId!, propertyType, 'Vendido'),
                      Desativado: getStatusAggregateQuantity(brokerId!, propertyType, 'Desativado')
                    }}
                    onStatusQuantityChange={async (status: DetailedListingStatus, quantity) => {
                      try {
                        await updateStatusAggregateQuantity(brokerId!, propertyType, status, quantity);
                        await refreshBrokers();
                        const statusLabels: Record<DetailedListingStatus, string> = {
                          Ativo: 'ativas',
                          Moderação: 'em moderação',
                          Vendido: 'vendidas',
                          Desativado: 'desativadas'
                        };
                        toast({
                          title: "Sucesso",
                          description: `Quantidade de captações ${statusLabels[status]} atualizada para ${quantity}`
                        });
                      } catch (error) {
                        toast({
                          title: "Erro",
                          description: "Erro ao atualizar quantidade por status",
                          variant: "destructive"
                        });
                      }
                    }}
                    onAddDetailed={() => {
                      setSelectedPropertyType(propertyType);
                      setNewListing({ 
                        propertyType, 
                        quantity: "1", 
                        status: "Ativo", 
                        date: new Date().toISOString().split('T')[0],
                        propertyAddress: "",
                        propertyValue: ""
                      });
                      setEditingListingId(null);
                      setListingsModalOpen(true);
                    }}
                    onEdit={(listing) => handleEditListing(listing)}
                    onDelete={(id) => handleDeleteListing(id)}
                  />
                ))}
              </div>

              {/* Dialog para Adicionar/Editar Captação Detalhada */}
              <Dialog open={listingsModalOpen} onOpenChange={(open) => { 
                setListingsModalOpen(open); 
                if (!open) {
                  resetListingForm();
                  setSelectedPropertyType(null);
                }
              }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingListingId ? "Editar Captação" : "Adicionar Nova Captação"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="listing-type">Tipo de Imóvel *</Label>
                      <Select
                        value={newListing.propertyType}
                        onValueChange={(value) => setNewListing({...newListing, propertyType: value})}
                        disabled={selectedPropertyType !== null && !editingListingId}
                      >
                        <SelectTrigger id="listing-type">
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
                      <Label htmlFor="listing-quantity">Quantidade *</Label>
                      <Input
                        id="listing-quantity"
                        type="number"
                        min="1"
                        placeholder="Ex: 1"
                        value={newListing.quantity}
                        onChange={(e) => setNewListing({...newListing, quantity: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="listing-address">Endereço do Imóvel</Label>
                      <Input
                        id="listing-address"
                        type="text"
                        placeholder="Ex: Rua das Flores, 123 - Centro"
                        value={newListing.propertyAddress}
                        onChange={(e) => setNewListing({...newListing, propertyAddress: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="listing-value">Valor (R$)</Label>
                      <Input
                        id="listing-value"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ex: 450000"
                        value={newListing.propertyValue}
                        onChange={(e) => setNewListing({...newListing, propertyValue: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="listing-status">Status</Label>
                      <Select
                        value={newListing.status}
                        onValueChange={(value) => setNewListing({...newListing, status: value})}
                      >
                        <SelectTrigger id="listing-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ativo">Ativo</SelectItem>
                          <SelectItem value="Desativado">Desativado</SelectItem>
                          <SelectItem value="Vendido">Vendido</SelectItem>
                          <SelectItem value="Moderação">Moderação</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="listing-date">Data *</Label>
                      <Input
                        id="listing-date"
                        type="date"
                        value={newListing.date}
                        onChange={(e) => setNewListing({...newListing, date: e.target.value})}
                      />
                    </div>
                    <Button onClick={addListing} className="w-full">{editingListingId ? "Atualizar" : "Adicionar"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>

          <TabsContent value="meetings">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Reuniões e Planos de Ação</CardTitle>
                <Dialog open={meetingsModalOpen} onOpenChange={(open) => { setMeetingsModalOpen(open); if (!open) resetMeetingForm(); }}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Reunião
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingMeetingId ? "Editar Reunião" : "Adicionar Nova Reunião"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="meeting-client">Nome do Cliente *</Label>
                        <Input
                          id="meeting-client"
                          placeholder="Ex: João Santos"
                          value={newMeeting.clientName}
                          onChange={(e) => setNewMeeting({...newMeeting, clientName: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="meeting-type">Tipo de Reunião *</Label>
                        <Input
                          id="meeting-type"
                          placeholder="Ex: Planejamento, Visita, Negociação"
                          value={newMeeting.meetingType}
                          onChange={(e) => setNewMeeting({...newMeeting, meetingType: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="meeting-notes">Observações</Label>
                        <Textarea
                          id="meeting-notes"
                          placeholder="Definir metas de captação e vendas..."
                          value={newMeeting.notes}
                          onChange={(e) => setNewMeeting({...newMeeting, notes: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="meeting-date">Data e Hora *</Label>
                        <Input
                          id="meeting-date"
                          type="datetime-local"
                          value={newMeeting.date}
                          onChange={(e) => setNewMeeting({...newMeeting, date: e.target.value})}
                        />
                      </div>
                      <Button onClick={addMeeting} className="w-full">{editingMeetingId ? "Atualizar" : "Adicionar"}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {brokerData.meetings.map(meeting => (
                    <div key={meeting.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{meeting.title}</h4>
                            <Badge variant={meeting.status === 'completed' ? 'default' : 'secondary'}>
                              {meeting.status === 'completed' ? 'Finalizada' : 'Pendente'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">Cliente: {meeting.clientName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {new Date(meeting.date).toLocaleDateString('pt-BR', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Badge>
                          {meeting.status === 'pending' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleOpenCompleteMeetingModal(meeting.id)}
                            >
                              Finalizar
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleEditMeeting(meeting)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteMeeting(meeting.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {meeting.content && (
                        <div className="mb-2">
                          <p className="text-sm text-muted-foreground"><strong>Observações:</strong> {meeting.content}</p>
                        </div>
                      )}
                      {meeting.status === 'completed' && meeting.summary && (
                        <div className="mt-2 p-3 bg-muted rounded-md">
                          <p className="text-sm font-medium mb-1">Resumo da reunião:</p>
                          <p className="text-sm text-muted-foreground">{meeting.summary}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Modal para finalizar reunião */}
            <Dialog open={completeMeetingModalOpen} onOpenChange={setCompleteMeetingModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Finalizar Reunião</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="meeting-summary">O que foi discutido na reunião? *</Label>
                    <Textarea
                      id="meeting-summary"
                      placeholder="Descreva os principais pontos discutidos, decisões tomadas, próximos passos, etc."
                      value={meetingSummary}
                      onChange={(e) => setMeetingSummary(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setCompleteMeetingModalOpen(false);
                        setMeetingSummary("");
                        setSelectedMeetingId(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleCompleteMeeting} 
                      className="flex-1"
                    >
                      Finalizar Reunião
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="expenses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gastos Mensais</CardTitle>
                <Dialog open={expensesModalOpen} onOpenChange={(open) => { setExpensesModalOpen(open); if (!open) resetExpenseForm(); }}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Gasto
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingExpenseId ? "Editar Gasto" : "Adicionar Novo Gasto"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="expense-description">Descrição *</Label>
                        <Input
                          id="expense-description"
                          placeholder="Ex: Gasolina"
                          value={newExpense.description}
                          onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="expense-category">Categoria *</Label>
                        <Input
                          id="expense-category"
                          placeholder="Ex: Transporte, Marketing, Escritório"
                          value={newExpense.category}
                          onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="expense-amount">Valor *</Label>
                        <Input
                          id="expense-amount"
                          type="number"
                          placeholder="150"
                          value={newExpense.amount}
                          onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="expense-date">Data *</Label>
                        <Input
                          id="expense-date"
                          type="date"
                          value={newExpense.date}
                          onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                        />
                      </div>
                      <Button onClick={addExpense} className="w-full">{editingExpenseId ? "Atualizar" : "Adicionar"}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {brokerData.expenses.map(expense => (
                    <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{expense.description}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-destructive">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(expense.cost)}
                        </p>
                        <Button variant="ghost" size="icon" onClick={() => handleEditExpense(expense)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteExpense(expense.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default BrokerDetails;
