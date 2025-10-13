import React, { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameMonth, 
  parseISO, 
  getHours, 
  getMinutes, 
  addMinutes,
  isSameDay,
  startOfDay,
  addWeeks,
  subWeeks,
  isToday
} from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Plus, Calendar as CalendarIcon, Trash2, Edit2, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useEvents, EventItem } from "@/contexts/EventsContext";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { validateRequired, getErrorMessage } from "@/lib/masks";

const Agenda = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { events, isLoading, createEvent, deleteEvent, updateEvent } = useEvents();
  const { toast } = useToast();
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [form, setForm] = useState({ 
    title: "", 
    description: "", 
    datetime: `${format(new Date(), 'yyyy-MM-dd')}T09:00`, 
    priority: "Média" as "Baixa" | "Média" | "Alta", 
    durationMinutes: 60 
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [eventToDelete, setEventToDelete] = useState<{ id: string; title: string } | null>(null);

  const openNewEvent = (dateIso?: string, hour?: number) => {
    const datePart = dateIso || format(currentDate, 'yyyy-MM-dd');
    const hourPart = hour !== undefined ? String(hour).padStart(2, '0') : '09';
    setEditingEvent(null);
    setForm({ 
      title: "", 
      description: "", 
      datetime: `${datePart}T${hourPart}:00`, 
      priority: "Média", 
      durationMinutes: 60 
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditEvent = (event: EventItem) => {
    setEditingEvent(event);
    // Format datetime for datetime-local input (YYYY-MM-DDTHH:MM)
    // Remove timezone offset and seconds if present
    const datetimeValue = event.datetime.includes('T') 
      ? event.datetime.slice(0, 16) // Take only YYYY-MM-DDTHH:MM
      : event.datetime;
    
    setForm({
      title: event.title,
      description: event.description || "",
      datetime: datetimeValue,
      priority: event.priority || "Média",
      durationMinutes: event.durationMinutes || 60
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const errors: Record<string, string> = {};
    
    if (!validateRequired(form.title)) {
      errors.title = getErrorMessage('Título', 'required');
    }
    
    if (!form.datetime) {
      errors.datetime = getErrorMessage('Data e hora', 'required');
    }
    
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast?.({ 
        title: 'Erro de validação', 
        description: 'Por favor, corrija os erros no formulário', 
        variant: 'destructive' 
      });
      return;
    }
    
    try {
      // Convert local datetime-local input to ISO string without timezone conversion
      // The datetime-local input returns "YYYY-MM-DDTHH:MM" which we need to append ":00" for seconds
      const localDatetime = form.datetime.length === 16 ? `${form.datetime}:00` : form.datetime;
      
      if (editingEvent) {
        await updateEvent(editingEvent.id, {
          title: form.title,
          description: form.description,
          datetime: localDatetime,
          priority: form.priority,
          durationMinutes: form.durationMinutes
        });
        toast?.({ 
          title: 'Evento atualizado', 
          description: `${form.title} foi atualizado com sucesso` 
        });
      } else {
        await createEvent({
          title: form.title,
          description: form.description,
          datetime: localDatetime,
          priority: form.priority,
          durationMinutes: form.durationMinutes
        });
        toast?.({ 
          title: 'Evento criado', 
          description: `${form.title} em ${format(new Date(form.datetime), "dd/MM/yyyy - HH:mm")}` 
        });
      }
      setIsModalOpen(false);
      setFormErrors({});
    } catch (error) {
      toast?.({ 
        title: 'Erro', 
        description: editingEvent ? 'Falha ao atualizar evento' : 'Falha ao criar evento', 
        variant: 'destructive' 
      });
    }
  };

  const handleDelete = (event: EventItem) => {
    setEventToDelete({ id: event.id, title: event.title });
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    
    try {
      await deleteEvent(eventToDelete.id);
      toast?.({ title: 'Evento removido', description: `"${eventToDelete.title}" foi excluído` });
      setEventToDelete(null);
    } catch (error) {
      toast?.({ title: 'Erro', description: 'Falha ao remover evento', variant: 'destructive' });
    }
  };

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
      return;
    }

    const amount = direction === 'next' ? 1 : -1;
    if (view === 'month') {
      setCurrentDate(amount > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(amount > 0 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, amount));
    }
  };

  const getDateRangeLabel = () => {
    if (view === 'month') {
      return format(currentDate, 'MMMM yyyy', { locale: ptBR });
    } else if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(start, 'dd MMM', { locale: ptBR })} - ${format(end, 'dd MMM yyyy', { locale: ptBR })}`;
    } else {
      return format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    }
  };

  const eventsForDay = (d: Date) => {
    return events.filter(e => {
      const eventDate = parseISO(e.datetime);
      return isSameDay(eventDate, d);
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
            <p className="text-muted-foreground mt-1">Gerencie seus eventos e compromissos</p>
          </div>
          <Button onClick={() => openNewEvent()} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Evento
          </Button>
        </div>

        {/* Navigation and View Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateDate('today')}>
              Hoje
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="text-lg font-semibold ml-4 capitalize">
              {getDateRangeLabel()}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant={view === 'month' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setView('month')}
            >
              Mês
            </Button>
            <Button 
              variant={view === 'week' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setView('week')}
            >
              Semana
            </Button>
            <Button 
              variant={view === 'day' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setView('day')}
            >
              Dia
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={CalendarIcon}
            title="Nenhum evento agendado"
            description="Comece criando seu primeiro evento para organizar sua agenda e não perder compromissos importantes."
            actionLabel="Criar Primeiro Evento"
            onAction={() => openNewEvent()}
          />
        ) : (
          <>
            {/* Month View */}
            {view === 'month' && <MonthView currentDate={currentDate} events={events} onNewEvent={openNewEvent} onEditEvent={openEditEvent} onDeleteEvent={handleDelete} />}

            {/* Week View */}
            {view === 'week' && <WeekView currentDate={currentDate} events={events} onNewEvent={openNewEvent} onEditEvent={openEditEvent} onDeleteEvent={handleDelete} />}

            {/* Day View */}
            {view === 'day' && <DayView currentDate={currentDate} events={events} onNewEvent={openNewEvent} onEditEvent={openEditEvent} onDeleteEvent={handleDelete} />}
          </>
        )}

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo evento</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="evt-title">Título *</Label>
                <Input 
                  id="evt-title" 
                  value={form.title} 
                  onChange={(e) => {
                    setForm({...form, title: e.target.value});
                    if (formErrors.title) setFormErrors({...formErrors, title: ''});
                  }}
                  className={formErrors.title ? 'border-destructive' : ''}
                />
                {formErrors.title && <p className="text-sm text-destructive mt-1">{formErrors.title}</p>}
              </div>
              <div>
                <Label htmlFor="evt-desc">Descrição</Label>
                <Textarea id="evt-desc" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
              </div>
              <div>
                <Label htmlFor="evt-datetime">Data e hora *</Label>
                <Input 
                  id="evt-datetime" 
                  type="datetime-local" 
                  value={form.datetime} 
                  onChange={(e) => {
                    setForm({...form, datetime: e.target.value});
                    if (formErrors.datetime) setFormErrors({...formErrors, datetime: ''});
                  }}
                  className={formErrors.datetime ? 'border-destructive' : ''}
                />
                {formErrors.datetime && <p className="text-sm text-destructive mt-1">{formErrors.datetime}</p>}
              </div>
              <div>
                <Label htmlFor="evt-priority">Prioridade</Label>
                <Select value={form.priority} onValueChange={(value: "Baixa" | "Média" | "Alta") => setForm({...form, priority: value})}>
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
              <div>
                <Label htmlFor="evt-duration">Duração (min)</Label>
                <Input id="evt-duration" type="number" value={form.durationMinutes} onChange={(e) => setForm({...form, durationMinutes: Number(e.target.value) || 0})} />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => {
                  setIsModalOpen(false);
                  setFormErrors({});
                }}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          open={eventToDelete !== null}
          onOpenChange={(open) => !open && setEventToDelete(null)}
          title="Excluir Evento"
          description={`Tem certeza que deseja excluir o evento "${eventToDelete?.title}"? Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          onConfirm={handleConfirmDelete}
        />
      </main>
    </div>
  );
};

export default Agenda;

// Helper Types
type EventPosition = {
  ev: EventItem;
  startMin: number;
  endMin: number;
  colIndex?: number;
  totalCols?: number;
};

// Priority Color Helper
const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case 'Alta': return 'bg-red-500 hover:bg-red-600';
    case 'Média': return 'bg-blue-500 hover:bg-blue-600';
    case 'Baixa': return 'bg-green-500 hover:bg-green-600';
    default: return 'bg-gray-500 hover:bg-gray-600';
  }
};

