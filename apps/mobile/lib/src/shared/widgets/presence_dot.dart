import 'package:flutter/material.dart';

import '../../core/models/presence_status.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';

class PresenceDot extends StatelessWidget {
  const PresenceDot({
    super.key,
    required this.status,
    this.visible = true,
    this.borderColor = AppColors.surface2,
  });

  final PresenceStatus status;
  final bool visible;
  final Color borderColor;

  @override
  Widget build(BuildContext context) {
    if (!visible) return const SizedBox.shrink();

    return Semantics(
      label: _semanticsLabel,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: _color,
          shape: BoxShape.circle,
          border: Border.all(color: borderColor, width: AppSpacing.xs2),
        ),
        child: const SizedBox.square(dimension: AppSpacing.md),
      ),
    );
  }

  Color get _color {
    return switch (status) {
      PresenceStatus.online => AppColors.success,
      PresenceStatus.dnd => AppColors.warning,
      PresenceStatus.offline => AppColors.textTertiary,
    };
  }

  String get _semanticsLabel {
    return switch (status) {
      PresenceStatus.online => 'Çevrimiçi',
      PresenceStatus.dnd => 'Rahatsız etmeyin',
      PresenceStatus.offline => 'Çevrimdışı',
    };
  }
}
