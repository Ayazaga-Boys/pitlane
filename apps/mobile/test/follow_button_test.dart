import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rollpit/src/features/social/models/follow_status.dart';
import 'package:rollpit/src/features/social/ui/widgets/follow_button.dart';

void main() {
  testWidgets('FollowButton follows public profile', (tester) async {
    var followCount = 0;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: FollowButton(
            status: FollowStatus.none,
            isPrivate: false,
            onFollow: () => followCount++,
            onUnfollow: () {},
          ),
        ),
      ),
    );

    await tester.tap(find.text('Takip et'));
    await tester.pump();

    expect(followCount, 1);
  });

  testWidgets('FollowButton cancels requested state', (tester) async {
    var unfollowCount = 0;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: FollowButton(
            status: FollowStatus.requested,
            isPrivate: true,
            onFollow: () {},
            onUnfollow: () => unfollowCount++,
          ),
        ),
      ),
    );

    await tester.tap(find.text('İstek gönderildi'));
    await tester.pump();

    expect(unfollowCount, 1);
  });

  testWidgets('FollowButton disables blocked state', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: FollowButton(
            status: FollowStatus.blocked,
            isPrivate: false,
            onFollow: _noop,
            onUnfollow: _noop,
          ),
        ),
      ),
    );

    final button = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
    expect(button.onPressed, isNull);
  });
}

void _noop() {}
