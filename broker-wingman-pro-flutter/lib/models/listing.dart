enum PropertyType { apartamento, casa, sobrado, lote, chacara }

enum ListingStatus { ativo, desativado, vendido, moderacao, agregado }

class Listing {
  final String id;
  final String userId;
  final String? brokerId;
  final String title;
  final String? description;
  final PropertyType propertyType;
  final String? address;
  final String? city;
  final String? state;
  final double? price;
  final double? area;
  final int? bedrooms;
  final int? bathrooms;
  final ListingStatus status;
  final int quantity;
  final String? images;
  final DateTime? createdAt;

  Listing({
    required this.id,
    required this.userId,
    this.brokerId,
    required this.title,
    this.description,
    required this.propertyType,
    this.address,
    this.city,
    this.state,
    this.price,
    this.area,
    this.bedrooms,
    this.bathrooms,
    this.status = ListingStatus.ativo,
    this.quantity = 1,
    this.images,
    this.createdAt,
  });

  factory Listing.fromJson(Map<String, dynamic> json) {
    // Helper to parse value that can be String or num
    double? parseDoubleNullable(dynamic value) {
      if (value == null) return null;
      if (value is num) return value.toDouble();
      if (value is String) return double.tryParse(value);
      return null;
    }

    return Listing(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      brokerId: json['broker_id'],
      title: json['title'] ?? '',
      description: json['description'],
      propertyType: _parsePropertyType(json['property_type']),
      address: json['address'],
      city: json['city'],
      state: json['state'],
      price: parseDoubleNullable(json['price']),
      area: parseDoubleNullable(json['area']),
      bedrooms: json['bedrooms'],
      bathrooms: json['bathrooms'],
      status: _parseStatus(json['status']),
      quantity: json['quantity'] ?? 1,
      images: json['images'],
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'description': description,
      'property_type': propertyTypeLabel,
      'address': address,
      'city': city,
      'state': state,
      'price': price,
      'area': area,
      'bedrooms': bedrooms,
      'bathrooms': bathrooms,
      'status': statusLabel,
      'quantity': quantity,
      'images': images,
      'broker_id': brokerId,
    };
  }

  static PropertyType _parsePropertyType(String? type) {
    switch (type?.toLowerCase()) {
      case 'casa':
        return PropertyType.casa;
      case 'sobrado':
        return PropertyType.sobrado;
      case 'lote':
        return PropertyType.lote;
      case 'chácara':
      case 'chacara':
        return PropertyType.chacara;
      default:
        return PropertyType.apartamento;
    }
  }

  static ListingStatus _parseStatus(String? status) {
    switch (status?.toLowerCase()) {
      case 'desativado':
        return ListingStatus.desativado;
      case 'vendido':
        return ListingStatus.vendido;
      case 'moderação':
      case 'moderacao':
        return ListingStatus.moderacao;
      case 'agregado':
        return ListingStatus.agregado;
      default:
        return ListingStatus.ativo;
    }
  }

  String get propertyTypeLabel {
    switch (propertyType) {
      case PropertyType.apartamento:
        return 'Apartamento';
      case PropertyType.casa:
        return 'Casa';
      case PropertyType.sobrado:
        return 'Sobrado';
      case PropertyType.lote:
        return 'Lote';
      case PropertyType.chacara:
        return 'Chácara';
    }
  }

  String get statusLabel {
    switch (status) {
      case ListingStatus.ativo:
        return 'Ativo';
      case ListingStatus.desativado:
        return 'Desativado';
      case ListingStatus.vendido:
        return 'Vendido';
      case ListingStatus.moderacao:
        return 'Moderação';
      case ListingStatus.agregado:
        return 'Agregado';
    }
  }

  Listing copyWith({
    String? id,
    String? userId,
    String? brokerId,
    String? title,
    String? description,
    PropertyType? propertyType,
    String? address,
    String? city,
    String? state,
    double? price,
    double? area,
    int? bedrooms,
    int? bathrooms,
    ListingStatus? status,
    int? quantity,
    String? images,
    DateTime? createdAt,
  }) {
    return Listing(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      brokerId: brokerId ?? this.brokerId,
      title: title ?? this.title,
      description: description ?? this.description,
      propertyType: propertyType ?? this.propertyType,
      address: address ?? this.address,
      city: city ?? this.city,
      state: state ?? this.state,
      price: price ?? this.price,
      area: area ?? this.area,
      bedrooms: bedrooms ?? this.bedrooms,
      bathrooms: bathrooms ?? this.bathrooms,
      status: status ?? this.status,
      quantity: quantity ?? this.quantity,
      images: images ?? this.images,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
