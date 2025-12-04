import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../models/broker.dart';
import '../../models/client.dart';
import '../../models/sale.dart';
import '../../models/listing.dart';
import '../../models/meeting.dart';
import '../../models/expense.dart';
import '../../providers/brokers_provider.dart';
import '../../providers/clients_provider.dart';
import '../../providers/sales_provider.dart';
import '../../providers/listings_provider.dart';
import '../../providers/meetings_provider.dart';
import '../../providers/expenses_provider.dart';
import '../../providers/auth_provider.dart';

class BrokerDetailsScreen extends StatefulWidget {
  final String brokerId;

  const BrokerDetailsScreen({super.key, required this.brokerId});

  @override
  State<BrokerDetailsScreen> createState() => _BrokerDetailsScreenState();
}

class _BrokerDetailsScreenState extends State<BrokerDetailsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final List<_TabItem> _tabs = const [
    _TabItem(icon: Icons.person, label: 'Perfil'),
    _TabItem(icon: Icons.people, label: 'Clientes'),
    _TabItem(icon: Icons.shopping_cart, label: 'Vendas'),
    _TabItem(icon: Icons.home, label: 'Captações'),
    _TabItem(icon: Icons.event, label: 'Reuniões'),
    _TabItem(icon: Icons.receipt, label: 'Despesas'),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final brokers = context.watch<BrokersProvider>();
    final broker = brokers.getBrokerById(widget.brokerId);

    if (broker == null) {
      return Scaffold(
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.go('/brokers'),
          ),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.person_off_outlined,
                size: 80,
                color: Colors.grey[400],
              ),
              const SizedBox(height: 16),
              Text(
                'Corretor não encontrado',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(color: Colors.grey[600]),
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: () => context.go('/brokers'),
                icon: const Icon(Icons.arrow_back),
                label: const Text('Voltar para lista'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/brokers'),
        ),
        title: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: Theme.of(context).colorScheme.primaryContainer,
              child: Text(
                broker.name.isNotEmpty ? broker.name[0].toUpperCase() : 'B',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onPrimaryContainer,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    broker.name,
                    style: const TextStyle(fontSize: 18),
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (broker.creci != null)
                    Text(
                      'CRECI: ${broker.creci}',
                      style: TextStyle(fontSize: 12, color: Colors.grey[400]),
                    ),
                ],
              ),
            ),
          ],
        ),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          tabs: _tabs
              .map((tab) => Tab(icon: Icon(tab.icon), text: tab.label))
              .toList(),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _ProfileTab(brokerId: widget.brokerId),
          _ClientsTab(brokerId: widget.brokerId),
          _SalesTab(brokerId: widget.brokerId),
          _ListingsTab(brokerId: widget.brokerId),
          _MeetingsTab(brokerId: widget.brokerId),
          _ExpensesTab(brokerId: widget.brokerId),
        ],
      ),
    );
  }
}

class _TabItem {
  final IconData icon;
  final String label;

  const _TabItem({required this.icon, required this.label});
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

String _formatCurrency(double value) {
  final formatter = NumberFormat.currency(locale: 'pt_BR', symbol: 'R\$');
  return formatter.format(value);
}

String _formatDate(DateTime date) {
  return DateFormat('dd/MM/yyyy').format(date);
}

String _formatDateTime(DateTime date) {
  return DateFormat('dd/MM/yyyy HH:mm').format(date);
}

// ============================================================================
// PROFILE TAB
// ============================================================================

class _ProfileTab extends StatelessWidget {
  final String brokerId;

  const _ProfileTab({required this.brokerId});

  @override
  Widget build(BuildContext context) {
    final brokers = context.watch<BrokersProvider>();
    final broker = brokers.getBrokerById(brokerId);
    final clients = context.watch<ClientsProvider>();
    final sales = context.watch<SalesProvider>();
    final listings = context.watch<ListingsProvider>();

    if (broker == null) return const SizedBox();

    final brokerClients = clients.getClientsByBrokerId(brokerId);
    final brokerSales = sales.getSalesByBrokerId(brokerId);
    final brokerListings = listings.getListingsByBrokerId(brokerId);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1200),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Card with Profile Info
              Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: Colors.grey.shade200),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Avatar
                      Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Theme.of(context).colorScheme.primary,
                              Theme.of(context).colorScheme.secondary,
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Center(
                          child: Text(
                            broker.name.isNotEmpty
                                ? broker.name[0].toUpperCase()
                                : 'B',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 48,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 32),
                      // Info
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        broker.name,
                                        style: Theme.of(context)
                                            .textTheme
                                            .headlineMedium
                                            ?.copyWith(
                                              fontWeight: FontWeight.bold,
                                            ),
                                      ),
                                      const SizedBox(height: 4),
                                      if (broker.creci != null)
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 12,
                                            vertical: 4,
                                          ),
                                          decoration: BoxDecoration(
                                            color: Theme.of(
                                              context,
                                            ).colorScheme.primaryContainer,
                                            borderRadius: BorderRadius.circular(
                                              20,
                                            ),
                                          ),
                                          child: Text(
                                            'CRECI: ${broker.creci}',
                                            style: TextStyle(
                                              color: Theme.of(
                                                context,
                                              ).colorScheme.onPrimaryContainer,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                                FilledButton.tonalIcon(
                                  onPressed: () =>
                                      _showEditBrokerDialog(context, broker),
                                  icon: const Icon(Icons.edit),
                                  label: const Text('Editar'),
                                ),
                              ],
                            ),
                            const SizedBox(height: 24),
                            Wrap(
                              spacing: 32,
                              runSpacing: 16,
                              children: [
                                _ContactInfo(
                                  icon: Icons.email_outlined,
                                  label: 'Email',
                                  value: broker.email,
                                ),
                                if (broker.phone != null)
                                  _ContactInfo(
                                    icon: Icons.phone_outlined,
                                    label: 'Telefone',
                                    value: broker.phone!,
                                  ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              // Stats Grid
              Text(
                'Estatísticas',
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              LayoutBuilder(
                builder: (context, constraints) {
                  final crossAxisCount = constraints.maxWidth > 900 ? 4 : 2;
                  return GridView.count(
                    crossAxisCount: crossAxisCount,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 16,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    childAspectRatio: 2.2,
                    children: [
                      _StatTile(
                        icon: Icons.people_outline,
                        label: 'Clientes',
                        value: '${brokerClients.length}',
                        color: Colors.blue,
                        trend:
                            '+${brokerClients.where((c) => c.isActive).length} ativos',
                      ),
                      _StatTile(
                        icon: Icons.shopping_cart_outlined,
                        label: 'Vendas',
                        value: '${brokerSales.length}',
                        color: Colors.green,
                        trend: _formatCurrency(
                          brokerSales.fold(0.0, (sum, s) => sum + s.saleValue),
                        ),
                      ),
                      _StatTile(
                        icon: Icons.home_outlined,
                        label: 'Captações',
                        value: '${brokerListings.length}',
                        color: Colors.orange,
                        trend:
                            '${brokerListings.where((l) => l.status == ListingStatus.ativo).length} ativas',
                      ),
                      _StatTile(
                        icon: Icons.attach_money,
                        label: 'Comissões',
                        value: _formatCurrency(
                          brokerSales.fold(
                            0.0,
                            (sum, s) => sum + (s.commissionValue ?? 0),
                          ),
                        ),
                        color: Colors.purple,
                        trend: 'Total acumulado',
                      ),
                    ],
                  );
                },
              ),
              const SizedBox(height: 24),
              // Recent Activity
              Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: Colors.grey.shade200),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.history, color: Colors.grey[600]),
                          const SizedBox(width: 8),
                          Text(
                            'Atividade Recente',
                            style: Theme.of(context).textTheme.titleMedium
                                ?.copyWith(fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      if (brokerSales.isEmpty && brokerListings.isEmpty)
                        Center(
                          child: Padding(
                            padding: const EdgeInsets.all(32),
                            child: Column(
                              children: [
                                Icon(
                                  Icons.inbox_outlined,
                                  size: 48,
                                  color: Colors.grey[400],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Nenhuma atividade recente',
                                  style: TextStyle(color: Colors.grey[600]),
                                ),
                              ],
                            ),
                          ),
                        )
                      else
                        ...brokerSales
                            .take(3)
                            .map(
                              (sale) => _ActivityItem(
                                icon: Icons.shopping_cart,
                                iconColor: Colors.green,
                                title: 'Venda realizada',
                                subtitle: sale.propertyName,
                                trailing: _formatCurrency(sale.saleValue),
                                date: sale.saleDate,
                              ),
                            ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showEditBrokerDialog(BuildContext context, Broker broker) {
    final nameController = TextEditingController(text: broker.name);
    final emailController = TextEditingController(text: broker.email);
    final phoneController = TextEditingController(text: broker.phone ?? '');
    final creciController = TextEditingController(text: broker.creci ?? '');

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Editar Corretor'),
        content: SizedBox(
          width: 500,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(
                  labelText: 'Nome',
                  prefixIcon: Icon(Icons.person_outline),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: emailController,
                decoration: const InputDecoration(
                  labelText: 'Email',
                  prefixIcon: Icon(Icons.email_outlined),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: phoneController,
                decoration: const InputDecoration(
                  labelText: 'Telefone',
                  prefixIcon: Icon(Icons.phone_outlined),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: creciController,
                decoration: const InputDecoration(
                  labelText: 'CRECI',
                  prefixIcon: Icon(Icons.badge_outlined),
                  border: OutlineInputBorder(),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () async {
              final provider = context.read<BrokersProvider>();
              final updatedBroker = broker.copyWith(
                name: nameController.text,
                email: emailController.text,
                phone: phoneController.text.isEmpty
                    ? null
                    : phoneController.text,
                creci: creciController.text.isEmpty
                    ? null
                    : creciController.text,
              );
              await provider.updateBroker(updatedBroker);
              if (context.mounted) Navigator.of(context).pop();
            },
            child: const Text('Salvar'),
          ),
        ],
      ),
    );
  }
}

class _ContactInfo extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _ContactInfo({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.grey.shade100,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 20, color: Colors.grey[600]),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(fontSize: 12, color: Colors.grey[500]),
            ),
            Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
          ],
        ),
      ],
    );
  }
}

