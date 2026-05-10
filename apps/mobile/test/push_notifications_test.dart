import 'package:flutter_test/flutter_test.dart';
import 'package:pitlane/src/features/notifications/models/push_notification.dart';
import 'package:pitlane/src/features/notifications/providers/push_notifications_provider.dart';

void main() {
  group('PushDeepLinkResolver', () {
    const resolver = PushDeepLinkResolver();

    test('uses safe explicit deep link when present', () {
      final link = resolver.resolveMap({
        'type': 'help_nearby',
        'deep_link': '/help/help-1',
      });

      expect(link, '/help/help-1');
    });

    test('rejects external explicit deep links', () {
      final link = resolver.resolveMap({
        'type': 'dm_new',
        'deep_link': 'https://evil.example/messages/user-1',
        'peer_id': 'user-1',
      });

      expect(link, '/messages/user-1');
    });

    test('rejects unsupported internal deep links', () {
      final link = resolver.resolveMap({
        'type': 'system',
        'deep_link': '/admin',
      });

      expect(link, isNull);
    });

    test('builds help route from help payload', () {
      final link = resolver.resolve(
        const PushPayload(
          type: PushNotificationType.helpNearby,
          data: {'help_id': 'help-42'},
        ),
      );

      expect(link, '/help/help-42');
    });

    test('builds flare route from flare payload', () {
      final link = resolver.resolveMap({
        'type': 'flare_starting',
        'flare_id': 'flare-42',
      });

      expect(link, '/flares/flare-42');
    });

    test('builds message route from peer id', () {
      final link = resolver.resolveMap({
        'type': 'dm_new',
        'peer_id': 'peer-42',
      });

      expect(link, '/messages/peer-42');
    });

    test('falls back to sender id for dm payloads', () {
      final link = resolver.resolveMap({
        'type': 'dm_new',
        'sender_id': 'sender-42',
      });

      expect(link, '/messages/sender-42');
    });

    test('returns null when required entity id is missing', () {
      final link = resolver.resolveMap({'type': 'flare_invite'});

      expect(link, isNull);
    });
  });
}
