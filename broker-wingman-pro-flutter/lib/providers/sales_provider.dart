import 'package:flutter/material.dart';
import '../models/sale.dart';
import '../models/user.dart';
import '../services/api_client.dart';
import '../config/api_config.dart';
import 'auth_provider.dart';

class SalesProvider extends ChangeNotifier {
  List<Sale> _sales = [];
  bool _isLoading = false;
  String? _error;
  String? _userId;
  UserRole? _userRole;

  List<Sale> get sales => _sales;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void updateAuth(AuthProvider auth) {
    final newUserId = auth.userId;
    final newRole = auth.role;

    print(
      '[SalesProvider] updateAuth called - newUserId: $newUserId, currentUserId: $_userId',
    );

    if (newUserId != _userId || newRole != _userRole) {
      _userId = newUserId;
      _userRole = newRole;
      if (_userId != null) {
        print('[SalesProvider] userId changed, calling fetchSales()');
        fetchSales();
      }
    } else if (_userId != null && _sales.isEmpty && !_isLoading) {
      // If we have a userId but no sales, fetch them
      print(
        '[SalesProvider] userId unchanged but sales empty, calling fetchSales()',
      );
      fetchSales();
    }
  }

  Future<void> fetchSales() async {
    if (_userId == null) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      print('[SalesProvider] Fetching sales...');
      final data = await apiClient.get(ApiConfig.salesUrl);
      print('[SalesProvider] Raw response: $data');
      // Backend returns { "sales": [...], "total": X }
      final salesList = data['sales'] as List? ?? [];
      print('[SalesProvider] Parsing ${salesList.length} sales...');

      final List<Sale> parsedSales = [];
      for (int i = 0; i < salesList.length; i++) {
        try {
          final sale = Sale.fromJson(salesList[i]);
          parsedSales.add(sale);
          print(
            '[SalesProvider] Parsed sale $i: id=${sale.id}, brokerId=${sale.brokerId}',
          );
        } catch (e) {
          print('[SalesProvider] ERROR parsing sale $i: $e');
          print('[SalesProvider] Sale JSON: ${salesList[i]}');
        }
      }

      _sales = parsedSales;
      print('[SalesProvider] Loaded ${_sales.length} sales');
      _isLoading = false;
      notifyListeners();
    } on ApiException catch (e) {
      print('[SalesProvider] API Error: ${e.message}');
      _error = e.message;
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      print('[SalesProvider] General Error: $e');
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  List<Sale> getSalesByBrokerId(String brokerId) {
    final trimmedBrokerId = brokerId.trim();
    print(
      '[SalesProvider] getSalesByBrokerId called with: "$trimmedBrokerId" (length: ${trimmedBrokerId.length})',
    );
    print('[SalesProvider] Total sales: ${_sales.length}');
    for (final s in _sales) {
      final saleBrokerId = s.brokerId?.trim() ?? '';
      print(
        '[SalesProvider] Sale ${s.id}: brokerId="$saleBrokerId" (length: ${saleBrokerId.length}), matches=${saleBrokerId == trimmedBrokerId}',
      );
    }
    final filtered = _sales
        .where((sale) => sale.brokerId?.trim() == trimmedBrokerId)
        .toList();
    print('[SalesProvider] Filtered sales: ${filtered.length}');
    return filtered;
  }

  Future<bool> createSale(Sale sale) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      print('[SalesProvider] Creating sale with brokerId: ${sale.brokerId}');
      print('[SalesProvider] Request data: ${sale.toJson()}');
      final data = await apiClient.post(
        ApiConfig.salesUrl,
        data: sale.toJson(),
      );
      print('[SalesProvider] Response data: $data');
      final newSale = Sale.fromJson(data);
      print(
        '[SalesProvider] Parsed sale - id: ${newSale.id}, brokerId: ${newSale.brokerId}',
      );
      _sales.add(newSale);

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

  Future<bool> updateSale(Sale sale) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await apiClient.put(
        '${ApiConfig.salesUrl}/${sale.id}',
        data: sale.toJson(),
      );
      final updatedSale = Sale.fromJson(data);
      final index = _sales.indexWhere((s) => s.id == sale.id);
      if (index != -1) {
        _sales[index] = updatedSale;
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

  Future<bool> deleteSale(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await apiClient.delete('${ApiConfig.salesUrl}/$id');
      _sales.removeWhere((sale) => sale.id == id);

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
  double get totalSalesValue => _sales.fold(0.0, (sum, s) => sum + s.saleValue);
  double get totalCommission =>
      _sales.fold(0.0, (sum, s) => sum + (s.commissionValue ?? 0));
  int get totalSalesCount => _sales.length;
}
