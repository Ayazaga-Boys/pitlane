import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/social_repository.dart';
import '../models/social_user.dart';

enum SocialConnectionKind {
  followers,
  following;

  String get title {
    return switch (this) {
      SocialConnectionKind.followers => 'Takipçiler',
      SocialConnectionKind.following => 'Takip',
    };
  }

  String get emptyTitle {
    return switch (this) {
      SocialConnectionKind.followers => 'Henüz takipçi yok',
      SocialConnectionKind.following => 'Henüz takip edilen yok',
    };
  }
}

class SocialConnectionsRequest {
  const SocialConnectionsRequest({
    required this.username,
    required this.kind,
  });

  final String username;
  final SocialConnectionKind kind;

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        other is SocialConnectionsRequest &&
            other.username == username &&
            other.kind == kind;
  }

  @override
  int get hashCode => Object.hash(username, kind);
}

class SocialConnectionsState {
  const SocialConnectionsState({
    required this.items,
    required this.nextCursor,
    this.isLoadingMore = false,
  });

  final List<SocialUser> items;
  final String? nextCursor;
  final bool isLoadingMore;

  bool get hasMore => nextCursor != null;

  SocialConnectionsState copyWith({
    List<SocialUser>? items,
    String? nextCursor,
    bool clearNextCursor = false,
    bool? isLoadingMore,
  }) {
    return SocialConnectionsState(
      items: items ?? this.items,
      nextCursor: clearNextCursor ? null : nextCursor ?? this.nextCursor,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
    );
  }
}

class SocialConnectionsNotifier extends AutoDisposeFamilyAsyncNotifier<
    SocialConnectionsState, SocialConnectionsRequest> {
  static const _pageSize = 3;

  @override
  Future<SocialConnectionsState> build(SocialConnectionsRequest arg) async {
    final page = await _fetch(arg);
    return SocialConnectionsState(
      items: page.items,
      nextCursor: page.nextCursor,
    );
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final page = await _fetch(arg);
      return SocialConnectionsState(
        items: page.items,
        nextCursor: page.nextCursor,
      );
    });
  }

  Future<void> loadMore() async {
    final current = state.valueOrNull;
    if (current == null || current.isLoadingMore || !current.hasMore) return;

    state = AsyncData(current.copyWith(isLoadingMore: true));
    final result = await AsyncValue.guard(() async {
      final page = await _fetch(arg, cursor: current.nextCursor);
      return current.copyWith(
        items: [...current.items, ...page.items],
        nextCursor: page.nextCursor,
        clearNextCursor: page.nextCursor == null,
        isLoadingMore: false,
      );
    });

    state = result.when(
      data: AsyncData.new,
      error: AsyncError.new,
      loading: () => AsyncData(current.copyWith(isLoadingMore: false)),
    );
  }

  Future<({List<SocialUser> items, String? nextCursor})> _fetch(
    SocialConnectionsRequest request, {
    String? cursor,
  }) async {
    final repository = ref.read(socialRepositoryProvider);
    final page = switch (request.kind) {
      SocialConnectionKind.followers => repository.getFollowers(
          request.username,
          cursor: cursor,
          limit: _pageSize,
        ),
      SocialConnectionKind.following => repository.getFollowing(
          request.username,
          cursor: cursor,
          limit: _pageSize,
        ),
    };
    final result = await page;
    return (items: result.items, nextCursor: result.nextCursor);
  }
}

final socialConnectionsProvider = AsyncNotifierProvider.autoDispose.family<
    SocialConnectionsNotifier,
    SocialConnectionsState,
    SocialConnectionsRequest>(
  SocialConnectionsNotifier.new,
);
