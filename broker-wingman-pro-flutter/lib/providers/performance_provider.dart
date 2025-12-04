import 'package:flutter/material.dart';
import '../models/performance_challenge.dart';
import '../models/user.dart';
import '../services/api_client.dart';
import '../config/api_config.dart';
import 'auth_provider.dart';

class PerformanceProvider extends ChangeNotifier {
  List<PerformanceChallenge> _challenges = [];
  bool _isLoading = false;
  String? _error;
  String? _userId;
  UserRole? _userRole;

  List<PerformanceChallenge> get challenges => _challenges;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void updateAuth(AuthProvider auth) {
    final newUserId = auth.userId;
    final newRole = auth.role;

    if (newUserId != _userId || newRole != _userRole) {
      _userId = newUserId;
      _userRole = newRole;
      if (_userId != null) {
        fetchChallenges();
      }
    }
  }

  Future<void> fetchChallenges() async {
    if (_userId == null) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await apiClient.get(ApiConfig.challengesUrl);
      // Backend returns { "challenges": [...], "total": X }
      final challengesList = data['challenges'] as List? ?? [];
      _challenges = challengesList
          .map((json) => PerformanceChallenge.fromJson(json))
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

  List<PerformanceChallenge> getChallengesByBrokerId(String brokerId) {
    return _challenges.where((c) => c.brokerId == brokerId).toList();
  }

  List<PerformanceChallenge> get activeChallenges {
    return _challenges
        .where((c) => c.status == ChallengeStatus.active)
        .toList();
  }

  Future<bool> createChallenge(PerformanceChallenge challenge) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await apiClient.post(
        ApiConfig.challengesUrl,
        data: challenge.toJson(),
      );
      final newChallenge = PerformanceChallenge.fromJson(data);
      _challenges.add(newChallenge);

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

  Future<bool> updateChallenge(PerformanceChallenge challenge) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await apiClient.put(
        '${ApiConfig.challengesUrl}/${challenge.id}',
        data: challenge.toJson(),
      );
      final updatedChallenge = PerformanceChallenge.fromJson(data);
      final index = _challenges.indexWhere((c) => c.id == challenge.id);
      if (index != -1) {
        _challenges[index] = updatedChallenge;
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

  Future<bool> deleteChallenge(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await apiClient.delete('${ApiConfig.challengesUrl}/$id');
      _challenges.removeWhere((c) => c.id == id);

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
