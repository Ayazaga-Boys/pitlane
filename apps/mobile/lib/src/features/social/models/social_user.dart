import '../../../core/models/presence_status.dart';
import 'follow_status.dart';

class SocialUser {
  const SocialUser({
    required this.id,
    required this.username,
    required this.displayName,
    this.avatarUrl,
    this.bio,
    this.isPrivate = false,
    this.presenceStatus = PresenceStatus.offline,
    this.presenceVisible = true,
    this.followStatus = FollowStatus.none,
    this.followersCount = 0,
    this.followingCount = 0,
  });

  final String id;
  final String username;
  final String displayName;
  final String? avatarUrl;
  final String? bio;
  final bool isPrivate;
  final PresenceStatus presenceStatus;
  final bool presenceVisible;
  final FollowStatus followStatus;
  final int followersCount;
  final int followingCount;

  SocialUser copyWith({
    String? avatarUrl,
    String? bio,
    bool? isPrivate,
    PresenceStatus? presenceStatus,
    bool? presenceVisible,
    FollowStatus? followStatus,
    int? followersCount,
    int? followingCount,
  }) {
    return SocialUser(
      id: id,
      username: username,
      displayName: displayName,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      bio: bio ?? this.bio,
      isPrivate: isPrivate ?? this.isPrivate,
      presenceStatus: presenceStatus ?? this.presenceStatus,
      presenceVisible: presenceVisible ?? this.presenceVisible,
      followStatus: followStatus ?? this.followStatus,
      followersCount: followersCount ?? this.followersCount,
      followingCount: followingCount ?? this.followingCount,
    );
  }
}
