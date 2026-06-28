enum RollpitNotificationType {
  helpNearby('help_nearby', 'Yardım'),
  flareInvite('flare_invite', 'Flare'),
  flareStarting('flare_starting', 'Flare'),
  dmNew('dm_new', 'Mesaj'),
  communityMessage('community_message', 'Topluluk'),
  followReceived('follow_received', 'Takip'),
  followAccepted('follow_accepted', 'Takip'),
  system('system', 'Sistem');

  const RollpitNotificationType(this.apiValue, this.label);

  final String apiValue;
  final String label;

  static RollpitNotificationType fromApiValue(String? value) {
    for (final type in RollpitNotificationType.values) {
      if (type.apiValue == value) return type;
    }
    return RollpitNotificationType.system;
  }
}

class RollpitNotification {
  const RollpitNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.createdAtLabel,
    this.deepLink,
    this.isRead = false,
  });

  factory RollpitNotification.fromJson(Map<String, dynamic> json) {
    final data = json['data'];
    final deepLinkFromData = data is Map<String, dynamic>
        ? data['deep_link'] as String? ??
            _deepLinkFromNotificationData(json['type'] as String?, data)
        : null;

    return RollpitNotification(
      id: json['id'] as String? ?? '',
      type: RollpitNotificationType.fromApiValue(json['type'] as String?),
      title: json['title'] as String? ?? '',
      body: json['body'] as String? ?? '',
      deepLink: json['deep_link'] as String? ?? deepLinkFromData,
      createdAtLabel: json['created_at_label'] as String? ??
          json['created_at'] as String? ??
          '',
      isRead: json['is_read'] as bool? ?? false,
    );
  }

  final String id;
  final RollpitNotificationType type;
  final String title;
  final String body;
  final String? deepLink;
  final String createdAtLabel;
  final bool isRead;

  RollpitNotification copyWith({bool? isRead}) {
    return RollpitNotification(
      id: id,
      type: type,
      title: title,
      body: body,
      deepLink: deepLink,
      createdAtLabel: createdAtLabel,
      isRead: isRead ?? this.isRead,
    );
  }

  static String? _deepLinkFromNotificationData(
    String? type,
    Map<String, dynamic> data,
  ) {
    return switch (RollpitNotificationType.fromApiValue(type)) {
      RollpitNotificationType.helpNearby =>
        data['help_id'] == null ? null : '/help/${data['help_id']}',
      RollpitNotificationType.flareInvite ||
      RollpitNotificationType.flareStarting =>
        data['flare_id'] == null ? null : '/flares/${data['flare_id']}',
      RollpitNotificationType.dmNew =>
        data['peer_id'] == null ? null : '/messages/${data['peer_id']}',
      RollpitNotificationType.communityMessage => data['community_id'] == null
          ? null
          : '/communities/${data['community_id']}/messages',
      RollpitNotificationType.followReceived => '/follow-requests',
      RollpitNotificationType.followAccepted =>
        data['username'] == null ? null : '/profile/${data['username']}',
      RollpitNotificationType.system => null,
    };
  }
}

class NotificationPreferences {
  const NotificationPreferences({
    this.helpNearby = true,
    this.helpHelperArrived = true,
    this.flareInvite = true,
    this.flareStarting = true,
    this.dmNew = true,
    this.communityMessage = false,
    this.communityInvite = true,
    this.system = true,
  });

  final bool helpNearby;
  final bool helpHelperArrived;
  final bool flareInvite;
  final bool flareStarting;
  final bool dmNew;
  final bool communityMessage;
  final bool communityInvite;
  final bool system;

  NotificationPreferences copyWith({
    bool? helpNearby,
    bool? helpHelperArrived,
    bool? flareInvite,
    bool? flareStarting,
    bool? dmNew,
    bool? communityMessage,
    bool? communityInvite,
    bool? system,
  }) {
    return NotificationPreferences(
      helpNearby: helpNearby ?? this.helpNearby,
      helpHelperArrived: helpHelperArrived ?? this.helpHelperArrived,
      flareInvite: flareInvite ?? this.flareInvite,
      flareStarting: flareStarting ?? this.flareStarting,
      dmNew: dmNew ?? this.dmNew,
      communityMessage: communityMessage ?? this.communityMessage,
      communityInvite: communityInvite ?? this.communityInvite,
      system: system ?? this.system,
    );
  }
}
