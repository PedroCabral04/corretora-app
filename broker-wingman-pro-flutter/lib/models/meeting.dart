enum MeetingType { presencial, online, telefone }

enum MeetingStatus { agendada, realizada, cancelada }

class Meeting {
  final String id;
  final String userId;
  final String? brokerId;
  final String title;
  final String? description;
  final String? clientName;
  final String? location;
  final DateTime meetingDate;
  final MeetingType meetingType;
  final MeetingStatus status;
  final String? summary;
  final DateTime? createdAt;

  Meeting({
    required this.id,
    required this.userId,
    this.brokerId,
    required this.title,
    this.description,
    this.clientName,
    this.location,
    required this.meetingDate,
    this.meetingType = MeetingType.presencial,
    this.status = MeetingStatus.agendada,
    this.summary,
    this.createdAt,
  });

  factory Meeting.fromJson(Map<String, dynamic> json) {
    return Meeting(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      brokerId: json['broker_id'],
      title: json['title'] ?? '',
      description: json['description'],
      clientName: json['client_name'],
      location: json['location'],
      meetingDate: json['meeting_date'] != null
          ? DateTime.parse(json['meeting_date'])
          : DateTime.now(),
      meetingType: _parseMeetingType(json['meeting_type']),
      status: _parseStatus(json['status']),
      summary: json['summary'],
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'description': description,
      'client_name': clientName,
      'location': location,
      'meeting_date': meetingDate.toIso8601String().split('T').first,
      'status': statusValue,
      'broker_id': brokerId,
    };
  }

  static MeetingType _parseMeetingType(String? type) {
    switch (type?.toLowerCase()) {
      case 'online':
        return MeetingType.online;
      case 'telefone':
        return MeetingType.telefone;
      default:
        return MeetingType.presencial;
    }
  }

  static MeetingStatus _parseStatus(String? status) {
    switch (status?.toLowerCase()) {
      case 'realizada':
      case 'completed':
        return MeetingStatus.realizada;
      case 'cancelada':
      case 'cancelled':
        return MeetingStatus.cancelada;
      case 'agendada':
      case 'scheduled':
      default:
        return MeetingStatus.agendada;
    }
  }

  String get meetingTypeLabel {
    switch (meetingType) {
      case MeetingType.presencial:
        return 'Presencial';
      case MeetingType.online:
        return 'Online';
      case MeetingType.telefone:
        return 'Telefone';
    }
  }

  String get meetingTypeValue {
    switch (meetingType) {
      case MeetingType.presencial:
        return 'presencial';
      case MeetingType.online:
        return 'online';
      case MeetingType.telefone:
        return 'telefone';
    }
  }

  String get statusLabel {
    switch (status) {
      case MeetingStatus.agendada:
        return 'Agendada';
      case MeetingStatus.realizada:
        return 'Realizada';
      case MeetingStatus.cancelada:
        return 'Cancelada';
    }
  }

  String get statusValue {
    switch (status) {
      case MeetingStatus.agendada:
        return 'scheduled';
      case MeetingStatus.realizada:
        return 'completed';
      case MeetingStatus.cancelada:
        return 'cancelled';
    }
  }

  Meeting copyWith({
    String? id,
    String? userId,
    String? brokerId,
    String? title,
    String? description,
    String? clientName,
    String? location,
    DateTime? meetingDate,
    MeetingType? meetingType,
    MeetingStatus? status,
    String? summary,
    DateTime? createdAt,
  }) {
    return Meeting(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      brokerId: brokerId ?? this.brokerId,
      title: title ?? this.title,
      description: description ?? this.description,
      clientName: clientName ?? this.clientName,
      location: location ?? this.location,
      meetingDate: meetingDate ?? this.meetingDate,
      meetingType: meetingType ?? this.meetingType,
      status: status ?? this.status,
      summary: summary ?? this.summary,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
