import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  // Mock data - em produção viria do backend
  const broker = {
    id: brokerId,
    name: "Ana Silva",
    email: "ana@exemplo.com",
    phone: "(11) 99999-9999",
    totalSales: 8,
    totalListings: 15,
    monthlyExpenses: 2500,
    totalValue: 850000,
    sales: [
      {
        id: "1",
        description: "Apartamento Vila Olímpia",
        value: 450000,
        date: "2024-01-15"
      },
      {
        id: "2", 
        description: "Casa Jardim Paulista",
        value: 680000,
        date: "2024-02-10"
      }
    ],
    listings: [
      {
        id: "1",
        address: "Rua das Flores, 123",
        status: "Ativa",
        date: "2024-01-10"
      },
      {
        id: "2",
        address: "Av. Paulista, 456",
        status: "Vendida", 
        date: "2024-02-05"
      }
    ],
    meetings: [
      {
        id: "1",
        title: "Planejamento Q1 2024",
        content: "Definir metas de captação e vendas para o primeiro trimestre.",
        date: "2024-01-08T10:00:00"
      }
    ],
    expenses: [
      {
        id: "1",
        description: "Tráfego Pago Facebook",
        cost: 800,
        date: "2024-01-05"
      },
      {
        id: "2",
        description: "Material de Marketing",
        cost: 350,
        date: "2024-01-12"
      }
    ]
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
              <h1 className="text-3xl font-bold text-foreground">{broker.name}</h1>
              <p className="text-muted-foreground">{broker.email} • {broker.phone}</p>
            </div>
          </div>
        </div>

        {/* Métricas do Corretor */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Vendas no Ano"
            value={broker.totalSales}
            icon={TrendingUp}
            variant="success"
          />
          <MetricCard
            title="Captações Ativas"
            value={broker.totalListings}
            icon={Home}
            variant="info"
          />
          <MetricCard
            title="Valor Total Vendido"
            value={new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0
            }).format(broker.totalValue)}
            icon={DollarSign}
            variant="success"
          />
          <MetricCard
            title="Gastos no Mês"
            value={new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(broker.monthlyExpenses)}
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
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Venda
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {broker.sales.map(sale => (
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
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Captação
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {broker.listings.map(listing => (
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
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Reunião
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {broker.meetings.map(meeting => (
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
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Gasto
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {broker.expenses.map(expense => (
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