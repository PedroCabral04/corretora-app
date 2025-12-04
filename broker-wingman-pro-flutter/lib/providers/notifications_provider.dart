import 'package:flutter/material.dart';
import '../models/notification.dart';
import '../models/user.dart';
import '../services/api_client.dart';
import '../config/api_config.dart';
import 'auth_provider.dart';

class NotificationsProvider extends ChangeNotifier {
  List<AppNotification> _notifications = [];
  bool _isLoading = false;
  String? _error;
  String? _userId;
  UserRole? _userRole;

  List<AppNotification> get notifications => _notifications;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void updateAuth(AuthProvider auth) {
    final newUserId = auth.userId;
    final newRole = auth.role;

    if (newUserId != _userId || newRole != _userRole) {
      _userId = newUserId;
      _userRole = newRole;
      if (_userId != null) {
        fetchNotifications();
      }
    }
  }

  Future<void> fetchNotifications() async {
    if (_userId == null) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await apiClient.get(ApiConfig.notificationsUrl);
      // Backend returns { "notifications": [...], "total": X }
      final notificationsList = data['notifications'] as List? ?? [];
      _notifications = notificationsList
          .map((json) => AppNotification.fromJson(json))
          .toList();
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

  List<AppNotification> get unreadNotifications {
    return _notifications.where((n) => !n.isRead).toList();
  }

  int get unreadCount => unreadNotifications.length;

  Future<bool> markAsRead(String id) async {
    try {
      // Optimistic update
      final index = _notifications.indexWhere((n) => n.id == id);
      if (index != -1) {
        _notifications[index] = _notifications[index].copyWith(isRead: true);
        notifyListeners();
      }

      await apiClient.put('${ApiConfig.notificationsUrl}/$id/read');
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      await fetchNotifications(); // Rollback
      return false;
    } catch (e) {
      _error = e.toString();
      await fetchNotifications(); // Rollback
      return false;
    }
  }

  Future<bool> markAllAsRead() async {
    try {
      // Optimistic update
      _notifications = _notifications
          .map((n) => n.copyWith(isRead: true))
          .toList();
      notifyListeners();

      await apiClient.put('${ApiConfig.notificationsUrl}/read-all');
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      await fetchNotifications(); // Rollback
      return false;
    } catch (e) {
      _error = e.toString();
      await fetchNotifications(); // Rollback
      return false;
    }
  }

  Future<bool> deleteNotification(String id) async {
    try {
      // Optimistic update
      _notifications.removeWhere((n) => n.id == id);
      notifyListeners();

      await apiClient.delete('${ApiConfig.notificationsUrl}/$id');
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      await fetchNotifications(); // Rollback
      return false;
    } catch (e) {
      _error = e.toString();
      await fetchNotifications(); // Rollback
      return false;
    }
  }

  Future<bool> addNotification(AppNotification notification) async {
    try {
      final data = await apiClient.post(
        ApiConfig.notificationsUrl,
        data: notification.toJson(),
      );
      final newNotification = AppNotification.fromJson(data);
      _notifications.insert(0, newNotification);
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      return false;
    } catch (e) {
      _error = e.toString();
      return false;
    }
  }
}
