import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/goals_provider.dart';
import '../../models/goal.dart';
import '../../widgets/goal_card.dart';

class GoalsScreen extends StatefulWidget {
  const GoalsScreen({super.key});

  @override
  State<GoalsScreen> createState() => _GoalsScreenState();
}

class _GoalsScreenState extends State<GoalsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final goals = context.watch<GoalsProvider>();

    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(48),
        child: AppBar(
          automaticallyImplyLeading: false,
          flexibleSpace: TabBar(
            controller: _tabController,
            tabs: const [
              Tab(text: 'Ativas'),
              Tab(text: 'Concluídas'),
              Tab(text: 'Todas'),
            ],
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _GoalsList(
            goals: goals.goals
                .where((g) => g.status == GoalStatus.active)
                .toList(),
            isLoading: goals.isLoading,
            onRefresh: goals.fetchGoals,
          ),
          _GoalsList(
            goals: goals.goals
                .where((g) => g.status == GoalStatus.completed)
                .toList(),
            isLoading: goals.isLoading,
            onRefresh: goals.fetchGoals,
          ),
          _GoalsList(
            goals: goals.goals,
            isLoading: goals.isLoading,
            onRefresh: goals.fetchGoals,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddGoalDialog(context),
        child: const Icon(Icons.add),
      ),
    );
  }

  void _showAddGoalDialog(BuildContext context) {
    final titleController = TextEditingController();
    final descriptionController = TextEditingController();
    final targetController = TextEditingController();
    GoalType selectedType = GoalType.salesCount;
    GoalPriority selectedPriority = GoalPriority.medium;
    DateTime endDate = DateTime.now().add(const Duration(days: 30));

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Nova Meta'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: titleController,
                  decoration: const InputDecoration(
                    labelText: 'Título',
                    hintText: 'Digite o título da meta',
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: descriptionController,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'Descrição',
                    hintText: 'Digite a descrição',
                  ),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<GoalType>(
                  value: selectedType,
                  decoration: const InputDecoration(labelText: 'Tipo de Meta'),
                  items: GoalType.values
                      .map(
                        (type) => DropdownMenuItem(
                          value: type,
                          child: Text(_getGoalTypeLabel(type)),
                        ),
                      )
                      .toList(),
                  onChanged: (value) {
                    if (value != null) {
                      setState(() => selectedType = value);
                    }
                  },
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: targetController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Valor Alvo',
                    hintText: 'Digite o valor a atingir',
                  ),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<GoalPriority>(
                  value: selectedPriority,
                  decoration: const InputDecoration(labelText: 'Prioridade'),
                  items: GoalPriority.values
                      .map(
                        (priority) => DropdownMenuItem(
                          value: priority,
                          child: Text(_getPriorityLabel(priority)),
                        ),
                      )
                      .toList(),
                  onChanged: (value) {
                    if (value != null) {
                      setState(() => selectedPriority = value);
                    }
                  },
                ),
                const SizedBox(height: 16),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.calendar_today),
                  title: Text(
                    'Prazo: ${endDate.day}/${endDate.month}/${endDate.year}',
                  ),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: endDate,
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 365)),
                    );
                    if (date != null) {
                      setState(() => endDate = date);
                    }
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancelar'),
            ),
            ElevatedButton(
              onPressed: () {
                if (titleController.text.isNotEmpty &&
                    targetController.text.isNotEmpty) {
                  final goal = Goal(
                    id: '',
                    userId: '',
                    title: titleController.text,
                    description: descriptionController.text.isEmpty
                        ? null
                        : descriptionController.text,
                    goalType: selectedType,
                    targetValue: double.tryParse(targetController.text) ?? 0,
                    currentValue: 0,
                    startDate: DateTime.now(),
                    endDate: endDate,
                    status: GoalStatus.active,
                    priority: selectedPriority,
                  );
                  context.read<GoalsProvider>().createGoal(goal);
                  Navigator.pop(context);
                }
              },
              child: const Text('Criar'),
            ),
          ],
        ),
      ),
    );
  }

  String _getGoalTypeLabel(GoalType type) {
    switch (type) {
      case GoalType.salesCount:
        return 'Quantidade de Vendas';
      case GoalType.salesValue:
        return 'Valor em Vendas';
      case GoalType.listings:
        return 'Captações';
      case GoalType.meetings:
        return 'Reuniões';
      case GoalType.tasks:
        return 'Tarefas';
      case GoalType.calls:
        return 'Ligações';
      case GoalType.visits:
        return 'Visitas';
      case GoalType.inPersonVisits:
        return 'Visitas Presenciais';
    }
  }

  String _getPriorityLabel(GoalPriority priority) {
    switch (priority) {
      case GoalPriority.low:
        return 'Baixa';
      case GoalPriority.medium:
        return 'Média';
      case GoalPriority.high:
        return 'Alta';
    }
  }
}

