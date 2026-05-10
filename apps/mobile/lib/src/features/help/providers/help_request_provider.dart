import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/help_repository.dart';
import '../models/help_request.dart';

class HelpRequestNotifier extends AsyncNotifier<HelpRequest?> {
  @override
  Future<HelpRequest?> build() {
    return ref.read(helpRepositoryProvider).getMyOpenHelpRequest();
  }

  Future<HelpRequest?> create(CreateHelpRequestDraft draft) async {
    state = const AsyncLoading();
    final result = await AsyncValue.guard(
      () => ref.read(helpRepositoryProvider).createHelpRequest(draft),
    );
    state = result;
    return result.valueOrNull;
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(helpRepositoryProvider).getMyOpenHelpRequest(),
    );
  }

  Future<void> cancel() async {
    final current = state.valueOrNull;
    if (current == null) return;

    state = await AsyncValue.guard(
      () => ref.read(helpRepositoryProvider).cancelHelpRequest(current),
    );
  }
}

final helpRequestProvider =
    AsyncNotifierProvider<HelpRequestNotifier, HelpRequest?>(
  HelpRequestNotifier.new,
);

class HelpDetailNotifier extends FamilyAsyncNotifier<HelpRequest, String> {
  @override
  Future<HelpRequest> build(String arg) {
    return ref.read(helpRepositoryProvider).getHelpRequestDetail(arg);
  }

  Future<HelpRequest?> respond() async {
    final result = await AsyncValue.guard(
      () => ref.read(helpRepositoryProvider).respondToHelpRequest(arg),
    );
    state = result;
    return result.valueOrNull;
  }
}

final helpDetailProvider =
    AsyncNotifierProvider.family<HelpDetailNotifier, HelpRequest, String>(
  HelpDetailNotifier.new,
);
