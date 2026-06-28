import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rollpit/src/features/social/models/follow_status.dart';
import 'package:rollpit/src/features/social/providers/public_profile_provider.dart';

void main() {
  test('public profile follow becomes following', () async {
    final container = ProviderContainer();
    addTearDown(container.dispose);
    final subscription = container.listen(
      publicProfileProvider('mert_cb650r'),
      (_, __) {},
    );
    addTearDown(subscription.close);

    final user = await container.read(
      publicProfileProvider('mert_cb650r').future,
    );
    expect(user.followStatus, FollowStatus.none);

    await container
        .read(publicProfileProvider('mert_cb650r').notifier)
        .follow();

    final updated = container.read(publicProfileProvider('mert_cb650r')).value!;
    expect(updated.followStatus, FollowStatus.following);
  });

  test('private profile follow becomes requested', () async {
    final container = ProviderContainer();
    addTearDown(container.dispose);
    final subscription = container.listen(
      publicProfileProvider('selin_e30'),
      (_, __) {},
    );
    addTearDown(subscription.close);

    await container.read(publicProfileProvider('selin_e30').future);
    await container.read(publicProfileProvider('selin_e30').notifier).follow();

    final updated = container.read(publicProfileProvider('selin_e30')).value!;
    expect(updated.followStatus, FollowStatus.requested);
  });

  test('unfollow returns profile to none', () async {
    final container = ProviderContainer();
    addTearDown(container.dispose);
    final subscription = container.listen(
      publicProfileProvider('deniz_garage'),
      (_, __) {},
    );
    addTearDown(subscription.close);

    await container.read(publicProfileProvider('deniz_garage').future);
    await container
        .read(publicProfileProvider('deniz_garage').notifier)
        .unfollow();

    final updated =
        container.read(publicProfileProvider('deniz_garage')).value!;
    expect(updated.followStatus, FollowStatus.none);
  });
}
