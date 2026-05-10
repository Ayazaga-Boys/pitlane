import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/notifications_repository.dart';
import '../models/pitlane_notification.dart';

class NotificationsNotifier extends AsyncNotifier<List<PitlaneNotification>> {
  @override
  Future<List<PitlaneNotification>> build() {
    return ref.read(notificationsRepositoryProvider).listNotifications();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(notificationsRepositoryProvider).listNotifications(),
    );
  }

  Future<void> markAllRead() async {
    final notifications = state.valueOrNull ?? const <PitlaneNotification>[];
    state = AsyncData(
      notifications.map((item) => item.copyWith(isRead: true)).toList(),
    );
    await ref.read(notificationsRepositoryProvider).markAllRead();
  }

  Future<void> markRead(String id) async {
    final notifications = state.valueOrNull ?? const <PitlaneNotification>[];
    state = AsyncData(
      notifications
          .map((item) => item.id == id ? item.copyWith(isRead: true) : item)
          .toList(),
    );
    await ref.read(notificationsRepositoryProvider).markRead(id);
  }
}

final notificationsProvider =
    AsyncNotifierProvider<NotificationsNotifier, List<PitlaneNotification>>(
  NotificationsNotifier.new,
);

class NotificationPreferencesNotifier
    extends Notifier<NotificationPreferences> {
  @override
  NotificationPreferences build() {
    return const NotificationPreferences();
  }

  void update(NotificationPreferences next) {
    state = next;
  }
}

final notificationPreferencesProvider =
    NotifierProvider<NotificationPreferencesNotifier, NotificationPreferences>(
  NotificationPreferencesNotifier.new,
);
