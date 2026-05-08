enum PitlaneNotificationType {
  helpNearby('help_nearby', 'Yardım'),
  flareInvite('flare_invite', 'Flare'),
  flareStarting('flare_starting', 'Flare'),
  dmNew('dm_new', 'Mesaj'),
  communityMessage('community_message', 'Topluluk'),
  system('system', 'Sistem');

  const PitlaneNotificationType(this.apiValue, this.label);

  final String apiValue;
  final String label;

  static PitlaneNotificationType fromApiValue(String? value) {
    for (final type in PitlaneNotificationType.values) {
      if (type.apiValue == value) return type;
    }
    return PitlaneNotificationType.system;
  }
}

class PitlaneNotification {
  const PitlaneNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.createdAtLabel,
    this.deepLink,
    this.isRead = false,
  });

  factory PitlaneNotification.fromJson(Map<String, dynamic> json) {
    return PitlaneNotification(
      id: json['id'] as String? ?? '',
      type: PitlaneNotificationType.fromApiValue(json['type'] as String?),
      title: json['title'] as String? ?? '',
      body: json['body'] as String? ?? '',
      deepLink: json['deep_link'] as String?,
      createdAtLabel: json['created_at_label'] as String? ??
          json['created_at'] as String? ??
          '',
      isRead: json['is_read'] as bool? ?? false,
    );
  }

  final String id;
  final PitlaneNotificationType type;
  final String title;
  final String body;
  final String? deepLink;
  final String createdAtLabel;
  final bool isRead;

  PitlaneNotification copyWith({bool? isRead}) {
    return PitlaneNotification(
      id: id,
      type: type,
      title: title,
      body: body,
      deepLink: deepLink,
      createdAtLabel: createdAtLabel,
      isRead: isRead ?? this.isRead,
    );
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
