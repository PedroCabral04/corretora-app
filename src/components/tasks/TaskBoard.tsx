import { useMemo, useState } from "react";
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
  DragOverEvent,
  useDroppable,
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
  FileText,
  ListTodo,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useTasks, TaskStatus, Task } from "@/contexts/TasksContext";
import { TaskCardSkeleton, MetricCardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { cn } from "@/lib/utils";

const TRASH_DROP_PREFIX = "task-trash-";

interface TaskBoardProps {
  brokerId?: string | null;
  title?: string;
  description?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  className?: string;
}

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  icon: React.ComponentType<{ className?: string }>;
  onAddTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  trashDroppableId: string;
  isDragging: boolean;
}

interface SortableTaskProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const TrashDropZone = ({ droppableId, isDragging }: { droppableId: string; isDragging: boolean }) => {
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });
  const visible = isDragging || isOver;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "mt-auto flex items-center justify-center gap-2 rounded-lg border-2 border-dashed px-3 text-xs font-medium transition-all duration-200",
        visible ? "opacity-100 py-2 pt-4" : "opacity-0 py-0",
        visible ? "border-destructive/60 bg-destructive/10 text-destructive" : "border-transparent text-transparent",
        visible ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!visible && !isOver}
    >
      <Trash2 className="h-4 w-4" />
      <span>Arraste aqui para excluir</span>
    </div>
  );
};

const SortableTask = ({ task, onEdit, onDelete }: SortableTaskProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Alta":
        return "destructive";
      case "Média":
        return "default";
      case "Baixa":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const isOverdue = task.status !== "Concluída" && new Date(task.dueDate) < new Date();

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
      <Card
        className={cn(
          "mb-3 transition-all duration-200 hover:shadow-md",
          isOverdue ? "border-destructive/50 bg-destructive/5" : undefined,
        )}
      >
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

            {task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}

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
                {new Date(task.dueDate).toLocaleDateString("pt-BR")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const KanbanColumn = ({ title, status, tasks, icon: Icon, onAddTask, onEditTask, onDeleteTask, trashDroppableId, isDragging }: KanbanColumnProps) => {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      data-droppable-id={status}
      className="bg-muted/30 rounded-lg p-4 min-h-[520px] w-80 sm:w-72 md:w-80 lg:w-80 mobile:w-[85vw] flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Icon className="h-4 w-4" />
          <h3 className="font-semibold text-sm">{title}</h3>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onAddTask(status)}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="flex h-full flex-col">
          <div className="space-y-2 flex-1">
            {tasks.map((task) => (
              <SortableTask key={task.id} task={task} onEdit={onEditTask} onDelete={onDeleteTask} />
            ))}
          </div>
          <TrashDropZone droppableId={trashDroppableId} isDragging={isDragging} />
        </div>
      </SortableContext>
    </div>
  );
};

