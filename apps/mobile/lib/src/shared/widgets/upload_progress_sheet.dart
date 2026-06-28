import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';

class UploadProgressSheet extends StatelessWidget {
  const UploadProgressSheet({
    super.key,
    required this.progress,
    this.title = 'Yükleme hazırlanıyor',
    this.doneTitle = 'Yükleme hazır',
    this.body,
  });

  final double progress;
  final String title;
  final String doneTitle;
  final String? body;

  @override
  Widget build(BuildContext context) {
    final clampedProgress = progress.clamp(0.0, 1.0);
    final isDone = clampedProgress >= 1;
    final percent = (clampedProgress * 100).round();

    return DecoratedBox(
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
            Row(
              children: [
                Icon(
                  isDone ? Icons.check_circle_outline : Icons.cloud_upload,
                  color: isDone ? AppColors.success : AppColors.pitRed,
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    isDone ? doneTitle : title,
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                ),
                Text(
                  '$percent%',
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            Semantics(
              label: 'Yükleme ilerlemesi',
              value: '$percent yüzde',
              child: LinearProgressIndicator(value: clampedProgress),
            ),
            if (body != null && body!.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.sm),
              Text(
                body!,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
