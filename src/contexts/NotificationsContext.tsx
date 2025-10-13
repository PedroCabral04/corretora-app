import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './AuthContext';
import { useTasks } from './TasksContext';
import { useGoals } from './GoalsContext';
import { useEvents } from './EventsContext';
import { useMeetings } from './MeetingsContext';

export type NotificationType = 'task' | 'goal' | 'event' | 'meeting';
export type NotificationPriority = 'low' | 'medium' | 'high';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedId?: string;
  priority: NotificationPriority;
  isRead: boolean;
  dismissedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  createNotification: (data: Omit<Notification, 'id' | 'userId' | 'isRead' | 'createdAt' | 'updatedAt'>) => Promise<Notification | null>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllRead: () => Promise<void>;
  checkAndCreateDeadlineNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
};

interface NotificationsProviderProps {
  children: ReactNode;
}

export const NotificationsProvider = ({ children }: NotificationsProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { tasks } = useTasks();
  const { goals } = useGoals();
  const { events } = useEvents();
  const { meetings } = useMeetings();

  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch ALL notifications including dismissed ones (for duplicate checking)
      // But we'll filter dismissed ones from the visible list
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedData: Notification[] = (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        title: item.title,
        message: item.message,
        type: item.type as NotificationType,
        relatedId: item.related_id,
        priority: item.priority as NotificationPriority,
        isRead: item.is_read,
        dismissedAt: (item as any).dismissed_at,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      setNotifications(mappedData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const createNotification = async (data: Omit<Notification, 'id' | 'userId' | 'isRead' | 'createdAt' | 'updatedAt'>): Promise<Notification | null> => {
    if (!user) throw new Error('User not authenticated');

    const { data: newNotification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        title: data.title,
        message: data.message,
        type: data.type,
        related_id: data.relatedId,
        priority: data.priority,
      })
      .select()
      .single();

    if (error) {
      // Silently ignore duplicate notification errors (unique constraint violation)
      if (error.code === '23505') {
        console.log('Duplicate notification prevented by database constraint:', {
          type: data.type,
          relatedId: data.relatedId,
          message: data.message
        });
        return null;
      }
      throw error;
    }

    const notification: Notification = {
      id: newNotification.id,
      userId: newNotification.user_id,
      title: newNotification.title,
      message: newNotification.message,
      type: newNotification.type as NotificationType,
      relatedId: newNotification.related_id,
      priority: newNotification.priority as NotificationPriority,
      isRead: newNotification.is_read,
      createdAt: newNotification.created_at,
      updatedAt: newNotification.updated_at,
    };

    setNotifications(prev => [notification, ...prev]);
    return notification;
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      console.error('Error marking notification as read:', error);
      return;
    }

    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return;
    }

    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = async (id: string) => {
    // Instead of deleting, mark as dismissed
    const { error } = await supabase
      .from('notifications')
      .update({ dismissed_at: new Date().toISOString() } as any)
      .eq('id', id);

    if (error) {
      console.error('Error dismissing notification:', error);
      return;
    }

    // Update local state to mark as dismissed
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, dismissedAt: new Date().toISOString() } : n)
    );
  };

  const deleteAllRead = async () => {
    if (!user) return;

    // Instead of deleting, mark all read notifications as dismissed
    const { error } = await supabase
      .from('notifications')
      .update({ dismissed_at: new Date().toISOString() } as any)
      .eq('user_id', user.id)
      .eq('is_read', true);

    if (error) {
      console.error('Error dismissing read notifications:', error);
      return;
    }

    // Update local state to mark all read as dismissed
    const now = new Date().toISOString();
    setNotifications(prev =>
      prev.map(n => n.isRead ? { ...n, dismissedAt: now } : n)
    );
  };

  const checkAndCreateDeadlineNotifications = useCallback(async () => {
    if (!user) return;

    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Check tasks
    for (const task of tasks) {
      if (task.status === 'Concluída') continue;
      
      // Skip tasks with temporary IDs (optimistic updates not yet persisted)
      if (task.id.startsWith('temp-')) continue;

      const dueDate = new Date(task.dueDate);
      // Check for existing notification in the last 24 hours (including read AND dismissed ones)
      const existingNotification = notifications.find(
        n => n.relatedId === task.id && 
             n.type === 'task' && 
             new Date(n.createdAt) > twentyFourHoursAgo
      );

      if (existingNotification) continue;

      let shouldNotify = false;
      let message = '';
      let priority: NotificationPriority = 'low';

      if (dueDate < now) {
        shouldNotify = true;
        message = `A tarefa "${task.title}" está atrasada!`;
        priority = 'high';
      } else if (dueDate <= oneDayFromNow) {
        shouldNotify = true;
        message = `A tarefa "${task.title}" vence em menos de 24 horas!`;
        priority = 'high';
      } else if (dueDate <= threeDaysFromNow) {
        shouldNotify = true;
        message = `A tarefa "${task.title}" vence em 3 dias.`;
        priority = 'medium';
      } else if (dueDate <= sevenDaysFromNow) {
        shouldNotify = true;
        message = `A tarefa "${task.title}" vence em 7 dias.`;
        priority = 'low';
      }

      if (shouldNotify) {
        try {
          await createNotification({
            title: 'Prazo de Tarefa',
            message,
            type: 'task',
            relatedId: task.id,
            priority,
          });
        } catch (error) {
          console.error('Error creating task notification:', error);
        }
      }
    }

    // Check goals
    for (const goal of goals) {
      if (goal.status === 'completed' || goal.status === 'cancelled') continue;

      const endDate = new Date(goal.endDate);
      // Check for existing notification in the last 24 hours (including read ones)
      const existingNotification = notifications.find(
        n => n.relatedId === goal.id && 
             n.type === 'goal' && 
             new Date(n.createdAt) > twentyFourHoursAgo
      );

      if (existingNotification) continue;

      let shouldNotify = false;
      let message = '';
      let priority: NotificationPriority = 'low';

      if (endDate < now) {
        shouldNotify = true;
        message = `A meta "${goal.title}" está atrasada! Progresso: ${goal.progress?.toFixed(0)}%`;
        priority = 'high';
      } else if (endDate <= threeDaysFromNow) {
        shouldNotify = true;
        message = `A meta "${goal.title}" termina em 3 dias. Progresso: ${goal.progress?.toFixed(0)}%`;
        priority = 'high';
      } else if (endDate <= sevenDaysFromNow) {
        shouldNotify = true;
        message = `A meta "${goal.title}" termina em 7 dias. Progresso: ${goal.progress?.toFixed(0)}%`;
        priority = 'medium';
      }

      if (shouldNotify) {
        try {
          await createNotification({
            title: 'Prazo de Meta',
            message,
            type: 'goal',
            relatedId: goal.id,
            priority,
          });
        } catch (error) {
          console.error('Error creating goal notification:', error);
        }
      }
    }

    // Check events
    for (const event of events) {
      const eventDate = new Date(event.datetime);
      // Check for existing notification in the last 24 hours (including read ones)
      const existingNotification = notifications.find(
        n => n.relatedId === event.id && 
             n.type === 'event' && 
             new Date(n.createdAt) > twentyFourHoursAgo
      );

      if (existingNotification) continue;

      let shouldNotify = false;
      let message = '';
      let priority: NotificationPriority = 'low';

      if (eventDate < now) {
        continue; // Skip past events
      } else if (eventDate <= oneDayFromNow) {
        shouldNotify = true;
        message = `Evento "${event.title}" acontece em menos de 24 horas!`;
        priority = event.priority === 'Alta' ? 'high' : 'medium';
      } else if (eventDate <= threeDaysFromNow) {
        shouldNotify = true;
        message = `Evento "${event.title}" acontece em 3 dias.`;
        priority = event.priority === 'Alta' ? 'medium' : 'low';
      }

      if (shouldNotify) {
        try {
          await createNotification({
            title: 'Evento Próximo',
            message,
            type: 'event',
            relatedId: event.id,
            priority,
          });
        } catch (error) {
          console.error('Error creating event notification:', error);
        }
      }
    }

    // Check meetings
    for (const meeting of meetings) {
      const meetingDate = new Date(meeting.meetingDate);
      // Check for existing notification in the last 24 hours (including read ones)
      const existingNotification = notifications.find(
        n => n.relatedId === meeting.id && 
             n.type === 'meeting' && 
             new Date(n.createdAt) > twentyFourHoursAgo
      );

      if (existingNotification) continue;

      let shouldNotify = false;
      let message = '';
      let priority: NotificationPriority = 'low';

      if (meetingDate < now) {
        continue; // Skip past meetings
      } else if (meetingDate <= oneDayFromNow) {
        shouldNotify = true;
        message = `Reunião com "${meeting.clientName}" acontece em menos de 24 horas!`;
        priority = 'high';
      } else if (meetingDate <= threeDaysFromNow) {
        shouldNotify = true;
        message = `Reunião com "${meeting.clientName}" acontece em 3 dias.`;
        priority = 'medium';
      }

      if (shouldNotify) {
        try {
          await createNotification({
            title: 'Reunião Próxima',
            message,
            type: 'meeting',
            relatedId: meeting.id,
            priority,
          });
        } catch (error) {
          console.error('Error creating meeting notification:', error);
        }
      }
    }
  }, [user, tasks, goals, events, meetings, notifications]);

  // Check for deadline notifications every 5 minutes
  useEffect(() => {
    if (!user) return;

    checkAndCreateDeadlineNotifications();
    const interval = setInterval(checkAndCreateDeadlineNotifications, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, checkAndCreateDeadlineNotifications]);

  const refreshNotifications = async () => {
    await fetchNotifications();
  };

  // Filter out dismissed notifications for display
  const visibleNotifications = notifications.filter(n => !n.dismissedAt);
  const unreadCount = visibleNotifications.filter(n => !n.isRead).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications: visibleNotifications,
        unreadCount,
        isLoading,
        createNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllRead,
        checkAndCreateDeadlineNotifications,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};
