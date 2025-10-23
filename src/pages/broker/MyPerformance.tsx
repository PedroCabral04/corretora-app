import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PerformanceCard } from "@/components/performance/PerformanceCard";
import { PerformanceChart } from "@/components/performance/PerformanceChart";
import { MetricsSummary } from "@/components/performance/MetricsSummary";
import { usePerformance } from "@/contexts/PerformanceContext";
import { useAuth } from "@/contexts/AuthContext";
import { PerformanceChallenge, ChallengeStatus } from "@/contexts/PerformanceContext";
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Calendar,
  Award,
  Clock,
  Star,
  Flame,
  Zap
} from "lucide-react";

export default function MyPerformance() {
  const { challenges, getChallengesByBrokerId, updateMetrics } = usePerformance();
  const { user } = useAuth();
  
  const [myChallenges, setMyChallenges] = useState<PerformanceChallenge[]>([]);
  const [activeChallenge, setActiveChallenge] = useState<PerformanceChallenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar desafios do corretor
  useEffect(() => {
    if (user?.id) {
      const brokerChallenges = getChallengesByBrokerId(user.id);
      setMyChallenges(brokerChallenges);
      
      // Encontrar desafio ativo mais recente
      const active = brokerChallenges
        .filter(c => c.status === 'active')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      setActiveChallenge(active || null);
      setIsLoading(false);
    }
  }, [user, challenges, getChallengesByBrokerId]);

  // Atualizar métricas
  const handleRefreshMetrics = async () => {
    if (activeChallenge) {
      try {
        await updateMetrics(activeChallenge.id);
      } catch (error) {
        console.error('Erro ao atualizar métricas:', error);
      }
    }
  };

  // Estatísticas
  const stats = {
    total: myChallenges.length,
    active: myChallenges.filter(c => c.status === 'active').length,
    completed: myChallenges.filter(c => c.status === 'completed').length,
    expired: myChallenges.filter(c => c.status === 'expired').length
  };

  // Desafios concluídos recentemente
  const recentCompleted = myChallenges
    .filter(c => c.status === 'completed')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  // Calcular nível de desempenho
  const getPerformanceLevel = () => {
    const completedCount = stats.completed;
    if (completedCount >= 10) return { level: 'Mestre', color: 'text-purple-600', icon: Trophy };
    if (completedCount >= 7) return { level: 'Expert', color: 'text-blue-600', icon: Star };
    if (completedCount >= 5) return { level: 'Avançado', color: 'text-green-600', icon: Award };
    if (completedCount >= 3) return { level: 'Intermediário', color: 'text-yellow-600', icon: TrendingUp };
    if (completedCount >= 1) return { level: 'Iniciante', color: 'text-orange-600', icon: Zap };
    return { level: 'Novato', color: 'text-gray-600', icon: Target };
  };

  const performanceLevel = getPerformanceLevel();
  const LevelIcon = performanceLevel.icon;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando seu desempenho...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho com nível de desempenho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meu Desempenho</h1>
          <p className="text-muted-foreground">
            Acompanhe suas metas e conquistas
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Seu nível</p>
            <div className={`flex items-center gap-2 ${performanceLevel.color}`}>
              <LevelIcon className="h-5 w-5" />
              <span className="font-bold text-lg">{performanceLevel.level}</span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleRefreshMetrics}
            disabled={!activeChallenge}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Desafios Ativos</p>
                <p className="text-2xl font-bold text-blue-700">{stats.active}</p>
              </div>
              <Flame className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Concluídos</p>
                <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
              </div>
              <Trophy className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Expirados</p>
                <p className="text-2xl font-bold text-orange-700">{stats.expired}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total</p>
                <p className="text-2xl font-bold text-purple-700">{stats.total}</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Desafio Atual</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="achievements">Conquistas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="current">
          {activeChallenge ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <PerformanceCard
                  challenge={activeChallenge}
                  showDetails={true}
                  variant="detailed"
                />
              </div>
              
              <div className="space-y-6">
                {/* Gráfico de progresso */}
                {activeChallenge.metrics.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Progresso Visual</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PerformanceChart
                        data={activeChallenge.metrics}
                        size="md"
                        showLabels={true}
                        showLegend={true}
                      />
                    </CardContent>
                  </Card>
                )}
                
                {/* Resumo das métricas */}
                {activeChallenge.metrics.length > 0 && (
                  <MetricsSummary
                    metrics={activeChallenge.metrics}
                    totalTarget={activeChallenge.metrics.reduce((sum, m) => sum + m.targetValue, 0)}
                    totalAchieved={activeChallenge.metrics.reduce((sum, m) => sum + m.currentValue, 0)}
                    period={`${activeChallenge.startDate} a ${activeChallenge.endDate}`}
                    compact={true}
                  />
                )}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum desafio ativo</h3>
                <p className="text-muted-foreground">
                  Você não possui desafios ativos no momento. Aguarde seu gestor criar novos desafios.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="history">
          <div className="space-y-4">
            {myChallenges.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum desafio encontrado</h3>
                  <p className="text-muted-foreground">
                    Você ainda não participou de nenhum desafio.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myChallenges.map(challenge => (
                  <PerformanceCard
                    key={challenge.id}
                    challenge={challenge}
                    showDetails={true}
                    variant="default"
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="achievements">
          <div className="space-y-6">
            {/* Nível atual */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold mb-2">Seu Nível de Desempenho</h3>
                    <div className={`flex items-center gap-3 ${performanceLevel.color}`}>
                      <LevelIcon className="h-8 w-8" />
                      <div>
                        <p className="text-2xl font-bold">{performanceLevel.level}</p>
                        <p className="text-sm text-muted-foreground">
                          {stats.completed} desafio{stats.completed !== 1 ? 's' : ''} concluído{stats.completed !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Próximo nível</p>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                          style={{ 
                            width: `${Math.min((stats.completed / 10) * 100, 100)}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {Math.min(stats.completed, 10)}/10
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Conquistas recentes */}
            <div>
              <h3 className="text-lg font-bold mb-4">Conquistas Recentes</h3>
              {recentCompleted.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Award className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      Nenhuma conquista recente. Complete desafios para aparecer aqui!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recentCompleted.map((challenge, index) => (
                    <Card key={challenge.id} className="border-green-200 bg-green-50/30">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                            <Trophy className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{challenge.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Concluído em {new Date(challenge.updatedAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            {Math.round(challenge.totalProgress || 0)}%
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            
            {/* Badges especiais */}
            <div>
              <h3 className="text-lg font-bold mb-4">Badges Especiais</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className={`text-center p-4 ${
                  stats.completed >= 1 ? 'border-yellow-200 bg-yellow-50' : 'opacity-50'
                }`}>
                  <div className="flex flex-col items-center gap-2">
                    <Star className="h-8 w-8 text-yellow-600" />
                    <p className="font-medium text-sm">Primeiro Passo</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.completed >= 1 ? 'Desbloqueado' : '1 desafio'}
                    </p>
                  </div>
                </Card>
                
                <Card className={`text-center p-4 ${
                  stats.completed >= 5 ? 'border-blue-200 bg-blue-50' : 'opacity-50'
                }`}>
                  <div className="flex flex-col items-center gap-2">
                    <Award className="h-8 w-8 text-blue-600" />
                    <p className="font-medium text-sm">Dedicado</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.completed >= 5 ? 'Desbloqueado' : '5 desafios'}
                    </p>
                  </div>
                </Card>
                
                <Card className={`text-center p-4 ${
                  stats.completed >= 10 ? 'border-purple-200 bg-purple-50' : 'opacity-50'
                }`}>
                  <div className="flex flex-col items-center gap-2">
                    <Trophy className="h-8 w-8 text-purple-600" />
                    <p className="font-medium text-sm">Mestre</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.completed >= 10 ? 'Desbloqueado' : '10 desafios'}
                    </p>
                  </div>
                </Card>
                
                <Card className={`text-center p-4 ${
                  myChallenges.some(c => c.totalProgress && c.totalProgress >= 100) 
                    ? 'border-green-200 bg-green-50' : 'opacity-50'
                }`}>
                  <div className="flex flex-col items-center gap-2">
                    <Zap className="h-8 w-8 text-green-600" />
                    <p className="font-medium text-sm">Perfeito</p>
                    <p className="text-xs text-muted-foreground">
                      {myChallenges.some(c => c.totalProgress && c.totalProgress >= 100) 
                        ? 'Desbloqueado' : '100% em um desafio'}
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}