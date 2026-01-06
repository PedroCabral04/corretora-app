import { useState, useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { MetricCard } from "@/components/MetricCard";
import { ChartCard } from "@/components/ChartCard";
import { GoalsSummary } from "@/components/GoalsSummary";
import { NotificationsSummary } from "@/components/NotificationsSummary";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, TrendingUp, Home, DollarSign, TrendingDown, Calendar } from "lucide-react";
import { useBrokers } from '@/contexts/BrokersContext';
import { useSales } from '@/contexts/SalesContext';
import { useListings } from '@/contexts/ListingsContext';
import { useExpenses } from '@/contexts/ExpensesContext';
import { useTasks } from '@/contexts/TasksContext';
import { MetricCardSkeleton } from "@/components/ui/skeleton";
import { parseIsoDate } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { brokers, isLoading: brokersLoading } = useBrokers();
  const { sales } = useSales();
  const { listings } = useListings();
  const { expenses } = useExpenses();
  const { tasks } = useTasks();
  const navigate = useNavigate();
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedBroker, setSelectedBroker] = useState("all");
  
  // Get available years from sales data
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = new Set<number>([currentYear]); 
    sales.forEach(sale => {
      const date = parseIsoDate(sale.saleDate);
      if (date) years.add(date.getFullYear());
    });
    listings.forEach(listing => {
      const date = parseIsoDate(listing.listingDate);
      if (date) years.add(date.getFullYear());
    });
    expenses.forEach(expense => {
      const date = parseIsoDate(expense.expenseDate);
      if (date) years.add(date.getFullYear());
    });

    const sortedYears = Array.from(years).sort((a, b) => b - a);
    return sortedYears;
  }, [sales, listings, expenses]);
  
  // Filter data based on selected period and broker
  const filteredData = useMemo(() => {
    const year = parseInt(selectedYear);
    const month = selectedMonth === "all" ? null : parseInt(selectedMonth);
    
    const filterByDate = (date: string) => {
      const parsedDate = parseIsoDate(date);
      if (!parsedDate) return false;
      if (parsedDate.getFullYear() !== year) return false;
      if (month !== null && parsedDate.getMonth() !== month) return false;
      return true;
    };
    
    const filterByBroker = (brokerId: string) => {
      return selectedBroker === "all" || brokerId === selectedBroker;
    };
    
    return {
      sales: sales.filter(s => filterByDate(s.saleDate) && filterByBroker(s.brokerId)),
      listings: listings.filter(l => filterByDate(l.listingDate) && filterByBroker(l.brokerId)),
      expenses: expenses.filter(e => filterByDate(e.expenseDate) && filterByBroker(e.brokerId)),
    };
  }, [sales, listings, expenses, selectedYear, selectedMonth, selectedBroker]);
  
  // Metrics
  const totalBrokers = brokers.length;
  const totalSales = filteredData.sales.length;
  
  // Contar TODAS as captações (mesma lógica do BrokersContext)
  const totalListings = filteredData.listings
    .filter(l => {
      // Ignorar registros antigos com status 'Agregado' (sistema antigo)
      if (l.status === 'Agregado' && l.isAggregate === true) {
        return false;
      }
      return true;
    })
    .reduce((sum, listing) => {
      const quantity = listing.quantity || 1;
      return sum + (quantity >= 0 ? quantity : 0);
    }, 0);
  
  const totalValue = filteredData.sales.reduce((sum, sale) => sum + (sale.saleValue || 0), 0);
  const totalExpenses = filteredData.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netProfit = totalValue - totalExpenses;

  const handleMetricClick = (metric: "vendas" | "captacoes") => {
    const params = new URLSearchParams({
      year: selectedYear,
      month: selectedMonth,
      brokerId: selectedBroker,
    });

    navigate(`/dashboard/detalhes/${metric}?${params.toString()}`);
  };
  
  // Sales by Month Data
  const salesByMonthData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const year = parseInt(selectedYear);
    
    return months.map((month, index) => {
      const monthSales = sales.filter(sale => {
        const saleDate = parseIsoDate(sale.saleDate);
        if (!saleDate) return false;
        const matchYear = saleDate.getFullYear() === year;
        const matchMonth = saleDate.getMonth() === index;
        const matchBroker = selectedBroker === "all" || sale.brokerId === selectedBroker;
        return matchYear && matchMonth && matchBroker;
      });
      
      return {
        name: month,
        value: monthSales.length,
        total: monthSales.reduce((sum, sale) => sum + (sale.saleValue || 0), 0),
      };
    });
  }, [sales, selectedYear, selectedBroker]);
  
  // Expenses by Month Data
  const expensesByMonthData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const year = parseInt(selectedYear);
    
    return months.map((month, index) => {
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = parseIsoDate(expense.expenseDate);
        if (!expenseDate) return false;
        const matchYear = expenseDate.getFullYear() === year;
        const matchMonth = expenseDate.getMonth() === index;
        const matchBroker = selectedBroker === "all" || expense.brokerId === selectedBroker;
        return matchYear && matchMonth && matchBroker;
      });
      
      return {
        name: month,
        value: monthExpenses.reduce((sum, expense) => sum + expense.amount, 0),
      };
    });
  }, [expenses, selectedYear, selectedBroker]);
  
  // Listings by Month Data
  const listingsByMonthData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const year = parseInt(selectedYear);
    
    return months.map((month, index) => {
      const monthListings = listings.filter(listing => {
        const listingDate = parseIsoDate(listing.listingDate);
        if (!listingDate) return false;
        const matchYear = listingDate.getFullYear() === year;
        const matchMonth = listingDate.getMonth() === index;
        const matchBroker = selectedBroker === "all" || listing.brokerId === selectedBroker;
        return matchYear && matchMonth && matchBroker;
      });
      
      return {
        name: month,
        value: monthListings.length,
      };
    });
  }, [listings, selectedYear, selectedBroker]);
  
  // Expenses by Category
  const expensesByCategoryData = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    
    filteredData.expenses.forEach(expense => {
      const category = expense.category || 'Outros';
      categoryMap[category] = (categoryMap[category] || 0) + expense.amount;
    });
    
    return Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredData.expenses]);
  
  // Top Brokers Data
  const topBrokersData = useMemo(() => {
    const brokerSalesMap: Record<string, { name: string; value: number; count: number }> = {};
    
    filteredData.sales.forEach(sale => {
      const broker = brokers.find(b => b.id === sale.brokerId);
      if (broker) {
        if (!brokerSalesMap[broker.id]) {
          brokerSalesMap[broker.id] = { name: broker.name, value: 0, count: 0 };
        }
        brokerSalesMap[broker.id].value += sale.saleValue || 0;
        brokerSalesMap[broker.id].count += 1;
      }
    });
    
    return Object.values(brokerSalesMap)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredData.sales, brokers]);
  
  // Tasks by Status Data
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
  
  // Listings by Status Data
  const listingsByStatusData = useMemo(() => {
    const statusCounts = {
      'Ativa': 0,
      'Vendida': 0,
      'Cancelada': 0,
    };
    
    filteredData.listings.forEach(listing => {
      statusCounts[listing.status]++;
    });
    
    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredData.listings]);

  const isLoading = brokersLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Visão geral de desempenho e métricas
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="year-filter" className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                Ano
              </Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year-filter">
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="month-filter" className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                Mês
              </Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="month-filter">
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
                  <SelectItem value="0">Janeiro</SelectItem>
                  <SelectItem value="1">Fevereiro</SelectItem>
                  <SelectItem value="2">Março</SelectItem>
                  <SelectItem value="3">Abril</SelectItem>
                  <SelectItem value="4">Maio</SelectItem>
                  <SelectItem value="5">Junho</SelectItem>
                  <SelectItem value="6">Julho</SelectItem>
                  <SelectItem value="7">Agosto</SelectItem>
                  <SelectItem value="8">Setembro</SelectItem>
                  <SelectItem value="9">Outubro</SelectItem>
                  <SelectItem value="10">Novembro</SelectItem>
                  <SelectItem value="11">Dezembro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="broker-filter" className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4" />
                Corretor
              </Label>
              <Select value={selectedBroker} onValueChange={setSelectedBroker}>
                <SelectTrigger id="broker-filter">
                  <SelectValue placeholder="Selecione o corretor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os corretores</SelectItem>
                  {brokers.map(broker => (
                    <SelectItem key={broker.id} value={broker.id}>
                      {broker.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Métricas Gerais */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <MetricCard 
              title="Vendas no Período" 
              value={totalSales} 
              icon={TrendingUp} 
              variant="success" 
              isInteractive
              onClick={() => handleMetricClick("vendas")}
            />
            <MetricCard 
              title="Captações" 
              value={totalListings} 
              icon={Home} 
              variant="info" 
              isInteractive
              onClick={() => handleMetricClick("captacoes")}
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
            <MetricCard 
              title="Total de Gastos" 
              value={new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0
              }).format(totalExpenses)} 
              icon={TrendingDown} 
              variant="warning" 
            />
            <MetricCard 
              title="Lucro Líquido" 
              value={new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0
              }).format(netProfit)} 
              icon={DollarSign} 
              variant={netProfit >= 0 ? "success" : "warning"} 
            />
            <MetricCard 
              title="Total de Corretores" 
              value={totalBrokers} 
              icon={Users} 
              variant="info" 
            />
          </div>
        )}

        {/* Notifications and Goals Summary */}
        <div className="space-y-6 mb-8">
          <NotificationsSummary />
          <GoalsSummary />
        </div>

        {/* Gráficos - Vendas, Gastos e Captações */}
        <div className="space-y-6 mb-8">
          <h2 className="text-2xl font-bold text-foreground">Evolução Mensal</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Vendas por Mês"
              type="line"
              data={salesByMonthData}
              dataKey="value"
              xAxisKey="name"
            />
            
            <ChartCard
              title="Valor de Vendas por Mês"
              type="bar"
              data={salesByMonthData}
              dataKey="total"
              xAxisKey="name"
            />
            
            <ChartCard
              title="Gastos por Mês"
              type="line"
              data={expensesByMonthData}
              dataKey="value"
              xAxisKey="name"
            />
            
            <ChartCard
              title="Captações por Mês"
              type="bar"
              data={listingsByMonthData}
              dataKey="value"
              xAxisKey="name"
            />
          </div>
        </div>

        {/* Gráficos - Análises Detalhadas */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Análises Detalhadas</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Top 5 Corretores por Valor"
              type="bar"
              data={topBrokersData}
              dataKey="value"
              xAxisKey="name"
            />
            
            <ChartCard
              title="Gastos por Categoria"
              type="pie"
              data={expensesByCategoryData}
              dataKey="value"
              colors={['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']}
            />
            
            <ChartCard
              title="Captações por Status"
              type="pie"
              data={listingsByStatusData}
              dataKey="value"
              colors={['#10b981', '#3b82f6', '#ef4444']}
            />
            
            <ChartCard
              title="Tarefas por Status"
              type="pie"
              data={tasksByStatusData}
              dataKey="value"
              colors={['#8b5cf6', '#3b82f6', '#10b981']}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
