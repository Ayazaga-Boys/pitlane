import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/app_avatar.dart';
import '../../../shared/widgets/async_paged_list.dart';
import '../../../shared/widgets/v2_state_views.dart';
import '../models/dm_thread.dart';
import '../providers/dm_threads_provider.dart';

class MessagesScreen extends ConsumerWidget {
  const MessagesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final threads = ref.watch(dmThreadsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Mesajlar')),
      body: SafeArea(
        child: threads.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => V2ErrorState(
            message: error.toString(),
            onRetry: () => ref.invalidate(dmThreadsProvider),
          ),
          data: (items) => AsyncPagedList<DmThread>(
            items: items,
            onRefresh: () => ref.read(dmThreadsProvider.notifier).refresh(),
            emptyState: const V2EmptyState(
              icon: Icons.chat_bubble_outline,
              title: 'Henüz mesajın yok',
              body:
                  'Profil veya topluluklardan bir sürücüye mesaj attığında konuşmalar burada görünür.',
              scrollable: true,
            ),
            itemBuilder: (_, item, __) => _ThreadTile(item),
          ),
        ),
      ),
    );
  }
}

class _ThreadTile extends StatelessWidget {
  const _ThreadTile(this.thread);

  final DmThread thread;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.surface2,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.surface3),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.sm,
        ),
        leading: _ThreadAvatar(thread: thread),
        title: Row(
          children: [
            Expanded(
              child: Text(
                thread.displayName,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Text(
              thread.lastMessageAtLabel,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: AppColors.textTertiary),
            ),
          ],
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: AppSpacing.xs),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  thread.lastMessagePreview,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
              ),
              if (thread.unreadCount > 0) ...[
                const SizedBox(width: AppSpacing.sm),
                _UnreadBadge(count: thread.unreadCount),
              ],
            ],
          ),
        ),
        onTap: () => context.push('/messages/${thread.peerId}'),
      ),
    );
  }
}

class _ThreadAvatar extends StatelessWidget {
  const _ThreadAvatar({required this.thread});

  final DmThread thread;

  @override
  Widget build(BuildContext context) {
    return AppAvatar(
      displayName: thread.displayName,
      username: thread.username,
      imageUrl: thread.avatarUrl,
      presenceStatus: thread.presenceStatus,
      presenceVisible: thread.presenceVisible,
    );
  }
}

class _UnreadBadge extends StatelessWidget {
  const _UnreadBadge({required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        color: AppColors.pitRed,
        shape: BoxShape.circle,
      ),
      child: SizedBox.square(
        dimension: AppSpacing.xl,
        child: Center(
          child: Text(
            count > 9 ? '9+' : '$count',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w700,
                ),
          ),
        ),
      ),
    );
  }
}
