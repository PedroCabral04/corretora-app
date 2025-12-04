enum GoalType {
  salesCount,
  salesValue,
  listings,
  meetings,
  tasks,
  calls,
  visits,
  inPersonVisits,
}

enum GoalStatus { active, completed, cancelled, overdue }

enum GoalPriority { low, medium, high }

class Goal {
  final String id;
  final String userId;
  final String? brokerId;
  final String title;
  final String? description;
  final GoalType goalType;
  final double targetValue;
  final double currentValue;
  final DateTime startDate;
  final DateTime endDate;
  final GoalStatus status;
  final GoalPriority priority;
  final DateTime? createdAt;

  Goal({
    required this.id,
    required this.userId,
    this.brokerId,
    required this.title,
    this.description,
    required this.goalType,
    required this.targetValue,
    this.currentValue = 0,
    required this.startDate,
    required this.endDate,
    this.status = GoalStatus.active,
    this.priority = GoalPriority.medium,
    this.createdAt,
  });

  factory Goal.fromJson(Map<String, dynamic> json) {
    return Goal(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      brokerId: json['broker_id'],
      title: json['title'] ?? '',
      description: json['description'],
      goalType: _parseGoalType(json['goal_type']),
      targetValue: (json['target_value'] ?? 0).toDouble(),
      currentValue: (json['current_value'] ?? 0).toDouble(),
      startDate: json['start_date'] != null
          ? DateTime.parse(json['start_date'])
          : DateTime.now(),
      endDate: json['end_date'] != null
          ? DateTime.parse(json['end_date'])
          : DateTime.now().add(const Duration(days: 30)),
      status: _parseStatus(json['status']),
      priority: _parsePriority(json['priority']),
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
      'goal_type': goalTypeValue,
      'target_value': targetValue,
      'current_value': currentValue,
      'start_date': startDate.toIso8601String().split('T').first,
      'end_date': endDate.toIso8601String().split('T').first,
      'status': status.name,
      'priority': priority.name,
      'created_at': createdAt?.toIso8601String(),
    };
  }

  static GoalType _parseGoalType(String? type) {
    switch (type) {
      case 'sales_count':
        return GoalType.salesCount;
      case 'sales_value':
        return GoalType.salesValue;
      case 'listings':
        return GoalType.listings;
      case 'meetings':
        return GoalType.meetings;
      case 'tasks':
        return GoalType.tasks;
      case 'calls':
        return GoalType.calls;
      case 'visits':
        return GoalType.visits;
      case 'in_person_visits':
        return GoalType.inPersonVisits;
      default:
        return GoalType.salesCount;
    }
  }

  static GoalStatus _parseStatus(String? status) {
    switch (status) {
      case 'completed':
        return GoalStatus.completed;
      case 'cancelled':
        return GoalStatus.cancelled;
      case 'overdue':
        return GoalStatus.overdue;
      default:
        return GoalStatus.active;
    }
  }

  static GoalPriority _parsePriority(String? priority) {
    switch (priority) {
      case 'high':
        return GoalPriority.high;
      case 'low':
        return GoalPriority.low;
      default:
        return GoalPriority.medium;
    }
  }

  String get goalTypeLabel {
    switch (goalType) {
      case GoalType.salesCount:
        return 'Qtd. Vendas';
      case GoalType.salesValue:
        return 'Valor Vendas';
      case GoalType.listings:
        return 'Captações';
      case GoalType.meetings:
        return 'Reuniões';
      case GoalType.tasks:
        return 'Tarefas';
      case GoalType.calls:
        return 'Ligações';
      case GoalType.visits:
        return 'Visitas';
      case GoalType.inPersonVisits:
        return 'Visitas Presenciais';
    }
  }

  String get goalTypeValue {
    switch (goalType) {
      case GoalType.salesCount:
        return 'sales_count';
      case GoalType.salesValue:
        return 'sales_value';
      case GoalType.listings:
        return 'listings';
      case GoalType.meetings:
        return 'meetings';
      case GoalType.tasks:
        return 'tasks';
      case GoalType.calls:
        return 'calls';
      case GoalType.visits:
        return 'visits';
      case GoalType.inPersonVisits:
        return 'in_person_visits';
    }
  }

  String get statusLabel {
    switch (status) {
      case GoalStatus.active:
        return 'Ativa';
      case GoalStatus.completed:
        return 'Concluída';
      case GoalStatus.cancelled:
        return 'Cancelada';
      case GoalStatus.overdue:
        return 'Atrasada';
    }
  }

  String get priorityLabel {
    switch (priority) {
      case GoalPriority.low:
        return 'Baixa';
      case GoalPriority.medium:
        return 'Média';
      case GoalPriority.high:
        return 'Alta';
    }
  }

  double get progressPercentage {
    if (targetValue == 0) return 0;
    return (currentValue / targetValue * 100).clamp(0, 100);
  }

  bool get isOverdue =>
      endDate.isBefore(DateTime.now()) && status == GoalStatus.active;

  int get daysRemaining {
    final now = DateTime.now();
    if (endDate.isBefore(now)) return 0;
    return endDate.difference(now).inDays;
  }

  Goal copyWith({
    String? id,
    String? userId,
    String? brokerId,
    String? title,
    String? description,
    GoalType? goalType,
    double? targetValue,
    double? currentValue,
    DateTime? startDate,
    DateTime? endDate,
    GoalStatus? status,
    GoalPriority? priority,
    DateTime? createdAt,
  }) {
    return Goal(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      brokerId: brokerId ?? this.brokerId,
      title: title ?? this.title,
      description: description ?? this.description,
      goalType: goalType ?? this.goalType,
      targetValue: targetValue ?? this.targetValue,
      currentValue: currentValue ?? this.currentValue,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      status: status ?? this.status,
      priority: priority ?? this.priority,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
