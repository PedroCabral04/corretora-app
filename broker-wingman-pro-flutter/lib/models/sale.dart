class Sale {
  final String id;
  final String userId;
  final String? brokerId;
  final String propertyName;
  final String? clientName;
  final double saleValue;
  final double? commissionValue;
  final DateTime saleDate;
  final String? status;
  final String? notes;
  final DateTime? createdAt;

  Sale({
    required this.id,
    required this.userId,
    this.brokerId,
    required this.propertyName,
    this.clientName,
    required this.saleValue,
    this.commissionValue,
    required this.saleDate,
    this.status,
    this.notes,
    this.createdAt,
  });

  factory Sale.fromJson(Map<String, dynamic> json) {
    // Helper to parse value that can be String or num
    double parseDouble(dynamic value) {
      if (value == null) return 0.0;
      if (value is num) return value.toDouble();
      if (value is String) return double.tryParse(value) ?? 0.0;
      return 0.0;
    }

    double? parseDoubleNullable(dynamic value) {
      if (value == null) return null;
      if (value is num) return value.toDouble();
      if (value is String) return double.tryParse(value);
      return null;
    }

    return Sale(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      brokerId: json['broker_id'],
      propertyName: json['property_name'] ?? '',
      clientName: json['client_name'],
      saleValue: parseDouble(json['sale_value']),
      commissionValue: parseDoubleNullable(json['commission_value']),
      saleDate: json['sale_date'] != null
          ? DateTime.parse(json['sale_date'])
          : DateTime.now(),
      status: json['status'],
      notes: json['notes'],
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'property_name': propertyName,
      'client_name': clientName,
      'sale_value': saleValue,
      'commission_value': commissionValue,
      'sale_date': saleDate.toIso8601String().split('T').first,
      'status': status ?? 'completed',
      'notes': notes,
      'broker_id': brokerId,
    };
  }

  Sale copyWith({
    String? id,
    String? userId,
    String? brokerId,
    String? propertyName,
    String? clientName,
    double? saleValue,
    double? commissionValue,
    DateTime? saleDate,
    String? status,
    String? notes,
    DateTime? createdAt,
  }) {
    return Sale(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      brokerId: brokerId ?? this.brokerId,
      propertyName: propertyName ?? this.propertyName,
      clientName: clientName ?? this.clientName,
      saleValue: saleValue ?? this.saleValue,
      commissionValue: commissionValue ?? this.commissionValue,
      saleDate: saleDate ?? this.saleDate,
      status: status ?? this.status,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
