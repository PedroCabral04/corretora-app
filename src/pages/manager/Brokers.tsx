import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { BrokerCard } from "@/components/BrokerCard";
import { FilterBar } from "@/components/FilterBar";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Input } from "@/components/ui/input";
import { Plus, Search, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/contexts/AuthContext';
import { useBrokers } from '@/contexts/BrokersContext';
import { BrokerCardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useFilterAndSort, usePagination } from "@/hooks/useFilterAndSort";
import { maskPhone, maskCRECI, validateEmail, validatePhone, validateRequired, getErrorMessage } from "@/lib/masks";

const Brokers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { brokers, isLoading, createBroker, updateBroker, deleteBroker } = useBrokers();
  const { toast } = useToast();
  
  // Filter and Sort
  const {
    filteredData: filteredBrokers,
    searchValue,
    setSearchValue,
    sortBy,
    setSortBy,
    clearFilters,
  } = useFilterAndSort({
    data: brokers,
    searchFields: ['name', 'email', 'creci'],
  });
  
  // Pagination
  const {
    paginatedData,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
  } = usePagination(filteredBrokers, 9);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBroker, setNewBroker] = useState({
    name: '',
    email: '',
    phone: '',
    creci: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [editingBroker, setEditingBroker] = useState<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    creci?: string;
  } | null>(null);
  const [brokerToDelete, setBrokerToDelete] = useState<{ id: string; name: string } | null>(null);

  // Redirecionar corretor para sua própria página de perfil
  useEffect(() => {
    const redirectBrokerToProfile = async () => {
      if (!user || isLoading) return;
      
      // Se o usuário é um corretor (não gerente ou admin)
      if (user.role === 'broker') {
        // Buscar o registro de broker correspondente ao usuário por email
        const userBroker = brokers.find(broker => 
          broker.email?.toLowerCase() === user.email.toLowerCase()
        );

        if (userBroker) {
          // Redirecionar para a página de perfil do corretor
          navigate(`/broker/profile`, { replace: true });
        } else {
          // Se não existe registro de broker, criar um automaticamente
          try {
            await createBroker({
              name: user.name,
              email: user.email,
              phone: '',
              creci: ''
            });
            
            // Redirecionar para a página de perfil
            navigate(`/broker/profile`, { replace: true });
          } catch (error) {
            console.error('Erro ao criar registro de corretor:', error);
            toast({
              title: 'Erro',
              description: 'Não foi possível criar seu perfil de corretor. Entre em contato com o administrador.',
              variant: 'destructive'
            });
          }
        }
      }
    };

    redirectBrokerToProfile();
  }, [user, isLoading, brokers, navigate, createBroker, toast]);

  const handleViewBrokerDetails = (brokerId: string) => {
    navigate(`/broker/${brokerId}`);
  };

  const validateBrokerForm = (broker: typeof newBroker): boolean => {
    const errors: Record<string, string> = {};

    if (!validateRequired(broker.name)) {
      errors.name = getErrorMessage('Nome', 'required');
    }

    if (broker.email && !validateEmail(broker.email)) {
      errors.email = getErrorMessage('Email', 'email');
    }

    if (broker.phone && !validatePhone(broker.phone)) {
      errors.phone = getErrorMessage('Telefone', 'phone');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskPhone(e.target.value);
    setNewBroker({ ...newBroker, phone: masked });
    if (formErrors.phone) {
      setFormErrors({ ...formErrors, phone: '' });
    }
  };

  const handleCreciChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCRECI(e.target.value);
    setNewBroker({ ...newBroker, creci: masked });
  };

  const handleEditPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingBroker) return;
    const masked = maskPhone(e.target.value);
    setEditingBroker({ ...editingBroker, phone: masked });
  };

  const handleEditCreciChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingBroker) return;
    const masked = maskCRECI(e.target.value);
    setEditingBroker({ ...editingBroker, creci: masked });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Corretores</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie sua equipe de corretores
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2 bg-primary-600 text-primary-foreground hover:bg-primary-700 bg-pink-700 hover:bg-pink-600">
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
                    <Label htmlFor="b-name">Nome *</Label>
                    <Input 
                      id="b-name" 
                      value={newBroker.name} 
                      onChange={e => {
                        setNewBroker({ ...newBroker, name: e.target.value });
                        if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                      }}
                      className={formErrors.name ? 'border-destructive' : ''}
                    />
                    {formErrors.name && <p className="text-sm text-destructive mt-1">{formErrors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="b-email">Email</Label>
                    <Input 
                      id="b-email" 
                      type="email"
                      value={newBroker.email} 
                      onChange={e => {
                        setNewBroker({ ...newBroker, email: e.target.value });
                        if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                      }}
                      onBlur={e => {
                        if (e.target.value && !validateEmail(e.target.value)) {
                          setFormErrors({ ...formErrors, email: getErrorMessage('Email', 'email') });
                        }
                      }}
                      className={formErrors.email ? 'border-destructive' : ''}
                      placeholder="exemplo@email.com"
                    />
                    {formErrors.email && <p className="text-sm text-destructive mt-1">{formErrors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="b-phone">Telefone</Label>
                    <Input 
                      id="b-phone" 
                      value={newBroker.phone} 
                      onChange={handlePhoneChange}
                      className={formErrors.phone ? 'border-destructive' : ''}
                      placeholder="(99) 99999-9999"
                      maxLength={15}
                    />
                    {formErrors.phone && <p className="text-sm text-destructive mt-1">{formErrors.phone}</p>}
                  </div>
                  <div>
                    <Label htmlFor="b-creci">CRECI</Label>
                    <Input 
                      id="b-creci" 
                      value={newBroker.creci} 
                      onChange={handleCreciChange}
                      placeholder="12345-F"
                      maxLength={7}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={async () => {
                      if (!validateBrokerForm(newBroker)) {
                        toast({
                          title: 'Erro de validação',
                          description: 'Por favor, corrija os erros no formulário',
                          variant: 'destructive'
                        });
                        return;
                      }
                      try {
                        await createBroker(newBroker);
                        toast({
                          title: 'Sucesso',
                          description: 'Corretor criado com sucesso'
                        });
                        setNewBroker({
                          name: '',
                          email: '',
                          phone: '',
                          creci: ''
                        });
                        setFormErrors({});
                        setIsDialogOpen(false);
                      } catch (err) {
                        toast({
                          title: 'Erro',
                          description: err instanceof Error ? err.message : 'Erro ao criar corretor',
                          variant: 'destructive'
                        });
                      }
                    }} className="w-full">Criar Corretor</Button>
                    <Button variant="ghost" onClick={() => {
                      setIsDialogOpen(false);
                      setNewBroker({ name: '', email: '', phone: '', creci: '' });
                      setFormErrors({});
                    }} className="w-full">Cancelar</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Edit Broker Dialog */}
        <Dialog open={!!editingBroker} onOpenChange={open => {
          if (!open) setEditingBroker(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Corretor</DialogTitle>
            </DialogHeader>
            {editingBroker && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="e-name">Nome</Label>
                  <Input 
                    id="e-name" 
                    value={editingBroker.name} 
                    onChange={e => setEditingBroker({
                      ...editingBroker,
                      name: e.target.value
                    })} 
                  />
                </div>
                <div>
                  <Label htmlFor="e-email">Email</Label>
                  <Input 
                    id="e-email" 
                    value={editingBroker.email} 
                    onChange={e => setEditingBroker({
                      ...editingBroker,
                      email: e.target.value
                    })} 
                  />
                </div>
                <div>
                  <Label htmlFor="e-phone">Telefone</Label>
                  <Input 
                    id="e-phone" 
                    value={editingBroker.phone} 
                    onChange={handleEditPhoneChange}
                    placeholder="(99) 99999-9999"
                    maxLength={15}
                  />
                </div>
                <div>
                  <Label htmlFor="e-creci">CRECI</Label>
                  <Input 
                    id="e-creci" 
                    value={editingBroker.creci} 
                    onChange={handleEditCreciChange}
                    placeholder="12345-F"
                    maxLength={7}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={async () => {
                    if (!editingBroker) return;
                    try {
                      await updateBroker(editingBroker.id, {
                        name: editingBroker.name,
                        email: editingBroker.email,
                        phone: editingBroker.phone,
                        creci: editingBroker.creci
                      });
                      toast({
                        title: 'Sucesso',
                        description: 'Corretor atualizado'
                      });
                      setEditingBroker(null);
                    } catch (err) {
                      toast({
                        title: 'Erro',
                        description: err instanceof Error ? err.message : 'Erro ao atualizar',
                        variant: 'destructive'
                      });
                    }
                  }} className="w-full">Salvar</Button>
                  <Button variant="ghost" onClick={() => setEditingBroker(null)} className="w-full">Cancelar</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={brokerToDelete !== null}
          onOpenChange={(open) => !open && setBrokerToDelete(null)}
          title="Excluir Corretor"
          description={`Tem certeza que deseja excluir ${brokerToDelete?.name}? Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          onConfirm={async () => {
            if (!brokerToDelete) return;
            try {
              await deleteBroker(brokerToDelete.id);
              toast({
                title: 'Corretor excluído com sucesso',
                description: `${brokerToDelete.name} foi removido do sistema`
              });
              setBrokerToDelete(null);
            } catch (err) {
              toast({
                title: 'Erro ao excluir',
                description: 'Não foi possível excluir o corretor',
                variant: 'destructive'
              });
            }
          }}
        />

        {/* Filtros */}
        <FilterBar
          searchPlaceholder="Buscar corretor por nome, email ou CRECI..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          sortOptions={[
            { label: 'Nome (A-Z)', value: 'name-asc' },
            { label: 'Nome (Z-A)', value: 'name-desc' },
            { label: 'Mais vendas', value: 'totalSales-desc' },
            { label: 'Menos vendas', value: 'totalSales-asc' },
          ]}
          selectedSort={sortBy}
          onSortChange={setSortBy}
          onClearFilters={clearFilters}
        />

        {/* Lista de Corretores */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            <BrokerCardSkeleton />
            <BrokerCardSkeleton />
            <BrokerCardSkeleton />
            <BrokerCardSkeleton />
            <BrokerCardSkeleton />
            <BrokerCardSkeleton />
          </div>
        ) : filteredBrokers.length === 0 ? (
          <div className="mt-6">
            {brokers.length === 0 ? (
              <EmptyState
                icon={UserPlus}
                title="Nenhum corretor cadastrado"
                description="Comece adicionando seu primeiro corretor ao sistema para gerenciar sua equipe e acompanhar suas vendas."
                actionLabel="Adicionar Primeiro Corretor"
                onAction={() => setIsDialogOpen(true)}
              />
            ) : (
              <EmptyState
                icon={Search}
                title="Nenhum corretor encontrado"
                description={`Não encontramos corretores com os filtros aplicados. Tente ajustar sua busca.`}
              />
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {paginatedData.map(broker => (
                <BrokerCard 
                  key={broker.id} 
                  broker={broker} 
                  onViewDetails={handleViewBrokerDetails} 
                  onEdit={id => {
                    const b = brokers.find(x => x.id === id);
                    if (!b) return;
                    setEditingBroker({
                      id: b.id,
                      name: b.name,
                      email: b.email,
                      phone: b.phone,
                      creci: b.creci
                    });
                  }} 
                  onDelete={id => {
                    const broker = brokers.find(b => b.id === id);
                    if (broker) {
                      setBrokerToDelete({ id: broker.id, name: broker.name });
                    }
                  }} 
                />
              ))}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Brokers;
