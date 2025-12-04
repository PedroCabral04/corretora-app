enum ChallengeStatus { active, completed, cancelled }

enum ChallengePriority { low, medium, high }

class PerformanceTarget {
  final String id;
  final String challengeId;
  final String metricType;
  final double targetValue;
  final double currentValue;

  PerformanceTarget({
    required this.id,
    required this.challengeId,
    required this.metricType,
    required this.targetValue,
    this.currentValue = 0,
  });

  factory PerformanceTarget.fromJson(Map<String, dynamic> json) {
    return PerformanceTarget(
      id: json['id'] ?? '',
      challengeId: json['challenge_id'] ?? '',
      metricType: json['metric_type'] ?? '',
      targetValue: (json['target_value'] ?? 0).toDouble(),
      currentValue: (json['current_value'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'challenge_id': challengeId,
      'metric_type': metricType,
      'target_value': targetValue,
      'current_value': currentValue,
    };
  }

  double get progressPercentage {
    if (targetValue == 0) return 0;
    return (currentValue / targetValue * 100).clamp(0, 100);
  }

  PerformanceTarget copyWith({
    String? id,
    String? challengeId,
    String? metricType,
    double? targetValue,
    double? currentValue,
  }) {
    return PerformanceTarget(
      id: id ?? this.id,
      challengeId: challengeId ?? this.challengeId,
      metricType: metricType ?? this.metricType,
      targetValue: targetValue ?? this.targetValue,
      currentValue: currentValue ?? this.currentValue,
    );
  }
}

class PerformanceChallenge {
  final String id;
  final String userId;
  final String? brokerId;
  final String title;
  final String? description;
  final DateTime startDate;
  final DateTime endDate;
  final ChallengeStatus status;
  final ChallengePriority priority;
  final List<PerformanceTarget> targets;
  final DateTime? createdAt;

  PerformanceChallenge({
    required this.id,
    required this.userId,
    this.brokerId,
    required this.title,
    this.description,
    required this.startDate,
    required this.endDate,
    this.status = ChallengeStatus.active,
    this.priority = ChallengePriority.medium,
    this.targets = const [],
    this.createdAt,
  });

  factory PerformanceChallenge.fromJson(Map<String, dynamic> json) {
    return PerformanceChallenge(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      brokerId: json['broker_id'],
      title: json['title'] ?? '',
      description: json['description'],
      startDate: json['start_date'] != null
          ? DateTime.parse(json['start_date'])
          : DateTime.now(),
      endDate: json['end_date'] != null
          ? DateTime.parse(json['end_date'])
          : DateTime.now().add(const Duration(days: 30)),
      status: _parseStatus(json['status']),
      priority: _parsePriority(json['priority']),
      targets:
          (json['targets'] as List<dynamic>?)
              ?.map((e) => PerformanceTarget.fromJson(e))
              .toList() ??
          [],
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'broker_id': brokerId,
      'title': title,
      'description': description,
      'start_date': startDate.toIso8601String().split('T').first,
      'end_date': endDate.toIso8601String().split('T').first,
      'status': status.name,
      'priority': priority.name,
      'targets': targets.map((e) => e.toJson()).toList(),
      'created_at': createdAt?.toIso8601String(),
    };
  }

  static ChallengeStatus _parseStatus(String? status) {
    switch (status) {
      case 'completed':
        return ChallengeStatus.completed;
      case 'cancelled':
        return ChallengeStatus.cancelled;
      default:
        return ChallengeStatus.active;
    }
  }

  static ChallengePriority _parsePriority(String? priority) {
    switch (priority) {
      case 'high':
        return ChallengePriority.high;
      case 'low':
        return ChallengePriority.low;
      default:
        return ChallengePriority.medium;
    }
  }

  String get statusLabel {
    switch (status) {
      case ChallengeStatus.active:
        return 'Ativo';
      case ChallengeStatus.completed:
        return 'Concluído';
      case ChallengeStatus.cancelled:
        return 'Cancelado';
    }
  }

  String get priorityLabel {
    switch (priority) {
      case ChallengePriority.low:
        return 'Baixa';
      case ChallengePriority.medium:
        return 'Média';
      case ChallengePriority.high:
        return 'Alta';
    }
  }

  double get overallProgress {
    if (targets.isEmpty) return 0;
    final totalProgress = targets.fold(
      0.0,
      (sum, target) => sum + target.progressPercentage,
    );
    return totalProgress / targets.length;
  }

  PerformanceChallenge copyWith({
    String? id,
    String? userId,
    String? brokerId,
    String? title,
    String? description,
    DateTime? startDate,
    DateTime? endDate,
    ChallengeStatus? status,
    ChallengePriority? priority,
    List<PerformanceTarget>? targets,
    DateTime? createdAt,
  }) {
    return PerformanceChallenge(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      brokerId: brokerId ?? this.brokerId,
      title: title ?? this.title,
      description: description ?? this.description,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      status: status ?? this.status,
      priority: priority ?? this.priority,
      targets: targets ?? this.targets,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
