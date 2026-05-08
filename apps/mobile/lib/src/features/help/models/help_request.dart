class HelpRequest {
  const HelpRequest({
    required this.id,
    required this.requesterId,
    required this.h3Cell,
    required this.issueType,
    required this.status,
    required this.expiresAt,
    required this.createdAt,
    this.description,
    this.helperId,
  });

  factory HelpRequest.fromJson(Map<String, dynamic> json) {
    final data = json['data'] is Map<String, dynamic>
        ? json['data'] as Map<String, dynamic>
        : json;

    return HelpRequest(
      id: data['id'] as String? ?? '',
      requesterId: data['requester_id'] as String? ?? '',
      h3Cell: data['h3_cell'] as String? ?? '',
      issueType: HelpIssueType.fromApiValue(data['issue_type'] as String?),
      description: data['description'] as String?,
      status: HelpRequestStatus.fromApiValue(data['status'] as String?),
      helperId: data['helper_id'] as String?,
      expiresAt: DateTime.tryParse(data['expires_at'] as String? ?? '') ??
          DateTime.now().add(const Duration(minutes: 30)),
      createdAt: DateTime.tryParse(data['created_at'] as String? ?? '') ??
          DateTime.now(),
    );
  }

  final String id;
  final String requesterId;
  final String h3Cell;
  final HelpIssueType issueType;
  final String? description;
  final HelpRequestStatus status;
  final String? helperId;
  final DateTime expiresAt;
  final DateTime createdAt;

  bool get isOpen =>
      status == HelpRequestStatus.open && expiresAt.isAfter(DateTime.now());
}

enum HelpIssueType {
  breakdown('breakdown', 'Arıza', '🔧'),
  flatTire('flat_tire', 'Lastik Patladı', '🛞'),
  fuel('fuel', 'Yakıt Bitti', '⛽'),
  accident('accident', 'Kaza', '⚠️'),
  other('other', 'Diğer', '🆘');

  const HelpIssueType(this.apiValue, this.label, this.emoji);

  final String apiValue;
  final String label;
  final String emoji;

  static HelpIssueType fromApiValue(String? value) {
    for (final type in HelpIssueType.values) {
      if (type.apiValue == value) return type;
    }
    return HelpIssueType.other;
  }
}

enum HelpRequestStatus {
  open('open', 'Yardım bekleniyor'),
  accepted('accepted', 'Yardım yolda'),
  cancelled('cancelled', 'İptal edildi'),
  expired('expired', 'Süresi doldu'),
  resolved('resolved', 'Tamamlandı');

  const HelpRequestStatus(this.apiValue, this.label);

  final String apiValue;
  final String label;

  static HelpRequestStatus fromApiValue(String? value) {
    for (final status in HelpRequestStatus.values) {
      if (status.apiValue == value) return status;
    }
    return HelpRequestStatus.open;
  }
}

class CreateHelpRequestDraft {
  const CreateHelpRequestDraft({
    required this.h3Cell,
    required this.issueType,
    this.description,
    this.vehicleId,
  });

  final String h3Cell;
  final HelpIssueType issueType;
  final String? description;
  final String? vehicleId;

  Map<String, dynamic> toJson() {
    return {
      'h3_cell': h3Cell,
      'issue_type': issueType.apiValue,
      if (description != null && description!.isNotEmpty)
        'description': description,
      if (vehicleId != null && vehicleId!.isNotEmpty) 'vehicle_id': vehicleId,
    };
  }
}
