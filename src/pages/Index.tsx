import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { BrokerCard } from "@/components/BrokerCard";
import { MetricCard } from "@/components/MetricCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Users, TrendingUp, Home, DollarSign, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data - em produção viria do backend
  const brokers = [
    {
      id: "1",
      name: "Ana Silva",
      email: "ana@exemplo.com", 
      phone: "(11) 99999-9999",
      totalSales: 8,
      totalListings: 15,
      monthlyExpenses: 2500,
      totalValue: 850000
    },
    {
      id: "2", 
      name: "Carlos Santos",
      email: "carlos@exemplo.com",
      phone: "(11) 88888-8888",
      totalSales: 12,
      totalListings: 20,
      monthlyExpenses: 3200,
      totalValue: 1200000
    },
    {
      id: "3",
      name: "Maria Oliveira", 
      email: "maria@exemplo.com",
      phone: "(11) 77777-7777",
      totalSales: 6,
      totalListings: 10,
      monthlyExpenses: 1800,
      totalValue: 450000
    }
  ];

  const filteredBrokers = brokers.filter(broker =>
    broker.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBrokers = brokers.length;
  const totalSales = brokers.reduce((sum, broker) => sum + broker.totalSales, 0);
  const totalListings = brokers.reduce((sum, broker) => sum + broker.totalListings, 0);
  const totalValue = brokers.reduce((sum, broker) => sum + broker.totalValue, 0);

  const handleViewBrokerDetails = (brokerId: string) => {
    navigate(`/broker/${brokerId}`);
  };

  return (
    <div className="min-h-screen bg-background">
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
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Novo Corretor</span>
          </Button>
        </div>

        {/* Métricas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total de Corretores"
            value={totalBrokers}
            icon={Users}
            variant="info"
          />
          <MetricCard
            title="Vendas no Ano"
            value={totalSales}
            icon={TrendingUp}
            variant="success"
          />
          <MetricCard
            title="Captações Ativas"
            value={totalListings}
            icon={Home}
            variant="info"
          />
          <MetricCard
            title="Valor Total Vendido"
            value={new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0
            }).format(totalValue)}
            icon={DollarSign}
            variant="success"
          />
        </div>

        {/* Busca */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar corretor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista de Corretores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBrokers.map(broker => (
            <BrokerCard
              key={broker.id}
              broker={broker}
              onViewDetails={handleViewBrokerDetails}
            />
          ))}
        </div>

        {filteredBrokers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">
              Nenhum corretor encontrado
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
