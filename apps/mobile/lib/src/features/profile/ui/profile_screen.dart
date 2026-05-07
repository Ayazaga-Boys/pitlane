import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/pitlane_button.dart';
import '../models/vehicle.dart';
import '../providers/profile_completion_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final completion = ref.watch(profileCompletionProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Profil')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: completion.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => _ProfileError(message: error.toString()),
            data: (state) => _ProfileContent(
              state: state,
              email: user?.email,
              onSignOut: () async {
                await ref.read(authNotifierProvider.notifier).signOut();
                if (context.mounted) context.go('/auth/login');
              },
            ),
          ),
        ),
      ),
    );
  }
}

class _ProfileContent extends StatelessWidget {
  const _ProfileContent({
    required this.state,
    required this.onSignOut,
    this.email,
  });

  final ProfileCompletionState state;
  final String? email;
  final VoidCallback onSignOut;

  @override
  Widget build(BuildContext context) {
    final profile = state.profile;
    final title = profile?.displayName?.isNotEmpty == true
        ? profile!.displayName!
        : 'Pitlane sürücüsü';
    final username = profile?.username.isNotEmpty == true
        ? '@${profile!.username}'
        : '@profil';
    final isComplete =
        profile?.hasCompletedIdentity == true && state.vehicles.isNotEmpty;

    return ListView(
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            CircleAvatar(
              radius: AppSpacing.xl2,
              backgroundColor: AppColors.surface3,
              backgroundImage: profile?.avatarUrl == null
                  ? null
                  : NetworkImage(profile!.avatarUrl!),
              child: profile?.avatarUrl == null
                  ? const Icon(Icons.person,
                      size: AppSpacing.xl2, color: AppColors.textSecondary)
                  : null,
            ),
            const SizedBox(width: AppSpacing.lg),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.headlineSmall),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    username,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                  if (email != null) ...[
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      email!,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.textTertiary,
                          ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.xl2),
        if (!isComplete) ...[
          DecoratedBox(
            decoration: BoxDecoration(
              color: AppColors.surface2,
              borderRadius: BorderRadius.circular(AppRadius.md),
              border: Border.all(color: AppColors.surface3),
            ),
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Profil eksik',
                      style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    'Harita, topluluk ve yardım akışları için profilini tamamla.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  PitlaneButton(
                    label: 'Tamamla',
                    onPressed: () => context.go('/profile/complete'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.xl2),
        ],
        Text('Garaj', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: AppSpacing.md),
        if (state.vehicles.isEmpty)
          Text(
            'Henüz araç eklenmemiş.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
          )
        else
          ...state.vehicles.map((vehicle) => _VehicleTile(vehicle: vehicle)),
        const SizedBox(height: AppSpacing.xl3),
        PitlaneButton(
          label: 'Çıkış Yap',
          variant: PitlaneButtonVariant.ghost,
          onPressed: onSignOut,
        ),
      ],
    );
  }
}

class _VehicleTile extends StatelessWidget {
  const _VehicleTile({required this.vehicle});

  final Vehicle vehicle;

  @override
  Widget build(BuildContext context) {
    final subtitle = [
      vehicle.type.label,
      if (vehicle.year != null) vehicle.year.toString(),
      if (vehicle.color != null && vehicle.color!.isNotEmpty) vehicle.color!,
    ].join(' · ');

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: AppColors.surface2,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: AppColors.surface3),
        ),
        child: ListTile(
          leading: Icon(
            vehicle.type == VehicleType.motorcycle
                ? Icons.two_wheeler_outlined
                : Icons.directions_car_outlined,
            color: AppColors.pitRed,
          ),
          title: Text('${vehicle.make} ${vehicle.model}'),
          subtitle: Text(subtitle),
          trailing: vehicle.isPrimary
              ? const Icon(Icons.star, color: AppColors.warning)
              : null,
        ),
      ),
    );
  }
}

class _ProfileError extends ConsumerWidget {
  const _ProfileError({required this.message});

  final String message;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            message,
            textAlign: TextAlign.center,
            style: Theme.of(context)
                .textTheme
                .bodyLarge
                ?.copyWith(color: AppColors.error),
          ),
          const SizedBox(height: AppSpacing.lg),
          PitlaneButton(
            label: 'Tekrar dene',
            onPressed: () => ref.invalidate(profileCompletionProvider),
          ),
        ],
      ),
    );
  }
}
