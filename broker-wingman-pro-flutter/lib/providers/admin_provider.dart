import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/api_client.dart';
import '../config/api_config.dart';

class AdminProvider with ChangeNotifier {
  List<User> _users = [];
  bool _isLoading = false;
  String? _error;

  List<User> get users => _users;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchUsers() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await apiClient.get('${ApiConfig.adminUrl}/users');
      // Backend returns { "users": [...], "total": X }
      final usersList = data['users'] as List? ?? [];
      _users = usersList.map((json) => User.fromJson(json)).toList();
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateUserRole(String userId, UserRole role) async {
    try {
      await apiClient.put(
        '${ApiConfig.adminUrl}/users/$userId/role',
        data: {'role': role.name},
      );
      final index = _users.indexWhere((u) => u.id == userId);
      if (index != -1) {
        _users[index] = _users[index].copyWith(role: role);
        notifyListeners();
      }
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> createUser(User user) async {
    try {
      final data = await apiClient.post(
        '${ApiConfig.adminUrl}/users',
        data: user.toJson(),
      );
      final newUser = User.fromJson(data);
      _users.add(newUser);
      notifyListeners();
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> deleteUser(String userId) async {
    try {
      await apiClient.delete('${ApiConfig.adminUrl}/users/$userId');
      _users.removeWhere((u) => u.id == userId);
      notifyListeners();
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  List<User> getUsersByRole(UserRole role) {
    return _users.where((u) => u.role == role).toList();
  }
}
