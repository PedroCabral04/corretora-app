# Sistema de Desempenho com Gamificação

Este diretório contém todos os componentes e funcionalidades do sistema de desempenho com gamificação do Broker Wingman Pro.

## Visão Geral

O sistema de desempenho permite que gestores criem desafios para corretores com metas específicas, acompanhando o progresso através de barras de progresso visuais e gráficos interativos. Os corretores podem visualizar suas metas individuais e acompanhar suas conquistas.

## Componentes

### PerformanceCard
Componente principal para exibir desafios com progresso visual.

**Props:**
- `challenge`: Desafio de desempenho
- `brokerName?`: Nome do corretor (opcional)
- `showDetails?`: Se deve mostrar detalhes
- `onViewDetails?`: Callback para visualizar detalhes
- `onEdit?`: Callback para editar
- `onDelete?`: Callback para excluir
- `variant?`: Variante de visualização ('default' | 'compact' | 'detailed')

### PerformanceChart
Gráfico de pizza interativo para visualizar o progresso das métricas.

**Props:**
- `data`: Array de métricas
- `size?`: Tamanho do gráfico ('sm' | 'md' | 'lg')
- `showLegend?`: Se deve mostrar legenda
- `showLabels?`: Se deve mostrar labels
- `animated?`: Se deve animar
- `onSegmentClick?`: Callback ao clicar em um segmento

### MetricsSummary
Componente para exibição resumida das métricas com estatísticas.

**Props:**
- `metrics`: Array de métricas
- `totalTarget`: Valor total das metas
- `totalAchieved`: Valor total alcançado
- `period`: Período de avaliação
- `compact?`: Se deve exibir em formato compacto
- `showDetails?`: Se deve mostrar detalhes

### ChallengeForm
Formulário para criação e edição de desafios.

**Props:**
- `challenge?`: Desafio para edição (opcional)
- `brokers`: Array de corretores disponíveis
- `onSubmit`: Callback para submissão
- `onCancel`: Callback para cancelamento
- `isLoading?`: Se está carregando

## Contexto

### PerformanceContext
Contexto principal que gerencia todos os dados e operações de desempenho.

**Hooks:**
- `usePerformance()`: Acessa o contexto de desempenho

**Funções disponíveis:**
- `createChallenge(data)`: Criar novo desafio
- `updateChallenge(id, data)`: Atualizar desafio existente
- `deleteChallenge(id)`: Excluir desafio
- `getChallengeById(id)`: Obter desafio por ID
- `getChallengesByBrokerId(brokerId)`: Obter desafios de um corretor
- `calculateProgress(challengeId)`: Calcular progresso de um desafio
- `updateMetrics(challengeId)`: Atualizar métricas de um desafio
- `getActiveChallenges()`: Obter desafios ativos
- `getCompletedChallenges()`: Obter desafios concluídos
- `getExpiredChallenges()`: Obter desafios expirados
- `refreshChallenges()`: Recarregar desafios
- `exportChallengeReport(challengeId)`: Exportar relatório

## Tipos de Dados

### PerformanceChallenge
```typescript
interface PerformanceChallenge {
  id: string;
  userId: string;
  brokerId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  metrics: PerformanceMetrics[];
  createdAt: string;
  updatedAt: string;
  totalProgress?: number;
  daysRemaining?: number;
  isOverdue?: boolean;
}
```

### PerformanceMetrics
```typescript
interface PerformanceMetrics {
  id: string;
  challengeId: string;
  type: 'calls' | 'personal_visits' | 'office_visits' | 'listings' | 'sales' | 'tasks';
  targetValue: number;
  currentValue: number;
  unit: string;
  color: string;
  progress?: number;
}
```

## Páginas

### Performance Dashboard (Gestores)
Localizado em `/src/pages/manager/Performance.tsx`

- Lista todos os desafios de desempenho
- Permite criar, editar e excluir desafios
- Filtros por corretor, status e período
- Visualização em grade ou lista
- Exportação de relatórios

### My Performance (Corretores)
Localizado em `/src/pages/broker/MyPerformance.tsx`

- Exibe apenas desafios do corretor logado
- Visualização detalhada do progresso
- Sistema de níveis e conquistas
- Histórico de desempenho
- Badges especiais

## Animações

O sistema inclui diversas animações e transições suaves:

- Barras de progresso animadas
- Gráficos de pizza com animações de entrada
- Cards com efeitos hover
- Transições entre páginas
- Animações para conclusão de metas
- Feedback visual para ações do usuário

As animações estão definidas em `performance-animations.css` e respeitam a preferência do usuário por movimentos reduzidos.

## Integração com Contextos Existentes

O sistema de desempenho se integra automaticamente com:

- **TasksContext**: Contagem de tarefas concluídas
- **MeetingsContext**: Contagem de visitas (pessoais e ao escritório)
- **SalesContext**: Contagem de vendas realizadas
- **ListingsContext**: Contagem de captações

## Cores e Temas

Cada tipo de métrica possui uma cor padrão:

- Chamadas: Azul (#3B82F6)
- Visitas Pessoais: Verde (#10B981)
- Visitas ao Escritório: Amarelo (#F59E0B)
- Captações: Roxo (#8B5CF6)
- Vendas: Vermelho (#EF4444)
- Tarefas: Ciano (#06B6D4)

## Banco de Dados

O sistema utiliza duas tabelas principais:

### performance_challenges
Armazena os desafios de desempenho com informações básicas como título, período e status.

### performance_metrics
Armazena as métricas associadas a cada desafio, com valores de meta e progresso atual.

## Como Usar

### Para Gestores

1. Navegue para `/performance`
2. Clique em "Novo Desafio"
3. Selecione o corretor e configure as métricas
4. Defina o período e salve
5. Acompanhe o progresso na dashboard

### Para Corretores

1. Navegue para `/my-performance`
2. Visualize seus desafios ativos
3. Acompanhe o progresso em tempo real
4. Veja suas conquistas e nível atual

## Exemplo de Uso

```typescript
import { usePerformance } from '@/contexts/PerformanceContext';
import { PerformanceCard } from '@/components/performance';

function MyComponent() {
  const { challenges, createChallenge } = usePerformance();
  
  const handleCreateChallenge = async (data) => {
    await createChallenge(data);
  };
  
  return (
    <div>
      {challenges.map(challenge => (
        <PerformanceCard
          key={challenge.id}
          challenge={challenge}
          showDetails={true}
        />
      ))}
    </div>
  );
}
```

## Considerações de Performance

- As métricas são calculadas automaticamente quando há mudanças nos contextos relacionados
- O sistema utiliza cache para evitar cálculos desnecessários
- As animações são otimizadas para dispositivos móveis
- O gráfico de pizza utiliza renderização otimizada para grandes conjuntos de dados

## Acessibilidade

- Todos os componentes possuem aria-labels apropriados
- As cores possuem contraste suficiente para leitura
- As animações respeitam as preferências do usuário
- O sistema é navegável por teclado
- Possui suporte para leitores de tela