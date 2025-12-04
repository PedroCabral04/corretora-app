import 'package:flutter/material.dart';
import '../models/event.dart';
import '../models/user.dart';
import '../services/api_client.dart';
import '../config/api_config.dart';
import 'auth_provider.dart';

class EventsProvider extends ChangeNotifier {
  List<Event> _events = [];
  bool _isLoading = false;
  String? _error;
  String? _userId;
  UserRole? _userRole;

  List<Event> get events => _events;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void updateAuth(AuthProvider auth) {
    final newUserId = auth.userId;
    final newRole = auth.role;

    if (newUserId != _userId || newRole != _userRole) {
      _userId = newUserId;
      _userRole = newRole;
      if (_userId != null) {
        fetchEvents();
      }
    }
  }

  Future<void> fetchEvents() async {
    if (_userId == null) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await apiClient.get(ApiConfig.eventsUrl);
      // Backend returns { "events": [...], "total": X }
      final eventsList = data['events'] as List? ?? [];
      _events = eventsList.map((json) => Event.fromJson(json)).toList();
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

  List<Event> getEventsForDay(DateTime day) {
    return _events.where((event) {
      return event.datetime.year == day.year &&
          event.datetime.month == day.month &&
          event.datetime.day == day.day;
    }).toList()..sort((a, b) => a.datetime.compareTo(b.datetime));
  }

  Map<DateTime, List<Event>> get eventsByDay {
    final map = <DateTime, List<Event>>{};
    for (final event in _events) {
      final date = DateTime(
        event.datetime.year,
        event.datetime.month,
        event.datetime.day,
      );
      if (map[date] == null) {
        map[date] = [];
      }
      map[date]!.add(event);
    }
    return map;
  }

  Future<bool> createEvent(Event event) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await apiClient.post(
        ApiConfig.eventsUrl,
        data: event.toJson(),
      );
      final newEvent = Event.fromJson(data);
      _events.add(newEvent);

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

  Future<bool> updateEvent(Event event) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await apiClient.put(
        '${ApiConfig.eventsUrl}/${event.id}',
        data: event.toJson(),
      );
      final updatedEvent = Event.fromJson(data);
      final index = _events.indexWhere((e) => e.id == event.id);
      if (index != -1) {
        _events[index] = updatedEvent;
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

  Future<bool> deleteEvent(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await apiClient.delete('${ApiConfig.eventsUrl}/$id');
      _events.removeWhere((event) => event.id == id);

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
}
