import 'community.dart';

class CommunityMember {
  const CommunityMember({
    required this.id,
    required this.username,
    required this.displayName,
    required this.role,
    this.avatarUrl,
  });

  factory CommunityMember.fromJson(Map<String, dynamic> json) {
    final profile = json['profiles'] is Map<String, dynamic>
        ? json['profiles'] as Map<String, dynamic>
        : const <String, dynamic>{};
    final username =
        json['username'] as String? ?? profile['username'] as String? ?? '';
    final displayName = json['display_name'] as String? ??
        profile['display_name'] as String? ??
        username;

    return CommunityMember(
      id: json['id'] as String? ?? json['user_id'] as String? ?? '',
      username: username,
      displayName: displayName,
      role: json['role'] as String? ?? 'member',
      avatarUrl:
          json['avatar_url'] as String? ?? profile['avatar_url'] as String?,
    );
  }

  final String id;
  final String username;
  final String displayName;
  final String role;
  final String? avatarUrl;
}

class CommunityFlarePreview {
  const CommunityFlarePreview({
    required this.id,
    required this.title,
    required this.startsAtLabel,
    required this.rsvpCount,
  });

  factory CommunityFlarePreview.fromJson(Map<String, dynamic> json) {
    final startsAt = DateTime.tryParse(json['starts_at'] as String? ?? '');

    return CommunityFlarePreview(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      startsAtLabel:
          json['starts_at_label'] as String? ?? _formatStartsAt(startsAt),
      rsvpCount: json['rsvp_count'] as int? ?? 0,
    );
  }

  final String id;
  final String title;
  final String startsAtLabel;
  final int rsvpCount;

  static String _formatStartsAt(DateTime? value) {
    if (value == null) return '';
    final local = value.toLocal();
    final minute = local.minute.toString().padLeft(2, '0');
    return '${local.day}.${local.month} ${local.hour}:$minute';
  }
}

class CommunityDetail {
  const CommunityDetail({
    required this.community,
    required this.members,
    required this.flares,
    this.isJoined = false,
  });

  factory CommunityDetail.fromJson(Map<String, dynamic> json) {
    final data = json['data'] is Map<String, dynamic>
        ? json['data'] as Map<String, dynamic>
        : json;
    return CommunityDetail(
      community: Community.fromJson(data),
      members: (data['members'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(CommunityMember.fromJson)
          .toList(growable: false),
      flares: (data['flares'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(CommunityFlarePreview.fromJson)
          .toList(growable: false),
      isJoined: data['is_joined'] as bool? ?? false,
    );
  }

  final Community community;
  final List<CommunityMember> members;
  final List<CommunityFlarePreview> flares;
  final bool isJoined;

  CommunityDetail copyWith({
    Community? community,
    List<CommunityMember>? members,
    List<CommunityFlarePreview>? flares,
    bool? isJoined,
  }) {
    return CommunityDetail(
      community: community ?? this.community,
      members: members ?? this.members,
      flares: flares ?? this.flares,
      isJoined: isJoined ?? this.isJoined,
    );
  }
}
