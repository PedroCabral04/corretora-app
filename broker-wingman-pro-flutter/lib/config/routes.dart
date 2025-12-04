import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/auth/forgot_password_screen.dart';
import '../screens/auth/reset_password_screen.dart';
import '../screens/dashboard/dashboard_screen.dart';
import '../screens/brokers/brokers_screen.dart';
import '../screens/brokers/broker_details_screen.dart';
import '../screens/tasks/tasks_screen.dart';
import '../screens/agenda/agenda_screen.dart';
import '../screens/goals/goals_screen.dart';
import '../screens/admin/admin_screen.dart';
import '../screens/shell_screen.dart';

class AppRouter {
  static final _rootNavigatorKey = GlobalKey<NavigatorState>();
  static final _shellNavigatorKey = GlobalKey<NavigatorState>();

  static final router = GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/',
    redirect: (context, state) {
      final auth = context.read<AuthProvider>();

      // Show splash/loading while checking auth
      if (auth.isLoading) {
        // Stay on current route or go to splash
        if (state.matchedLocation != '/') {
          return '/';
        }
        return null;
      }

      final isLoggedIn = auth.isAuthenticated;
      final isSplash = state.matchedLocation == '/';
      final isAuthRoute =
          state.matchedLocation == '/login' ||
          state.matchedLocation == '/register' ||
          state.matchedLocation == '/forgot-password' ||
          state.matchedLocation.startsWith('/reset-password');

      // After loading, redirect from splash
      if (isSplash) {
        return isLoggedIn ? '/dashboard' : '/login';
      }

      if (!isLoggedIn && !isAuthRoute) {
        return '/login';
      }

      if (isLoggedIn && isAuthRoute) {
        return '/dashboard';
      }

      return null;
    },
    routes: [
      // Splash/Loading route
      GoRoute(path: '/', builder: (context, state) => const _SplashScreen()),
      // Auth routes (no shell)
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/reset-password',
        builder: (context, state) =>
            ResetPasswordScreen(token: state.uri.queryParameters['token']),
      ),

      // Main app routes (with shell/navigation)
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => ShellScreen(child: child),
        routes: [
          GoRoute(
            path: '/dashboard',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: DashboardScreen()),
          ),
          GoRoute(
            path: '/brokers',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: BrokersScreen()),
          ),
          GoRoute(
            path: '/brokers/:brokerId',
            builder: (context, state) => BrokerDetailsScreen(
              brokerId: state.pathParameters['brokerId']!,
            ),
          ),
          GoRoute(
            path: '/tasks',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: TasksScreen()),
          ),
          GoRoute(
            path: '/agenda',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: AgendaScreen()),
          ),
          GoRoute(
            path: '/goals',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: GoalsScreen()),
          ),
          GoRoute(
            path: '/admin',
            pageBuilder: (context, state) =>
                const NoTransitionPage(child: AdminScreen()),
          ),
        ],
      ),
    ],
  );
}

/// Splash screen shown while checking authentication
class _SplashScreen extends StatefulWidget {
  const _SplashScreen();

  @override
  State<_SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<_SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuthAndNavigate();
  }

  Future<void> _checkAuthAndNavigate() async {
    final auth = context.read<AuthProvider>();

    // Wait for auth to finish loading
    if (auth.isLoading) {
      auth.addListener(_onAuthChanged);
    } else {
      _navigate(auth);
    }
  }

  void _onAuthChanged() {
    final auth = context.read<AuthProvider>();
    if (!auth.isLoading) {
      auth.removeListener(_onAuthChanged);
      _navigate(auth);
    }
  }

  void _navigate(AuthProvider auth) {
    if (!mounted) return;
    if (auth.isAuthenticated) {
      context.go('/dashboard');
    } else {
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: CircularProgressIndicator()));
  }
}
