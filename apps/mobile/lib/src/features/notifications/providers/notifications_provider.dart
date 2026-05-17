import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/notifications_repository.dart';
import '../models/rollpit_notification.dart';

class NotificationsNotifier extends AsyncNotifier<List<RollpitNotification>> {
  @override
  Future<List<RollpitNotification>> build() {
    return ref.read(notificationsRepositoryProvider).listNotifications();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(notificationsRepositoryProvider).listNotifications(),
    );
  }

  Future<void> markAllRead() async {
    final notifications = state.valueOrNull ?? const <RollpitNotification>[];
    state = AsyncData(
      notifications.map((item) => item.copyWith(isRead: true)).toList(),
    );
    await ref.read(notificationsRepositoryProvider).markAllRead();
  }

  Future<void> markRead(String id) async {
    final notifications = state.valueOrNull ?? const <RollpitNotification>[];
    state = AsyncData(
      notifications
          .map((item) => item.id == id ? item.copyWith(isRead: true) : item)
          .toList(),
    );
    await ref.read(notificationsRepositoryProvider).markRead(id);
  }
}

final notificationsProvider =
    AsyncNotifierProvider<NotificationsNotifier, List<RollpitNotification>>(
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
