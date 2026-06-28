import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rollpit/src/features/social/providers/social_connections_provider.dart';

void main() {
  test('followers list loads next cursor page', () async {
    final container = ProviderContainer();
    addTearDown(container.dispose);

    const request = SocialConnectionsRequest(
      username: 'mert_cb650r',
      kind: SocialConnectionKind.followers,
    );
    final subscription = container.listen(
      socialConnectionsProvider(request),
      (_, __) {},
    );
    addTearDown(subscription.close);

    final firstPage = await container.read(
      socialConnectionsProvider(request).future,
    );

    expect(firstPage.items, hasLength(3));
    expect(firstPage.hasMore, isTrue);

    await container
        .read(socialConnectionsProvider(request).notifier)
        .loadMore();

    final updated = container.read(socialConnectionsProvider(request)).value!;
    expect(updated.items, hasLength(5));
    expect(updated.hasMore, isFalse);
  });

  test('following list uses following source', () async {
    final container = ProviderContainer();
    addTearDown(container.dispose);

    const request = SocialConnectionsRequest(
      username: 'mert_cb650r',
      kind: SocialConnectionKind.following,
    );
    final subscription = container.listen(
      socialConnectionsProvider(request),
      (_, __) {},
    );
    addTearDown(subscription.close);

    final firstPage = await container.read(
      socialConnectionsProvider(request).future,
    );

    expect(firstPage.items.map((user) => user.username), contains('selin_e30'));
    expect(firstPage.hasMore, isTrue);
  });
}
