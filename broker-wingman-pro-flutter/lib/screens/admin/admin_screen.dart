import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/admin_provider.dart';
import '../../models/user.dart';

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen>
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
    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(48),
        child: AppBar(
          automaticallyImplyLeading: false,
          flexibleSpace: TabBar(
            controller: _tabController,
            tabs: const [
              Tab(text: 'Usuários'),
              Tab(text: 'Roles'),
              Tab(text: 'Configurações'),
            ],
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [_UsersTab(), _RolesTab(), _SettingsTab()],
      ),
    );
  }
}

class _UsersTab extends StatelessWidget {
  const _UsersTab();

  @override
  Widget build(BuildContext context) {
    final admin = context.watch<AdminProvider>();

    if (admin.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (admin.users.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.people_outline, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'Nenhum usuário encontrado',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => admin.fetchUsers(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: admin.users.length,
        itemBuilder: (context, index) {
          final user = admin.users[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: Theme.of(context).colorScheme.primary,
                child: Text(
                  user.name.isNotEmpty
                      ? user.name.substring(0, 1).toUpperCase()
                      : 'U',
                  style: const TextStyle(color: Colors.white),
                ),
              ),
              title: Text(user.name.isNotEmpty ? user.name : 'Sem nome'),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(user.email),
                  const SizedBox(height: 4),
                  _buildRoleChip(user.role),
                ],
              ),
              trailing: PopupMenuButton(
                itemBuilder: (context) => UserRole.values
                    .map(
                      (role) => PopupMenuItem(
                        value: role,
                        child: Row(
                          children: [
                            Icon(
                              user.role == role
                                  ? Icons.check
                                  : Icons.person_outline,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Text(_getRoleLabel(role)),
                          ],
                        ),
                      ),
                    )
                    .toList(),
                onSelected: (role) {
                  admin.updateUserRole(user.id, role);
                },
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildRoleChip(UserRole role) {
    Color color;
    switch (role) {
      case UserRole.admin:
        color = Colors.red;
        break;
      case UserRole.manager:
        color = Colors.blue;
        break;
      case UserRole.broker:
        color = Colors.green;
        break;
      case UserRole.viewer:
        color = Colors.grey;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        _getRoleLabel(role),
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  String _getRoleLabel(UserRole role) {
    switch (role) {
      case UserRole.admin:
        return 'Admin';
      case UserRole.manager:
        return 'Gerente';
      case UserRole.broker:
        return 'Corretor';
      case UserRole.viewer:
        return 'Visualizador';
    }
  }
}

class _RolesTab extends StatelessWidget {
  const _RolesTab();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildRoleCard(
          context,
          role: UserRole.admin,
          title: 'Administrador',
          description:
              'Acesso total ao sistema, pode gerenciar usuários e configurações.',
          permissions: [
            'Gerenciar usuários',
            'Gerenciar corretores',
            'Acessar relatórios',
            'Configurar sistema',
            'Todas as permissões',
          ],
        ),
        const SizedBox(height: 12),
        _buildRoleCard(
          context,
          role: UserRole.manager,
          title: 'Gerente',
          description: 'Gerencia equipes de corretores e acessa relatórios.',
          permissions: [
            'Gerenciar corretores',
            'Visualizar relatórios',
            'Atribuir tarefas',
            'Definir metas',
          ],
        ),
        const SizedBox(height: 12),
        _buildRoleCard(
          context,
          role: UserRole.broker,
          title: 'Corretor',
          description: 'Acesso às suas próprias vendas, tarefas e metas.',
          permissions: [
            'Visualizar próprias vendas',
            'Gerenciar próprias tarefas',
            'Visualizar próprias metas',
            'Atualizar perfil',
          ],
        ),
        const SizedBox(height: 12),
        _buildRoleCard(
          context,
          role: UserRole.viewer,
          title: 'Visualizador',
          description: 'Apenas visualização, sem permissão de edição.',
          permissions: [
            'Visualizar dashboard',
            'Visualizar corretores',
            'Visualizar relatórios públicos',
          ],
        ),
      ],
    );
  }

  Widget _buildRoleCard(
    BuildContext context, {
    required UserRole role,
    required String title,
    required String description,
    required List<String> permissions,
  }) {
    Color color;
    switch (role) {
      case UserRole.admin:
        color = Colors.red;
        break;
      case UserRole.manager:
        color = Colors.blue;
        break;
      case UserRole.broker:
        color = Colors.green;
        break;
      case UserRole.viewer:
        color = Colors.grey;
        break;
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Icons.security, color: color),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        description,
                        style: TextStyle(color: Colors.grey[600], fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            Text('Permissões:', style: Theme.of(context).textTheme.labelLarge),
            const SizedBox(height: 8),
            ...permissions.map(
              (p) => Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  children: [
                    Icon(Icons.check, size: 16, color: color),
                    const SizedBox(width: 8),
                    Text(p),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SettingsTab extends StatelessWidget {
  const _SettingsTab();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.business),
                title: const Text('Informações da Empresa'),
                subtitle: const Text('Nome, logo, contato'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  // Navigate to company settings
                },
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.notifications),
                title: const Text('Notificações'),
                subtitle: const Text('Configurar alertas e lembretes'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  // Navigate to notification settings
                },
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.palette),
                title: const Text('Aparência'),
                subtitle: const Text('Tema, cores, preferências'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  // Navigate to appearance settings
                },
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.storage),
                title: const Text('Banco de Dados'),
                subtitle: const Text('Configuração PostgreSQL'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  // Navigate to database settings
                },
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Card(
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.backup),
                title: const Text('Backup'),
                subtitle: const Text('Exportar dados'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  // Navigate to backup
                },
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.restore),
                title: const Text('Restaurar'),
                subtitle: const Text('Importar dados'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  // Navigate to restore
                },
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Card(
          child: ListTile(
            leading: const Icon(Icons.info),
            title: const Text('Sobre'),
            subtitle: const Text('Versão 1.0.0'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              showAboutDialog(
                context: context,
                applicationName: 'Broker Wingman',
                applicationVersion: '1.0.0',
                applicationLegalese: '© 2024 Broker Wingman',
              );
            },
          ),
        ),
      ],
    );
  }
}
