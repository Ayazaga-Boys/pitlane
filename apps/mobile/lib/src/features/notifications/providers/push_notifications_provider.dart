import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_constants.dart';
import '../data/firebase_push_service.dart';
import '../data/push_notifications_repository.dart';
import '../models/push_notification.dart';

class PushNotificationController extends AsyncNotifier<String?> {
  @override
  Future<String?> build() async {
    final repository = ref.read(pushNotificationsRepositoryProvider);
    final firebasePushService = ref.read(firebasePushServiceProvider);

    final firebaseDraft =
        await firebasePushService.requestDeviceRegistrationDraft();
    if (firebaseDraft != null) {
      await repository.registerDevice(firebaseDraft);
      await firebasePushService.bind(onTokenRefresh: repository.registerDevice);
      return firebaseDraft.token;
    }

    if (!AppConstants.isDev) return null;

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

final firebasePushServiceProvider = Provider<FirebasePushService>((ref) {
  final resolver = ref.watch(pushDeepLinkResolverProvider);
  final service = FirebasePushService(resolver.resolveMap);
  ref.onDispose(service.dispose);
  return service;
});

final pushDeepLinkEventsProvider = StreamProvider<String>((ref) {
  return ref.watch(firebasePushServiceProvider).deepLinks;
});

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
      PushNotificationType.followReceived => '/follow-requests',
      PushNotificationType.followAccepted =>
        payload.username == null ? null : '/profile/${payload.username}',
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
      '/profile/',
      '/follow-requests',
      '/notifications',
      '/settings/notifications',
    ];
    for (final prefix in allowedPrefixes) {
      if (value == prefix || value.startsWith(prefix)) return value;
    }
    return null;
  }
}
