import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/social_repository.dart';
import '../models/follow_request.dart';

class FollowRequestsNotifier
    extends AutoDisposeAsyncNotifier<List<FollowRequest>> {
  @override
  Future<List<FollowRequest>> build() {
    return ref.read(socialRepositoryProvider).listIncomingFollowRequests();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(socialRepositoryProvider).listIncomingFollowRequests(),
    );
  }

  Future<void> accept(String requestId) {
    return _resolve(
      requestId,
      (repository) => repository.acceptFollowRequest(requestId),
    );
  }

  Future<void> reject(String requestId) {
    return _resolve(
      requestId,
      (repository) => repository.rejectFollowRequest(requestId),
    );
  }

  Future<void> delete(String requestId) {
    return _resolve(
      requestId,
      (repository) => repository.deleteFollowRequest(requestId),
    );
  }

  Future<void> _resolve(
    String requestId,
    Future<void> Function(SocialRepository repository) action,
  ) async {
    final previous = state.valueOrNull ?? const <FollowRequest>[];
    state = AsyncData(
      previous.where((item) => item.id != requestId).toList(growable: false),
    );

    final result = await AsyncValue.guard(
      () => action(ref.read(socialRepositoryProvider)),
    );
    if (result.hasError) state = AsyncData(previous);
  }
}

final followRequestsProvider = AsyncNotifierProvider.autoDispose<
    FollowRequestsNotifier, List<FollowRequest>>(
  FollowRequestsNotifier.new,
);
