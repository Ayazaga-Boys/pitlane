import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/ws_service.dart';

/// Hayalet mod — açıkken konum hiç gönderilmez, Valkey kaydı silinir.
class GhostModeNotifier extends Notifier<bool> {
  @override
  bool build() => false; // Varsayılan: hayalet mod kapalı

  void toggle() {
    final newValue = !state;
    state = newValue;

    if (newValue) {
      ref.read(wsServiceProvider).sendGhostOn();
    } else {
      ref.read(wsServiceProvider).sendGhostOff();
    }
  }

  void enable() {
    if (state) return;
    state = true;
    ref.read(wsServiceProvider).sendGhostOn();
  }

  void disable() {
    if (!state) return;
    state = false;
    ref.read(wsServiceProvider).sendGhostOff();
  }
}

final ghostModeProvider = NotifierProvider<GhostModeNotifier, bool>(
  GhostModeNotifier.new,
);
