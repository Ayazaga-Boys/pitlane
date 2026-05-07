import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/auth_repository.dart';

class InviteCodeNotifier extends AsyncNotifier<bool?> {
  @override
  Future<bool?> build() async => null; // null = henüz denenmedi

  Future<bool> validate(String code) async {
    state = const AsyncLoading();
    final result = await AsyncValue.guard(() async {
      final repo = ref.read(authRepositoryProvider);
      final res = await repo.validateInviteCode(code);
      return res.valid;
    });
    state = result;
    return result.valueOrNull ?? false;
  }
}

final inviteCodeProvider = AsyncNotifierProvider<InviteCodeNotifier, bool?>(
  InviteCodeNotifier.new,
);

// ─── Waiting list ────────────────────────────────────────────────────────────

class WaitingListNotifier extends AsyncNotifier<void> {
  @override
  Future<void> build() async {}

  Future<void> join({
    required String email,
    required String vehicleType,
    required String city,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final repo = ref.read(authRepositoryProvider);
      await repo.joinWaitingList(
        email: email,
        vehicleType: vehicleType,
        city: city,
      );
    });
  }
}

final waitingListProvider = AsyncNotifierProvider<WaitingListNotifier, void>(
  WaitingListNotifier.new,
);
