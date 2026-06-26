enum PushNotificationType {
  helpNearby('help_nearby'),
  helpHelperArrived('help_helper_arrived'),
  flareInvite('flare_invite'),
  flareStarting('flare_starting'),
  dmNew('dm_new'),
  communityMessage('community_message'),
  communityInvite('community_invite'),
  system('system');

  const PushNotificationType(this.apiValue);

  final String apiValue;

  static PushNotificationType fromApiValue(String? value) {
    for (final type in PushNotificationType.values) {
      if (type.apiValue == value) return type;
    }
    return PushNotificationType.system;
  }
}

class PushPayload {
  const PushPayload({required this.type, required this.data});

  factory PushPayload.fromMap(Map<String, dynamic> data) {
    return PushPayload(
      type: PushNotificationType.fromApiValue(data['type'] as String?),
      data: data,
    );
  }

  final PushNotificationType type;
  final Map<String, dynamic> data;

  String? get explicitDeepLink => data['deep_link'] as String?;
  String? get helpId => data['help_id'] as String?;
  String? get flareId => data['flare_id'] as String?;
  String? get peerId =>
      data['peer_id'] as String? ?? data['sender_id'] as String?;
}

class DeviceRegistrationDraft {
  const DeviceRegistrationDraft({
    required this.platform,
    required this.token,
    this.appBuild,
  });

  final String platform;
  final String token;
  final String? appBuild;

  Map<String, dynamic> toJson() {
    return {
      'platform': platform,
      'token': token,
      if (appBuild != null) 'app_build': appBuild,
    };
  }
}
