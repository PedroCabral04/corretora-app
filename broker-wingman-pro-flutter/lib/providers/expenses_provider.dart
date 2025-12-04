import 'package:flutter/material.dart';
import '../models/expense.dart';
import '../models/user.dart';
import '../services/api_client.dart';
import '../config/api_config.dart';
import 'auth_provider.dart';

class ExpensesProvider extends ChangeNotifier {
  List<Expense> _expenses = [];
  bool _isLoading = false;
  String? _error;
  String? _userId;
  UserRole? _userRole;

  List<Expense> get expenses => _expenses;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void updateAuth(AuthProvider auth) {
    final newUserId = auth.userId;
    final newRole = auth.role;

    print(
      '[ExpensesProvider] updateAuth called - newUserId: $newUserId, currentUserId: $_userId',
    );

    if (newUserId != _userId || newRole != _userRole) {
      _userId = newUserId;
      _userRole = newRole;
      if (_userId != null) {
        print('[ExpensesProvider] userId changed, calling fetchExpenses()');
        fetchExpenses();
      }
    } else if (_userId != null && _expenses.isEmpty && !_isLoading) {
      // If we have a userId but no expenses, fetch them
      print(
        '[ExpensesProvider] userId unchanged but expenses empty, calling fetchExpenses()',
      );
      fetchExpenses();
    }
  }

  Future<void> fetchExpenses() async {
    if (_userId == null) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      print('[ExpensesProvider] Fetching expenses...');
      final data = await apiClient.get(ApiConfig.expensesUrl);
      print('[ExpensesProvider] Raw response: $data');
      // Backend returns { "expenses": [...], "total": X }
      final expensesList = data['expenses'] as List? ?? [];
      _expenses = expensesList.map((json) => Expense.fromJson(json)).toList();
      print('[ExpensesProvider] Loaded ${_expenses.length} expenses');
      for (final e in _expenses) {
        print(
          '[ExpensesProvider] Loaded expense: id=${e.id}, brokerId=${e.brokerId}',
        );
      }
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

  List<Expense> getExpensesByBrokerId(String brokerId) {
    final trimmedBrokerId = brokerId.trim();
    print(
      '[ExpensesProvider] getExpensesByBrokerId called with: "$trimmedBrokerId" (length: ${trimmedBrokerId.length})',
    );
    print('[ExpensesProvider] Total expenses: ${_expenses.length}');
    for (final e in _expenses) {
      final expenseBrokerId = e.brokerId?.trim() ?? '';
      print(
        '[ExpensesProvider] Expense ${e.id}: brokerId="$expenseBrokerId" (length: ${expenseBrokerId.length}), matches=${expenseBrokerId == trimmedBrokerId}',
      );
    }
    final filtered = _expenses
        .where((expense) => expense.brokerId?.trim() == trimmedBrokerId)
        .toList();
    print('[ExpensesProvider] Filtered expenses: ${filtered.length}');
    return filtered;
  }

  Future<bool> createExpense(Expense expense) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      print(
        '[ExpensesProvider] Creating expense with brokerId: ${expense.brokerId}',
      );
      print('[ExpensesProvider] Request data: ${expense.toJson()}');
      final data = await apiClient.post(
        ApiConfig.expensesUrl,
        data: expense.toJson(),
      );
      print('[ExpensesProvider] Response data: $data');
      final newExpense = Expense.fromJson(data);
      print(
        '[ExpensesProvider] Parsed expense - id: ${newExpense.id}, brokerId: ${newExpense.brokerId}',
      );
      _expenses.add(newExpense);

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

  Future<bool> updateExpense(Expense expense) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await apiClient.put(
        '${ApiConfig.expensesUrl}/${expense.id}',
        data: expense.toJson(),
      );
      final updatedExpense = Expense.fromJson(data);
      final index = _expenses.indexWhere((e) => e.id == expense.id);
      if (index != -1) {
        _expenses[index] = updatedExpense;
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

  Future<bool> deleteExpense(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await apiClient.delete('${ApiConfig.expensesUrl}/$id');
      _expenses.removeWhere((expense) => expense.id == id);

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
  double get totalExpenses => _expenses.fold(0.0, (sum, e) => sum + e.amount);

  Map<String, double> get expensesByCategory {
    final map = <String, double>{};
    for (final expense in _expenses) {
      final category = expense.category ?? 'Outros';
      map[category] = (map[category] ?? 0) + expense.amount;
    }
    return map;
  }
}
