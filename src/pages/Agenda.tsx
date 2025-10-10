import React, { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, parseISO, getHours, getMinutes, startOfDay, addMinutes } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Plus, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useEvents, EventItem } from "@/contexts/EventsContext";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { validateRequired, getErrorMessage } from "@/lib/masks";

const Agenda = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { events, isLoading, createEvent, deleteEvent } = useEvents();
  const { toast } = useToast();
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", datetime: `${format(new Date(), 'yyyy-MM-dd')}T09:00`, priority: "Média" as "Baixa" | "Média" | "Alta", durationMinutes: 60 });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [eventToDelete, setEventToDelete] = useState<{ id: string; title: string } | null>(null);

  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 0 });
  const endDate = endOfWeek(lastDayOfMonth, { weekStartsOn: 0 });

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

  const openNewEvent = (dateIso?: string) => {
    const datePart = dateIso || format(new Date(), 'yyyy-MM-dd');
    setForm({ title: "", description: "", datetime: `${datePart}T09:00`, priority: "Média", durationMinutes: 60 });
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
      toast?.({ title: 'Erro de validação', description: 'Por favor, corrija os erros no formulário', variant: 'destructive' });
      return;
    }
    
    try {
      await createEvent({
        title: form.title,
        description: form.description,
        datetime: form.datetime,
        priority: form.priority,
        durationMinutes: form.durationMinutes
      });
      toast?.({ title: 'Evento criado', description: `${form.title} em ${format(new Date(form.datetime), "dd/MM/yyyy - HH:mm")}` });
      setIsModalOpen(false);
      setFormErrors({});
    } catch (error) {
      toast?.({ title: 'Erro', description: 'Falha ao criar evento', variant: 'destructive' });
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

  const eventsForDay = (d: Date) => {
    const day = format(d, 'yyyy-MM-dd');
    return events.filter(e => e.datetime.startsWith(day));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Agenda</h1>
            <p className="text-muted-foreground">Calendário e eventos</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              {'<'}
            </Button>
            <div className="text-sm font-medium">{format(currentMonth, 'LLLL yyyy', { locale: ptBR })}</div>
            <Button variant="ghost" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              {'>'}
            </Button>
              <div className="flex items-center space-x-2">
                <Button variant={view === 'month' ? 'default' : 'ghost'} onClick={() => setView('month')}>Mês</Button>
                <Button variant={view === 'week' ? 'default' : 'ghost'} onClick={() => setView('week')}>Semana</Button>
                <Button variant={view === 'day' ? 'default' : 'ghost'} onClick={() => setView('day')}>Dia</Button>
              </div>
              <Button variant="default" onClick={() => openNewEvent()} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Novo evento</span>
              </Button>
          </div>
        </div>

          {/* Week view - Coming soon */}
          {view === 'week' && (
            <div className="mt-4">
              <EmptyState
                icon={CalendarIcon}
                title="Visualização de semana"
                description="A visualização de semana estará disponível em breve."
              />
            </div>
          )}
          {view === 'day' && (
            <div className="mt-4">
              <EmptyState
                icon={CalendarIcon}
                title="Visualização de dia"
                description="A visualização de dia estará disponível em breve."
              />
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-7 gap-3">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : events.length === 0 && view === 'month' ? (
            <EmptyState
              icon={CalendarIcon}
              title="Nenhum evento agendado"
              description="Comece criando seu primeiro evento para organizar sua agenda e não perder compromissos importantes."
              actionLabel="Criar Primeiro Evento"
              onAction={() => openNewEvent()}
            />
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Calendar (span 2 on large) */}
            <div className="lg:col-span-2">

              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(7, minmax(160px, 1fr))' }}>
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                  <div key={d} className="text-sm text-muted-foreground text-center font-medium">{d}</div>
                ))}

                {weeks.map((week, wi) => (
                  week.map((day) => (
                    <div key={format(day, 'yyyy-MM-dd')} className={`p-4 border rounded-lg min-h-[160px] ${isSameMonth(day, currentMonth) ? 'bg-background' : 'opacity-40 bg-background'} transition-shadow hover:shadow-md flex flex-col`}> 
                        <div className="flex items-center justify-between mb-2">
                          <Button variant="ghost" size="sm" className="p-0 text-sm font-semibold text-left" onClick={() => { setSelectedDate(day); setView('day'); }}>{format(day, 'd')}</Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openNewEvent(format(day, 'yyyy-MM-dd'))}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      <div className="mt-auto space-y-2 w-full">
                        {eventsForDay(day).map(ev => (
                          <Card key={ev.id} className="group relative w-full p-3 transition-transform hover:scale-[1.01] active:scale-[0.995] overflow-hidden min-w-0">
                            <CardContent className="p-0 min-w-0">
                              <div className="relative min-w-0 pr-14">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="text-xs font-medium truncate">{ev.title}</div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {ev.title}
                                  </TooltipContent>
                                </Tooltip>
                                <div className="text-[11px] text-muted-foreground whitespace-nowrap">{format(new Date(ev.datetime), "dd/MM/yyyy - HH:mm")}</div>
                                <div className="absolute top-0 right-0 flex items-center gap-1">
                                  <Badge className="whitespace-nowrap px-1.5 py-0 text-[10px]" variant={ev.priority === 'Alta' ? 'destructive' : ev.priority === 'Média' ? 'default' : 'secondary'}>{ev.priority}</Badge>
                                  <Button aria-label="Excluir" title="Excluir" variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(ev)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))
                ))}
              </div>
            </div>
          </div>
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

// Small inline WeekView component to render timed events
type WeekViewProps = {
  events: EventItem[];
  currentDate: Date;
  onDelete: (id: string) => void;
};

function WeekView({ events, currentDate, onDelete }: WeekViewProps) {
  const start = startOfWeek(currentDate, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));

  const hours = Array.from({ length: 24 }).map((_, i) => i);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid" style={{ gridTemplateColumns: '80px 1fr' }}>
        <div className="bg-muted p-2">&nbsp;</div>
        <div className="grid grid-cols-7">
          {days.map(d => (
            <div key={format(d, 'yyyy-MM-dd')} className="p-2 text-sm text-center border-l">{format(d, 'EEE d', { locale: ptBR })}</div>
          ))}
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: '80px 1fr', minHeight: 400 }}>
        <div className="p-2">
          {hours.map(h => (
            <div key={h} className="h-12 text-xs text-muted-foreground">{String(h).padStart(2, '0')}:00</div>
          ))}
        </div>
        <div className="grid grid-cols-7 relative">
          {days.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const items = events.filter(ev => ev.datetime.startsWith(dayStr)).map(ev => {
              const startDt = parseISO(ev.datetime);
              const startMin = getHours(startDt) * 60 + getMinutes(startDt);
              const endMin = startMin + (ev.durationMinutes || 60);
              return { ev, startMin, endMin };
            });
            const columns = layoutEvents(items);
            return (
              <div key={dayStr} className="border-l relative" style={{ minHeight: 24 * 12 }}>
                {columns.flat().map(item => {
                  const topPct = (item.startMin / (24 * 60)) * 100;
                  const heightPct = ((item.endMin - item.startMin) / (24 * 60)) * 100;
                  const widthPct = 100 / item.totalCols;
                  const leftPct = item.colIndex * widthPct;
                  return (
                    <div key={item.ev.id} className="absolute p-2 rounded text-xs text-white" style={{ top: `${topPct}%`, height: `${heightPct}%`, left: `${leftPct}%`, width: `calc(${widthPct}% - 6px)`, marginLeft: '3px', background: '#4f46e5' }}>
                      <div className="flex justify-between items-start">
                        <div className="font-medium truncate">{item.ev.title}</div>
                        <button onClick={() => onDelete(item.ev.id)} aria-label="Excluir" className="ml-2 text-sm opacity-80">✕</button>
                      </div>
                      <div className="text-[11px]">{format(parseISO(item.ev.datetime), 'HH:mm')} - {format(addMinutes(parseISO(item.ev.datetime), item.ev.durationMinutes || 60), 'HH:mm')}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Layout helper: arrange events into columns for overlap resolution
function layoutEvents(items: { ev: EventItem; startMin: number; endMin: number }[]) {
  // simple greedy column assignment
  const cols: Array<Array<{ ev: EventItem; startMin: number; endMin: number; colIndex?: number; totalCols?: number }>> = [];
  const sorted = items.slice().sort((a,b) => a.startMin - b.startMin);
  for (const it of sorted) {
    let placed = false;
    for (let ci = 0; ci < cols.length; ci++) {
      const col = cols[ci];
      if (col.every(c => c.endMin <= it.startMin)) {
        col.push({ ...it, colIndex: ci } as any);
        placed = true;
        break;
      }
    }
    if (!placed) {
      cols.push([{ ...it, colIndex: cols.length } as any]);
    }
  }
  const totalCols = cols.length || 1;
  // flatten with metadata
  return cols.map(col => col.map(c => ({ ...c, totalCols })));
}

// DayView: single-column hourly grid
function DayView({ date, events, onDelete }: { date: Date; events: EventItem[]; onDelete: (id: string) => void }) {
  const dayStr = format(date, 'yyyy-MM-dd');
  const items = events.filter(ev => ev.datetime.startsWith(dayStr)).map(ev => {
    const startDt = parseISO(ev.datetime);
    const startMin = getHours(startDt) * 60 + getMinutes(startDt);
    const endMin = startMin + (ev.durationMinutes || 60);
    return { ev, startMin, endMin };
  });
  const columns = layoutEvents(items);
  const hours = Array.from({ length: 24 }).map((_, i) => i);
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="p-2 font-semibold">{format(date, 'EEEE, dd MMM yyyy', { locale: ptBR })}</div>
      <div className="grid" style={{ gridTemplateColumns: '80px 1fr', minHeight: 600 }}>
        <div className="p-2">
          {hours.map(h => (
            <div key={h} className="h-12 text-xs text-muted-foreground">{String(h).padStart(2, '0')}:00</div>
          ))}
        </div>
        <div className="relative">
          {columns.flat().map(item => {
            const topPct = (item.startMin / (24 * 60)) * 100;
            const heightPct = ((item.endMin - item.startMin) / (24 * 60)) * 100;
            const widthPct = 100 / item.totalCols;
            const leftPct = (item.colIndex || 0) * widthPct;
            return (
              <div key={item.ev.id} className="absolute p-2 rounded text-xs text-white" style={{ top: `${topPct}%`, height: `${heightPct}%`, left: `${leftPct}%`, width: `calc(${widthPct}% - 8px)`, marginLeft: '4px', background: '#059669' }}>
                <div className="flex justify-between items-start">
                  <div className="font-medium truncate">{item.ev.title}</div>
                  <button onClick={() => onDelete(item.ev.id)} aria-label="Excluir" className="ml-2 text-sm opacity-80">✕</button>
                </div>
                <div className="text-[11px]">{format(parseISO(item.ev.datetime), 'HH:mm')} - {format(addMinutes(parseISO(item.ev.datetime), item.ev.durationMinutes || 60), 'HH:mm')}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
