import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { MetricCard } from "@/components/MetricCard";
import { ListingColumn } from "@/components/ListingColumn";
import { PerformanceChallengeCard } from "@/components/PerformanceChallengeCard";
import { PerformanceTargetsPieChart } from "@/components/PerformanceTargetsPieChart";
import { PerformanceControlPanel } from "@/components/PerformanceControlPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { useBrokers } from '@/contexts/BrokersContext';
import { useClients } from '@/contexts/ClientsContext';
import { useListings, DetailedListingStatus } from '@/contexts/ListingsContext';
import { useSales } from '@/contexts/SalesContext';
import { useMeetings } from '@/contexts/MeetingsContext';
import { useExpenses } from '@/contexts/ExpensesContext';
import { TaskBoard } from '@/components/tasks/TaskBoard';
import {
  usePerformanceChallenges,
  PerformanceChallenge,
  PerformanceChallengePriority,
  PerformanceChallengeStatus,
  PerformanceMetricType,
  PerformanceTargetInput,
} from '@/contexts/PerformanceChallengesContext';
import { TaskBoard } from '@/components/tasks/TaskBoard';
import {
  ArrowLeft,
  TrendingUp,
  Home,
  DollarSign,
  Plus,
  Trash2,
  Edit
} from "lucide-react";
import { formatDateBR } from "@/lib/utils";

const COLOR_PALETTE = [
  "#8b5cf6",
  "#ec4899",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#14b8a6",
  "#6366f1",
];

type ChallengeTargetForm = {
  id?: string;
  metricType: PerformanceMetricType;
  targetValue: string;
  currentValue: string;
};

type ChallengeFormState = {
  title: string;
  description: string;
  status: PerformanceChallengeStatus;
  priority: PerformanceChallengePriority;
  startDate: string;
  endDate: string;
  selectedMetrics: Set<PerformanceMetricType>;
  metricValues: Record<PerformanceMetricType, { targetValue: string; currentValue: string }>;
};

const BrokerDetails = () => {
  const { brokerId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const { getBrokerById, refreshBrokers } = useBrokers();
  const { clients, addClient, updateClient, deleteClient, loading: clientsLoading } = useClients();
  const { 
    listings, 
    createListing, 
    updateListing, 
    deleteListing, 
    getListingsByBrokerId,
    getAggregateQuantity,
    updateAggregateQuantity,
    getDetailedListingsByType,
    getStatusAggregateQuantity,
    updateStatusAggregateQuantity
  } = useListings();
  const { sales, createSale, updateSale, deleteSale, getSalesByBrokerId } = useSales();
  const { meetings, createMeeting, updateMeeting, completeMeeting, deleteMeeting, getMeetingsByBrokerId } = useMeetings();
  const { expenses, createExpense, updateExpense, deleteExpense, getExpensesByBrokerId } = useExpenses();
  const {
    challenges,
    isLoading: challengesLoading,
    createChallenge,
    updateChallenge,
    deleteChallenge,
    getChallengesByBrokerId,
    refreshChallenges,
    updateTargetProgress,
  } = usePerformanceChallenges();

  const brokerFromStore = brokerId ? getBrokerById(brokerId) : undefined;

  // Verificar se o usuário logado é o próprio corretor visualizando sua página
  const isOwnProfile = user?.role === 'broker' && brokerFromStore?.email?.toLowerCase() === user?.email.toLowerCase();

  const [brokerData, setBrokerData] = useState(() => ({
    id: brokerId,
    name: brokerFromStore?.name ?? "",
    creci: brokerFromStore?.creci ?? "",
    email: brokerFromStore?.email ?? "",
    phone: brokerFromStore?.phone ?? "",
    totalSales: brokerFromStore?.totalSales ?? 0,
    totalListings: brokerFromStore?.totalListings ?? 0,
    monthlyExpenses: brokerFromStore?.monthlyExpenses ?? 0,
    totalValue: brokerFromStore?.totalValue ?? 0,
    sales: brokerFromStore && (brokerFromStore as any).sales ? (brokerFromStore as any).sales : [],
    listings: brokerFromStore && (brokerFromStore as any).listings ? (brokerFromStore as any).listings : [],
    meetings: brokerFromStore && (brokerFromStore as any).meetings ? (brokerFromStore as any).meetings : [],
    expenses: brokerFromStore && (brokerFromStore as any).expenses ? (brokerFromStore as any).expenses : []
  }));

  // Filter clients for this broker
  const brokerClients = clients.filter(client => client.broker_id === brokerId);
  const brokerListings = brokerId ? getListingsByBrokerId(brokerId) : [];
  const brokerChallenges = brokerId ? getChallengesByBrokerId(brokerId) : [];
  const sortedBrokerChallenges = [...brokerChallenges].sort((a, b) => {
    const endA = new Date(a.endDate).getTime();
    const endB = new Date(b.endDate).getTime();
    if (Number.isNaN(endA) || Number.isNaN(endB)) return 0;
    return endA - endB;
  });
  const canManagePerformance = user?.role === 'manager' || user?.role === 'admin';
  const canUpdatePerformanceProgress = canManagePerformance || isOwnProfile;
  // Total de TODAS as captações (manuais dos 4 status + detalhadas)
  // Ignora registros antigos com status 'Agregado' (sistema antigo)
  const totalListingsCount = brokerListings
    .filter(listing => listing.status !== 'Agregado')
    .reduce((acc, listing) => {
      const parsed = Number(listing.quantity);
      const quantity = Number.isFinite(parsed) ? parsed : 1;
      const safeQuantity = quantity >= 0 ? quantity : 0;
      return acc + safeQuantity;
    }, 0);
  const metricOptions: PerformanceMetricType[] = [
    'calls',
    'visits',
    'in_person_visits',
    'sales',
    'sales_value',
    'listings',
    'meetings',
    'tasks',
  ];

  const metricLabels: Record<PerformanceMetricType, string> = {
    sales: 'Vendas',
    sales_value: 'Valor Vendido',
    listings: 'Captações',
    meetings: 'Reuniões',
    tasks: 'Tarefas',
    calls: 'Ligações',
    visits: 'Visitas Externas',
    in_person_visits: 'Visitas na Imobiliária',
  };

  const statusOptions: Array<{ value: PerformanceChallengeStatus; label: string }> = [
    { value: 'active', label: 'Em andamento' },
    { value: 'completed', label: 'Concluído' },
    { value: 'overdue', label: 'Atrasado' },
    { value: 'cancelled', label: 'Cancelado' },
  ];

  const priorityOptions: Array<{ value: PerformanceChallengePriority; label: string }> = [
    { value: 'low', label: 'Baixa' },
    { value: 'medium', label: 'Média' },
    { value: 'high', label: 'Alta' },
  ];

  const createEmptyTarget = (): ChallengeTargetForm => ({
    metricType: 'calls',
    targetValue: '',
    currentValue: '',
  });

  const createEmptyChallengeForm = (): ChallengeFormState => {
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDateObj = new Date(today);
    endDateObj.setDate(endDateObj.getDate() + 7);

    return {
      title: '',
      description: '',
      status: 'active',
      priority: 'medium',
      startDate,
      endDate: endDateObj.toISOString().split('T')[0],
      selectedMetrics: new Set<PerformanceMetricType>(),
      metricValues: {} as Record<PerformanceMetricType, { targetValue: string; currentValue: string }>,
    };
  };
    
  // Carrega os dados dos contextos quando o brokerId ou os dados mudam
  useEffect(() => {
    if (!brokerId) return;

    const brokerListings = getListingsByBrokerId(brokerId);
    const brokerSales = getSalesByBrokerId(brokerId);
    const brokerMeetings = getMeetingsByBrokerId(brokerId);
    const brokerExpenses = getExpensesByBrokerId(brokerId);

    // Atualiza o estado com os dados reais do banco
    setBrokerData(prev => ({
      ...prev,
      listings: brokerListings.map(l => ({
        id: l.id,
        propertyType: l.propertyType,
        quantity: l.quantity,
        status: l.status,
        date: l.listingDate,
        // Campos antigos para exibição de compatibilidade
        address: l.propertyAddress
      })),
      sales: brokerSales.map(s => ({
        id: s.id,
        description: s.propertyAddress,
        value: s.saleValue,
        date: s.saleDate
      })),
      meetings: brokerMeetings.map(m => ({
        id: m.id,
        title: m.meetingType,
        content: m.notes || '',
        date: m.meetingDate,
        status: m.status,
        summary: m.summary,
        clientName: m.clientName
      })),
      expenses: brokerExpenses.map(e => ({
        id: e.id,
        description: e.description,
        cost: e.amount,
        date: e.expenseDate
      })),
      totalSales: brokerSales.length,
      totalListings: brokerListings
        .filter(listing => listing.status !== 'Agregado')
        .reduce((acc, listing) => {
          const parsed = Number(listing.quantity);
          const quantity = Number.isFinite(parsed) ? parsed : 1;
          const safeQuantity = quantity >= 0 ? quantity : 0;
          // Somar TODAS as captações (manuais dos 4 status + detalhadas)
          return acc + safeQuantity;
        }, 0),
      totalValue: brokerSales.reduce((sum, s) => sum + s.saleValue, 0),
      monthlyExpenses: brokerExpenses.reduce((sum, e) => sum + e.amount, 0)
    }));
  }, [brokerId, listings, sales, meetings, expenses, getListingsByBrokerId, getSalesByBrokerId, getMeetingsByBrokerId, getExpensesByBrokerId]);

  // Modal states
  const [performanceModalOpen, setPerformanceModalOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<PerformanceChallenge | null>(null);
  const [challengeForm, setChallengeForm] = useState<ChallengeFormState>(() => createEmptyChallengeForm());
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [challengeOverrides, setChallengeOverrides] = useState<Record<string, PerformanceChallenge>>({});
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});
  const updateTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pendingTargetsRef = useRef<Record<string, PerformanceTargetInput[]>>({});
  const [salesModalOpen, setSalesModalOpen] = useState(false);
  const [listingsModalOpen, setListingsModalOpen] = useState(false);
  const [meetingsModalOpen, setMeetingsModalOpen] = useState(false);
  const [completeMeetingModalOpen, setCompleteMeetingModalOpen] = useState(false);
  const [expensesModalOpen, setExpensesModalOpen] = useState(false);
  const [clientsModalOpen, setClientsModalOpen] = useState(false);
  const [selectedPropertyType, setSelectedPropertyType] = useState<'Apartamento' | 'Casa' | 'Sobrado' | 'Lote' | 'Chácara' | null>(null);

  // Form states
  const [newSale, setNewSale] = useState({ propertyAddress: "", clientName: "", saleValue: "", commission: "", date: "" });
  const [newListing, setNewListing] = useState({ 
    propertyType: "Apartamento", 
    quantity: "1", 
    status: "Ativo", 
    date: new Date().toISOString().split('T')[0], 
    propertyAddress: "", 
    propertyValue: "" 
  });
  const [newMeeting, setNewMeeting] = useState({ clientName: "", meetingType: "", notes: "", date: "" });
  const [meetingSummary, setMeetingSummary] = useState("");
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [newExpense, setNewExpense] = useState({ description: "", amount: "", category: "", date: "" });
  const [clientForm, setClientForm] = useState({
    client_name: "",
    interest: "",
    negotiation_status: "",
    is_active: true,
    status_color: "green",
    last_updates: "",
  });
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  useEffect(() => {
    if (sortedBrokerChallenges.length === 0) {
      setSelectedChallengeId(null);
      return;
    }

    setSelectedChallengeId((previous) => {
      const availableIds = new Set(sortedBrokerChallenges.map((challenge) => challenge.id));
      if (previous && availableIds.has(previous)) {
        return previous;
      }

      const latestActive = [...sortedBrokerChallenges]
        .filter((challenge) => challenge.status === 'active')
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];

      if (latestActive) {
        return latestActive.id;
      }

      const mostRecent = [...sortedBrokerChallenges]
        .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];

      return mostRecent ? mostRecent.id : sortedBrokerChallenges[0].id;
    });
  }, [sortedBrokerChallenges]);

