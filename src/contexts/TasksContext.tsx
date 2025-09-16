import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './AuthContext';

export type TaskStatus = "Backlog" | "Em Progresso" | "Em Revisão" | "Concluída";

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  status: TaskStatus;
  createdAt: string;
  priority: "Baixa" | "Média" | "Alta";
}

interface TasksContextType {
  tasks: Task[];
  isLoading: boolean;
  createTask: (data: Omit<Task, 'id' | 'createdAt'>) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  getTaskById: (id: string) => Task | undefined;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const useTasks = () => {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error('useTasks must be used within TasksProvider');
  return ctx;
};

interface TasksProviderProps {
  children: ReactNode;
}

export const TasksProvider = ({ children }: TasksProviderProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchTasks = async () => {
    if (!user) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedTasks: Task[] = (data || []).map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || undefined,
        dueDate: task.due_date,
        status: task.status as TaskStatus,
        createdAt: task.created_at.split('T')[0], // Convert to date string
        priority: task.priority as "Baixa" | "Média" | "Alta"
      }));

      setTasks(mappedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const createTask = async (data: Omit<Task, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('Usuário não autenticado');
    if (!data.title) throw new Error('Título é obrigatório');

    const taskData = {
      user_id: user.id,
      title: data.title,
      description: data.description || null,
      due_date: data.dueDate,
      status: data.status,
      priority: data.priority
    };

    const { data: newTask, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single();

    if (error) throw error;

    const mappedTask: Task = {
      id: newTask.id,
      title: newTask.title,
      description: newTask.description || undefined,
      dueDate: newTask.due_date,
      status: newTask.status as TaskStatus,
      createdAt: newTask.created_at.split('T')[0],
      priority: newTask.priority as "Baixa" | "Média" | "Alta"
    };

    setTasks(prev => [mappedTask, ...prev]);
    return mappedTask;
  };

  const updateTask = async (id: string, data: Partial<Task>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.dueDate !== undefined) updateData.due_date = data.dueDate;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;

    const { data: updatedTask, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    const mappedTask: Task = {
      id: updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description || undefined,
      dueDate: updatedTask.due_date,
      status: updatedTask.status as TaskStatus,
      createdAt: updatedTask.created_at.split('T')[0],
      priority: updatedTask.priority as "Baixa" | "Média" | "Alta"
    };

    setTasks(prev => prev.map(task => task.id === id ? mappedTask : task));
    return mappedTask;
  };

  const deleteTask = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const getTaskById = (id: string) => tasks.find(t => t.id === id);

  const value: TasksContextType = {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    getTaskById
  };

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
};