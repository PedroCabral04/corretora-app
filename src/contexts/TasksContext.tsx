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
  brokerId?: string | null;
}

interface TasksContextType {
  tasks: Task[];
  isLoading: boolean;
  // If `opts.optimistic` is true, the context will update local state immediately
  // and attempt the server request; it will rollback on error.
  createTask: (data: Omit<Task, 'id' | 'createdAt'>, opts?: { optimistic?: boolean }) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>, opts?: { optimistic?: boolean }) => Promise<Task>;
  deleteTask: (id: string, opts?: { optimistic?: boolean }) => Promise<void>;
  getTaskById: (id: string) => Task | undefined;
  getTasksByBrokerId: (brokerId?: string | null) => Task[];
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
        priority: task.priority as "Baixa" | "Média" | "Alta",
        brokerId: task.broker_id
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
      priority: data.priority,
      broker_id: data.brokerId ?? null
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
      priority: newTask.priority as "Baixa" | "Média" | "Alta",
      brokerId: newTask.broker_id
    };

    setTasks(prev => [mappedTask, ...prev]);
    return mappedTask;
  };

  // Wrapped createTask to support optimistic updates (keeps original createTask for backwards compatibility)
  const createTaskOptimistic = async (data: Omit<Task, 'id' | 'createdAt'>, opts?: { optimistic?: boolean }) => {
    if (!opts?.optimistic) return createTask(data);

    if (!user) throw new Error('Usuário não autenticado');

    // create temporary task for immediate UI
    const tempId = `temp-${Date.now()}`;
    const tempTask: Task = {
      id: tempId,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      status: data.status,
      createdAt: new Date().toISOString().split('T')[0],
      priority: data.priority,
      brokerId: data.brokerId ?? null
    };

    const prev = tasks;
    setTasks(prevState => [tempTask, ...prevState]);

    try {
      const taskData = {
        user_id: user.id,
        title: data.title,
        description: data.description || null,
        due_date: data.dueDate,
        status: data.status,
        priority: data.priority,
        broker_id: data.brokerId ?? null
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
        priority: newTask.priority as "Baixa" | "Média" | "Alta",
        brokerId: newTask.broker_id
      };

      // Replace temp with real task
      setTasks(prevState => prevState.map(t => t.id === tempId ? mappedTask : t));
      return mappedTask;
    } catch (err) {
      // rollback
      setTasks(prev);
      throw err;
    }
  };

  const updateTask = async (id: string, data: Partial<Task>) => {
    if (!user) throw new Error('Usuário não autenticado');

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.dueDate !== undefined) updateData.due_date = data.dueDate;
    if (data.status !== undefined) updateData.status = data.status;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.brokerId !== undefined) updateData.broker_id = data.brokerId ?? null;

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
      priority: updatedTask.priority as "Baixa" | "Média" | "Alta",
      brokerId: updatedTask.broker_id
    };

    setTasks(prev => prev.map(task => task.id === id ? mappedTask : task));
    return mappedTask;
  };

  const updateTaskOptimistic = async (id: string, data: Partial<Task>, opts?: { optimistic?: boolean }) => {
    if (!opts?.optimistic) return updateTask(id, data);
    if (!user) throw new Error('Usuário não autenticado');

    const prev = tasks;
    // optimistic update
    setTasks(prevState => prevState.map(task => task.id === id ? { ...task, ...data } : task));

    try {
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description || null;
      if (data.dueDate !== undefined) updateData.due_date = data.dueDate;
      if (data.status !== undefined) updateData.status = data.status;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.brokerId !== undefined) updateData.broker_id = data.brokerId ?? null;

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
        priority: updatedTask.priority as "Baixa" | "Média" | "Alta",
        brokerId: updatedTask.broker_id
      };

      setTasks(prevState => prevState.map(task => task.id === id ? mappedTask : task));
      return mappedTask;
    } catch (err) {
      // rollback
      setTasks(prev);
      throw err;
    }
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

  const deleteTaskOptimistic = async (id: string, opts?: { optimistic?: boolean }) => {
    if (!opts?.optimistic) return deleteTask(id);
    if (!user) throw new Error('Usuário não autenticado');

    const prev = tasks;
    setTasks(prevState => prevState.filter(task => task.id !== id));

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (err) {
      // rollback
      setTasks(prev);
      throw err;
    }
  };

  const getTaskById = (id: string) => tasks.find(t => t.id === id);
  const getTasksByBrokerId = (brokerId?: string | null) => {
    if (brokerId === null) {
      return tasks.filter(task => !task.brokerId);
    }
    if (!brokerId) {
      return tasks;
    }
    return tasks.filter(task => task.brokerId === brokerId);
  };

  const value: TasksContextType = {
    tasks,
    isLoading,
    createTask: createTaskOptimistic,
    updateTask: updateTaskOptimistic,
    deleteTask: deleteTaskOptimistic,
    getTaskById,
    getTasksByBrokerId
  };

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
};