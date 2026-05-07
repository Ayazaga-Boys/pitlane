import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'src/core/theme/app_theme.dart';
import 'src/features/auth/providers/auth_provider.dart';
import 'src/features/auth/ui/login_screen.dart';
import 'src/features/auth/ui/otp_screen.dart';
import 'src/features/map/ui/map_screen.dart';
import 'src/features/profile/ui/profile_screen.dart';
import 'src/shared/widgets/main_shell.dart';

// ─── Placeholder screens (Sprint 3-4 gelince replace edilir) ────────────────

class _PlaceholderScreen extends StatelessWidget {
  const _PlaceholderScreen(this.title);
  final String title;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Text(title, style: Theme.of(context).textTheme.titleLarge),
      ),
    );
  }
}

// ─── Router ─────────────────────────────────────────────────────────────────

final _routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/auth/login',
    redirect: (context, state) {
      final session = authState.valueOrNull?.session;
      final isLoggedIn = session != null;
      final isAuthRoute = state.matchedLocation.startsWith('/auth');

      if (!isLoggedIn && !isAuthRoute) return '/auth/login';
      if (isLoggedIn && isAuthRoute) return '/map';
      return null;
    },
    routes: [
      // Auth
      GoRoute(
        path: '/auth/login',
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        path: '/auth/otp',
        builder: (_, state) => OtpScreen(email: state.extra as String),
      ),

      // Ana shell (bottom nav)
      ShellRoute(
        builder: (_, __, child) => MainShell(child: child),
        routes: [
          GoRoute(path: '/map',          builder: (_, __) => const MapScreen()),
          GoRoute(path: '/communities',  builder: (_, __) => const _PlaceholderScreen('Topluluklar')),
          GoRoute(path: '/messages',     builder: (_, __) => const _PlaceholderScreen('Mesajlar')),
          GoRoute(path: '/profile',      builder: (_, __) => const ProfileScreen()),
          GoRoute(path: '/settings',     builder: (_, __) => const _PlaceholderScreen('Ayarlar')),
          GoRoute(path: '/help',         builder: (_, __) => const _PlaceholderScreen('Acil Yardım')),
          GoRoute(path: '/camera',       builder: (_, __) => const _PlaceholderScreen('Snap Kamera')),
        ],
      ),
    ],
    errorBuilder: (_, state) => Scaffold(
      body: Center(child: Text('404 — ${state.error}')),
    ),
  );
});

// ─── App ────────────────────────────────────────────────────────────────────

class PitlaneApp extends ConsumerWidget {
  const PitlaneApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(_routerProvider);

    return MaterialApp.router(
      title: 'Pitlane',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      routerConfig: router,
    );
  }
}
