import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rollpit/src/shared/widgets/upload_progress_sheet.dart';

void main() {
  testWidgets('UploadProgressSheet renders in progress state', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: UploadProgressSheet(
            progress: 0.42,
            title: 'Avatar yükleniyor',
            body: 'Dosya hazırlanıyor.',
          ),
        ),
      ),
    );

    expect(find.text('Avatar yükleniyor'), findsOneWidget);
    expect(find.text('42%'), findsOneWidget);
    expect(find.text('Dosya hazırlanıyor.'), findsOneWidget);
  });

  testWidgets('UploadProgressSheet renders done state', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: UploadProgressSheet(
            progress: 1,
            doneTitle: 'Hazır',
          ),
        ),
      ),
    );

    expect(find.text('Hazır'), findsOneWidget);
    expect(find.text('100%'), findsOneWidget);
    expect(find.byIcon(Icons.check_circle_outline), findsOneWidget);
  });

  testWidgets('UploadProgressSheet clamps progress percentage', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(body: UploadProgressSheet(progress: 1.7)),
      ),
    );

    expect(find.text('100%'), findsOneWidget);
  });
}
