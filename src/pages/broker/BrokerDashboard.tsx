import { useState, useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { MetricCard } from "@/components/MetricCard";
import { ChartCard } from "@/components/ChartCard";
import { GoalsSummary } from "@/components/GoalsSummary";
import { NotificationsSummary } from "@/components/NotificationsSummary";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { TrendingUp, Home, DollarSign, TrendingDown, Calendar, CheckSquare, Target } from "lucide-react";
import { useSales } from '@/contexts/SalesContext';
import { useListings } from '@/contexts/ListingsContext';
import { useExpenses } from '@/contexts/ExpensesContext';
import { useTasks } from '@/contexts/TasksContext';
import { MetricCardSkeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { parseIsoDate } from "@/lib/utils";

const BrokerDashboard = () => {
  const { user } = useAuth();
  const { sales } = useSales();
  const { listings } = useListings();
  const { expenses } = useExpenses();
  const { tasks } = useTasks();
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState("all");
  
  // Get available years from personal data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
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
    return sortedYears.length > 0 ? sortedYears : [new Date().getFullYear()];
  }, [sales, listings, expenses]);
  
  // Filter data based on selected period (already filtered by user_id in contexts)
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
    
    return {
      sales: sales.filter(s => filterByDate(s.saleDate)),
      listings: listings.filter(l => filterByDate(l.listingDate)),
      expenses: expenses.filter(e => filterByDate(e.expenseDate)),
    };
  }, [sales, listings, expenses, selectedYear, selectedMonth]);
  
  // Personal Metrics
  const mySales = filteredData.sales.length;
  const myActiveListings = filteredData.listings.filter(l => l.status === 'Ativo').length;
  const myTotalValue = filteredData.sales.reduce((sum, sale) => sum + (sale.saleValue || 0), 0);
  const myExpenses = filteredData.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const myNetProfit = myTotalValue - myExpenses;
  const myPendingTasks = tasks.filter(t => t.status !== 'Concluída').length;
  const conversionRate = myActiveListings > 0 ? ((mySales / myActiveListings) * 100).toFixed(1) : '0';
  
  // Sales by Month Data (Personal)
  const salesByMonthData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const year = parseInt(selectedYear);
    
    return months.map((month, index) => {
      const monthSales = sales.filter(sale => {
        const saleDate = parseIsoDate(sale.saleDate);
        if (!saleDate) return false;
        const matchYear = saleDate.getFullYear() === year;
        const matchMonth = saleDate.getMonth() === index;
        return matchYear && matchMonth;
      });
      
      return {
        name: month,
        value: monthSales.length,
        total: monthSales.reduce((sum, sale) => sum + (sale.saleValue || 0), 0),
      };
    });
  }, [sales, selectedYear]);
  
  // Expenses by Month Data (Personal)
  const expensesByMonthData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const year = parseInt(selectedYear);
    
    return months.map((month, index) => {
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = parseIsoDate(expense.expenseDate);
        if (!expenseDate) return false;
        const matchYear = expenseDate.getFullYear() === year;
        const matchMonth = expenseDate.getMonth() === index;
        return matchYear && matchMonth;
      });
      
      return {
        name: month,
        value: monthExpenses.reduce((sum, expense) => sum + expense.amount, 0),
      };
    });
  }, [expenses, selectedYear]);
  
  // Listings by Month Data (Personal)
  const listingsByMonthData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const year = parseInt(selectedYear);
    
    return months.map((month, index) => {
      const monthListings = listings.filter(listing => {
        const listingDate = parseIsoDate(listing.listingDate);
        if (!listingDate) return false;
        const matchYear = listingDate.getFullYear() === year;
        const matchMonth = listingDate.getMonth() === index;
        return matchYear && matchMonth;
      });
      
      return {
        name: month,
        value: monthListings.length,
      };
    });
  }, [listings, selectedYear]);
  
  // Expenses by Category (Personal)
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

  const months = [
    { value: "all", label: "Todos os Meses" },
    { value: "0", label: "Janeiro" },
    { value: "1", label: "Fevereiro" },
    { value: "2", label: "Março" },
    { value: "3", label: "Abril" },
    { value: "4", label: "Maio" },
    { value: "5", label: "Junho" },
    { value: "6", label: "Julho" },
    { value: "7", label: "Agosto" },
    { value: "8", label: "Setembro" },
    { value: "9", label: "Outubro" },
    { value: "10", label: "Novembro" },
    { value: "11", label: "Dezembro" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header com saudação personalizada */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Olá, {user?.name || 'Corretor'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Acompanhe sua performance e gerencie seus negócios
          </p>
        </div>

        {/* Filtros de Período */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="year" className="text-sm font-medium mb-2 block">
                Ano
              </Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label htmlFor="month" className="text-sm font-medium mb-2 block">
                Mês
              </Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Métricas Principais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Minhas Vendas"
            value={mySales}
            icon={TrendingUp}
            trend="vendas realizadas"
          />
          <MetricCard
            title="Imóveis Ativos"
            value={myActiveListings}
            icon={Home}
            trend="imóveis listados"
          />
          <MetricCard
            title="Valor Total"
            value={`R$ ${myTotalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={DollarSign}
            trend="em vendas"
          />
          <MetricCard
            title="Tarefas Pendentes"
            value={myPendingTasks}
            icon={CheckSquare}
            trend="para concluir"
          />
        </div>

        {/* Segunda linha de métricas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="Minhas Despesas"
            value={`R$ ${myExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={TrendingDown}
            trend="no período"
          />
          <MetricCard
            title="Lucro Líquido"
            value={`R$ ${myNetProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={DollarSign}
            trend="receita - despesas"
          />
          <MetricCard
            title="Taxa de Conversão"
            value={`${conversionRate}%`}
            icon={Target}
            trend="vendas/listagens"
          />
        </div>

        {/* Resumos Rápidos */}
        <div className="grid gap-6 md:grid-cols-2">
          <GoalsSummary />
          <NotificationsSummary />
        </div>

        {/* Gráficos */}
        <div className="grid gap-6 md:grid-cols-2">
          <ChartCard
            title="Minhas Vendas por Mês"
            data={salesByMonthData}
            type="bar"
            dataKey="value"
          />
          <ChartCard
            title="Minhas Despesas por Mês"
            data={expensesByMonthData}
            type="line"
            dataKey="value"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <ChartCard
            title="Minhas Listagens por Mês"
            data={listingsByMonthData}
            type="bar"
            dataKey="value"
          />
          <ChartCard
            title="Minhas Despesas por Categoria"
            data={expensesByCategoryData}
            type="pie"
            dataKey="value"
          />
        </div>
      </main>
    </div>
  );
};

export default BrokerDashboard;
