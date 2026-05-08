import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_constants.dart';
import '../data/push_notifications_repository.dart';
import '../models/push_notification.dart';

class PushNotificationController extends AsyncNotifier<String?> {
  @override
  Future<String?> build() async {
    if (!AppConstants.isDev) return null;

    final repository = ref.read(pushNotificationsRepositoryProvider);
    final draft = repository.developmentDeviceDraft();
    await repository.registerDevice(draft);
    return draft.token;
  }

  Future<void> registerToken(DeviceRegistrationDraft draft) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await ref.read(pushNotificationsRepositoryProvider).registerDevice(draft);
      return draft.token;
    });
  }

  Future<void> unregisterCurrentToken() async {
    final token = state.valueOrNull;
    if (token == null) return;

    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      await ref
          .read(pushNotificationsRepositoryProvider)
          .unregisterDevice(token);
      return null;
    });
  }
}

final pushNotificationControllerProvider =
    AsyncNotifierProvider<PushNotificationController, String?>(
  PushNotificationController.new,
);

final pushDeepLinkResolverProvider = Provider<PushDeepLinkResolver>((ref) {
  return const PushDeepLinkResolver();
});

class PushDeepLinkResolver {
  const PushDeepLinkResolver();

  String? resolve(PushPayload payload) {
    final explicit = _safeDeepLink(payload.explicitDeepLink);
    if (explicit != null) return explicit;

    return switch (payload.type) {
      PushNotificationType.helpNearby ||
      PushNotificationType.helpHelperArrived =>
        payload.helpId == null ? null : '/help/${payload.helpId}',
      PushNotificationType.flareInvite ||
      PushNotificationType.flareStarting =>
        payload.flareId == null ? null : '/flares/${payload.flareId}',
      PushNotificationType.dmNew =>
        payload.peerId == null ? null : '/messages/${payload.peerId}',
      PushNotificationType.communityMessage ||
      PushNotificationType.communityInvite ||
      PushNotificationType.system =>
        null,
    };
  }

  String? resolveMap(Map<String, dynamic> data) {
    return resolve(PushPayload.fromMap(data));
  }

  String? _safeDeepLink(String? value) {
    if (value == null || value.isEmpty || !value.startsWith('/')) return null;
    final uri = Uri.tryParse(value);
    if (uri == null || uri.hasScheme || uri.hasAuthority) return null;

    final allowedPrefixes = [
      '/help/',
      '/flares/',
      '/messages/',
      '/communities/',
      '/notifications',
      '/settings/notifications',
    ];
    for (final prefix in allowedPrefixes) {
      if (value == prefix || value.startsWith(prefix)) return value;
    }
    return null;
  }
}
