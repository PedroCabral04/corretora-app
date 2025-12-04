import 'package:flutter/material.dart';
import '../models/goal.dart';
import '../models/user.dart';
import '../services/api_client.dart';
import '../config/api_config.dart';
import 'auth_provider.dart';

class GoalsProvider extends ChangeNotifier {
  List<Goal> _goals = [];
  bool _isLoading = false;
  String? _error;
  String? _userId;
  UserRole? _userRole;

  List<Goal> get goals => _goals;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void updateAuth(AuthProvider auth) {
    final newUserId = auth.userId;
    final newRole = auth.role;

    if (newUserId != _userId || newRole != _userRole) {
      _userId = newUserId;
      _userRole = newRole;
      if (_userId != null) {
        fetchGoals();
      }
    }
  }

  Future<void> fetchGoals() async {
    if (_userId == null) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await apiClient.get(ApiConfig.goalsUrl);
      // Backend returns { "goals": [...], "total": X }
      final goalsList = data['goals'] as List? ?? [];
      _goals = goalsList.map((json) => Goal.fromJson(json)).toList();
      _isLoading = false;
      notifyListeners();
    } on ApiException catch (e) {
      _error = e.message;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  List<Goal> getGoalsByBrokerId(String brokerId) {
    return _goals.where((goal) => goal.brokerId == brokerId).toList();
  }

  List<Goal> get activeGoals {
    return _goals.where((g) => g.status == GoalStatus.active).toList();
  }

  Future<bool> createGoal(Goal goal) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await apiClient.post(
        ApiConfig.goalsUrl,
        data: goal.toJson(),
      );
      final newGoal = Goal.fromJson(data);
      _goals.add(newGoal);

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

  Future<bool> updateGoal(Goal goal) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await apiClient.put(
        '${ApiConfig.goalsUrl}/${goal.id}',
        data: goal.toJson(),
      );
      final updatedGoal = Goal.fromJson(data);
      final index = _goals.indexWhere((g) => g.id == goal.id);
      if (index != -1) {
        _goals[index] = updatedGoal;
      }

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

  Future<bool> updateGoalProgress(String goalId, double newValue) async {
    final goalIndex = _goals.indexWhere((g) => g.id == goalId);
    if (goalIndex == -1) return false;

    final updatedGoal = _goals[goalIndex].copyWith(currentValue: newValue);
    return updateGoal(updatedGoal);
  }

  Future<bool> deleteGoal(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await apiClient.delete('${ApiConfig.goalsUrl}/$id');
      _goals.removeWhere((goal) => goal.id == id);

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

  // Aggregated metrics
  double get averageProgress {
    if (activeGoals.isEmpty) return 0;
    return activeGoals.fold(0.0, (sum, g) => sum + g.progressPercentage) /
        activeGoals.length;
  }
}
