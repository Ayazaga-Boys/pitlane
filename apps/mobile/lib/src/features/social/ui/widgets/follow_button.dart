import 'package:flutter/material.dart';

import '../../../../shared/widgets/rollpit_button.dart';
import '../../models/follow_status.dart';

class FollowButton extends StatelessWidget {
  const FollowButton({
    super.key,
    required this.status,
    required this.isPrivate,
    required this.onFollow,
    required this.onUnfollow,
    this.isLoading = false,
  });

  final FollowStatus status;
  final bool isPrivate;
  final VoidCallback onFollow;
  final VoidCallback onUnfollow;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return switch (status) {
      FollowStatus.none => RollpitButton(
          label: isPrivate ? 'İstek gönder' : status.label,
          icon: Icons.person_add_alt_1,
          isLoading: isLoading,
          onPressed: onFollow,
        ),
      FollowStatus.requested => RollpitButton(
          label: status.label,
          icon: Icons.schedule,
          variant: RollpitButtonVariant.secondary,
          isLoading: isLoading,
          onPressed: onUnfollow,
        ),
      FollowStatus.following => RollpitButton(
          label: status.label,
          icon: Icons.check,
          variant: RollpitButtonVariant.secondary,
          isLoading: isLoading,
          onPressed: onUnfollow,
        ),
      FollowStatus.blocked => const RollpitButton(
          label: 'Engellendi',
          icon: Icons.block,
          variant: RollpitButtonVariant.secondary,
          onPressed: null,
        ),
    };
  }
}
