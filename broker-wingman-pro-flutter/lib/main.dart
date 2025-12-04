import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'config/theme.dart';
import 'config/routes.dart';
import 'providers/auth_provider.dart';
import 'providers/brokers_provider.dart';
import 'providers/clients_provider.dart';
import 'providers/sales_provider.dart';
import 'providers/listings_provider.dart';
import 'providers/tasks_provider.dart';
import 'providers/events_provider.dart';
import 'providers/meetings_provider.dart';
import 'providers/expenses_provider.dart';
import 'providers/goals_provider.dart';
import 'providers/performance_provider.dart';
import 'providers/notifications_provider.dart';
import 'providers/admin_provider.dart';
import 'providers/theme_provider.dart';
import 'services/api_client.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('pt_BR', null);

  // Initialize API client to load saved tokens before app starts
  await apiClient.init();

  runApp(const CorretoraApp());
}

class CorretoraApp extends StatelessWidget {
  const CorretoraApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProxyProvider<AuthProvider, BrokersProvider>(
          create: (_) => BrokersProvider(),
          update: (_, auth, brokers) => brokers!..updateAuth(auth),
        ),
        ChangeNotifierProxyProvider<AuthProvider, ClientsProvider>(
          create: (_) => ClientsProvider(),
          update: (_, auth, clients) => clients!..updateAuth(auth),
        ),
        ChangeNotifierProxyProvider<AuthProvider, SalesProvider>(
          create: (_) => SalesProvider(),
          update: (_, auth, sales) => sales!..updateAuth(auth),
        ),
        ChangeNotifierProxyProvider<AuthProvider, ListingsProvider>(
          create: (_) => ListingsProvider(),
          update: (_, auth, listings) => listings!..updateAuth(auth),
        ),
        ChangeNotifierProxyProvider<AuthProvider, TasksProvider>(
          create: (_) => TasksProvider(),
          update: (_, auth, tasks) => tasks!..updateAuth(auth),
        ),
        ChangeNotifierProxyProvider<AuthProvider, EventsProvider>(
          create: (_) => EventsProvider(),
          update: (_, auth, events) => events!..updateAuth(auth),
        ),
        ChangeNotifierProxyProvider<AuthProvider, MeetingsProvider>(
          create: (_) => MeetingsProvider(),
          update: (_, auth, meetings) => meetings!..updateAuth(auth),
        ),
        ChangeNotifierProxyProvider<AuthProvider, ExpensesProvider>(
          create: (_) => ExpensesProvider(),
          update: (_, auth, expenses) => expenses!..updateAuth(auth),
        ),
        ChangeNotifierProxyProvider<AuthProvider, GoalsProvider>(
          create: (_) => GoalsProvider(),
          update: (_, auth, goals) => goals!..updateAuth(auth),
        ),
        ChangeNotifierProxyProvider<AuthProvider, PerformanceProvider>(
          create: (_) => PerformanceProvider(),
          update: (_, auth, performance) => performance!..updateAuth(auth),
        ),
        ChangeNotifierProxyProvider<AuthProvider, NotificationsProvider>(
          create: (_) => NotificationsProvider(),
          update: (_, auth, notifications) => notifications!..updateAuth(auth),
        ),
        ChangeNotifierProvider(create: (_) => AdminProvider()),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, _) {
          return MaterialApp.router(
            title: 'Corretora App',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: themeProvider.themeMode,
            routerConfig: AppRouter.router,
            locale: const Locale('pt', 'BR'),
          );
        },
      ),
    );
  }
}
