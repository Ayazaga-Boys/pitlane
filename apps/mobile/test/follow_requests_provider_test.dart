import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rollpit/src/features/social/providers/follow_requests_provider.dart';

void main() {
  test('accept removes follow request optimistically', () async {
    final container = ProviderContainer();
    addTearDown(container.dispose);

    final subscription = container.listen(followRequestsProvider, (_, __) {});
    addTearDown(subscription.close);

    final requests = await container.read(followRequestsProvider.future);
    expect(requests, isNotEmpty);

    await container
        .read(followRequestsProvider.notifier)
        .accept(requests.first.id);

    final updated = container.read(followRequestsProvider).value!;
    expect(updated.any((item) => item.id == requests.first.id), isFalse);
  });

  test('reject removes follow request', () async {
    final container = ProviderContainer();
    addTearDown(container.dispose);

    final subscription = container.listen(followRequestsProvider, (_, __) {});
    addTearDown(subscription.close);

    final requests = await container.read(followRequestsProvider.future);
    expect(requests, hasLength(2));

    await container
        .read(followRequestsProvider.notifier)
        .reject(requests.last.id);

    final updated = container.read(followRequestsProvider).value!;
    expect(updated, hasLength(1));
  });
}
