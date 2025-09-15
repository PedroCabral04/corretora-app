import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverEvent
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  Plus, 
  CheckSquare, 
  Clock, 
  Calendar,
  Search,
  Edit,
  Trash2,
  AlertCircle,
  Play,
  Pause,
  CheckCircle,
  FileText
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type TaskStatus = "Backlog" | "Em Progresso" | "Em Revisão" | "Concluída";

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  status: TaskStatus;
  createdAt: string;
  priority: "Baixa" | "Média" | "Alta";
}

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  icon: React.ComponentType<{ className?: string }>;
  onAddTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

interface SortableTaskProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const SortableTask = ({ task, onEdit, onDelete }: SortableTaskProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Alta": return "destructive";
      case "Média": return "default";
      case "Baixa": return "secondary";
      default: return "secondary";
    }
  };

  const isOverdue = task.status !== "Concluída" && new Date(task.dueDate) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <Card className={`mb-3 transition-all duration-200 hover:shadow-md ${
        isOverdue ? 'border-destructive/50 bg-destructive/5' : ''
      }`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
              <div className="flex items-center space-x-1 ml-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {task.description && (
              <p className="text-xs text-muted-foreground">{task.description}</p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                  {task.priority}
                </Badge>
                {isOverdue && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Atrasada
                  </Badge>
                )}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(task.dueDate).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const KanbanColumn = ({ title, status, tasks, icon: Icon, onAddTask, onEditTask, onDeleteTask }: KanbanColumnProps) => {
  return (
    <div className="bg-muted/30 rounded-lg p-4 min-h-[600px] w-80">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Icon className="h-4 w-4" />
          <h3 className="font-semibold text-sm">{title}</h3>
          <Badge variant="secondary" className="text-xs">{tasks.length}</Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => onAddTask(status)}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {tasks.map(task => (
            <SortableTask 
              key={task.id} 
              task={task} 
              onEdit={onEditTask} 
              onDelete={onDeleteTask} 
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

const Tasks = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    status: "Backlog" as TaskStatus,
    priority: "Média" as "Baixa" | "Média" | "Alta"
  });

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Criar campanha de marketing Q1",
      description: "Definir estratégia e materiais para campanhas do primeiro trimestre",
      dueDate: "2024-02-15",
      status: "Backlog",
      priority: "Alta",
      createdAt: "2024-01-10"
    },
    {
      id: "2",
      title: "Reunião com equipe comercial",
      description: "Alinhamento de metas e processos",
      dueDate: "2024-01-20",
      status: "Em Progresso",
      priority: "Média",
      createdAt: "2024-01-05"
    },
    {
      id: "3",
      title: "Análise de resultados dezembro",
      description: "Revisar métricas e performance da equipe",
      dueDate: "2024-01-25",
      status: "Em Revisão",
      priority: "Alta",
      createdAt: "2024-01-12"
    },
    {
      id: "4",
      title: "Atualizar documentação",
      description: "Revisar e atualizar processos internos",
      dueDate: "2024-01-18",
      status: "Concluída",
      priority: "Baixa",
      createdAt: "2024-01-08"
    }
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const columns: { status: TaskStatus; title: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { status: "Backlog", title: "Backlog", icon: FileText },
    { status: "Em Progresso", title: "Em Progresso", icon: Play },
    { status: "Em Revisão", title: "Em Revisão", icon: Pause },
    { status: "Concluída", title: "Concluída", icon: CheckCircle }
  ];

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const getTasksByStatus = (status: TaskStatus) => 
    filteredTasks.filter(task => task.status === status);

  const pendingTasks = tasks.filter(task => task.status !== "Concluída").length;
  const completedTasks = tasks.filter(task => task.status === "Concluída").length;
  const overdueTasks = tasks.filter(task => 
    task.status !== "Concluída" && new Date(task.dueDate) < new Date()
  ).length;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeTaskId = active.id as string;
    const overTaskId = over.id as string;
    
    // Se estamos sobre uma coluna (não sobre uma tarefa)
    if (columns.some(col => col.status === overTaskId)) {
      const newStatus = overTaskId as TaskStatus;
      setTasks(tasks => tasks.map(task => 
        task.id === activeTaskId ? { ...task, status: newStatus } : task
      ));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTaskId = active.id as string;
    const overTaskId = over.id as string;

    // Se soltar sobre uma coluna, mover para essa coluna
    const targetColumn = columns.find(col => col.status === overTaskId);
    if (targetColumn) {
      setTasks(tasks => tasks.map(task => 
        task.id === activeTaskId 
          ? { ...task, status: targetColumn.status }
          : task
      ));
      
      toast({
        title: "Tarefa movida",
        description: `Tarefa movida para ${targetColumn.title}`,
      });
    }
  };

  const openModal = (status?: TaskStatus) => {
    setFormData({
      title: "",
      description: "",
      dueDate: "",
      status: status || "Backlog",
      priority: "Média"
    });
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const editTask = (task: Task) => {
    setFormData({
      title: task.title,
      description: task.description || "",
      dueDate: task.dueDate,
      status: task.status,
      priority: task.priority
    });
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.dueDate) {
      toast({
        title: "Erro",
        description: "Preencha pelo menos o título e a data",
        variant: "destructive"
      });
      return;
    }

    if (editingTask) {
      setTasks(tasks => tasks.map(task => 
        task.id === editingTask.id 
          ? { ...task, ...formData }
          : task
      ));
      toast({
        title: "Sucesso",
        description: "Tarefa atualizada com sucesso",
      });
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setTasks(tasks => [...tasks, newTask]);
      toast({
        title: "Sucesso",
        description: "Tarefa criada com sucesso",
      });
    }

    setIsModalOpen(false);
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks => tasks.filter(task => task.id !== taskId));
    toast({
      title: "Tarefa excluída",
      description: "A tarefa foi removida com sucesso",
    });
  };

  const activeTask = activeId ? tasks.find(task => task.id === activeId) : null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Kanban de Tarefas</h1>
            <p className="text-muted-foreground mt-1">
              Organize suas demandas e atividades
            </p>
          </div>
          <Button onClick={() => openModal()} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nova Tarefa</span>
          </Button>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Tarefas Pendentes"
            value={pendingTasks}
            icon={Clock}
            variant="warning"
          />
          <MetricCard
            title="Tarefas Concluídas"
            value={completedTasks}
            icon={CheckSquare}
            variant="success"
          />
          <MetricCard
            title="Tarefas Atrasadas"
            value={overdueTasks}
            icon={AlertCircle}
            variant="info"
          />
        </div>

        {/* Busca */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar tarefa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Kanban Board */}
        <DndContext 
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 overflow-x-auto pb-4">
            {columns.map(column => (
              <div key={column.status}>
                <KanbanColumn
                  title={column.title}
                  status={column.status}
                  tasks={getTasksByStatus(column.status)}
                  icon={column.icon}
                  onAddTask={() => openModal(column.status)}
                  onEditTask={editTask}
                  onDeleteTask={deleteTask}
                />
              </div>
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <Card className="opacity-90 rotate-3 shadow-lg">
                <CardContent className="p-4">
                  <h4 className="font-medium text-sm">{activeTask.title}</h4>
                </CardContent>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Editar Tarefa" : "Nova Tarefa"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Digite o título da tarefa"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Digite uma descrição (opcional)"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dueDate">Data de Entrega *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: "Baixa" | "Média" | "Alta") => 
                    setFormData({...formData, priority: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: TaskStatus) => 
                  setFormData({...formData, status: value})
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Backlog">Backlog</SelectItem>
                  <SelectItem value="Em Progresso">Em Progresso</SelectItem>
                  <SelectItem value="Em Revisão">Em Revisão</SelectItem>
                  <SelectItem value="Concluída">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {editingTask ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tasks;