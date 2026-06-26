import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rollpit/src/core/models/presence_status.dart';
import 'package:rollpit/src/shared/widgets/presence_dot.dart';
import 'package:rollpit/src/shared/widgets/user_list_tile_v2.dart';

void main() {
  testWidgets('UserListTileV2 renders user identity and presence',
      (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: UserListTileV2(
            displayName: 'Mert Yılmaz',
            username: 'mert_cb650r',
            subtitle: 'admin',
            presenceStatus: PresenceStatus.online,
          ),
        ),
      ),
    );

    expect(find.text('Mert Yılmaz'), findsOneWidget);
    expect(find.text('@mert_cb650r · admin'), findsOneWidget);
    final dot = tester.widget<PresenceDot>(find.byType(PresenceDot));
    expect(dot.status, PresenceStatus.online);
    expect(dot.visible, isTrue);
  });

  testWidgets('UserListTileV2 hides presence when user opted out',
      (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: UserListTileV2(
            displayName: 'Selin Arslan',
            presenceStatus: PresenceStatus.online,
            presenceVisible: false,
          ),
        ),
      ),
    );

    final dot = tester.widget<PresenceDot>(find.byType(PresenceDot));
    expect(dot.visible, isFalse);
  });

  testWidgets('UserListTileV2 action button calls handler', (tester) async {
    var followCount = 0;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: UserListTileV2(
            displayName: 'Deniz Kaya',
            username: 'deniz_garage',
            actionLabel: 'Takip et',
            onAction: () => followCount++,
          ),
        ),
      ),
    );

    await tester.tap(find.text('Takip et'));
    await tester.pump();

    expect(followCount, 1);
  });
}
