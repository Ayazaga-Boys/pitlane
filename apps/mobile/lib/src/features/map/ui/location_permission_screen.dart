import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/pitlane_button.dart';

/// Konum izni rationale ekranı
/// GPS izni reddedildiyse veya ilk kez isteniyorsa gösterilir
class LocationPermissionScreen extends StatelessWidget {
  const LocationPermissionScreen(
      {super.key, required this.onGranted, required this.onDismiss});
  final VoidCallback onGranted;
  final VoidCallback onDismiss;

  Future<void> _requestPermission(BuildContext context) async {
    var status = await Permission.locationWhenInUse.status;
    if (status.isGranted || status.isLimited) {
      onGranted();
      return;
    }
    status = await Permission.locationWhenInUse.request();
    if (!context.mounted) return;
    if (status.isGranted || status.isLimited) {
      onGranted();
    } else if (status.isPermanentlyDenied) {
      await openAppSettings();
      // Ayarlardan döndükten sonra tekrar kontrol et
      if (!context.mounted) return;
      final newStatus = await Permission.locationWhenInUse.status;
      if (newStatus.isGranted || newStatus.isLimited) onGranted();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surface0.withAlpha(230),
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: SafeArea(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.location_on_outlined,
                size: 72, color: AppColors.pitRed),
            const SizedBox(height: AppSpacing.lg),
            Text(
              'Konum İzni',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              'Pitlane, etrafındaki sürücüleri ve etkinlikleri gösterebilmek için yaklaşık konumunu kullanır.\n\n'
              'Ham GPS koordinatın hiçbir zaman paylaşılmaz — sadece ~100 m\'lik bölge bilgisi.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                    height: 1.5,
                  ),
            ),
            const SizedBox(height: AppSpacing.xl2),
            PitlaneButton(
              label: 'Konuma İzin Ver',
              onPressed: () => _requestPermission(context),
              icon: Icons.location_on,
            ),
            const SizedBox(height: AppSpacing.md),
            PitlaneButton(
              label: 'Şimdi Değil',
              variant: PitlaneButtonVariant.ghost,
              onPressed: onDismiss,
            ),
          ],
        ),
      ),
    );
  }
}
