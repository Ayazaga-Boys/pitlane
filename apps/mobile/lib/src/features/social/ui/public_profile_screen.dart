import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/app_avatar.dart';
import '../../../shared/widgets/v2_state_views.dart';
import '../models/social_user.dart';
import '../providers/public_profile_provider.dart';
import 'widgets/follow_button.dart';

class PublicProfileScreen extends ConsumerWidget {
  const PublicProfileScreen({super.key, required this.username});

  final String username;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(publicProfileProvider(username));

    ref.listen(publicProfileProvider(username), (previous, next) {
      final error = next.error;
      if (error != null && previous?.isLoading == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error.toString()),
            backgroundColor: AppColors.error,
          ),
        );
      }
    });

    return Scaffold(
      appBar: AppBar(title: Text('@$username')),
      body: SafeArea(
        child: profile.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => V2ErrorState(
            message: error.toString(),
            onRetry: () => ref.invalidate(publicProfileProvider(username)),
          ),
          data: (user) => _PublicProfileContent(
            user: user,
            isLoading: profile.isLoading,
          ),
        ),
      ),
    );
  }
}

class _PublicProfileContent extends ConsumerWidget {
  const _PublicProfileContent({
    required this.user,
    required this.isLoading,
  });

  final SocialUser user;
  final bool isLoading;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.xl),
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            AppAvatar(
              displayName: user.displayName,
              username: user.username,
              imageUrl: user.avatarUrl,
              radius: AppSpacing.xl2,
              presenceStatus: user.presenceStatus,
              presenceVisible: user.presenceVisible,
              presenceBorderColor: AppColors.surface1,
            ),
            const SizedBox(width: AppSpacing.lg),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    user.displayName,
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    '@${user.username}',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                  if (user.isPrivate) ...[
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      'Gizli profil',
                      style: Theme.of(context).textTheme.labelMedium?.copyWith(
                            color: AppColors.warning,
                          ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.xl),
        _SocialStats(user: user),
        if (user.bio != null && user.bio!.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.xl),
          Text(
            user.bio!,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
        ],
        const SizedBox(height: AppSpacing.xl),
        FollowButton(
          status: user.followStatus,
          isPrivate: user.isPrivate,
          isLoading: isLoading,
          onFollow: () =>
              ref.read(publicProfileProvider(user.username).notifier).follow(),
          onUnfollow: () => ref
              .read(publicProfileProvider(user.username).notifier)
              .unfollow(),
        ),
      ],
    );
  }
}

class _SocialStats extends StatelessWidget {
  const _SocialStats({required this.user});

  final SocialUser user;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.surface2,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.surface3),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Row(
          children: [
            Expanded(
              child: _StatBlock(
                label: 'Takipçi',
                value: user.followersCount.toString(),
                onTap: () =>
                    context.push('/profile/${user.username}/followers'),
              ),
            ),
            Expanded(
              child: _StatBlock(
                label: 'Takip',
                value: user.followingCount.toString(),
                onTap: () =>
                    context.push('/profile/${user.username}/following'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatBlock extends StatelessWidget {
  const _StatBlock({required this.label, required this.value, this.onTap});

  final String label;
  final String value;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(AppRadius.sm),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
        child: Column(
          children: [
            Text(
              value,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              label,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}
