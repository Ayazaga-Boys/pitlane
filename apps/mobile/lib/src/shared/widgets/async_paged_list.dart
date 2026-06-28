import 'package:flutter/material.dart';

import '../../core/theme/app_spacing.dart';

class AsyncPagedList<T> extends StatelessWidget {
  const AsyncPagedList({
    super.key,
    required this.items,
    required this.itemBuilder,
    required this.emptyState,
    this.separatorBuilder,
    this.onRefresh,
    this.onLoadMore,
    this.hasMore = false,
    this.isLoadingMore = false,
    this.padding = const EdgeInsets.all(AppSpacing.lg),
  });

  static const _loadMoreThreshold = 320.0;

  final List<T> items;
  final Widget Function(BuildContext context, T item, int index) itemBuilder;
  final Widget Function(BuildContext context, int index)? separatorBuilder;
  final Widget emptyState;
  final Future<void> Function()? onRefresh;
  final VoidCallback? onLoadMore;
  final bool hasMore;
  final bool isLoadingMore;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return _withRefresh(emptyState);

    return NotificationListener<ScrollNotification>(
      onNotification: _handleScroll,
      child: _withRefresh(
        ListView.builder(
          padding: padding,
          itemCount: items.length + (isLoadingMore ? 1 : 0),
          itemBuilder: (context, index) {
            if (index >= items.length) return const _LoadingMoreIndicator();

            return Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                itemBuilder(context, items[index], index),
                if (index < items.length - 1)
                  separatorBuilder?.call(context, index) ??
                      const SizedBox(height: AppSpacing.md),
              ],
            );
          },
        ),
      ),
    );
  }

  bool _handleScroll(ScrollNotification notification) {
    final loadMore = onLoadMore;
    if (loadMore == null || !hasMore || isLoadingMore) return false;
    if (notification.metrics.extentAfter <= _loadMoreThreshold) loadMore();
    return false;
  }

  Widget _withRefresh(Widget child) {
    final refresh = onRefresh;
    if (refresh == null) return child;
    return RefreshIndicator(onRefresh: refresh, child: child);
  }
}

class _LoadingMoreIndicator extends StatelessWidget {
  const _LoadingMoreIndicator();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: AppSpacing.lg),
      child: Center(
        child: SizedBox.square(
          dimension: AppSpacing.xl,
          child: CircularProgressIndicator(strokeWidth: AppSpacing.xs2),
        ),
      ),
    );
  }
}
