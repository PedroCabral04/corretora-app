import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/api_client.dart';
import '../config/api_config.dart';

class AuthProvider extends ChangeNotifier {
  User? _user;
  bool _isLoading = false;
  String? _error;
  bool _isAuthenticated = false;

  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _isAuthenticated;
  String? get userId => _user?.id;
  UserRole? get role => _user?.role;

  AuthProvider() {
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    _isLoading = true;
    notifyListeners();

    try {
      // Initialize the API client to load saved tokens
      await authService.init();

      print(
        '[AuthProvider] Token check - isAuthenticated: ${authService.isAuthenticated}',
      );

      if (authService.isAuthenticated) {
        // Try to get current user from API
        try {
          print('[AuthProvider] Fetching current user...');
          _user = await authService.getCurrentUser();
          _isAuthenticated = true;
          print('[AuthProvider] User loaded: ${_user?.email}');

          // Update local storage
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('user', 'authenticated');
          await prefs.setString('user_id', _user!.id);
          await prefs.setString('user_email', _user!.email);
          await prefs.setString('user_name', _user!.name);
          await prefs.setString('user_role', _user!.role.name);
        } on ApiException catch (e) {
          // Token expired or invalid
          if (e.isUnauthorized) {
            await authService.logout();
            _isAuthenticated = false;
          } else if (e.isConnectionError) {
            // No connection - try to use cached user data
            final prefs = await SharedPreferences.getInstance();
            final userData = prefs.getString('user');

            if (userData != null) {
              _isAuthenticated = true;
              _user = User(
                id: prefs.getString('user_id') ?? '',
                email: prefs.getString('user_email') ?? '',
                name: prefs.getString('user_name') ?? '',
                role: _parseRole(prefs.getString('user_role')),
              );
            }
            _error = e.message;
          }
        }
      }
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  UserRole _parseRole(String? role) {
    switch (role) {
      case 'admin':
        return UserRole.admin;
      case 'manager':
        return UserRole.manager;
      case 'viewer':
        return UserRole.viewer;
      default:
        return UserRole.broker;
    }
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await authService.login(email, password);

      _user = response.user;
      _isAuthenticated = true;

      // Save to local storage for offline access
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user', 'authenticated');
      await prefs.setString('user_id', _user!.id);
      await prefs.setString('user_email', _user!.email);
      await prefs.setString('user_name', _user!.name);
      await prefs.setString('user_role', _user!.role.name);

      _isLoading = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(
    String name,
    String email,
    String password,
    UserRole role,
  ) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      if (name.isEmpty || email.isEmpty || password.isEmpty) {
        throw ApiException('Todos os campos são obrigatórios');
      }

      if (password.length < 6) {
        throw ApiException('A senha deve ter pelo menos 6 caracteres');
      }

      final response = await authService.register(
        name: name,
        email: email,
        password: password,
        role: role,
      );

      _user = response.user;
      _isAuthenticated = true;

      // Save to local storage for offline access
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user', 'authenticated');
      await prefs.setString('user_id', _user!.id);
      await prefs.setString('user_email', _user!.email);
      await prefs.setString('user_name', _user!.name);
      await prefs.setString('user_role', _user!.role.name);

      _isLoading = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> forgotPassword(String email) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      if (email.isEmpty) {
        throw Exception('Email é obrigatório');
      }

      await apiClient.post(ApiConfig.forgotPasswordUrl, data: {'email': email});

      _isLoading = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> resetPassword(String token, String newPassword) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      if (newPassword.length < 6) {
        throw Exception('A senha deve ter pelo menos 6 caracteres');
      }

      await apiClient.post(
        '${ApiConfig.apiUrl}/auth/reset-password',
        data: {'token': token, 'new_password': newPassword},
      );

      _isLoading = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    // Clear API tokens
    await authService.logout();

    // Clear local storage
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user');
    await prefs.remove('user_id');
    await prefs.remove('user_email');
    await prefs.remove('user_name');
    await prefs.remove('user_role');
    await prefs.remove('access_token');
    await prefs.remove('refresh_token');

    _user = null;
    _isAuthenticated = false;
    _isLoading = false;
    notifyListeners();
  }

  bool hasPermission(List<UserRole> allowedRoles) {
    if (_user == null) return false;
    return allowedRoles.contains(_user!.role);
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
