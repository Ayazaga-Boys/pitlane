import 'package:flutter/material.dart';

import '../../core/models/presence_status.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import 'presence_dot.dart';

class AppAvatar extends StatelessWidget {
  const AppAvatar({
    super.key,
    required this.displayName,
    this.username,
    this.imageUrl,
    this.radius = AppSpacing.xl,
    this.presenceStatus,
    this.presenceVisible = true,
    this.backgroundColor = AppColors.surface3,
    this.presenceBorderColor = AppColors.surface2,
  });

  final String displayName;
  final String? username;
  final String? imageUrl;
  final double radius;
  final PresenceStatus? presenceStatus;
  final bool presenceVisible;
  final Color backgroundColor;
  final Color presenceBorderColor;

  @override
  Widget build(BuildContext context) {
    final image =
        imageUrl == null || imageUrl!.isEmpty ? null : NetworkImage(imageUrl!);
    final label = _semanticLabel;

    return Semantics(
      label: label,
      image: true,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          CircleAvatar(
            radius: radius,
            backgroundColor: backgroundColor,
            backgroundImage: image,
            child: image == null
                ? Text(
                    _initials,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w700,
                        ),
                  )
                : null,
          ),
          if (presenceStatus != null)
            Positioned(
              right: -AppSpacing.xs2,
              bottom: -AppSpacing.xs2,
              child: PresenceDot(
                status: presenceStatus!,
                visible: presenceVisible,
                borderColor: presenceBorderColor,
              ),
            ),
        ],
      ),
    );
  }

  String get _initials {
    final source = displayName.trim().isNotEmpty ? displayName : username ?? '';
    final parts = source
        .trim()
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty)
        .toList(growable: false);
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.characters.first.toUpperCase();
    return '${parts.first.characters.first}${parts.last.characters.first}'
        .toUpperCase();
  }

  String get _semanticLabel {
    final name = displayName.trim().isNotEmpty ? displayName : username;
    return name == null || name.trim().isEmpty
        ? 'Profil avatarı'
        : '$name avatarı';
  }
}
