import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pitlane/app.dart';
import 'package:pitlane/src/features/map/providers/map_pins_provider.dart';

// Auth bypass aktif olduğundan uygulama direkt MapScreen'e yönlenir.
// allPinsProvider → HTTP çağrısı yapar; test ortamında override ile engellenir.
void main() {
  testWidgets('app starts without crashing', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          allPinsProvider.overrideWith((ref) async => []),
        ],
        child: const PitlaneApp(),
      ),
    );
    await tester.pump();
    expect(tester.takeException(), isNull);
  });
}
