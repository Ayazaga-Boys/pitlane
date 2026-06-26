import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rollpit/src/core/models/presence_status.dart';
import 'package:rollpit/src/shared/widgets/app_avatar.dart';

void main() {
  testWidgets('AppAvatar renders initials fallback', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(body: AppAvatar(displayName: 'Mert Yılmaz')),
      ),
    );

    expect(find.text('MY'), findsOneWidget);
  });

  testWidgets('AppAvatar hides presence dot when visibility is false',
      (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: AppAvatar(
            displayName: 'Selin Arslan',
            presenceStatus: PresenceStatus.online,
            presenceVisible: false,
          ),
        ),
      ),
    );

    expect(find.bySemanticsLabel('Çevrimiçi'), findsNothing);
  });
}
