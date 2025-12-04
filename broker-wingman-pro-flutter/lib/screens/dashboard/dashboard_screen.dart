import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/brokers_provider.dart';
import '../../providers/sales_provider.dart';
import '../../providers/listings_provider.dart';
import '../../providers/tasks_provider.dart';
import '../../providers/goals_provider.dart';
import '../../models/user.dart';
import '../../models/task.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isBroker = auth.role == UserRole.broker;

    return isBroker ? const _BrokerDashboard() : const _ManagerDashboard();
  }
}

class _ManagerDashboard extends StatelessWidget {
  const _ManagerDashboard();

  @override
  Widget build(BuildContext context) {
    final brokers = context.watch<BrokersProvider>();
    final sales = context.watch<SalesProvider>();
    final listings = context.watch<ListingsProvider>();
    final tasks = context.watch<TasksProvider>();

    return RefreshIndicator(
      onRefresh: () async {
        await Future.wait([
          brokers.fetchBrokers(),
          sales.fetchSales(),
          listings.fetchListings(),
          tasks.fetchTasks(),
        ]);
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Header with Gradient
            _WelcomeHeader(
              title: 'Visão Geral',
              subtitle: 'Acompanhe o desempenho da sua equipe',
            ),
            const SizedBox(height: 20),

            // Quick Stats Row
            _QuickStatsRow(
              stats: [
                _QuickStat(
                  label: 'Corretores Ativos',
                  value: brokers.brokers.length,
                  icon: Icons.people_alt_rounded,
                  gradient: const [Color(0xFF667eea), Color(0xFF764ba2)],
                ),
                _QuickStat(
                  label: 'Vendas do Mês',
                  value: sales.totalSalesCount,
                  icon: Icons.trending_up_rounded,
                  gradient: const [Color(0xFF11998e), Color(0xFF38ef7d)],
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Metrics Grid with Enhanced Cards - Compact
            Row(
              children: [
                Expanded(
                  child: _CompactMetricCard(
                    title: 'Captações',
                    value: '${listings.totalListingsCount}',
                    icon: Icons.home_work_rounded,
                    color: const Color(0xFFFF9800),
                    trend: '+12%',
                    trendUp: true,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _CompactMetricCard(
                    title: 'Tarefas Pendentes',
                    value: '${tasks.backlogCount + tasks.inProgressCount}',
                    icon: Icons.assignment_rounded,
                    color: const Color(0xFF9C27B0),
                    subtitle: '${tasks.backlogCount} em backlog',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Financial Summary Card - Enhanced
            _FinancialSummaryCard(
              totalSales: sales.totalSalesValue,
              totalCommission: sales.totalCommission,
              totalPropertyValue: listings.totalPropertyValue,
            ),
            const SizedBox(height: 24),

            // Performance Chart Placeholder
            _PerformanceOverview(
              salesCount: sales.totalSalesCount,
              listingsCount: listings.totalListingsCount,
              tasksCompleted: tasks.completedCount,
              tasksPending: tasks.backlogCount + tasks.inProgressCount,
            ),
            const SizedBox(height: 24),

            // Top Brokers Section
            _SectionHeader(
              title: 'Top Corretores',
              actionLabel: 'Ver todos',
              onAction: () {},
            ),
            const SizedBox(height: 12),
            if (brokers.isLoading)
              const _LoadingShimmer()
            else if (brokers.brokers.isEmpty)
              _EmptyState(
                icon: Icons.people_outline_rounded,
                title: 'Nenhum corretor cadastrado',
                subtitle: 'Adicione corretores para começar',
              )
            else
              _BrokersList(brokers: brokers.brokers.take(3).toList()),
          ],
        ),
      ),
    );
  }
}

// Welcome Header Component
class _WelcomeHeader extends StatelessWidget {
  final String title;
  final String subtitle;

  const _WelcomeHeader({required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: theme.textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.bold,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          style: theme.textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
        ),
      ],
    );
  }
}

// Quick Stats Row
class _QuickStatsRow extends StatelessWidget {
  final List<_QuickStat> stats;

  const _QuickStatsRow({required this.stats});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: stats.map((stat) {
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(
              right: stats.indexOf(stat) < stats.length - 1 ? 8 : 0,
              left: stats.indexOf(stat) > 0 ? 8 : 0,
            ),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: stat.gradient,
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: stat.gradient.first.withOpacity(0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(stat.icon, color: Colors.white, size: 24),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${stat.value}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          stat.label,
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.9),
                            fontSize: 12,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _QuickStat {
  final String label;
  final int value;
  final IconData icon;
  final List<Color> gradient;

  const _QuickStat({
    required this.label,
    required this.value,
    required this.icon,
    required this.gradient,
  });
}

// Compact Metric Card - More horizontal layout
class _CompactMetricCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final String? trend;
  final bool? trendUp;
  final String? subtitle;

  const _CompactMetricCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    this.trend,
    this.trendUp,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withOpacity(0.1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Text(
                      value,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (trend != null) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 4,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: (trendUp ?? true)
                              ? Colors.green.withOpacity(0.1)
                              : Colors.red.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          trend!,
                          style: TextStyle(
                            color: (trendUp ?? true)
                                ? Colors.green
                                : Colors.red,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                Text(
                  title,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey[600],
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// Enhanced Metric Card
class _EnhancedMetricCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;
  final String? trend;
  final bool? trendUp;
  final String? subtitle;

  const _EnhancedMetricCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    this.trend,
    this.trendUp,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.withOpacity(0.1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  value,
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                Text(
                  title,
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: Colors.grey[600]),
                ),
                if (subtitle != null)
                  Text(
                    subtitle!,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: color,
                      fontWeight: FontWeight.w500,
                      fontSize: 10,
                    ),
                  ),
              ],
            ),
          ),
          if (trend != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
              decoration: BoxDecoration(
                color: (trendUp ?? true)
                    ? Colors.green.withOpacity(0.1)
                    : Colors.red.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    (trendUp ?? true)
                        ? Icons.trending_up_rounded
                        : Icons.trending_down_rounded,
                    size: 12,
                    color: (trendUp ?? true) ? Colors.green : Colors.red,
                  ),
                  const SizedBox(width: 2),
                  Text(
                    trend!,
                    style: TextStyle(
                      color: (trendUp ?? true) ? Colors.green : Colors.red,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

// Financial Summary Card
class _FinancialSummaryCard extends StatelessWidget {
  final double totalSales;
  final double totalCommission;
  final double totalPropertyValue;

  const _FinancialSummaryCard({
    required this.totalSales,
    required this.totalCommission,
    required this.totalPropertyValue,
  });

  String _formatCurrency(double value) {
    if (value >= 1000000) {
      return 'R\$ ${(value / 1000000).toStringAsFixed(1)}M';
    } else if (value >= 1000) {
      return 'R\$ ${(value / 1000).toStringAsFixed(1)}K';
    }
    return 'R\$ ${value.toStringAsFixed(2).replaceAll('.', ',')}';
  }

  String _formatFullCurrency(double value) {
    return 'R\$ ${value.toStringAsFixed(2).replaceAll('.', ',')}';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Theme.of(context).colorScheme.primary,
            Theme.of(context).colorScheme.primary.withOpacity(0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.account_balance_wallet_rounded,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                const Text(
                  'Resumo Financeiro',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: _FinancialItem(
                    label: 'Total em Vendas',
                    value: _formatCurrency(totalSales),
                    fullValue: _formatFullCurrency(totalSales),
                    icon: Icons.shopping_bag_rounded,
                  ),
                ),
                Container(
                  height: 50,
                  width: 1,
                  color: Colors.white.withOpacity(0.2),
                ),
                Expanded(
                  child: _FinancialItem(
                    label: 'Comissões',
                    value: _formatCurrency(totalCommission),
                    fullValue: _formatFullCurrency(totalCommission),
                    icon: Icons.payments_rounded,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.real_estate_agent_rounded,
                    color: Colors.white,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'Valor em Imóveis:',
                    style: TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                  const Spacer(),
                  Text(
                    _formatCurrency(totalPropertyValue),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FinancialItem extends StatelessWidget {
  final String label;
  final String value;
  final String fullValue;
  final IconData icon;

  const _FinancialItem({
    required this.label,
    required this.value,
    required this.fullValue,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: fullValue,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.white70, size: 18),
            const SizedBox(height: 8),
            Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(color: Colors.white70, fontSize: 11),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

// Performance Overview
class _PerformanceOverview extends StatelessWidget {
  final int salesCount;
  final int listingsCount;
  final int tasksCompleted;
  final int tasksPending;

  const _PerformanceOverview({
    required this.salesCount,
    required this.listingsCount,
    required this.tasksCompleted,
    required this.tasksPending,
  });

  @override
  Widget build(BuildContext context) {
    final total = salesCount + listingsCount + tasksCompleted + tasksPending;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.withOpacity(0.1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.analytics_rounded,
                color: Theme.of(context).colorScheme.primary,
              ),
              const SizedBox(width: 8),
              Text(
                'Desempenho',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: _PerformanceBar(
                  label: 'Vendas',
                  value: salesCount,
                  total: total,
                  color: Colors.green,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _PerformanceBar(
                  label: 'Captações',
                  value: listingsCount,
                  total: total,
                  color: Colors.orange,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _PerformanceBar(
                  label: 'Tarefas Concluídas',
                  value: tasksCompleted,
                  total: total,
                  color: Colors.blue,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _PerformanceBar(
                  label: 'Tarefas Pendentes',
                  value: tasksPending,
                  total: total,
                  color: Colors.purple,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PerformanceBar extends StatelessWidget {
  final String label;
  final int value;
  final int total;
  final Color color;

  const _PerformanceBar({
    required this.label,
    required this.value,
    required this.total,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final percentage = total > 0 ? value / total : 0.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: Colors.grey[600]),
            ),
            Text(
              '$value',
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.bold),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: percentage,
            backgroundColor: Colors.grey[200],
            valueColor: AlwaysStoppedAnimation<Color>(color),
            minHeight: 8,
          ),
        ),
      ],
    );
  }
}

// Section Header
class _SectionHeader extends StatelessWidget {
  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  const _SectionHeader({required this.title, this.actionLabel, this.onAction});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: Theme.of(
            context,
          ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
        ),
        if (actionLabel != null)
          TextButton(
            onPressed: onAction,
            child: Row(
              children: [
                Text(actionLabel!),
                const SizedBox(width: 4),
                const Icon(Icons.arrow_forward_ios_rounded, size: 14),
              ],
            ),
          ),
      ],
    );
  }
}

// Loading Shimmer
class _LoadingShimmer extends StatelessWidget {
  const _LoadingShimmer();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(
        3,
        (index) => Container(
          margin: const EdgeInsets.only(bottom: 8),
          height: 72,
          decoration: BoxDecoration(
            color: Colors.grey[200],
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }
}

// Empty State
class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;

  const _EmptyState({required this.icon, required this.title, this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.withOpacity(0.2)),
      ),
      child: Center(
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[200],
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 32, color: Colors.grey[400]),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(color: Colors.grey[600]),
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 4),
              Text(
                subtitle!,
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: Colors.grey[500]),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// Brokers List
class _BrokersList extends StatelessWidget {
  final List brokers;

  const _BrokersList({required this.brokers});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: brokers.asMap().entries.map((entry) {
        final index = entry.key;
        final broker = entry.value;
        final isTop = index == 0;

        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(16),
            border: isTop
                ? Border.all(color: Colors.amber.withOpacity(0.5), width: 2)
                : Border.all(color: Colors.grey.withOpacity(0.1)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 8,
            ),
            leading: Stack(
              children: [
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: isTop
                          ? [Colors.amber, Colors.orange]
                          : [
                              Theme.of(context).colorScheme.primary,
                              Theme.of(
                                context,
                              ).colorScheme.primary.withOpacity(0.7),
                            ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      broker.name.isNotEmpty
                          ? broker.name[0].toUpperCase()
                          : 'B',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 20,
                      ),
                    ),
                  ),
                ),
                if (isTop)
                  Positioned(
                    right: 0,
                    top: 0,
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.emoji_events_rounded,
                        color: Colors.amber,
                        size: 16,
                      ),
                    ),
                  ),
              ],
            ),
            title: Text(
              broker.name,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Text(
              broker.email,
              style: TextStyle(color: Colors.grey[600], fontSize: 12),
            ),
            trailing: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.sell_rounded, size: 14, color: Colors.green),
                  const SizedBox(width: 4),
                  Text(
                    '${broker.totalSales}',
                    style: const TextStyle(
                      color: Colors.green,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _BrokerDashboard extends StatelessWidget {
  const _BrokerDashboard();

  @override
  Widget build(BuildContext context) {
    final sales = context.watch<SalesProvider>();
    final listings = context.watch<ListingsProvider>();
    final tasks = context.watch<TasksProvider>();
    final goals = context.watch<GoalsProvider>();

    return RefreshIndicator(
      onRefresh: () async {
        await Future.wait([
          sales.fetchSales(),
          listings.fetchListings(),
          tasks.fetchTasks(),
          goals.fetchGoals(),
        ]);
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Header
            _WelcomeHeader(
              title: 'Meu Dashboard',
              subtitle: 'Acompanhe seu desempenho',
            ),
            const SizedBox(height: 20),

            // Quick Stats - Sales & Listings with gradient
            _QuickStatsRow(
              stats: [
                _QuickStat(
                  label: 'Minhas Vendas',
                  value: sales.totalSalesCount,
                  icon: Icons.sell_rounded,
                  gradient: const [Color(0xFF11998e), Color(0xFF38ef7d)],
                ),
                _QuickStat(
                  label: 'Captações',
                  value: listings.totalListingsCount,
                  icon: Icons.home_work_rounded,
                  gradient: const [Color(0xFFf093fb), Color(0xFFf5576c)],
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Secondary Metrics Grid
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.3,
              children: [
                _EnhancedMetricCard(
                  title: 'Tarefas Pendentes',
                  value: '${tasks.backlogCount + tasks.inProgressCount}',
                  icon: Icons.assignment_rounded,
                  color: const Color(0xFF9C27B0),
                  subtitle: '${tasks.inProgressCount} em progresso',
                ),
                _EnhancedMetricCard(
                  title: 'Metas Ativas',
                  value: '${goals.activeGoals.length}',
                  icon: Icons.flag_rounded,
                  color: const Color(0xFF2196F3),
                  trend: goals.activeGoals.isNotEmpty ? 'Ativas' : null,
                  trendUp: true,
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Goals Progress Section
            _SectionHeader(
              title: 'Minhas Metas',
              actionLabel: 'Ver todas',
              onAction: () {},
            ),
            const SizedBox(height: 12),
            if (goals.isLoading)
              const _LoadingShimmer()
            else if (goals.activeGoals.isEmpty)
              _EmptyState(
                icon: Icons.flag_outlined,
                title: 'Nenhuma meta ativa',
                subtitle: 'Defina metas para acompanhar seu progresso',
              )
            else
              _GoalsProgressList(goals: goals.activeGoals.take(3).toList()),
            const SizedBox(height: 24),

            // Tasks Section with improved design
            _SectionHeader(
              title: 'Tarefas Recentes',
              actionLabel: 'Ver todas',
              onAction: () {},
            ),
            const SizedBox(height: 12),
            if (tasks.isLoading)
              const _LoadingShimmer()
            else if (tasks.tasks.isEmpty)
              _EmptyState(
                icon: Icons.task_outlined,
                title: 'Nenhuma tarefa',
                subtitle: 'Suas tarefas aparecerão aqui',
              )
            else
              _TasksList(tasks: tasks.tasks.take(5).toList()),
          ],
        ),
      ),
    );
  }
}

// Goals Progress List Widget
class _GoalsProgressList extends StatelessWidget {
  final List goals;

  const _GoalsProgressList({required this.goals});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: goals.map((goal) {
        final progress = goal.progressPercentage / 100;
        final isCompleted = progress >= 1.0;

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isCompleted
                  ? Colors.green.withOpacity(0.3)
                  : Colors.grey.withOpacity(0.1),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: _getGoalColor(goal.goalType).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      _getGoalIcon(goal.goalType),
                      color: _getGoalColor(goal.goalType),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          goal.title,
                          style: Theme.of(context).textTheme.titleSmall
                              ?.copyWith(fontWeight: FontWeight.bold),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          goal.goalTypeLabel,
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: Colors.grey[600]),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: isCompleted
                          ? Colors.green.withOpacity(0.1)
                          : Theme.of(
                              context,
                            ).colorScheme.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      '${(progress * 100).toInt()}%',
                      style: TextStyle(
                        color: isCompleted
                            ? Colors.green
                            : Theme.of(context).colorScheme.primary,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: LinearProgressIndicator(
                        value: progress.clamp(0.0, 1.0),
                        backgroundColor: Colors.grey[200],
                        valueColor: AlwaysStoppedAnimation<Color>(
                          isCompleted
                              ? Colors.green
                              : _getGoalColor(goal.goalType),
                        ),
                        minHeight: 8,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    '${goal.currentValue.toInt()} / ${goal.targetValue.toInt()}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Color _getGoalColor(dynamic goalType) {
    final typeStr = goalType.toString().toLowerCase();
    if (typeStr.contains('sales') || typeStr.contains('vendas')) {
      return Colors.green;
    } else if (typeStr.contains('listing') || typeStr.contains('captac')) {
      return Colors.orange;
    } else if (typeStr.contains('visit') || typeStr.contains('visita')) {
      return Colors.blue;
    }
    return Colors.purple;
  }

  IconData _getGoalIcon(dynamic goalType) {
    final typeStr = goalType.toString().toLowerCase();
    if (typeStr.contains('sales') || typeStr.contains('vendas')) {
      return Icons.sell_rounded;
    } else if (typeStr.contains('listing') || typeStr.contains('captac')) {
      return Icons.home_work_rounded;
    } else if (typeStr.contains('visit') || typeStr.contains('visita')) {
      return Icons.people_rounded;
    }
    return Icons.flag_rounded;
  }
}

// Tasks List Widget
class _TasksList extends StatelessWidget {
  final List tasks;

  const _TasksList({required this.tasks});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: tasks.map((task) {
        final isCompleted = task.status == TaskStatus.concluida;

        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isCompleted
                  ? Colors.green.withOpacity(0.2)
                  : Colors.grey.withOpacity(0.1),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 4,
            ),
            leading: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: isCompleted
                    ? Colors.green.withOpacity(0.1)
                    : _getPriorityColor(task.priority).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                isCompleted
                    ? Icons.check_circle_rounded
                    : Icons.radio_button_unchecked_rounded,
                color: isCompleted
                    ? Colors.green
                    : _getPriorityColor(task.priority),
                size: 20,
              ),
            ),
            title: Text(
              task.title,
              style: TextStyle(
                fontWeight: FontWeight.w500,
                fontSize: 14,
                decoration: isCompleted ? TextDecoration.lineThrough : null,
                color: isCompleted ? Colors.grey : null,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            subtitle: Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: _getStatusColor(task.status).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      task.statusLabel,
                      style: TextStyle(
                        color: _getStatusColor(task.status),
                        fontSize: 10,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            trailing: _buildPriorityBadge(context, task.priority),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildPriorityBadge(BuildContext context, TaskPriority priority) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: _getPriorityColor(priority).withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            _getPriorityIcon(priority),
            size: 12,
            color: _getPriorityColor(priority),
          ),
          const SizedBox(width: 4),
          Text(
            _getPriorityLabel(priority),
            style: TextStyle(
              color: _getPriorityColor(priority),
              fontSize: 10,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Color _getPriorityColor(TaskPriority priority) {
    switch (priority) {
      case TaskPriority.high:
        return Colors.red;
      case TaskPriority.medium:
        return Colors.orange;
      case TaskPriority.low:
        return Colors.green;
    }
  }

  IconData _getPriorityIcon(TaskPriority priority) {
    switch (priority) {
      case TaskPriority.high:
        return Icons.keyboard_double_arrow_up_rounded;
      case TaskPriority.medium:
        return Icons.remove_rounded;
      case TaskPriority.low:
        return Icons.keyboard_double_arrow_down_rounded;
    }
  }

  String _getPriorityLabel(TaskPriority priority) {
    switch (priority) {
      case TaskPriority.high:
        return 'Alta';
      case TaskPriority.medium:
        return 'Média';
      case TaskPriority.low:
        return 'Baixa';
    }
  }

  Color _getStatusColor(TaskStatus status) {
    switch (status) {
      case TaskStatus.concluida:
        return Colors.green;
      case TaskStatus.emProgresso:
        return Colors.blue;
      case TaskStatus.emRevisao:
        return Colors.orange;
      case TaskStatus.backlog:
        return Colors.grey;
    }
  }
}
