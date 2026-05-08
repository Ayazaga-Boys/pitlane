import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pitlane/app.dart';

// Auth bypass aktif olduğundan uygulama direkt MapScreen'e yönlenir.
// Bu test sadece uygulamanın crash yapmadan başladığını doğrular.
void main() {
  testWidgets('app starts without crashing', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: PitlaneApp()));
    await tester.pump(); // ilk frame
    // Hata yoksa test geçer
    expect(tester.takeException(), isNull);
  });
}