// Month View Component
type MonthViewProps = {
  currentDate: Date;
  events: EventItem[];
  onNewEvent: (dateIso?: string) => void;
  onEditEvent: (event: EventItem) => void;
  onDeleteEvent: (event: EventItem) => void;
};

function MonthView({ currentDate, events, onNewEvent, onEditEvent, onDeleteEvent }: MonthViewProps) {
  const firstDay = startOfMonth(currentDate);
  const lastDay = endOfMonth(currentDate);
  const startDate = startOfWeek(firstDay, { weekStartsOn: 0 });
  const endDate = endOfWeek(lastDay, { weekStartsOn: 0 });

  const weeks: Date[][] = [];
  let date = startDate;
  while (date <= endDate) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(date);
      date = addDays(date, 1);
    }
    weeks.push(week);
  }

  const eventsForDay = (d: Date) => {
    return events.filter(e => {
      const eventDate = parseISO(e.datetime);
      return isSameDay(eventDate, d);
    }).sort((a, b) => a.datetime.localeCompare(b.datetime));
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      {/* Week day headers */}
      <div className="grid grid-cols-7 bg-muted/50">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div key={d} className="p-3 text-center text-sm font-semibold border-r last:border-r-0">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {weeks.map((week) => (
          week.map((day) => {
            const dayEvents = eventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);

            return (
              <div
                key={format(day, 'yyyy-MM-dd')}
                className={`min-h-[120px] p-2 border-r border-b last:border-r-0 transition-colors ${
                  isCurrentMonth ? 'bg-background' : 'bg-muted/20'
                } ${isTodayDate ? 'bg-blue-50 dark:bg-blue-950/20' : ''} hover:bg-accent/50`}
              >
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => onNewEvent(format(day, 'yyyy-MM-dd'))}
                    className={`text-sm font-semibold rounded-full w-7 h-7 flex items-center justify-center transition-colors ${
                      isTodayDate 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-accent'
                    } ${!isCurrentMonth ? 'text-muted-foreground' : ''}`}
                  >
                    {format(day, 'd')}
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                    onClick={() => onNewEvent(format(day, 'yyyy-MM-dd'))}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(ev => (
                    <div
                      key={ev.id}
                      onClick={() => onEditEvent(ev)}
                      className={`group relative text-xs p-1.5 rounded cursor-pointer text-white ${getPriorityColor(ev.priority)} transition-all`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{ev.title}</div>
                          <div className="text-[10px] opacity-90">
                            {format(parseISO(ev.datetime), 'HH:mm')}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 text-white hover:bg-white/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteEvent(ev);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-muted-foreground text-center py-1">
                      +{dayEvents.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
}

// Week View Component
type WeekViewProps = {
  currentDate: Date;
  events: EventItem[];
  onNewEvent: (dateIso?: string, hour?: number) => void;
  onEditEvent: (event: EventItem) => void;
  onDeleteEvent: (event: EventItem) => void;
};

function WeekView({ currentDate, events, onNewEvent, onEditEvent, onDeleteEvent }: WeekViewProps) {
  const start = startOfWeek(currentDate, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  const hours = Array.from({ length: 24 }).map((_, i) => i);

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      {/* Header with days */}
      <div className="grid" style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
        <div className="bg-muted p-3 border-r">
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>
        {days.map(d => (
          <div
            key={format(d, 'yyyy-MM-dd')}
            className={`p-3 text-center border-r last:border-r-0 ${
              isToday(d) ? 'bg-blue-50 dark:bg-blue-950/20' : 'bg-muted/50'
            }`}
          >
            <div className="text-xs text-muted-foreground uppercase">
              {format(d, 'EEE', { locale: ptBR })}
            </div>
            <div className={`text-lg font-semibold ${isToday(d) ? 'text-primary' : ''}`}>
              {format(d, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="grid" style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
        {/* Hour labels */}
        <div className="border-r">
          {hours.map(h => (
            <div key={h} className="h-16 px-2 py-1 text-xs text-muted-foreground border-b text-right">
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayEvents = events.filter(ev => ev.datetime.startsWith(dayStr)).map(ev => {
            const startDt = parseISO(ev.datetime);
            const startMin = getHours(startDt) * 60 + getMinutes(startDt);
            const endMin = startMin + (ev.durationMinutes || 60);
            return { ev, startMin, endMin };
          });
          const columns = layoutEvents(dayEvents);

          return (
            <div key={dayStr} className="relative border-r last:border-r-0">
              {/* Hour grid lines */}
              {hours.map(h => (
                <div
                  key={h}
                  className="h-16 border-b cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => onNewEvent(dayStr, h)}
                />
              ))}

              {/* Events */}
              {columns.flat().map(item => {
                const topPx = (item.startMin / 60) * 64; // 64px per hour
                const heightPx = ((item.endMin - item.startMin) / 60) * 64;
                const widthPct = 100 / item.totalCols!;
                const leftPct = item.colIndex! * widthPct;

                return (
                  <div
                    key={item.ev.id}
                    onClick={() => onEditEvent(item.ev)}
                    className={`group absolute rounded p-2 text-xs text-white cursor-pointer ${getPriorityColor(item.ev.priority)} transition-all shadow-sm hover:shadow-md`}
                    style={{
                      top: `${topPx}px`,
                      height: `${Math.max(heightPx, 32)}px`,
                      left: `${leftPct}%`,
                      width: `calc(${widthPct}% - 4px)`,
                      marginLeft: '2px'
                    }}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{item.ev.title}</div>
                        <div className="text-[10px] opacity-90">
                          {format(parseISO(item.ev.datetime), 'HH:mm')} - {format(addMinutes(parseISO(item.ev.datetime), item.ev.durationMinutes || 60), 'HH:mm')}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 text-white hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteEvent(item.ev);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Day View Component
type DayViewProps = {
  currentDate: Date;
  events: EventItem[];
  onNewEvent: (dateIso?: string, hour?: number) => void;
  onEditEvent: (event: EventItem) => void;
  onDeleteEvent: (event: EventItem) => void;
};

function DayView({ currentDate, events, onNewEvent, onEditEvent, onDeleteEvent }: DayViewProps) {
  const dayStr = format(currentDate, 'yyyy-MM-dd');
  const hours = Array.from({ length: 24 }).map((_, i) => i);
  
  const dayEvents = events.filter(ev => ev.datetime.startsWith(dayStr)).map(ev => {
    const startDt = parseISO(ev.datetime);
    const startMin = getHours(startDt) * 60 + getMinutes(startDt);
    const endMin = startMin + (ev.durationMinutes || 60);
    return { ev, startMin, endMin };
  });
  
  const columns = layoutEvents(dayEvents);

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      {/* Time grid */}
      <div className="grid" style={{ gridTemplateColumns: '80px 1fr' }}>
        {/* Hour labels */}
        <div className="border-r bg-muted/50">
          {hours.map(h => (
            <div key={h} className="h-20 px-2 py-1 text-xs text-muted-foreground border-b text-right">
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Day column */}
        <div className="relative">
          {/* Hour grid lines */}
          {hours.map(h => (
            <div
              key={h}
              className="h-20 border-b cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => onNewEvent(dayStr, h)}
            />
          ))}

          {/* Events */}
          {columns.flat().map(item => {
            const topPx = (item.startMin / 60) * 80; // 80px per hour for day view
            const heightPx = ((item.endMin - item.startMin) / 60) * 80;
            const widthPct = 100 / item.totalCols!;
            const leftPct = item.colIndex! * widthPct;

            return (
              <div
                key={item.ev.id}
                onClick={() => onEditEvent(item.ev)}
                className={`group absolute rounded p-3 text-sm text-white cursor-pointer ${getPriorityColor(item.ev.priority)} transition-all shadow-sm hover:shadow-md`}
                style={{
                  top: `${topPx}px`,
                  height: `${Math.max(heightPx, 40)}px`,
                  left: `${leftPct}%`,
                  width: `calc(${widthPct}% - 8px)`,
                  marginLeft: '4px'
                }}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate mb-1">{item.ev.title}</div>
                    <div className="text-xs opacity-90">
                      {format(parseISO(item.ev.datetime), 'HH:mm')} - {format(addMinutes(parseISO(item.ev.datetime), item.ev.durationMinutes || 60), 'HH:mm')}
                    </div>
                    {item.ev.description && (
                      <div className="text-xs opacity-80 mt-1 line-clamp-2">
                        {item.ev.description}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-white hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditEvent(item.ev);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-white hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEvent(item.ev);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Layout helper: arrange events into columns for overlap resolution
function layoutEvents(items: EventPosition[]): EventPosition[][] {
  const cols: EventPosition[][] = [];
  const sorted = items.slice().sort((a, b) => a.startMin - b.startMin);
  
  for (const item of sorted) {
    let placed = false;
    for (let ci = 0; ci < cols.length; ci++) {
      const col = cols[ci];
      if (col.every(c => c.endMin <= item.startMin)) {
        col.push({ ...item, colIndex: ci });
        placed = true;
        break;
      }
    }
    if (!placed) {
      cols.push([{ ...item, colIndex: cols.length }]);
    }
  }
  
  const totalCols = cols.length || 1;
  return cols.map(col => col.map(c => ({ ...c, totalCols })));
}
