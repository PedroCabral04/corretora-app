import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { MetricCard } from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  CheckSquare, 
  Clock, 
  Calendar,
  Search,
  Edit,
  Trash2
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  status: "Pendente" | "Concluída";
  createdAt: string;
}

const Tasks = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCompleted, setShowCompleted] = useState(true);

  // Mock data - em produção viria do backend
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Criar campanha de marketing Q1",
      description: "Definir estratégia e materiais para campanhas do primeiro trimestre",
      dueDate: "2024-02-15",
      status: "Pendente",
      createdAt: "2024-01-10"
    },
    {
      id: "2",
      title: "Reunião com equipe comercial",
      description: "Alinhamento de metas e processos",
      dueDate: "2024-01-20",
      status: "Concluída", 
      createdAt: "2024-01-05"
    },
    {
      id: "3",
      title: "Análise de resultados dezembro",
      description: "Revisar métricas e performance da equipe",
      dueDate: "2024-01-25",
      status: "Pendente",
      createdAt: "2024-01-12"
    }
  ]);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = showCompleted || task.status === "Pendente";
    return matchesSearch && matchesStatus;
  });

  const pendingTasks = tasks.filter(task => task.status === "Pendente").length;
  const completedTasks = tasks.filter(task => task.status === "Concluída").length;
  const overdueTasks = tasks.filter(task => 
    task.status === "Pendente" && new Date(task.dueDate) < new Date()
  ).length;

  const toggleTaskStatus = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: task.status === "Pendente" ? "Concluída" : "Pendente" }
        : task
    ));
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === "Concluída" ? "secondary" : "default"}>
        {status}
      </Badge>
    );
  };

  const isOverdue = (task: Task) => {
    return task.status === "Pendente" && new Date(task.dueDate) < new Date();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tarefas Pessoais</h1>
            <p className="text-muted-foreground mt-1">
              Organize suas demandas e atividades
            </p>
          </div>
          <Button className="flex items-center space-x-2">
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
            icon={Calendar}
            variant="info"
          />
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar tarefa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-completed"
              checked={showCompleted}
              onCheckedChange={(checked) => setShowCompleted(checked === true)}
            />
            <label
              htmlFor="show-completed"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Mostrar concluídas
            </label>
          </div>
        </div>

        {/* Lista de Tarefas */}
        <div className="space-y-4">
          {filteredTasks.map(task => (
            <Card 
              key={task.id} 
              className={`transition-all duration-200 hover:shadow-md ${
                isOverdue(task) ? 'border-destructive/50 bg-destructive/5' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <Checkbox
                      checked={task.status === "Concluída"}
                      onCheckedChange={() => toggleTaskStatus(task.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-semibold ${
                          task.status === "Concluída" ? 'line-through text-muted-foreground' : ''
                        }`}>
                          {task.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(task.status)}
                          {isOverdue(task) && (
                            <Badge variant="destructive">Atrasada</Badge>
                          )}
                        </div>
                      </div>
                      
                      {task.description && (
                        <p className={`text-sm ${
                          task.status === "Concluída" ? 'text-muted-foreground' : 'text-muted-foreground'
                        }`}>
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Prazo: {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Criada: {new Date(task.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">
              Nenhuma tarefa encontrada
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Tasks;