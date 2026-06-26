import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/messages_repository.dart';
import '../models/dm_message.dart';

class DmChatNotifier extends FamilyAsyncNotifier<List<DmMessage>, String> {
  @override
  Future<List<DmMessage>> build(String arg) async {
    final repository = ref.read(messagesRepositoryProvider);
    final channel = repository.subscribeToDmMessages(arg, _appendRealtime);
    ref.onDispose(() => repository.unsubscribe(channel));
    return repository.listDmMessages(arg);
  }

  Future<void> send(String body) async {
    final trimmed = body.trim();
    if (trimmed.isEmpty || trimmed.length > 2000) return;

    final previous = state.valueOrNull ?? const <DmMessage>[];
    final optimistic = DmMessage(
      id: 'pending-${DateTime.now().microsecondsSinceEpoch}',
      body: trimmed,
      createdAt: DateTime.now(),
      isMine: true,
    );

    state = AsyncData([...previous, optimistic]);
    final result = await AsyncValue.guard(
      () => ref
          .read(messagesRepositoryProvider)
          .sendDmMessage(arg, SendDmMessageDraft(body: trimmed)),
    );

    result.when(
      data: (message) => state = AsyncData([...previous, message]),
      error: (error, stackTrace) => state = AsyncError(error, stackTrace),
      loading: () {},
    );
  }

  void _appendRealtime(DmMessage message) {
    final messages = state.valueOrNull ?? const <DmMessage>[];
    if (messages.any((item) => item.id == message.id)) return;
    state = AsyncData([...messages, message]);
  }
}

final dmChatProvider =
    AsyncNotifierProvider.family<DmChatNotifier, List<DmMessage>, String>(
  DmChatNotifier.new,
);
