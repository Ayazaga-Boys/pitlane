enum FlareRsvpStatus {
  going('going', 'Gidiyorum'),
  maybe('maybe', 'Belki'),
  notGoing('not_going', 'Gitmiyorum');

  const FlareRsvpStatus(this.apiValue, this.label);

  final String apiValue;
  final String label;

  static FlareRsvpStatus? fromApiValue(String? value) {
    for (final status in FlareRsvpStatus.values) {
      if (status.apiValue == value) return status;
    }
    return null;
  }
}

class FlareAttendee {
  const FlareAttendee({
    required this.id,
    required this.displayName,
    required this.rsvpStatus,
    this.username,
    this.avatarUrl,
  });

  factory FlareAttendee.fromJson(Map<String, dynamic> json) {
    return FlareAttendee(
      id: json['id'] as String? ?? json['user_id'] as String? ?? '',
      displayName:
          json['display_name'] as String? ?? json['username'] as String? ?? '',
      username: json['username'] as String?,
      avatarUrl: json['avatar_url'] as String?,
      rsvpStatus:
          FlareRsvpStatus.fromApiValue(json['rsvp_status'] as String?) ??
              FlareRsvpStatus.going,
    );
  }

  final String id;
  final String displayName;
  final FlareRsvpStatus rsvpStatus;
  final String? username;
  final String? avatarUrl;
}

class Flare {
  const Flare({
    required this.id,
    required this.title,
    required this.h3Cell,
    required this.startsAt,
    this.description,
    this.endsAt,
    this.communityId,
    this.communityName,
    this.coverUrl,
    this.currentRsvpStatus,
    this.goingCount = 0,
    this.maybeCount = 0,
    this.notGoingCount = 0,
    this.attendees = const [],
  });

  factory Flare.fromJson(Map<String, dynamic> json) {
    final data = json['data'] is Map<String, dynamic>
        ? json['data'] as Map<String, dynamic>
        : json;
    return Flare(
      id: data['id'] as String? ?? '',
      title: data['title'] as String? ?? '',
      description: data['description'] as String?,
      h3Cell: data['h3_cell'] as String? ?? '',
      startsAt: DateTime.tryParse(data['starts_at'] as String? ?? '') ??
          DateTime.now(),
      endsAt: DateTime.tryParse(data['ends_at'] as String? ?? ''),
      communityId: data['community_id'] as String?,
      communityName: data['community_name'] as String?,
      coverUrl: data['cover_url'] as String?,
      currentRsvpStatus:
          FlareRsvpStatus.fromApiValue(data['current_rsvp_status'] as String?),
      goingCount:
          data['going_count'] as int? ?? data['rsvp_count'] as int? ?? 0,
      maybeCount: data['maybe_count'] as int? ?? 0,
      notGoingCount: data['not_going_count'] as int? ?? 0,
      attendees: (data['attendees'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(FlareAttendee.fromJson)
          .toList(growable: false),
    );
  }

  final String id;
  final String title;
  final String? description;
  final String h3Cell;
  final DateTime startsAt;
  final DateTime? endsAt;
  final String? communityId;
  final String? communityName;
  final String? coverUrl;
  final FlareRsvpStatus? currentRsvpStatus;
  final int goingCount;
  final int maybeCount;
  final int notGoingCount;
  final List<FlareAttendee> attendees;

  bool get hasEnded {
    final end = endsAt ?? startsAt.add(const Duration(hours: 2));
    return end.isBefore(DateTime.now());
  }

  Flare copyWith({
    FlareRsvpStatus? currentRsvpStatus,
    int? goingCount,
    int? maybeCount,
    int? notGoingCount,
  }) {
    return Flare(
      id: id,
      title: title,
      description: description,
      h3Cell: h3Cell,
      startsAt: startsAt,
      endsAt: endsAt,
      communityId: communityId,
      communityName: communityName,
      coverUrl: coverUrl,
      currentRsvpStatus: currentRsvpStatus ?? this.currentRsvpStatus,
      goingCount: goingCount ?? this.goingCount,
      maybeCount: maybeCount ?? this.maybeCount,
      notGoingCount: notGoingCount ?? this.notGoingCount,
      attendees: attendees,
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
