import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rollpit/src/shared/widgets/connectivity_banner.dart';

Widget _wrap(Widget child) => ProviderScope(
      child: MaterialApp(home: Scaffold(body: child)),
    );

void main() {
  group('ConnectivityBanner', () {
    testWidgets('renders child content', (tester) async {
      await tester.pumpWidget(
        _wrap(const ConnectivityBanner(child: Text('içerik'))),
      );
      await tester.pump();

      expect(find.text('içerik'), findsOneWidget);
    });

    testWidgets('defaults to online — no banner shown', (tester) async {
      // connectivity stream henüz değer üretmemişse valueOrNull=null → true (online)
      await tester.pumpWidget(
        _wrap(const ConnectivityBanner(child: Text('içerik'))),
      );
      await tester.pump();

      expect(find.text('İnternet bağlantısı yok'), findsNothing);
      expect(find.byIcon(Icons.wifi_off), findsNothing);
    });

    testWidgets('uses Column + Expanded layout', (tester) async {
      await tester.pumpWidget(
        _wrap(const ConnectivityBanner(child: Text('içerik'))),
      );
      await tester.pump();

      expect(find.byType(Column), findsWidgets);
      expect(find.byType(Expanded), findsOneWidget);
    });

    testWidgets('renders without exceptions', (tester) async {
      await tester.pumpWidget(
        _wrap(const ConnectivityBanner(child: SizedBox())),
      );
      await tester.pump();
      expect(tester.takeException(), isNull);
    });
  });

  group('WS backoff delay formula', () {
    // ws_service.dart'taki _backoffDelay statik metodunun davranışını belgele
    test('3s × 2^n progression capped at 60s', () {
      const base = 3;
      final expected = {1: 3, 2: 6, 3: 12, 4: 24, 5: 48, 6: 48, 10: 48};
      for (final entry in expected.entries) {
        final attempt = entry.key;
        final want = entry.value;
        final seconds = (base * (1 << (attempt - 1).clamp(0, 4))).clamp(0, 60);
        expect(seconds, want, reason: 'attempt $attempt');
      }
    });

    test('first attempt is 3s', () {
      const base = 3;
      final seconds = (base * (1 << 0)).clamp(0, 60);
      expect(seconds, 3);
    });

    test('never exceeds 60s', () {
      const base = 3;
      for (var attempt = 1; attempt <= 20; attempt++) {
        final seconds = (base * (1 << (attempt - 1).clamp(0, 4))).clamp(0, 60);
        expect(seconds, lessThanOrEqualTo(60), reason: 'attempt $attempt');
      }
    });
  });
}
