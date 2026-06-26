import 'package:flutter/material.dart';

import '../../core/models/presence_status.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import 'app_avatar.dart';

class UserListTileV2 extends StatelessWidget {
  const UserListTileV2({
    super.key,
    required this.displayName,
    this.username,
    this.avatarUrl,
    this.subtitle,
    this.presenceStatus,
    this.presenceVisible = true,
    this.actionLabel,
    this.onAction,
    this.onTap,
  });

  static const _actionMinWidth = 72.0;
  static const _actionMinHeight = 36.0;

  final String displayName;
  final String? username;
  final String? avatarUrl;
  final String? subtitle;
  final PresenceStatus? presenceStatus;
  final bool presenceVisible;
  final String? actionLabel;
  final VoidCallback? onAction;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final handleAction = onAction;

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.sm,
      ),
      leading: AppAvatar(
        displayName: displayName,
        username: username,
        imageUrl: avatarUrl,
        presenceStatus: presenceStatus,
        presenceVisible: presenceVisible,
      ),
      title: Text(
        displayName,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: Theme.of(context).textTheme.titleMedium,
      ),
      subtitle: _subtitle(context),
      trailing: actionLabel == null
          ? null
          : OutlinedButton(
              onPressed: handleAction,
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.pitRed,
                side: const BorderSide(color: AppColors.pitRed),
                minimumSize: const Size(_actionMinWidth, _actionMinHeight),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
              ),
              child: Text(actionLabel!),
            ),
      onTap: onTap,
    );
  }

  Widget? _subtitle(BuildContext context) {
    final parts = [
      if (username != null && username!.isNotEmpty) '@$username',
      if (subtitle != null && subtitle!.isNotEmpty) subtitle!,
    ];
    if (parts.isEmpty) return null;

    return Text(
      parts.join(' · '),
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      style: Theme.of(
        context,
      ).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
    );
  }
}
