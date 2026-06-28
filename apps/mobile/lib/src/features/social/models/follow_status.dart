enum FollowStatus {
  none,
  requested,
  following,
  blocked;

  String get label {
    return switch (this) {
      FollowStatus.none => 'Takip et',
      FollowStatus.requested => 'İstek gönderildi',
      FollowStatus.following => 'Takiptesin',
      FollowStatus.blocked => 'Engellendi',
    };
  }
}
