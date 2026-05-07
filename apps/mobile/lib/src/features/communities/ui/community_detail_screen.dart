import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/pitlane_button.dart';
import '../models/community.dart';
import '../models/community_detail.dart';
import '../providers/communities_provider.dart';

class CommunityDetailScreen extends ConsumerWidget {
  const CommunityDetailScreen({super.key, required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(communityDetailProvider(slug));

    return Scaffold(
      appBar: AppBar(title: const Text('Topluluk')),
      body: SafeArea(
        child: detail.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => _CommunityDetailError(
            message: error.toString(),
            slug: slug,
          ),
          data: (state) => _CommunityDetailContent(detail: state),
        ),
      ),
    );
  }
}

class _CommunityDetailContent extends ConsumerWidget {
  const _CommunityDetailContent({required this.detail});

  final CommunityDetail detail;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final community = detail.community;
    final isLoading =
        ref.watch(communityDetailProvider(community.slug)).isLoading;

    return ListView(
      padding: const EdgeInsets.all(AppSpacing.xl),
      children: [
        _CommunityHeader(community: community),
        const SizedBox(height: AppSpacing.xl),
        PitlaneButton(
          label: detail.isJoined ? 'Ayrıl' : 'Katıl',
          variant: detail.isJoined
              ? PitlaneButtonVariant.secondary
              : PitlaneButtonVariant.primary,
          isLoading: isLoading,
          onPressed: isLoading
              ? null
              : () => ref
                  .read(communityDetailProvider(community.slug).notifier)
                  .toggleMembership(),
        ),
        const SizedBox(height: AppSpacing.xl2),
        _SectionHeader(
          title: 'Flares',
          trailing: '${detail.flares.length}',
        ),
        const SizedBox(height: AppSpacing.md),
        PitlaneButton(
          label: 'Flare oluştur',
          variant: PitlaneButtonVariant.secondary,
          onPressed: () => context.push(
            '/flares/create?communityId=${community.id}',
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        if (detail.flares.isEmpty)
          const _MutedText('Henüz planlanmış flare yok.')
        else
          ...detail.flares.map((flare) => _FlareTile(flare: flare)),
        const SizedBox(height: AppSpacing.xl2),
        _SectionHeader(
          title: 'Üyeler',
          trailing: '${detail.members.length}',
        ),
        const SizedBox(height: AppSpacing.md),
        if (detail.members.isEmpty)
          const _MutedText('Üye listesi henüz görünmüyor.')
        else
          ...detail.members.map((member) => _MemberTile(member: member)),
      ],
    );
  }
}

class _CommunityHeader extends StatelessWidget {
  const _CommunityHeader({required this.community});

  final Community community;

  @override
  Widget build(BuildContext context) {
    final subtitle = [
      community.city,
      community.vehicleType.label,
      community.type.label,
    ].whereType<String>().join(' · ');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            CircleAvatar(
              radius: AppSpacing.xl2,
              backgroundColor: AppColors.surface3,
              backgroundImage: community.coverUrl == null
                  ? null
                  : NetworkImage(community.coverUrl!),
              child: community.coverUrl == null
                  ? Icon(
                      community.vehicleType == CommunityVehicleType.motorcycle
                          ? Icons.two_wheeler_outlined
                          : Icons.directions_car_outlined,
                      color: AppColors.pitRed,
                      size: AppSpacing.xl2,
                    )
                  : null,
            ),
            const SizedBox(width: AppSpacing.lg),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          community.name,
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                      ),
                      if (community.isVerified) ...[
                        const SizedBox(width: AppSpacing.xs),
                        const Icon(
                          Icons.verified,
                          color: AppColors.info,
                          size: AppSpacing.xl,
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    '@${community.slug}',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.lg),
        if (community.description != null &&
            community.description!.isNotEmpty) ...[
          Text(
            community.description!,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
          const SizedBox(height: AppSpacing.md),
        ],
        Text(
          subtitle,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.textTertiary,
              ),
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          '${community.memberCount} üye',
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.title,
    required this.trailing,
  });

  final String title;
  final String trailing;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(title, style: Theme.of(context).textTheme.titleLarge),
        const Spacer(),
        Text(
          trailing,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textTertiary,
              ),
        ),
      ],
    );
  }
}

class _FlareTile extends StatelessWidget {
  const _FlareTile({required this.flare});

  final CommunityFlarePreview flare;

  @override
  Widget build(BuildContext context) {
    return _SurfaceTile(
      leading: const Icon(Icons.local_fire_department, color: AppColors.pitRed),
      title: flare.title,
      subtitle: '${flare.startsAtLabel} · ${flare.rsvpCount} RSVP',
    );
  }
}

class _MemberTile extends StatelessWidget {
  const _MemberTile({required this.member});

  final CommunityMember member;

  @override
  Widget build(BuildContext context) {
    return _SurfaceTile(
      leading: CircleAvatar(
        backgroundColor: AppColors.surface3,
        backgroundImage:
            member.avatarUrl == null ? null : NetworkImage(member.avatarUrl!),
        child: member.avatarUrl == null
            ? Text(member.displayName.characters.first.toUpperCase())
            : null,
      ),
      title: member.displayName,
      subtitle: '@${member.username} · ${member.role}',
    );
  }
}

class _SurfaceTile extends StatelessWidget {
  const _SurfaceTile({
    required this.leading,
    required this.title,
    required this.subtitle,
  });

  final Widget leading;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: AppColors.surface2,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: AppColors.surface3),
        ),
        child: ListTile(
          leading: leading,
          title: Text(title),
          subtitle: Text(subtitle),
        ),
      ),
    );
  }
}

class _MutedText extends StatelessWidget {
  const _MutedText(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: AppColors.textSecondary,
          ),
    );
  }
}

class _CommunityDetailError extends ConsumerWidget {
  const _CommunityDetailError({
    required this.message,
    required this.slug,
  });

  final String message;
  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.error,
                  ),
            ),
            const SizedBox(height: AppSpacing.lg),
            TextButton.icon(
              onPressed: () => ref.invalidate(communityDetailProvider(slug)),
              icon: const Icon(Icons.refresh),
              label: const Text('Tekrar dene'),
            ),
          ],
        ),
      ),
    );
  }
}