class _GoalsList extends StatelessWidget {
  final List<Goal> goals;
  final bool isLoading;
  final Future<void> Function() onRefresh;

  const _GoalsList({
    required this.goals,
    required this.isLoading,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (goals.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.flag_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'Nenhuma meta encontrada',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: goals.length,
        itemBuilder: (context, index) {
          final goal = goals[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: GoalCard(
              goal: goal,
              onTap: () => _showGoalDetails(context, goal),
            ),
          );
        },
      ),
    );
  }

  void _showGoalDetails(BuildContext context, Goal goal) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        minChildSize: 0.3,
        maxChildSize: 0.9,
        expand: false,
        builder: (context, scrollController) => SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Text(
                goal.title,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: _getStatusColor(goal.status).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  goal.statusLabel,
                  style: TextStyle(
                    color: _getStatusColor(goal.status),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              if (goal.description != null) ...[
                const SizedBox(height: 16),
                Text(goal.description!),
              ],
              const SizedBox(height: 24),
              Text(
                'Progresso',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: LinearProgressIndicator(
                        value: goal.progressPercentage / 100,
                        backgroundColor: Colors.grey[200],
                        minHeight: 16,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Text(
                    '${goal.progressPercentage.toStringAsFixed(0)}%',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _StatItem(
                    label: 'Atual',
                    value: goal.currentValue.toStringAsFixed(0),
                    color: Colors.blue,
                  ),
                  Container(width: 1, height: 40, color: Colors.grey[300]),
                  _StatItem(
                    label: 'Meta',
                    value: goal.targetValue.toStringAsFixed(0),
                    color: Colors.green,
                  ),
                  Container(width: 1, height: 40, color: Colors.grey[300]),
                  _StatItem(
                    label: 'Restante',
                    value: (goal.targetValue - goal.currentValue)
                        .clamp(0, double.infinity)
                        .toStringAsFixed(0),
                    color: Colors.orange,
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  const Icon(Icons.calendar_today, size: 16),
                  const SizedBox(width: 8),
                  Text(
                    'Prazo: ${goal.endDate.day}/${goal.endDate.month}/${goal.endDate.year}',
                  ),
                  if (goal.daysRemaining > 0) ...[
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: goal.isOverdue
                            ? Colors.red.withOpacity(0.1)
                            : Colors.blue.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        goal.isOverdue
                            ? 'Atrasada'
                            : '${goal.daysRemaining} dias restantes',
                        style: TextStyle(
                          color: goal.isOverdue ? Colors.red : Colors.blue,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 32),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        context.read<GoalsProvider>().deleteGoal(goal.id);
                        Navigator.pop(context);
                      },
                      icon: const Icon(Icons.delete, color: Colors.red),
                      label: const Text(
                        'Excluir',
                        style: TextStyle(color: Colors.red),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.edit),
                      label: const Text('Editar'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(GoalStatus status) {
    switch (status) {
      case GoalStatus.active:
        return Colors.blue;
      case GoalStatus.completed:
        return Colors.green;
      case GoalStatus.overdue:
        return Colors.orange;
      case GoalStatus.cancelled:
        return Colors.grey;
    }
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _StatItem({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(label, style: TextStyle(color: Colors.grey[600])),
      ],
    );
  }
}
