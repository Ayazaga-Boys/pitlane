import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'src/core/theme/app_theme.dart';
import 'src/features/auth/providers/auth_provider.dart';
import 'src/features/auth/ui/invite_code_screen.dart';
import 'src/features/auth/ui/login_screen.dart';
import 'src/features/auth/ui/otp_screen.dart';
import 'src/features/auth/ui/waiting_list_screen.dart';
import 'src/features/communities/ui/community_create_screen.dart';
import 'src/features/communities/ui/community_detail_screen.dart';
import 'src/features/communities/ui/communities_screen.dart';
import 'src/features/flares/ui/flare_create_screen.dart';
import 'src/features/flares/ui/flare_detail_screen.dart';
import 'src/features/map/providers/ws_connection_provider.dart';
import 'src/features/map/ui/map_screen.dart';
import 'src/features/messages/ui/chat_screen.dart';
import 'src/features/messages/ui/messages_screen.dart';
import 'src/features/messages/ui/room_chat_screen.dart';
import 'src/features/messages/models/message_room.dart';
import 'src/features/notifications/ui/notification_settings_screen.dart';
import 'src/features/notifications/ui/notifications_screen.dart';
import 'src/features/profile/ui/profile_completion_screen.dart';
import 'src/features/profile/ui/profile_screen.dart';
import 'src/features/settings/ui/settings_screen.dart';
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
  // authStateProvider'ı izle ki oturum değişince router yeniden build edilsin
  ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/auth/invite-code',
    redirect: (context, state) {
      // AUTH BYPASS — domain + Resend kurulunca kaldır
      return '/map';
    },
    routes: [
      // ── Auth ──────────────────────────────────────────────────────────────
      GoRoute(
        path: '/auth/invite-code',
        builder: (_, __) => const InviteCodeScreen(),
      ),
      GoRoute(
        path: '/auth/waiting-list',
        builder: (_, __) => const WaitingListScreen(),
      ),
      GoRoute(
        path: '/auth/login',
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        path: '/auth/otp',
        builder: (_, state) => OtpScreen(email: state.extra as String),
      ),
      GoRoute(
        path: '/profile/complete',
        builder: (_, __) => const ProfileCompletionScreen(),
      ),

      // ── Ana shell (bottom nav) ─────────────────────────────────────────────
      ShellRoute(
        builder: (_, __, child) => MainShell(child: child),
        routes: [
          GoRoute(path: '/map', builder: (_, __) => const MapScreen()),
          GoRoute(
            path: '/communities',
            builder: (_, __) => const CommunitiesScreen(),
          ),
          GoRoute(
            path: '/communities/create',
            builder: (_, __) => const CommunityCreateScreen(),
          ),
          GoRoute(
            path: '/communities/:id/messages',
            builder: (_, state) => RoomChatScreen(
              room: MessageRoom(
                type: MessageRoomType.community,
                id: state.pathParameters['id']!,
              ),
            ),
          ),
          GoRoute(
            path: '/communities/:slug',
            builder: (_, state) => CommunityDetailScreen(
              slug: state.pathParameters['slug']!,
            ),
          ),
          GoRoute(
            path: '/pins/:id',
            builder: (_, state) =>
                _PlaceholderScreen('İşletme — ${state.pathParameters['id']}'),
          ),
          GoRoute(
            path: '/flares/create',
            builder: (_, state) => FlareCreateScreen(
              initialH3Cell: state.uri.queryParameters['h3cell'],
              communityId: state.uri.queryParameters['communityId'],
            ),
          ),
          GoRoute(
            path: '/flares/:id',
            builder: (_, state) => FlareDetailScreen(
              id: state.pathParameters['id']!,
            ),
          ),
          GoRoute(
            path: '/flares/:id/chat',
            builder: (_, state) => RoomChatScreen(
              room: MessageRoom(
                type: MessageRoomType.flare,
                id: state.pathParameters['id']!,
              ),
            ),
          ),
          GoRoute(
            path: '/messages',
            builder: (_, __) => const MessagesScreen(),
          ),
          GoRoute(
            path: '/messages/:peerId',
            builder: (_, state) => ChatScreen(
              peerId: state.pathParameters['peerId']!,
            ),
          ),
          GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
          GoRoute(
            path: '/settings',
            builder: (_, __) => const SettingsScreen(),
          ),
          GoRoute(
            path: '/settings/notifications',
            builder: (_, __) => const NotificationSettingsScreen(),
          ),
          GoRoute(
            path: '/notifications',
            builder: (_, __) => const NotificationsScreen(),
          ),
          GoRoute(
            path: '/help',
            builder: (_, __) => const _PlaceholderScreen('Acil Yardım'),
          ),
          GoRoute(
            path: '/camera',
            builder: (_, __) => const _PlaceholderScreen('Snap Kamera'),
          ),
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
    // Supabase oturumu açılınca WS'e otomatik bağlan
    ref.watch(wsConnectionProvider);

    return MaterialApp.router(
      title: 'Pitlane',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      routerConfig: router,
    );
  }
}
