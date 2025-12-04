class Expense {
  final String id;
  final String userId;
  final String? brokerId;
  final String description;
  final double amount;
  final DateTime expenseDate;
  final String? category;
  final DateTime? createdAt;

  Expense({
    required this.id,
    required this.userId,
    this.brokerId,
    required this.description,
    required this.amount,
    required this.expenseDate,
    this.category,
    this.createdAt,
  });

  factory Expense.fromJson(Map<String, dynamic> json) {
    // Helper to parse value that can be String or num
    double parseDouble(dynamic value) {
      if (value == null) return 0.0;
      if (value is num) return value.toDouble();
      if (value is String) return double.tryParse(value) ?? 0.0;
      return 0.0;
    }

    return Expense(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      brokerId: json['broker_id'],
      description: json['description'] ?? '',
      amount: parseDouble(json['amount']),
      expenseDate: json['expense_date'] != null
          ? DateTime.parse(json['expense_date'])
          : DateTime.now(),
      category: json['category'],
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
      'description': description,
      'amount': amount,
      'expense_date': expenseDate.toIso8601String().split('T').first,
      'category': category,
      'created_at': createdAt?.toIso8601String(),
    };
  }

  Expense copyWith({
    String? id,
    String? userId,
    String? brokerId,
    String? description,
    double? amount,
    DateTime? expenseDate,
    String? category,
    DateTime? createdAt,
  }) {
    return Expense(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      brokerId: brokerId ?? this.brokerId,
      description: description ?? this.description,
      amount: amount ?? this.amount,
      expenseDate: expenseDate ?? this.expenseDate,
      category: category ?? this.category,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
