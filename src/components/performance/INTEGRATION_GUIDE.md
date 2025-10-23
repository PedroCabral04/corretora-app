# Guia de Integração do Sistema de Gamificação

Este documento descreve como integrar e utilizar o sistema de gamificação do broker-wingman-pro.

## Visão Geral

O sistema de gamificação foi projetado para motivar corretores através de desafios de desempenho, métricas visuais, conquistas e notificações. Ele está totalmente integrado com os sistemas existentes da aplicação.

## Componentes Principais

### 1. PerformanceContext
Contexto principal que gerencia os desafios de desempenho e métricas.

```typescript
import { usePerformance } from '@/contexts/PerformanceContext';

const { 
  challenges, 
  createChallenge, 
  updateChallenge, 
  deleteChallenge,
  getChallengesByBrokerId,
  getActiveChallenges
} = usePerformance();
```

### 2. Componentes Visuais

#### PerformanceCard
Exibe informações de um desafio de desempenho.

```typescript
import { PerformanceCard } from '@/components/performance';

<PerformanceCard
  challenge={challenge}
  brokerName="Nome do Corretor"
  showDetails={true}
  variant="default"
  onViewDetails={(challenge) => console.log(challenge)}
  onEdit={(challenge) => console.log(challenge)}
  onDelete={(id) => console.log(id)}
/>
```

#### PerformanceChart
Gráfico visual para exibir o progresso das métricas.

```typescript
import { PerformanceChart } from '@/components/performance';

<PerformanceChart
  data={metrics}
  size="md"
  showLegend={true}
  showLabels={true}
/>
```

#### MetricsSummary
Resumo das métricas de desempenho.

```typescript
import { MetricsSummary } from '@/components/performance';

<MetricsSummary
  metrics={metrics}
  totalTarget={100}
  totalAchieved={75}
  period="Janeiro 2024"
  compact={false}
  showDetails={true}
/>
```

#### ChallengeForm
Formulário para criar/editar desafios.

```typescript
import { ChallengeForm } from '@/components/performance';

<ChallengeForm
  challenge={challenge} // Opcional, para edição
  brokers={brokers}
  onSubmit={(data) => console.log(data)}
  onCancel={() => console.log('Cancelado')}
  isLoading={false}
/>
```

#### GoalToChallengeConverter
Converte metas regulares em desafios de desempenho.

```typescript
import { GoalToChallengeConverter } from '@/components/performance';

<GoalToChallengeConverter
  goal={goal}
  onSuccess={() => console.log('Convertido com sucesso')}
/>
```

#### PerformanceIntegration
Componente de integração que fornece uma interface unificada.

```typescript
import { PerformanceIntegration, usePerformanceIntegration } from '@/components/performance';

// Componente
<PerformanceIntegration />

// Hook
const {
  challenges,
  userChallenges,
  activeChallenge,
  completedChallenges,
  canCreateChallenges,
  goToPerformancePage,
  createChallenge
} = usePerformanceIntegration();
```

## Integração com Navegação

O sistema de gamificação está integrado com a navegação principal:

- **Corretores**: Acessam "Meu Desempenho" em `/my-performance`
- **Gestores/Admins**: Acessam "Desempenho" em `/performance`

## Integração com Sistema de Notificações

O sistema envia automaticamente notificações para:

- Novos desafios atribuídos
- Metas atingidas
- Prazos se aproximando
- Desafios concluídos

## Integração com Dashboard

O Dashboard principal exibe um resumo do desempenho:

- Desafio ativo atual
- Métricas da semana
- Progresso visual

## Integração com Sistema de Metas

Metas regulares podem ser convertidas em desafios de desempenho através do componente `GoalToChallengeConverter`.

## Fluxo de Uso Típico

### Para Gestores:

1. Acessar `/performance` para ver todos os desafios
2. Criar novos desafios usando o formulário
3. Acompanhar o progresso dos corretores
4. Exportar relatórios de desempenho

### Para Corretores:

1. Acessar `/my-performance` para ver seus desafios
2. Visualizar seu progresso atual
3. Ver suas conquistas e nível de desempenho
4. Receber notificações sobre seus desafios

## Exemplo de Implementação Completa

```typescript
import React from 'react';
import { PerformanceIntegration } from '@/components/performance';
import { usePerformanceIntegration } from '@/components/performance';

const MyComponent = () => {
  const { activeChallenge, goToPerformancePage } = usePerformanceIntegration();

  return (
    <div>
      <h1>Meu Desempenho</h1>
      
      {activeChallenge ? (
        <PerformanceCard
          challenge={activeChallenge}
          showDetails={true}
        />
      ) : (
        <p>Nenhum desafio ativo no momento.</p>
      )}
      
      <button onClick={goToPerformancePage}>
        Ver Todos os Desafios
      </button>
    </div>
  );
};
```

## Considerações Técnicas

1. **Ordem dos Providers**: O `PerformanceProvider` deve estar aninhado dentro dos outros providers para ter acesso aos dados.

2. **Atualizações em Tempo Real**: O sistema atualiza automaticamente as métricas quando há mudanças nas tarefas, reuniões, vendas ou captações.

3. **Tratamento de Erros**: Todos os componentes incluem tratamento de erros adequado.

4. **Responsividade**: Todos os componentes são responsivos e funcionam bem em dispositivos móveis.

## Personalização

O sistema pode ser personalizado através de:

- Modificação das cores no arquivo `performance-animations.css`
- Ajuste das métricas disponíveis no `PerformanceContext`
- Personalização das notificações no `NotificationsContext`

## Suporte

Para dúvidas ou problemas, consulte a documentação técnica em `ESPECIFICACOES_TECNICAS_DESEMPENHO.md`.