import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useBrokers } from '@/contexts/BrokersContext';
import { 
  ArrowLeft, 
  TrendingUp, 
  Home, 
  DollarSign, 
  Calendar,
  Plus,
  Users,
  Clock
} from "lucide-react";

const BrokerDetails = () => {
  const { brokerId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State management for broker data
  const { getBrokerById } = useBrokers();

  const brokerFromStore = brokerId ? getBrokerById(brokerId) : undefined;

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

  // Modal states
  const [salesModalOpen, setSalesModalOpen] = useState(false);
  const [listingsModalOpen, setListingsModalOpen] = useState(false);
  const [meetingsModalOpen, setMeetingsModalOpen] = useState(false);
  const [expensesModalOpen, setExpensesModalOpen] = useState(false);

  // Form states
  const [newSale, setNewSale] = useState({ description: "", value: "", date: "" });
  const [newListing, setNewListing] = useState({ address: "", status: "Ativa", date: "" });
  const [newMeeting, setNewMeeting] = useState({ title: "", content: "", date: "" });
  const [newExpense, setNewExpense] = useState({ description: "", cost: "", date: "" });

  // Add functions
  const addSale = () => {
    if (!newSale.description || !newSale.value || !newSale.date) {
      toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    const sale = {
      id: Date.now().toString(),
      description: newSale.description,
      value: parseFloat(newSale.value),
      date: newSale.date
    };

    setBrokerData(prev => ({
      ...prev,
      sales: [...prev.sales, sale],
      totalSales: prev.totalSales + 1,
      totalValue: prev.totalValue + sale.value
    }));

    setNewSale({ description: "", value: "", date: "" });
    setSalesModalOpen(false);
    toast({ title: "Sucesso", description: "Venda adicionada com sucesso!" });
  };

  const addListing = () => {
    if (!newListing.address || !newListing.date) {
      toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    const listing = {
      id: Date.now().toString(),
      address: newListing.address,
      status: newListing.status,
      date: newListing.date
    };

    setBrokerData(prev => ({
      ...prev,
      listings: [...prev.listings, listing],
      totalListings: prev.totalListings + 1
    }));

    setNewListing({ address: "", status: "Ativa", date: "" });
    setListingsModalOpen(false);
    toast({ title: "Sucesso", description: "Captação adicionada com sucesso!" });
  };

  const addMeeting = () => {
    if (!newMeeting.title || !newMeeting.content || !newMeeting.date) {
      toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    const meeting = {
      id: Date.now().toString(),
      title: newMeeting.title,
      content: newMeeting.content,
      date: new Date(newMeeting.date).toISOString()
    };

    setBrokerData(prev => ({
      ...prev,
      meetings: [...prev.meetings, meeting]
    }));

    setNewMeeting({ title: "", content: "", date: "" });
    setMeetingsModalOpen(false);
    toast({ title: "Sucesso", description: "Reunião adicionada com sucesso!" });
  };

  const addExpense = () => {
    if (!newExpense.description || !newExpense.cost || !newExpense.date) {
      toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    const expense = {
      id: Date.now().toString(),
      description: newExpense.description,
      cost: parseFloat(newExpense.cost),
      date: newExpense.date
    };

    setBrokerData(prev => ({
      ...prev,
      expenses: [...prev.expenses, expense],
      monthlyExpenses: prev.monthlyExpenses + expense.cost
    }));

    setNewExpense({ description: "", cost: "", date: "" });
    setExpensesModalOpen(false);
    toast({ title: "Sucesso", description: "Gasto adicionado com sucesso!" });
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{brokerData.name}</h1>
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
            title="Captações Ativas"
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
        <Tabs defaultValue="sales" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sales">Vendas</TabsTrigger>
            <TabsTrigger value="listings">Captações</TabsTrigger>
            <TabsTrigger value="meetings">Reuniões</TabsTrigger>
            <TabsTrigger value="expenses">Gastos</TabsTrigger>
          </TabsList>

          <TabsContent value="sales">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Vendas Realizadas</CardTitle>
                <Dialog open={salesModalOpen} onOpenChange={setSalesModalOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Venda
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Nova Venda</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="sale-description">Descrição</Label>
                        <Input
                          id="sale-description"
                          placeholder="Ex: Apartamento Vila Olímpia"
                          value={newSale.description}
                          onChange={(e) => setNewSale({...newSale, description: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sale-value">Valor</Label>
                        <Input
                          id="sale-value"
                          type="number"
                          placeholder="450000"
                          value={newSale.value}
                          onChange={(e) => setNewSale({...newSale, value: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sale-date">Data</Label>
                        <Input
                          id="sale-date"
                          type="date"
                          value={newSale.date}
                          onChange={(e) => setNewSale({...newSale, date: e.target.value})}
                        />
                      </div>
                      <Button onClick={addSale} className="w-full">Adicionar Venda</Button>
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
                      <div className="text-right">
                        <p className="font-semibold text-success">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(sale.value)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listings">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Captações</CardTitle>
                <Dialog open={listingsModalOpen} onOpenChange={setListingsModalOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Captação
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Nova Captação</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="listing-address">Endereço</Label>
                        <Input
                          id="listing-address"
                          placeholder="Ex: Rua das Flores, 123"
                          value={newListing.address}
                          onChange={(e) => setNewListing({...newListing, address: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="listing-status">Status</Label>
                        <Select
                          value={newListing.status}
                          onValueChange={(value) => setNewListing({...newListing, status: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ativa">Ativa</SelectItem>
                            <SelectItem value="Vendida">Vendida</SelectItem>
                            <SelectItem value="Cancelada">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="listing-date">Data</Label>
                        <Input
                          id="listing-date"
                          type="date"
                          value={newListing.date}
                          onChange={(e) => setNewListing({...newListing, date: e.target.value})}
                        />
                      </div>
                      <Button onClick={addListing} className="w-full">Adicionar Captação</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {brokerData.listings.map(listing => (
                    <div key={listing.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{listing.address}</h4>
                        <p className="text-sm text-muted-foreground">
                          Captada em {new Date(listing.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        {getStatusBadge(listing.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="meetings">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Reuniões e Planos de Ação</CardTitle>
                <Dialog open={meetingsModalOpen} onOpenChange={setMeetingsModalOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Reunião
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Nova Reunião</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="meeting-title">Título</Label>
                        <Input
                          id="meeting-title"
                          placeholder="Ex: Planejamento Q1 2024"
                          value={newMeeting.title}
                          onChange={(e) => setNewMeeting({...newMeeting, title: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="meeting-content">Conteúdo</Label>
                        <Textarea
                          id="meeting-content"
                          placeholder="Definir metas de captação e vendas..."
                          value={newMeeting.content}
                          onChange={(e) => setNewMeeting({...newMeeting, content: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="meeting-date">Data e Hora</Label>
                        <Input
                          id="meeting-date"
                          type="datetime-local"
                          value={newMeeting.date}
                          onChange={(e) => setNewMeeting({...newMeeting, date: e.target.value})}
                        />
                      </div>
                      <Button onClick={addMeeting} className="w-full">Adicionar Reunião</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {brokerData.meetings.map(meeting => (
                    <div key={meeting.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{meeting.title}</h4>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(meeting.date).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <p className="text-muted-foreground">{meeting.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gastos e Investimentos</CardTitle>
                <Dialog open={expensesModalOpen} onOpenChange={setExpensesModalOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Gasto
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Novo Gasto</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="expense-description">Descrição</Label>
                        <Input
                          id="expense-description"
                          placeholder="Ex: Tráfego Pago Facebook"
                          value={newExpense.description}
                          onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="expense-cost">Valor</Label>
                        <Input
                          id="expense-cost"
                          type="number"
                          placeholder="800"
                          value={newExpense.cost}
                          onChange={(e) => setNewExpense({...newExpense, cost: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="expense-date">Data</Label>
                        <Input
                          id="expense-date"
                          type="date"
                          value={newExpense.date}
                          onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                        />
                      </div>
                      <Button onClick={addExpense} className="w-full">Adicionar Gasto</Button>
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
                      <div className="text-right">
                        <p className="font-semibold text-warning">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(expense.cost)}
                        </p>
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