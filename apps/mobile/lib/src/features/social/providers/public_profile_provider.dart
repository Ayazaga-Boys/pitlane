import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/social_repository.dart';
import '../models/follow_status.dart';
import '../models/social_user.dart';

class PublicProfileNotifier
    extends AutoDisposeFamilyAsyncNotifier<SocialUser, String> {
  @override
  Future<SocialUser> build(String username) {
    return ref.read(socialRepositoryProvider).getUserByUsername(username);
  }

  Future<void> follow() async {
    final previous = state.valueOrNull;
    if (previous == null || previous.followStatus == FollowStatus.blocked) {
      return;
    }

    final optimisticStatus =
        previous.isPrivate ? FollowStatus.requested : FollowStatus.following;
    state = AsyncData(previous.copyWith(followStatus: optimisticStatus));
    state = await AsyncValue.guard(
      () => ref.read(socialRepositoryProvider).follow(previous.username),
    );
  }

  Future<void> unfollow() async {
    final previous = state.valueOrNull;
    if (previous == null || previous.followStatus == FollowStatus.blocked) {
      return;
    }

    state = AsyncData(previous.copyWith(followStatus: FollowStatus.none));
    state = await AsyncValue.guard(
      () => ref.read(socialRepositoryProvider).unfollow(previous.username),
    );
  }
}

final publicProfileProvider = AsyncNotifierProvider.autoDispose
    .family<PublicProfileNotifier, SocialUser, String>(
  PublicProfileNotifier.new,
);
