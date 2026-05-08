import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/pitlane_button.dart';
import '../providers/map_pins_provider.dart';

void showHelpDetailSheet(BuildContext context, MapPin pin) {
  showModalBottomSheet(
    context: context,
    backgroundColor: AppColors.surface2,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(AppSpacing.lg)),
    ),
    builder: (_) => _HelpDetailSheet(pin: pin),
  );
}

class _HelpDetailSheet extends StatelessWidget {
  const _HelpDetailSheet({required this.pin});
  final MapPin pin;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.surface3,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(AppSpacing.sm),
                decoration: BoxDecoration(
                  color: AppColors.error.withAlpha(30),
                  borderRadius: BorderRadius.circular(AppSpacing.md),
                ),
                child: const Icon(Icons.sos, color: AppColors.error, size: 28),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      pin.title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    if (pin.subtitle != null)
                      Text(
                        pin.subtitle!,
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
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: AppColors.surface3,
              borderRadius: BorderRadius.circular(AppSpacing.md),
            ),
            child: Row(
              children: [
                const Icon(Icons.location_on_outlined,
                    color: AppColors.textSecondary, size: 18),
                const SizedBox(width: AppSpacing.sm),
                Text(
                  'Yakın bölge — haritada işaretli',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          PitlaneButton(
            label: 'Mesaj Gönder',
            onPressed: pin.peerId == null
                ? null
                : () {
                    final peerId = pin.peerId!;
                    Navigator.of(context).pop();
                    context.push('/messages/$peerId');
                  },
          ),
          const SizedBox(height: AppSpacing.sm),
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Kapat'),
            ),
          ),
        ],
      ),
    );
  }
}
