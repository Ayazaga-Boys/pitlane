import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import 'connectivity_banner.dart';

class MainShell extends StatelessWidget {
  const MainShell({super.key, required this.child});
  final Widget child;

  static const _tabs = [
    (
      icon: Icons.map_outlined,
      activeIcon: Icons.map,
      label: 'Harita',
      path: '/map',
    ),
    (
      icon: Icons.group_outlined,
      activeIcon: Icons.group,
      label: 'Topluluklar',
      path: '/communities',
    ),
    (
      icon: Icons.chat_bubble_outline,
      activeIcon: Icons.chat_bubble,
      label: 'Mesajlar',
      path: '/messages',
    ),
    (
      icon: Icons.person_outline,
      activeIcon: Icons.person,
      label: 'Profil',
      path: '/profile',
    ),
  ];

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    final idx = _tabs.indexWhere((t) => location.startsWith(t.path));
    return idx < 0 ? 0 : idx;
  }

  @override
  Widget build(BuildContext context) {
    final current = _currentIndex(context);

    return Scaffold(
      body: ConnectivityBanner(child: child),
      bottomNavigationBar: NavigationBar(
        backgroundColor: AppColors.surface1,
        indicatorColor: AppColors.pitRed.withAlpha(40),
        selectedIndex: current,
        onDestinationSelected: (i) => context.go(_tabs[i].path),
        destinations: _tabs
            .map(
              (t) => NavigationDestination(
                icon: Icon(t.icon),
                selectedIcon: Icon(t.activeIcon, color: AppColors.pitRed),
                label: t.label,
              ),
            )
            .toList(),
      ),
    );
  }
}
