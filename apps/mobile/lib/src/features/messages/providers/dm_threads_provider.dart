import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/messages_repository.dart';
import '../models/dm_thread.dart';

class DmThreadsNotifier extends AsyncNotifier<List<DmThread>> {
  @override
  Future<List<DmThread>> build() {
    return ref.read(messagesRepositoryProvider).listDmThreads();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(messagesRepositoryProvider).listDmThreads(),
    );
  }
}

final dmThreadsProvider =
    AsyncNotifierProvider<DmThreadsNotifier, List<DmThread>>(
  DmThreadsNotifier.new,
);
