import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
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
          error: (error, _) => _NotificationsError(message: error.toString()),
          data: (items) => RefreshIndicator(
            onRefresh: () => ref.read(notificationsProvider.notifier).refresh(),
            child: items.isEmpty
                ? const _EmptyNotifications()
                : ListView.separated(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    itemCount: items.length,
                    separatorBuilder: (_, __) =>
                        const SizedBox(height: AppSpacing.md),
                    itemBuilder: (_, index) => _NotificationTile(items[index]),
                  ),
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

class _EmptyNotifications extends StatelessWidget {
  const _EmptyNotifications();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.xl),
      children: [
        const SizedBox(height: AppSpacing.xl2),
        const Icon(
          Icons.notifications_none,
          size: AppSpacing.xl3,
          color: AppColors.textTertiary,
        ),
        const SizedBox(height: AppSpacing.lg),
        Text(
          'Bildirim yok',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleLarge,
        ),
      ],
    );
  }
}

class _NotificationsError extends StatelessWidget {
  const _NotificationsError({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Text(
          message,
          textAlign: TextAlign.center,
          style: Theme.of(
            context,
          ).textTheme.bodyLarge?.copyWith(color: AppColors.error),
        ),
      ),
    );
  }
}
