import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:rollpit/src/features/profile/providers/profile_completion_provider.dart';
import 'package:rollpit/src/features/profile/ui/profile_completion_screen.dart';

class _FakeProfileCompletionNotifier extends ProfileCompletionNotifier {
  @override
  Future<ProfileCompletionState> build() async {
    return const ProfileCompletionState();
  }
}

void main() {
  testWidgets('back button returns to profile when opened directly', (
    tester,
  ) async {
    final router = GoRouter(
      initialLocation: '/profile/complete',
      routes: [
        GoRoute(
          path: '/profile/complete',
          builder: (_, __) => const ProfileCompletionScreen(),
        ),
        GoRoute(
          path: '/profile',
          builder: (_, __) => const Scaffold(body: Text('Profil ekranı')),
        ),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          profileCompletionProvider.overrideWith(
            _FakeProfileCompletionNotifier.new,
          ),
        ],
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byTooltip('Geri'));
    await tester.pumpAndSettle();

    expect(find.text('Profil ekranı'), findsOneWidget);
  });
}
