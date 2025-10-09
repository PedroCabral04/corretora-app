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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClients } from "@/contexts/ClientsContext";
import { useBrokers } from "@/contexts/BrokersContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit } from "lucide-react";

export default function Clients() {
  const { clients, addClient, updateClient, deleteClient, loading } = useClients();
  const { brokers } = useBrokers();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    broker_id: "",
    client_name: "",
    interest: "",
    negotiation_status: "",
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      broker_id: "",
      client_name: "",
      interest: "",
      negotiation_status: "",
      is_active: true,
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await updateClient(editingId, formData);
        toast({ title: "Cliente atualizado com sucesso!" });
      } else {
        await addClient(formData);
        toast({ title: "Cliente adicionado com sucesso!" });
      }
      setOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Erro ao salvar cliente",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (client: any) => {
    setFormData({
      broker_id: client.broker_id,
      client_name: client.client_name,
      interest: client.interest,
      negotiation_status: client.negotiation_status,
      is_active: client.is_active,
    });
    setEditingId(client.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Clientes</h1>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Editar Cliente" : "Novo Cliente"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="broker_id">Corretor</Label>
                  <Select
                    value={formData.broker_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, broker_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um corretor" />
                    </SelectTrigger>
                    <SelectContent>
                      {brokers.map((broker) => (
                        <SelectItem key={broker.id} value={broker.id}>
                          {broker.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="client_name">Nome do Cliente</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) =>
                      setFormData({ ...formData, client_name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="interest">Interesse</Label>
                  <Input
                    id="interest"
                    value={formData.interest}
                    onChange={(e) =>
                      setFormData({ ...formData, interest: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="negotiation_status">Status da Negociação</Label>
                  <Input
                    id="negotiation_status"
                    value={formData.negotiation_status}
                    onChange={(e) =>
                      setFormData({ ...formData, negotiation_status: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="is_active">Cliente Ativo</Label>
                </div>

                <Button type="submit" className="w-full">
                  {editingId ? "Atualizar" : "Adicionar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Interesse</TableHead>
                <TableHead>Negociação</TableHead>
                <TableHead>Corretor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Nenhum cliente cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => {
                  const broker = brokers.find((b) => b.id === client.broker_id);
                  return (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div
                          className={`h-3 w-3 rounded-full ${
                            client.is_active ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {client.client_name}
                      </TableCell>
                      <TableCell>{client.interest}</TableCell>
                      <TableCell>{client.negotiation_status}</TableCell>
                      <TableCell>{broker?.name || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(client)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(client.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
