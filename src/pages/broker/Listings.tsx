import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Home } from "lucide-react";
import { useListings, Listing } from "@/contexts/ListingsContext";
import { toast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";

const Listings = () => {
  const { listings, isLoading, createListing, updateListing, deleteListing } = useListings();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    propertyType: "Apartamento" as Listing['propertyType'],
    quantity: 1,
    listingDate: new Date().toISOString().split('T')[0],
    status: "Ativo" as Listing['status'],
    brokerId: "",
  });

  const resetForm = () => {
    setFormData({
      propertyType: "Apartamento",
      quantity: 1,
      listingDate: new Date().toISOString().split('T')[0],
      status: "Ativo",
      brokerId: "",
    });
    setEditingListing(null);
  };

  const handleOpenDialog = (listing?: Listing) => {
    if (listing) {
      setEditingListing(listing);
      setFormData({
        propertyType: listing.propertyType,
        quantity: listing.quantity,
        listingDate: listing.listingDate,
        status: listing.status,
        brokerId: listing.brokerId,
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
      if (editingListing) {
        await updateListing(editingListing.id, formData);
        toast({
          title: "Listagem atualizada!",
          description: "As informações foram atualizadas com sucesso.",
        });
      } else {
        await createListing(formData);
        toast({
          title: "Listagem adicionada!",
          description: "A nova listagem foi cadastrada com sucesso.",
        });
      }
      handleCloseDialog();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar listagem",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta listagem?")) return;
    
    try {
      await deleteListing(id);
      toast({
        title: "Listagem excluída",
        description: "A listagem foi removida com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir listagem",
        variant: "destructive",
      });
    }
  };

  // Filtrar listagens
  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.propertyType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || listing.status === statusFilter;
    const matchesType = typeFilter === "all" || listing.propertyType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: Listing['status']) => {
    const statusConfig = {
      "Ativo": { variant: "default" as const, label: "Ativo" },
      "Vendido": { variant: "secondary" as const, label: "Vendido" },
      "Desativado": { variant: "outline" as const, label: "Desativado" },
      "Moderação": { variant: "outline" as const, label: "Moderação" },
      "Agregado": { variant: "outline" as const, label: "Agregado" },
    };
    
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const activeListings = listings.filter(l => l.status === 'Ativo');
  const soldListings = listings.filter(l => l.status === 'Vendido');
  const totalQuantity = activeListings.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Minhas Listagens</h1>
            <p className="text-muted-foreground">
              Gerencie suas listagens de imóveis por tipo
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Listagem
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Listagens Ativas</CardTitle>
              <Home className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeListings.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Listagens Vendidas</CardTitle>
              <Home className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{soldListings.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Imóveis</CardTitle>
              <Home className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuantity}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por tipo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Vendido">Vendido</SelectItem>
                  <SelectItem value="Desativado">Desativado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="Apartamento">Apartamento</SelectItem>
                  <SelectItem value="Casa">Casa</SelectItem>
                  <SelectItem value="Sobrado">Sobrado</SelectItem>
                  <SelectItem value="Lote">Lote</SelectItem>
                  <SelectItem value="Chácara">Chácara</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Listagens */}
        {isLoading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : filteredListings.length === 0 ? (
          <EmptyState
            icon={Home}
            title="Nenhuma listagem encontrada"
            description="Comece adicionando sua primeira listagem para gerenciar seus imóveis."
            actionLabel="Adicionar Listagem"
            onAction={() => handleOpenDialog()}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((listing) => (
              <Card key={listing.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    {getStatusBadge(listing.status)}
                  </div>
                  <CardTitle className="text-lg">{listing.propertyType}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Quantidade:</span>
                      <span className="text-2xl font-bold text-primary">{listing.quantity}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Listado em {new Date(listing.listingDate).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDialog(listing)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(listing.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                    Excluir
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Dialog de Adicionar/Editar Listagem */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingListing ? "Editar Listagem" : "Nova Listagem"}
              </DialogTitle>
              <DialogDescription>
                {editingListing 
                  ? "Atualize as informações da listagem" 
                  : "Preencha os dados da nova listagem"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="propertyType">Tipo de Imóvel *</Label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(value: Listing['propertyType']) => 
                    setFormData({ ...formData, propertyType: value })
                  }
                >
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

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantidade *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="listingDate">Data de Listagem *</Label>
                  <Input
                    id="listingDate"
                    type="date"
                    value={formData.listingDate}
                    onChange={(e) => setFormData({ ...formData, listingDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Listing['status']) => 
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Vendido">Vendido</SelectItem>
                    <SelectItem value="Desativado">Desativado</SelectItem>
                    <SelectItem value="Moderação">Moderação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingListing ? "Salvar Alterações" : "Adicionar Listagem"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Listings;