// Limpa os valores dos sliders quando o desafio selecionado muda
useEffect(() => {
  if (selectedChallengeId) {
    // Não limpa todos os valores, mas podemos adicionar um efeito se necessário
  }
}, [selectedChallengeId]);

  const displayChallenges = useMemo(
    () =>
      sortedBrokerChallenges.map((challenge) =>
        challengeOverrides[challenge.id] ? challengeOverrides[challenge.id] : challenge,
      ),
    [sortedBrokerChallenges, challengeOverrides],
  );

  const selectedChallenge = selectedChallengeId
    ? displayChallenges.find((challenge) => challenge.id === selectedChallengeId) ?? null
    : null;

  const firstDisplayChallengeId = displayChallenges.length > 0 ? displayChallenges[0].id : undefined;

  useEffect(() => () => {
    Object.values(updateTimeoutsRef.current).forEach((timeoutId) => clearTimeout(timeoutId));
  }, []);

  useEffect(() => {
    if (Object.keys(challengeOverrides).length === 0) {
      return;
    }

    const availableIds = new Set(sortedBrokerChallenges.map((challenge) => challenge.id));
    const idsToRemove = Object.keys(challengeOverrides).filter((id) => !availableIds.has(id));

    if (idsToRemove.length === 0) {
      return;
    }

    setChallengeOverrides((prev) => {
      const next = { ...prev };
      idsToRemove.forEach((id) => delete next[id]);
      return next;
    });

    idsToRemove.forEach((id) => {
      if (updateTimeoutsRef.current[id]) {
        clearTimeout(updateTimeoutsRef.current[id]);
        delete updateTimeoutsRef.current[id];
      }
      delete pendingTargetsRef.current[id];
    });
  }, [challengeOverrides, sortedBrokerChallenges]);

  const resetChallengeForm = () => {
    setChallengeForm(createEmptyChallengeForm());
    setEditingChallenge(null);
  };

  const handleOpenPerformanceModal = (challenge?: PerformanceChallenge) => {
    if (!canManagePerformance) return;

    if (challenge) {
      setEditingChallenge(challenge);
      
      const selectedMetrics = new Set<PerformanceMetricType>(
        challenge.targets.map(t => t.metricType)
      );
      
      const metricValues = challenge.targets.reduce((acc, target) => {
        acc[target.metricType] = {
          targetValue: target.targetValue.toString(),
          currentValue: target.currentValue.toString(),
        };
        return acc;
      }, {} as Record<PerformanceMetricType, { targetValue: string; currentValue: string }>);
      
      setChallengeForm({
        title: challenge.title,
        description: challenge.description || '',
        status: challenge.status,
        priority: challenge.priority,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        selectedMetrics,
        metricValues,
      });
      setPerformanceModalOpen(true);
      return;
    }

    resetChallengeForm();
    setPerformanceModalOpen(true);
  };

  const handleClosePerformanceModal = () => {
    setPerformanceModalOpen(false);
    resetChallengeForm();
  };

  const handleMetricToggle = (metricType: PerformanceMetricType, checked: boolean) => {
    setChallengeForm((prev) => {
      const newSelectedMetrics = new Set(prev.selectedMetrics);
      const newMetricValues = { ...prev.metricValues };
      
      if (checked) {
        newSelectedMetrics.add(metricType);
        if (!newMetricValues[metricType]) {
          newMetricValues[metricType] = { targetValue: '', currentValue: '0' };
        }
      } else {
        newSelectedMetrics.delete(metricType);
        delete newMetricValues[metricType];
      }
      
      return {
        ...prev,
        selectedMetrics: newSelectedMetrics,
        metricValues: newMetricValues,
      };
    });
  };

  const handleMetricValueChange = (
    metricType: PerformanceMetricType,
    field: 'targetValue' | 'currentValue',
    value: string,
  ) => {
    setChallengeForm((prev) => ({
      ...prev,
      metricValues: {
        ...prev.metricValues,
        [metricType]: {
          ...prev.metricValues[metricType],
          [field]: value,
        },
      },
    }));
  };

  const normalizeTargets = (): PerformanceTargetInput[] =>
    Array.from(challengeForm.selectedMetrics)
      .map((metricType) => {
        const values = challengeForm.metricValues[metricType];
        if (!values) return null;
        
        return {
          metricType,
          targetValue: Number(values.targetValue),
          currentValue: values.currentValue ? Number(values.currentValue) : 0,
        };
      })
      .filter((target): target is NonNullable<typeof target> => 
        target !== null && Number.isFinite(target.targetValue) && target.targetValue > 0
      );

  const handlePerformanceSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canManagePerformance) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para alterar desafios",
        variant: "destructive",
      });
      return;
    }

    if (!brokerId) {
      toast({ title: "Erro", description: "ID do corretor não encontrado", variant: "destructive" });
      return;
    }

    if (!challengeForm.title || !challengeForm.startDate || !challengeForm.endDate) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

    const targets = normalizeTargets();

    if (targets.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um indicador com meta válida",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingChallenge) {
        await updateChallenge(editingChallenge.id, {
          title: challengeForm.title,
          description: challengeForm.description || null,
          status: challengeForm.status,
          priority: challengeForm.priority,
          startDate: challengeForm.startDate,
          endDate: challengeForm.endDate,
          targets,
        });

        toast({ title: "Sucesso", description: "Desafio atualizado com sucesso!" });
      } else {
        const created = await createChallenge({
          brokerId,
          title: challengeForm.title,
          description: challengeForm.description || undefined,
          status: challengeForm.status,
          priority: challengeForm.priority,
          startDate: challengeForm.startDate,
          endDate: challengeForm.endDate,
          targets,
        });

        setSelectedChallengeId(created.id);
        toast({ title: "Sucesso", description: "Desafio criado com sucesso!" });
      }

      handleClosePerformanceModal();
    } catch (error) {
      console.error("Erro ao salvar desafio de desempenho:", error);
      toast({ title: "Erro", description: "Não foi possível salvar o desafio", variant: "destructive" });
    }
  };

  const handleDeletePerformanceChallenge = async (id: string) => {
    if (!canManagePerformance) return;
    if (!confirm("Tem certeza que deseja excluir este desafio?")) return;

    try {
      await deleteChallenge(id);

      if (selectedChallengeId === id) {
        setSelectedChallengeId(null);
      }

      if (updateTimeoutsRef.current[id]) {
        clearTimeout(updateTimeoutsRef.current[id]);
        delete updateTimeoutsRef.current[id];
      }

      delete pendingTargetsRef.current[id];

      setChallengeOverrides((prev) => {
        if (!(id in prev)) {
          return prev;
        }
        const next = { ...prev };
        delete next[id];
        return next;
      });

      toast({ title: "Sucesso", description: "Desafio excluído com sucesso!" });
    } catch (error) {
      console.error("Erro ao excluir desafio de desempenho:", error);
      toast({ title: "Erro", description: "Não foi possível excluir o desafio", variant: "destructive" });
    }
  };

  const handleAdjustChallengeTarget = (challengeId: string, targetId: string, delta: number) => {
    if (!canUpdatePerformanceProgress) {
      toast({ title: "Acesso negado", description: "Você não pode ajustar o progresso deste indicador", variant: "destructive" });
      return;
    }

    const baseChallenge = challengeOverrides[challengeId]
      ?? sortedBrokerChallenges.find((item) => item.id === challengeId);

    if (!baseChallenge) {
      toast({ title: "Erro", description: "Indicador não encontrado para ajuste", variant: "destructive" });
      return;
    }

    let hasChanged = false;

    const updatedTargetsDetailed = baseChallenge.targets.map((item) => {
      const proposed = item.id === targetId
        ? Number((item.currentValue + delta).toFixed(2))
        : item.currentValue;

      const clamped = Math.max(0, Math.min(item.targetValue, proposed));
      const progress = item.targetValue > 0
        ? Math.min(Math.max(clamped / item.targetValue, 0), 1) * 100
        : 0;

      if (item.id === targetId && clamped !== item.currentValue) {
        hasChanged = true;
      }

      return {
        ...item,
        currentValue: clamped,
        progress,
      };
    });

    if (!hasChanged) {
      return;
    }

    const relevantTargets = updatedTargetsDetailed.filter((target) => target.targetValue > 0);
    const overallProgress = relevantTargets.length === 0
      ? 0
      : relevantTargets.reduce((sum, target) => sum + target.progress, 0) / relevantTargets.length;

    const isOverdue = overallProgress < 100
      && baseChallenge.status !== 'completed'
      && new Date(baseChallenge.endDate) < new Date();

    const optimisticChallenge: PerformanceChallenge = {
      ...baseChallenge,
      targets: updatedTargetsDetailed,
      overallProgress,
      isOverdue,
    };

    setChallengeOverrides((prev) => ({ ...prev, [challengeId]: optimisticChallenge }));

    pendingTargetsRef.current[challengeId] = updatedTargetsDetailed.map((target) => ({
      id: target.id,
      metricType: target.metricType,
      targetValue: target.targetValue,
      currentValue: Number(target.currentValue.toFixed(2)),
    }));

    if (updateTimeoutsRef.current[challengeId]) {
      clearTimeout(updateTimeoutsRef.current[challengeId]);
    }

    updateTimeoutsRef.current[challengeId] = setTimeout(async () => {
      const payload = pendingTargetsRef.current[challengeId];
      if (!payload) {
        delete updateTimeoutsRef.current[challengeId];
        return;
      }

      try {
        await updateChallenge(challengeId, { targets: payload });
        delete pendingTargetsRef.current[challengeId];
        setChallengeOverrides((prev) => {
          const next = { ...prev };
          delete next[challengeId];
          return next;
        });
      } catch (error) {
        console.error("Erro ao ajustar indicador de desempenho:", error);
        toast({ title: "Erro", description: "Não foi possível atualizar o progresso", variant: "destructive" });
        delete pendingTargetsRef.current[challengeId];
        setChallengeOverrides((prev) => {
          const next = { ...prev };
          delete next[challengeId];
          return next;
        });
        await refreshChallenges();
      } finally {
        delete updateTimeoutsRef.current[challengeId];
      }
    }, 1200);
  };

  const handleSliderChange = async (challengeId: string, targetId: string, newValue: number) => {
    const roundedValue = Math.round(newValue);
    
    // Atualiza os valores dos sliders no estado local para UI responsiva
    setSliderValues(prev => ({
      ...prev,
      [`${challengeId}-${targetId}`]: roundedValue
    }));

    // Atualização otimista: chama o Context que atualiza imediatamente o estado
    // e persiste no banco de dados de forma debounced (800ms)
    try {
      if (typeof updateTargetProgress === 'function') {
        await updateTargetProgress(challengeId, targetId, roundedValue);
      }
    } catch (err) {
      console.error('Erro ao atualizar progresso do indicador:', err);
      // Reverte o valor do slider em caso de erro
      setSliderValues(prev => {
        const updated = { ...prev };
        delete updated[`${challengeId}-${targetId}`];
        return updated;
      });
      toast({ 
        title: "Erro", 
        description: "Não foi possível atualizar o progresso do indicador", 
        variant: "destructive" 
      });
    }
  };

  const getModifiedTargets = (challenge: PerformanceChallenge | null) => {
    if (!challenge) return [];
    
    return challenge.targets.map(target => {
      const sliderKey = `${challenge.id}-${target.id}`;
      const modifiedValue = sliderValues[sliderKey];
      
      if (modifiedValue !== undefined) {
        // Calcula o novo progresso com base no valor modificado (usando inteiros)
        const targetInt = Math.round(target.targetValue);
        const modifiedInt = Math.round(modifiedValue);
        const newProgress = targetInt > 0
          ? Math.min(Math.max((modifiedInt / targetInt) * 100, 0), 100)
          : 0;
          
        return {
          ...target,
          currentValue: modifiedInt,
          progress: newProgress
        };
      }
      
      return {
        ...target,
        currentValue: Math.round(target.currentValue),
        progress: target.progress
      };
    });
  };

  const addSale = async () => {
    if (!newSale.propertyAddress || !newSale.clientName || !newSale.saleValue || !newSale.commission || !newSale.date) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    if (!brokerId) {
      toast({ title: "Erro", description: "ID do corretor não encontrado", variant: "destructive" });
      return;
    }

    try {
      if (editingSaleId) {
        await updateSale(editingSaleId, {
          propertyAddress: newSale.propertyAddress,
          clientName: newSale.clientName,
          saleValue: parseFloat(newSale.saleValue),
          commission: parseFloat(newSale.commission),
          saleDate: newSale.date
        });
        toast({ title: "Sucesso", description: "Venda atualizada com sucesso!" });
      } else {
        await createSale({
          brokerId: brokerId,
          propertyAddress: newSale.propertyAddress,
          clientName: newSale.clientName,
          saleValue: parseFloat(newSale.saleValue),
          commission: parseFloat(newSale.commission),
          saleDate: newSale.date
        });
        toast({ title: "Sucesso", description: "Venda adicionada com sucesso!" });
      }

      setNewSale({ propertyAddress: "", clientName: "", saleValue: "", commission: "", date: "" });
      setEditingSaleId(null);
      setSalesModalOpen(false);
      
      // O useEffect vai recarregar automaticamente os dados
    } catch (error) {
      console.error("Erro ao salvar venda:", error);
      toast({ 
        title: "Erro", 
        description: error instanceof Error ? error.message : "Erro ao salvar venda", 
        variant: "destructive" 
      });
    }
  };

  const handleEditSale = (sale: any) => {
    setNewSale({
      propertyAddress: sale.description,
      clientName: "",
      saleValue: sale.value.toString(),
      commission: "",
      date: sale.date
    });
    setEditingSaleId(sale.id);
    setSalesModalOpen(true);
  };

  const handleDeleteSale = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta venda?")) {
      try {
        await deleteSale(id);
        toast({ title: "Sucesso", description: "Venda excluída com sucesso!" });
      } catch (error) {
        toast({
          title: "Erro ao excluir venda",
          variant: "destructive",
        });
      }
    }
  };

  const addListing = async () => {
    if (!newListing.propertyType || !newListing.quantity || !newListing.date) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    if (!brokerId) {
      toast({ title: "Erro", description: "ID do corretor não encontrado", variant: "destructive" });
      return;
    }

    try {
      if (editingListingId) {
        await updateListing(editingListingId, {
          propertyType: newListing.propertyType as 'Apartamento' | 'Casa' | 'Sobrado' | 'Lote' | 'Chácara',
          quantity: parseInt(newListing.quantity),
          listingDate: newListing.date,
          status: newListing.status as 'Ativo' | 'Desativado' | 'Vendido' | 'Moderação',
          propertyAddress: newListing.propertyAddress || undefined,
          propertyValue: newListing.propertyValue ? parseFloat(newListing.propertyValue) : undefined
        });
        await refreshBrokers();
        toast({ title: "Sucesso", description: "Captação atualizada com sucesso!" });
      } else {
        await createListing({
          brokerId: brokerId,
          propertyType: newListing.propertyType as 'Apartamento' | 'Casa' | 'Sobrado' | 'Lote' | 'Chácara',
          quantity: parseInt(newListing.quantity),
          listingDate: newListing.date,
          status: newListing.status as 'Ativo' | 'Desativado' | 'Vendido' | 'Moderação',
          propertyAddress: newListing.propertyAddress || undefined,
          propertyValue: newListing.propertyValue ? parseFloat(newListing.propertyValue) : undefined
        });
        await refreshBrokers();
        toast({ title: "Sucesso", description: "Captação adicionada com sucesso!" });
      }

      setNewListing({ 
        propertyType: "Apartamento", 
        quantity: "1", 
        status: "Ativo", 
        date: new Date().toISOString().split('T')[0], 
        propertyAddress: "", 
        propertyValue: "" 
      });
      setEditingListingId(null);
      setListingsModalOpen(false);
      
      // O useEffect vai recarregar automaticamente os dados
    } catch (error) {
      console.error("Erro ao salvar captação:", error);
      toast({ 
        title: "Erro", 
        description: error instanceof Error ? error.message : "Erro ao salvar captação", 
        variant: "destructive" 
      });
    }
  };

  const handleEditListing = (listing: any) => {
    setNewListing({
      propertyType: listing.propertyType || "",
      quantity: listing.quantity?.toString() || "1",
      status: listing.status,
      date: listing.listingDate || listing.date,
      propertyAddress: listing.propertyAddress || "",
      propertyValue: listing.propertyValue?.toString() || ""
    });
    setEditingListingId(listing.id);
    setListingsModalOpen(true);
  };

  const handleDeleteListing = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta captação?")) {
      try {
        await deleteListing(id);
        await refreshBrokers();
        toast({ title: "Sucesso", description: "Captação excluída com sucesso!" });
      } catch (error) {
        toast({
          title: "Erro ao excluir captação",
          variant: "destructive",
        });
      }
    }
  };

  const addMeeting = async () => {
    if (!newMeeting.clientName || !newMeeting.meetingType || !newMeeting.date) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    if (!brokerId) {
      toast({ title: "Erro", description: "ID do corretor não encontrado", variant: "destructive" });
      return;
    }

    try {
      if (editingMeetingId) {
        await updateMeeting(editingMeetingId, {
          clientName: newMeeting.clientName,
          meetingType: newMeeting.meetingType,
          meetingDate: newMeeting.date,
          notes: newMeeting.notes || undefined
        });
        toast({ title: "Sucesso", description: "Reunião atualizada com sucesso!" });
      } else {
        await createMeeting({
          brokerId: brokerId,
          clientName: newMeeting.clientName,
          meetingType: newMeeting.meetingType,
          meetingDate: newMeeting.date,
          notes: newMeeting.notes || undefined
        });
        toast({ title: "Sucesso", description: "Reunião adicionada com sucesso!" });
      }

      setNewMeeting({ clientName: "", meetingType: "", notes: "", date: "" });
      setEditingMeetingId(null);
      setMeetingsModalOpen(false);
      
      // O useEffect vai recarregar automaticamente os dados
    } catch (error) {
      console.error("Erro ao salvar reunião:", error);
      toast({ 
        title: "Erro", 
        description: error instanceof Error ? error.message : "Erro ao salvar reunião", 
        variant: "destructive" 
      });
    }
  };

  const handleEditMeeting = (meeting: any) => {
    setNewMeeting({
      clientName: "",
      meetingType: meeting.title,
      notes: meeting.content,
      date: meeting.date
    });
    setEditingMeetingId(meeting.id);
    setMeetingsModalOpen(true);
  };

  const handleDeleteMeeting = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta reunião?")) {
      try {
        await deleteMeeting(id);
        toast({ title: "Sucesso", description: "Reunião excluída com sucesso!" });
      } catch (error) {
        toast({
          title: "Erro ao excluir reunião",
          variant: "destructive",
        });
      }
    }
  };

  const handleOpenCompleteMeetingModal = (meetingId: string) => {
    setSelectedMeetingId(meetingId);
    setMeetingSummary("");
    setCompleteMeetingModalOpen(true);
  };

  const handleCompleteMeeting = async () => {
    if (!meetingSummary.trim()) {
      toast({ title: "Erro", description: "Por favor, descreva o que foi discutido na reunião", variant: "destructive" });
      return;
    }

    if (!selectedMeetingId) {
      toast({ title: "Erro", description: "Reunião não encontrada", variant: "destructive" });
      return;
    }

    try {
      await completeMeeting(selectedMeetingId, meetingSummary);
      toast({ title: "Sucesso", description: "Reunião finalizada com sucesso!" });
      setCompleteMeetingModalOpen(false);
      setMeetingSummary("");
      setSelectedMeetingId(null);
    } catch (error) {
      console.error("Erro ao finalizar reunião:", error);
      toast({
        title: "Erro ao finalizar reunião",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const addExpense = async () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.category || !newExpense.date) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    if (!brokerId) {
      toast({ title: "Erro", description: "ID do corretor não encontrado", variant: "destructive" });
      return;
    }

    try {
      if (editingExpenseId) {
        await updateExpense(editingExpenseId, {
          description: newExpense.description,
          amount: parseFloat(newExpense.amount),
          category: newExpense.category,
          expenseDate: newExpense.date
        });
        toast({ title: "Sucesso", description: "Gasto atualizado com sucesso!" });
      } else {
        await createExpense({
          brokerId: brokerId,
          description: newExpense.description,
          amount: parseFloat(newExpense.amount),
          category: newExpense.category,
          expenseDate: newExpense.date
        });
        toast({ title: "Sucesso", description: "Gasto adicionado com sucesso!" });
      }

      setNewExpense({ description: "", amount: "", category: "", date: "" });
      setEditingExpenseId(null);
      setExpensesModalOpen(false);
      
      // O useEffect vai recarregar automaticamente os dados
    } catch (error) {
      console.error("Erro ao salvar gasto:", error);
      toast({ 
        title: "Erro", 
        description: error instanceof Error ? error.message : "Erro ao salvar gasto", 
        variant: "destructive" 
      });
    }
  };

  const handleEditExpense = (expense: any) => {
    setNewExpense({
      description: expense.description,
      amount: expense.cost.toString(),
      category: "",
      date: expense.date
    });
    setEditingExpenseId(expense.id);
    setExpensesModalOpen(true);
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este gasto?")) {
      try {
        await deleteExpense(id);
        toast({ title: "Sucesso", description: "Gasto excluído com sucesso!" });
      } catch (error) {
        toast({
          title: "Erro ao excluir gasto",
          variant: "destructive",
        });
      }
    }
  };

  // Reset functions
  const resetClientForm = () => {
    setClientForm({
      client_name: "",
      interest: "",
      negotiation_status: "",
      is_active: true,
      status_color: "green",
      last_updates: "",
    });
    setEditingClientId(null);
  };

  const resetSaleForm = () => {
    setNewSale({ propertyAddress: "", clientName: "", saleValue: "", commission: "", date: "" });
    setEditingSaleId(null);
  };

  const resetListingForm = () => {
    setNewListing({ 
      propertyType: "Apartamento", 
      quantity: "1", 
      status: "Ativo", 
      date: new Date().toISOString().split('T')[0], 
      propertyAddress: "", 
      propertyValue: "" 
    });
    setEditingListingId(null);
  };

  const resetMeetingForm = () => {
    setNewMeeting({ clientName: "", meetingType: "", notes: "", date: "" });
    setEditingMeetingId(null);
  };

  const resetExpenseForm = () => {
    setNewExpense({ description: "", amount: "", category: "", date: "" });
    setEditingExpenseId(null);
  };

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brokerId) return;

    try {
      if (editingClientId) {
        await updateClient(editingClientId, clientForm);
        toast({ title: "Cliente atualizado com sucesso!" });
      } else {
        await addClient({ ...clientForm, broker_id: brokerId });
        toast({ title: "Cliente adicionado com sucesso!" });
      }
      setClientsModalOpen(false);
      resetClientForm();
    } catch (error) {
      toast({
        title: "Erro ao salvar cliente",
        variant: "destructive",
      });
    }
  };

  const handleEditClient = (client: any) => {
    setClientForm({
      client_name: client.client_name,
      interest: client.interest,
      negotiation_status: client.negotiation_status,
      is_active: client.is_active,
      status_color: client.status_color || "green",
      last_updates: client.last_updates || "",
    });
    setEditingClientId(client.id);
    setClientsModalOpen(true);
  };

  const handleDeleteClient = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      try {
        await deleteClient(id);
        toast({ title: "Cliente excluído com sucesso!" });
      } catch (error) {
        toast({
          title: "Erro ao excluir cliente",
          variant: "destructive",
        });
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      "Ativa": "default",
      "Vendida": "secondary",
      "Cancelada": "destructive"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        {!isOwnProfile && (
          <Breadcrumbs 
            items={[
              { label: "Corretores", href: "/brokers" },
              { label: brokerData.name || "Detalhes" }
            ]} 
            className="mb-6"
          />
        )}
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            {!isOwnProfile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/brokers")}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {isOwnProfile ? 'Meu Perfil' : brokerData.name}
              </h1>
              <p className="text-muted-foreground">{brokerData.email} • {brokerData.phone} • CRECI {brokerData.creci}</p>
            </div>
          </div>
        </div>

        {/* Métricas do Corretor */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Vendas no Ano"
            value={brokerData.totalSales}
            icon={TrendingUp}
            variant="success"
          />
          <MetricCard
            title="Captações"
            value={brokerData.totalListings}
            icon={Home}
            variant="info"
          />
          <MetricCard
            title="Valor Total Vendido"
            value={new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0
            }).format(brokerData.totalValue)}
            icon={DollarSign}
            variant="success"
          />
          <MetricCard
            title="Gastos no Mês"
            value={new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(brokerData.monthlyExpenses)}
            icon={DollarSign}
            variant="warning"
          />
        </div>

        {/* Tabs com Detalhes */}
        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="performance">Desempenho</TabsTrigger>
            <TabsTrigger value="clients">Clientes</TabsTrigger>
            <TabsTrigger value="sales">Vendas</TabsTrigger>
            <TabsTrigger value="listings">Captações</TabsTrigger>
            <TabsTrigger value="meetings">Reuniões</TabsTrigger>
            <TabsTrigger value="expenses">Gastos</TabsTrigger>
            <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Desafios de Desempenho</h2>
                <p className="text-sm text-muted-foreground">
                  Acompanhe indicadores combinados que o gerente definiu para este corretor.
                </p>
              </div>
              {canManagePerformance && (
                <Button size="sm" className="gap-2" onClick={() => handleOpenPerformanceModal()}>
                  <Plus className="h-4 w-4" />
                  Novo desafio
                </Button>
              )}
            </div>

            {challengesLoading ? (
              <Card>
                <CardContent className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                  Carregando desafios...
                </CardContent>
              </Card>
            ) : sortedBrokerChallenges.length === 0 ? (
              <Card className="p-10 text-center text-sm text-muted-foreground">
                <p>Nenhum desafio cadastrado para este corretor no momento.</p>
                {canManagePerformance && (
                  <Button size="sm" className="mt-4 gap-2" onClick={() => handleOpenPerformanceModal()}>
                    <Plus className="h-4 w-4" />
                    Criar primeiro desafio
                  </Button>
                )}
              </Card>
            ) : (
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="w-full justify-start rounded-xl bg-muted/40 p-1 text-muted-foreground">
                  <TabsTrigger
                    value="overview"
                    className="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
                  >
                    Resumo
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
                  >
                    Histórico
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Header do Dashboard */}
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-1">
                    </div>
                    <div className="flex items-center gap-3">
                      <Select
                        value={selectedChallengeId ?? firstDisplayChallengeId ?? ""}
                        onValueChange={(value) => setSelectedChallengeId(value)}
                      >
                        <SelectTrigger className="w-[280px]">
                          <SelectValue placeholder="Selecione um desafio" />
                        </SelectTrigger>
                        <SelectContent>
                          {displayChallenges.map((challenge) => (
                            <SelectItem key={challenge.id} value={challenge.id}>
                              {challenge.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedChallenge ? (
                    <>
                      {/* Cards de Métricas Principais */}
                      

                      {/* Grid Principal com Gráfico e Painel de Controle */}
                      <div className="grid gap-6 lg:grid-cols-3">
                        {/* Coluna Esquerda - Gráfico Principal */}
                        <div className="lg:col-span-2">
                          <PerformanceTargetsPieChart
                            targets={getModifiedTargets(selectedChallenge)}
                            title={selectedChallenge ? `Progresso de "${selectedChallenge.title}"` : "Progresso dos indicadores"}
                          />
                        </div>
                        
                        {/* Coluna Direita - Painel de Controle */}
                        <div className="space-y-4">
                          <PerformanceControlPanel
                            targets={selectedChallenge.targets}
                            onTargetChange={(targetId, newValue) => handleSliderChange(selectedChallenge.id, targetId, newValue)}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <Card className="p-10 text-center text-sm text-muted-foreground">
                      <p>Selecione um desafio para visualizar o dashboard de desempenho.</p>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="history">
                  <div className="grid gap-4 md:grid-cols-2">
                    {displayChallenges.map((challenge) => (
                      <PerformanceChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        onEdit={canManagePerformance ? handleOpenPerformanceModal : undefined}
                        onDelete={canManagePerformance ? handleDeletePerformanceChallenge : undefined}
                        onSelect={() => setSelectedChallengeId(challenge.id)}
                        isSelected={challenge.id === selectedChallengeId}
                        onAdjustTarget={canUpdatePerformanceProgress ? handleAdjustChallengeTarget : undefined}
                      />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </TabsContent>

          <TabsContent value="clients">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Clientes do Corretor</CardTitle>
                <Dialog open={clientsModalOpen} onOpenChange={(o) => { setClientsModalOpen(o); if (!o) resetClientForm(); }}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Cliente
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingClientId ? "Editar Cliente" : "Novo Cliente"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleClientSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="client_name">Nome do Cliente</Label>
                        <Input
                          id="client_name"
                          value={clientForm.client_name}
                          onChange={(e) =>
                            setClientForm({ ...clientForm, client_name: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="interest">Interesse</Label>
                        <Input
                          id="interest"
                          value={clientForm.interest}
                          onChange={(e) =>
                            setClientForm({ ...clientForm, interest: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="negotiation_status">Status da Negociação</Label>
                        <Select
                          value={clientForm.negotiation_status}
                          onValueChange={(value) =>
                            setClientForm({ ...clientForm, negotiation_status: value })
                          }
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Primeiro Contato">Primeiro Contato</SelectItem>
                            <SelectItem value="Em Negociação">Em Negociação</SelectItem>
                            <SelectItem value="Proposta Enviada">Proposta Enviada</SelectItem>
                            <SelectItem value="Aguardando Documentação">Aguardando Documentação</SelectItem>
                            <SelectItem value="Fechamento">Fechamento</SelectItem>
                            <SelectItem value="Perdido">Perdido</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="is_active"
                          checked={clientForm.is_active}
                          onChange={(e) =>
                            setClientForm({ ...clientForm, is_active: e.target.checked })
                          }
                          className="h-4 w-4"
                        />
                        <Label htmlFor="is_active">Cliente Ativo</Label>
                      </div>

                      <div>
                        <Label htmlFor="status_color">Cor do Indicador</Label>
                        <Select
                          value={clientForm.status_color}
                          onValueChange={(value) =>
                            setClientForm({ ...clientForm, status_color: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="green">
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-green-500" />
                                Verde
                              </div>
                            </SelectItem>
                            <SelectItem value="red">
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-red-500" />
                                Vermelho
                              </div>
                            </SelectItem>
                            <SelectItem value="yellow">
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                                Amarelo
                              </div>
                            </SelectItem>
                            <SelectItem value="blue">
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-blue-500" />
                                Azul
                              </div>
                            </SelectItem>
                            <SelectItem value="purple">
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-purple-500" />
                                Roxo
                              </div>
                            </SelectItem>
                            <SelectItem value="orange">
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-orange-500" />
                                Laranja
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="last_updates">Últimas Atualizações</Label>
                        <Textarea
                          id="last_updates"
                          value={clientForm.last_updates}
                          onChange={(e) =>
                            setClientForm({ ...clientForm, last_updates: e.target.value })
                          }
                          placeholder="Anote aqui as últimas atualizações sobre o cliente..."
                          rows={4}
                          className="resize-none"
                        />
                      </div>

                      <Button type="submit" className="w-full">
                        {editingClientId ? "Atualizar" : "Adicionar"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table containerClassName="max-h-[600px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Interesse</TableHead>
                      <TableHead>Negociação</TableHead>
                      <TableHead>Últimas Atualizações</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : brokerClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          Nenhum cliente cadastrado para este corretor
                        </TableCell>
                      </TableRow>
                    ) : (
                      brokerClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell>
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{
                                backgroundColor: 
                                  client.status_color === 'green' ? '#22c55e' :
                                  client.status_color === 'red' ? '#ef4444' :
                                  client.status_color === 'yellow' ? '#eab308' :
                                  client.status_color === 'blue' ? '#3b82f6' :
                                  client.status_color === 'purple' ? '#a855f7' :
                                  client.status_color === 'orange' ? '#f97316' :
                                  '#22c55e'
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {client.client_name}
                          </TableCell>
                          <TableCell>{client.interest}</TableCell>
                          <TableCell>{client.negotiation_status}</TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={client.last_updates || ''}>
                              {client.last_updates || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClient(client)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClient(client.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Vendas Realizadas</CardTitle>
                <Dialog open={salesModalOpen} onOpenChange={(open) => { setSalesModalOpen(open); if (!open) resetSaleForm(); }}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Venda
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingSaleId ? "Editar Venda" : "Adicionar Nova Venda"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="sale-property">Endereço do Imóvel *</Label>
                        <Input
                          id="sale-property"
                          placeholder="Ex: Apartamento Vila Olímpia"
                          value={newSale.propertyAddress}
                          onChange={(e) => setNewSale({...newSale, propertyAddress: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sale-client">Nome do Cliente *</Label>
                        <Input
                          id="sale-client"
                          placeholder="Ex: Maria Silva"
                          value={newSale.clientName}
                          onChange={(e) => setNewSale({...newSale, clientName: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sale-value">Valor da Venda *</Label>
                        <Input
                          id="sale-value"
                          type="number"
                          placeholder="450000"
                          value={newSale.saleValue}
                          onChange={(e) => setNewSale({...newSale, saleValue: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sale-commission">Comissão *</Label>
                        <Input
                          id="sale-commission"
                          type="number"
                          placeholder="13500"
                          value={newSale.commission}
                          onChange={(e) => setNewSale({...newSale, commission: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="sale-date">Data *</Label>
                        <Input
                          id="sale-date"
                          type="date"
                          value={newSale.date}
                          onChange={(e) => setNewSale({...newSale, date: e.target.value})}
                        />
                      </div>
                      <Button onClick={addSale} className="w-full">{editingSaleId ? "Atualizar" : "Adicionar"}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {brokerData.sales.map(sale => (
                    <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{sale.description}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatDateBR(sale.date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-success">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(sale.value)}
                        </p>
                        <Button variant="ghost" size="icon" onClick={() => handleEditSale(sale)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteSale(sale.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listings">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Captações por Tipo de Imóvel</h3>
              
              {/* Grid de Colunas Responsivo */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {(['Apartamento', 'Casa', 'Sobrado', 'Lote', 'Chácara'] as const).map((propertyType) => (
                  <ListingColumn
                    key={propertyType}
                    propertyType={propertyType}
                    brokerId={brokerId!}
                    listings={getDetailedListingsByType(brokerId!, propertyType)}
                    aggregateQuantity={getAggregateQuantity(brokerId!, propertyType)}
                    onQuantityChange={async (quantity) => {
                      try {
                        await updateAggregateQuantity(brokerId!, propertyType, quantity);
                        await refreshBrokers();
                        toast({ 
                          title: "Sucesso", 
                          description: `Quantidade de ${propertyType} atualizada para ${quantity}` 
                        });
                      } catch (error) {
                        toast({ 
                          title: "Erro", 
                          description: "Erro ao atualizar quantidade", 
                          variant: "destructive" 
                        });
                      }
                    }}
                    statusQuantities={{
                      Ativo: getStatusAggregateQuantity(brokerId!, propertyType, 'Ativo'),
                      Moderação: getStatusAggregateQuantity(brokerId!, propertyType, 'Moderação'),
                      Vendido: getStatusAggregateQuantity(brokerId!, propertyType, 'Vendido'),
                      Desativado: getStatusAggregateQuantity(brokerId!, propertyType, 'Desativado')
                    }}
                    onStatusQuantityChange={async (status: DetailedListingStatus, quantity) => {
                      try {
                        await updateStatusAggregateQuantity(brokerId!, propertyType, status, quantity);
                        await refreshBrokers();
                        const statusLabels: Record<DetailedListingStatus, string> = {
                          Ativo: 'ativas',
                          Moderação: 'em moderação',
                          Vendido: 'vendidas',
                          Desativado: 'desativadas'
                        };
                        toast({
                          title: "Sucesso",
                          description: `Quantidade de captações ${statusLabels[status]} atualizada para ${quantity}`
                        });
                      } catch (error) {
                        toast({
                          title: "Erro",
                          description: "Erro ao atualizar quantidade por status",
                          variant: "destructive"
                        });
                      }
                    }}
                    onAddDetailed={() => {
                      setSelectedPropertyType(propertyType);
                      setNewListing({ 
                        propertyType, 
                        quantity: "1", 
                        status: "Ativo", 
                        date: new Date().toISOString().split('T')[0],
                        propertyAddress: "",
                        propertyValue: ""
                      });
                      setEditingListingId(null);
                      setListingsModalOpen(true);
                    }}
                    onEdit={(listing) => handleEditListing(listing)}
                    onDelete={(id) => handleDeleteListing(id)}
                  />
                ))}
              </div>

              {/* Dialog para Adicionar/Editar Captação Detalhada */}
              <Dialog open={listingsModalOpen} onOpenChange={(open) => { 
                setListingsModalOpen(open); 
                if (!open) {
                  resetListingForm();
                  setSelectedPropertyType(null);
                }
              }}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingListingId ? "Editar Captação" : "Adicionar Nova Captação"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="listing-type">Tipo de Imóvel *</Label>
                      <Select
                        value={newListing.propertyType}
                        onValueChange={(value) => setNewListing({...newListing, propertyType: value})}
                        disabled={selectedPropertyType !== null && !editingListingId}
                      >
                        <SelectTrigger id="listing-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Apartamento">Apartamento</SelectItem>
                          <SelectItem value="Casa">Casa</SelectItem>
                          <SelectItem value="Sobrado">Sobrado</SelectItem>
                          <SelectItem value="Lote">Lote</SelectItem>
                          <SelectItem value="Chácara">Chácara</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="listing-quantity">Quantidade *</Label>
                      <Input
                        id="listing-quantity"
                        type="number"
                        min="1"
                        placeholder="Ex: 1"
                        value={newListing.quantity}
                        onChange={(e) => setNewListing({...newListing, quantity: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="listing-address">Endereço do Imóvel</Label>
                      <Input
                        id="listing-address"
                        type="text"
                        placeholder="Ex: Rua das Flores, 123 - Centro"
                        value={newListing.propertyAddress}
                        onChange={(e) => setNewListing({...newListing, propertyAddress: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="listing-value">Valor (R$)</Label>
                      <Input
                        id="listing-value"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ex: 450000"
                        value={newListing.propertyValue}
                        onChange={(e) => setNewListing({...newListing, propertyValue: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="listing-status">Status</Label>
                      <Select
                        value={newListing.status}
                        onValueChange={(value) => setNewListing({...newListing, status: value})}
                      >
                        <SelectTrigger id="listing-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ativo">Ativo</SelectItem>
                          <SelectItem value="Desativado">Desativado</SelectItem>
                          <SelectItem value="Vendido">Vendido</SelectItem>
                          <SelectItem value="Moderação">Moderação</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="listing-date">Data *</Label>
                      <Input
                        id="listing-date"
                        type="date"
                        value={newListing.date}
                        onChange={(e) => setNewListing({...newListing, date: e.target.value})}
                      />
                    </div>
                    <Button onClick={addListing} className="w-full">{editingListingId ? "Atualizar" : "Adicionar"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>

          <TabsContent value="meetings">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Reuniões e Planos de Ação</CardTitle>
                <Dialog open={meetingsModalOpen} onOpenChange={(open) => { setMeetingsModalOpen(open); if (!open) resetMeetingForm(); }}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Reunião
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingMeetingId ? "Editar Reunião" : "Adicionar Nova Reunião"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="meeting-client">Nome do Cliente *</Label>
                        <Input
                          id="meeting-client"
                          placeholder="Ex: João Santos"
                          value={newMeeting.clientName}
                          onChange={(e) => setNewMeeting({...newMeeting, clientName: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="meeting-type">Tipo de Reunião *</Label>
                        <Input
                          id="meeting-type"
                          placeholder="Ex: Planejamento, Visita, Negociação"
                          value={newMeeting.meetingType}
                          onChange={(e) => setNewMeeting({...newMeeting, meetingType: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="meeting-notes">Observações</Label>
                        <Textarea
                          id="meeting-notes"
                          placeholder="Definir metas de captação e vendas..."
                          value={newMeeting.notes}
                          onChange={(e) => setNewMeeting({...newMeeting, notes: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="meeting-date">Data e Hora *</Label>
                        <Input
                          id="meeting-date"
                          type="datetime-local"
                          value={newMeeting.date}
                          onChange={(e) => setNewMeeting({...newMeeting, date: e.target.value})}
                        />
                      </div>
                      <Button onClick={addMeeting} className="w-full">{editingMeetingId ? "Atualizar" : "Adicionar"}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {brokerData.meetings.map(meeting => (
                    <div key={meeting.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{meeting.title}</h4>
                            <Badge variant={meeting.status === 'completed' ? 'default' : 'secondary'}>
                              {meeting.status === 'completed' ? 'Finalizada' : 'Pendente'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">Cliente: {meeting.clientName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {new Date(meeting.date).toLocaleDateString('pt-BR', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Badge>
                          {meeting.status === 'pending' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleOpenCompleteMeetingModal(meeting.id)}
                            >
                              Finalizar
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleEditMeeting(meeting)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteMeeting(meeting.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {meeting.content && (
                        <div className="mb-2">
                          <p className="text-sm text-muted-foreground"><strong>Observações:</strong> {meeting.content}</p>
                        </div>
                      )}
                      {meeting.status === 'completed' && meeting.summary && (
                        <div className="mt-2 p-3 bg-muted rounded-md">
                          <p className="text-sm font-medium mb-1">Resumo da reunião:</p>
                          <p className="text-sm text-muted-foreground">{meeting.summary}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Modal para finalizar reunião */}
            <Dialog open={completeMeetingModalOpen} onOpenChange={setCompleteMeetingModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Finalizar Reunião</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="meeting-summary">O que foi discutido na reunião? *</Label>
                    <Textarea
                      id="meeting-summary"
                      placeholder="Descreva os principais pontos discutidos, decisões tomadas, próximos passos, etc."
                      value={meetingSummary}
                      onChange={(e) => setMeetingSummary(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setCompleteMeetingModalOpen(false);
                        setMeetingSummary("");
                        setSelectedMeetingId(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleCompleteMeeting} 
                      className="flex-1"
                    >
                      Finalizar Reunião
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="expenses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gastos Mensais</CardTitle>
                <Dialog open={expensesModalOpen} onOpenChange={(open) => { setExpensesModalOpen(open); if (!open) resetExpenseForm(); }}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Gasto
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingExpenseId ? "Editar Gasto" : "Adicionar Novo Gasto"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="expense-description">Descrição *</Label>
                        <Input
                          id="expense-description"
                          placeholder="Ex: Gasolina"
                          value={newExpense.description}
                          onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="expense-category">Categoria *</Label>
                        <Input
                          id="expense-category"
                          placeholder="Ex: Transporte, Marketing, Escritório"
                          value={newExpense.category}
                          onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="expense-amount">Valor *</Label>
                        <Input
                          id="expense-amount"
                          type="number"
                          placeholder="150"
                          value={newExpense.amount}
                          onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="expense-date">Data *</Label>
                        <Input
                          id="expense-date"
                          type="date"
                          value={newExpense.date}
                          onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                        />
                      </div>
                      <Button onClick={addExpense} className="w-full">{editingExpenseId ? "Atualizar" : "Adicionar"}</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {brokerData.expenses.map(expense => (
                    <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{expense.description}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-destructive">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(expense.cost)}
                        </p>
                        <Button variant="ghost" size="icon" onClick={() => handleEditExpense(expense)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteExpense(expense.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>Tarefas do Corretor</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <TaskBoard
                  brokerId={brokerId}
                  title="Kanban de Tarefas"
                  description="Planeje e acompanhe as atividades específicas deste corretor"
                  emptyStateTitle="Nenhuma tarefa cadastrada"
                  emptyStateDescription="Adicione uma nova tarefa para organizar o fluxo de trabalho do corretor"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog
          open={performanceModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              handleClosePerformanceModal();
            }
          }}
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingChallenge ? "Editar desafio" : "Novo desafio"}
              </DialogTitle>
              <DialogDescription>
                Defina metas customizadas para acompanhar o desempenho deste corretor.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handlePerformanceSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="challenge-title">Título *</Label>
                  <Input
                    id="challenge-title"
                    value={challengeForm.title}
                    onChange={(event) =>
                      setChallengeForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                    placeholder="Ex: 5 ligações qualificadas"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="challenge-description">Descrição</Label>
                  <Textarea
                    id="challenge-description"
                    value={challengeForm.description}
                    onChange={(event) =>
                      setChallengeForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    placeholder="Contextualize o desafio para o corretor..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="challenge-status">Status</Label>
                  <Select
                    value={challengeForm.status}
                    onValueChange={(value: PerformanceChallengeStatus) =>
                      setChallengeForm((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger id="challenge-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="challenge-priority">Prioridade</Label>
                  <Select
                    value={challengeForm.priority}
                    onValueChange={(value: PerformanceChallengePriority) =>
                      setChallengeForm((prev) => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger id="challenge-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="challenge-start">Data de início *</Label>
                  <Input
                    id="challenge-start"
                    type="date"
                    value={challengeForm.startDate}
                    onChange={(event) =>
                      setChallengeForm((prev) => ({ ...prev, startDate: event.target.value }))
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="challenge-end">Data de término *</Label>
                  <Input
                    id="challenge-end"
                    type="date"
                    value={challengeForm.endDate}
                    onChange={(event) =>
                      setChallengeForm((prev) => ({ ...prev, endDate: event.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium">Indicadores de desempenho</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Selecione as métricas e defina as metas para este desafio.
                      </p>
                    </div>
                    {challengeForm.selectedMetrics.size > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {challengeForm.selectedMetrics.size} selecionado{challengeForm.selectedMetrics.size !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {metricOptions.map((metricType) => {
                      const isSelected = challengeForm.selectedMetrics.has(metricType);
                      const values = challengeForm.metricValues[metricType] || { targetValue: '', currentValue: '0' };
                      
                      return (
                        <div 
                          key={metricType} 
                          className={`rounded-lg border transition-all ${
                            isSelected 
                              ? 'bg-primary/5 border-primary/40 shadow-sm' 
                              : 'bg-card hover:bg-muted/20 border-border'
                          }`}
                        >
                          {/* Checkbox e Label do Indicador */}
                          <div className="flex items-center space-x-3 p-4">
                            <Checkbox
                              id={`metric-${metricType}`}
                              checked={isSelected}
                              onCheckedChange={(checked) => handleMetricToggle(metricType, checked as boolean)}
                              className="mt-0.5"
                            />
                            <Label
                              htmlFor={`metric-${metricType}`}
                              className="text-sm font-medium leading-none cursor-pointer flex-1"
                            >
                              {metricLabels[metricType]}
                            </Label>
                            {isSelected && (
                              <Badge variant="outline" className="text-xs">
                                Ativo
                              </Badge>
                            )}
                          </div>

                          {/* Campos de Meta e Progresso - aparecem quando selecionado */}
                          {isSelected && (
                            <div className="grid gap-4 md:grid-cols-2 px-4 pb-4 pt-2 border-t bg-background/50">
                              <div>
                                <Label htmlFor={`target-value-${metricType}`} className="text-xs font-medium text-muted-foreground">
                                  🎯 Meta planejada *
                                </Label>
                                <Input
                                  id={`target-value-${metricType}`}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={values.targetValue}
                                  onChange={(event) =>
                                    handleMetricValueChange(metricType, 'targetValue', event.target.value)
                                  }
                                  placeholder="Ex: 10"
                                  className="mt-1.5"
                                  required
                                />
                              </div>

                              <div>
                                <Label htmlFor={`current-value-${metricType}`} className="text-xs font-medium text-muted-foreground">
                                  📊 Progresso atual
                                </Label>
                                <Input
                                  id={`current-value-${metricType}`}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={values.currentValue}
                                  onChange={(event) =>
                                    handleMetricValueChange(metricType, 'currentValue', event.target.value)
                                  }
                                  placeholder="Ex: 3"
                                  className="mt-1.5"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {challengeForm.selectedMetrics.size === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10">
                    <p className="font-medium">Nenhum indicador selecionado</p>
                    <p className="text-xs mt-1">Selecione pelo menos um indicador acima para criar o desafio</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClosePerformanceModal}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingChallenge ? "Salvar alterações" : "Criar desafio"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default BrokerDetails;
