import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/widgets/app_avatar.dart';
import '../../../shared/widgets/rollpit_button.dart';
import '../models/vehicle.dart';
import '../models/vehicle_icon_option.dart';
import '../providers/profile_completion_provider.dart';
import 'widgets/vehicle_icon_picker.dart';

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
              onSetPrimaryVehicle: (vehicleId) => ref
                  .read(profileCompletionProvider.notifier)
                  .setPrimaryVehicle(vehicleId),
              onUpdateVehicleIcon: (vehicleId, iconSlug) => ref
                  .read(profileCompletionProvider.notifier)
                  .updateVehicleIcon(vehicleId: vehicleId, iconSlug: iconSlug),
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
    required this.onSetPrimaryVehicle,
    required this.onUpdateVehicleIcon,
    required this.onSignOut,
    this.email,
  });

  final ProfileCompletionState state;
  final String? email;
  final ValueChanged<String> onSetPrimaryVehicle;
  final Future<void> Function(String vehicleId, String iconSlug)
      onUpdateVehicleIcon;
  final VoidCallback onSignOut;

  @override
  Widget build(BuildContext context) {
    final profile = state.profile;
    final title = profile?.displayName?.isNotEmpty == true
        ? profile!.displayName!
        : 'Rollpit sürücüsü';
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
            AppAvatar(
              displayName: title,
              username: profile?.username,
              imageUrl: profile?.avatarUrl,
              radius: AppSpacing.xl2,
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
                  Text(
                    'Profil eksik',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    'Harita, topluluk ve yardım akışları için profilini tamamla.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  RollpitButton(
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
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
          )
        else
          ...state.vehicles.map(
            (vehicle) => _VehicleTile(
              vehicle: vehicle,
              onSetPrimary: () => onSetPrimaryVehicle(vehicle.id),
              onUpdateIcon: (iconSlug) =>
                  onUpdateVehicleIcon(vehicle.id, iconSlug),
            ),
          ),
        const SizedBox(height: AppSpacing.xl3),
        RollpitButton(
          label: 'Çıkış Yap',
          variant: RollpitButtonVariant.ghost,
          onPressed: onSignOut,
        ),
      ],
    );
  }
}

class _VehicleTile extends StatelessWidget {
  const _VehicleTile({
    required this.vehicle,
    required this.onSetPrimary,
    required this.onUpdateIcon,
  });

  final Vehicle vehicle;
  final VoidCallback onSetPrimary;
  final Future<void> Function(String iconSlug) onUpdateIcon;

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
          leading: VehicleIconBadge(
            type: vehicle.type,
            iconSlug: vehicle.iconSlug,
          ),
          title: Text('${vehicle.make} ${vehicle.model}'),
          subtitle: Text(subtitle),
          trailing: Wrap(
            spacing: AppSpacing.xs,
            children: [
              IconButton(
                tooltip: 'İkonu düzenle',
                icon: const Icon(Icons.palette_outlined),
                onPressed: () => _showVehicleIconSheet(context),
              ),
              if (vehicle.isPrimary)
                const Tooltip(
                  message: 'Haritada görünen araç',
                  child: Icon(Icons.star, color: AppColors.warning),
                )
              else
                IconButton(
                  tooltip: 'Haritada göster',
                  icon: const Icon(Icons.star_border),
                  onPressed: onSetPrimary,
                ),
            ],
          ),
        ),
      ),
    );
  }

  void _showVehicleIconSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface1,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.lg)),
      ),
      builder: (_) =>
          _VehicleIconEditSheet(vehicle: vehicle, onSave: onUpdateIcon),
    );
  }
}

class _VehicleIconEditSheet extends StatefulWidget {
  const _VehicleIconEditSheet({required this.vehicle, required this.onSave});

  final Vehicle vehicle;
  final Future<void> Function(String iconSlug) onSave;

  @override
  State<_VehicleIconEditSheet> createState() => _VehicleIconEditSheetState();
}

class _VehicleIconEditSheetState extends State<_VehicleIconEditSheet> {
  late String _selectedSlug;
  var _isSaving = false;

  @override
  void initState() {
    super.initState();
    _selectedSlug = VehicleIconCatalog.resolve(
      widget.vehicle.iconSlug,
      widget.vehicle.type,
    ).slug;
  }

  Future<void> _save() async {
    setState(() => _isSaving = true);
    await widget.onSave(_selectedSlug);
    if (!mounted) return;
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    final label = '${widget.vehicle.make} ${widget.vehicle.model}'.trim();

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          AppSpacing.xl,
          AppSpacing.xl,
          AppSpacing.xl,
          AppSpacing.xl + bottomInset,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Araç ikonunu düzenle',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              label,
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
            ),
            const SizedBox(height: AppSpacing.lg),
            Flexible(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    VehicleIconPicker(
                      type: widget.vehicle.type,
                      selectedSlug: _selectedSlug,
                      onChanged: _isSaving
                          ? (_) {}
                          : (slug) => setState(() => _selectedSlug = slug),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    VehicleMapPreviewCard(
                      type: widget.vehicle.type,
                      iconSlug: _selectedSlug,
                      label: label,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            RollpitButton(
              label: 'Kaydet',
              icon: Icons.check,
              isLoading: _isSaving,
              onPressed: _isSaving ? null : _save,
            ),
          ],
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
            style: Theme.of(
              context,
            ).textTheme.bodyLarge?.copyWith(color: AppColors.error),
          ),
          const SizedBox(height: AppSpacing.lg),
          RollpitButton(
            label: 'Tekrar dene',
            onPressed: () => ref.invalidate(profileCompletionProvider),
          ),
        ],
      ),
    );
  }
}
