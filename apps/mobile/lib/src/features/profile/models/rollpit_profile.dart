class RollpitProfile {
  const RollpitProfile({
    required this.id,
    required this.username,
    this.displayName,
    this.avatarUrl,
    this.bio,
    this.ghostMode = false,
    this.isVerified = false,
  });

  factory RollpitProfile.fromJson(Map<String, dynamic> json) {
    return RollpitProfile(
      id: json['id'] as String,
      username: json['username'] as String? ?? '',
      displayName: json['display_name'] as String?,
      avatarUrl: json['avatar_url'] as String?,
      bio: json['bio'] as String?,
      ghostMode: json['ghost_mode'] as bool? ?? false,
      isVerified: json['is_verified'] as bool? ?? false,
    );
  }

  final String id;
  final String username;
  final String? displayName;
  final String? avatarUrl;
  final String? bio;
  final bool ghostMode;
  final bool isVerified;

  bool get hasCompletedIdentity {
    return username.isNotEmpty &&
        displayName != null &&
        displayName!.isNotEmpty;
  }
}