class _StatTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  final String? trend;

  const _StatTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
    this.trend,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    label,
                    style: TextStyle(color: Colors.grey[600], fontSize: 13),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    value,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (trend != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      trend!,
                      style: TextStyle(color: Colors.grey[500], fontSize: 11),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActivityItem extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final String trailing;
  final DateTime date;

  const _ActivityItem({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.trailing,
    required this.date,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                Text(
                  subtitle,
                  style: TextStyle(color: Colors.grey[600], fontSize: 13),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                trailing,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              Text(
                _formatDate(date),
                style: TextStyle(color: Colors.grey[500], fontSize: 12),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// CLIENTS TAB
// ============================================================================

class _ClientsTab extends StatefulWidget {
  final String brokerId;

  const _ClientsTab({required this.brokerId});

  @override
  State<_ClientsTab> createState() => _ClientsTabState();
}

class _ClientsTabState extends State<_ClientsTab> {
  String _searchQuery = '';
  String? _statusFilter;

  @override
  Widget build(BuildContext context) {
    final clients = context.watch<ClientsProvider>();
    var brokerClients = clients.getClientsByBrokerId(widget.brokerId);

    // Apply filters
    if (_searchQuery.isNotEmpty) {
      brokerClients = brokerClients
          .where(
            (c) =>
                c.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                (c.email?.toLowerCase().contains(_searchQuery.toLowerCase()) ??
                    false),
          )
          .toList();
    }
    if (_statusFilter != null) {
      brokerClients = brokerClients
          .where((c) => c.status == _statusFilter)
          .toList();
    }

    if (clients.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with actions
          _buildHeader(context, clients),
          const SizedBox(height: 20),
          // Content
          Expanded(
            child: brokerClients.isEmpty
                ? _buildEmptyState()
                : _buildDataTable(context, brokerClients, clients),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, ClientsProvider clients) {
    return Row(
      children: [
        Expanded(
          flex: 2,
          child: TextField(
            decoration: InputDecoration(
              hintText: 'Buscar cliente...',
              prefixIcon: const Icon(Icons.search),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16),
            ),
            onChanged: (value) => setState(() => _searchQuery = value),
          ),
        ),
        const SizedBox(width: 16),
        SizedBox(
          width: 200,
          child: DropdownButtonFormField<String?>(
            value: _statusFilter,
            decoration: InputDecoration(
              labelText: 'Status',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16),
            ),
            items: [
              const DropdownMenuItem(value: null, child: Text('Todos')),
              const DropdownMenuItem(value: 'active', child: Text('Ativo')),
              const DropdownMenuItem(
                value: 'contacted',
                child: Text('Contactado'),
              ),
              const DropdownMenuItem(
                value: 'negotiating',
                child: Text('Em Negociação'),
              ),
              const DropdownMenuItem(value: 'closed', child: Text('Fechado')),
              const DropdownMenuItem(value: 'lost', child: Text('Perdido')),
            ],
            onChanged: (value) => setState(() => _statusFilter = value),
          ),
        ),
        const SizedBox(width: 16),
        FilledButton.icon(
          onPressed: () => _showClientDialog(context, null),
          icon: const Icon(Icons.add),
          label: const Text('Novo Cliente'),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.people_outline, size: 80, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            'Nenhum cliente encontrado',
            style: TextStyle(fontSize: 18, color: Colors.grey[600]),
          ),
          const SizedBox(height: 8),
          Text(
            'Clique em "Novo Cliente" para adicionar',
            style: TextStyle(color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  Widget _buildDataTable(
    BuildContext context,
    List<Client> brokerClients,
    ClientsProvider clients,
  ) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          // Table Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(12),
              ),
            ),
            child: Row(
              children: [
                Expanded(flex: 3, child: Text('Cliente', style: _headerStyle)),
                Expanded(flex: 2, child: Text('Contato', style: _headerStyle)),
                Expanded(
                  flex: 2,
                  child: Text('Interesse', style: _headerStyle),
                ),
                Expanded(flex: 2, child: Text('Status', style: _headerStyle)),
                SizedBox(width: 120, child: Text('Ações', style: _headerStyle)),
              ],
            ),
          ),
          const Divider(height: 1),
          // Table Body
          Expanded(
            child: ListView.separated(
              itemCount: brokerClients.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final client = brokerClients[index];
                return _buildClientRow(context, client, clients);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildClientRow(
    BuildContext context,
    Client client,
    ClientsProvider clients,
  ) {
    return InkWell(
      onTap: () => _showClientDialog(context, client),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Row(
          children: [
            // Client Name with Avatar
            Expanded(
              flex: 3,
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 18,
                    backgroundColor: Theme.of(
                      context,
                    ).colorScheme.primaryContainer,
                    child: Text(
                      client.name[0].toUpperCase(),
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.onPrimaryContainer,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          client.name,
                          style: const TextStyle(fontWeight: FontWeight.w500),
                          overflow: TextOverflow.ellipsis,
                        ),
                        Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: (client.status == 'active')
                                    ? Colors.green
                                    : Colors.grey,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              (client.status == 'active') ? 'Ativo' : 'Inativo',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            // Contact
            Expanded(
              flex: 2,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (client.email != null)
                    Text(
                      client.email!,
                      style: TextStyle(fontSize: 13, color: Colors.grey[700]),
                      overflow: TextOverflow.ellipsis,
                    ),
                  if (client.phone != null)
                    Text(
                      client.phone!,
                      style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                    ),
                ],
              ),
            ),
            // Notes
            Expanded(
              flex: 2,
              child: Text(
                client.notes ?? '-',
                style: TextStyle(color: Colors.grey[700]),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            // Status
            Expanded(
              flex: 2,
              child: _StatusBadge(
                label: client.statusLabel,
                color: _getStatusColor(client.status),
              ),
            ),
            // Actions
            SizedBox(
              width: 120,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  IconButton(
                    icon: const Icon(Icons.edit_outlined),
                    tooltip: 'Editar',
                    onPressed: () => _showClientDialog(context, client),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline),
                    tooltip: 'Excluir',
                    color: Colors.red[400],
                    onPressed: () => _confirmDelete(context, client, clients),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  TextStyle get _headerStyle => TextStyle(
    fontWeight: FontWeight.w600,
    color: Colors.grey[700],
    fontSize: 13,
  );

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'active':
        return Colors.blue;
      case 'contacted':
        return Colors.orange;
      case 'negotiating':
        return Colors.purple;
      case 'closed':
        return Colors.green;
      case 'lost':
        return Colors.red;
      default:
        return Colors.blue;
    }
  }

  void _showClientDialog(BuildContext context, Client? client) {
    final isEditing = client != null;
    final nameController = TextEditingController(text: client?.name ?? '');
    final emailController = TextEditingController(text: client?.email ?? '');
    final phoneController = TextEditingController(text: client?.phone ?? '');
    final addressController = TextEditingController(
      text: client?.address ?? '',
    );
    final notesController = TextEditingController(text: client?.notes ?? '');
    var status = client?.status ?? 'active';

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text(isEditing ? 'Editar Cliente' : 'Novo Cliente'),
          content: SizedBox(
            width: 600,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: nameController,
                          decoration: const InputDecoration(
                            labelText: 'Nome *',
                            prefixIcon: Icon(Icons.person_outline),
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: TextField(
                          controller: emailController,
                          decoration: const InputDecoration(
                            labelText: 'Email',
                            prefixIcon: Icon(Icons.email_outlined),
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: phoneController,
                          decoration: const InputDecoration(
                            labelText: 'Telefone',
                            prefixIcon: Icon(Icons.phone_outlined),
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: status,
                          decoration: const InputDecoration(
                            labelText: 'Status',
                            prefixIcon: Icon(Icons.flag_outlined),
                            border: OutlineInputBorder(),
                          ),
                          items: const [
                            DropdownMenuItem(
                              value: 'active',
                              child: Text('Ativo'),
                            ),
                            DropdownMenuItem(
                              value: 'contacted',
                              child: Text('Contactado'),
                            ),
                            DropdownMenuItem(
                              value: 'negotiating',
                              child: Text('Em Negociação'),
                            ),
                            DropdownMenuItem(
                              value: 'closed',
                              child: Text('Fechado'),
                            ),
                            DropdownMenuItem(
                              value: 'lost',
                              child: Text('Perdido'),
                            ),
                          ],
                          onChanged: (value) =>
                              setDialogState(() => status = value ?? 'active'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: addressController,
                    decoration: const InputDecoration(
                      labelText: 'Endereço',
                      prefixIcon: Icon(Icons.location_on_outlined),
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: notesController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Observações',
                      prefixIcon: Icon(Icons.notes_outlined),
                      border: OutlineInputBorder(),
                      alignLabelWithHint: true,
                    ),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancelar'),
            ),
            FilledButton(
              onPressed: () async {
                if (nameController.text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Nome é obrigatório')),
                  );
                  return;
                }

                final clientsProvider = context.read<ClientsProvider>();
                final authProvider = context.read<AuthProvider>();

                final newClient = Client(
                  id: client?.id ?? '',
                  userId: authProvider.userId ?? '',
                  brokerId: widget.brokerId,
                  name: nameController.text,
                  email: emailController.text.isEmpty
                      ? null
                      : emailController.text,
                  phone: phoneController.text.isEmpty
                      ? null
                      : phoneController.text,
                  address: addressController.text.isEmpty
                      ? null
                      : addressController.text,
                  notes: notesController.text.isEmpty
                      ? null
                      : notesController.text,
                  status: status,
                );

                bool success;
                if (isEditing) {
                  success = await clientsProvider.updateClient(newClient);
                } else {
                  success = await clientsProvider.createClient(newClient);
                }

                if (success && context.mounted) {
                  Navigator.pop(context);
                }
              },
              child: Text(isEditing ? 'Salvar' : 'Criar'),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmDelete(
    BuildContext context,
    Client client,
    ClientsProvider clients,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar Exclusão'),
        content: Text('Deseja realmente excluir o cliente "${client.name}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () async {
              await clients.deleteClient(client.id);
              if (context.mounted) Navigator.of(context).pop();
            },
            child: const Text('Excluir'),
          ),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String label;
  final Color color;

  const _StatusBadge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w500,
          fontSize: 12,
        ),
      ),
    );
  }
}

// ============================================================================
// SALES TAB
// ============================================================================

class _SalesTab extends StatefulWidget {
  final String brokerId;

  const _SalesTab({required this.brokerId});

  @override
  State<_SalesTab> createState() => _SalesTabState();
}

class _SalesTabState extends State<_SalesTab> {
  String _searchQuery = '';
  DateTimeRange? _dateFilter;

  @override
  void initState() {
    super.initState();
    // Ensure sales are loaded when tab is first opened
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final sales = context.read<SalesProvider>();
      if (sales.sales.isEmpty && !sales.isLoading) {
        print('[_SalesTab] Sales empty, triggering fetchSales()');
        sales.fetchSales();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    print('[_SalesTab] build() called with brokerId: ${widget.brokerId}');
    final sales = context.watch<SalesProvider>();
    print(
      '[_SalesTab] SalesProvider loaded, isLoading: ${sales.isLoading}, sales count: ${sales.sales.length}',
    );
    var brokerSales = sales.getSalesByBrokerId(widget.brokerId);
    print('[_SalesTab] brokerSales count: ${brokerSales.length}');

    // Apply filters
    if (_searchQuery.isNotEmpty) {
      brokerSales = brokerSales
          .where(
            (s) =>
                s.propertyName.toLowerCase().contains(
                  _searchQuery.toLowerCase(),
                ) ||
                (s.clientName?.toLowerCase().contains(
                      _searchQuery.toLowerCase(),
                    ) ??
                    false),
          )
          .toList();
    }
    if (_dateFilter != null) {
      brokerSales = brokerSales
          .where(
            (s) =>
                s.saleDate.isAfter(
                  _dateFilter!.start.subtract(const Duration(days: 1)),
                ) &&
                s.saleDate.isBefore(
                  _dateFilter!.end.add(const Duration(days: 1)),
                ),
          )
          .toList();
    }

    // Sort by date descending
    brokerSales.sort((a, b) => b.saleDate.compareTo(a.saleDate));

    if (sales.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    // Calculate totals
    final totalValue = brokerSales.fold(0.0, (sum, s) => sum + s.saleValue);
    final totalCommission = brokerSales.fold(
      0.0,
      (sum, s) => sum + (s.commissionValue ?? 0),
    );

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Summary Cards
          Row(
            children: [
              _MiniStatCard(
                icon: Icons.shopping_cart,
                label: 'Total de Vendas',
                value: '${brokerSales.length}',
                color: Colors.green,
              ),
              const SizedBox(width: 16),
              _MiniStatCard(
                icon: Icons.attach_money,
                label: 'Valor Total',
                value: _formatCurrency(totalValue),
                color: Colors.blue,
              ),
              const SizedBox(width: 16),
              _MiniStatCard(
                icon: Icons.percent,
                label: 'Comissões',
                value: _formatCurrency(totalCommission),
                color: Colors.purple,
              ),
              const Spacer(),
              FilledButton.icon(
                onPressed: () => _showSaleDialog(context, null),
                icon: const Icon(Icons.add),
                label: const Text('Nova Venda'),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // Filters
          Row(
            children: [
              Expanded(
                flex: 2,
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Buscar por imóvel ou cliente...',
                    prefixIcon: const Icon(Icons.search),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                  ),
                  onChanged: (value) => setState(() => _searchQuery = value),
                ),
              ),
              const SizedBox(width: 16),
              OutlinedButton.icon(
                onPressed: () async {
                  final range = await showDateRangePicker(
                    context: context,
                    firstDate: DateTime(2020),
                    lastDate: DateTime.now(),
                    initialDateRange: _dateFilter,
                  );
                  if (range != null) {
                    setState(() => _dateFilter = range);
                  }
                },
                icon: const Icon(Icons.calendar_month),
                label: Text(
                  _dateFilter != null
                      ? '${_formatDate(_dateFilter!.start)} - ${_formatDate(_dateFilter!.end)}'
                      : 'Filtrar por data',
                ),
              ),
              if (_dateFilter != null) ...[
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.clear),
                  tooltip: 'Limpar filtro de data',
                  onPressed: () => setState(() => _dateFilter = null),
                ),
              ],
            ],
          ),
          const SizedBox(height: 20),
          // Content
          Expanded(
            child: brokerSales.isEmpty
                ? _buildEmptyState()
                : _buildDataTable(context, brokerSales, sales),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.shopping_cart_outlined, size: 80, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            'Nenhuma venda encontrada',
            style: TextStyle(fontSize: 18, color: Colors.grey[600]),
          ),
          const SizedBox(height: 8),
          Text(
            'Clique em "Nova Venda" para registrar',
            style: TextStyle(color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  Widget _buildDataTable(
    BuildContext context,
    List<Sale> brokerSales,
    SalesProvider sales,
  ) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          // Table Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(12),
              ),
            ),
            child: Row(
              children: [
                Expanded(flex: 3, child: Text('Imóvel', style: _headerStyle)),
                Expanded(flex: 2, child: Text('Cliente', style: _headerStyle)),
                Expanded(flex: 2, child: Text('Valor', style: _headerStyle)),
                Expanded(flex: 2, child: Text('Comissão', style: _headerStyle)),
                Expanded(flex: 2, child: Text('Data', style: _headerStyle)),
                SizedBox(width: 120, child: Text('Ações', style: _headerStyle)),
              ],
            ),
          ),
          const Divider(height: 1),
          // Table Body
          Expanded(
            child: ListView.separated(
              itemCount: brokerSales.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final sale = brokerSales[index];
                return _buildSaleRow(context, sale, sales);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSaleRow(BuildContext context, Sale sale, SalesProvider sales) {
    return InkWell(
      onTap: () => _showSaleDialog(context, sale),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Row(
          children: [
            // Property
            Expanded(
              flex: 3,
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.green.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.home,
                      color: Colors.green,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      sale.propertyName,
                      style: const TextStyle(fontWeight: FontWeight.w500),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
            // Client
            Expanded(
              flex: 2,
              child: Text(
                sale.clientName ?? '-',
                style: TextStyle(color: Colors.grey[700]),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            // Value
            Expanded(
              flex: 2,
              child: Text(
                _formatCurrency(sale.saleValue),
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
            // Commission
            Expanded(
              flex: 2,
              child: Text(
                _formatCurrency(sale.commissionValue ?? 0),
                style: TextStyle(
                  color: Colors.green[700],
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            // Date
            Expanded(
              flex: 2,
              child: Text(
                _formatDate(sale.saleDate),
                style: TextStyle(color: Colors.grey[600]),
              ),
            ),
            // Actions
            SizedBox(
              width: 120,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  IconButton(
                    icon: const Icon(Icons.edit_outlined),
                    tooltip: 'Editar',
                    onPressed: () => _showSaleDialog(context, sale),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline),
                    tooltip: 'Excluir',
                    color: Colors.red[400],
                    onPressed: () => _confirmDelete(context, sale, sales),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  TextStyle get _headerStyle => TextStyle(
    fontWeight: FontWeight.w600,
    color: Colors.grey[700],
    fontSize: 13,
  );

  void _showSaleDialog(BuildContext context, Sale? sale) {
    final isEditing = sale != null;
    final addressController = TextEditingController(
      text: sale?.propertyName ?? '',
    );
    final clientController = TextEditingController(
      text: sale?.clientName ?? '',
    );
    final valueController = TextEditingController(
      text: sale?.saleValue.toStringAsFixed(2) ?? '',
    );
    final commissionController = TextEditingController(
      text: sale?.commissionValue?.toStringAsFixed(2) ?? '',
    );
    var saleDate = sale?.saleDate ?? DateTime.now();

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text(isEditing ? 'Editar Venda' : 'Nova Venda'),
          content: SizedBox(
            width: 600,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: addressController,
                    decoration: const InputDecoration(
                      labelText: 'Endereço do Imóvel *',
                      prefixIcon: Icon(Icons.home_outlined),
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: clientController,
                    decoration: const InputDecoration(
                      labelText: 'Nome do Cliente *',
                      prefixIcon: Icon(Icons.person_outline),
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: valueController,
                          keyboardType: const TextInputType.numberWithOptions(
                            decimal: true,
                          ),
                          decoration: const InputDecoration(
                            labelText: 'Valor da Venda *',
                            prefixIcon: Icon(Icons.attach_money),
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: TextField(
                          controller: commissionController,
                          keyboardType: const TextInputType.numberWithOptions(
                            decimal: true,
                          ),
                          decoration: const InputDecoration(
                            labelText: 'Comissão *',
                            prefixIcon: Icon(Icons.percent),
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.calendar_today),
                    title: const Text('Data da Venda'),
                    subtitle: Text(_formatDate(saleDate)),
                    trailing: OutlinedButton(
                      onPressed: () async {
                        final date = await showDatePicker(
                          context: context,
                          initialDate: saleDate,
                          firstDate: DateTime(2020),
                          lastDate: DateTime.now(),
                        );
                        if (date != null) {
                          setDialogState(() => saleDate = date);
                        }
                      },
                      child: const Text('Alterar'),
                    ),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancelar'),
            ),
            FilledButton(
              onPressed: () async {
                if (addressController.text.isEmpty ||
                    clientController.text.isEmpty ||
                    valueController.text.isEmpty ||
                    commissionController.text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Preencha todos os campos obrigatórios'),
                    ),
                  );
                  return;
                }

                final provider = context.read<SalesProvider>();
                final auth = context.read<AuthProvider>();

                final newSale = Sale(
                  id: sale?.id ?? '',
                  userId: auth.userId ?? '',
                  brokerId: widget.brokerId,
                  propertyName: addressController.text,
                  clientName: clientController.text,
                  saleValue: double.tryParse(valueController.text) ?? 0,
                  commissionValue: double.tryParse(commissionController.text),
                  saleDate: saleDate,
                );

                if (isEditing) {
                  await provider.updateSale(newSale);
                } else {
                  await provider.createSale(newSale);
                }

                if (context.mounted) Navigator.of(context).pop();
              },
              child: Text(isEditing ? 'Salvar' : 'Criar'),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmDelete(BuildContext context, Sale sale, SalesProvider sales) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar Exclusão'),
        content: Text(
          'Deseja realmente excluir a venda de "${sale.propertyName}"?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () async {
              await sales.deleteSale(sale.id);
              if (context.mounted) Navigator.of(context).pop();
            },
            child: const Text('Excluir'),
          ),
        ],
      ),
    );
  }
}

class _MiniStatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _MiniStatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(color: Colors.grey[600], fontSize: 12),
              ),
              Text(
                value,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: color,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// LISTINGS TAB
// ============================================================================

class _ListingsTab extends StatefulWidget {
  final String brokerId;

  const _ListingsTab({required this.brokerId});

  @override
  State<_ListingsTab> createState() => _ListingsTabState();
}

class _ListingsTabState extends State<_ListingsTab> {
  String _searchQuery = '';
  ListingStatus? _statusFilter;
  PropertyType? _typeFilter;

  @override
  void initState() {
    super.initState();
    // Ensure listings are loaded when tab is first opened
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final listings = context.read<ListingsProvider>();
      if (listings.listings.isEmpty && !listings.isLoading) {
        print('[_ListingsTab] Listings empty, triggering fetchListings()');
        listings.fetchListings();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final listings = context.watch<ListingsProvider>();
    var brokerListings = listings.getListingsByBrokerId(widget.brokerId);

    // Apply filters
    if (_searchQuery.isNotEmpty) {
      brokerListings = brokerListings
          .where(
            (l) =>
                l.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                (l.address?.toLowerCase().contains(
                      _searchQuery.toLowerCase(),
                    ) ??
                    false),
          )
          .toList();
    }
    if (_statusFilter != null) {
      brokerListings = brokerListings
          .where((l) => l.status == _statusFilter)
          .toList();
    }
    if (_typeFilter != null) {
      brokerListings = brokerListings
          .where((l) => l.propertyType == _typeFilter)
          .toList();
    }

    // Sort by created date descending
    brokerListings.sort(
      (a, b) => (b.createdAt ?? DateTime.now()).compareTo(
        a.createdAt ?? DateTime.now(),
      ),
    );

    if (listings.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    // Calculate totals
    final totalValue = brokerListings.fold(
      0.0,
      (sum, l) => sum + (l.price ?? 0),
    );
    final activeCount = brokerListings
        .where((l) => l.status == ListingStatus.ativo)
        .length;

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Summary Cards
          Row(
            children: [
              _MiniStatCard(
                icon: Icons.home,
                label: 'Total de Captações',
                value: '${brokerListings.length}',
                color: Colors.orange,
              ),
              const SizedBox(width: 16),
              _MiniStatCard(
                icon: Icons.check_circle,
                label: 'Ativas',
                value: '$activeCount',
                color: Colors.green,
              ),
              const SizedBox(width: 16),
              _MiniStatCard(
                icon: Icons.attach_money,
                label: 'Valor Total',
                value: _formatCurrency(totalValue),
                color: Colors.blue,
              ),
              const Spacer(),
              FilledButton.icon(
                onPressed: () => _showListingDialog(context, null),
                icon: const Icon(Icons.add),
                label: const Text('Nova Captação'),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // Filters
          Row(
            children: [
              Expanded(
                flex: 2,
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Buscar por endereço ou proprietário...',
                    prefixIcon: const Icon(Icons.search),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                  ),
                  onChanged: (value) => setState(() => _searchQuery = value),
                ),
              ),
              const SizedBox(width: 16),
              SizedBox(
                width: 180,
                child: DropdownButtonFormField<ListingStatus?>(
                  value: _statusFilter,
                  decoration: InputDecoration(
                    labelText: 'Status',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                  ),
                  items: [
                    const DropdownMenuItem(value: null, child: Text('Todos')),
                    ...ListingStatus.values.map(
                      (s) => DropdownMenuItem(
                        value: s,
                        child: Text(_getListingStatusLabel(s)),
                      ),
                    ),
                  ],
                  onChanged: (value) => setState(() => _statusFilter = value),
                ),
              ),
              const SizedBox(width: 16),
              SizedBox(
                width: 180,
                child: DropdownButtonFormField<PropertyType?>(
                  value: _typeFilter,
                  decoration: InputDecoration(
                    labelText: 'Tipo',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                  ),
                  items: [
                    const DropdownMenuItem(value: null, child: Text('Todos')),
                    ...PropertyType.values.map(
                      (t) => DropdownMenuItem(
                        value: t,
                        child: Text(_getPropertyTypeLabel(t)),
                      ),
                    ),
                  ],
                  onChanged: (value) => setState(() => _typeFilter = value),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // Content
          Expanded(
            child: brokerListings.isEmpty
                ? _buildEmptyState()
                : _buildDataTable(context, brokerListings, listings),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.home_outlined, size: 80, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            'Nenhuma captação encontrada',
            style: TextStyle(fontSize: 18, color: Colors.grey[600]),
          ),
          const SizedBox(height: 8),
          Text(
            'Clique em "Nova Captação" para adicionar',
            style: TextStyle(color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  Widget _buildDataTable(
    BuildContext context,
    List<Listing> brokerListings,
    ListingsProvider listings,
  ) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          // Table Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(12),
              ),
            ),
            child: Row(
              children: [
                Expanded(flex: 3, child: Text('Imóvel', style: _headerStyle)),
                Expanded(
                  flex: 2,
                  child: Text('Proprietário', style: _headerStyle),
                ),
                Expanded(flex: 2, child: Text('Tipo', style: _headerStyle)),
                Expanded(flex: 2, child: Text('Valor', style: _headerStyle)),
                Expanded(flex: 2, child: Text('Status', style: _headerStyle)),
                SizedBox(width: 120, child: Text('Ações', style: _headerStyle)),
              ],
            ),
          ),
          const Divider(height: 1),
          // Table Body
          Expanded(
            child: ListView.separated(
              itemCount: brokerListings.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final listing = brokerListings[index];
                return _buildListingRow(context, listing, listings);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildListingRow(
    BuildContext context,
    Listing listing,
    ListingsProvider listings,
  ) {
    return InkWell(
      onTap: () => _showListingDialog(context, listing),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Row(
          children: [
            // Property Address
            Expanded(
              flex: 3,
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.orange.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      _getPropertyIcon(listing.propertyType),
                      color: Colors.orange,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          listing.title,
                          style: const TextStyle(fontWeight: FontWeight.w500),
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          listing.address ?? '-',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[500],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            // Description
            Expanded(
              flex: 2,
              child: Text(
                listing.description ?? '-',
                style: TextStyle(color: Colors.grey[700]),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            // Type
            Expanded(
              flex: 2,
              child: Text(
                listing.propertyTypeLabel,
                style: TextStyle(color: Colors.grey[700]),
              ),
            ),
            // Value
            Expanded(
              flex: 2,
              child: Text(
                listing.price != null ? _formatCurrency(listing.price!) : '-',
                style: const TextStyle(fontWeight: FontWeight.w500),
              ),
            ),
            // Status
            Expanded(
              flex: 2,
              child: _StatusBadge(
                label: listing.statusLabel,
                color: _getListingStatusColor(listing.status),
              ),
            ),
            // Actions
            SizedBox(
              width: 120,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  IconButton(
                    icon: const Icon(Icons.edit_outlined),
                    tooltip: 'Editar',
                    onPressed: () => _showListingDialog(context, listing),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline),
                    tooltip: 'Excluir',
                    color: Colors.red[400],
                    onPressed: () => _confirmDelete(context, listing, listings),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  TextStyle get _headerStyle => TextStyle(
    fontWeight: FontWeight.w600,
    color: Colors.grey[700],
    fontSize: 13,
  );

  String _getListingStatusLabel(ListingStatus status) {
    switch (status) {
      case ListingStatus.ativo:
        return 'Ativo';
      case ListingStatus.desativado:
        return 'Desativado';
      case ListingStatus.vendido:
        return 'Vendido';
      case ListingStatus.moderacao:
        return 'Moderação';
      case ListingStatus.agregado:
        return 'Agregado';
    }
  }

  String _getPropertyTypeLabel(PropertyType type) {
    switch (type) {
      case PropertyType.apartamento:
        return 'Apartamento';
      case PropertyType.casa:
        return 'Casa';
      case PropertyType.sobrado:
        return 'Sobrado';
      case PropertyType.lote:
        return 'Lote';
      case PropertyType.chacara:
        return 'Chácara';
    }
  }

  Color _getListingStatusColor(ListingStatus status) {
    switch (status) {
      case ListingStatus.ativo:
        return Colors.green;
      case ListingStatus.vendido:
        return Colors.blue;
      case ListingStatus.desativado:
        return Colors.grey;
      case ListingStatus.moderacao:
        return Colors.orange;
      case ListingStatus.agregado:
        return Colors.purple;
    }
  }

  IconData _getPropertyIcon(PropertyType type) {
    switch (type) {
      case PropertyType.apartamento:
        return Icons.apartment;
      case PropertyType.casa:
        return Icons.home;
      case PropertyType.sobrado:
        return Icons.villa;
      case PropertyType.lote:
        return Icons.landscape;
      case PropertyType.chacara:
        return Icons.forest;
    }
  }

  void _showListingDialog(BuildContext context, Listing? listing) {
    final isEditing = listing != null;
    final titleController = TextEditingController(text: listing?.title ?? '');
    final addressController = TextEditingController(
      text: listing?.address ?? '',
    );
    final descriptionController = TextEditingController(
      text: listing?.description ?? '',
    );
    final valueController = TextEditingController(
      text: listing?.price?.toStringAsFixed(2) ?? '',
    );
    var propertyType = listing?.propertyType ?? PropertyType.apartamento;
    var status = listing?.status ?? ListingStatus.ativo;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text(isEditing ? 'Editar Captação' : 'Nova Captação'),
          content: SizedBox(
            width: 600,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: titleController,
                    decoration: const InputDecoration(
                      labelText: 'Título *',
                      prefixIcon: Icon(Icons.home_outlined),
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: addressController,
                    decoration: const InputDecoration(
                      labelText: 'Endereço',
                      prefixIcon: Icon(Icons.location_on_outlined),
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: descriptionController,
                          decoration: const InputDecoration(
                            labelText: 'Descrição',
                            prefixIcon: Icon(Icons.description_outlined),
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: TextField(
                          controller: valueController,
                          keyboardType: const TextInputType.numberWithOptions(
                            decimal: true,
                          ),
                          decoration: const InputDecoration(
                            labelText: 'Valor do Imóvel',
                            prefixIcon: Icon(Icons.attach_money),
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<PropertyType>(
                          value: propertyType,
                          decoration: const InputDecoration(
                            labelText: 'Tipo do Imóvel',
                            prefixIcon: Icon(Icons.home_outlined),
                            border: OutlineInputBorder(),
                          ),
                          items: PropertyType.values
                              .map(
                                (t) => DropdownMenuItem(
                                  value: t,
                                  child: Text(_getPropertyTypeLabel(t)),
                                ),
                              )
                              .toList(),
                          onChanged: (value) {
                            if (value != null) {
                              setDialogState(() => propertyType = value);
                            }
                          },
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: DropdownButtonFormField<ListingStatus>(
                          value: status,
                          decoration: const InputDecoration(
                            labelText: 'Status',
                            prefixIcon: Icon(Icons.flag_outlined),
                            border: OutlineInputBorder(),
                          ),
                          items: ListingStatus.values
                              .map(
                                (s) => DropdownMenuItem(
                                  value: s,
                                  child: Text(_getListingStatusLabel(s)),
                                ),
                              )
                              .toList(),
                          onChanged: (value) {
                            if (value != null) {
                              setDialogState(() => status = value);
                            }
                          },
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancelar'),
            ),
            FilledButton(
              onPressed: () async {
                if (titleController.text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Título é obrigatório')),
                  );
                  return;
                }

                final provider = context.read<ListingsProvider>();
                final auth = context.read<AuthProvider>();

                final newListing = Listing(
                  id: listing?.id ?? '',
                  userId: auth.userId ?? '',
                  brokerId: widget.brokerId,
                  title: titleController.text,
                  address: addressController.text.isEmpty
                      ? null
                      : addressController.text,
                  description: descriptionController.text.isEmpty
                      ? null
                      : descriptionController.text,
                  price: double.tryParse(valueController.text),
                  propertyType: propertyType,
                  status: status,
                );

                if (isEditing) {
                  await provider.updateListing(newListing);
                } else {
                  await provider.createListing(newListing);
                }

                if (context.mounted) Navigator.of(context).pop();
              },
              child: Text(isEditing ? 'Salvar' : 'Criar'),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmDelete(
    BuildContext context,
    Listing listing,
    ListingsProvider listings,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar Exclusão'),
        content: Text(
          'Deseja realmente excluir a captação "${listing.title}"?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () async {
              await listings.deleteListing(listing.id);
              if (context.mounted) Navigator.of(context).pop();
            },
            child: const Text('Excluir'),
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// MEETINGS TAB
// ============================================================================

class _MeetingsTab extends StatefulWidget {
  final String brokerId;

  const _MeetingsTab({required this.brokerId});

  @override
  State<_MeetingsTab> createState() => _MeetingsTabState();
}

class _MeetingsTabState extends State<_MeetingsTab> {
  String _searchQuery = '';
  MeetingStatus? _statusFilter;
  MeetingType? _typeFilter;

  @override
  Widget build(BuildContext context) {
    final meetings = context.watch<MeetingsProvider>();
    var brokerMeetings = meetings.getMeetingsByBrokerId(widget.brokerId);

    // Apply filters
    if (_searchQuery.isNotEmpty) {
      brokerMeetings = brokerMeetings
          .where(
            (m) =>
                m.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                (m.clientName?.toLowerCase().contains(
                      _searchQuery.toLowerCase(),
                    ) ??
                    false),
          )
          .toList();
    }
    if (_statusFilter != null) {
      brokerMeetings = brokerMeetings
          .where((m) => m.status == _statusFilter)
          .toList();
    }
    if (_typeFilter != null) {
      brokerMeetings = brokerMeetings
          .where((m) => m.meetingType == _typeFilter)
          .toList();
    }

    // Sort by date descending
    brokerMeetings.sort((a, b) => b.meetingDate.compareTo(a.meetingDate));

    if (meetings.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    // Calculate stats
    final scheduled = brokerMeetings
        .where((m) => m.status == MeetingStatus.agendada)
        .length;
    final completed = brokerMeetings
        .where((m) => m.status == MeetingStatus.realizada)
        .length;
    final cancelled = brokerMeetings
        .where((m) => m.status == MeetingStatus.cancelada)
        .length;

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Summary Cards
          Row(
            children: [
              _MiniStatCard(
                icon: Icons.event,
                label: 'Total',
                value: '${brokerMeetings.length}',
                color: Colors.purple,
              ),
              const SizedBox(width: 16),
              _MiniStatCard(
                icon: Icons.schedule,
                label: 'Agendadas',
                value: '$scheduled',
                color: Colors.blue,
              ),
              const SizedBox(width: 16),
              _MiniStatCard(
                icon: Icons.check_circle,
                label: 'Realizadas',
                value: '$completed',
                color: Colors.green,
              ),
              const SizedBox(width: 16),
              _MiniStatCard(
                icon: Icons.cancel,
                label: 'Canceladas',
                value: '$cancelled',
                color: Colors.red,
              ),
              const Spacer(),
              FilledButton.icon(
                onPressed: () => _showMeetingDialog(context, null),
                icon: const Icon(Icons.add),
                label: const Text('Nova Reunião'),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // Filters
          Row(
            children: [
              Expanded(
                flex: 2,
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Buscar por cliente...',
                    prefixIcon: const Icon(Icons.search),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                  ),
                  onChanged: (value) => setState(() => _searchQuery = value),
                ),
              ),
              const SizedBox(width: 16),
              SizedBox(
                width: 180,
                child: DropdownButtonFormField<MeetingStatus?>(
                  value: _statusFilter,
                  decoration: InputDecoration(
                    labelText: 'Status',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                  ),
                  items: [
                    const DropdownMenuItem(value: null, child: Text('Todos')),
                    ...MeetingStatus.values.map(
                      (s) => DropdownMenuItem(
                        value: s,
                        child: Text(_getMeetingStatusLabel(s)),
                      ),
                    ),
                  ],
                  onChanged: (value) => setState(() => _statusFilter = value),
                ),
              ),
              const SizedBox(width: 16),
              SizedBox(
                width: 180,
                child: DropdownButtonFormField<MeetingType?>(
                  value: _typeFilter,
                  decoration: InputDecoration(
                    labelText: 'Tipo',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                  ),
                  items: [
                    const DropdownMenuItem(value: null, child: Text('Todos')),
                    ...MeetingType.values.map(
                      (t) => DropdownMenuItem(
                        value: t,
                        child: Text(_getMeetingTypeLabel(t)),
                      ),
                    ),
                  ],
                  onChanged: (value) => setState(() => _typeFilter = value),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // Content
          Expanded(
            child: brokerMeetings.isEmpty
                ? _buildEmptyState()
                : _buildDataTable(context, brokerMeetings, meetings),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.event_outlined, size: 80, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            'Nenhuma reunião encontrada',
            style: TextStyle(fontSize: 18, color: Colors.grey[600]),
          ),
          const SizedBox(height: 8),
          Text(
            'Clique em "Nova Reunião" para agendar',
            style: TextStyle(color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  Widget _buildDataTable(
    BuildContext context,
    List<Meeting> brokerMeetings,
    MeetingsProvider meetings,
  ) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          // Table Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(12),
              ),
            ),
            child: Row(
              children: [
                Expanded(flex: 2, child: Text('Cliente', style: _headerStyle)),
                Expanded(
                  flex: 2,
                  child: Text('Data/Hora', style: _headerStyle),
                ),
                Expanded(flex: 2, child: Text('Tipo', style: _headerStyle)),
                Expanded(
                  flex: 3,
                  child: Text('Observações', style: _headerStyle),
                ),
                Expanded(flex: 2, child: Text('Status', style: _headerStyle)),
                SizedBox(width: 120, child: Text('Ações', style: _headerStyle)),
              ],
            ),
          ),
          const Divider(height: 1),
          // Table Body
          Expanded(
            child: ListView.separated(
              itemCount: brokerMeetings.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final meeting = brokerMeetings[index];
                return _buildMeetingRow(context, meeting, meetings);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMeetingRow(
    BuildContext context,
    Meeting meeting,
    MeetingsProvider meetings,
  ) {
    final isUpcoming =
        meeting.meetingDate.isAfter(DateTime.now()) &&
        meeting.status == MeetingStatus.agendada;

    return InkWell(
      onTap: () => _showMeetingDialog(context, meeting),
      child: Container(
        color: isUpcoming ? Colors.blue.withOpacity(0.03) : null,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Row(
          children: [
            // Client
            Expanded(
              flex: 2,
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.purple.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.person,
                      color: Colors.purple,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          meeting.title,
                          style: const TextStyle(fontWeight: FontWeight.w500),
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (meeting.clientName != null)
                          Text(
                            meeting.clientName!,
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            // Date/Time
            Expanded(
              flex: 2,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _formatDate(meeting.meetingDate),
                    style: const TextStyle(fontWeight: FontWeight.w500),
                  ),
                  Text(
                    DateFormat('HH:mm').format(meeting.meetingDate),
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
            // Type
            Expanded(
              flex: 2,
              child: Row(
                children: [
                  Icon(
                    _getMeetingTypeIcon(meeting.meetingType),
                    size: 18,
                    color: Colors.grey[600],
                  ),
                  const SizedBox(width: 8),
                  Text(
                    meeting.meetingTypeLabel,
                    style: TextStyle(color: Colors.grey[700]),
                  ),
                ],
              ),
            ),
            // Description
            Expanded(
              flex: 3,
              child: Text(
                meeting.description ?? '-',
                style: TextStyle(color: Colors.grey[600], fontSize: 13),
                overflow: TextOverflow.ellipsis,
                maxLines: 2,
              ),
            ),
            // Status
            Expanded(
              flex: 2,
              child: _StatusBadge(
                label: meeting.statusLabel,
                color: _getMeetingStatusColor(meeting.status),
              ),
            ),
            // Actions
            SizedBox(
              width: 120,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (meeting.status == MeetingStatus.agendada) ...[
                    IconButton(
                      icon: const Icon(Icons.check_circle_outline),
                      tooltip: 'Marcar como realizada',
                      color: Colors.green,
                      onPressed: () => _updateMeetingStatus(
                        context,
                        meeting,
                        MeetingStatus.realizada,
                        meetings,
                      ),
                    ),
                  ],
                  IconButton(
                    icon: const Icon(Icons.edit_outlined),
                    tooltip: 'Editar',
                    onPressed: () => _showMeetingDialog(context, meeting),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline),
                    tooltip: 'Excluir',
                    color: Colors.red[400],
                    onPressed: () => _confirmDelete(context, meeting, meetings),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  TextStyle get _headerStyle => TextStyle(
    fontWeight: FontWeight.w600,
    color: Colors.grey[700],
    fontSize: 13,
  );

  String _getMeetingStatusLabel(MeetingStatus status) {
    switch (status) {
      case MeetingStatus.agendada:
        return 'Agendada';
      case MeetingStatus.realizada:
        return 'Realizada';
      case MeetingStatus.cancelada:
        return 'Cancelada';
    }
  }

  String _getMeetingTypeLabel(MeetingType type) {
    switch (type) {
      case MeetingType.presencial:
        return 'Presencial';
      case MeetingType.online:
        return 'Online';
      case MeetingType.telefone:
        return 'Telefone';
    }
  }

  Color _getMeetingStatusColor(MeetingStatus status) {
    switch (status) {
      case MeetingStatus.agendada:
        return Colors.blue;
      case MeetingStatus.realizada:
        return Colors.green;
      case MeetingStatus.cancelada:
        return Colors.red;
    }
  }

  IconData _getMeetingTypeIcon(MeetingType type) {
    switch (type) {
      case MeetingType.presencial:
        return Icons.person;
      case MeetingType.online:
        return Icons.videocam;
      case MeetingType.telefone:
        return Icons.phone;
    }
  }

  void _updateMeetingStatus(
    BuildContext context,
    Meeting meeting,
    MeetingStatus newStatus,
    MeetingsProvider provider,
  ) async {
    final updated = meeting.copyWith(status: newStatus);
    await provider.updateMeeting(updated);
  }

  void _showMeetingDialog(BuildContext context, Meeting? meeting) {
    final isEditing = meeting != null;
    final titleController = TextEditingController(text: meeting?.title ?? '');
    final clientController = TextEditingController(
      text: meeting?.clientName ?? '',
    );
    final descriptionController = TextEditingController(
      text: meeting?.description ?? '',
    );
    final summaryController = TextEditingController(
      text: meeting?.summary ?? '',
    );
    var meetingType = meeting?.meetingType ?? MeetingType.presencial;
    var status = meeting?.status ?? MeetingStatus.agendada;
    var meetingDate = meeting?.meetingDate ?? DateTime.now();

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text(isEditing ? 'Editar Reunião' : 'Nova Reunião'),
          content: SizedBox(
            width: 600,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: titleController,
                    decoration: const InputDecoration(
                      labelText: 'Título *',
                      prefixIcon: Icon(Icons.title),
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: clientController,
                    decoration: const InputDecoration(
                      labelText: 'Nome do Cliente',
                      prefixIcon: Icon(Icons.person_outline),
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<MeetingType>(
                          value: meetingType,
                          decoration: const InputDecoration(
                            labelText: 'Tipo de Reunião',
                            prefixIcon: Icon(Icons.category_outlined),
                            border: OutlineInputBorder(),
                          ),
                          items: MeetingType.values
                              .map(
                                (t) => DropdownMenuItem(
                                  value: t,
                                  child: Text(_getMeetingTypeLabel(t)),
                                ),
                              )
                              .toList(),
                          onChanged: (value) {
                            if (value != null) {
                              setDialogState(() => meetingType = value);
                            }
                          },
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: DropdownButtonFormField<MeetingStatus>(
                          value: status,
                          decoration: const InputDecoration(
                            labelText: 'Status',
                            prefixIcon: Icon(Icons.flag_outlined),
                            border: OutlineInputBorder(),
                          ),
                          items: MeetingStatus.values
                              .map(
                                (s) => DropdownMenuItem(
                                  value: s,
                                  child: Text(_getMeetingStatusLabel(s)),
                                ),
                              )
                              .toList(),
                          onChanged: (value) {
                            if (value != null) {
                              setDialogState(() => status = value);
                            }
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.calendar_today),
                    title: const Text('Data e Hora da Reunião'),
                    subtitle: Text(_formatDateTime(meetingDate)),
                    trailing: OutlinedButton(
                      onPressed: () async {
                        final date = await showDatePicker(
                          context: context,
                          initialDate: meetingDate,
                          firstDate: DateTime(2020),
                          lastDate: DateTime(2030),
                        );
                        if (date != null && context.mounted) {
                          final time = await showTimePicker(
                            context: context,
                            initialTime: TimeOfDay.fromDateTime(meetingDate),
                          );
                          if (time != null) {
                            setDialogState(() {
                              meetingDate = DateTime(
                                date.year,
                                date.month,
                                date.day,
                                time.hour,
                                time.minute,
                              );
                            });
                          }
                        }
                      },
                      child: const Text('Alterar'),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: descriptionController,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'Descrição',
                      prefixIcon: Icon(Icons.notes_outlined),
                      border: OutlineInputBorder(),
                      alignLabelWithHint: true,
                    ),
                  ),
                  if (isEditing && status == MeetingStatus.realizada) ...[
                    const SizedBox(height: 16),
                    TextField(
                      controller: summaryController,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Resumo da Reunião',
                        prefixIcon: Icon(Icons.summarize_outlined),
                        border: OutlineInputBorder(),
                        alignLabelWithHint: true,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancelar'),
            ),
            FilledButton(
              onPressed: () async {
                if (titleController.text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Título é obrigatório')),
                  );
                  return;
                }

                final provider = context.read<MeetingsProvider>();
                final auth = context.read<AuthProvider>();

                final newMeeting = Meeting(
                  id: meeting?.id ?? '',
                  userId: auth.userId ?? '',
                  brokerId: widget.brokerId,
                  title: titleController.text,
                  clientName: clientController.text.isEmpty
                      ? null
                      : clientController.text,
                  description: descriptionController.text.isEmpty
                      ? null
                      : descriptionController.text,
                  meetingDate: meetingDate,
                  meetingType: meetingType,
                  status: status,
                  summary: summaryController.text.isEmpty
                      ? null
                      : summaryController.text,
                );

                if (isEditing) {
                  await provider.updateMeeting(newMeeting);
                } else {
                  await provider.createMeeting(newMeeting);
                }

                if (context.mounted) Navigator.of(context).pop();
              },
              child: Text(isEditing ? 'Salvar' : 'Criar'),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmDelete(
    BuildContext context,
    Meeting meeting,
    MeetingsProvider meetings,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar Exclusão'),
        content: Text('Deseja realmente excluir a reunião "${meeting.title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () async {
              await meetings.deleteMeeting(meeting.id);
              if (context.mounted) Navigator.of(context).pop();
            },
            child: const Text('Excluir'),
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// EXPENSES TAB
// ============================================================================

class _ExpensesTab extends StatefulWidget {
  final String brokerId;

  const _ExpensesTab({required this.brokerId});

  @override
  State<_ExpensesTab> createState() => _ExpensesTabState();
}

class _ExpensesTabState extends State<_ExpensesTab> {
  String _searchQuery = '';
  String? _categoryFilter;
  DateTimeRange? _dateFilter;

  @override
  void initState() {
    super.initState();
    // Ensure expenses are loaded when tab is first opened
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final expenses = context.read<ExpensesProvider>();
      if (expenses.expenses.isEmpty && !expenses.isLoading) {
        print('[_ExpensesTab] Expenses empty, triggering fetchExpenses()');
        expenses.fetchExpenses();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final expenses = context.watch<ExpensesProvider>();
    var brokerExpenses = expenses.getExpensesByBrokerId(widget.brokerId);

    // Get unique categories for filter
    final categories =
        brokerExpenses.map((e) => e.category ?? 'Outros').toSet().toList()
          ..sort();

    // Apply filters
    if (_searchQuery.isNotEmpty) {
      brokerExpenses = brokerExpenses
          .where(
            (e) =>
                e.description.toLowerCase().contains(
                  _searchQuery.toLowerCase(),
                ) ||
                (e.category?.toLowerCase().contains(
                      _searchQuery.toLowerCase(),
                    ) ??
                    false),
          )
          .toList();
    }
    if (_categoryFilter != null) {
      brokerExpenses = brokerExpenses
          .where((e) => (e.category ?? 'Outros') == _categoryFilter)
          .toList();
    }
    if (_dateFilter != null) {
      brokerExpenses = brokerExpenses
          .where(
            (e) =>
                e.expenseDate.isAfter(
                  _dateFilter!.start.subtract(const Duration(days: 1)),
                ) &&
                e.expenseDate.isBefore(
                  _dateFilter!.end.add(const Duration(days: 1)),
                ),
          )
          .toList();
    }

    // Sort by date descending
    brokerExpenses.sort((a, b) => b.expenseDate.compareTo(a.expenseDate));

    if (expenses.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    // Calculate totals
    final totalExpenses = brokerExpenses.fold(0.0, (sum, e) => sum + e.amount);
    final categoryTotals = <String, double>{};
    for (final expense in brokerExpenses) {
      final cat = expense.category ?? 'Outros';
      categoryTotals[cat] = (categoryTotals[cat] ?? 0) + expense.amount;
    }

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Summary Cards
          Row(
            children: [
              _MiniStatCard(
                icon: Icons.receipt_long,
                label: 'Total de Despesas',
                value: '${brokerExpenses.length}',
                color: Colors.red,
              ),
              const SizedBox(width: 16),
              _MiniStatCard(
                icon: Icons.attach_money,
                label: 'Valor Total',
                value: _formatCurrency(totalExpenses),
                color: Colors.orange,
              ),
              const SizedBox(width: 16),
              _MiniStatCard(
                icon: Icons.category,
                label: 'Categorias',
                value: '${categories.length}',
                color: Colors.purple,
              ),
              const Spacer(),
              FilledButton.icon(
                onPressed: () => _showExpenseDialog(context, null),
                icon: const Icon(Icons.add),
                label: const Text('Nova Despesa'),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // Filters
          Row(
            children: [
              Expanded(
                flex: 2,
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Buscar por descrição ou categoria...',
                    prefixIcon: const Icon(Icons.search),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                  ),
                  onChanged: (value) => setState(() => _searchQuery = value),
                ),
              ),
              const SizedBox(width: 16),
              SizedBox(
                width: 180,
                child: DropdownButtonFormField<String?>(
                  value: _categoryFilter,
                  decoration: InputDecoration(
                    labelText: 'Categoria',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                  ),
                  items: [
                    const DropdownMenuItem(value: null, child: Text('Todas')),
                    ...categories.map(
                      (c) => DropdownMenuItem(value: c, child: Text(c)),
                    ),
                  ],
                  onChanged: (value) => setState(() => _categoryFilter = value),
                ),
              ),
              const SizedBox(width: 16),
              OutlinedButton.icon(
                onPressed: () async {
                  final range = await showDateRangePicker(
                    context: context,
                    firstDate: DateTime(2020),
                    lastDate: DateTime.now(),
                    initialDateRange: _dateFilter,
                  );
                  if (range != null) {
                    setState(() => _dateFilter = range);
                  }
                },
                icon: const Icon(Icons.calendar_month),
                label: Text(
                  _dateFilter != null
                      ? '${_formatDate(_dateFilter!.start)} - ${_formatDate(_dateFilter!.end)}'
                      : 'Filtrar por data',
                ),
              ),
              if (_dateFilter != null) ...[
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.clear),
                  tooltip: 'Limpar filtro de data',
                  onPressed: () => setState(() => _dateFilter = null),
                ),
              ],
            ],
          ),
          const SizedBox(height: 20),
          // Content
          Expanded(
            child: brokerExpenses.isEmpty
                ? _buildEmptyState()
                : Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Main Table
                      Expanded(
                        flex: 3,
                        child: _buildDataTable(
                          context,
                          brokerExpenses,
                          expenses,
                        ),
                      ),
                      const SizedBox(width: 24),
                      // Category Breakdown
                      SizedBox(
                        width: 280,
                        child: Card(
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: BorderSide(color: Colors.grey.shade200),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      Icons.pie_chart,
                                      color: Colors.grey[600],
                                      size: 20,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Por Categoria',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: Colors.grey[700],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 16),
                                ...categoryTotals.entries.map(
                                  (entry) => _CategoryItem(
                                    category: entry.key,
                                    amount: entry.value,
                                    percentage: totalExpenses > 0
                                        ? (entry.value / totalExpenses * 100)
                                        : 0,
                                    color: _getCategoryColor(entry.key),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.receipt_outlined, size: 80, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(
            'Nenhuma despesa encontrada',
            style: TextStyle(fontSize: 18, color: Colors.grey[600]),
          ),
          const SizedBox(height: 8),
          Text(
            'Clique em "Nova Despesa" para adicionar',
            style: TextStyle(color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  Widget _buildDataTable(
    BuildContext context,
    List<Expense> brokerExpenses,
    ExpensesProvider expenses,
  ) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          // Table Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(12),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  flex: 3,
                  child: Text('Descrição', style: _headerStyle),
                ),
                Expanded(
                  flex: 2,
                  child: Text('Categoria', style: _headerStyle),
                ),
                Expanded(flex: 2, child: Text('Valor', style: _headerStyle)),
                Expanded(flex: 2, child: Text('Data', style: _headerStyle)),
                SizedBox(width: 120, child: Text('Ações', style: _headerStyle)),
              ],
            ),
          ),
          const Divider(height: 1),
          // Table Body
          Expanded(
            child: ListView.separated(
              itemCount: brokerExpenses.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final expense = brokerExpenses[index];
                return _buildExpenseRow(context, expense, expenses);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildExpenseRow(
    BuildContext context,
    Expense expense,
    ExpensesProvider expenses,
  ) {
    return InkWell(
      onTap: () => _showExpenseDialog(context, expense),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Row(
          children: [
            // Description
            Expanded(
              flex: 3,
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: _getCategoryColor(
                        expense.category ?? 'Outros',
                      ).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      _getCategoryIcon(expense.category ?? 'Outros'),
                      color: _getCategoryColor(expense.category ?? 'Outros'),
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      expense.description,
                      style: const TextStyle(fontWeight: FontWeight.w500),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
            // Category
            Expanded(
              flex: 2,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: _getCategoryColor(
                    expense.category ?? 'Outros',
                  ).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  expense.category ?? 'Outros',
                  style: TextStyle(
                    color: _getCategoryColor(expense.category ?? 'Outros'),
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
            // Value
            Expanded(
              flex: 2,
              child: Text(
                _formatCurrency(expense.amount),
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.red[700],
                ),
              ),
            ),
            // Date
            Expanded(
              flex: 2,
              child: Text(
                _formatDate(expense.expenseDate),
                style: TextStyle(color: Colors.grey[600]),
              ),
            ),
            // Actions
            SizedBox(
              width: 120,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  IconButton(
                    icon: const Icon(Icons.edit_outlined),
                    tooltip: 'Editar',
                    onPressed: () => _showExpenseDialog(context, expense),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline),
                    tooltip: 'Excluir',
                    color: Colors.red[400],
                    onPressed: () => _confirmDelete(context, expense, expenses),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  TextStyle get _headerStyle => TextStyle(
    fontWeight: FontWeight.w600,
    color: Colors.grey[700],
    fontSize: 13,
  );

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'transporte':
        return Colors.blue;
      case 'alimentação':
        return Colors.orange;
      case 'escritório':
        return Colors.purple;
      case 'marketing':
        return Colors.pink;
      case 'manutenção':
        return Colors.brown;
      default:
        return Colors.grey;
    }
  }

  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'transporte':
        return Icons.directions_car;
      case 'alimentação':
        return Icons.restaurant;
      case 'escritório':
        return Icons.work;
      case 'marketing':
        return Icons.campaign;
      case 'manutenção':
        return Icons.build;
      default:
        return Icons.receipt;
    }
  }

  void _showExpenseDialog(BuildContext context, Expense? expense) {
    final isEditing = expense != null;
    final descController = TextEditingController(
      text: expense?.description ?? '',
    );
    final amountController = TextEditingController(
      text: expense?.amount.toStringAsFixed(2) ?? '',
    );
    var category = expense?.category ?? 'Outros';
    var expenseDate = expense?.expenseDate ?? DateTime.now();

    final categories = [
      'Transporte',
      'Alimentação',
      'Escritório',
      'Marketing',
      'Manutenção',
      'Outros',
    ];

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text(isEditing ? 'Editar Despesa' : 'Nova Despesa'),
          content: SizedBox(
            width: 500,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: descController,
                    decoration: const InputDecoration(
                      labelText: 'Descrição *',
                      prefixIcon: Icon(Icons.description_outlined),
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: amountController,
                          keyboardType: const TextInputType.numberWithOptions(
                            decimal: true,
                          ),
                          decoration: const InputDecoration(
                            labelText: 'Valor *',
                            prefixIcon: Icon(Icons.attach_money),
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: category,
                          decoration: const InputDecoration(
                            labelText: 'Categoria',
                            prefixIcon: Icon(Icons.category_outlined),
                            border: OutlineInputBorder(),
                          ),
                          items: categories
                              .map(
                                (c) =>
                                    DropdownMenuItem(value: c, child: Text(c)),
                              )
                              .toList(),
                          onChanged: (value) {
                            if (value != null) {
                              setDialogState(() => category = value);
                            }
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.calendar_today),
                    title: const Text('Data da Despesa'),
                    subtitle: Text(_formatDate(expenseDate)),
                    trailing: OutlinedButton(
                      onPressed: () async {
                        final date = await showDatePicker(
                          context: context,
                          initialDate: expenseDate,
                          firstDate: DateTime(2020),
                          lastDate: DateTime.now(),
                        );
                        if (date != null) {
                          setDialogState(() => expenseDate = date);
                        }
                      },
                      child: const Text('Alterar'),
                    ),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancelar'),
            ),
            FilledButton(
              onPressed: () async {
                if (descController.text.isEmpty ||
                    amountController.text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Preencha todos os campos obrigatórios'),
                    ),
                  );
                  return;
                }

                final provider = context.read<ExpensesProvider>();
                final auth = context.read<AuthProvider>();

                final newExpense = Expense(
                  id: expense?.id ?? '',
                  userId: auth.userId ?? '',
                  brokerId: widget.brokerId,
                  description: descController.text,
                  amount: double.tryParse(amountController.text) ?? 0,
                  expenseDate: expenseDate,
                  category: category,
                );

                if (isEditing) {
                  await provider.updateExpense(newExpense);
                } else {
                  await provider.createExpense(newExpense);
                }

                if (context.mounted) Navigator.of(context).pop();
              },
              child: Text(isEditing ? 'Salvar' : 'Criar'),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmDelete(
    BuildContext context,
    Expense expense,
    ExpensesProvider expenses,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar Exclusão'),
        content: Text(
          'Deseja realmente excluir a despesa "${expense.description}"?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () async {
              await expenses.deleteExpense(expense.id);
              if (context.mounted) Navigator.of(context).pop();
            },
            child: const Text('Excluir'),
          ),
        ],
      ),
    );
  }
}

class _CategoryItem extends StatelessWidget {
  final String category;
  final double amount;
  final double percentage;
  final Color color;

  const _CategoryItem({
    required this.category,
    required this.amount,
    required this.percentage,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(category, style: const TextStyle(fontSize: 13)),
              ),
              Text(
                '${percentage.toStringAsFixed(1)}%',
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: percentage / 100,
                    backgroundColor: Colors.grey[200],
                    valueColor: AlwaysStoppedAnimation<Color>(color),
                    minHeight: 6,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Text(
                _formatCurrency(amount),
                style: const TextStyle(
                  fontWeight: FontWeight.w500,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
