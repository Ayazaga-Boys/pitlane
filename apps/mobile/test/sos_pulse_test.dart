import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rollpit/src/features/map/ui/sos_pulse_widget.dart';

Widget _wrap(Widget child) => MaterialApp(
      home: Scaffold(body: Center(child: child)),
    );

void main() {
  group('SosPulseWidget', () {
    testWidgets('renders child widget', (tester) async {
      await tester.pumpWidget(
        _wrap(
          const SosPulseWidget(child: Icon(Icons.sos, key: Key('sos-icon'))),
        ),
      );

      expect(find.byKey(const Key('sos-icon')), findsOneWidget);
    });

    testWidgets('contains AnimatedBuilder inside SosPulseWidget', (
      tester,
    ) async {
      await tester.pumpWidget(
        _wrap(const SosPulseWidget(child: Icon(Icons.sos))),
      );

      expect(find.byType(Stack), findsWidgets);
      expect(
        find.descendant(
          of: find.byType(SosPulseWidget),
          matching: find.byType(AnimatedBuilder),
        ),
        findsOneWidget,
      );
    });

    testWidgets('animation advances on pump', (tester) async {
      await tester.pumpWidget(
        _wrap(const SosPulseWidget(child: Icon(Icons.sos))),
      );

      final pulseContainers = find.descendant(
        of: find.byType(SosPulseWidget),
        matching: find.byType(Container),
      );

      final colorBefore = (tester
              .widget<Container>(pulseContainers.first)
              .decoration as BoxDecoration)
          .color!;

      await tester.pump(const Duration(milliseconds: 700)); // yarı periyot

      final colorAfter = (tester
              .widget<Container>(pulseContainers.first)
              .decoration as BoxDecoration)
          .color!;

      // opacity değeri değişmiş olmalı (animasyon ilerliyor)
      expect(colorBefore.a, isNot(equals(colorAfter.a)));
    });

    testWidgets('disposes AnimationController without error', (tester) async {
      await tester.pumpWidget(
        _wrap(const SosPulseWidget(child: Icon(Icons.sos))),
      );

      // widget ağacından kaldır — dispose çağrılmalı, hata olmamalı
      await tester.pumpWidget(const MaterialApp(home: Scaffold()));
      expect(tester.takeException(), isNull);
    });
  });
}
