import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

enum RollpitButtonVariant { primary, secondary, ghost, destructive }

class RollpitButton extends StatelessWidget {
  const RollpitButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = RollpitButtonVariant.primary,
    this.isLoading = false,
    this.icon,
  });

  final String label;
  final VoidCallback? onPressed;
  final RollpitButtonVariant variant;
  final bool isLoading;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final isDisabled = onPressed == null || isLoading;

    final (bg, fg, border) = switch (variant) {
      RollpitButtonVariant.primary => (
          AppColors.pitRed,
          Colors.white,
          Colors.transparent
        ),
      RollpitButtonVariant.secondary => (
          AppColors.surface3,
          AppColors.textPrimary,
          Colors.transparent
        ),
      RollpitButtonVariant.ghost => (
          Colors.transparent,
          AppColors.pitRed,
          AppColors.pitRed
        ),
      RollpitButtonVariant.destructive => (
          AppColors.error,
          Colors.white,
          Colors.transparent
        ),
    };

    return Semantics(
      button: true,
      enabled: !isDisabled,
      label: label,
      child: SizedBox(
        height: 48,
        width: double.infinity,
        child: ElevatedButton(
          onPressed: isDisabled ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: bg,
            foregroundColor: fg,
            disabledBackgroundColor: bg.withAlpha(120),
            side: border == Colors.transparent
                ? BorderSide.none
                : BorderSide(color: border),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
          child: isLoading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: Colors.white),
                )
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (icon != null) ...[
                      Icon(icon, size: 18),
                      const SizedBox(width: 8)
                    ],
                    Text(label),
                  ],
                ),
        ),
      ),
    );
  }
}
