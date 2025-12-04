import 'package:flutter/material.dart';
import '../models/task.dart';
import '../models/user.dart';
import '../services/api_client.dart';
import '../config/api_config.dart';
import 'auth_provider.dart';

class TasksProvider extends ChangeNotifier {
  List<Task> _tasks = [];
  bool _isLoading = false;
  String? _error;
  String? _userId;
  UserRole? _userRole;

  List<Task> get tasks => _tasks;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void updateAuth(AuthProvider auth) {
    final newUserId = auth.userId;
    final newRole = auth.role;

    if (newUserId != _userId || newRole != _userRole) {
      _userId = newUserId;
      _userRole = newRole;
      if (_userId != null) {
        fetchTasks();
      }
    }
  }

  Future<void> fetchTasks() async {
    if (_userId == null) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await apiClient.get(ApiConfig.tasksUrl);
      // Backend returns { "tasks": [...], "total": X }
      final tasksList = data['tasks'] as List? ?? [];
      _tasks = tasksList.map((json) => Task.fromJson(json)).toList();
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

  List<Task> getTasksByStatus(TaskStatus status) {
    return _tasks.where((task) => task.status == status).toList();
  }

  List<Task> getTasksByBrokerId(String brokerId) {
    return _tasks.where((task) => task.brokerId == brokerId).toList();
  }

  Future<bool> createTask(Task task) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await apiClient.post(
        ApiConfig.tasksUrl,
        data: task.toJson(),
      );
      final newTask = Task.fromJson(data);
      _tasks.add(newTask);

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

  Future<bool> updateTask(Task task) async {
    try {
      // Optimistic update
      final index = _tasks.indexWhere((t) => t.id == task.id);
      if (index != -1) {
        _tasks[index] = task;
        notifyListeners();
      }

      final data = await apiClient.put(
        '${ApiConfig.tasksUrl}/${task.id}',
        data: task.toJson(),
      );
      final updatedTask = Task.fromJson(data);
      if (index != -1) {
        _tasks[index] = updatedTask;
        notifyListeners();
      }

      return true;
    } on ApiException catch (e) {
      _error = e.message;
      // Rollback on error
      await fetchTasks();
      return false;
    } catch (e) {
      _error = e.toString();
      // Rollback on error
      await fetchTasks();
      return false;
    }
  }

  Future<bool> updateTaskStatus(String taskId, TaskStatus newStatus) async {
    final taskIndex = _tasks.indexWhere((t) => t.id == taskId);
    if (taskIndex == -1) return false;

    final updatedTask = _tasks[taskIndex].copyWith(status: newStatus);
    return updateTask(updatedTask);
  }

  Future<bool> deleteTask(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await apiClient.delete('${ApiConfig.tasksUrl}/$id');
      _tasks.removeWhere((task) => task.id == id);

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
  int get backlogCount => getTasksByStatus(TaskStatus.backlog).length;
  int get inProgressCount => getTasksByStatus(TaskStatus.emProgresso).length;
  int get inReviewCount => getTasksByStatus(TaskStatus.emRevisao).length;
  int get completedCount => getTasksByStatus(TaskStatus.concluida).length;
}
