class Flare {
  const Flare({
    required this.id,
    required this.title,
    required this.h3Cell,
    required this.startsAt,
    this.description,
    this.endsAt,
    this.communityId,
    this.coverUrl,
  });

  final String id;
  final String title;
  final String? description;
  final String h3Cell;
  final DateTime startsAt;
  final DateTime? endsAt;
  final String? communityId;
  final String? coverUrl;

  factory Flare.fromJson(Map<String, dynamic> json) {
    return Flare(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      h3Cell: json['h3_cell'] as String? ?? '',
      startsAt: DateTime.tryParse(json['starts_at'] as String? ?? '') ??
          DateTime.now(),
      endsAt: DateTime.tryParse(json['ends_at'] as String? ?? ''),
      communityId: json['community_id'] as String?,
      coverUrl: json['cover_url'] as String?,
    );
  }
}

class CreateFlareDraft {
  const CreateFlareDraft({
    required this.title,
    required this.h3Cell,
    required this.startsAt,
    this.description,
    this.endsAt,
    this.communityId,
    this.coverUrl,
  });

  final String title;
  final String? description;
  final String h3Cell;
  final DateTime startsAt;
  final DateTime? endsAt;
  final String? communityId;
  final String? coverUrl;

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'h3_cell': h3Cell,
      'starts_at': startsAt.toUtc().toIso8601String(),
      if (description != null && description!.isNotEmpty)
        'description': description,
      if (endsAt != null) 'ends_at': endsAt!.toUtc().toIso8601String(),
      if (communityId != null && _isUuid(communityId!))
        'community_id': communityId,
      if (coverUrl != null && coverUrl!.isNotEmpty) 'cover_url': coverUrl,
    };
  }

  static bool _isUuid(String value) {
    return RegExp(
      r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
    ).hasMatch(value);
  }
}
