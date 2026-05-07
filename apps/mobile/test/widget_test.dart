import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pitlane/src/app.dart';

void main() {
  testWidgets('renders Pitlane starter shell', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: PitlaneApp()));

    expect(find.text('Pitlane'), findsOneWidget);
    expect(find.text('Car & Moto Social'), findsOneWidget);
  });
}
