import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';

// Sprint 2'de gerçek harita + heatmap overlay eklenecek
class MapScreen extends ConsumerWidget {
  const MapScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.surface0,
      body: Stack(
        children: [
          // TODO(sprint2): GoogleMap widget buraya
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.map_outlined, size: 64, color: AppColors.pitRed.withAlpha(180)),
                const SizedBox(height: AppSpacing.md),
                Text(
                  'Harita',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  'Sprint 2\'de Google Maps + H3 heatmap',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textTertiary,
                  ),
                ),
              ],
            ),
          ),
          // SOS butonu — her zaman haritanın üzerinde
          Positioned(
            right: AppSpacing.lg,
            bottom: AppSpacing.xl + AppSpacing.xl,
            child: Column(
              children: [
                _FabButton(
                  icon: Icons.camera_alt_outlined,
                  label: 'Snap',
                  onPressed: () {}, // Sprint 6
                ),
                const SizedBox(height: AppSpacing.md),
                _FabButton(
                  icon: Icons.sos,
                  label: 'SOS',
                  color: AppColors.error,
                  onPressed: () {}, // Sprint 5
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FabButton extends StatelessWidget {
  const _FabButton({
    required this.icon,
    required this.label,
    required this.onPressed,
    this.color,
  });

  final IconData icon;
  final String label;
  final VoidCallback onPressed;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppColors.pitRed;
    return Semantics(
      button: true,
      label: label,
      child: FloatingActionButton.small(
        heroTag: label,
        backgroundColor: c,
        foregroundColor: Colors.white,
        onPressed: onPressed,
        child: Icon(icon),
      ),
    );
  }
}
