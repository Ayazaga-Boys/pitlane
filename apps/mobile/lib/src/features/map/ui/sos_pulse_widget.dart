import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

/// Yardım pini için kırmızı pulsar animasyon
class SosPulseWidget extends StatefulWidget {
  const SosPulseWidget({super.key, required this.child});
  final Widget child;

  @override
  State<SosPulseWidget> createState() => _SosPulseWidgetState();
}

class _SosPulseWidgetState extends State<SosPulseWidget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scale;
  late final Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat();

    _scale = Tween<double>(
      begin: 1.0,
      end: 2.2,
    ).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOut));
    _opacity = Tween<double>(
      begin: 0.6,
      end: 0.0,
    ).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOut));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        AnimatedBuilder(
          animation: _ctrl,
          builder: (_, __) => Transform.scale(
            scale: _scale.value,
            child: Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.error.withAlpha(
                  (_opacity.value * 255).toInt(),
                ),
              ),
            ),
          ),
        ),
        widget.child,
      ],
    );
  }
}
