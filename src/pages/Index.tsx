import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { BrokerCard } from "@/components/BrokerCard";
import { MetricCard } from "@/components/MetricCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Input } from "@/components/ui/input";
import { Plus, Users, TrendingUp, Home, DollarSign, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBrokers } from '@/contexts/BrokersContext';

const Index = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { createBroker } = useBrokers();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBroker, setNewBroker] = useState({ name: '', email: '', phone: '', creci: '' });

  const { brokers } = useBrokers();

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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
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
                  <Label htmlFor="b-name">Nome</Label>
                  <Input id="b-name" value={newBroker.name} onChange={(e) => setNewBroker({...newBroker, name: e.target.value})} />
                </div>
                <div>
                  <Label htmlFor="b-email">Email</Label>
                  <Input id="b-email" value={newBroker.email} onChange={(e) => setNewBroker({...newBroker, email: e.target.value})} />
                </div>
                <div>
                  <Label htmlFor="b-phone">Telefone</Label>
                  <Input id="b-phone" value={newBroker.phone} onChange={(e) => setNewBroker({...newBroker, phone: e.target.value})} />
                </div>
                <div>
                  <Label htmlFor="b-creci">CRECI</Label>
                  <Input id="b-creci" value={newBroker.creci} onChange={(e) => setNewBroker({...newBroker, creci: e.target.value})} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={async () => {
                    if (!newBroker.name) { toast({ title: 'Erro', description: 'Nome é obrigatório', variant: 'destructive' }); return; }
                    try {
                      await createBroker(newBroker);
                      toast({ title: 'Sucesso', description: 'Corretor criado com sucesso' });
                      setNewBroker({ name: '', email: '', phone: '', creci: '' });
                      setIsDialogOpen(false);
                    } catch (err) {
                      toast({ title: 'Erro', description: err instanceof Error ? err.message : 'Erro ao criar corretor', variant: 'destructive' });
                    }
                  }} className="w-full">Criar Corretor</Button>
                  <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="w-full">Cancelar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
