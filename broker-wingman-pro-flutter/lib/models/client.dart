class Client {
  final String id;
  final String userId;
  final String? brokerId;
  final String name;
  final String? email;
  final String? phone;
  final String? cpf;
  final String? address;
  final String? notes;
  final String? status;
  final String? source;
  final DateTime? createdAt;

  Client({
    required this.id,
    required this.userId,
    this.brokerId,
    required this.name,
    this.email,
    this.phone,
    this.cpf,
    this.address,
    this.notes,
    this.status,
    this.source,
    this.createdAt,
  });

  factory Client.fromJson(Map<String, dynamic> json) {
    return Client(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      brokerId: json['broker_id'],
      name: json['name'] ?? '',
      email: json['email'],
      phone: json['phone'],
      cpf: json['cpf'],
      address: json['address'],
      notes: json['notes'],
      status: json['status'] ?? 'active',
      source: json['source'],
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'email': email,
      'phone': phone,
      'cpf': cpf,
      'address': address,
      'notes': notes,
      'status': status ?? 'active',
      'source': source,
      'broker_id': brokerId,
    };
  }

  String get statusLabel {
    switch (status?.toLowerCase()) {
      case 'contacted':
        return 'Contactado';
      case 'negotiating':
        return 'Em Negociação';
      case 'closed':
        return 'Fechado';
      case 'lost':
        return 'Perdido';
      case 'active':
      default:
        return 'Ativo';
    }
  }

  bool get isActive => status?.toLowerCase() == 'active' || status == null;

  Client copyWith({
    String? id,
    String? userId,
    String? brokerId,
    String? name,
    String? email,
    String? phone,
    String? cpf,
    String? address,
    String? notes,
    String? status,
    String? source,
    DateTime? createdAt,
  }) {
    return Client(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      brokerId: brokerId ?? this.brokerId,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      cpf: cpf ?? this.cpf,
      address: address ?? this.address,
      notes: notes ?? this.notes,
      status: status ?? this.status,
      source: source ?? this.source,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
