import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/flare_repository.dart';
import '../models/flare.dart';

class FlareCreateNotifier extends AsyncNotifier<Flare?> {
  @override
  Future<Flare?> build() async {
    return null;
  }

  Future<Flare> create(CreateFlareDraft draft) async {
    state = const AsyncLoading();
    final created = await ref.read(flareRepositoryProvider).createFlare(draft);
    state = AsyncData(created);
    return created;
  }
}

final flareCreateProvider = AsyncNotifierProvider<FlareCreateNotifier, Flare?>(
  FlareCreateNotifier.new,
);
