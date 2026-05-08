import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/moderation_repository.dart';
import '../models/moderation.dart';

class ModerationNotifier extends AsyncNotifier<void> {
  @override
  Future<void> build() async {}

  Future<void> report(CreateReportDraft draft) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(moderationRepositoryProvider).report(draft),
    );
  }

  Future<void> blockUser(String userId) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(moderationRepositoryProvider).blockUser(userId),
    );
  }
}

final moderationProvider = AsyncNotifierProvider<ModerationNotifier, void>(
  ModerationNotifier.new,
);
