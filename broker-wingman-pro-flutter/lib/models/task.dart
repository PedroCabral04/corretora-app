enum TaskStatus { backlog, emProgresso, emRevisao, concluida }

enum TaskPriority { low, medium, high }

class Task {
  final String id;
  final String userId;
  final String? brokerId;
  final String title;
  final String? description;
  final DateTime? dueDate;
  final TaskStatus status;
  final TaskPriority priority;
  final DateTime? createdAt;

  Task({
    required this.id,
    required this.userId,
    this.brokerId,
    required this.title,
    this.description,
    this.dueDate,
    this.status = TaskStatus.backlog,
    this.priority = TaskPriority.medium,
    this.createdAt,
  });

  factory Task.fromJson(Map<String, dynamic> json) {
    return Task(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      brokerId: json['broker_id'],
      title: json['title'] ?? '',
      description: json['description'],
      dueDate: json['due_date'] != null
          ? DateTime.parse(json['due_date'])
          : null,
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
      'due_date': dueDate?.toIso8601String().split('T').first,
      'status': statusValue,
      'priority': priorityValue,
      'created_at': createdAt?.toIso8601String(),
    };
  }

  static TaskStatus _parseStatus(String? status) {
    switch (status) {
      case 'Em Progresso':
        return TaskStatus.emProgresso;
      case 'Em Revisão':
        return TaskStatus.emRevisao;
      case 'Concluída':
        return TaskStatus.concluida;
      default:
        return TaskStatus.backlog;
    }
  }

  static TaskPriority _parsePriority(String? priority) {
    switch (priority) {
      case 'high':
      case 'Alta':
        return TaskPriority.high;
      case 'low':
      case 'Baixa':
        return TaskPriority.low;
      case 'medium':
      case 'Média':
      default:
        return TaskPriority.medium;
    }
  }

  String get statusLabel {
    switch (status) {
      case TaskStatus.backlog:
        return 'Backlog';
      case TaskStatus.emProgresso:
        return 'Em Progresso';
      case TaskStatus.emRevisao:
        return 'Em Revisão';
      case TaskStatus.concluida:
        return 'Concluída';
    }
  }

  String get statusValue {
    switch (status) {
      case TaskStatus.backlog:
        return 'Backlog';
      case TaskStatus.emProgresso:
        return 'Em Progresso';
      case TaskStatus.emRevisao:
        return 'Em Revisão';
      case TaskStatus.concluida:
        return 'Concluída';
    }
  }

  String get priorityLabel {
    switch (priority) {
      case TaskPriority.low:
        return 'Baixa';
      case TaskPriority.medium:
        return 'Média';
      case TaskPriority.high:
        return 'Alta';
    }
  }

  String get priorityValue {
    switch (priority) {
      case TaskPriority.low:
        return 'Baixa';
      case TaskPriority.medium:
        return 'Média';
      case TaskPriority.high:
        return 'Alta';
    }
  }

  Task copyWith({
    String? id,
    String? userId,
    String? brokerId,
    String? title,
    String? description,
    DateTime? dueDate,
    TaskStatus? status,
    TaskPriority? priority,
    DateTime? createdAt,
  }) {
    return Task(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      brokerId: brokerId ?? this.brokerId,
      title: title ?? this.title,
      description: description ?? this.description,
      dueDate: dueDate ?? this.dueDate,
      status: status ?? this.status,
      priority: priority ?? this.priority,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