export const TaskBoard = ({
  brokerId,
  title = "Kanban de Tarefas",
  description = "Organize e acompanhe as tarefas da equipe",
  emptyStateTitle = "Nenhuma tarefa encontrada",
  emptyStateDescription = "Adicione sua primeira tarefa para começar",
  className,
}: TaskBoardProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string } | null>(null);
  const { toast } = useToast();
  const { tasks, isLoading, createTask, updateTask, deleteTask: removeTask } = useTasks();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    status: "Backlog" as TaskStatus,
    priority: "Média" as "Baixa" | "Média" | "Alta",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const columns: { status: TaskStatus; title: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { status: "Backlog", title: "Backlog", icon: FileText },
    { status: "Em Progresso", title: "Em Progresso", icon: Play },
    { status: "Em Revisão", title: "Em Revisão", icon: Pause },
    { status: "Concluída", title: "Concluída", icon: CheckCircle },
  ];

  const getTrashZoneId = (status: TaskStatus) => `${TRASH_DROP_PREFIX}${status.replace(/\s+/g, "-")}`;

  const boardTasks = useMemo(() => {
    if (brokerId === undefined) {
      return tasks;
    }
    if (brokerId === null) {
      return tasks.filter((task) => !task.brokerId);
    }
    return tasks.filter((task) => task.brokerId === brokerId);
  }, [tasks, brokerId]);

  const filteredTasks = boardTasks.filter((task) => {
    const term = searchTerm.toLowerCase();
    return (
      task.title.toLowerCase().includes(term) ||
      (task.description ? task.description.toLowerCase().includes(term) : false)
    );
  });

  const getTasksByStatus = (status: TaskStatus) => filteredTasks.filter((task) => task.status === status);

  const pendingTasks = boardTasks.filter((task) => task.status !== "Concluída").length;
  const completedTasks = boardTasks.filter((task) => task.status === "Concluída").length;
  const overdueTasks = boardTasks.filter(
    (task) => task.status !== "Concluída" && new Date(task.dueDate) < new Date(),
  ).length;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const activeTaskId = active.id as string;
    const overTaskId = String(over.id);

    if (overTaskId.startsWith(TRASH_DROP_PREFIX)) {
      return;
    }

    const columnMatch = columns.find((col) => col.status === overTaskId);
    if (columnMatch) {
      const newStatus = columnMatch.status;
      updateTask(activeTaskId, { status: newStatus }, { optimistic: true }).catch((err) => {
        console.error(err);
        toast({ title: "Erro", description: "Não foi possível mover a tarefa", variant: "destructive" });
      });
      return;
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTaskId = active.id as string;
    const overTaskId = String(over.id);

    if (overTaskId.startsWith(TRASH_DROP_PREFIX)) {
      const removedTask = boardTasks.find((task) => task.id === activeTaskId);
      removeTask(activeTaskId, { optimistic: true })
        .then(() => {
          toast({
            title: "Tarefa excluída",
            description: removedTask ? `"${removedTask.title}" foi removida.` : "A tarefa foi removida.",
          });
        })
        .catch((err) => {
          console.error(err);
          toast({ title: "Erro", description: "Não foi possível excluir a tarefa", variant: "destructive" });
        });
      return;
    }

    const targetColumn = columns.find((col) => col.status === overTaskId);
    if (targetColumn) {
      updateTask(activeTaskId, { status: targetColumn.status }, { optimistic: true })
        .then(() => {
          toast({ title: "Tarefa movida", description: `Tarefa movida para ${targetColumn.title}` });
        })
        .catch((err) => {
          console.error(err);
          toast({ title: "Erro", description: "Não foi possível mover a tarefa", variant: "destructive" });
        });
      return;
    }

  const targetTask = filteredTasks.find((t) => t.id === overTaskId);
    if (targetTask) {
      updateTask(activeTaskId, { status: targetTask.status }, { optimistic: true })
        .then(() => {
          toast({ title: "Tarefa movida", description: `Tarefa movida para ${targetTask.status}` });
        })
        .catch((err) => {
          console.error(err);
          toast({ title: "Erro", description: "Não foi possível mover a tarefa", variant: "destructive" });
        });
    }
  };

  const openModal = (status?: TaskStatus) => {
    setEditingTask(null);
    setFormData({
      title: "",
      description: "",
      dueDate: "",
      status: status || "Backlog",
      priority: "Média",
    });
    setIsModalOpen(true);
  };

  const editTask = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      dueDate: task.dueDate,
      status: task.status,
      priority: task.priority,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.dueDate) {
      toast({ title: "Erro", description: "Preencha pelo menos o título e a data", variant: "destructive" });
      return;
    }

    const payload: Omit<Task, "id" | "createdAt"> = {
      ...formData,
      ...(brokerId !== undefined ? { brokerId } : {}),
    };

    if (editingTask) {
      updateTask(editingTask.id, payload, { optimistic: true })
        .then(() => {
          toast({ title: "Sucesso", description: "Tarefa atualizada com sucesso" });
          setIsModalOpen(false);
          // Reset form after update
          setFormData({
            title: "",
            description: "",
            dueDate: "",
            status: "Backlog",
            priority: "Média",
          });
          setEditingTask(null);
        })
        .catch((err) => {
          console.error(err);
          toast({ title: "Erro", description: "Não foi possível atualizar a tarefa", variant: "destructive" });
        });
    } else {
      createTask(payload, { optimistic: true })
        .then(() => {
          toast({ title: "Sucesso", description: "Tarefa criada com sucesso" });
          setIsModalOpen(false);
          // Reset form after create
          setFormData({
            title: "",
            description: "",
            dueDate: "",
            status: "Backlog",
            priority: "Média",
          });
        })
        .catch((err) => {
          console.error(err);
          toast({ title: "Erro", description: "Não foi possível criar a tarefa", variant: "destructive" });
        });
    }
  };

  const deleteTask = (taskId: string) => {
    const task = filteredTasks.find((t) => t.id === taskId);
    if (task) {
      setTaskToDelete({ id: task.id, title: task.title });
    }
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;

    try {
      await removeTask(taskToDelete.id, { optimistic: true });
      toast({ title: "Tarefa excluída", description: `"${taskToDelete.title}" foi removida com sucesso` });
      setTaskToDelete(null);
    } catch (err) {
      console.error(err);
      toast({ title: "Erro", description: "Não foi possível excluir a tarefa", variant: "destructive" });
    }
  };

  const activeTask = activeId ? boardTasks.find((task) => task.id === activeId) : null;

  return (
    <div className={cn("space-y-8", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tarefa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Dialog open={isModalOpen} onOpenChange={(open) => {
            if (open && !editingTask) {
              // Reset form BEFORE opening when creating new task
              setFormData({
                title: "",
                description: "",
                dueDate: "",
                status: "Backlog",
                priority: "Média",
              });
              setEditingTask(null);
            }
            
            setIsModalOpen(open);
            
            if (!open) {
              // Also reset when closing
              setFormData({
                title: "",
                description: "",
                dueDate: "",
                status: "Backlog",
                priority: "Média",
              });
              setEditingTask(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-pink-700 hover:bg-pink-600">
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent key={editingTask ? editingTask.id : 'new-task'}>
              <DialogHeader>
                <DialogTitle>{editingTask ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="task-title">Título</Label>
                  <Input
                    key={`title-${editingTask?.id || 'new'}`}
                    id="task-title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Preparar proposta para cliente"
                  />
                </div>
                <div>
                  <Label htmlFor="task-description">Descrição</Label>
                  <Textarea
                    key={`description-${editingTask?.id || 'new'}`}
                    id="task-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Adicione detalhes importantes..."
                    rows={4}
                    className="resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="task-due-date">Data</Label>
                    <Input
                      key={`date-${editingTask?.id || 'new'}`}
                      id="task-due-date"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="task-status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as TaskStatus })}
                    >
                      <SelectTrigger id="task-status">
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
                  <div>
                    <Label htmlFor="task-priority">Prioridade</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value as "Baixa" | "Média" | "Alta" })}
                    >
                      <SelectTrigger id="task-priority">
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
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit}>Salvar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <MetricCardSkeleton key={`metric-skeleton-${index}`} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <MetricCard
            title="Total de Tarefas"
            value={boardTasks.length}
            icon={ListTodo}
            variant="default"
          />
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4 px-2">
            {columns.map((column) => (
              <div
                key={column.status}
                className="bg-muted/30 rounded-lg p-4 min-h-[520px] w-80 flex-shrink-0"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <column.icon className="h-4 w-4" />
                    <h3 className="font-semibold text-sm">{column.title}</h3>
                  </div>
                </div>
                <TaskCardSkeleton />
                <TaskCardSkeleton />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col space-y-6">
            <div className="flex gap-4 overflow-x-auto pb-4">
              {columns.map((column) => (
                <KanbanColumn
                  key={column.status}
                  title={column.title}
                  status={column.status}
                  icon={column.icon}
                  tasks={getTasksByStatus(column.status)}
                  onAddTask={openModal}
                  onEditTask={editTask}
                  onDeleteTask={deleteTask}
                  trashDroppableId={getTrashZoneId(column.status)}
                  isDragging={Boolean(activeId)}
                />
              ))}
            </div>
          </div>
        )}

        {!isLoading && (
          <DragOverlay>
            {activeTask ? <SortableTask task={activeTask} onEdit={editTask} onDelete={deleteTask} /> : null}
          </DragOverlay>
        )}
      </DndContext>

      {!isLoading && filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={ListTodo}
              title={emptyStateTitle}
              description={emptyStateDescription}
              actionLabel="Criar Tarefa"
              onAction={() => openModal()}
            />
          </CardContent>
        </Card>
      ) : null}

      <ConfirmDialog
        open={taskToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setTaskToDelete(null);
        }}
        title="Excluir tarefa"
        description={`Tem certeza que deseja excluir "${taskToDelete?.title}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
