import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/flare_repository.dart';
import '../models/flare.dart';

class FlareDetailNotifier extends FamilyAsyncNotifier<Flare, String> {
  @override
  Future<Flare> build(String arg) {
    return ref.read(flareRepositoryProvider).getFlareDetail(arg);
  }

  Future<void> updateRsvp(FlareRsvpStatus status) async {
    final current = state.valueOrNull;
    if (current == null || current.hasEnded) return;

    state = AsyncData(_optimisticRsvp(current, status));
    state = await AsyncValue.guard(
      () => ref.read(flareRepositoryProvider).updateRsvp(arg, status, current),
    );
  }

  Flare _optimisticRsvp(Flare flare, FlareRsvpStatus status) {
    var goingCount = flare.goingCount;
    var maybeCount = flare.maybeCount;
    var notGoingCount = flare.notGoingCount;

    switch (flare.currentRsvpStatus) {
      case FlareRsvpStatus.going:
        goingCount = _decrement(goingCount);
      case FlareRsvpStatus.maybe:
        maybeCount = _decrement(maybeCount);
      case FlareRsvpStatus.notGoing:
        notGoingCount = _decrement(notGoingCount);
      case null:
        break;
    }

    switch (status) {
      case FlareRsvpStatus.going:
        goingCount += 1;
      case FlareRsvpStatus.maybe:
        maybeCount += 1;
      case FlareRsvpStatus.notGoing:
        notGoingCount += 1;
    }

    return flare.copyWith(
      currentRsvpStatus: status,
      goingCount: goingCount,
      maybeCount: maybeCount,
      notGoingCount: notGoingCount,
    );
  }

  int _decrement(int value) => value <= 0 ? 0 : value - 1;
}

final flareDetailProvider =
    AsyncNotifierProvider.family<FlareDetailNotifier, Flare, String>(
  FlareDetailNotifier.new,
);
