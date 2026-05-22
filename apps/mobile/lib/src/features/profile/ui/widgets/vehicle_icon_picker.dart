import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../models/vehicle.dart';
import '../../models/vehicle_icon_option.dart';

class VehicleIconPicker extends StatelessWidget {
  const VehicleIconPicker({
    super.key,
    required this.type,
    required this.selectedSlug,
    required this.onChanged,
  });

  final VehicleType type;
  final String selectedSlug;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final options = VehicleIconCatalog.optionsFor(type);

    return Semantics(
      label: 'Araç ikon seçici',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Harita ikonu', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Gerçek marka logosu kullanmadan aracına benzeyen silüeti seç.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
          const SizedBox(height: AppSpacing.md),
          GridView.builder(
            itemCount: options.length,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: AppSpacing.md,
              mainAxisSpacing: AppSpacing.md,
              childAspectRatio: 1,
            ),
            itemBuilder: (context, index) {
              final option = options[index];
              return _VehicleIconChoice(
                option: option,
                selected: option.slug == selectedSlug,
                onTap: () => onChanged(option.slug),
              );
            },
          ),
        ],
      ),
    );
  }
}

class VehicleMapPreviewCard extends StatelessWidget {
  const VehicleMapPreviewCard({
    super.key,
    required this.iconSlug,
    required this.type,
    required this.label,
  });

  final String iconSlug;
  final VehicleType type;
  final String label;

  @override
  Widget build(BuildContext context) {
    final option = VehicleIconCatalog.resolve(iconSlug, type);

    return Semantics(
      label: 'Harita araç ikonu önizlemesi',
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: AppColors.surface2,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: AppColors.surface3),
        ),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Row(
            children: [
              DecoratedBox(
                decoration: BoxDecoration(
                  color: AppColors.surface1,
                  borderRadius: BorderRadius.circular(AppRadius.md),
                  border: Border.all(color: AppColors.surface3),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: _VehicleIconVisual(
                    option: option,
                    selected: true,
                    size: AppSpacing.xl2,
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label.isEmpty ? option.label : label,
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      option.label,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class VehicleIconBadge extends StatelessWidget {
  const VehicleIconBadge({
    super.key,
    required this.type,
    this.iconSlug,
  });

  final VehicleType type;
  final String? iconSlug;

  @override
  Widget build(BuildContext context) {
    final option = VehicleIconCatalog.resolve(iconSlug, type);

    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.surface1,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.surface3),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.sm),
        child: _VehicleIconVisual(
          option: option,
          selected: true,
          size: AppSpacing.xl,
        ),
      ),
    );
  }
}

class _VehicleIconChoice extends StatelessWidget {
  const _VehicleIconChoice({
    required this.option,
    required this.selected,
    required this.onTap,
  });

  final VehicleIconOption option;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final borderColor = selected ? AppColors.pitRed : AppColors.surface3;

    return Semantics(
      button: true,
      selected: selected,
      label: option.label,
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadius.md),
        onTap: onTap,
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: selected ? AppColors.surface3 : AppColors.surface2,
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: Border.all(color: borderColor),
          ),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.sm),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _VehicleIconVisual(
                  option: option,
                  selected: selected,
                  size: AppSpacing.xl2,
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  option.label,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        color: selected
                            ? AppColors.textPrimary
                            : AppColors.textSecondary,
                      ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _VehicleIconVisual extends StatelessWidget {
  const _VehicleIconVisual({
    required this.option,
    required this.selected,
    required this.size,
  });

  final VehicleIconOption option;
  final bool selected;
  final double size;

  @override
  Widget build(BuildContext context) {
    final previewAsset = option.previewAsset;
    if (previewAsset != null) {
      return Image.asset(
        previewAsset,
        width: size,
        height: size,
        fit: BoxFit.contain,
        errorBuilder: (_, __, ___) => Icon(
          option.icon,
          color: selected ? AppColors.pitRed : AppColors.textSecondary,
          size: size,
        ),
      );
    }

    return Icon(
      option.icon,
      color: selected ? AppColors.pitRed : AppColors.textSecondary,
      size: size,
    );
  }
}
