import 'package:flutter/material.dart';
import '../models/broker.dart';
import '../models/user.dart';
import '../services/api_client.dart';
import '../config/api_config.dart';
import 'auth_provider.dart';

class BrokersProvider extends ChangeNotifier {
  List<Broker> _brokers = [];
  bool _isLoading = false;
  String? _error;
  String? _userId;
  UserRole? _userRole;

  List<Broker> get brokers => _brokers;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void updateAuth(AuthProvider auth) {
    final newUserId = auth.userId;
    final newRole = auth.role;

    if (newUserId != _userId || newRole != _userRole) {
      _userId = newUserId;
      _userRole = newRole;
      if (_userId != null) {
        fetchBrokers();
      }
    }
  }

  Future<void> fetchBrokers() async {
    if (_userId == null) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await apiClient.get(ApiConfig.brokersUrl);
      // Backend returns { "brokers": [...], "total": X }
      final brokersList = data['brokers'] as List? ?? [];
      _brokers = brokersList.map((json) => Broker.fromJson(json)).toList();
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

  Broker? getBrokerById(String id) {
    try {
      return _brokers.firstWhere((broker) => broker.id == id);
    } catch (e) {
      return null;
    }
  }

  Future<bool> createBroker(Broker broker) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await apiClient.post(
        ApiConfig.brokersUrl,
        data: broker.toJson(),
      );
      final newBroker = Broker.fromJson(data);
      _brokers.add(newBroker);

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

  Future<bool> updateBroker(Broker broker) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await apiClient.put(
        '${ApiConfig.brokersUrl}/${broker.id}',
        data: broker.toJson(),
      );
      final updatedBroker = Broker.fromJson(data);
      final index = _brokers.indexWhere((b) => b.id == broker.id);
      if (index != -1) {
        _brokers[index] = updatedBroker;
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

  Future<bool> deleteBroker(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await apiClient.delete('${ApiConfig.brokersUrl}/$id');
      _brokers.removeWhere((broker) => broker.id == id);

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
  int get totalSales => _brokers.fold(0, (sum, b) => sum + b.totalSales);
  int get totalListings => _brokers.fold(0, (sum, b) => sum + b.totalListings);
  double get totalValue => _brokers.fold(0.0, (sum, b) => sum + b.totalValue);
  double get totalExpenses =>
      _brokers.fold(0.0, (sum, b) => sum + b.monthlyExpenses);
}
