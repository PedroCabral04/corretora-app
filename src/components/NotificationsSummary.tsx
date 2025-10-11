import React from 'react';
import { AlertCircle, Clock, Target, Calendar, CheckSquare } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export const NotificationsSummary = () => {
  const { notifications } = useNotifications();
  
  const urgentNotifications = notifications
    .filter(n => !n.isRead && n.priority === 'high')
    .slice(0, 5);

  if (urgentNotifications.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <CheckSquare className="h-4 w-4" />;
      case 'goal':
        return <Target className="h-4 w-4" />;
      case 'event':
        return <Calendar className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-lg">Atenção Necessária</CardTitle>
          </div>
          <Badge variant="destructive" className="rounded-full">
            {urgentNotifications.length}
          </Badge>
        </div>
        <CardDescription>
          Você tem {urgentNotifications.length} {urgentNotifications.length === 1 ? 'notificação urgente' : 'notificações urgentes'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] pr-4">
          <div className="space-y-3">
            {urgentNotifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center text-red-600 dark:text-red-400">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {notification.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
