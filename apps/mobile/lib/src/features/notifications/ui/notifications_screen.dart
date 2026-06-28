import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/async_paged_list.dart';
import '../../../shared/widgets/v2_state_views.dart';
import '../models/rollpit_notification.dart';
import '../providers/notifications_provider.dart';
import '../providers/push_notifications_provider.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(notificationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bildirimler'),
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all),
            tooltip: 'Hepsini okundu işaretle',
            onPressed: () =>
                ref.read(notificationsProvider.notifier).markAllRead(),
          ),
          IconButton(
            icon: const Icon(Icons.tune),
            tooltip: 'Bildirim ayarları',
            onPressed: () => context.push('/settings/notifications'),
          ),
        ],
      ),
      body: SafeArea(
        child: notifications.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => V2ErrorState(
            message: error.toString(),
            onRetry: () => ref.invalidate(notificationsProvider),
          ),
          data: (items) => AsyncPagedList<RollpitNotification>(
            items: items,
            onRefresh: () => ref.read(notificationsProvider.notifier).refresh(),
            emptyState: const V2EmptyState(
              icon: Icons.notifications_none,
              title: 'Bildirim yok',
              scrollable: true,
            ),
            itemBuilder: (_, item, __) => _NotificationTile(item),
          ),
        ),
      ),
    );
  }
}

class _NotificationTile extends ConsumerWidget {
  const _NotificationTile(this.notification);

  final RollpitNotification notification;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: notification.isRead ? AppColors.surface2 : AppColors.surface3,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(
          color: notification.isRead ? AppColors.surface3 : AppColors.pitRed,
        ),
      ),
      child: ListTile(
        leading: Icon(_iconFor(notification.type), color: AppColors.pitRed),
        title: Text(notification.title),
        subtitle: Text(notification.body),
        trailing: Text(
          notification.createdAtLabel,
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: AppColors.textTertiary),
        ),
        onTap: () async {
          await ref
              .read(notificationsProvider.notifier)
              .markRead(notification.id);
          if (!context.mounted) return;
          final deepLink = notification.deepLink;
          if (deepLink != null && deepLink.isNotEmpty) {
            final safeDeepLink =
                ref.read(pushDeepLinkResolverProvider).resolveMap({
              'type': notification.type.apiValue,
              'deep_link': deepLink,
            });
            if (safeDeepLink != null) context.push(safeDeepLink);
          }
        },
      ),
    );
  }

  IconData _iconFor(RollpitNotificationType type) {
    return switch (type) {
      RollpitNotificationType.helpNearby => Icons.health_and_safety_outlined,
      RollpitNotificationType.flareInvite ||
      RollpitNotificationType.flareStarting =>
        Icons.local_fire_department_outlined,
      RollpitNotificationType.dmNew => Icons.chat_bubble_outline,
      RollpitNotificationType.communityMessage => Icons.groups_outlined,
      RollpitNotificationType.system => Icons.info_outline,
    };
  }
}
