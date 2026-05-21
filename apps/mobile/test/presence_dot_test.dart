import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rollpit/src/core/models/presence_status.dart';
import 'package:rollpit/src/shared/widgets/presence_dot.dart';

void main() {
  testWidgets('PresenceDot renders visible status semantics', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: PresenceDot(status: PresenceStatus.dnd),
        ),
      ),
    );

    expect(find.bySemanticsLabel('Rahatsız etmeyin'), findsOneWidget);
  });

  testWidgets('PresenceDot hides when presence is not visible', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: PresenceDot(
            status: PresenceStatus.online,
            visible: false,
          ),
        ),
      ),
    );

    expect(find.bySemanticsLabel('Çevrimiçi'), findsNothing);
  });
}
