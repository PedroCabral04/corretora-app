import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, DollarSign, TrendingUp, Percent, Building2, Home } from "lucide-react";
import { useSales, Sale, SaleType } from "@/contexts/SalesContext";
import { toast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";
import { formatDateBR } from "@/lib/utils";

const Sales = () => {
  const { sales, isLoading, createSale, updateSale, deleteSale } = useSales();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    clientName: "",
    propertyAddress: "",
    saleValue: "",
    saleDate: new Date().toISOString().split('T')[0],
    commission: "",
    brokerId: "",
    saleType: "revenda" as SaleType,
  });

  const resetForm = () => {
    setFormData({
      clientName: "",
      propertyAddress: "",
      saleValue: "",
      saleDate: new Date().toISOString().split('T')[0],
      commission: "",
      brokerId: "",
      saleType: "revenda" as SaleType,
    });
    setEditingSale(null);
  };

  const handleOpenDialog = (sale?: Sale) => {
    if (sale) {
      setEditingSale(sale);
      setFormData({
        clientName: sale.clientName,
        propertyAddress: sale.propertyAddress,
        saleValue: sale.saleValue.toString(),
        saleDate: sale.saleDate,
        commission: sale.commission?.toString() || "",
        brokerId: sale.brokerId,
        saleType: sale.saleType || "revenda",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const saleData = {
        ...formData,
        saleValue: parseFloat(formData.saleValue),
        commission: formData.commission ? parseFloat(formData.commission) : undefined,
      };

      if (editingSale) {
        await updateSale(editingSale.id, saleData);
        toast({
          title: "Venda atualizada!",
          description: "As informações da venda foram atualizadas com sucesso.",
        });
      } else {
        await createSale(saleData);
        toast({
          title: "Venda registrada!",
          description: "A nova venda foi cadastrada com sucesso.",
        });
      }
      handleCloseDialog();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar venda",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta venda?")) return;

    try {
      await deleteSale(id);
      toast({
        title: "Venda excluída",
        description: "A venda foi removida com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir venda",
        variant: "destructive",
      });
    }
  };

  // Filtrar vendas
  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calcular totais
  const totalSales = sales.length;
  const totalValue = sales.reduce((sum, sale) => sum + sale.saleValue, 0);
  const totalCommission = sales.reduce((sum, sale) => sum + (sale.commission || 0), 0);
  const averageTicket = totalSales > 0 ? totalValue / totalSales : 0;

  // Calcular VGV por tipo de venda
  const lancamentoSales = sales.filter(sale => sale.saleType === 'lancamento');
  const revendaSales = sales.filter(sale => sale.saleType === 'revenda');

  const vgvLancamento = lancamentoSales.reduce((sum, sale) => sum + sale.saleValue, 0);
  const vgvRevenda = revendaSales.reduce((sum, sale) => sum + sale.saleValue, 0);

  const totalLancamento = lancamentoSales.length;
  const totalRevenda = revendaSales.length;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Minhas Vendas</h1>
            <p className="text-muted-foreground">
              Registre e acompanhe suas vendas e comissões
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Venda
          </Button>
        </div>

        {/* Stats Cards - VGV Geral */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSales}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">VGV Geral</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comissões</CardTitle>
              <Percent className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalCommission)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(averageTicket)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards - VGV por Tipo */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium">VGV Lançamento</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalLancamento} {totalLancamento === 1 ? 'venda' : 'vendas'}
                </p>
              </div>
              <Building2 className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(vgvLancamento)}</div>
              {totalValue > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {((vgvLancamento / totalValue) * 100).toFixed(1)}% do total
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium">VGV Revenda</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalRevenda} {totalRevenda === 1 ? 'venda' : 'vendas'}
                </p>
              </div>
              <Home className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(vgvRevenda)}</div>
              {totalValue > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {((vgvRevenda / totalValue) * 100).toFixed(1)}% do total
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por cliente ou endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Vendas */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : filteredSales.length === 0 ? (
              <EmptyState
                icon={DollarSign}
                title="Nenhuma venda registrada"
                description="Comece registrando sua primeira venda para acompanhar seu desempenho."
                actionLabel="Registrar Venda"
                onAction={() => handleOpenDialog()}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Imóvel</TableHead>
                      <TableHead>Valor da Venda</TableHead>
                      <TableHead>Comissão</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          {formatDateBR(sale.saleDate)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              sale.saleType === 'lancamento'
                                ? 'border-orange-500 text-orange-600 bg-orange-50'
                                : 'border-emerald-500 text-emerald-600 bg-emerald-50'
                            }
                          >
                            {sale.saleType === 'lancamento' ? 'Lançamento' : 'Revenda'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{sale.clientName}</TableCell>
                        <TableCell>{sale.propertyAddress}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {formatCurrency(sale.saleValue)}
                        </TableCell>
                        <TableCell className="font-semibold text-blue-600">
                          {sale.commission ? formatCurrency(sale.commission) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(sale)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(sale.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Dialog de Adicionar/Editar Venda */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingSale ? "Editar Venda" : "Registrar Venda"}
              </DialogTitle>
              <DialogDescription>
                {editingSale
                  ? "Atualize as informações da venda"
                  : "Preencha os dados da nova venda"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="saleType">Tipo de Venda *</Label>
                <Select
                  value={formData.saleType}
                  onValueChange={(value: SaleType) => setFormData({ ...formData, saleType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lancamento">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-orange-500" />
                        <span>Lançamento</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="revenda">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-emerald-500" />
                        <span>Revenda</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="clientName">Nome do Cliente *</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="Maria Silva"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="propertyAddress">Endereço do Imóvel *</Label>
                <Input
                  id="propertyAddress"
                  value={formData.propertyAddress}
                  onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                  placeholder="Rua das Flores, 123"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="saleValue">Valor da Venda * (R$)</Label>
                  <Input
                    id="saleValue"
                    type="number"
                    step="0.01"
                    value={formData.saleValue}
                    onChange={(e) => setFormData({ ...formData, saleValue: e.target.value })}
                    placeholder="500000.00"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="saleDate">Data da Venda *</Label>
                  <Input
                    id="saleDate"
                    type="date"
                    value={formData.saleDate}
                    onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="commission">Comissão (R$)</Label>
                <Input
                  id="commission"
                  type="number"
                  step="0.01"
                  value={formData.commission}
                  onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                  placeholder="15000.00"
                />
                <p className="text-xs text-muted-foreground">
                  Deixe em branco se ainda não foi calculada
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingSale ? "Salvar Alterações" : "Registrar Venda"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sales;
