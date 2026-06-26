import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rollpit/src/shared/widgets/v2_state_views.dart';

void main() {
  testWidgets('V2EmptyState renders title and body', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: V2EmptyState(
            icon: Icons.search_off,
            title: 'Kayıt yok',
            body: 'Filtreyi değiştirip tekrar dene.',
          ),
        ),
      ),
    );

    expect(find.text('Kayıt yok'), findsOneWidget);
    expect(find.text('Filtreyi değiştirip tekrar dene.'), findsOneWidget);
  });

  testWidgets('V2ErrorState calls retry action', (tester) async {
    var retryCount = 0;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: V2ErrorState(
            message: 'Bağlantı kurulamadı',
            onRetry: () => retryCount++,
          ),
        ),
      ),
    );

    await tester.tap(find.text('Tekrar dene'));
    await tester.pump();

    expect(retryCount, 1);
  });
}
