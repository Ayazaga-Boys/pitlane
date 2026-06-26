import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rollpit/src/shared/widgets/media_tile.dart';

void main() {
  testWidgets('MediaTile renders placeholder when url is empty',
      (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(body: MediaTile(placeholderIcon: Icons.storefront)),
      ),
    );

    expect(find.byIcon(Icons.storefront), findsOneWidget);
    expect(find.bySemanticsLabel('Görsel medya'), findsOneWidget);
  });

  testWidgets('MediaTile renders play overlay for video media', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(body: MediaTile(type: MediaTileType.video)),
      ),
    );

    expect(find.byIcon(Icons.play_arrow), findsOneWidget);
    expect(find.bySemanticsLabel('Video medya'), findsOneWidget);
  });

  testWidgets('MediaTile uses thumbnail before original url', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: MediaTile(
            url: 'https://example.com/original.jpg',
            thumbnailUrl: 'https://example.com/thumb.jpg',
          ),
        ),
      ),
    );

    final image = tester.widget<Image>(find.byType(Image));
    final provider = image.image as NetworkImage;

    expect(provider.url, 'https://example.com/thumb.jpg');
  });
}
