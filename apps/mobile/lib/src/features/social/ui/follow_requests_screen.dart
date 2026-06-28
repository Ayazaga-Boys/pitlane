import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/async_paged_list.dart';
import '../../../shared/widgets/rollpit_button.dart';
import '../../../shared/widgets/user_list_tile_v2.dart';
import '../../../shared/widgets/v2_state_views.dart';
import '../models/follow_request.dart';
import '../providers/follow_requests_provider.dart';

class FollowRequestsScreen extends ConsumerWidget {
  const FollowRequestsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final requests = ref.watch(followRequestsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Takip istekleri')),
      body: SafeArea(
        child: requests.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => V2ErrorState(
            message: error.toString(),
            onRetry: () => ref.invalidate(followRequestsProvider),
          ),
          data: (items) => AsyncPagedList<FollowRequest>(
            items: items,
            onRefresh: () =>
                ref.read(followRequestsProvider.notifier).refresh(),
            emptyState: const V2EmptyState(
              icon: Icons.person_add_disabled_outlined,
              title: 'Bekleyen istek yok',
              body: 'Yeni takip istekleri geldiğinde burada görünür.',
              scrollable: true,
            ),
            itemBuilder: (_, item, __) => _FollowRequestCard(request: item),
          ),
        ),
      ),
    );
  }
}

class _FollowRequestCard extends ConsumerWidget {
  const _FollowRequestCard({required this.request});

  final FollowRequest request;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = request.user;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.surface2,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.surface3),
      ),
      child: Padding(
        padding: const EdgeInsets.only(bottom: AppSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            UserListTileV2(
              displayName: user.displayName,
              username: user.username,
              avatarUrl: user.avatarUrl,
              subtitle: request.createdAtLabel,
              presenceStatus: user.presenceStatus,
              presenceVisible: user.presenceVisible,
              onTap: () => context.push('/profile/${user.username}'),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: Row(
                children: [
                  Expanded(
                    child: RollpitButton(
                      label: 'Kabul et',
                      icon: Icons.check,
                      onPressed: () => ref
                          .read(followRequestsProvider.notifier)
                          .accept(request.id),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: RollpitButton(
                      label: 'Reddet',
                      icon: Icons.close,
                      variant: RollpitButtonVariant.secondary,
                      onPressed: () => ref
                          .read(followRequestsProvider.notifier)
                          .reject(request.id),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  IconButton(
                    tooltip: 'Sil',
                    icon: const Icon(Icons.delete_outline),
                    color: AppColors.textSecondary,
                    onPressed: () => ref
                        .read(followRequestsProvider.notifier)
                        .delete(request.id),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
