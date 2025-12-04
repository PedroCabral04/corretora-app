class Broker {
  final String id;
  final String userId;
  final String name;
  final String email;
  final String? phone;
  final String? creci;
  final int totalSales;
  final int totalListings;
  final double monthlyExpenses;
  final double totalValue;
  final DateTime? createdAt;

  Broker({
    required this.id,
    required this.userId,
    required this.name,
    required this.email,
    this.phone,
    this.creci,
    this.totalSales = 0,
    this.totalListings = 0,
    this.monthlyExpenses = 0,
    this.totalValue = 0,
    this.createdAt,
  });

  factory Broker.fromJson(Map<String, dynamic> json) {
    return Broker(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
      creci: json['creci'],
      totalSales: json['total_sales'] ?? 0,
      totalListings: json['total_listings'] ?? 0,
      monthlyExpenses: (json['monthly_expenses'] ?? 0).toDouble(),
      totalValue: (json['total_value'] ?? 0).toDouble(),
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'name': name,
      'email': email,
      'phone': phone,
      'creci': creci,
      'total_sales': totalSales,
      'total_listings': totalListings,
      'monthly_expenses': monthlyExpenses,
      'total_value': totalValue,
      'created_at': createdAt?.toIso8601String(),
    };
  }

  Broker copyWith({
    String? id,
    String? userId,
    String? name,
    String? email,
    String? phone,
    String? creci,
    int? totalSales,
    int? totalListings,
    double? monthlyExpenses,
    double? totalValue,
    DateTime? createdAt,
  }) {
    return Broker(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      creci: creci ?? this.creci,
      totalSales: totalSales ?? this.totalSales,
      totalListings: totalListings ?? this.totalListings,
      monthlyExpenses: monthlyExpenses ?? this.monthlyExpenses,
      totalValue: totalValue ?? this.totalValue,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
