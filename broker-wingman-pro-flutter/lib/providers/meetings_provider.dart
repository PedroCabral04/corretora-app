import 'package:flutter/material.dart';
import '../models/meeting.dart';
import '../models/user.dart';
import '../services/api_client.dart';
import '../config/api_config.dart';
import 'auth_provider.dart';

class MeetingsProvider extends ChangeNotifier {
  List<Meeting> _meetings = [];
  bool _isLoading = false;
  String? _error;
  String? _userId;
  UserRole? _userRole;

  List<Meeting> get meetings => _meetings;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void updateAuth(AuthProvider auth) {
    final newUserId = auth.userId;
    final newRole = auth.role;

    if (newUserId != _userId || newRole != _userRole) {
      _userId = newUserId;
      _userRole = newRole;
      if (_userId != null) {
        fetchMeetings();
      }
    }
  }

  Future<void> fetchMeetings() async {
    if (_userId == null) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await apiClient.get(ApiConfig.meetingsUrl);
      // Backend returns { "meetings": [...], "total": X }
      final meetingsList = data['meetings'] as List? ?? [];
      _meetings = meetingsList.map((json) => Meeting.fromJson(json)).toList();
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

  List<Meeting> getMeetingsByBrokerId(String brokerId) {
    return _meetings.where((meeting) => meeting.brokerId == brokerId).toList();
  }

  Future<bool> createMeeting(Meeting meeting) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await apiClient.post(
        ApiConfig.meetingsUrl,
        data: meeting.toJson(),
      );
      final newMeeting = Meeting.fromJson(data);
      _meetings.add(newMeeting);

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

  Future<bool> updateMeeting(Meeting meeting) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await apiClient.put(
        '${ApiConfig.meetingsUrl}/${meeting.id}',
        data: meeting.toJson(),
      );
      final updatedMeeting = Meeting.fromJson(data);
      final index = _meetings.indexWhere((m) => m.id == meeting.id);
      if (index != -1) {
        _meetings[index] = updatedMeeting;
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

  Future<bool> deleteMeeting(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await apiClient.delete('${ApiConfig.meetingsUrl}/$id');
      _meetings.removeWhere((meeting) => meeting.id == id);

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
  int get scheduledCount =>
      _meetings.where((m) => m.status == MeetingStatus.agendada).length;
  int get completedCount =>
      _meetings.where((m) => m.status == MeetingStatus.realizada).length;
}
