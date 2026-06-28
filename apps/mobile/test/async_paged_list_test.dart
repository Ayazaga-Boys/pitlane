import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rollpit/src/shared/widgets/async_paged_list.dart';

void main() {
  testWidgets('AsyncPagedList renders empty state when there are no items',
      (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: AsyncPagedList<int>(
            items: [],
            emptyState: Text('Liste boş'),
            itemBuilder: _intTileBuilder,
          ),
        ),
      ),
    );

    expect(find.text('Liste boş'), findsOneWidget);
  });

  testWidgets('AsyncPagedList renders loading footer', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: AsyncPagedList<int>(
            items: [1, 2],
            emptyState: Text('Liste boş'),
            isLoadingMore: true,
            itemBuilder: _intTileBuilder,
          ),
        ),
      ),
    );

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });

  testWidgets('AsyncPagedList calls load more near scroll end', (tester) async {
    var loadMoreCount = 0;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SizedBox(
            height: 240,
            child: AsyncPagedList<int>(
              items: List.generate(30, (index) => index),
              emptyState: const Text('Liste boş'),
              hasMore: true,
              onLoadMore: () => loadMoreCount++,
              itemBuilder: _intTileBuilder,
            ),
          ),
        ),
      ),
    );

    await tester.drag(find.byType(ListView), const Offset(0, -1600));
    await tester.pump();

    expect(loadMoreCount, greaterThan(0));
  });
}

Widget _intTileBuilder(BuildContext context, int item, int index) {
  return SizedBox(height: 56, child: Text('Item $item'));
}
