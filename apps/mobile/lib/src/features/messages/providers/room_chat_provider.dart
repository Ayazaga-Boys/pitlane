import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/messages_repository.dart';
import '../models/dm_message.dart';
import '../models/message_room.dart';

class RoomChatNotifier
    extends FamilyAsyncNotifier<List<DmMessage>, MessageRoom> {
  @override
  Future<List<DmMessage>> build(MessageRoom arg) async {
    final repository = ref.read(messagesRepositoryProvider);
    final channel = repository.subscribeToRoomMessages(arg, _appendRealtime);
    ref.onDispose(() => repository.unsubscribe(channel));
    return repository.listRoomMessages(arg);
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
          .sendRoomMessage(arg, SendDmMessageDraft(body: trimmed)),
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

final roomChatProvider = AsyncNotifierProvider.family<RoomChatNotifier,
    List<DmMessage>, MessageRoom>(RoomChatNotifier.new);
