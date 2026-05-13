import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../features/auth/providers/auth_provider.dart';
import '../data/ws_service.dart';

/// Supabase oturumu açılınca WS'e otomatik bağlan, kapanınca kes.
final wsConnectionProvider = Provider<void>((ref) {
  final authState = ref.watch(authStateProvider);
  final ws = ref.watch(wsServiceProvider);

  authState.whenData((state) {
    final token = state.session?.accessToken;
    if (token != null && token.isNotEmpty) {
      ws.connect(token);
    } else {
      ws.disconnect(clearSubscriptions: true);
    }
  });

  ref.onDispose(() {
    ws.dispose();
  });
});
