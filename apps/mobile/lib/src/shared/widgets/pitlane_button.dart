import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

enum PitlaneButtonVariant { primary, secondary, ghost, destructive }

class PitlaneButton extends StatelessWidget {
  const PitlaneButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = PitlaneButtonVariant.primary,
    this.isLoading = false,
    this.icon,
  });

  final String label;
  final VoidCallback? onPressed;
  final PitlaneButtonVariant variant;
  final bool isLoading;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final isDisabled = onPressed == null || isLoading;

    final (bg, fg, border) = switch (variant) {
      PitlaneButtonVariant.primary     => (AppColors.pitRed, Colors.white, Colors.transparent),
      PitlaneButtonVariant.secondary   => (AppColors.surface3, AppColors.textPrimary, Colors.transparent),
      PitlaneButtonVariant.ghost       => (Colors.transparent, AppColors.pitRed, AppColors.pitRed),
      PitlaneButtonVariant.destructive => (AppColors.error, Colors.white, Colors.transparent),
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
            side: border == Colors.transparent ? BorderSide.none : BorderSide(color: border),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
          child: isLoading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                )
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (icon != null) ...[Icon(icon, size: 18), const SizedBox(width: 8)],
                    Text(label),
                  ],
                ),
        ),
      ),
    );
  }
}
