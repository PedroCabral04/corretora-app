import React from 'react';
import { CheckCheck, Trash2, X, Clock, AlertCircle, Target, Calendar, Users, Bell } from 'lucide-react';
import { useNotifications, Notification } from '@/contexts/NotificationsContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationPanelProps {
  onClose: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'task':
      return <CheckCheck className="h-4 w-4" />;
    case 'goal':
      return <Target className="h-4 w-4" />;
    case 'event':
      return <Calendar className="h-4 w-4" />;
    case 'meeting':
      return <Users className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'Alta';
    case 'medium':
      return 'Média';
    case 'low':
      return 'Baixa';
    default:
      return priority;
  }
};

export const NotificationPanel = ({ onClose }: NotificationPanelProps) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
  } = useNotifications();

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await markAsRead(id);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(id);
  };

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Notificações</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="rounded-full">
              {unreadCount}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Actions */}
      {notifications.length > 0 && (
        <div className="flex items-center gap-2 p-2 border-b">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
          {notifications.some(n => n.isRead) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={deleteAllRead}
              className="text-xs text-muted-foreground"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Limpar lidas
            </Button>
          )}
        </div>
      )}

      {/* Notifications List */}
      <ScrollArea className="flex-1">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhuma notificação no momento
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

const NotificationItem = ({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) => {
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <div
      className={cn(
        'p-4 hover:bg-accent/50 transition-colors cursor-pointer group',
        !notification.isRead && 'bg-accent/20'
      )}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
            getPriorityColor(notification.priority)
          )}
        >
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-medium text-sm leading-tight">
              {notification.title}
            </h4>
            <Badge
              variant="outline"
              className={cn('text-xs', getPriorityColor(notification.priority))}
            >
              {getPriorityLabel(notification.priority)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {notification.message}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notification.isRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => onMarkAsRead(notification.id, e)}
                  className="h-7 px-2 text-xs"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Lida
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => onDelete(notification.id, e)}
                className="h-7 px-2 text-xs text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
