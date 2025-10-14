import React, { useState, useEffect } from 'react';
import { useGoals, Goal, GoalType, GoalPriority } from "@/contexts/GoalsContext";
import { useBrokers } from "@/contexts/BrokersContext";
import { Navigation } from "@/components/Navigation";
import { GoalCard } from "@/components/GoalCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Target, TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Goals() {
  const { goals, isLoading, createGoal, updateGoal, deleteGoal, getActiveGoals, getCompletedGoals, getOverdueGoals } = useGoals();
  const { brokers } = useBrokers();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    brokerId: '',
    title: '',
    description: '',
    goalType: 'sales_count' as GoalType,
    targetValue: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    priority: 'medium' as GoalPriority
  });

  const resetForm = () => {
    setFormData({
      brokerId: '',
      title: '',
      description: '',
      goalType: 'sales_count',
      targetValue: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      priority: 'medium'
    });
    setEditingGoal(null);
  };

  const handleOpenDialog = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        brokerId: goal.brokerId,
        title: goal.title,
        description: goal.description || '',
        goalType: goal.goalType,
        targetValue: goal.targetValue.toString(),
        startDate: goal.startDate,
        endDate: goal.endDate,
        priority: goal.priority
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

    if (!formData.brokerId || !formData.title || !formData.targetValue || !formData.endDate) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, {
          brokerId: formData.brokerId,
          title: formData.title,
          description: formData.description,
          goalType: formData.goalType,
          targetValue: parseFloat(formData.targetValue),
          startDate: formData.startDate,
          endDate: formData.endDate,
          priority: formData.priority
        });
        toast({
          title: "Sucesso",
          description: "Meta atualizada com sucesso!"
        });
      } else {
        await createGoal({
          brokerId: formData.brokerId,
          title: formData.title,
          description: formData.description,
          goalType: formData.goalType,
          targetValue: parseFloat(formData.targetValue),
          startDate: formData.startDate,
          endDate: formData.endDate,
          priority: formData.priority
        });
        toast({
          title: "Sucesso",
          description: "Meta criada com sucesso!"
        });
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving goal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a meta",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return;

    try {
      await deleteGoal(id);
      toast({
        title: "Sucesso",
        description: "Meta excluída com sucesso!"
      });
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a meta",
        variant: "destructive"
      });
    }
  };

  const getBrokerName = (brokerId: string): string => {
    const broker = brokers.find(b => b.id === brokerId);
    return broker?.name || 'Corretor desconhecido';
  };

  const activeGoals = getActiveGoals();
  const completedGoals = getCompletedGoals();
  const overdueGoals = getOverdueGoals();

  const filteredGoals = () => {
    switch (activeTab) {
      case 'active':
        return activeGoals;
      case 'completed':
        return completedGoals;
      case 'overdue':
        return overdueGoals;
      default:
        return goals;
    }
  };

  // Calculate statistics
  const totalGoals = goals.length;
  const activeCount = activeGoals.length;
  const completedCount = completedGoals.length;
  const overdueCount = overdueGoals.length;
  const completionRate = totalGoals > 0 ? (completedCount / totalGoals) * 100 : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto p-6">
          <div className="p-8">Carregando metas...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Metas e Acompanhamento</h1>
          <p className="text-muted-foreground">Gerencie e acompanhe as metas dos seus corretores</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Meta
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Metas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGoals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metas Ativas</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metas Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {completionRate.toFixed(1)}% de conclusão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metas Atrasadas</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Goals List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            Todas ({totalGoals})
          </TabsTrigger>
          <TabsTrigger value="active">
            Ativas ({activeCount})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Concluídas ({completedCount})
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Atrasadas ({overdueCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {filteredGoals().length === 0 ? (
            <Card className="p-12">
              <div className="text-center space-y-2">
                <Target className="w-12 h-12 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-semibold">Nenhuma meta encontrada</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'all' 
                    ? 'Crie sua primeira meta para começar a acompanhar o desempenho'
                    : `Não há metas ${activeTab === 'active' ? 'ativas' : activeTab === 'completed' ? 'concluídas' : 'atrasadas'} no momento`
                  }
                </p>
                {activeTab === 'all' && (
                  <Button onClick={() => handleOpenDialog()} className="gap-2 mt-4">
                    <Plus className="w-4 h-4" />
                    Criar Meta
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredGoals().map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  brokerName={getBrokerName(goal.brokerId)}
                  onEdit={handleOpenDialog}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Goal Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Editar Meta' : 'Nova Meta'}</DialogTitle>
            <DialogDescription>
              {editingGoal 
                ? 'Atualize as informações da meta' 
                : 'Defina uma nova meta para acompanhamento de desempenho'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="brokerId">Corretor *</Label>
                <Select
                  value={formData.brokerId}
                  onValueChange={(value) => setFormData({ ...formData, brokerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um corretor" />
                  </SelectTrigger>
                  <SelectContent>
                    {brokers.map(broker => (
                      <SelectItem key={broker.id} value={broker.id}>
                        {broker.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label htmlFor="title">Título da Meta *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Atingir 10 vendas no trimestre"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalhes adicionais sobre a meta..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="goalType">Tipo de Meta *</Label>
                <Select
                  value={formData.goalType}
                  onValueChange={(value: GoalType) => setFormData({ ...formData, goalType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales_count">Número de Vendas</SelectItem>
                    <SelectItem value="sales_value">Valor de Vendas</SelectItem>
                    <SelectItem value="listings">Captações</SelectItem>
                    <SelectItem value="meetings">Reuniões</SelectItem>
                    <SelectItem value="tasks">Tarefas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="targetValue">Valor Alvo *</Label>
                <Input
                  id="targetValue"
                  type="number"
                  step="0.01"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="startDate">Data de Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="endDate">Data de Término *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: GoalPriority) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingGoal ? 'Atualizar' : 'Criar'} Meta
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </main>
    </div>
  );
}
