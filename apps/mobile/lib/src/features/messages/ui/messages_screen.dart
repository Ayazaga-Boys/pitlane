import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/presence_dot.dart';
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
          error: (error, _) => _MessagesError(message: error.toString()),
          data: (items) => RefreshIndicator(
            onRefresh: () => ref.read(dmThreadsProvider.notifier).refresh(),
            child: items.isEmpty
                ? const _EmptyMessages()
                : ListView.separated(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    itemCount: items.length,
                    separatorBuilder: (_, __) =>
                        const SizedBox(height: AppSpacing.md),
                    itemBuilder: (_, index) => _ThreadTile(items[index]),
                  ),
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
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textTertiary,
                  ),
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
    return Stack(
      clipBehavior: Clip.none,
      children: [
        CircleAvatar(
          radius: AppSpacing.xl,
          backgroundColor: AppColors.surface3,
          backgroundImage:
              thread.avatarUrl == null ? null : NetworkImage(thread.avatarUrl!),
          child: thread.avatarUrl == null
              ? Text(thread.displayName.characters.first.toUpperCase())
              : null,
        ),
        Positioned(
          right: -1,
          bottom: -1,
          child: PresenceDot(
            status: thread.presenceStatus,
            visible: thread.presenceVisible,
          ),
        ),
      ],
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

class _EmptyMessages extends StatelessWidget {
  const _EmptyMessages();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.xl),
      children: [
        const SizedBox(height: AppSpacing.xl2),
        const Icon(
          Icons.chat_bubble_outline,
          size: AppSpacing.xl3,
          color: AppColors.textTertiary,
        ),
        const SizedBox(height: AppSpacing.lg),
        Text(
          'Henüz mesajın yok',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          'Profil veya topluluklardan bir sürücüye mesaj attığında konuşmalar burada görünür.',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
        ),
      ],
    );
  }
}

class _MessagesError extends StatelessWidget {
  const _MessagesError({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Text(
          message,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: AppColors.error,
              ),
        ),
      ),
    );
  }
}
